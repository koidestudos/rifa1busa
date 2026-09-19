import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { Profile } from "@/lib/types";

export const PERMISSIONS_COLLECTION = "admin_student_permissions";

export function permissionDocId(adminId: string, studentId: string) {
  return `${adminId}_${studentId}`;
}

export function filterByAllowedStudentIds<T>(
  items: T[],
  allowedIds: string[] | null,
  getStudentId: (item: T) => string,
) {
  if (allowedIds === null) return items;
  const allowed = new Set(allowedIds);
  return items.filter((item) => allowed.has(getStudentId(item)));
}

export async function getAdminVisibleStudentIds(
  profile: Profile,
): Promise<string[] | null> {
  if (profile.role === "super_admin") return null;
  if (profile.role !== "admin") return [];

  const snap = await adminDb()
    .collection(PERMISSIONS_COLLECTION)
    .where("adminId", "==", profile.id)
    .get();

  return snap.docs.map((doc) => String(doc.data().studentId ?? ""));
}

export async function getPermissionsForAdmin(adminId: string) {
  const snap = await adminDb()
    .collection(PERMISSIONS_COLLECTION)
    .where("adminId", "==", adminId)
    .get();

  return snap.docs
    .map((doc) => String(doc.data().studentId ?? ""))
    .filter(Boolean)
    .sort();
}

export async function canAccessStudentRecords(
  profile: Profile,
  alunoId: string,
) {
  if (!profile.is_active) return false;
  if (profile.role === "super_admin") return true;
  if (profile.id === alunoId) return true;
  if (profile.role !== "admin") return false;

  const visible = await getAdminVisibleStudentIds(profile);
  return Boolean(visible?.includes(alunoId));
}

export async function canViewStudentInAdmin(
  profile: Profile,
  alunoId: string,
) {
  if (!profile.is_active) return false;
  if (profile.role === "super_admin") return true;
  if (profile.role !== "admin") return false;

  const visible = await getAdminVisibleStudentIds(profile);
  return Boolean(visible?.includes(alunoId));
}

export async function replaceAllowedStudentIds(
  adminId: string,
  studentIds: string[],
) {
  const unique = [...new Set(studentIds.filter(Boolean))];
  const col = adminDb().collection(PERMISSIONS_COLLECTION);
  const existing = await col.where("adminId", "==", adminId).get();
  const existingIds = new Set(
    existing.docs.map((doc) => String(doc.data().studentId ?? "")),
  );
  const next = new Set(unique);
  const batch = adminDb().batch();

  for (const doc of existing.docs) {
    const studentId = String(doc.data().studentId ?? "");
    if (!next.has(studentId)) batch.delete(doc.ref);
  }

  for (const studentId of unique) {
    if (existingIds.has(studentId)) continue;
    batch.set(col.doc(permissionDocId(adminId, studentId)), {
      adminId,
      studentId,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
}

export async function deletePermissionsForAdmin(adminId: string) {
  const snap = await adminDb()
    .collection(PERMISSIONS_COLLECTION)
    .where("adminId", "==", adminId)
    .get();
  if (snap.empty) return;

  const batch = adminDb().batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}
