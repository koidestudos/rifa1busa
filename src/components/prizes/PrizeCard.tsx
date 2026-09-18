import { PRIZES } from "@/lib/constants";
import { cn } from "@/lib/cn";

const accents: Record<string, string> = {
  gold: "border-l-gold border-t-gold",
  silver: "border-l-silver border-t-silver",
  bronze: "border-l-bronze border-t-bronze",
  navy: "border-l-navy border-t-navy",
  red: "border-l-red border-t-red",
};

export function PrizeCard({
  prize,
}: {
  prize: (typeof PRIZES)[number];
}) {
  return (
    <article
      className={cn(
        "card-surface rise-in overflow-hidden rounded-3xl border-l-8 border-t-4 p-5",
        accents[prize.accent],
      )}
    >
      <p className="text-3xl" aria-hidden>
        {prize.emoji}
      </p>
      <h3 className="mt-3 font-display text-2xl text-navy">{prize.title}</h3>
      <p className="mt-2 text-sm leading-6 text-navy/75">{prize.description}</p>
    </article>
  );
}

export function PrizeGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {PRIZES.map((prize) => (
        <PrizeCard key={prize.place} prize={prize} />
      ))}
    </div>
  );
}
