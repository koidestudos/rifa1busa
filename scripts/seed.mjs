#!/usr/bin/env node
/**
 * Cria os 29 alunos no Firebase Auth, os perfis no Firestore e os 435 números.
 * Uso: npm run seed
 *
 * Requer .env.local com:
 * FIREBASE_ADMIN_PROJECT_ID (ou NEXT_PUBLIC_FIREBASE_PROJECT_ID)
 * FIREBASE_ADMIN_CLIENT_EMAIL
 * FIREBASE_ADMIN_PRIVATE_KEY
 *
 * Senhas iniciais ficam SOMENTE neste script, nunca no frontend.
 * No primeiro login o aluno é obrigado a trocar a senha.
 */

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const AUTH_EMAIL_DOMAIN = "alunos.rifafeiradospaises.local";
const TOTAL_NUMBERS = 435;
const TICKET_PRICE = 5;

const STUDENTS = [
  { nome: "Ana Letícia Matos", login: "ana.leticia.matos", role: "student", start: 1, end: 15, password: "ALM#2026!01" },
  { nome: "Ana Letícia Reis", login: "ana.leticia.reis", role: "student", start: 16, end: 30, password: "ALR#2026!02" },
  { nome: "Ariadnny", login: "ariadnny", role: "student", start: 31, end: 45, password: "ARI#2026!03" },
  { nome: "Arthur Guilherme", login: "arthur.guilherme", role: "student", start: 46, end: 60, password: "ARG#2026!04" },
  { nome: "Dara Júlia", login: "dara.julia", role: "student", start: 61, end: 75, password: "DAR#2026!05" },
  { nome: "Davi Liev", login: "davi.liev", role: "student", start: 76, end: 90, password: "DAV#2026!06" },
  { nome: "Edmilson", login: "edmilson", role: "student", start: 91, end: 105, password: "EDM#2026!07" },
  { nome: "Euller Pedro", login: "euller.pedro", role: "super_admin", start: 106, end: 120, password: "EUL#2026!08" },
  { nome: "Guilherme", login: "guilherme", role: "student", start: 121, end: 135, password: "GUI#2026!09" },
  { nome: "Gustavo Maximus", login: "gustavo.maximus", role: "student", start: 136, end: 150, password: "GUS#2026!10" },
  { nome: "João Artur", login: "joao.artur", role: "student", start: 151, end: 165, password: "JOA#2026!11" },
  { nome: "João Hellio", login: "joao.hellio", role: "student", start: 166, end: 180, password: "JOH#2026!12" },
  { nome: "Jorge", login: "jorge", role: "student", start: 181, end: 195, password: "JOR#2026!13" },
  { nome: "Jullya Isabelly", login: "jullya.isabelly", role: "student", start: 196, end: 210, password: "JUL#2026!14" },
  { nome: "Kauã Miranda", login: "kauã.miranda", role: "student", start: 211, end: 225, password: "KAU#2026!15" },
  { nome: "Luiz Gustavo", login: "luiz.gustavo", role: "student", start: 226, end: 240, password: "LUI#2026!16" },
  { nome: "Maria Clara", login: "maria.clara", role: "student", start: 241, end: 255, password: "MAR#2026!17" },
  { nome: "Maria Eduarda", login: "maria.eduarda", role: "student", start: 256, end: 270, password: "MED#2026!18" },
  { nome: "Maria Heloá", login: "maria.heloa", role: "student", start: 271, end: 285, password: "MHE#2026!19" },
  { nome: "Marinalva", login: "marinalva", role: "student", start: 286, end: 300, password: "MAR#2026!20" },
  { nome: "Maysa", login: "maysa", role: "student", start: 301, end: 315, password: "MAY#2026!21" },
  { nome: "Mikael", login: "mikael", role: "student", start: 316, end: 330, password: "MIK#2026!22" },
  { nome: "Sabrina", login: "sabrina", role: "student", start: 331, end: 345, password: "SAB#2026!23" },
  { nome: "Samira", login: "samira", role: "student", start: 346, end: 360, password: "SAM#2026!24" },
  { nome: "Sophia", login: "sophia", role: "student", start: 361, end: 375, password: "SOP#2026!25" },
  { nome: "Thomas", login: "thomas", role: "student", start: 376, end: 390, password: "THO#2026!26" },
  { nome: "Yago", login: "yago", role: "student", start: 391, end: 405, password: "YAG#2026!27" },
  { nome: "Yan Kalebe", login: "yan.kalebe", role: "student", start: 406, end: 420, password: "YAN#2026!28" },
  { nome: "Jorge Menor", login: "jorge.menor", role: "student", start: 421, end: 435, password: "JME#2026!29" },
];

function loadEnvFile() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function stripAccents(value) {
  return value.normalize("NFD").replace(/\p{M}/gu, "");
}

function loginToEmail(login) {
  return `${stripAccents(login.trim().toLowerCase())}@${AUTH_EMAIL_DOMAIN}`;
}

