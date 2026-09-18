import Link from "next/link";
import { HOW_TO_STEPS, TOTAL_NUMBERS } from "@/lib/constants";
import { formatBRL, formatTicketPrice } from "@/lib/format";
import type { RaffleStats } from "@/lib/types";
import { PrizeGrid } from "@/components/prizes/PrizeCard";
import { LibertySilhouette, StarsRow } from "@/components/brand/Decor";
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
      <section className="star-field relative overflow-hidden px-4 py-12 text-white sm:py-16">
        <LibertySilhouette className="pointer-events-none absolute -right-8 bottom-0 hidden h-[420px] text-white/10 md:block" />
        <div className="relative mx-auto max-w-4xl text-center">
          <StarsRow />
          <p className="mt-3 text-4xl">🇺🇸</p>
          <h1 className="mt-3 font-display text-4xl leading-tight sm:text-6xl">
            RIFA FEIRA DOS PAÍSES 2026
          </h1>
          <p className="mt-3 font-display text-3xl text-star sm:text-4xl">ESTADOS UNIDOS</p>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/80 sm:text-lg">
            Participe da nossa rifa e concorra a 5 prêmios!
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/login" className="w-full sm:w-auto">
              <Button className="w-full px-10" size="xl">
                ENTRAR
              </Button>
            </Link>
            <Link href="#como-funciona" className="w-full sm:w-auto">
              <Button className="w-full px-10" size="xl" variant="secondary">
                COMO FUNCIONA
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {!configured ? (
        <div className="mx-auto max-w-4xl px-4 pt-6">
          <p className="rounded-2xl bg-gold/20 px-4 py-3 text-sm font-semibold text-navy">
            Configure o Supabase no arquivo <code>.env.local</code> para ativar login, números e
            comprovantes.
          </p>
        </div>
      ) : null}

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-3 sm:grid-cols-3">
          <CounterCard label="Números" value={String(stats.total || TOTAL_NUMBERS)} />
          <CounterCard label="Disponíveis" value={String(stats.available)} />
          <CounterCard label="Vendidos" value={String(stats.sold)} />
        </div>
        <p className="mt-4 text-center font-display text-2xl text-navy">
          {formatBRL(stats.raised)} arrecadados
        </p>
      </section>

      <section id="premios" className="mx-auto max-w-6xl px-4 py-6">
        <h2 className="text-center font-display text-3xl">Prêmios</h2>
        <p className="mt-2 text-center text-navy/70">Cinco prêmios para a nossa turma</p>
        <div className="mt-6">
          <PrizeGrid />
        </div>
      </section>

      <section id="como-funciona" className="mx-auto max-w-4xl px-4 py-10">
        <h2 className="text-center font-display text-3xl">Como participar</h2>
        <ol className="mt-6 space-y-3">
          {HOW_TO_STEPS.map((step, index) => (
            <li key={step} className="card-surface flex items-start gap-4 rounded-3xl p-4">
              <span className="flex min-h-10 min-w-10 items-center justify-center rounded-full bg-navy font-display text-white">
                {index + 1}
              </span>
              <p className="pt-1.5 font-semibold">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="valor" className="px-4 pb-16">
        <div className="mx-auto max-w-3xl rounded-3xl bg-navy px-6 py-10 text-center text-white">
          <p className="font-display text-3xl">Cada número custa apenas {formatTicketPrice()}</p>
          <p className="mt-3 text-white/75">
            {stats.available} números disponíveis agora · {TOTAL_NUMBERS} números no total
          </p>
        </div>
      </section>
    </main>
  );
}

function CounterCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="card-surface rounded-3xl p-5 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-navy/50">{label}</p>
      <p className="mt-2 font-display text-4xl text-navy">{value}</p>
    </article>
  );
}
