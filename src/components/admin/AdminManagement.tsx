"use client";

import { useMemo, useState, useTransition } from "react";
import type { Profile } from "@/lib/types";
import { roleLabel } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { setRoleAction } from "@/lib/actions/admin";
import { useToast } from "@/components/providers/ToastProvider";

export function AdminManagement({
  profiles,
  canManage,
}: {
  profiles: Profile[];
  canManage: boolean;
}) {
  const { notify } = useToast();
  const [selectedId, setSelectedId] = useState("");
  const [pending, startTransition] = useTransition();
  const [demote, setDemote] = useState<Profile | null>(null);

  const admins = profiles.filter((profile) => profile.role !== "student");
  const students = useMemo(
    () => profiles.filter((profile) => profile.role === "student"),
    [profiles],
  );

  if (!canManage) {
    return (
      <p className="rounded-3xl bg-white p-5 text-sm text-navy/70">
        Somente o SUPER ADMIN pode promover ou remover administradores.
      </p>
    );
  }

  return (
    <section className="space-y-4">
      <div className="card-surface rounded-3xl p-5">
        <h2 className="font-display text-2xl">Adicionar administrador</h2>
        <p className="mt-1 text-sm text-navy/70">
          O aluno continua com o painel da rifa e passa a acessar o painel administrativo.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            className="min-h-12 rounded-2xl border border-navy/15 bg-white px-3"
          >
            <option value="">Selecione um aluno</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.nome}
              </option>
            ))}
          </select>
          <Button
            disabled={!selectedId || pending}
            onClick={() => {
              startTransition(async () => {
                const result = await setRoleAction(selectedId, "admin");
                if ("error" in result) notify(result.error, "error");
                else {
                  notify("Administrador adicionado.", "success");
                  setSelectedId("");
                }
              });
            }}
          >
            Adicionar administrador
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {admins.map((admin) => (
          <article key={admin.id} className="card-surface rounded-3xl p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-xl">{admin.nome}</p>
                <p className="text-xs font-bold uppercase tracking-wide text-navy/50">
                  {roleLabel(admin.role)} · {admin.is_active ? "Ativo" : "Inativo"}
                </p>
                <p className="text-sm text-navy/60">
                  Criado em {formatDateTime(admin.created_at)}
                </p>
              </div>
              {admin.role === "admin" ? (
                <Button variant="secondary" onClick={() => setDemote(admin)}>
                  Remover cargo
                </Button>
              ) : (
                <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-bold">
                  Protegido
                </span>
              )}
            </div>
          </article>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(demote)}
        title="Remover administrador?"
        description={`${demote?.nome} voltará a ser aluno e perderá o acesso ao painel administrativo.`}
        danger
        pending={pending}
        confirmLabel="Remover cargo"
        onClose={() => setDemote(null)}
        onConfirm={() => {
          if (!demote) return;
          startTransition(async () => {
            const result = await setRoleAction(demote.id, "student");
            if ("error" in result) notify(result.error, "error");
            else notify("Cargo removido.", "success");
            setDemote(null);
          });
        }}
      />
    </section>
  );
}