function assertSeedIntegrity() {
  if (STUDENTS.length !== 29) throw new Error("Devem existir 29 alunos");
  const numbers = new Set();
  for (const student of STUDENTS) {
    if (student.end - student.start + 1 !== 15) {
      throw new Error(`${student.nome} não tem 15 números`);
    }
    for (let n = student.start; n <= student.end; n += 1) {
      if (numbers.has(n)) throw new Error(`Número duplicado ${n}`);
      numbers.add(n);
    }
  }
  if (numbers.size !== 435) throw new Error("Devem existir 435 números");
  const euller = STUDENTS.find((s) => s.login === "euller.pedro");
  if (!euller || euller.role !== "super_admin") {
    throw new Error("Euller Pedro precisa ser SUPER ADMIN");
  }
}

async function findUserByEmail(auth, email) {
  try {
    return await auth.getUserByEmail(email);
  } catch (error) {
    if (error?.code === "auth/user-not-found") return null;
    throw error;
  }
}

function getAdminApp() {
  const existing = getApps()[0];
  if (existing) return existing;

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET ??
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    (projectId ? `${projectId}.firebasestorage.app` : undefined);

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Defina FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL e FIREBASE_ADMIN_PRIVATE_KEY no .env.local",
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    storageBucket,
  });
}

async function commitChunks(db, writers) {
  const CHUNK = 400;
  for (let i = 0; i < writers.length; i += CHUNK) {
    const batch = db.batch();
    for (const write of writers.slice(i, i + CHUNK)) write(batch);
    await batch.commit();
  }
}

async function main() {
  loadEnvFile();
  assertSeedIntegrity();

  const app = getAdminApp();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const resetPasswords = process.env.SEED_RESET_PASSWORDS === "1";
  const now = FieldValue.serverTimestamp();
  const rows = [];

  for (const student of STUDENTS) {
    const email = loginToEmail(student.login);
    let user = await findUserByEmail(auth, email);

    if (!user) {
      user = await auth.createUser({
        email,
        password: student.password,
        displayName: student.nome,
        emailVerified: true,
        disabled: false,
      });
      console.log(`Criado: ${student.login}`);
    } else {
      if (resetPasswords) {
        await auth.updateUser(user.uid, {
          password: student.password,
          emailVerified: true,
          disabled: false,
          displayName: student.nome,
        });
      }
      console.log(`Já existia: ${student.login}`);
    }

    await auth.setCustomUserClaims(user.uid, { role: student.role });
    rows.push({ ...student, id: user.uid, email });
  }

  const profileWrites = [];
  for (const student of rows) {
    const ref = db.collection("profiles").doc(student.id);
    const existing = await ref.get();
    profileWrites.push((batch) => {
      if (existing.exists) {
        batch.update(ref, {
          nome: student.nome,
          login: student.login,
          email: student.email,
          role: student.role,
          isActive: true,
          updatedAt: now,
        });
      } else {
        batch.set(ref, {
          nome: student.nome,
          login: student.login,
          email: student.email,
          role: student.role,
          mustChangePassword: true,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    });
  }
  await commitChunks(db, profileWrites);

  const existingNumbers = await db.collection("numeros").get();
  const existingIds = new Set(existingNumbers.docs.map((doc) => doc.id));
  const numberWrites = [];

  for (const student of rows) {
    for (let numero = student.start; numero <= student.end; numero += 1) {
      const id = String(numero);
      if (existingIds.has(id)) continue;
      const ref = db.collection("numeros").doc(id);
      numberWrites.push((batch) => {
        batch.set(ref, {
          numero,
          alunoId: student.id,
          alunoNome: student.nome,
          alunoLogin: student.login,
          status: "DISPONIVEL",
          createdAt: now,
          updatedAt: now,
        });
      });
    }
  }
  await commitChunks(db, numberWrites);

  const numerosSnap = await db.collection("numeros").get();
  if (numerosSnap.size !== TOTAL_NUMBERS) {
    throw new Error(`Esperado 435 números, encontrado ${numerosSnap.size}`);
  }

  const sold = numerosSnap.docs.filter((doc) => doc.data().status === "PEGO").length;
  await db
    .collection("stats")
    .doc("public")
    .set(
      {
        total: TOTAL_NUMBERS,
        sold,
        available: TOTAL_NUMBERS - sold,
        raised: sold * TICKET_PRICE,
        updatedAt: now,
      },
      { merge: true },
    );

  const euller = rows.find((row) => row.login === "euller.pedro");
  const eullerSnap = euller ? await db.collection("profiles").doc(euller.id).get() : null;
  if (!eullerSnap?.exists || eullerSnap.data()?.role !== "super_admin") {
    throw new Error("Euller Pedro não está como SUPER ADMIN");
  }

  console.log("Seed concluído: 29 alunos, 435 números, Euller Pedro = SUPER ADMIN.");
  console.log("No primeiro login cada aluno deve trocar a senha inicial.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
