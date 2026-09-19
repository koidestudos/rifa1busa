"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { NumberWithOwner, Profile } from "@/lib/types";
import { NumberBall } from "@/components/numbers/NumberBall";
import { NumberLegend } from "@/components/numbers/NumberGrid";
import { NumberRecordModal } from "@/components/numbers/NumberRecordModal";
import { onlyDigits } from "@/lib/format";
import { cn } from "@/lib/cn";

type Filter = "TODOS" | "DISPONIVEL" | "PEGO";

export function NumberTable({
  numbers,
  students,
}: {
  numbers: NumberWithOwner[];
  students: Pick<Profile, "id" | "nome">[];
}) {
  const [overlay, setOverlay] = useState<Record<string, NumberWithOwner>>({});
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("TODOS");
  const [alunoId, setAlunoId] = useState("todos");
  const [selected, setSelected] = useState<NumberWithOwner | null>(null);

  const rows = useMemo(
    () => numbers.map((item) => overlay[item.id] ?? item),
    [numbers, overlay],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const digits = onlyDigits(query);
    return rows.filter((item) => {
      if (filter !== "TODOS" && item.status !== filter) return false;
      if (alunoId !== "todos" && item.aluno_id !== alunoId) return false;
      if (!needle) return true;
      const buyer = item.purchase?.nome_comprador.toLowerCase() ?? "";
      const phone = item.purchase?.telefone ?? "";
      return (
        String(item.numero).includes(needle) ||
        item.aluno_nome.toLowerCase().includes(needle) ||
        buyer.includes(needle) ||
        (digits.length > 0 && phone.includes(digits))
      );
    });
  }, [rows, query, filter, alunoId]);

  return (
    <section className="space-y-4">
      <div className="rounded-3xl bg-white p-4 shadow-[0_12px_30px_rgba(6,28,58,0.06)]">
        <label className="relative block">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-navy/40" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pesquisar número..."
            className="min-h-12 w-full rounded-xl border border-navy/15 bg-white pl-12 pr-4"
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["TODOS", "Todos"],
              ["DISPONIVEL", "Disponíveis"],
              ["PEGO", "Pegos"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold",
                filter === value ? "bg-navy text-white" : "bg-page text-navy",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <select
            value={alunoId}
            onChange={(event) => setAlunoId(event.target.value)}
            className="min-h-12 rounded-xl border border-navy/15 bg-white px-3"
          >
            <option value="todos">Todos os alunos visíveis</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.nome}
              </option>
            ))}
          </select>
          <NumberLegend />
        </div>
        <p className="mt-3 text-sm font-semibold text-navy/60">
          {filtered.length} número(s) encontrados
        </p>
      </div>

      <div className="grid grid-cols-6 gap-2 rounded-3xl bg-white p-4 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
        {filtered.map((item) => (
          <div key={item.id} className="flex justify-center">
            <NumberBall
              numero={item.numero}
              status={item.status}
              compact
              onClick={() => setSelected(item)}
            />
          </div>
        ))}
      </div>

      {selected ? (
        <NumberRecordModal
          key={selected.id}
          item={selected}
          canEdit
          onClose={() => setSelected(null)}
          onChanged={(next) => {
            setOverlay((current) => ({ ...current, [next.id]: next }));
            setSelected(next.status === "DISPONIVEL" ? null : next);
          }}
        />
      ) : null}
    </section>
  );
}
