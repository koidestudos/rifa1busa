import { randomInt } from "node:crypto";
import { FieldValue, type DocumentData, type WriteBatch } from "firebase-admin/firestore";
import { PRIZES } from "@/lib/constants";
import { adminDb } from "@/lib/firebase/admin";
import { RaffleError } from "@/lib/firebase/errors";
import {
  mapRoletaNumber,
  mapSorteio,
  type NumeroDoc,
  type RegistroDoc,
  type SorteioDoc,
} from "@/lib/firebase/mappers";
import { DRAW_COOLDOWN_MS } from "@/lib/roleta";
import type { RoletaNumber, SorteioRecord } from "@/lib/types";

const SORTEIOS = "sorteios";
const META = "sorteio_meta";
const LOCK_ID = "lock";
const BATCH_LIMIT = 400;

export type DrawInput = {
  soldOnly: boolean;
  prizePlace: number;
  testMode: boolean;
  actorUid: string;
  actorNome: string;
};

function lockRef() {
  return adminDb().collection(META).doc(LOCK_ID);
}

function prizeOrThrow(place: number) {
  const prize = PRIZES.find((item) => item.place === place);
  if (!prize) {
    throw new RaffleError("invalid-prize", "Selecione um prêmio válido.");
  }
  return prize;
}

function isEligible(numero: NumeroDoc, registro: RegistroDoc | undefined, soldOnly: boolean) {
  if (Boolean(numero.sorteado)) return false;
  if (!soldOnly) return true;
  return numero.status === "PEGO" && registro?.status === "PEGO";
}

async function commitChunks(ops: Array<(batch: WriteBatch) => void>) {
  const db = adminDb();
  for (let index = 0; index < ops.length; index += BATCH_LIMIT) {
    const batch = db.batch();
    for (const op of ops.slice(index, index + BATCH_LIMIT)) op(batch);
    await batch.commit();
  }
}

export async function listSorteios(): Promise<SorteioRecord[]> {
  const snap = await adminDb().collection(SORTEIOS).orderBy("createdAtMs", "desc").get();
  return snap.docs.map((doc) => mapSorteio(doc.id, doc.data() as SorteioDoc));
}

export async function listRoletaNumbers(): Promise<RoletaNumber[]> {
  const [numerosSnap, registrosSnap] = await Promise.all([
    adminDb().collection("numeros").orderBy("numero", "asc").get(),
    adminDb().collection("registros").get(),
  ]);

  const registros = new Map(
    registrosSnap.docs.map((doc) => [doc.id, doc.data() as RegistroDoc]),
  );

  return numerosSnap.docs.map((doc) => {
    const data = doc.data() as NumeroDoc;
    const registro = registros.get(doc.id);
    const comprador =
      registro?.status === "PEGO" ? registro.nomeComprador : null;
    return mapRoletaNumber(doc.id, data, comprador);
  });
}

