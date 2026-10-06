"use client";

import { formatRaffleNumber } from "@/lib/format";
import { formatBlockedRanges, prizeMeta } from "@/lib/roleta";
import type { SorteioRecord } from "@/lib/types";
import { cn } from "@/lib/cn";

export function RoletaHistory({
  history,
  light,
  compact,
  canManage,
  spinning,
  onClear,
  onReset,
  onClose,
  isSuperAdmin,
}: {
  history: SorteioRecord[];
  light: boolean;
  compact?: boolean;
  canManage: boolean;
  spinning: boolean;
  onClear: () => void;
  onReset: () => void;
  onClose: () => void;
  isSuperAdmin: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-white/15 p-4 shadow-xl backdrop-blur-md",
        light ? "bg-white/80 text-navy" : "bg-black/35 text-white",
        compact ? "max-w-xs" : "w-full max-w-sm",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-2xl tracking-[0.12em]">Histórico</h2>
        <div className="flex items-center gap-1">
          {canManage ? (
            <button
              type="button"
              disabled={spinning}
              onClick={onClear}
              className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wide disabled:opacity-40"
            >
              🗑️ Apagar
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar histórico"
            className={cn(
              "grid h-8 w-8 place-items-center rounded-full text-sm font-black",
              light ? "bg-navy/10 text-navy" : "bg-white/15 text-white",
            )}
          >
            ✕
          </button>
        </div>
      </div>
      <ol className="mt-3 space-y-2">
        {history.length === 0 ? (
          <li className="text-sm font-semibold opacity-70">Nenhum sorteio ainda.</li>
        ) : (
          history.slice(0, 8).map((item) => {
            const prize = prizeMeta(item.premio_place);
            return (
              <li key={item.id} className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-bold">
                <span className="mr-2">{prize.badge}</span>
                Nº {formatRaffleNumber(item.numero)} — {item.comprador_nome}
                <p className="mt-1 text-[11px] font-semibold leading-snug opacity-80">
                  Responsável: {item.aluno_nome}
                  <br />
                  Bloqueados: {formatBlockedRanges(item.numeros_bloqueados)}
                </p>
              </li>
            );
          })
        )}
      </ol>
      {isSuperAdmin ? (
        <button
          type="button"
          disabled={spinning}
          onClick={onReset}
          className="mt-3 w-full rounded-full bg-red/70 px-3 py-2 text-[11px] font-black uppercase tracking-wide disabled:opacity-40"
        >
          🔄 Resetar sorteios
        </button>
      ) : null}
    </section>
  );
}
