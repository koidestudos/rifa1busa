import { requireStaff } from "@/lib/auth";
import { getProfiles } from "@/lib/queries";
import { AdminManagement } from "@/components/admin/AdminManagement";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  const profile = await requireStaff();
  const profiles = await getProfiles();

  return (
    <section>
      <AdminManagement
        profiles={profiles}
        canManage={profile.role === "super_admin"}
      />
    </section>
  );
}
