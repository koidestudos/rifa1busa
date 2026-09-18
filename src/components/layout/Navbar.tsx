"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Shield, UserRound, X } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { isStaff, roleLabel, type Profile } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { UsaFlag } from "@/components/brand/Decor";

type NavbarProps = {
  profile?: Profile | null;
};

export function Navbar({ profile = null }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const staff = isStaff(profile?.role);
  const showAdmin = staff && !profile?.must_change_password;

  const links = [
    { href: "/", label: "Início" },
    { href: "/#premios", label: "Prêmios" },
    { href: "/#como-funciona", label: "Como funciona" },
    { href: "/#valor", label: "Estatísticas" },
  ];

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-navy text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <UsaFlag className="h-[18px] w-[26px]" />
            <p className="truncate font-display text-xl tracking-[0.12em] sm:text-2xl">
              Rifa EUA 2026
            </p>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-white/85 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            {profile ? (
              <>
                <Link href="/painel" className="inline-flex items-center gap-1 text-sm font-semibold">
                  <UserRound className="h-4 w-4" />
                  Meu painel
                </Link>
                {showAdmin ? (
                  <Link href="/admin" className="inline-flex items-center gap-1 text-sm font-semibold">
                    <Shield className="h-4 w-4" />
                    Admin
                  </Link>
                ) : null}
                <div className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-xs">
                    {profile.nome.slice(0, 1)}
                  </span>
                  <span className="max-w-36 truncate text-xs font-semibold">
                    {profile.nome}
                    {staff ? (
                      <span className="block text-[10px] font-bold uppercase tracking-wide text-gold">
                        {roleLabel(profile.role)}
                      </span>
                    ) : null}
                  </span>
                </div>
                <form action={logoutAction}>
                  <Button variant="ghost" size="md">
                    Sair
                  </Button>
                </form>
              </>
            ) : (
              <Link href="/login">
                <Button size="md">Entrar</Button>
              </Link>
            )}
          </nav>

          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl bg-white/10 lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      <div className="flag-stripes h-1.5" />

      {open ? (
        <div className="border-b border-navy/10 bg-white px-4 py-4 text-navy shadow-xl lg:hidden">
          <div className="flex flex-col gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl px-3 py-3 text-base font-semibold hover:bg-page"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {profile ? (
              <>
                <Link
                  href="/painel"
                  className="rounded-2xl px-3 py-3 font-semibold hover:bg-page"
                  onClick={() => setOpen(false)}
                >
                  Meu painel
                </Link>
                {showAdmin ? (
                  <Link
                    href="/admin"
                    className="rounded-2xl px-3 py-3 font-semibold hover:bg-page"
                    onClick={() => setOpen(false)}
                  >
                    Painel administrativo
                  </Link>
                ) : null}
                <form action={logoutAction}>
                  <Button className="w-full" variant="secondary">
                    Sair
                  </Button>
                </form>
              </>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)}>
                <Button className="w-full">Entrar</Button>
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
