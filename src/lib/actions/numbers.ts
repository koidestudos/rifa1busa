"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth";
import { raffleErrorMessage } from "@/lib/firebase/errors";
import { claimNumber } from "@/lib/firebase/raffle";
import { STORAGE_PREFIX } from "@/lib/firebase/env";
import {
  deleteReceipt,
  receiptObjectPath,
  signedReceiptUrl,
  uploadReceipt,
} from "@/lib/firebase/storage";
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

  const profile = await getCurrentProfile();
  if (!profile) {
    return { error: "Sessão expirada. Entre novamente." };
  }
  if (!profile.is_active) {
    return { error: "Conta inativa." };
  }

  const path = receiptObjectPath(profile.id, numeroId, receiptExtension(receipt));
  const bytes = new Uint8Array(await receipt.arrayBuffer());

  try {
    await uploadReceipt(path, bytes, receipt.type || "image/jpeg");
  } catch {
    return { error: "Não foi possível enviar o comprovante. Tente novamente." };
  }

  try {
    await claimNumber({
      numeroId,
      actorUid: profile.id,
      actorIsStaff: isStaff(profile.role),
      nomeComprador: parsed.data.nome,
      telefone: onlyDigits(parsed.data.telefone),
      comprovantePath: path,
    });
  } catch (error) {
    await deleteReceipt(path).catch(() => undefined);
    return { error: raffleErrorMessage(error, "Não foi possível registrar o número.") };
  }

  revalidatePath("/painel");
  revalidatePath("/admin");
  revalidatePath("/admin/numeros");
  revalidatePath("/");

  return {
    ok: true,
    message: "Número registrado com sucesso! 🇺🇸",
  };
}

export async function getSignedReceiptUrl(
  path: string,
): Promise<{ url: string } | { error: string }> {
  if (!path) return { error: "Comprovante indisponível." };
  if (path.includes("..") || path.startsWith("/")) {
    return { error: "Comprovante indisponível." };
  }

  const profile = await getCurrentProfile();
  if (!profile) return { error: "Sessão expirada." };

  const ownerPrefix = `${STORAGE_PREFIX}/${profile.id}/`;
  const canRead = isStaff(profile.role) || path.startsWith(ownerPrefix);
  if (!canRead) {
    return { error: "Você não tem permissão para ver este comprovante." };
  }

  try {
    const url = await signedReceiptUrl(path);
    return { url };
  } catch {
    return { error: "Você não tem permissão para ver este comprovante." };
  }
}
