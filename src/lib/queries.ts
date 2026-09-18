import { TOTAL_NUMBERS, TICKET_PRICE, NUMBERS_PER_STUDENT } from "@/lib/constants";
import { isFirebaseConfigured } from "@/lib/firebase/env";
import { adminDb } from "@/lib/firebase/admin";
import {
  mapNumero,
  mapProfile,
  mapRegistro,
  type NumeroDoc,
  type ProfileDoc,
  type RegistroDoc,
} from "@/lib/firebase/mappers";
import type { NumberWithOwner, RaffleStats, StudentProgress } from "@/lib/types";
import { progressPercent } from "@/lib/format";

const EMPTY_STATS: RaffleStats = {
  total: TOTAL_NUMBERS,
  sold: 0,
  available: TOTAL_NUMBERS,
  raised: 0,
};

export async function getRaffleStats(): Promise<RaffleStats> {
  if (!isFirebaseConfigured()) return EMPTY_STATS;

  try {
    const snap = await adminDb().collection("stats").doc("public").get();
    if (!snap.exists) return EMPTY_STATS;

    const payload = snap.data() as {
      total?: number;
      sold?: number;
      available?: number;
      raised?: number;
    };

    const total = Number(payload.total ?? TOTAL_NUMBERS);
    const sold = Number(payload.sold ?? 0);
    const available = Number(payload.available ?? Math.max(total - sold, 0));
    const raised = Number(payload.raised ?? sold * TICKET_PRICE);

    return { total, sold, available, raised };
  } catch {
    return EMPTY_STATS;
  }
}

export async function getStudentNumbers(alunoId: string) {
  const snap = await adminDb()
    .collection("numeros")
    .where("alunoId", "==", alunoId)
    .get();

  return snap.docs
    .map((doc) => mapNumero(doc.id, doc.data() as NumeroDoc))
    .sort((a, b) => a.numero - b.numero);
}

export async function getStudentProgressList(): Promise<StudentProgress[]> {
  const [profilesSnap, numerosSnap] = await Promise.all([
    adminDb().collection("profiles").get(),
    adminDb().collection("numeros").get(),
  ]);

  const soldByAluno = new Map<string, { total: number; vendidos: number }>();
  for (const doc of numerosSnap.docs) {
    const data = doc.data() as NumeroDoc;
    const current = soldByAluno.get(data.alunoId) ?? { total: 0, vendidos: 0 };
    current.total += 1;
    if (data.status === "PEGO") current.vendidos += 1;
    soldByAluno.set(data.alunoId, current);
  }

  return profilesSnap.docs
    .map((doc) => {
      const profile = mapProfile(doc.id, doc.data() as ProfileDoc);
      const counts = soldByAluno.get(profile.id) ?? {
        total: NUMBERS_PER_STUDENT,
        vendidos: 0,
      };
      const vendidos = counts.vendidos;
      const total = counts.total || NUMBERS_PER_STUDENT;
      return {
        id: profile.id,
        nome: profile.nome,
        login: profile.login,
        role: profile.role,
        total,
        vendidos,
        disponiveis: Math.max(total - vendidos, 0),
        arrecadado: vendidos * TICKET_PRICE,
        percentual: progressPercent(vendidos, total),
      };
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export async function getAllNumbersWithOwners(): Promise<NumberWithOwner[]> {
  const [numerosSnap, registrosSnap] = await Promise.all([
    adminDb().collection("numeros").orderBy("numero", "asc").get(),
    adminDb().collection("registros").get(),
  ]);

  const registros = new Map(
    registrosSnap.docs.map((doc) => [doc.id, mapRegistro(doc.id, doc.data() as RegistroDoc)]),
  );

  return numerosSnap.docs.map((doc) => {
    const data = doc.data() as NumeroDoc;
    const numero = mapNumero(doc.id, data);
    return {
      ...numero,
      aluno_nome: data.alunoNome ?? "—",
      aluno_login: data.alunoLogin ?? "",
      purchase: registros.get(doc.id) ?? null,
    };
  });
}

export async function getProfiles() {
  const snap = await adminDb().collection("profiles").get();
  return snap.docs
    .map((doc) => mapProfile(doc.id, doc.data() as ProfileDoc))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
