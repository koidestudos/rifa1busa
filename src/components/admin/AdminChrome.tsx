"use client";

import { usePathname } from "next/navigation";
import { SiteShell } from "@/components/layout/SiteShell";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminBottomNav } from "@/components/layout/BottomNav";
import { SessionGuard } from "@/components/auth/SessionGuard";
import { UsaFlag } from "@/components/brand/Decor";
import type { Profile } from "@/lib/types";

export function AdminChrome({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSuperAdmin = profile.role === "super_admin";
  const studio = pathname.startsWith("/admin/roleta");

  if (studio) {
    return (
      <>
        <SessionGuard enabled />
        {children}
      </>
    );
  }

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
        <AdminNav isSuperAdmin={isSuperAdmin} />
        <div className="mt-5">{children}</div>
      </div>
      <AdminBottomNav isSuperAdmin={isSuperAdmin} />
    </SiteShell>
  );
}
