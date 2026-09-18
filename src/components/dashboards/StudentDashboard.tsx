"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { NumberGrid } from "@/components/numbers/NumberGrid";
import { ProgressBar } from "@/components/progress/ProgressBar";
import { PaymentModal } from "@/components/payment/PaymentModal";
import { NUMBERS_PER_STUDENT } from "@/lib/constants";
import type { Profile, RaffleNumber } from "@/lib/types";

export function StudentDashboard({
  profile,
  numbers,
}: {
  profile: Profile;
  numbers: RaffleNumber[];
}) {
  const [items, setItems] = useState(numbers);
  const [selected, setSelected] = useState<RaffleNumber | null>(null);

  const sold = items.filter((item) => item.status === "PEGO").length;
  const total = items.length || NUMBERS_PER_STUDENT;

  const greeting = useMemo(() => `Olá, ${profile.nome}! 🇺🇸`, [profile.nome]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <section className="star-field overflow-hidden rounded-3xl p-5 text-white">
        <p className="text-sm font-semibold text-star/80">Painel do aluno</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">{greeting}</h1>
        <p className="mt-2 text-sm text-white/75">
          Toque em um número disponível para registrar a venda.
        </p>
      </section>

      <section className="mt-6 card-surface rounded-3xl p-5">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-navy">Seus números</h2>
            <p className="text-sm text-navy/60">15 números da sua lista</p>
          </div>
          <p className="font-display text-xl text-navy">
            {sold}/{total} pontos
          </p>
        </div>
        <ProgressBar value={sold} max={total} />
        <div className="mt-5">
          <NumberGrid
            numbers={items}
            onSelect={(item) => {
              const current = items.find((n) => n.id === item.id);
              if (current) setSelected(current);
            }}
          />
        </div>
        <p className="mt-5 text-center text-sm">
          <Link href="/alterar-senha" className="font-semibold text-red underline">
            Alterar minha senha
          </Link>
        </p>
      </section>

      <PaymentModal
        open={Boolean(selected)}
        numeroId={selected?.id ?? ""}
        numero={selected?.numero ?? 0}
        onClose={() => setSelected(null)}
        onSuccess={() => {
          if (!selected) return;
          setItems((current) =>
            current.map((item) =>
              item.id === selected.id ? { ...item, status: "PEGO" } : item,
            ),
          );
          setSelected(null);
        }}
      />
    </div>
  );
}
