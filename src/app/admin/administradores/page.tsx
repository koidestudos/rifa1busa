import { requireStaff } from "@/lib/auth";
import { getProfiles } from "@/lib/queries";
import { AdminManagement } from "@/components/admin/AdminManagement";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  const profile = await requireStaff();
  const profiles = await getProfiles();

  return (
    <section>
      <h1 className="mb-4 font-display text-3xl">Gerenciar administradores</h1>
      <AdminManagement
        profiles={profiles}
        canManage={profile.role === "super_admin"}
      />
    </section>
  );
}
