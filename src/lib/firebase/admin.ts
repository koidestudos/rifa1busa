import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getFirebaseProjectId } from "@/lib/firebase/env";

function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}`);
  }
  return value;
}

export function getAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const projectId = getFirebaseProjectId();
  const clientEmail = required("FIREBASE_ADMIN_CLIENT_EMAIL");
  const privateKey = required("FIREBASE_ADMIN_PRIVATE_KEY").replace(/\\n/g, "\n");
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET ??
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    (projectId ? `${projectId}.firebasestorage.app` : undefined);

  if (!projectId) {
    throw new Error("Configure FIREBASE_ADMIN_PROJECT_ID ou NEXT_PUBLIC_FIREBASE_PROJECT_ID.");
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    storageBucket,
  });
}

export function adminAuth() {
  return getAuth(getAdminApp());
}

export function adminDb() {
  return getFirestore(getAdminApp());
}

export function adminBucket() {
  return getStorage(getAdminApp()).bucket();
}
