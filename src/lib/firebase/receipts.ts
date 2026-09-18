import { FieldValue } from "firebase-admin/firestore";
import { MAX_RECEIPT_BYTES } from "@/lib/constants";
import { adminDb } from "@/lib/firebase/admin";

export const RECEIPT_MARKER = "firestore";
const CHUNK_BYTES = 700_000;

function comprovanteRef(numeroId: string) {
  return adminDb().collection("comprovantes").doc(numeroId);
}

function chunkBytes(bytes: Uint8Array) {
  const chunks: Buffer[] = [];
  for (let offset = 0; offset < bytes.byteLength; offset += CHUNK_BYTES) {
    chunks.push(Buffer.from(bytes.subarray(offset, offset + CHUNK_BYTES)));
  }
  return chunks;
}

function toBuffer(value: unknown) {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (value && typeof value === "object" && "toBuffer" in value) {
    return (value as { toBuffer: () => Buffer }).toBuffer();
  }
  throw new Error("Comprovante inválido.");
}

export async function saveReceipt(
  numeroId: string,
  alunoId: string,
  bytes: Uint8Array,
  contentType: string,
) {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_RECEIPT_BYTES) {
    throw new Error("Comprovante inválido.");
  }

  await deleteReceipt(numeroId);

  const chunks = chunkBytes(bytes);
  const metaRef = comprovanteRef(numeroId);
  const batch = adminDb().batch();

  batch.set(metaRef, {
    alunoId,
    contentType: contentType || "image/jpeg",
    size: bytes.byteLength,
    chunkCount: chunks.length,
    createdAt: FieldValue.serverTimestamp(),
  });

  chunks.forEach((chunk, index) => {
    batch.set(metaRef.collection("chunks").doc(String(index)), {
      index,
      data: chunk,
    });
  });

  await batch.commit();
}

export async function readReceipt(numeroId: string) {
  const metaRef = comprovanteRef(numeroId);
  const metaSnap = await metaRef.get();
  if (!metaSnap.exists) return null;

  const meta = metaSnap.data() as {
    alunoId: string;
    contentType?: string;
  };

  const chunksSnap = await metaRef.collection("chunks").orderBy("index", "asc").get();
  if (chunksSnap.empty) return null;

  const parts = chunksSnap.docs.map((doc) => toBuffer(doc.data().data));
  return {
    alunoId: meta.alunoId,
    contentType: meta.contentType || "image/jpeg",
    bytes: Buffer.concat(parts),
  };
}

export async function deleteReceipt(numeroId: string | null | undefined) {
  if (!numeroId) return;
  const metaRef = comprovanteRef(numeroId);
  const chunksSnap = await metaRef.collection("chunks").get();
  if (chunksSnap.empty && !(await metaRef.get()).exists) return;

  const batch = adminDb().batch();
  chunksSnap.docs.forEach((doc) => batch.delete(doc.ref));
  batch.delete(metaRef);
  await batch.commit();
}
