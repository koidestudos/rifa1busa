import type { Timestamp } from "firebase-admin/firestore";
import type {
  NumberStatus,
  Profile,
  Purchase,
  RaffleNumber,
  RoletaNumber,
  SorteioRecord,
  UserRole,
} from "@/lib/types";

export type ProfileDoc = {
  nome: string;
  login: string;
  email: string;
  role: UserRole;
  mustChangePassword: boolean;
  isActive: boolean;
  firstLoginAt?: Timestamp | Date | string | null;
  lastLoginAt?: Timestamp | Date | string | null;
  createdAt: Timestamp | Date | string;
  updatedAt: Timestamp | Date | string;
};

export type NumeroDoc = {
  numero: number;
  alunoId: string;
  alunoNome: string;
  alunoLogin: string;
  status: NumberStatus;
  sorteado?: boolean;
  createdAt: Timestamp | Date | string;
  updatedAt: Timestamp | Date | string;
};

export type SorteioDoc = {
  numero: number;
  numeroId: string;
  compradorNome: string;
  alunoId: string;
  premioPlace: number;
  premioTitle: string;
  premioDescription: string;
  soldOnly: boolean;
  modoTeste: boolean;
  createdBy: string;
  createdByNome?: string;
  createdAt: Timestamp | Date | string;
  createdAtMs: number;
};

export type RegistroDoc = {
  numeroId: string;
  alunoId: string;
  nomeComprador: string;
  telefone: string;
  comprovantePath: string;
  valor: number;
  status: "PEGO" | "CANCELADO";
  createdAt: Timestamp | Date | string;
  updatedAt: Timestamp | Date | string;
};

function toIso(value: Timestamp | Date | string | undefined) {
  if (!value) return new Date().toISOString();
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  return new Date().toISOString();
}

function toIsoOrNull(value: Timestamp | Date | string | null | undefined) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  return null;
}

export function mapProfile(id: string, data: ProfileDoc): Profile {
  return {
    id,
    nome: data.nome,
    login: data.login,
    email: data.email,
    role: data.role,
    must_change_password: data.mustChangePassword,
    is_active: data.isActive,
    first_login_at: toIsoOrNull(data.firstLoginAt),
    last_login_at: toIsoOrNull(data.lastLoginAt),
    created_at: toIso(data.createdAt),
    updated_at: toIso(data.updatedAt),
  };
}

export function mapNumero(id: string, data: NumeroDoc): RaffleNumber {
  return {
    id,
    numero: data.numero,
    aluno_id: data.alunoId,
    status: data.status,
    sorteado: Boolean(data.sorteado),
    created_at: toIso(data.createdAt),
    updated_at: toIso(data.updatedAt),
  };
}

export function mapRoletaNumber(
  id: string,
  data: NumeroDoc,
  compradorNome: string | null,
): RoletaNumber {
  const purchaseName = compradorNome?.trim() || null;
  return {
    id,
    numero: data.numero,
    status: data.status,
    sorteado: Boolean(data.sorteado),
    comprador_nome: data.status === "PEGO" ? purchaseName : null,
  };
}

export function mapSorteio(id: string, data: SorteioDoc): SorteioRecord {
  return {
    id,
    numero: data.numero,
    numero_id: data.numeroId,
    comprador_nome: data.compradorNome,
    aluno_id: data.alunoId,
    premio_place: data.premioPlace,
    premio_title: data.premioTitle,
    premio_description: data.premioDescription,
    sold_only: Boolean(data.soldOnly),
    modo_teste: Boolean(data.modoTeste),
    created_at: toIso(data.createdAt),
    created_by: data.createdBy,
  };
}

export function mapRegistro(id: string, data: RegistroDoc): Purchase {
  return {
    id,
    numero_id: data.numeroId,
    aluno_id: data.alunoId,
    nome_comprador: data.nomeComprador,
    telefone: data.telefone,
    comprovante_url: data.comprovantePath,
    valor: Number(data.valor),
    status: data.status,
    created_at: toIso(data.createdAt),
    updated_at: toIso(data.updatedAt),
  };
}
