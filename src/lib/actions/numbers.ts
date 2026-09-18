"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { STORAGE_BUCKET } from "@/lib/constants";
import { onlyDigits } from "@/lib/format";
import { isStaff } from "@/lib/types";
import { buyerSchema, validateReceiptFile } from "@/lib/validations";

export type RegisterResult =
  | { ok: true; message: string }
  | { error: string };

function receiptExtension(file: File) {
  const type = file.type.toLowerCase();
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  return "jpg";
}

export async function registerNumberAction(
  numeroId: string,
  formData: FormData,
): Promise<RegisterResult> {
  const parsed = buyerSchema.safeParse({
    nome: formData.get("nome"),
    telefone: formData.get("telefone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Preencha os dados do comprador." };
  }

  const file = formData.get("comprovante");
  const receipt = file instanceof File ? file : null;
  const fileError = validateReceiptFile(receipt);
  if (fileError || !receipt) {
    return { error: fileError ?? "Envie o comprovante de pagamento." };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) {
    return { error: "Sessão expirada. Entre novamente." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.is_active) {
    return { error: "Conta inativa." };
  }

  const { data: numero, error: numeroError } = await supabase
    .from("numeros")
    .select("id, numero, aluno_id, status")
    .eq("id", numeroId)
    .maybeSingle();

  if (numeroError || !numero) {
    return { error: "Número não encontrado." };
  }

  if (numero.aluno_id !== userId && !isStaff(profile.role)) {
    return { error: "Você só pode registrar os seus números." };
  }

  if (numero.status !== "DISPONIVEL") {
    return { error: "Este número já está PEGO." };
  }

  const path = `${userId}/${numero.id}/${crypto.randomUUID()}.${receiptExtension(receipt)}`;
  const bytes = new Uint8Array(await receipt.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, bytes, {
      contentType: receipt.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    return { error: "Não foi possível enviar o comprovante. Tente novamente." };
  }

  const { data, error } = await supabase.rpc("register_raffle_number", {
    p_numero_id: numero.id,
    p_nome_comprador: parsed.data.nome,
    p_telefone: onlyDigits(parsed.data.telefone),
    p_comprovante_path: path,
  });

  if (error) {
    await supabase.storage.from(STORAGE_BUCKET).remove([path]).catch(() => undefined);
    return { error: error.message ?? "Não foi possível registrar o número." };
  }

  const payload = data as { ok?: boolean; message?: string } | null;
  revalidatePath("/painel");
  revalidatePath("/admin");
  revalidatePath("/admin/numeros");
  revalidatePath("/");

  return {
    ok: true,
    message: payload?.message ?? "Número registrado com sucesso! 🇺🇸",
  };
}

export async function getSignedReceiptUrl(
  path: string,
): Promise<{ url: string } | { error: string }> {
  if (!path) return { error: "Comprovante indisponível." };

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) {
    return { error: "Sessão expirada." };
  }

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, 60);

  if (error || !data?.signedUrl) {
    return { error: "Você não tem permissão para ver este comprovante." };
  }

  return { url: data.signedUrl };
}
