import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { canViewStudentInAdmin } from "@/lib/permissions";
import { getProfileById, getStudentNumbersWithPurchases } from "@/lib/queries";
import { StudentDashboard } from "@/components/dashboards/StudentDashboard";

export const dynamic = "force-dynamic";

export default async function AdminStudentPage({
  params,
}: {
  params: Promise<{ alunoId: string }>;
}) {
  const viewer = await requireStaff();
  const { alunoId } = await params;
  const allowed = await canViewStudentInAdmin(viewer, alunoId);

  if (!allowed) {
    return (
      <section className="rounded-3xl bg-white p-6 shadow-[0_12px_30px_rgba(6,28,58,0.06)]">
        <h1 className="font-display text-3xl tracking-[0.08em] text-navy">Acesso negado</h1>
        <p className="mt-2 text-sm text-navy/70">
          Você não tem permissão para visualizar este aluno.
        </p>
        <Link href="/admin" className="mt-4 inline-block font-bold text-red">
          Voltar ao painel
        </Link>
      </section>
    );
  }

  const student = await getProfileById(alunoId);
  if (!student) {
    return (
      <section className="rounded-3xl bg-white p-6">
        <h1 className="font-display text-3xl tracking-[0.08em]">Aluno não encontrado</h1>
        <Link href="/admin" className="mt-4 inline-block font-bold text-red">
          Voltar ao painel
        </Link>
      </section>
    );
  }

  const numbers = await getStudentNumbersWithPurchases(student.id);

  return (
    <StudentDashboard
      student={student}
      viewer={viewer}
      numbers={numbers}
      adminView
    />
  );
}
