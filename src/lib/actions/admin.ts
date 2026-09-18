"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { requireStaff, requireSuperAdmin } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { setAuthRoleClaim } from "@/lib/firebase/identity-admin";
import { raffleErrorMessage } from "@/lib/firebase/errors";
import { claimNumber, deleteRegistro, releaseNumber } from "@/lib/firebase/raffle";
import { deleteReceipt } from "@/lib/firebase/receipts";
import type { ProfileDoc } from "@/lib/firebase/mappers";
import { onlyDigits } from "@/lib/format";
import { buyerSchema } from "@/lib/validations";

type ActionResult = { ok: true } | { error: string };

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/numeros");
  revalidatePath("/admin/administradores");
  revalidatePath("/painel");
  revalidatePath("/");
}

export async function setRoleAction(
  userId: string,
  role: "student" | "admin",
): Promise<ActionResult> {
  await requireSuperAdmin();

  if (role !== "student" && role !== "admin") {
    return { error: "Não é permitido criar outro SUPER ADMIN." };
  }

  const ref = adminDb().collection("profiles").doc(userId);
  const snap = await ref.get();
  if (!snap.exists) return { error: "Usuário não encontrado." };

  const target = snap.data() as ProfileDoc;
  if (target.role === "super_admin") {
    const supers = await adminDb().collection("profiles").where("role", "==", "super_admin").get();
    const activeSupers = supers.docs.filter((doc) => doc.data()?.isActive !== false);
    if (activeSupers.length <= 1) {
      return { error: "Não é possível remover o último SUPER ADMIN." };
    }
  }

  await ref.update({
    role,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await setAuthRoleClaim(userId, role);
  revalidateAdmin();
  return { ok: true };
}

export async function releaseNumberAction(numeroId: string): Promise<ActionResult> {
  await requireStaff();
  try {
    await releaseNumber(numeroId);
    await deleteReceipt(numeroId).catch(() => undefined);
    revalidateAdmin();
    return { ok: true };
  } catch (error) {
    return { error: raffleErrorMessage(error, "Não foi possível liberar o número.") };
  }
}

export async function markNumberTakenAction(
  numeroId: string,
  formData: FormData,
): Promise<ActionResult> {
  const staff = await requireStaff();
  const parsed = buyerSchema.safeParse({
    nome: formData.get("nome"),
    telefone: formData.get("telefone"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    await claimNumber({
      numeroId,
      actorUid: staff.id,
      actorIsStaff: true,
      nomeComprador: parsed.data.nome,
      telefone: onlyDigits(parsed.data.telefone),
      comprovantePath: "",
    });
    revalidateAdmin();
    return { ok: true };
  } catch (error) {
    return { error: raffleErrorMessage(error, "Não foi possível marcar o número.") };
  }
}

export async function deleteRegistroAction(registroId: string): Promise<ActionResult> {
  await requireStaff();
  try {
    await deleteRegistro(registroId);
    await deleteReceipt(registroId).catch(() => undefined);
    revalidateAdmin();
    return { ok: true };
  } catch (error) {
    return { error: raffleErrorMessage(error, "Não foi possível excluir o registro.") };
  }
}
