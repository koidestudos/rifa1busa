import { verifyStudentSeeds } from "../src/lib/data/students.ts";

const result = verifyStudentSeeds();
if (!result.ok) {
  console.error(result.errors.join("\n"));
  process.exit(1);
}

console.log("OK: 29 alunos, 435 números, 15 por aluno, Euller Pedro = SUPER ADMIN.");
