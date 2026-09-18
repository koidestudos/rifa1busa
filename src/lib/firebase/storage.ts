import { adminBucket } from "@/lib/firebase/admin";
import { STORAGE_PREFIX } from "@/lib/firebase/env";

export function receiptObjectPath(uid: string, numeroId: string, extension: string) {
  return `${STORAGE_PREFIX}/${uid}/${numeroId}/${crypto.randomUUID()}.${extension}`;
}

export async function uploadReceipt(path: string, bytes: Uint8Array, contentType: string) {
  const file = adminBucket().file(path);
  await file.save(Buffer.from(bytes), {
    resumable: false,
    contentType: contentType || "image/jpeg",
    metadata: {
      cacheControl: "private, max-age=0",
      contentType: contentType || "image/jpeg",
    },
  });
}

export async function deleteReceipt(path: string | null | undefined) {
  if (!path) return;
  await adminBucket().file(path).delete({ ignoreNotFound: true });
}

export async function signedReceiptUrl(path: string, expiresMs = 60_000) {
  const [url] = await adminBucket()
    .file(path)
    .getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + expiresMs,
    });
  return url;
}
