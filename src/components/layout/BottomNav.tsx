"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hash, Home, LayoutDashboard, LayoutGrid, UserRound, Users } from "lucide-react";
import { cn } from "@/lib/cn";

function NavBar({
  items,
}: {
  items: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean }[];
}) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-navy/10 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(6,28,58,0.08)] md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-3 px-2 py-1">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-bold",
                active ? "text-red" : "text-navy/55",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function StudentBottomNav() {
  return (
    <NavBar
      items={[
        { href: "/", label: "Início", icon: Home, exact: true },
        { href: "/painel", label: "Meus Números", icon: LayoutGrid, exact: true },
        { href: "/alterar-senha", label: "Perfil", icon: UserRound, exact: true },
      ]}
    />
  );
}

export function AdminBottomNav() {
  return (
    <NavBar
      items={[
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
        { href: "/admin/numeros", label: "Números", icon: Hash, exact: true },
        { href: "/admin/administradores", label: "Admins", icon: Users, exact: true },
      ]}
    />
  );
}
