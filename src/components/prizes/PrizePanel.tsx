import Image from "next/image";
import { PRIZES } from "@/lib/constants";
import { cn } from "@/lib/cn";

const MEDALS = ["🥇", "🥈", "🥉", "🏆", "💵"] as const;

export function PrizePanel({ compact = false }: { compact?: boolean }) {
  return (
    <section className={cn("rounded-3xl bg-white p-4 shadow-[0_12px_30px_rgba(6,28,58,0.06)]", compact && "p-3")}>
      <div className="mb-3 text-center">
        <p className="font-display text-2xl tracking-[0.08em] text-navy sm:text-3xl">Prêmios da rifa</p>
        <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
          Feira dos Países 2026 · Estados Unidos
        </p>
      </div>
      <div
        className={cn(
          "grid gap-3",
          compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
        )}
      >
        {PRIZES.map((prize, index) => (
          <article
            key={prize.place}
            className="flex items-center gap-3 overflow-hidden rounded-2xl border border-navy/10 bg-page p-2 sm:flex-col sm:text-center"
          >
            <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-navy sm:h-24 sm:w-full">
              {prize.kind === "photo" ? (
                <Image
                  src={prize.image}
                  alt={prize.description}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-linear-to-br from-[#0a4ea1] to-[#062a5c] text-white">
                  <span className="font-display text-lg tracking-wide">{prize.pix}</span>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg leading-none">
                {MEDALS[index]}{" "}
                <span className="font-display text-xl tracking-[0.06em] text-navy">{prize.title}</span>
              </p>
              <p className="mt-1 text-xs font-semibold leading-4 text-navy/70">{prize.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
