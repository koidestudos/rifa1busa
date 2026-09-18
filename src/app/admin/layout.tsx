import { requireStaff } from "@/lib/auth";
import { SiteShell } from "@/components/layout/SiteShell";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminBottomNav } from "@/components/layout/BottomNav";
import { UsaFlag } from "@/components/brand/Decor";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const profile = await requireStaff();

  return (
    <SiteShell profile={profile} showFooter={false}>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:pb-8">
        <header className="mb-4 flex items-center gap-2">
          <UsaFlag />
          <div>
            <p className="font-display text-3xl tracking-[0.08em] text-navy">Painel Administrativo</p>
            <p className="text-sm text-navy/60">Rifa Feira dos Países 2026</p>
          </div>
        </header>
        <AdminNav />
        <div className="mt-5">{children}</div>
      </div>
      <AdminBottomNav />
    </SiteShell>
  );
}
