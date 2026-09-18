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
    "flex items-center justify-center rounded-full font-display font-semibold text-white shadow-md transition",
    compact
      ? "h-11 w-11 text-sm sm:h-10 sm:w-10"
      : "h-14 w-14 text-lg sm:h-16 sm:w-16 sm:text-xl",
    taken
      ? "cursor-default bg-ball-taken shadow-red/20"
      : "bg-ball shadow-navy/25 hover:scale-[1.06] hover:brightness-110",
  );

  if (taken || !onClick) {
    return (
      <div className={classes} aria-label={taken ? `Número ${numero} pego` : `Número ${numero}`}>
        {numero}
      </div>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes} aria-label={`Registrar número ${numero}`}>
      {numero}
    </button>
  );
}
