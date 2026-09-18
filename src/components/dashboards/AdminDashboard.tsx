import Link from "next/link";
import { TOTAL_NUMBERS } from "@/lib/constants";
import { formatBRL } from "@/lib/format";
import type { RaffleStats, StudentProgress } from "@/lib/types";
import { StudentProgressCard } from "@/components/progress/StudentProgressCard";
import { ProgressBar } from "@/components/progress/ProgressBar";

export function AdminDashboard({
  stats,
  students,
}: {
  stats: RaffleStats;
  students: StudentProgress[];
}) {
  const overall = stats.total || TOTAL_NUMBERS;

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total de números" value={String(stats.total)} />
        <StatCard label="Números pegos" value={String(stats.sold)} />
        <StatCard label="Números disponíveis" value={String(stats.available)} />
        <StatCard label="Total arrecadado" value={formatBRL(stats.raised)} />
      </section>

      <section className="card-surface rounded-3xl p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl">Progresso geral</h2>
            <p className="text-sm text-navy/60">
              Potencial total: {formatBRL(TOTAL_NUMBERS * 5)}
            </p>
          </div>
          <Link href="/admin/numeros" className="text-sm font-bold text-red underline">
            Abrir controle da rifa
          </Link>
        </div>
        <div className="mt-4">
          <ProgressBar value={stats.sold} max={overall} label={`${stats.sold}/${overall} vendidos`} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-2xl">Progresso dos alunos</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {students.map((student) => (
            <StudentProgressCard key={student.id} student={student} />
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-3xl bg-navy p-4 text-white">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/70">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </article>
  );
}
