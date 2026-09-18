import { TOTAL_NUMBERS, TICKET_PRICE } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { NumberWithOwner, RaffleStats, StudentProgress } from "@/lib/types";
import { progressPercent } from "@/lib/format";

const EMPTY_STATS: RaffleStats = {
  total: TOTAL_NUMBERS,
  sold: 0,
  available: TOTAL_NUMBERS,
  raised: 0,
};

export async function getRaffleStats(): Promise<RaffleStats> {
  if (!isSupabaseConfigured()) return EMPTY_STATS;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_raffle_stats");
    if (error || !data || typeof data !== "object") return EMPTY_STATS;

    const payload = data as {
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
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("numeros")
    .select("*")
    .eq("aluno_id", alunoId)
    .order("numero", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getStudentProgressList(): Promise<StudentProgress[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student_progress")
    .select("*")
    .order("nome", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    nome: row.nome,
    login: row.login,
    role: row.role,
    total: row.total,
    vendidos: row.vendidos,
    disponiveis: row.disponiveis,
    arrecadado: Number(row.arrecadado),
    percentual: progressPercent(row.vendidos, row.total || 15),
  }));
}

type NumeroQueryRow = {
  id: string;
  numero: number;
  aluno_id: string;
  status: "DISPONIVEL" | "PEGO";
  created_at: string;
  updated_at: string;
  profiles: { nome: string; login: string } | { nome: string; login: string }[] | null;
  registros:
    | {
        id: string;
        numero_id: string;
        aluno_id: string;
        nome_comprador: string;
        telefone: string;
        comprovante_url: string;
        valor: number;
        status: "PEGO" | "CANCELADO";
        created_at: string;
        updated_at: string;
      }
    | {
        id: string;
        numero_id: string;
        aluno_id: string;
        nome_comprador: string;
        telefone: string;
        comprovante_url: string;
        valor: number;
        status: "PEGO" | "CANCELADO";
        created_at: string;
        updated_at: string;
      }[]
    | null;
};

export async function getAllNumbersWithOwners(): Promise<NumberWithOwner[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("numeros")
    .select("*, profiles(nome, login), registros(*)")
    .order("numero", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as NumeroQueryRow[]).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const purchase = Array.isArray(row.registros) ? row.registros[0] : row.registros;
    return {
      id: row.id,
      numero: row.numero,
      aluno_id: row.aluno_id,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      aluno_nome: profile?.nome ?? "—",
      aluno_login: profile?.login ?? "",
      purchase: purchase
        ? {
            ...purchase,
            valor: Number(purchase.valor),
          }
        : null,
    };
  });
}

export async function getProfiles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("nome", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
