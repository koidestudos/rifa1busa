export const SESSION_COOKIE_NAME = "rifa_session";
export const SESSION_MAX_MS = 1000 * 60 * 60 * 24 * 5;

export function getFirebaseProjectId() {
  return (
    process.env.FIREBASE_ADMIN_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    ""
  );
}

export function getFirebaseApiKey() {
  const key = process.env.FIREBASE_API_KEY ?? process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!key) {
    throw new Error("Configure FIREBASE_API_KEY ou NEXT_PUBLIC_FIREBASE_API_KEY.");
  }
  return key;
}

export function stripEnvQuotes(value: string) {
  let trimmed = value.trim();
  if (trimmed.startsWith("\u201c") && trimmed.endsWith("\u201d")) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function unescapeNewlines(value: string) {
  let key = value.replace(/\r/g, "");
  while (key.includes("\\\\n")) {
    key = key.replace(/\\\\n/g, "\\n");
  }
  while (key.includes("\\n")) {
    key = key.replace(/\\n/g, "\n");
  }
  return key;
}

function rebuildPem(value: string) {
  const match = value.match(
    /-----BEGIN ([A-Z0-9 ]+)-----([\s\S]*?)-----END \1-----/,
  );
  if (!match) return value;
  const type = match[1];
  const body = match[2].replace(/[^A-Za-z0-9+/=]/g, "");
  if (!body) return value;
  const lines = body.match(/.{1,64}/g) ?? [body];
  return `-----BEGIN ${type}-----\n${lines.join("\n")}\n-----END ${type}-----\n`;
}

export function normalizePrivateKey(value: string) {
  let key = stripEnvQuotes(value);

  if (key.startsWith("{")) {
    try {
      const parsed = JSON.parse(key) as { private_key?: string };
      if (parsed.private_key) key = parsed.private_key;
    } catch {
      // keep original string
    }
  }

  if (!key.includes("BEGIN") && /^[A-Za-z0-9+/=\s]+$/.test(key)) {
    try {
      key = Buffer.from(key, "base64").toString("utf8");
    } catch {
      // keep original string
    }
  }

  key = rebuildPem(unescapeNewlines(stripEnvQuotes(key)));
  if (!key.includes("-----BEGIN PRIVATE KEY-----")) {
    throw new Error("FIREBASE_ADMIN_PRIVATE_KEY inválida. Cole o PEM, sem aspas extras.");
  }
  return key;
}

export function getFirebasePrivateKey() {
  const value = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!value) {
    throw new Error("Variável de ambiente ausente: FIREBASE_ADMIN_PRIVATE_KEY");
  }
  return normalizePrivateKey(value);
}

export function isFirebaseConfigured() {
  return Boolean(
    getFirebaseProjectId() &&
      (process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY) &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY,
  );
}