export async function performDraw(input: DrawInput): Promise<SorteioRecord> {
  const prize = prizeOrThrow(input.prizePlace);
  const db = adminDb();

  const [numerosSnap, registrosSnap] = await Promise.all([
    db.collection("numeros").get(),
    db.collection("registros").get(),
  ]);

  const registros = new Map(
    registrosSnap.docs.map((doc) => [doc.id, doc.data() as RegistroDoc]),
  );

  const eligible = numerosSnap.docs.filter((doc) => {
    const numero = doc.data() as NumeroDoc;
    return isEligible(numero, registros.get(doc.id), input.soldOnly);
  });

  if (eligible.length === 0) {
    throw new RaffleError(
      "empty",
      input.soldOnly
        ? "Não há números PEGO disponíveis para sortear."
        : "Não há números disponíveis para sortear.",
    );
  }

  const skipped = new Set<string>();
  let lastError: unknown;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const remaining = numerosSnap.docs.filter((doc) => {
      if (skipped.has(doc.id)) return false;
      const numero = doc.data() as NumeroDoc;
      return isEligible(numero, registros.get(doc.id), input.soldOnly);
    });
    if (remaining.length === 0) {
      throw new RaffleError(
        "empty",
        input.soldOnly
          ? "Não há números PEGO disponíveis para sortear."
          : "Não há números disponíveis para sortear.",
      );
    }
    const pick = remaining[randomInt(remaining.length)];
    if (!pick) {
      throw new RaffleError("empty", "Não há números disponíveis para sortear.");
    }

    try {
      return await db.runTransaction(async (tx) => {
        const lRef = lockRef();
        const nRef = pick.ref;
        const rRef = db.collection("registros").doc(pick.id);
        const sRef = db.collection(SORTEIOS).doc();

        const [lockSnap, numeroSnap, registroSnap] = await Promise.all([
          tx.get(lRef),
          tx.get(nRef),
          tx.get(rRef),
        ]);

        const lock = (lockSnap.data() ?? {}) as DocumentData;
        const lastDrawAtMs = Number(lock.lastDrawAtMs ?? 0);
        if (lastDrawAtMs > 0 && Date.now() - lastDrawAtMs < DRAW_COOLDOWN_MS) {
          throw new RaffleError(
            "busy",
            "Já existe um sorteio em andamento. Aguarde alguns segundos.",
          );
        }

        if (!numeroSnap.exists) {
          throw new RaffleError("not-found", "Número não encontrado.");
        }

        const numero = numeroSnap.data() as NumeroDoc;
        const registro = registroSnap.exists
          ? (registroSnap.data() as RegistroDoc)
          : undefined;

        if (!isEligible(numero, registro, input.soldOnly)) {
          throw new RaffleError("conflict", "Este número acabou de sair do sorteio.");
        }

        const nowMs = Date.now();
        const now = FieldValue.serverTimestamp();
        const compradorNome =
          registro?.status === "PEGO" && registro.nomeComprador.trim()
            ? registro.nomeComprador.trim()
            : "Número não vendido";

        tx.update(nRef, { sorteado: true, updatedAt: now });
        tx.set(sRef, {
          numero: numero.numero,
          numeroId: pick.id,
          compradorNome,
          alunoId: numero.alunoId,
          premioPlace: prize.place,
          premioTitle: prize.title,
          premioDescription: prize.description,
          soldOnly: input.soldOnly,
          modoTeste: input.testMode,
          createdBy: input.actorUid,
          createdByNome: input.actorNome,
          createdAt: now,
          createdAtMs: nowMs,
        });
        tx.set(
          lRef,
          {
            lastDrawAtMs: nowMs,
            lastSorteioId: sRef.id,
            updatedAt: now,
          },
          { merge: true },
        );

        return mapSorteio(sRef.id, {
          numero: numero.numero,
          numeroId: pick.id,
          compradorNome,
          alunoId: numero.alunoId,
          premioPlace: prize.place,
          premioTitle: prize.title,
          premioDescription: prize.description,
          soldOnly: input.soldOnly,
          modoTeste: input.testMode,
          createdBy: input.actorUid,
          createdByNome: input.actorNome,
          createdAt: new Date(nowMs).toISOString(),
          createdAtMs: nowMs,
        });
      });
    } catch (error) {
      lastError = error;
      if (error instanceof RaffleError && error.code === "conflict") {
        skipped.add(pick.id);
        continue;
      }
      throw error;
    }
  }

  throw lastError instanceof RaffleError
    ? lastError
    : new RaffleError("conflict", "Não foi possível concluir o sorteio. Tente novamente.");
}

export async function clearSorteioHistory() {
  const snap = await adminDb().collection(SORTEIOS).get();
  await commitChunks(
    snap.docs.map((doc) => (batch) => {
      batch.delete(doc.ref);
    }),
  );
}

export async function resetSorteios() {
  const db = adminDb();
  const [sorteiosSnap, drawnSnap] = await Promise.all([
    db.collection(SORTEIOS).get(),
    db.collection("numeros").where("sorteado", "==", true).get(),
  ]);

  const now = FieldValue.serverTimestamp();
  await commitChunks([
    ...sorteiosSnap.docs.map((doc) => (batch: WriteBatch) => {
      batch.delete(doc.ref);
    }),
    ...drawnSnap.docs.map((doc) => (batch: WriteBatch) => {
      batch.update(doc.ref, { sorteado: false, updatedAt: now });
    }),
    (batch) => {
      batch.set(
        lockRef(),
        {
          lastDrawAtMs: 0,
          lastSorteioId: null,
          updatedAt: now,
        },
        { merge: true },
      );
    },
  ]);
}
