"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function AdminNav({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const pathname = usePathname();
  const links = [
    { href: "/admin", label: "Dashboard", match: (path: string) => path === "/admin" || path.startsWith("/admin/alunos") },
    { href: "/admin/numeros", label: "Números", match: (path: string) => path.startsWith("/admin/numeros") },
    ...(isSuperAdmin
      ? [
          {
            href: "/admin/administradores",
            label: "Administradores",
            match: (path: string) => path.startsWith("/admin/administradores"),
          },
        ]
      : []),
  ];

  return (
    <nav className="hidden gap-2 overflow-x-auto pb-1 md:flex">
      {links.map((link) => {
        const active = link.match(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-bold",
              active ? "bg-red text-white" : "bg-white text-navy shadow-sm",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
