"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { requireStaff, requireSuperAdmin } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { setAuthRoleClaim } from "@/lib/firebase/identity-admin";
import { raffleErrorMessage } from "@/lib/firebase/errors";
import { claimNumber, deleteRegistro, releaseNumber } from "@/lib/firebase/raffle";
import { deleteReceipt } from "@/lib/firebase/receipts";
import type { NumeroDoc, ProfileDoc } from "@/lib/firebase/mappers";
import { onlyDigits } from "@/lib/format";
import {
  canViewStudentInAdmin,
  deletePermissionsForAdmin,
  replaceAllowedStudentIds,
} from "@/lib/permissions";
import { buyerSchema } from "@/lib/validations";

type ActionResult = { ok: true } | { error: string };

function revalidateAdmin(alunoId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/numeros");
  revalidatePath("/admin/administradores");
  revalidatePath("/painel");
  revalidatePath("/");
  if (alunoId) revalidatePath(`/admin/alunos/${alunoId}`);
}

async function requireStaffNumberAccess(numeroId: string) {
  const staff = await requireStaff();
  const snap = await adminDb().collection("numeros").doc(numeroId).get();
  if (!snap.exists) return { ok: false as const, error: "Número não encontrado." };
  const numero = snap.data() as NumeroDoc;
  const allowed = await canViewStudentInAdmin(staff, numero.alunoId);
  if (!allowed && staff.id !== numero.alunoId) {
    return { ok: false as const, error: "Você não tem permissão para este número." };
  }
  return { ok: true as const, staff, numero };
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

  if (role === "student") {
    await deletePermissionsForAdmin(userId);
  }

  revalidateAdmin();
  return { ok: true };
}

export async function saveAdminPermissionsAction(
  adminId: string,
  studentIds: string[],
): Promise<ActionResult> {
  await requireSuperAdmin();

  const adminSnap = await adminDb().collection("profiles").doc(adminId).get();
  if (!adminSnap.exists) return { error: "Administrador não encontrado." };

  const admin = adminSnap.data() as ProfileDoc;
  if (admin.role === "super_admin") {
    return { error: "O SUPER ADMIN já tem acesso a todos os alunos." };
  }
  if (admin.role !== "admin") {
    return { error: "Só é possível definir permissões de administradores." };
  }

  const unique = [...new Set(studentIds.filter(Boolean))];
  if (unique.length > 0) {
    const profileSnaps = await adminDb().getAll(
      ...unique.map((id) => adminDb().collection("profiles").doc(id)),
    );
    if (profileSnaps.some((snap) => !snap.exists)) {
      return { error: "Um ou mais alunos selecionados não existem." };
    }
  }

  await replaceAllowedStudentIds(adminId, unique);
  revalidateAdmin();
  return { ok: true };
}

export async function releaseNumberAction(numeroId: string): Promise<ActionResult> {
  const access = await requireStaffNumberAccess(numeroId);
  if (!access.ok) return access;
  try {
    await releaseNumber(numeroId);
    await deleteReceipt(numeroId).catch(() => undefined);
    revalidateAdmin(access.numero.alunoId);
    return { ok: true };
  } catch (error) {
    return { error: raffleErrorMessage(error, "Não foi possível liberar o número.") };
  }
}

export async function markNumberTakenAction(
  numeroId: string,
  formData: FormData,
): Promise<ActionResult> {
  const access = await requireStaffNumberAccess(numeroId);
  if (!access.ok) return access;
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
      actorUid: access.staff.id,
      actorIsStaff: true,
      nomeComprador: parsed.data.nome,
      telefone: onlyDigits(parsed.data.telefone),
      comprovantePath: "",
    });
    revalidateAdmin(access.numero.alunoId);
    return { ok: true };
  } catch (error) {
    return { error: raffleErrorMessage(error, "Não foi possível marcar o número.") };
  }
}

export async function deleteRegistroAction(registroId: string): Promise<ActionResult> {
  const access = await requireStaffNumberAccess(registroId);
  if (!access.ok) return access;
  try {
    await deleteRegistro(registroId);
    await deleteReceipt(registroId).catch(() => undefined);
    revalidateAdmin(access.numero.alunoId);
    return { ok: true };
  } catch (error) {
    return { error: raffleErrorMessage(error, "Não foi possível excluir o registro.") };
  }
}
