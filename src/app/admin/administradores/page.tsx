import { requireSuperAdmin } from "@/lib/auth";
import { getPermissionsForAdmin } from "@/lib/permissions";
import { getProfiles } from "@/lib/queries";
import { AdminManagement } from "@/components/admin/AdminManagement";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  await requireSuperAdmin();
  const profiles = await getProfiles();
  const admins = profiles.filter((profile) => profile.role === "admin");
  const permissionEntries = await Promise.all(
    admins.map(async (admin) => [admin.id, await getPermissionsForAdmin(admin.id)] as const),
  );

  return (
    <section>
      <AdminManagement
        profiles={profiles}
        permissionMap={Object.fromEntries(permissionEntries)}
      />
    </section>
  );
}
