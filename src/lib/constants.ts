export const SITE_NAME = "RIFA FEIRA DOS PAÍSES 2026";
export const SITE_FLAG = "🇺🇸";
export const SITE_SUBTITLE =
  "Estados Unidos — Nossa turma na Feira dos Países 2026";

export const TICKET_PRICE = 5;
export const TOTAL_NUMBERS = 435;
export const NUMBERS_PER_STUDENT = 15;
export const STUDENT_COUNT = 29;
export const POTENTIAL_TOTAL = TOTAL_NUMBERS * TICKET_PRICE;

export const AUTH_EMAIL_DOMAIN = "alunos.rifafeiradospaises.local";

export const PIX_KEY =
  process.env.NEXT_PUBLIC_PIX_KEY ?? "pedroeuller367@gmail.com";

export const PIX_QR_IMAGE =
  process.env.NEXT_PUBLIC_PIX_QR_IMAGE?.trim() || "/pix-qr.png";

export const MAX_RECEIPT_BYTES = 8 * 1024 * 1024;
export const RECEIPT_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export const PRIZES = [
  {
    place: 1,
    emoji: "🥇",
    title: "1º Lugar",
    description: "2 vales de rodízio de pizza",
    accent: "gold",
  },
  {
    place: 2,
    emoji: "🥈",
    title: "2º Lugar",
    description: "Cesta de doces",
    accent: "silver",
  },
  {
    place: 3,
    emoji: "🥉",
    title: "3º Lugar",
    description: "Kit de cosméticos",
    accent: "bronze",
  },
  {
    place: 4,
    emoji: "🏆",
    title: "4º Lugar",
    description: "PIX de R$ 75,00",
    accent: "navy",
  },
  {
    place: 5,
    emoji: "💵",
    title: "5º Lugar",
    description: "PIX de R$ 50,00",
    accent: "red",
  },
] as const;

export const HOW_TO_STEPS = [
  "Faça login com o usuário da sua turma",
  "Escolha um número disponível",
  "Faça o PIX de R$ 5,00",
  "Envie o comprovante",
  "Seu número será registrado como PEGO",
] as const;
