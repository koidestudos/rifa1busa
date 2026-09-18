import { requireStaff } from "@/lib/auth";
import { SiteShell } from "@/components/layout/SiteShell";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const profile = await requireStaff();

  return (
    <SiteShell profile={profile}>
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <header className="mb-4">
          <p className="font-display text-3xl text-navy">Painel Administrativo 🇺🇸</p>
          <p className="text-sm text-navy/60">Gestão da rifa da turma dos Estados Unidos</p>
        </header>
        <AdminNav />
        <div className="mt-5">{children}</div>
      </div>
    </SiteShell>
  );
}
