import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getFirebasePrivateKey, getFirebaseProjectId, stripEnvQuotes } from "@/lib/firebase/env";

function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}`);
  }
  return stripEnvQuotes(value);
}

export function getAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const projectId = getFirebaseProjectId();
  const clientEmail = required("FIREBASE_ADMIN_CLIENT_EMAIL");
  const privateKey = getFirebasePrivateKey();

  if (!projectId) {
    throw new Error("Configure FIREBASE_ADMIN_PROJECT_ID ou NEXT_PUBLIC_FIREBASE_PROJECT_ID.");
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export function adminDb() {
  return getFirestore(getAdminApp());
}
