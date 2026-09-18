import { AUTH_EMAIL_DOMAIN } from "@/lib/constants";

export function stripAccents(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "");
}

export function normalizeLogin(login: string) {
  return stripAccents(login.trim().toLowerCase());
}

export function loginToEmail(login: string) {
  return `${normalizeLogin(login)}@${AUTH_EMAIL_DOMAIN}`;
}
