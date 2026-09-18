"use client";

import { useState } from "react";
import { Expand, ExternalLink, X } from "lucide-react";
import { getSignedReceiptUrl } from "@/lib/actions/numbers";
import { formatDateTime, formatPhone } from "@/lib/format";
import { formatBRL } from "@/lib/format";
import type { NumberWithOwner } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";

export function ReceiptViewer({
  item,
  onClose,
}: {
  item: NumberWithOwner;
  onClose: () => void;
}) {
  const { notify } = useToast();
  const [url, setUrl] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const purchase = item.purchase;

  async function loadReceipt() {
    if (!purchase?.comprovante_url) {
      notify("Este registro não tem comprovante.", "info");
      return;
    }
    setLoading(true);
    const result = await getSignedReceiptUrl(item.id);
    setLoading(false);
    if ("error" in result) {
      notify(result.error, "error");
      return;
    }
    setUrl(result.url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-deep/70 p-0 sm:items-center sm:p-4">
      <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-display text-3xl tracking-[0.06em] text-navy">Número {item.numero}</p>
              {item.status === "PEGO" ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                  PEGO
                </span>
              ) : null}
            </div>
            <p className="text-sm text-navy/60">Aluno responsável: {item.aluno_nome}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-navy/10"
            aria-label="Fechar"
          >
            <X />
          </button>
        </div>

        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {purchase ? (
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-semibold text-navy/50">Comprador</dt>
                <dd className="text-base font-semibold">{purchase.nome_comprador}</dd>
              </div>
              <div>
                <dt className="font-semibold text-navy/50">Telefone</dt>
                <dd className="text-base font-semibold">{formatPhone(purchase.telefone)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-navy/50">Valor</dt>
                <dd className="text-base font-semibold">{formatBRL(Number(purchase.valor))}</dd>
              </div>
              <div>
                <dt className="font-semibold text-navy/50">Data</dt>
                <dd className="text-base font-semibold">{formatDateTime(purchase.created_at)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm">Este número está disponível.</p>
          )}

          <div className="space-y-3">
            <Button className="w-full" onClick={loadReceipt} disabled={loading}>
              {loading ? "Carregando..." : "Abrir comprovante"}
            </Button>
            {url ? (
              <>
                <Button className="w-full" variant="secondary" onClick={() => setFullscreen(true)}>
                  <Expand className="h-4 w-4" />
                  Tela cheia
                </Button>
                <a href={url} target="_blank" rel="noreferrer" className="block">
                  <Button className="w-full" variant="secondary">
                    <ExternalLink className="h-4 w-4" />
                    Abrir em nova aba
                  </Button>
                </a>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="Comprovante" className="w-full rounded-2xl border border-navy/10" />
              </>
            ) : null}
          </div>
        </div>
      </div>

      {fullscreen && url ? (
        <div className="fixed inset-0 z-[70] bg-black p-4">
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white px-4 py-2 font-bold"
            onClick={() => setFullscreen(false)}
          >
            Fechar
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Comprovante em tela cheia" className="h-full w-full object-contain" />
        </div>
      ) : null}
    </div>
  );
}
