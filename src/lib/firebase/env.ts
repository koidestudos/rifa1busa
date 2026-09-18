export const SESSION_COOKIE_NAME = "rifa_session";
export const SESSION_MAX_MS = 1000 * 60 * 60 * 24 * 5;

export function getFirebaseProjectId() {
  return (
    process.env.FIREBASE_ADMIN_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    ""
  );
}

export function getFirebaseApiKey() {
  const key = process.env.FIREBASE_API_KEY ?? process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!key) {
    throw new Error("Configure FIREBASE_API_KEY ou NEXT_PUBLIC_FIREBASE_API_KEY.");
  }
  return key;
}

export function stripEnvQuotes(value: string) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export function normalizePrivateKey(value: string) {
  let key = stripEnvQuotes(value).replace(/\r/g, "");
  while (key.includes("\\n")) {
    key = key.replace(/\\n/g, "\n");
  }
  if (!key.includes("-----BEGIN PRIVATE KEY-----")) {
    throw new Error("FIREBASE_ADMIN_PRIVATE_KEY inválida. Cole o PEM, sem aspas extras.");
  }
  return key;
}

export function getFirebasePrivateKey() {
  const value = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!value) {
    throw new Error("Variável de ambiente ausente: FIREBASE_ADMIN_PRIVATE_KEY");
  }
  return normalizePrivateKey(value);
}

export function isFirebaseConfigured() {
  return Boolean(
    getFirebaseProjectId() &&
      (process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY) &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY,
  );
}
