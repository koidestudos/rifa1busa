"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { TOTAL_NUMBERS } from "@/lib/constants";
import { formatBRL } from "@/lib/format";
import type { RaffleStats, StudentProgress } from "@/lib/types";
import { LoginStatusBadge } from "@/components/admin/LoginStatusBadge";
import { ProgressBar } from "@/components/progress/ProgressBar";
import { cn } from "@/lib/cn";

type AccessFilter = "all" | "entered" | "pending";

export function AdminDashboard({
  stats,
  students,
  scoped = false,
}: {
  stats: RaffleStats;
  students: StudentProgress[];
  scoped?: boolean;
}) {
  const [filter, setFilter] = useState<AccessFilter>("all");
  const enteredCount = students.filter((student) => student.has_logged_in).length;
  const pendingCount = students.length - enteredCount;
  const visible = useMemo(() => {
    if (filter === "entered") return students.filter((student) => student.has_logged_in);
    if (filter === "pending") return students.filter((student) => !student.has_logged_in);
    return students;
  }, [students, filter]);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-white shadow-[0_12px_30px_rgba(6,28,58,0.06)]">
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl tracking-[0.08em]">Acesso ao site</h2>
            <p className="mt-1 text-sm font-semibold text-navy/60">
              Quem já fez o primeiro login e quem ainda não entrou.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:w-72">
            <StatCard label="Já entrou" value={String(enteredCount)} compact />
            <StatCard label="Ainda não" value={String(pendingCount)} compact />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 px-5 pb-4">
          <FilterChip
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label={`Todos (${students.length})`}
          />
          <FilterChip
            active={filter === "entered"}
            onClick={() => setFilter("entered")}
            label={`Já entrou (${enteredCount})`}
          />
          <FilterChip
            active={filter === "pending"}
            onClick={() => setFilter("pending")}
            label={`Ainda não (${pendingCount})`}
          />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {scoped ? (
          <>
            <StatCard label="Alunos visíveis" value={String(students.length)} />
            <StatCard label="Números visíveis" value={String(stats.total)} />
            <StatCard label="Números pegos" value={String(stats.sold)} />
            <StatCard label="Arrecadação visível" value={formatBRL(stats.raised)} />
          </>
        ) : (
          <>
            <StatCard label="Total de números" value={String(stats.total)} />
            <StatCard label="Números pegos" value={String(stats.sold)} />
            <StatCard label="Números disponíveis" value={String(stats.available)} />
            <StatCard label="Total arrecadado" value={formatBRL(stats.raised)} />
          </>
        )}
      </section>
      {scoped ? (
        <p className="text-sm font-semibold text-navy/60">
          Estas estatísticas incluem somente os alunos que você pode visualizar.
        </p>
      ) : null}

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
                <th className="px-3 py-3">Acesso</th>
                <th className="px-3 py-3">Vendidos</th>
                <th className="px-3 py-3">Disponíveis</th>
                <th className="min-w-40 px-3 py-3">Progresso</th>
                <th className="px-5 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm font-semibold text-navy/55">
                    Ninguém neste filtro.
                  </td>
                </tr>
              ) : (
                visible.map((student) => (
                  <tr key={student.id} className="border-t border-navy/5 hover:bg-page/80">
                    <td className="px-5 py-3 font-semibold">
                      <Link href={`/admin/alunos/${student.id}`} className="inline-flex items-center gap-1 text-navy underline-offset-2 hover:underline">
                        {student.nome}
                        <ChevronRight className="h-4 w-4 text-red" />
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <LoginStatusBadge
                        hasLoggedIn={student.has_logged_in}
                        firstLoginAt={student.first_login_at}
                        lastLoginAt={student.last_login_at}
                      />
                    </td>
                    <td className="px-3 py-3">{student.vendidos}</td>
                    <td className="px-3 py-3">{student.disponiveis}</td>
                    <td className="px-3 py-3">
                      <Link href={`/admin/alunos/${student.id}`} className="flex items-center gap-2">
                        <div className="flex-1">
                          <ProgressBar value={student.vendidos} max={student.total || 15} />
                        </div>
                        <span className="w-10 text-right text-xs font-bold text-navy/60">
                          {student.percentual}%
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-navy">
                      {formatBRL(student.arrecadado)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="px-5 py-3 text-xs text-navy/50">
          {scoped
            ? `Potencial visível: ${formatBRL(stats.total * 5)}`
            : `Potencial total: ${formatBRL(TOTAL_NUMBERS * 5)}`}
        </p>
      </section>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide transition",
        active ? "bg-navy text-white" : "bg-page text-navy/70 hover:bg-navy/10",
      )}
    >
      {label}
    </button>
  );
}

function StatCard({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <article
      className={
        compact
          ? "rounded-2xl bg-page px-4 py-3"
          : "rounded-3xl bg-white p-5 shadow-[0_12px_30px_rgba(6,28,58,0.06)]"
      }
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">{label}</p>
      <p
        className={
          compact
            ? "mt-1 font-display text-3xl tracking-[0.04em] text-navy"
            : "mt-2 font-display text-4xl tracking-[0.04em] text-navy"
        }
      >
        {value}
      </p>
    </article>
  );
}
