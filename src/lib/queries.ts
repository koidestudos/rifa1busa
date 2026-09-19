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
import { filterByAllowedStudentIds } from "@/lib/permissions";
import type {
  NumberWithOwner,
  Profile,
  RaffleStats,
  StudentProgress,
} from "@/lib/types";
import { hasEnteredSite } from "@/lib/types";
import { progressPercent } from "@/lib/format";

const EMPTY_STATS: RaffleStats = {
  total: TOTAL_NUMBERS,
  sold: 0,
  available: TOTAL_NUMBERS,
  raised: 0,
};

function toNumberWithOwner(id: string, data: NumeroDoc, purchase: NumberWithOwner["purchase"]) {
  return {
    ...mapNumero(id, data),
    aluno_nome: data.alunoNome ?? "—",
    aluno_login: data.alunoLogin ?? "",
    purchase,
  } satisfies NumberWithOwner;
}

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

export function statsFromStudents(students: StudentProgress[]): RaffleStats {
  const total = students.reduce((sum, student) => sum + student.total, 0);
  const sold = students.reduce((sum, student) => sum + student.vendidos, 0);
  return {
    total,
    sold,
    available: Math.max(total - sold, 0),
    raised: students.reduce((sum, student) => sum + student.arrecadado, 0),
  };
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

export async function getStudentNumbersWithPurchases(
  alunoId: string,
): Promise<NumberWithOwner[]> {
  const numerosSnap = await adminDb()
    .collection("numeros")
    .where("alunoId", "==", alunoId)
    .get();

  const taken = numerosSnap.docs.filter(
    (doc) => (doc.data() as NumeroDoc).status === "PEGO",
  );
  const registroSnaps =
    taken.length > 0
      ? await adminDb().getAll(
          ...taken.map((doc) => adminDb().collection("registros").doc(doc.id)),
        )
      : [];

  const registros = new Map(
    registroSnaps
      .filter((snap) => snap.exists)
      .map((snap) => [snap.id, mapRegistro(snap.id, snap.data() as RegistroDoc)]),
  );

  return numerosSnap.docs
    .map((doc) => {
      const data = doc.data() as NumeroDoc;
      return toNumberWithOwner(doc.id, data, registros.get(doc.id) ?? null);
    })
    .sort((a, b) => a.numero - b.numero);
}

export async function getNumberWithOwner(
  numeroId: string,
): Promise<NumberWithOwner | null> {
  const numeroSnap = await adminDb().collection("numeros").doc(numeroId).get();
  if (!numeroSnap.exists) return null;

  const data = numeroSnap.data() as NumeroDoc;
  const registroSnap = await adminDb().collection("registros").doc(numeroId).get();
  return toNumberWithOwner(
    numeroSnap.id,
    data,
    registroSnap.exists
      ? mapRegistro(registroSnap.id, registroSnap.data() as RegistroDoc)
      : null,
  );
}

export async function getStudentProgressList(
  allowedStudentIds: string[] | null = null,
): Promise<StudentProgress[]> {
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

  const all = profilesSnap.docs
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
        has_logged_in: hasEnteredSite(profile),
        first_login_at: profile.first_login_at,
        last_login_at: profile.last_login_at,
      };
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  return filterByAllowedStudentIds(all, allowedStudentIds, (student) => student.id);
}

export async function getAllNumbersWithOwners(
  allowedStudentIds: string[] | null = null,
): Promise<NumberWithOwner[]> {
  const [numerosSnap, registrosSnap] = await Promise.all([
    adminDb().collection("numeros").orderBy("numero", "asc").get(),
    adminDb().collection("registros").get(),
  ]);

  const registros = new Map(
    registrosSnap.docs.map((doc) => [doc.id, mapRegistro(doc.id, doc.data() as RegistroDoc)]),
  );

  const all = numerosSnap.docs.map((doc) => {
    const data = doc.data() as NumeroDoc;
    return toNumberWithOwner(doc.id, data, registros.get(doc.id) ?? null);
  });

  return filterByAllowedStudentIds(all, allowedStudentIds, (item) => item.aluno_id);
}

export async function getProfiles() {
  const snap = await adminDb().collection("profiles").get();
  return snap.docs
    .map((doc) => mapProfile(doc.id, doc.data() as ProfileDoc))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const snap = await adminDb().collection("profiles").doc(id).get();
  if (!snap.exists) return null;
  return mapProfile(snap.id, snap.data() as ProfileDoc);
}
