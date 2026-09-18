"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { NumberGrid, NumberLegend } from "@/components/numbers/NumberGrid";
import { ProgressBar } from "@/components/progress/ProgressBar";
import { PaymentModal } from "@/components/payment/PaymentModal";
import { StudentBottomNav } from "@/components/layout/BottomNav";
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
  const range = useMemo(() => {
    if (items.length === 0) return "—";
    const values = items.map((item) => item.numero);
    return `${Math.min(...values)} a ${Math.max(...values)}`;
  }, [items]);

  return (
    <div className="mx-auto max-w-xl px-4 py-6 pb-24 md:pb-8">
      <section>
        <h1 className="font-display text-4xl tracking-[0.06em] text-navy sm:text-5xl">
          Olá, {profile.nome}! 🇺🇸
        </h1>
        <p className="mt-1 text-sm text-navy/65">Aqui estão seus números da rifa.</p>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-5 shadow-[0_12px_30px_rgba(6,28,58,0.06)]">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl tracking-[0.08em] text-navy">Seus números</h2>
            <p className="text-sm font-semibold text-navy/55">{range}</p>
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
        <div className="mt-5">
          <NumberLegend />
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
      <StudentBottomNav />
    </div>
  );
}
