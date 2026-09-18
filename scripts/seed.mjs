#!/usr/bin/env node
/**
 * Cria os 29 alunos no Supabase Auth, os perfis e os 435 números.
 * Uso: npm run seed
 *
 * Requer .env.local com:
 * NEXT_PUBLIC_SUPABASE_URL
 * SUPABASE_SERVICE_ROLE_KEY
 *
 * Senhas iniciais ficam SOMENTE neste script, nunca no frontend.
 * No primeiro login o aluno é obrigado a trocar a senha.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const AUTH_EMAIL_DOMAIN = "alunos.rifafeiradospaises.local";

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

async function findUserIdByEmail(supabase, email) {
  let page = 1;
  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((user) => user.email === email);
    if (found) return found.id;
    if (data.users.length < 200) return null;
    page += 1;
  }
  return null;
}

async function main() {
  loadEnvFile();
  assertSeedIntegrity();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local");
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const resetPasswords = process.env.SEED_RESET_PASSWORDS === "1";
  const rows = [];

  for (const student of STUDENTS) {
    const email = loginToEmail(student.login);
    let userId = null;

    const created = await supabase.auth.admin.createUser({
      email,
      password: student.password,
      email_confirm: true,
      user_metadata: { nome: student.nome, login: student.login },
      app_metadata: { role: student.role },
    });

    if (created.error) {
      userId = await findUserIdByEmail(supabase, email);
      if (!userId) {
        throw new Error(`Falha ao criar ${student.login}: ${created.error.message}`);
      }
      if (resetPasswords) {
        const updated = await supabase.auth.admin.updateUserById(userId, {
          password: student.password,
          email_confirm: true,
          app_metadata: { role: student.role },
        });
        if (updated.error) throw updated.error;
      }
      console.log(`Já existia: ${student.login}`);
    } else {
      userId = created.data.user.id;
      console.log(`Criado: ${student.login}`);
    }

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (existingProfile) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          nome: student.nome,
          login: student.login,
          email,
          role: student.role,
          is_active: true,
        })
        .eq("id", userId);
      if (profileError) throw profileError;
    } else {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        nome: student.nome,
        login: student.login,
        email,
        role: student.role,
        must_change_password: true,
        is_active: true,
      });
      if (profileError) throw profileError;
    }

    rows.push({ ...student, id: userId });
  }

  const payload = rows.flatMap((student) => {
    const items = [];
    for (let numero = student.start; numero <= student.end; numero += 1) {
      items.push({
        numero,
        aluno_id: student.id,
        status: "DISPONIVEL",
      });
    }
    return items;
  });

  for (let i = 0; i < payload.length; i += 100) {
    const chunk = payload.slice(i, i + 100);
    const { error } = await supabase.from("numeros").upsert(chunk, {
      onConflict: "numero",
      ignoreDuplicates: true,
    });
    if (error) throw error;
  }

  const { count: numberCount, error: countError } = await supabase
    .from("numeros")
    .select("*", { count: "exact", head: true });
  if (countError) throw countError;
  if (numberCount !== 435) {
    throw new Error(`Esperado 435 números, encontrado ${numberCount}`);
  }

  const { data: euller, error: eullerError } = await supabase
    .from("profiles")
    .select("nome, role")
    .eq("login", "euller.pedro")
    .maybeSingle();
  if (eullerError) throw eullerError;
  if (!euller || euller.role !== "super_admin") {
    throw new Error("Euller Pedro não está como SUPER ADMIN");
  }

  console.log("Seed concluído: 29 alunos, 435 números, Euller Pedro = SUPER ADMIN.");
  console.log("No primeiro login cada aluno deve trocar a senha inicial.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
