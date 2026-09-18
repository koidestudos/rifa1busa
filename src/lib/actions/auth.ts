"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { FieldValue } from "firebase-admin/firestore";
import { isFirebaseConfigured } from "@/lib/firebase/env";
import { adminDb } from "@/lib/firebase/admin";
import { updateAuthPassword } from "@/lib/firebase/identity-admin";
import {
  clearSessionCookie,
  createSessionCookie,
  getSessionUid,
  signInWithPassword,
} from "@/lib/firebase/session";
import { loginToEmail } from "@/lib/auth-utils";
import { homePathForRole } from "@/lib/auth";
import { loginSchema, passwordChangeSchema } from "@/lib/validations";
import { mapProfile, type ProfileDoc } from "@/lib/firebase/mappers";
import type { Profile } from "@/lib/types";

export type ActionResult = { error: string } | { ok: true };

export async function loginAction(formData: FormData): Promise<ActionResult> {
  if (!isFirebaseConfigured()) {
    return {
      error: "O Firebase ainda não está configurado. Siga o README para ligar o projeto.",
    };
  }

  const parsed = loginSchema.safeParse({
    login: formData.get("login"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  let uid = "";
  try {
    const session = await signInWithPassword(
      loginToEmail(parsed.data.login),
      parsed.data.password,
    );
    uid = session.uid;
  } catch (error) {
    if (error instanceof Error && error.message === "invalid-credentials") {
      return { error: "Login ou senha inválidos. Confira seus dados e tente de novo." };
    }
    console.error("loginAction signin", error);
    return { error: "Não foi possível entrar agora. Tente novamente." };
  }

  let profile: Profile;
  try {
    const snap = await adminDb().collection("profiles").doc(uid).get();
    if (!snap.exists) {
      return { error: "Login ou senha inválidos. Confira seus dados e tente de novo." };
    }

    profile = mapProfile(snap.id, snap.data() as ProfileDoc);
    if (!profile.is_active) {
      return { error: "Esta conta está desativada. Fale com a organização da rifa." };
    }
  } catch (error) {
    unstable_rethrow(error);
    console.error("loginAction profile", error);
    return { error: "Não foi possível entrar agora. Tente novamente." };
  }

  await createSessionCookie(uid);
  redirect(homePathForRole(profile.role, profile.must_change_password));
}

export async function logoutAction() {
  await clearSessionCookie();
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

  const uid = await getSessionUid();
  if (!uid) {
    return { error: "Sessão expirada. Entre novamente." };
  }

  try {
    await updateAuthPassword(uid, parsed.data.password);
    await adminDb().collection("profiles").doc(uid).update({
      mustChangePassword: false,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    unstable_rethrow(error);
    return { error: "Não foi possível alterar a senha." };
  }

  revalidatePath("/painel");
  revalidatePath("/admin");
  redirect("/painel");
}
