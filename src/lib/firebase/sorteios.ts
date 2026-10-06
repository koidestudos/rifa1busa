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
import { DRAW_COOLDOWN_MS, eliminatedOwnerIds, isOwnerBlocked } from "@/lib/roleta";
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

class StaleDrawError extends RaffleError {
  constructor(readonly alunoId: string) {
    super("conflict", "Este número acabou de sair do sorteio.");
  }
}

function eliminatedAlunoIds(docs: Array<{ data: () => NumeroDoc }>) {
  return eliminatedOwnerIds(
    docs.map((doc) => {
      const numero = doc.data();
      return { ownerId: numero.alunoId, drawn: Boolean(numero.sorteado) };
    }),
  );
}

function isEligible(
  numero: NumeroDoc,
  registro: RegistroDoc | undefined,
  soldOnly: boolean,
  eliminated: Set<string>,
) {
  if (isOwnerBlocked(numero.alunoId, Boolean(numero.sorteado), eliminated)) return false;
  if (!soldOnly) return true;
  return numero.status === "PEGO" && registro?.status === "PEGO";
}

function blockedNumbersFor(ownerId: string, docs: Array<{ data: () => NumeroDoc }>) {
  const numbers = docs
    .map((doc) => doc.data())
    .filter((numero) => numero.alunoId === ownerId)
    .map((numero) => numero.numero);
  return [...new Set(numbers)].sort((a, b) => a - b);
}

async function commitChunks(ops: Array<(batch: WriteBatch) => void>) {
  const db = adminDb();
  for (let index = 0; index < ops.length; index += BATCH_LIMIT) {
    const batch = db.batch();
    for (const op of ops.slice(index, index + BATCH_LIMIT)) op(batch);
    await batch.commit();
  }
}

function ownerDirectory(docs: Array<{ data: () => NumeroDoc }>) {
  const byOwner = new Map<string, { nome: string; numeros: number[] }>();
  for (const doc of docs) {
    const numero = doc.data();
    if (!numero.alunoId) continue;
    const current = byOwner.get(numero.alunoId) ?? { nome: "", numeros: [] };
    if (!current.nome && numero.alunoNome?.trim()) current.nome = numero.alunoNome.trim();
    current.numeros.push(numero.numero);
    byOwner.set(numero.alunoId, current);
  }
  for (const group of byOwner.values()) {
    group.numeros = [...new Set(group.numeros)].sort((a, b) => a - b);
  }
  return byOwner;
}

export async function listSorteios(): Promise<SorteioRecord[]> {
  const [snap, numerosSnap] = await Promise.all([
    adminDb().collection(SORTEIOS).orderBy("createdAtMs", "desc").get(),
    adminDb().collection("numeros").get(),
  ]);
  const owners = ownerDirectory(numerosSnap.docs.map((doc) => ({ data: () => doc.data() as NumeroDoc })));

  return snap.docs.map((doc) => {
    const data = doc.data() as SorteioDoc;
    const owner = owners.get(data.alunoId);
    return mapSorteio(doc.id, data, {
      alunoNome: owner?.nome,
      numerosBloqueados: owner?.numeros,
    });
  });
}

export async function listRoletaNumbers(): Promise<RoletaNumber[]> {
  const [numerosSnap, registrosSnap] = await Promise.all([
    adminDb().collection("numeros").orderBy("numero", "asc").get(),
    adminDb().collection("registros").get(),
  ]);

  const registros = new Map(
    registrosSnap.docs.map((doc) => [doc.id, doc.data() as RegistroDoc]),
  );
  const eliminated = eliminatedAlunoIds(
    numerosSnap.docs.map((doc) => ({ data: () => doc.data() as NumeroDoc })),
  );

  return numerosSnap.docs.map((doc) => {
    const data = doc.data() as NumeroDoc;
    const registro = registros.get(doc.id);
    const comprador =
      registro?.status === "PEGO" ? registro.nomeComprador : null;
    const bloqueado = isOwnerBlocked(data.alunoId, Boolean(data.sorteado), eliminated);
    return mapRoletaNumber(doc.id, data, comprador, bloqueado);
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
  const numeroDocs = numerosSnap.docs.map((doc) => ({ data: () => doc.data() as NumeroDoc }));
  const eliminated = eliminatedAlunoIds(numeroDocs);

  const eligible = numerosSnap.docs.filter((doc) => {
    const numero = doc.data() as NumeroDoc;
    return isEligible(numero, registros.get(doc.id), input.soldOnly, eliminated);
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
      return isEligible(numero, registros.get(doc.id), input.soldOnly, eliminated);
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

        if (numero.sorteado) {
          throw new StaleDrawError(numero.alunoId || "");
        }
        if (!isEligible(numero, registro, input.soldOnly, new Set())) {
          throw new RaffleError("conflict", "Este número acabou de sair do sorteio.");
        }

        let blockedNumbers = blockedNumbersFor(numero.alunoId, numeroDocs);
        if (numero.alunoId) {
          const siblingsSnap = await tx.get(
            db.collection("numeros").where("alunoId", "==", numero.alunoId),
          );
          const freshBlocked = siblingsSnap.docs
            .map((doc) => doc.data() as NumeroDoc)
            .map((row) => row.numero);
          if (freshBlocked.length > 0) {
            blockedNumbers = [...new Set(freshBlocked)].sort((a, b) => a - b);
          }
          const ownerAlreadyOut = siblingsSnap.docs.some((doc) =>
            Boolean((doc.data() as NumeroDoc).sorteado),
          );
          if (ownerAlreadyOut) {
            throw new StaleDrawError(numero.alunoId);
          }
        }
        if (!blockedNumbers.includes(numero.numero)) {
          blockedNumbers = [...blockedNumbers, numero.numero].sort((a, b) => a - b);
        }

        const alunoNome = numero.alunoNome?.trim() || "Responsável";
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
          alunoNome,
          numerosBloqueados: blockedNumbers,
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
          alunoNome,
          numerosBloqueados: blockedNumbers,
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
      if (error instanceof StaleDrawError) {
        for (const doc of numerosSnap.docs) {
          const data = doc.data() as NumeroDoc;
          if (doc.id === pick.id || (error.alunoId && data.alunoId === error.alunoId)) {
            skipped.add(doc.id);
          }
        }
        continue;
      }
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
  // Um aluno sai da roleta quando algum número dele fica `sorteado`.
  // Limpar essa marca devolve o aluno e todos os números dele, sem mexer em vendas.

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
