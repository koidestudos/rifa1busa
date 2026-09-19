import { requireStudentPanel } from "@/lib/auth";
import { getStudentNumbersWithPurchases } from "@/lib/queries";
import { SiteShell } from "@/components/layout/SiteShell";
import { StudentDashboard } from "@/components/dashboards/StudentDashboard";

export const dynamic = "force-dynamic";

export default async function PainelPage() {
  const profile = await requireStudentPanel();
  const numbers = await getStudentNumbersWithPurchases(profile.id);

  return (
    <SiteShell profile={profile} showFooter={false}>
      <StudentDashboard student={profile} viewer={profile} numbers={numbers} />
    </SiteShell>
  );
}
