import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, SESSION_MAX_MS, getFirebaseApiKey } from "@/lib/firebase/env";
import { adminAuth } from "@/lib/firebase/admin";

type PasswordSignInResponse = {
  idToken?: string;
  localId?: string;
  error?: { message?: string };
};

export async function signInWithPassword(email: string, password: string) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${getFirebaseApiKey()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );

  const payload = (await response.json()) as PasswordSignInResponse;
  if (!response.ok || !payload.idToken || !payload.localId) {
    const message = payload.error?.message ?? "";
    if (
      message.includes("INVALID") ||
      message.includes("EMAIL_NOT_FOUND") ||
      message.includes("USER_DISABLED")
    ) {
      throw new Error("invalid-credentials");
    }
    throw new Error("auth-failed");
  }

  return { idToken: payload.idToken, uid: payload.localId };
}

export async function createSessionCookie(idToken: string) {
  const session = await adminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_MS,
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_MS / 1000,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionUid() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!session) return null;

  try {
    const decoded = await adminAuth().verifySessionCookie(session, true);
    return decoded.uid;
  } catch {
    return null;
  }
}
