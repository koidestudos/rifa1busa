"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera } from "lucide-react";
import { NumberGrid, NumberLegend } from "@/components/numbers/NumberGrid";
import { NumberRecordModal } from "@/components/numbers/NumberRecordModal";
import { ProgressBar } from "@/components/progress/ProgressBar";
import { StudentBottomNav } from "@/components/layout/BottomNav";
import { PrizePanel } from "@/components/prizes/PrizePanel";
import { Button } from "@/components/ui/Button";
import { UsaFlag } from "@/components/brand/Decor";
import { NUMBERS_PER_STUDENT, TICKET_PRICE } from "@/lib/constants";
import { formatBRL } from "@/lib/format";
import { isStaff, type NumberWithOwner, type Profile } from "@/lib/types";

export function StudentDashboard({
  student,
  viewer,
  numbers,
  adminView = false,
}: {
  student: Profile;
  viewer: Profile;
  numbers: NumberWithOwner[];
  adminView?: boolean;
}) {
  const [overlay, setOverlay] = useState<Record<string, NumberWithOwner>>({});
  const [selected, setSelected] = useState<NumberWithOwner | null>(null);
  const [printMode, setPrintMode] = useState(false);
  const items = useMemo(
    () => numbers.map((item) => overlay[item.id] ?? item),
    [numbers, overlay],
  );

  useEffect(() => {
    document.body.classList.toggle("rifa-print-mode", printMode && !adminView);
    return () => document.body.classList.remove("rifa-print-mode");
  }, [printMode, adminView]);

  const sold = items.filter((item) => item.status === "PEGO").length;
  const total = items.length || NUMBERS_PER_STUDENT;
  const raised = sold * TICKET_PRICE;
  const canEdit = viewer.id === student.id || isStaff(viewer.role);
  const range = useMemo(() => {
    if (items.length === 0) return "—";
    const values = items.map((item) => item.numero);
    return `${Math.min(...values)} a ${Math.max(...values)}`;
  }, [items]);

  return (
    <div
      className={
        printMode && !adminView
          ? "print-stage mx-auto max-w-md px-3 py-4"
          : adminView
            ? "mx-auto max-w-xl px-0 py-2 pb-28 md:pb-8"
            : "mx-auto max-w-xl px-4 py-6 pb-24 md:pb-8"
      }
    >
      {adminView ? (
        <p className="mb-4 rounded-2xl bg-gold/20 px-4 py-3 text-sm font-semibold text-navy">
          Visualização administrativa de {student.nome}. Você continua logado como {viewer.nome}.
        </p>
      ) : null}

      <section className="print-hero rounded-3xl bg-navy p-5 text-white shadow-[0_12px_30px_rgba(6,28,58,0.18)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <UsaFlag className="h-5 w-7" />
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                Rifa EUA 2026
              </p>
            </div>
            <h1 className="font-display text-4xl tracking-[0.06em] sm:text-5xl">
              {adminView ? `Painel de ${student.nome}` : `Olá, ${student.nome}!`}
            </h1>
            <p className="mt-1 text-sm text-white/75">
              {sold}/{total} números pegos · {formatBRL(raised)}
            </p>
          </div>
          {!adminView ? (
            <Button
              size="md"
              variant={printMode ? "gold" : "outline"}
              className="shrink-0 text-[11px]"
              onClick={() => setPrintMode((value) => !value)}
            >
              <Camera className="h-4 w-4" />
              {printMode ? "Sair do print" : "Modo Print"}
            </Button>
          ) : null}
        </div>
        <div className="mt-4">
          <ProgressBar value={sold} max={total} />
        </div>
        {printMode && !adminView ? (
          <p className="mt-3 rounded-2xl bg-gold px-3 py-2 text-center text-sm font-black uppercase tracking-wide text-navy-deep">
            Cada ponto vale {formatBRL(TICKET_PRICE)}
          </p>
        ) : null}
      </section>

      <section className="mt-4 rounded-3xl bg-white p-5 shadow-[0_12px_30px_rgba(6,28,58,0.06)]">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl tracking-[0.08em] text-navy">Números</h2>
            <p className="text-sm font-semibold text-navy/55">{range}</p>
          </div>
          <p className="text-right text-xs font-bold uppercase tracking-wide text-navy/55">
            {items.filter((item) => item.status === "DISPONIVEL").length} disponíveis
            <span className="block text-navy">
              {sold} PEGO · {formatBRL(raised)}
            </span>
          </p>
        </div>
        <NumberGrid
          numbers={items}
          onSelect={(item) => {
            const current = items.find((entry) => entry.id === item.id);
            if (current) setSelected(current);
          }}
        />
        <div className="mt-5">
          <NumberLegend />
        </div>
      </section>

      <div className="mt-4">
        <PrizePanel compact={printMode} />
      </div>

      {selected ? (
        <NumberRecordModal
          key={selected.id}
          item={selected}
          canEdit={canEdit}
          onClose={() => setSelected(null)}
          onChanged={(next) => {
            setOverlay((current) => ({ ...current, [next.id]: next }));
          }}
        />
      ) : null}

      {!adminView && !printMode ? (
        <StudentBottomNav isStaff={isStaff(viewer.role) && !viewer.must_change_password} />
      ) : null}
    </div>
  );
}
