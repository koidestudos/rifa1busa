import { requireStaff } from "@/lib/auth";
import { getAdminVisibleStudentIds } from "@/lib/permissions";
import { getAllNumbersWithOwners, getStudentProgressList } from "@/lib/queries";
import { NumberTable } from "@/components/admin/NumberTable";

export const dynamic = "force-dynamic";

export default async function NumerosPage() {
  const profile = await requireStaff();
  const visibleIds = await getAdminVisibleStudentIds(profile);
  const [numbers, students] = await Promise.all([
    getAllNumbersWithOwners(visibleIds),
    getStudentProgressList(visibleIds),
  ]);

  return (
    <section>
      <h1 className="mb-4 font-display text-3xl tracking-[0.08em]">Controle da Rifa</h1>
      <NumberTable
        numbers={numbers}
        students={students.map((student) => ({ id: student.id, nome: student.nome }))}
      />
    </section>
  );
}
