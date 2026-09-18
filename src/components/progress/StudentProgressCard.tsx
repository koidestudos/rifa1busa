import { ProgressBar } from "@/components/progress/ProgressBar";
import { formatBRL } from "@/lib/format";
import { roleLabel, type StudentProgress } from "@/lib/types";

export function StudentProgressCard({ student }: { student: StudentProgress }) {
  return (
    <article className="card-surface rounded-3xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-navy">{student.nome}</h3>
          <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
            {roleLabel(student.role)}
          </p>
        </div>
        <p className="font-display text-lg text-red">{formatBRL(student.arrecadado)}</p>
      </div>
      <p className="mt-3 text-sm font-semibold text-navy">
        {student.vendidos}/{student.total} pontos · {student.disponiveis} disponíveis
      </p>
      <div className="mt-2">
        <ProgressBar value={student.vendidos} max={student.total || 15} />
      </div>
    </article>
  );
}
