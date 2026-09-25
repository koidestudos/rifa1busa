import { PRIZE_BADGES, PRIZES } from "@/lib/constants";
import type { RoletaNumber } from "@/lib/types";

export const ROLETA_STORAGE_KEY = "rifa-roleta-settings-v1";
export const DRAW_COOLDOWN_MS = 4000;
export const DEFAULT_SPIN_MS = 5500;

export const ROLETA_BACKGROUNDS = [
  {
    id: "green",
    label: "Verde",
    emoji: "🟢",
    solid: "#00B140",
    from: "#1cff73",
    to: "#067a38",
  },
  {
    id: "blue",
    label: "Azul",
    emoji: "🔵",
    solid: "#0A3161",
    from: "#2b7de0",
    to: "#061428",
  },
  {
    id: "purple",
    label: "Roxo",
    emoji: "🟣",
    solid: "#4c1d95",
    from: "#8b5cf6",
    to: "#2e1065",
  },
  {
    id: "red",
    label: "Vermelho",
    emoji: "🔴",
    solid: "#9b0826",
    from: "#ef4444",
    to: "#4a0412",
  },
  {
    id: "black",
    label: "Preto",
    emoji: "⚫",
    solid: "#0a0a0a",
    from: "#3f3f46",
    to: "#000000",
  },
  {
    id: "white",
    label: "Branco",
    emoji: "⚪",
    solid: "#f4f4f5",
    from: "#ffffff",
    to: "#d4d4d8",
  },
] as const;

export type RoletaBackgroundId = (typeof ROLETA_BACKGROUNDS)[number]["id"];

export type RoletaSettings = {
  background: RoletaBackgroundId;
  gradient: boolean;
  sound: boolean;
  confetti: boolean;
  durationMs: number;
  soldOnly: boolean;
  showHistory: boolean;
  broadcast: boolean;
  testMode: boolean;
  prizePlace: number;
};

export const DEFAULT_ROLETA_SETTINGS: RoletaSettings = {
  background: "blue",
  gradient: true,
  sound: true,
  confetti: true,
  durationMs: DEFAULT_SPIN_MS,
  soldOnly: true,
  showHistory: true,
  broadcast: false,
  testMode: false,
  prizePlace: 1,
};

export function isLightRoletaBackground(id: RoletaBackgroundId) {
  return id === "white";
}

export function roletaBackground(id: RoletaBackgroundId) {
  return ROLETA_BACKGROUNDS.find((item) => item.id === id) ?? ROLETA_BACKGROUNDS[1];
}

export function eligibleRoletaNumbers(numbers: RoletaNumber[], soldOnly: boolean) {
  return numbers.filter((item) => {
    if (item.sorteado) return false;
    if (soldOnly) return item.status === "PEGO" && Boolean(item.comprador_nome);
    return true;
  });
}

export function prizeMeta(place: number) {
  const prize = PRIZES.find((item) => item.place === place) ?? PRIZES[0];
  return {
    place: prize.place,
    title: prize.title,
    description: prize.description,
    badge: PRIZE_BADGES[prize.place] ?? "🏆",
  };
}

export function pointerIndex(rotationDeg: number, count: number) {
  if (count <= 0) return 0;
  const slice = 360 / count;
  const offset = ((-rotationDeg % 360) + 360) % 360;
  return Math.min(count - 1, Math.floor(offset / slice));
}

export function targetRotation(
  current: number,
  winnerIndex: number,
  count: number,
  extraSpins = 7,
) {
  if (count <= 0) return current;
  const slice = 360 / count;
  const wantedOffset = (winnerIndex + 0.5) * slice;
  const toNorm = (360 - (wantedOffset % 360)) % 360;
  const fromNorm = ((current % 360) + 360) % 360;
  let delta = toNorm - fromNorm;
  if (delta <= 0) delta += 360;
  return current + extraSpins * 360 + delta;
}

export function extraSpinsForDuration(durationMs: number) {
  if (durationMs >= 9000) return 9;
  if (durationMs >= 7000) return 8;
  if (durationMs >= 5000) return 7;
  return 6;
}

export function easeOutQuint(t: number) {
  const clamped = Math.min(1, Math.max(0, t));
  return 1 - (1 - clamped) ** 5;
}

export function parseRoletaSettings(raw: unknown): RoletaSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_ROLETA_SETTINGS;
  const data = raw as Record<string, unknown>;
  const background = ROLETA_BACKGROUNDS.some((item) => item.id === data.background)
    ? (data.background as RoletaBackgroundId)
    : DEFAULT_ROLETA_SETTINGS.background;
  const prizePlace = Number(data.prizePlace);
  const durationMs = Number(data.durationMs);

  return {
    background,
    gradient: data.gradient !== false,
    sound: data.sound !== false,
    confetti: data.confetti !== false,
    durationMs: [3500, 4500, 5500, 7000, 9000, 11000].includes(durationMs)
      ? durationMs
      : DEFAULT_SPIN_MS,
    soldOnly: data.soldOnly !== false,
    showHistory: data.showHistory !== false,
    broadcast: data.broadcast === true,
    testMode: data.testMode === true,
    prizePlace: PRIZES.some((prize) => prize.place === prizePlace) ? prizePlace : 1,
  };
}
