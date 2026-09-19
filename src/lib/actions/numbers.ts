"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth";
import { raffleErrorMessage } from "@/lib/firebase/errors";
import { adminDb } from "@/lib/firebase/admin";
import { claimNumber, releaseNumber, updateRegistro } from "@/lib/firebase/raffle";
import { RECEIPT_MARKER, deleteReceipt, saveReceipt } from "@/lib/firebase/receipts";
import { onlyDigits } from "@/lib/format";
import { canAccessStudentRecords } from "@/lib/permissions";
import { getNumberWithOwner } from "@/lib/queries";
import type { NumeroDoc } from "@/lib/firebase/mappers";
import { isStaff } from "@/lib/types";
import { buyerSchema, validateReceiptFile } from "@/lib/validations";

export type RegisterResult =
  | { ok: true; message: string }
  | { error: string };

function revalidateNumberViews(alunoId?: string) {
  revalidatePath("/painel");
  revalidatePath("/admin");
  revalidatePath("/admin/numeros");
  revalidatePath("/");
  if (alunoId) revalidatePath(`/admin/alunos/${alunoId}`);
}

async function requireNumberAccess(numeroId: string) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return { ok: false as const, error: "Sessão expirada. Entre novamente." };
  }
  if (!profile.is_active) {
    return { ok: false as const, error: "Conta inativa." };
  }

  const numeroSnap = await adminDb().collection("numeros").doc(numeroId).get();
  if (!numeroSnap.exists) {
    return { ok: false as const, error: "Número não encontrado." };
  }

  const numero = numeroSnap.data() as NumeroDoc;
  const allowed = await canAccessStudentRecords(profile, numero.alunoId);
  if (!allowed) {
    return { ok: false as const, error: "Você não tem permissão para este número." };
  }

  return { ok: true as const, profile, numero };
}

function receiptFromForm(formData: FormData) {
  const file = formData.get("comprovante");
  return file instanceof File ? file : null;
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

  const receipt = receiptFromForm(formData);
  const fileError = validateReceiptFile(receipt);
  if (fileError || !receipt) {
    return { error: fileError ?? "Envie o comprovante de pagamento." };
  }

  const access = await requireNumberAccess(numeroId);
  if (!access.ok) return access;

  const bytes = new Uint8Array(await receipt.arrayBuffer());

  try {
    await saveReceipt(
      numeroId,
      access.numero.alunoId,
      bytes,
      receipt.type || "image/jpeg",
    );
  } catch {
    return { error: "Não foi possível enviar o comprovante. Tente novamente." };
  }

  try {
    await claimNumber({
      numeroId,
      actorUid: access.profile.id,
      actorIsStaff: isStaff(access.profile.role),
      nomeComprador: parsed.data.nome,
      telefone: onlyDigits(parsed.data.telefone),
      comprovantePath: RECEIPT_MARKER,
    });
  } catch (error) {
    await deleteReceipt(numeroId).catch(() => undefined);
    return { error: raffleErrorMessage(error, "Não foi possível registrar o número.") };
  }

  revalidateNumberViews(access.numero.alunoId);

  return {
    ok: true,
    message: "Número registrado com sucesso! 🇺🇸",
  };
}

export async function updateNumberAction(
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

  const access = await requireNumberAccess(numeroId);
  if (!access.ok) return access;

  const receipt = receiptFromForm(formData);
  const hasNewReceipt = Boolean(receipt && receipt.size > 0);
  if (hasNewReceipt) {
    const fileError = validateReceiptFile(receipt);
    if (fileError || !receipt) {
      return { error: fileError ?? "Envie um comprovante válido." };
    }
    try {
      const bytes = new Uint8Array(await receipt.arrayBuffer());
      await saveReceipt(
        numeroId,
        access.numero.alunoId,
        bytes,
        receipt.type || "image/jpeg",
      );
    } catch {
      return { error: "Não foi possível enviar o comprovante. Tente novamente." };
    }
  }

  try {
    await updateRegistro({
      numeroId,
      nomeComprador: parsed.data.nome,
      telefone: onlyDigits(parsed.data.telefone),
      comprovantePath: hasNewReceipt ? RECEIPT_MARKER : undefined,
    });
  } catch (error) {
    return { error: raffleErrorMessage(error, "Não foi possível salvar as alterações.") };
  }

  revalidateNumberViews(access.numero.alunoId);
  return { ok: true, message: "Alterações salvas com sucesso!" };
}

export async function deleteNumberRegistroAction(
  numeroId: string,
): Promise<RegisterResult> {
  const access = await requireNumberAccess(numeroId);
  if (!access.ok) return access;

  try {
    await releaseNumber(numeroId);
    await deleteReceipt(numeroId).catch(() => undefined);
  } catch (error) {
    return { error: raffleErrorMessage(error, "Não foi possível excluir o registro.") };
  }

  revalidateNumberViews(access.numero.alunoId);
  return { ok: true, message: "Registro excluído. O número voltou a ficar disponível." };
}

export async function getSignedReceiptUrl(
  numeroId: string,
): Promise<{ url: string } | { error: string }> {
  if (!numeroId) return { error: "Comprovante indisponível." };

  const access = await requireNumberAccess(numeroId);
  if (!access.ok) return { error: access.error };

  const detail = await getNumberWithOwner(numeroId);
  if (!detail?.purchase?.comprovante_url) {
    return { error: "Este registro não tem comprovante." };
  }

  return { url: `/api/comprovantes/${encodeURIComponent(numeroId)}` };
}
