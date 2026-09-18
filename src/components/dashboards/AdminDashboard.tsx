import Link from "next/link";
import { TOTAL_NUMBERS } from "@/lib/constants";
import { formatBRL } from "@/lib/format";
import type { RaffleStats, StudentProgress } from "@/lib/types";
import { ProgressBar } from "@/components/progress/ProgressBar";

export function AdminDashboard({
  stats,
  students,
}: {
  stats: RaffleStats;
  students: StudentProgress[];
}) {
  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total de números" value={String(stats.total)} />
        <StatCard label="Números pegos" value={String(stats.sold)} />
        <StatCard label="Números disponíveis" value={String(stats.available)} />
        <StatCard label="Total arrecadado" value={formatBRL(stats.raised)} />
      </section>

      <section className="overflow-hidden rounded-3xl bg-white shadow-[0_12px_30px_rgba(6,28,58,0.06)]">
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <h2 className="font-display text-2xl tracking-[0.08em]">Progresso dos alunos</h2>
          <Link href="/admin/numeros" className="text-sm font-bold text-red">
            Ver todos
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-page text-left text-xs font-bold uppercase tracking-wide text-navy/50">
              <tr>
                <th className="px-5 py-3">Aluno</th>
                <th className="px-3 py-3">Vendidos</th>
                <th className="px-3 py-3">Disponíveis</th>
                <th className="min-w-40 px-3 py-3">Progresso</th>
                <th className="px-5 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-t border-navy/5">
                  <td className="px-5 py-3 font-semibold">{student.nome}</td>
                  <td className="px-3 py-3">{student.vendidos}</td>
                  <td className="px-3 py-3">{student.disponiveis}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <ProgressBar value={student.vendidos} max={student.total || 15} />
                      </div>
                      <span className="w-10 text-right text-xs font-bold text-navy/60">
                        {student.percentual}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-navy">
                    {formatBRL(student.arrecadado)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-5 py-3 text-xs text-navy/50">
          Potencial total: {formatBRL(TOTAL_NUMBERS * 5)}
        </p>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-3xl bg-white p-5 shadow-[0_12px_30px_rgba(6,28,58,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">{label}</p>
      <p className="mt-2 font-display text-4xl tracking-[0.04em] text-navy">{value}</p>
    </article>
  );
}
