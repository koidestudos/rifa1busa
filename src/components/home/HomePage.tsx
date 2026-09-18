import Link from "next/link";
import { HOW_TO_STEPS, TOTAL_NUMBERS } from "@/lib/constants";
import { formatTicketPrice } from "@/lib/format";
import type { RaffleStats } from "@/lib/types";
import { PrizeGrid } from "@/components/prizes/PrizeCard";
import { PatrioticScene, StarsRow } from "@/components/brand/Decor";
import { Button } from "@/components/ui/Button";

export function HomePage({
  stats,
  configured,
}: {
  stats: RaffleStats;
  configured: boolean;
}) {
  return (
    <main>
      <PatrioticScene className="min-h-[78vh] sm:min-h-[88vh]">
        <div className="mx-auto flex min-h-[58vh] max-w-4xl flex-col items-center justify-center text-center sm:min-h-[68vh]">
          <StarsRow />
          <h1 className="mt-4 font-display leading-[0.9] tracking-[0.06em]">
            <span className="block text-5xl text-white sm:text-7xl lg:text-8xl">RIFA FEIRA</span>
            <span className="block text-5xl text-red sm:text-7xl lg:text-8xl">DOS PAÍSES</span>
            <span className="block text-5xl text-white sm:text-7xl lg:text-8xl">2026</span>
          </h1>
          <p className="mt-3 font-display text-3xl tracking-[0.18em] text-gold sm:text-5xl">
            ESTADOS UNIDOS
          </p>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/85 sm:text-lg">
            Participe da nossa rifa e concorra a 5 prêmios!
          </p>
          <div className="mt-8 flex w-full max-w-md flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/login" className="w-full sm:w-auto">
              <Button className="w-full min-w-40 px-10" size="xl">
                Entrar
              </Button>
            </Link>
            <Link href="#como-funciona" className="w-full sm:w-auto">
              <Button className="w-full min-w-40 px-10" size="xl" variant="outline">
                Como funciona
              </Button>
            </Link>
          </div>
        </div>
      </PatrioticScene>

      <div className="flag-stripes h-3" />

      {!configured ? (
        <div className="mx-auto max-w-4xl px-4 pt-6">
          <p className="rounded-2xl bg-gold/20 px-4 py-3 text-sm font-semibold text-navy">
            Configure o Firebase no arquivo <code>.env.local</code> para ativar login, números e
            comprovantes.
          </p>
        </div>
      ) : null}

      <section id="premios" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-center font-display text-4xl tracking-[0.12em] text-navy sm:text-5xl">
          Prêmios
        </h2>
        <div className="mt-8">
          <PrizeGrid />
        </div>
      </section>

      <section id="como-funciona" className="bg-page py-12">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center font-display text-4xl tracking-[0.12em] text-navy sm:text-5xl">
            Como participar
          </h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_TO_STEPS.map((step, index) => (
              <li key={step} className="text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red font-display text-2xl text-white">
                  {index + 1}
                </span>
                <p className="mt-3 text-sm font-semibold leading-6 text-navy">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="valor">
        <PatrioticScene compact className="px-4 py-14">
          <div className="relative z-10 mx-auto max-w-4xl pb-6 text-center">
            <p className="font-display text-3xl tracking-[0.08em] sm:text-5xl">
              Cada número custa apenas {formatTicketPrice()}
            </p>
            <p className="mt-3 text-white/80">
              {stats.available} números disponíveis · {TOTAL_NUMBERS} números no total
            </p>
          </div>
        </PatrioticScene>
      </section>
    </main>
  );
}
