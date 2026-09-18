"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { STORAGE_BUCKET } from "@/lib/constants";
import { onlyDigits } from "@/lib/format";
import { buyerSchema } from "@/lib/validations";
import { requireStaff, requireSuperAdmin } from "@/lib/auth";

type ActionResult = { ok: true } | { error: string };

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/numeros");
  revalidatePath("/admin/administradores");
  revalidatePath("/painel");
  revalidatePath("/");
}

function rpcError(message: string | undefined, fallback: string): { error: string } {
  return { error: message?.trim() ? message : fallback };
}

export async function setRoleAction(
  userId: string,
  role: "student" | "admin",
): Promise<ActionResult> {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_role", {
    p_user_id: userId,
    p_role: role,
  });
  if (error) return rpcError(error.message, "Não foi possível alterar o cargo.");
  revalidateAdmin();
  return { ok: true };
}

export async function releaseNumberAction(numeroId: string): Promise<ActionResult> {
  await requireStaff();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_release_number", {
    p_numero_id: numeroId,
  });
  if (error) return rpcError(error.message, "Não foi possível liberar o número.");

  const path = (data as { comprovante_url?: string } | null)?.comprovante_url;
  if (path) {
    await supabase.storage.from(STORAGE_BUCKET).remove([path]).catch(() => undefined);
  }

  revalidateAdmin();
  return { ok: true };
}

export async function markNumberTakenAction(
  numeroId: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireStaff();
  const parsed = buyerSchema.safeParse({
    nome: formData.get("nome"),
    telefone: formData.get("telefone"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_mark_number_taken", {
    p_numero_id: numeroId,
    p_nome_comprador: parsed.data.nome,
    p_telefone: onlyDigits(parsed.data.telefone),
    p_comprovante_path: "",
  });
  if (error) return rpcError(error.message, "Não foi possível marcar o número.");
  revalidateAdmin();
  return { ok: true };
}

export async function deleteRegistroAction(registroId: string): Promise<ActionResult> {
  await requireStaff();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_delete_registro", {
    p_registro_id: registroId,
  });
  if (error) return rpcError(error.message, "Não foi possível excluir o registro.");

  const path = (data as { comprovante_url?: string } | null)?.comprovante_url;
  if (path) {
    await supabase.storage.from(STORAGE_BUCKET).remove([path]).catch(() => undefined);
  }

  revalidateAdmin();
  return { ok: true };
}
