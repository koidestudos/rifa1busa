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
      <div className="flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-[0_12px_30px_rgba(6,28,58,0.06)] sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1">
          <h2 className="font-display text-2xl tracking-[0.08em]">Administradores</h2>
          <p className="mt-1 text-sm text-navy/70">
            O aluno continua com o painel da rifa e passa a acessar o painel administrativo.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            className="min-h-12 rounded-xl border border-navy/15 bg-white px-3"
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

      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_12px_30px_rgba(6,28,58,0.06)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-page text-left text-xs font-bold uppercase tracking-wide text-navy/50">
              <tr>
                <th className="px-5 py-3">Nome</th>
                <th className="px-3 py-3">Cargo</th>
                <th className="px-3 py-3">Criado em</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-5 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="border-t border-navy/5">
                  <td className="px-5 py-3 font-semibold">{admin.nome}</td>
                  <td className="px-3 py-3">
                    <span
                      className={
                        admin.role === "super_admin"
                          ? "rounded-full bg-gold/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-navy"
                          : "rounded-full bg-navy/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-navy"
                      }
                    >
                      {roleLabel(admin.role)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-navy/70">{formatDateTime(admin.created_at)}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                      {admin.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {admin.role === "admin" ? (
                      <Button size="md" variant="secondary" onClick={() => setDemote(admin)}>
                        Remover cargo
                      </Button>
                    ) : (
                      <span className="text-xs font-bold text-navy/40">Protegido</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
