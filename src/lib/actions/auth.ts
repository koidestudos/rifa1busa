"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { loginToEmail } from "@/lib/auth-utils";
import { homePathForRole } from "@/lib/auth";
import { loginSchema, passwordChangeSchema } from "@/lib/validations";

export type ActionResult = { error: string } | { ok: true };

export async function loginAction(formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return {
      error: "O Supabase ainda não está configurado. Siga o README para ligar o projeto.",
    };
  }

  const parsed = loginSchema.safeParse({
    login: formData.get("login"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const email = loginToEmail(parsed.data.login);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Login ou senha inválidos. Confira seus dados e tente de novo." };
  }

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) {
    return { error: "Não foi possível validar a sessão. Tente novamente." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, must_change_password, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    return { error: "Esta conta está desativada. Fale com a organização da rifa." };
  }

  redirect(homePathForRole(profile.role, profile.must_change_password));
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function changePasswordAction(formData: FormData): Promise<ActionResult> {
  const parsed = passwordChangeSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) {
    return { error: "Sessão expirada. Entre novamente." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message ?? "Não foi possível alterar a senha." };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ must_change_password: false })
    .eq("id", userId);

  if (profileError) {
    return { error: "Senha alterada, mas não foi possível atualizar o perfil. Recarregue a página." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, must_change_password")
    .eq("id", userId)
    .maybeSingle();

  redirect(homePathForRole(profile?.role ?? "student", false));
}
