import { FieldValue, type DocumentData } from "firebase-admin/firestore";
import { TICKET_PRICE, TOTAL_NUMBERS } from "@/lib/constants";
import { adminDb } from "@/lib/firebase/admin";
import { RaffleError } from "@/lib/firebase/errors";
import type { NumeroDoc } from "@/lib/firebase/mappers";

function numeroRef(numeroId: string) {
  return adminDb().collection("numeros").doc(numeroId);
}

function registroRef(numeroId: string) {
  return adminDb().collection("registros").doc(numeroId);
}

function statsRef() {
  return adminDb().collection("stats").doc("public");
}

function nextStats(soldDelta: number, current?: DocumentData) {
  const total = Number(current?.total ?? TOTAL_NUMBERS);
  const sold = Math.max(0, Number(current?.sold ?? 0) + soldDelta);
  return {
    total,
    sold,
    available: Math.max(0, total - sold),
    raised: sold * TICKET_PRICE,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

export type ClaimInput = {
  numeroId: string;
  actorUid: string;
  actorIsStaff: boolean;
  nomeComprador: string;
  telefone: string;
  comprovantePath: string;
};

export async function claimNumber(input: ClaimInput) {
  const db = adminDb();
  await db.runTransaction(async (tx) => {
    const nRef = numeroRef(input.numeroId);
    const rRef = registroRef(input.numeroId);
    const sRef = statsRef();
    const [numeroSnap, registroSnap, statsSnap] = await Promise.all([
      tx.get(nRef),
      tx.get(rRef),
      tx.get(sRef),
    ]);

    if (!numeroSnap.exists) {
      throw new RaffleError("not-found", "Número não encontrado.");
    }

    const numero = numeroSnap.data() as NumeroDoc;
    if (numero.alunoId !== input.actorUid && !input.actorIsStaff) {
      throw new RaffleError("forbidden", "Você só pode registrar os seus números.");
    }
    if (numero.status !== "DISPONIVEL" || registroSnap.exists) {
      throw new RaffleError("taken", "Este número já está PEGO.");
    }

    const now = FieldValue.serverTimestamp();
    tx.update(nRef, { status: "PEGO", updatedAt: now });
    tx.create(rRef, {
      numeroId: input.numeroId,
      alunoId: numero.alunoId,
      nomeComprador: input.nomeComprador,
      telefone: input.telefone,
      comprovantePath: input.comprovantePath,
      valor: TICKET_PRICE,
      status: "PEGO",
      createdAt: now,
      updatedAt: now,
    });
    tx.set(sRef, nextStats(1, statsSnap.data()), { merge: true });
  });
}

export async function releaseNumber(numeroId: string) {
  await adminDb().runTransaction(async (tx) => {
    const nRef = numeroRef(numeroId);
    const rRef = registroRef(numeroId);
    const sRef = statsRef();
    const [numeroSnap, registroSnap, statsSnap] = await Promise.all([
      tx.get(nRef),
      tx.get(rRef),
      tx.get(sRef),
    ]);

    if (!numeroSnap.exists) {
      throw new RaffleError("not-found", "Número não encontrado.");
    }

    const numero = numeroSnap.data() as NumeroDoc;
    const wasSold = numero.status === "PEGO" || registroSnap.exists;
    const now = FieldValue.serverTimestamp();

    tx.update(nRef, { status: "DISPONIVEL", updatedAt: now });
    if (registroSnap.exists) tx.delete(rRef);
    if (wasSold) {
      tx.set(sRef, nextStats(-1, statsSnap.data()), { merge: true });
    }
  });
}

export async function deleteRegistro(registroId: string) {
  return releaseNumber(registroId);
}
