"use client";

import { useEffect, useState } from "react";
import { Expand, X } from "lucide-react";
import QRCode from "qrcode";
import { PixCard } from "@/components/payment/PixCard";
import { ReceiptPicker } from "@/components/payment/ReceiptPicker";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/providers/ToastProvider";
import {
  deleteNumberRegistroAction,
  getSignedReceiptUrl,
  registerNumberAction,
  updateNumberAction,
} from "@/lib/actions/numbers";
import { PIX_KEY, TICKET_PRICE } from "@/lib/constants";
import { formatBRL, formatDateTime, formatPhone } from "@/lib/format";
import { uploadActionErrorMessage } from "@/lib/receipt-image";
import type { NumberWithOwner } from "@/lib/types";

type NumberRecordModalProps = {
  item: NumberWithOwner;
  canEdit: boolean;
  onClose: () => void;
  onChanged: (item: NumberWithOwner) => void;
};

export function NumberRecordModal({
  item,
  canEdit,
  onClose,
  onChanged,
}: NumberRecordModalProps) {
  const { notify } = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nome, setNome] = useState(item.purchase?.nome_comprador ?? "");
  const [telefone, setTelefone] = useState(
    item.purchase ? formatPhone(item.purchase.telefone) : "",
  );
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const taken = item.status === "PEGO";
  const purchase = item.purchase ?? null;
  const current = item;

  useEffect(() => {
    if (taken) return;
    QRCode.toDataURL(PIX_KEY, { margin: 1, width: 320 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [taken]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (fullscreen) setFullscreen(false);
        else if (confirmDelete) setConfirmDelete(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, fullscreen, confirmDelete]);

  async function loadReceipt() {
    setPending(true);
    const result = await getSignedReceiptUrl(current.id);
    setPending(false);
    if ("error" in result) {
      notify(result.error, "error");
      return;
    }
    setReceiptUrl(result.url);
  }

  async function onRegister(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      const result = await registerNumberAction(current.id, formData);
      if ("error" in result) {
        setError(result.error);
        notify(result.error, "error");
        return;
      }
      notify(result.message, "success");
      onChanged({
        ...current,
        status: "PEGO",
        purchase: {
          id: current.id,
          numero_id: current.id,
          aluno_id: current.aluno_id,
          nome_comprador: String(formData.get("nome") ?? ""),
          telefone: String(formData.get("telefone") ?? ""),
          comprovante_url: "firestore",
          valor: TICKET_PRICE,
          status: "PEGO",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
      onClose();
    } catch (caught) {
      const message = uploadActionErrorMessage(caught);
      setError(message);
      notify(message, "error");
    } finally {
      setPending(false);
    }
  }

  async function onSave(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      const result = await updateNumberAction(current.id, formData);
      if ("error" in result) {
        setError(result.error);
        notify(result.error, "error");
        return;
      }
      notify("Alterações salvas com sucesso!", "success");
      onChanged({
        ...current,
        purchase: purchase
          ? {
              ...purchase,
              nome_comprador: String(formData.get("nome") ?? purchase.nome_comprador),
              telefone: String(formData.get("telefone") ?? purchase.telefone),
              updated_at: new Date().toISOString(),
            }
          : purchase,
      });
      onClose();
    } catch (caught) {
      const message = uploadActionErrorMessage(caught);
      setError(message);
      notify(message, "error");
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    setPending(true);
    const result = await deleteNumberRegistroAction(current.id);
    setPending(false);
    if ("error" in result) {
      notify(result.error, "error");
      return;
    }
    notify(result.message, "success");
    setConfirmDelete(false);
    onChanged({
      ...current,
      status: "DISPONIVEL",
      purchase: null,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-navy-deep/70">
      <div className="h-full overflow-y-auto">
        <div className="mx-auto min-h-full w-full max-w-lg bg-white sm:my-6 sm:min-h-0 sm:rounded-3xl">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-navy/5 bg-white px-4 py-4 sm:rounded-t-3xl">
            <p className="font-display text-2xl tracking-[0.08em] text-navy">
              {taken ? "Registro do número" : "Número disponível"}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-navy/5"
              aria-label="Fechar"
            >
              <X />
            </button>
          </div>

          <div className="space-y-5 p-4 pb-10">
            <div>
              <p className="font-display text-4xl tracking-[0.06em] text-navy">Número {current.numero}</p>
              <p className="mt-1 text-sm font-semibold text-navy/65">
                Aluno responsável: {current.aluno_nome}
              </p>
              <p className="mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide">
                {taken ? (
                  <span className="rounded-full bg-red/10 px-3 py-1 text-red">PEGO</span>
                ) : (
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-800">
                    Número disponível
                  </span>
                )}
              </p>
            </div>

            {taken && purchase ? (
              <form action={onSave} className="space-y-4">
                <dl className="grid gap-3 rounded-2xl bg-page p-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold text-navy/50">Valor</dt>
                    <dd className="text-base font-bold">{formatBRL(Number(purchase.valor))}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-navy/50">Data e hora</dt>
                    <dd className="text-base font-bold">{formatDateTime(purchase.created_at)}</dd>
                  </div>
                </dl>

                <TextField
                  name="nome"
                  label="Nome do comprador"
                  required
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  readOnly={!canEdit}
                />
                <TextField
                  name="telefone"
                  label="Telefone"
                  inputMode="tel"
                  required
                  value={telefone}
                  onChange={(event) => setTelefone(formatPhone(event.target.value))}
                  readOnly={!canEdit}
                />

                <div>
                  <p className="mb-1.5 text-sm font-semibold text-navy">Comprovante</p>
                  <div className="flex flex-col gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={loadReceipt}
                      disabled={pending || !purchase.comprovante_url}
                    >
                      {pending ? "Carregando..." : "Ver comprovante"}
                    </Button>
                    {receiptUrl ? (
                      <>
                        <Button type="button" variant="secondary" onClick={() => setFullscreen(true)}>
                          <Expand className="h-4 w-4" />
                          Abrir em tamanho maior
                        </Button>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={receiptUrl}
                          alt="Comprovante de pagamento"
                          className="w-full cursor-zoom-in rounded-2xl border border-navy/10"
                          onClick={() => setFullscreen(true)}
                        />
                      </>
                    ) : null}
                  </div>

                  {canEdit ? (
                    <div className="mt-4">
                      <ReceiptPicker
                        disabled={pending}
                        onBusyChange={setBusy}
                        label="Substituir comprovante (opcional)"
                      />
                    </div>
                  ) : null}
                </div>

                {error ? (
                  <p className="rounded-2xl bg-red/10 px-4 py-3 text-sm font-semibold text-red">
                    {error}
                  </p>
                ) : null}

                {canEdit ? (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button type="submit" disabled={pending || busy}>
                      {busy ? "Preparando foto..." : pending ? "Salvando..." : "Concluído"}
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      disabled={pending}
                      onClick={() => setConfirmDelete(true)}
                    >
                      Excluir
                    </Button>
                  </div>
                ) : null}
              </form>
            ) : (
              <div className="space-y-4">
                <p className="rounded-2xl bg-page px-4 py-3 text-sm font-semibold text-navy/70">
                  Este número ainda não foi registrado.
                </p>
                {canEdit ? (
                  <form action={onRegister} className="space-y-4">
                    <p className="text-sm leading-6 text-navy/70">
                      Para registrar este número, faça o pagamento de {formatBRL(TICKET_PRICE)} pelo
                      PIX e envie o comprovante abaixo.
                    </p>
                    <PixCard qrDataUrl={qrDataUrl} compact />
                    <TextField name="nome" label="Nome completo" autoComplete="name" required />
                    <TextField
                      name="telefone"
                      label="Telefone"
                      inputMode="tel"
                      required
                      placeholder="(00) 00000-0000"
                      value={telefone}
                      onChange={(event) => setTelefone(formatPhone(event.target.value))}
                    />
                    <ReceiptPicker required disabled={pending} onBusyChange={setBusy} />
                    {error ? (
                      <p className="rounded-2xl bg-red/10 px-4 py-3 text-sm font-semibold text-red">
                        {error}
                      </p>
                    ) : null}
                    <Button type="submit" className="w-full" size="xl" disabled={pending || busy}>
                      {busy
                        ? "Preparando foto..."
                        : pending
                          ? "Enviando comprovante..."
                          : "Registrar número"}
                    </Button>
                  </form>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {fullscreen && receiptUrl ? (
        <div
          className="fixed inset-0 z-[80] bg-black/90 p-4"
          onClick={() => setFullscreen(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white px-4 py-2 font-bold"
            onClick={() => setFullscreen(false)}
          >
            Fechar
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={receiptUrl}
            alt="Comprovante em tamanho maior"
            className="h-full w-full object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        title="Tem certeza que deseja excluir este registro?"
        description={
          <>
            <p>Esta ação vai liberar novamente o número e remover os dados do comprador.</p>
          </>
        }
        danger
        pending={pending}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onClose={() => setConfirmDelete(false)}
        onConfirm={onDelete}
      />
    </div>
  );
}
