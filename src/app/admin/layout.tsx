import { requireStaff } from "@/lib/auth";
import { AdminChrome } from "@/components/admin/AdminChrome";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const profile = await requireStaff();
  return <AdminChrome profile={profile}>{children}</AdminChrome>;
}
