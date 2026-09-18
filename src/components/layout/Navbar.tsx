"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Shield, UserRound, X } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { isStaff, type Profile } from "@/lib/types";
import { Button } from "@/components/ui/Button";

type NavbarProps = {
  profile?: Profile | null;
};

export function Navbar({ profile = null }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const staff = isStaff(profile?.role);

  const links = [
    { href: "/#premios", label: "Prêmios" },
    { href: "/#como-funciona", label: "Como funciona" },
    { href: "/#valor", label: "Valor" },
  ];

  return (
    <header className="sticky top-0 z-40">
      <div className="star-field text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="min-w-0">
            <p className="font-display text-sm tracking-[0.18em] text-star/90">
              FEIRA DOS PAÍSES 2026
            </p>
            <p className="truncate font-display text-lg sm:text-xl">
              RIFA 🇺🇸 ESTADOS UNIDOS
            </p>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-semibold text-white/85 hover:text-white">
                {link.label}
              </Link>
            ))}
            {profile ? (
              <>
                <Link href="/painel" className="inline-flex items-center gap-1 text-sm font-semibold">
                  <UserRound className="h-4 w-4" />
                  Meu painel
                </Link>
                {staff ? (
                  <Link href="/admin" className="inline-flex items-center gap-1 text-sm font-semibold">
                    <Shield className="h-4 w-4" />
                    Admin
                  </Link>
                ) : null}
                <form action={logoutAction}>
                  <Button variant="ghost" size="md">
                    Sair
                  </Button>
                </form>
              </>
            ) : (
              <Link href="/login">
                <Button size="md">ENTRAR</Button>
              </Link>
            )}
          </nav>

          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl bg-white/10 md:hidden"
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
        <div className="border-b border-navy/10 bg-white px-4 py-4 text-navy shadow-xl md:hidden">
          <div className="flex flex-col gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl px-3 py-3 text-base font-semibold hover:bg-cream"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {profile ? (
              <>
                <Link href="/painel" className="rounded-2xl px-3 py-3 font-semibold hover:bg-cream" onClick={() => setOpen(false)}>
                  Meu painel
                </Link>
                {staff ? (
                  <Link href="/admin" className="rounded-2xl px-3 py-3 font-semibold hover:bg-cream" onClick={() => setOpen(false)}>
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
                <Button className="w-full">ENTRAR</Button>
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
