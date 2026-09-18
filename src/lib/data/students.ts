export type SeedRole = "student" | "admin" | "super_admin";

export type StudentSeed = {
  nome: string;
  login: string;
  role: SeedRole;
  start: number;
  end: number;
};

export const STUDENT_SEEDS: StudentSeed[] = [
  { nome: "Ana Letícia Matos", login: "ana.leticia.matos", role: "student", start: 1, end: 15 },
  { nome: "Ana Letícia Reis", login: "ana.leticia.reis", role: "student", start: 16, end: 30 },
  { nome: "Ariadnny", login: "ariadnny", role: "student", start: 31, end: 45 },
  { nome: "Arthur Guilherme", login: "arthur.guilherme", role: "student", start: 46, end: 60 },
  { nome: "Dara Júlia", login: "dara.julia", role: "student", start: 61, end: 75 },
  { nome: "Davi Liev", login: "davi.liev", role: "student", start: 76, end: 90 },
  { nome: "Edmilson", login: "edmilson", role: "student", start: 91, end: 105 },
  { nome: "Euller Pedro", login: "euller.pedro", role: "super_admin", start: 106, end: 120 },
  { nome: "Guilherme", login: "guilherme", role: "student", start: 121, end: 135 },
  { nome: "Gustavo Maximus", login: "gustavo.maximus", role: "student", start: 136, end: 150 },
  { nome: "João Artur", login: "joao.artur", role: "student", start: 151, end: 165 },
  { nome: "João Hellio", login: "joao.hellio", role: "student", start: 166, end: 180 },
  { nome: "Jorge", login: "jorge", role: "student", start: 181, end: 195 },
  { nome: "Jullya Isabelly", login: "jullya.isabelly", role: "student", start: 196, end: 210 },
  { nome: "Kauã Miranda", login: "kauã.miranda", role: "student", start: 211, end: 225 },
  { nome: "Luiz Gustavo", login: "luiz.gustavo", role: "student", start: 226, end: 240 },
  { nome: "Maria Clara", login: "maria.clara", role: "student", start: 241, end: 255 },
  { nome: "Maria Eduarda", login: "maria.eduarda", role: "student", start: 256, end: 270 },
  { nome: "Maria Heloá", login: "maria.heloa", role: "student", start: 271, end: 285 },
  { nome: "Marinalva", login: "marinalva", role: "student", start: 286, end: 300 },
  { nome: "Maysa", login: "maysa", role: "student", start: 301, end: 315 },
  { nome: "Mikael", login: "mikael", role: "student", start: 316, end: 330 },
  { nome: "Sabrina", login: "sabrina", role: "student", start: 331, end: 345 },
  { nome: "Samira", login: "samira", role: "student", start: 346, end: 360 },
  { nome: "Sophia", login: "sophia", role: "student", start: 361, end: 375 },
  { nome: "Thomas", login: "thomas", role: "student", start: 376, end: 390 },
  { nome: "Yago", login: "yago", role: "student", start: 391, end: 405 },
  { nome: "Yan Kalebe", login: "yan.kalebe", role: "student", start: 406, end: 420 },
  { nome: "Jorge Menor", login: "jorge.menor", role: "student", start: 421, end: 435 },
];

export function verifyStudentSeeds(students: StudentSeed[] = STUDENT_SEEDS) {
  const errors: string[] = [];

  if (students.length !== 29) {
    errors.push(`Esperado 29 alunos, encontrado ${students.length}`);
  }

  const seenLogins = new Set<string>();
  const seenNumbers = new Set<number>();
  let superAdmins = 0;

  for (const student of students) {
    const count = student.end - student.start + 1;
    if (count !== 15) {
      errors.push(`${student.nome} deveria ter 15 números (${student.start}–${student.end})`);
    }
    if (seenLogins.has(student.login)) {
      errors.push(`Login duplicado: ${student.login}`);
    }
    seenLogins.add(student.login);
    if (student.role === "super_admin") superAdmins += 1;
    for (let n = student.start; n <= student.end; n += 1) {
      if (seenNumbers.has(n)) errors.push(`Número duplicado: ${n}`);
      seenNumbers.add(n);
    }
  }

  if (seenNumbers.size !== 435) {
    errors.push(`Esperado 435 números únicos, encontrado ${seenNumbers.size}`);
  }
  for (let n = 1; n <= 435; n += 1) {
    if (!seenNumbers.has(n)) errors.push(`Número ausente: ${n}`);
  }

  const euller = students.find((s) => s.login === "euller.pedro");
  if (!euller || euller.role !== "super_admin") {
    errors.push("Euller Pedro precisa ser SUPER ADMIN");
  }
  if (superAdmins !== 1) {
    errors.push(`Deveria haver exatamente 1 SUPER ADMIN, encontrado ${superAdmins}`);
  }

  return { ok: errors.length === 0, errors };
}
