"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const links = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/numeros", label: "Controle da rifa" },
  { href: "/admin/administradores", label: "Administradores" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-2 overflow-x-auto pb-1">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-bold",
              active ? "bg-red text-white" : "bg-white text-navy",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
