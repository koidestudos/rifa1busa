export type UserRole = "student" | "admin" | "super_admin";
export type NumberStatus = "DISPONIVEL" | "PEGO";
export type PurchaseStatus = "PEGO" | "CANCELADO";

export type Profile = {
  id: string;
  nome: string;
  login: string;
  email: string;
  role: UserRole;
  must_change_password: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type RaffleNumber = {
  id: string;
  numero: number;
  aluno_id: string;
  status: NumberStatus;
  created_at: string;
  updated_at: string;
};

export type Purchase = {
  id: string;
  numero_id: string;
  aluno_id: string;
  nome_comprador: string;
  telefone: string;
  comprovante_url: string;
  valor: number;
  status: PurchaseStatus;
  created_at: string;
  updated_at: string;
};

export type NumberWithOwner = RaffleNumber & {
  aluno_nome: string;
  aluno_login: string;
  purchase: Purchase | null;
};

export type StudentProgress = {
  id: string;
  nome: string;
  login: string;
  role: UserRole;
  total: number;
  vendidos: number;
  disponiveis: number;
  arrecadado: number;
  percentual: number;
};

export type RaffleStats = {
  total: number;
  sold: number;
  available: number;
  raised: number;
};

export function isStaff(role: UserRole | null | undefined) {
  return role === "admin" || role === "super_admin";
}

export function roleLabel(role: UserRole) {
  if (role === "super_admin") return "SUPER ADMIN";
  if (role === "admin") return "ADMIN";
  return "ALUNO";
}
