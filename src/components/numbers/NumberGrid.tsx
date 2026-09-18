"use client";

import { NumberBall } from "@/components/numbers/NumberBall";
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
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {numbers.map((item) => (
        <NumberBall
          key={item.id}
          numero={item.numero}
          status={item.status as NumberStatus}
          compact={compact}
          onClick={
            item.status === "DISPONIVEL" && onSelect
              ? () => onSelect(item)
              : undefined
          }
        />
      ))}
    </div>
  );
}
