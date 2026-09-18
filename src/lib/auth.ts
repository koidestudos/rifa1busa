import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Profile, UserRole } from "@/lib/types";
import { isStaff } from "@/lib/types";

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  return profile;
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
