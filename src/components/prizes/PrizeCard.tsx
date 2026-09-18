import Image from "next/image";
import { PRIZES } from "@/lib/constants";

export function PrizeCard({
  prize,
}: {
  prize: (typeof PRIZES)[number];
}) {
  return (
    <article className="rise-in overflow-hidden rounded-2xl bg-white shadow-[0_12px_30px_rgba(6,28,58,0.1)]">
      <div className="relative aspect-[4/3] bg-navy">
        {prize.kind === "photo" ? (
          <Image
            src={prize.image}
            alt={prize.description}
            fill
            sizes="(max-width: 640px) 100vw, 20vw"
            className="object-cover"
          />
        ) : (
          <PixArt amount={prize.pix} />
        )}
      </div>
      <div className="px-3 py-3 text-center">
        <h3 className="font-display text-xl tracking-[0.08em] text-navy">{prize.title}</h3>
        <p className="mt-1 text-xs font-semibold leading-5 text-navy/70">{prize.description}</p>
      </div>
    </article>
  );
}

function PixArt({ amount }: { amount: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-linear-to-br from-[#0a4ea1] to-[#062a5c] text-white">
      <span className="rounded-md bg-white px-3 py-1 font-display text-2xl tracking-wide text-[#0a4ea1]">
        PIX
      </span>
      <span className="mt-3 font-display text-3xl tracking-wide">{amount}</span>
    </div>
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
