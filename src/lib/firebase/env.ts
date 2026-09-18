export const SESSION_COOKIE_NAME = "rifa_session";
export const SESSION_MAX_MS = 1000 * 60 * 60 * 24 * 5;
export const STORAGE_PREFIX = "payment-proofs";

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

export function isFirebaseConfigured() {
  return Boolean(
    getFirebaseProjectId() &&
      (process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY) &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY,
  );
}
