import { redirect } from "next/navigation";
import { isFirebaseConfigured } from "@/lib/firebase/env";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUid } from "@/lib/firebase/session";
import { mapProfile, type ProfileDoc } from "@/lib/firebase/mappers";
import type { Profile, UserRole } from "@/lib/types";
import { isStaff } from "@/lib/types";

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!isFirebaseConfigured()) return null;

  try {
    const uid = await getSessionUid();
    if (!uid) return null;

    const snap = await adminDb().collection("profiles").doc(uid).get();
    if (!snap.exists) return null;

    return mapProfile(snap.id, snap.data() as ProfileDoc);
  } catch {
    return null;
  }
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.is_active) redirect("/login?error=inactive");
  return profile;
}

export async function requireStudentPanel() {
  const profile = await requireProfile();
  if (profile.must_change_password) redirect("/alterar-senha");
  return profile;
}

export async function requireStaff() {
  const profile = await requireProfile();
  if (profile.must_change_password) redirect("/alterar-senha");
  if (!isStaff(profile.role)) redirect("/painel");
  return profile;
}

export async function requireSuperAdmin() {
  const profile = await requireStaff();
  if (profile.role !== "super_admin") redirect("/admin");
  return profile;
}

export function homePathForRole(role: UserRole, mustChangePassword: boolean) {
  if (mustChangePassword) return "/alterar-senha";
  if (role === "student") return "/painel";
  return "/admin";
}
