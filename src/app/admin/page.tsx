import { requireStaff } from "@/lib/auth";
import { getAdminVisibleStudentIds } from "@/lib/permissions";
import { getRaffleStats, getStudentProgressList, statsFromStudents } from "@/lib/queries";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const profile = await requireStaff();
  const visibleIds = await getAdminVisibleStudentIds(profile);
  const scoped = visibleIds !== null;
  const students = await getStudentProgressList(visibleIds);
  const stats = scoped ? statsFromStudents(students) : await getRaffleStats();

  return <AdminDashboard stats={stats} students={students} scoped={scoped} />;
}
