import { createHash } from "node:crypto";
import { SignJWT, importPKCS8 } from "jose";
import { getFirebaseProjectId } from "@/lib/firebase/env";

function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}`);
  }
  return value;
}

export function getServiceAccountPrivateKey() {
  return required("FIREBASE_ADMIN_PRIVATE_KEY").replace(/\\n/g, "\n");
}

export function getSessionSecret() {
  return new Uint8Array(createHash("sha256").update(getServiceAccountPrivateKey()).digest());
}

async function getGoogleAccessToken() {
  const clientEmail = required("FIREBASE_ADMIN_CLIENT_EMAIL");
  const privateKey = await importPKCS8(getServiceAccountPrivateKey(), "RS256");
  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({
    scope: [
      "https://www.googleapis.com/auth/identitytoolkit",
      "https://www.googleapis.com/auth/cloud-platform",
    ].join(" "),
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(clientEmail)
    .setSubject(clientEmail)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const payload = (await response.json()) as { access_token?: string; error?: string };
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error ?? "Não foi possível autenticar no Google.");
  }
  return payload.access_token;
}

async function updateAccount(body: Record<string, unknown>) {
  const projectId = getFirebaseProjectId();
  const token = await getGoogleAccessToken();
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:update`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) {
    throw new Error("Falha ao atualizar a conta no Firebase Auth.");
  }
}

export async function updateAuthPassword(uid: string, password: string) {
  await updateAccount({ localId: uid, password });
}

export async function setAuthRoleClaim(uid: string, role: string) {
  await updateAccount({
    localId: uid,
    customAttributes: JSON.stringify({ role }),
  });
}
