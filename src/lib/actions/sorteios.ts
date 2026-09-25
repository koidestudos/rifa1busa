"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth";
import { raffleErrorMessage } from "@/lib/firebase/errors";
import {
  clearSorteioHistory,
  listRoletaNumbers,
  listSorteios,
  performDraw,
  resetSorteios,
} from "@/lib/firebase/sorteios";
import { isStaff, isSuperAdmin } from "@/lib/types";
import type { RoletaNumber, SorteioRecord } from "@/lib/types";

export type RoletaSnapshot = {
  numbers: RoletaNumber[];
  history: SorteioRecord[];
};

export type DrawResult =
  | { ok: true; sorteio: SorteioRecord; numbers: RoletaNumber[]; history: SorteioRecord[] }
  | { error: string };

export type SnapshotResult =
  | ({ ok: true } & RoletaSnapshot)
  | { error: string };

function revalidateRoleta() {
  revalidatePath("/admin/roleta");
  revalidatePath("/admin");
}

async function requireStaffActor() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return { ok: false as const, error: "Sessão expirada. Entre novamente." };
  }
  if (!profile.is_active) {
    return { ok: false as const, error: "Conta inativa." };
  }
  if (profile.must_change_password) {
    return { ok: false as const, error: "Troque sua senha antes de sortear." };
  }
  if (!isStaff(profile.role)) {
    return { ok: false as const, error: "Apenas administradores podem usar a roleta." };
  }
  return { ok: true as const, profile };
}

async function snapshot(): Promise<RoletaSnapshot> {
  const [numbers, history] = await Promise.all([listRoletaNumbers(), listSorteios()]);
  return { numbers, history };
}

export async function getRoletaSnapshotAction(): Promise<SnapshotResult> {
  const access = await requireStaffActor();
  if (!access.ok) return access;
  try {
    const data = await snapshot();
    return { ok: true, ...data };
  } catch (error) {
    return { error: raffleErrorMessage(error, "Não foi possível carregar a roleta.") };
  }
}

export async function drawSorteioAction(input: {
  soldOnly: boolean;
  prizePlace: number;
  testMode: boolean;
}): Promise<DrawResult> {
  const access = await requireStaffActor();
  if (!access.ok) return access;

  const soldOnly = input.soldOnly !== false;
  const prizePlace = Number(input.prizePlace);
  const testMode = input.testMode === true;

  try {
    const sorteio = await performDraw({
      soldOnly,
      prizePlace,
      testMode,
      actorUid: access.profile.id,
      actorNome: access.profile.nome,
    });
    const data = await snapshot();
    revalidateRoleta();
    return { ok: true, sorteio, ...data };
  } catch (error) {
    return { error: raffleErrorMessage(error, "Não foi possível realizar o sorteio.") };
  }
}

export async function clearSorteioHistoryAction(): Promise<SnapshotResult> {
  const access = await requireStaffActor();
  if (!access.ok) return access;
  if (!isSuperAdmin(access.profile.role) && access.profile.role !== "admin") {
    return { error: "Apenas administradores podem apagar o histórico." };
  }

  try {
    await clearSorteioHistory();
    const data = await snapshot();
    revalidateRoleta();
    return { ok: true, ...data };
  } catch (error) {
    return { error: raffleErrorMessage(error, "Não foi possível apagar o histórico.") };
  }
}

export async function resetSorteiosAction(): Promise<SnapshotResult> {
  const access = await requireStaffActor();
  if (!access.ok) return access;
  if (!isSuperAdmin(access.profile.role)) {
    return { error: "Somente o SUPER ADMIN pode resetar os sorteios." };
  }

  try {
    await resetSorteios();
    const data = await snapshot();
    revalidateRoleta();
    return { ok: true, ...data };
  } catch (error) {
    return { error: raffleErrorMessage(error, "Não foi possível resetar os sorteios.") };
  }
}
