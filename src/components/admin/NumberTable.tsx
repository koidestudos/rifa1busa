"use client";

import { useMemo, useState, useTransition } from "react";
import { Search } from "lucide-react";
import type { NumberWithOwner, Profile } from "@/lib/types";
import { NumberBall } from "@/components/numbers/NumberBall";
import { NumberLegend } from "@/components/numbers/NumberGrid";
import { ReceiptViewer } from "@/components/admin/ReceiptViewer";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { onlyDigits } from "@/lib/format";
import {
  deleteRegistroAction,
  markNumberTakenAction,
  releaseNumberAction,
} from "@/lib/actions/admin";
import { useToast } from "@/components/providers/ToastProvider";
import { cn } from "@/lib/cn";

type Filter = "TODOS" | "DISPONIVEL" | "PEGO";

export function NumberTable({
  numbers,
  students,
}: {
  numbers: NumberWithOwner[];
  students: Pick<Profile, "id" | "nome">[];
}) {
  const { notify } = useToast();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("TODOS");
  const [alunoId, setAlunoId] = useState("todos");
  const [selected, setSelected] = useState<NumberWithOwner | null>(null);
  const [releaseTarget, setReleaseTarget] = useState<NumberWithOwner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NumberWithOwner | null>(null);
  const [takeTarget, setTakeTarget] = useState<NumberWithOwner | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const digits = onlyDigits(query);
    return numbers.filter((item) => {
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
  }, [numbers, query, filter, alunoId]);

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
            <option value="todos">Todos os alunos</option>
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
          <button
            key={item.id}
            type="button"
            onClick={() => setSelected(item)}
            className="flex justify-center"
            aria-label={`Número ${item.numero}, ${item.aluno_nome}`}
          >
            <NumberBall numero={item.numero} status={item.status} compact />
          </button>
        ))}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-40 bg-navy-deep/50" onClick={() => setSelected(null)}>
          <div
            className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="font-display text-3xl tracking-[0.06em]">Número {selected.numero}</p>
            <p className="text-sm text-navy/70">Aluno: {selected.aluno_nome}</p>
            <p className="mt-1 text-sm font-bold">
              Status: {selected.status === "PEGO" ? "PEGO" : "DISPONÍVEL"}
            </p>
            <div className="mt-4 grid gap-3">
              {selected.status === "PEGO" ? (
                <>
                  <ReceiptDetailsButton item={selected} />
                  <Button variant="secondary" onClick={() => setReleaseTarget(selected)}>
                    Marcar como disponível
                  </Button>
                  {selected.purchase ? (
                    <Button variant="danger" onClick={() => setDeleteTarget(selected)}>
                      Cancelar pagamento
                    </Button>
                  ) : null}
                </>
              ) : (
                <Button onClick={() => setTakeTarget(selected)}>Marcar como PEGO</Button>
              )}
              <Button variant="secondary" onClick={() => setSelected(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(releaseTarget)}
        title="Liberar número?"
        description="O número voltará a ficar DISPONÍVEL e o registro do comprador será removido."
        danger
        pending={pending}
        confirmLabel="Liberar"
        onClose={() => setReleaseTarget(null)}
        onConfirm={() => {
          if (!releaseTarget) return;
          startTransition(async () => {
            const result = await releaseNumberAction(releaseTarget.id);
            if ("error" in result) notify(result.error, "error");
            else notify("Número liberado.", "success");
            setReleaseTarget(null);
            setSelected(null);
          });
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Excluir registro?"
        description="Essa ação remove o comprador e libera o número para uma nova venda."
        danger
        pending={pending}
        confirmLabel="Excluir"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget?.purchase) return;
          startTransition(async () => {
            const result = await deleteRegistroAction(deleteTarget.purchase!.id);
            if ("error" in result) notify(result.error, "error");
            else notify("Registro excluído.", "success");
            setDeleteTarget(null);
            setSelected(null);
          });
        }}
      />

      {takeTarget ? (
        <ManualTakeModal
          item={takeTarget}
          onClose={() => setTakeTarget(null)}
          onDone={() => {
            setTakeTarget(null);
            setSelected(null);
          }}
        />
      ) : null}
    </section>
  );
}

function ReceiptDetailsButton({ item }: { item: NumberWithOwner }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Ver detalhes e comprovante
      </Button>
      {open ? <ReceiptViewer item={item} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function ManualTakeModal({
  item,
  onClose,
  onDone,
}: {
  item: NumberWithOwner;
  onClose: () => void;
  onDone: () => void;
}) {
  const { notify } = useToast();
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    const result = await markNumberTakenAction(item.id, formData);
    setPending(false);
    if ("error" in result) {
      notify(result.error, "error");
      return;
    }
    notify("Número marcado como PEGO.", "success");
    onDone();
  }

  return (
    <div className="fixed inset-0 z-[55] flex items-end bg-navy-deep/60 p-4 sm:items-center">
      <form action={onSubmit} className="w-full max-w-md rounded-3xl bg-white p-5">
        <h3 className="font-display text-2xl tracking-[0.06em]">Marcar {item.numero} como PEGO</h3>
        <div className="mt-4 space-y-3">
          <TextField name="nome" label="Nome do comprador" required />
          <TextField name="telefone" label="Telefone" required placeholder="(00) 00000-0000" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Confirmar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
