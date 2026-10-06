"use client";

import { formatRaffleNumber } from "@/lib/format";
import { formatBlockedRanges, prizeMeta } from "@/lib/roleta";
import type { SorteioRecord } from "@/lib/types";
import { cn } from "@/lib/cn";

export function RoletaResultModal({
  sorteio,
  light,
  onClose,
  onNewDraw,
}: {
  sorteio: SorteioRecord;
  light: boolean;
  onClose: () => void;
  onNewDraw: () => void;
}) {
  const prize = prizeMeta(sorteio.premio_place);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-navy-deep/70 p-4">
      <div
        className={cn(
          "roleta-result-pop my-auto w-full max-w-2xl rounded-[32px] border-4 border-amber-300 p-6 text-center shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:p-10",
          light ? "bg-white text-navy" : "bg-gradient-to-b from-navy to-navy-deep text-white",
        )}
      >
        <p className="text-sm font-black uppercase tracking-[0.28em] text-amber-300">
          {sorteio.modo_teste ? "🧪 Sorteio de teste" : "🎉 Número sorteado!"}
        </p>
        <p className="mt-3 font-display text-4xl tracking-[0.12em] text-amber-300 sm:text-5xl">
          {prize.badge} {sorteio.premio_place}º PRÊMIO
        </p>
        <p className="mt-6 font-display text-[7rem] leading-none tracking-[0.04em] sm:text-[9rem]">
          {formatRaffleNumber(sorteio.numero)}
        </p>
        <p className="mt-2 text-sm font-bold uppercase tracking-[0.2em] opacity-70">Número sorteado</p>
        <div className="mt-6 rounded-3xl bg-black/15 px-5 py-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] opacity-70">👤 Comprador</p>
          <p className="mt-1 font-display text-4xl tracking-[0.08em] sm:text-5xl">
            {sorteio.comprador_nome}
          </p>
        </div>
        <div className="mt-3 rounded-3xl bg-black/15 px-5 py-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] opacity-70">Responsável</p>
          <p className="mt-1 font-display text-3xl tracking-[0.08em] sm:text-4xl">
            {sorteio.aluno_nome}
          </p>
        </div>
        <p className="mt-4 text-sm font-black uppercase tracking-[0.14em]">
          Números removidos da roleta: {formatBlockedRanges(sorteio.numeros_bloqueados)}
        </p>
        <p className="mt-5 text-lg font-bold uppercase tracking-wide text-amber-200">
          {sorteio.premio_description}
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-14 rounded-full bg-white/15 px-6 text-sm font-black uppercase tracking-wide hover:bg-white/25"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={onNewDraw}
            className="min-h-14 rounded-full bg-amber-300 px-6 text-sm font-black uppercase tracking-wide text-navy-deep hover:brightness-105"
          >
            Novo sorteio
          </button>
        </div>
      </div>
    </div>
  );
}
