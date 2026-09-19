"use client";

import { NumberBall } from "@/components/numbers/NumberBall";
import { cn } from "@/lib/cn";
import type { NumberStatus, RaffleNumber } from "@/lib/types";

export function NumberGrid({
  numbers,
  onSelect,
  compact = false,
}: {
  numbers: Pick<RaffleNumber, "id" | "numero" | "status">[];
  onSelect?: (numero: Pick<RaffleNumber, "id" | "numero" | "status">) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("grid gap-3", compact ? "grid-cols-6 sm:grid-cols-8 lg:grid-cols-10" : "grid-cols-5")}>
      {numbers.map((item) => (
        <div key={item.id} className="flex justify-center">
          <NumberBall
            numero={item.numero}
            status={item.status as NumberStatus}
            compact={compact}
            onClick={onSelect ? () => onSelect(item) : undefined}
          />
        </div>
      ))}
    </div>
  );
}

export function NumberLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-navy/70">
      <span className="inline-flex items-center gap-2">
        <span aria-hidden>🔵</span> Disponível
      </span>
      <span className="inline-flex items-center gap-2">
        <span aria-hidden>🔴</span> PEGO
      </span>
    </div>
  );
}
