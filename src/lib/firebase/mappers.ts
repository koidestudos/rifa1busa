import type { Timestamp } from "firebase-admin/firestore";
import type {
  NumberStatus,
  Profile,
  Purchase,
  RaffleNumber,
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
  createdAt: Timestamp | Date | string;
  updatedAt: Timestamp | Date | string;
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
    created_at: toIso(data.createdAt),
    updated_at: toIso(data.updatedAt),
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
