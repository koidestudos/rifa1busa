import { getRaffleStats, getStudentProgressList } from "@/lib/queries";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [stats, students] = await Promise.all([
    getRaffleStats(),
    getStudentProgressList(),
  ]);

  return <AdminDashboard stats={stats} students={students} />;
}
