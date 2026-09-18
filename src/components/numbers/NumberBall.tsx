"use client";

import { cn } from "@/lib/cn";
import type { NumberStatus } from "@/lib/types";

type NumberBallProps = {
  numero: number;
  status: NumberStatus;
  onClick?: () => void;
  compact?: boolean;
};

export function NumberBall({ numero, status, onClick, compact = false }: NumberBallProps) {
  const taken = status === "PEGO";
  const classes = cn(
    "flex items-center justify-center rounded-full border-2 font-display font-semibold transition",
    compact
      ? "min-h-12 min-w-12 text-sm sm:min-h-11"
      : "min-h-16 min-w-16 text-lg sm:min-h-[4.5rem] sm:min-w-[4.5rem] sm:text-xl",
    taken
      ? "cursor-default border-red/20 bg-red text-white shadow-inner"
      : "border-navy/20 bg-navy text-white shadow-lg shadow-navy/20 hover:scale-[1.04] hover:bg-navy-light",
  );

  if (taken || !onClick) {
    return (
      <div className={classes} aria-label={taken ? `Número ${numero} pego` : `Número ${numero}`}>
        {taken ? "PEGO" : numero}
      </div>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes} aria-label={`Registrar número ${numero}`}>
      {numero}
    </button>
  );
}
