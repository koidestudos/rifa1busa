"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { PIX_KEY, PIX_QR_IMAGE } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";

type PixCardProps = {
  qrDataUrl?: string | null;
  compact?: boolean;
};

export function PixCard({ qrDataUrl = null, compact = false }: PixCardProps) {
  const { notify } = useToast();
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(false);
  const customQr = PIX_QR_IMAGE.trim();

  const imageSrc = useMemo(() => {
    if (customQr) return customQr;
    if (qrDataUrl) return qrDataUrl;
    return null;
  }, [customQr, qrDataUrl]);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoom(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [zoom]);

  async function copyPix() {
    await navigator.clipboard.writeText(PIX_KEY);
    setCopied(true);
    notify("PIX copiado!", "success");
    window.setTimeout(() => setCopied(false), 2000);
  }

  const qrButton = imageSrc ? (
    <button
      type="button"
      onClick={() => setZoom(true)}
      className="group relative flex h-full w-full items-center justify-center"
      aria-label="Ampliar QR Code do PIX"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageSrc} alt="QR Code PIX" className="h-full w-full object-contain" />
    </button>
  ) : (
    <div className="px-3 text-center text-xs font-semibold text-navy/60">Gerando QR Code do PIX…</div>
  );

  const hint = imageSrc ? (
    <p className="mt-2 text-center text-[11px] font-bold uppercase tracking-wide text-navy/55">
      Clique para ampliar
    </p>
  ) : null;

  const overlay = zoom && imageSrc ? (
    <div
      className="qr-overlay fixed inset-0 z-[90] flex items-center justify-center bg-navy-deep/80 p-4"
      onClick={() => setZoom(false)}
      role="dialog"
      aria-modal="true"
      aria-label="QR Code ampliado"
    >
      <button
        type="button"
        onClick={() => setZoom(false)}
        className="absolute right-4 top-4 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white text-navy shadow-lg"
        aria-label="Fechar"
      >
        <X />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt="QR Code PIX ampliado"
        className="qr-overlay-image max-h-[min(85vh,90vw)] w-[min(92vw,28rem)] max-w-full rounded-3xl bg-white object-contain p-3 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  ) : null;

  if (compact) {
    return (
      <>
        <section className="flex items-center gap-4 rounded-2xl border border-navy/10 bg-page p-3">
          <div className="shrink-0">
            <div className="h-28 w-28 overflow-hidden rounded-xl bg-white p-1">{qrButton}</div>
            {hint}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl tracking-[0.06em] text-navy">Pague R$ 5,00 via PIX</p>
            <p className="mt-1 truncate text-xs font-semibold text-navy/55">{PIX_KEY}</p>
            <Button className="mt-3 w-full" size="md" variant="secondary" onClick={copyPix}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copiar PIX
            </Button>
          </div>
        </section>
        {overlay}
      </>
    );
  }

  return (
    <>
      <section className="rounded-3xl bg-navy p-5 text-white">
        <p className="font-display text-2xl tracking-[0.08em]">Pague R$ 5,00 via PIX</p>
        <p className="mt-1 text-sm text-white/75">Escaneie o QR Code ou copie a chave PIX abaixo.</p>
        <div className="mt-4 rounded-3xl bg-white p-4 text-navy">
          <div className="mx-auto flex min-h-52 max-w-52 items-center justify-center rounded-2xl bg-cream">
            {imageSrc ? (
              <button
                type="button"
                onClick={() => setZoom(true)}
                className="relative"
                aria-label="Ampliar QR Code do PIX"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc}
                  alt="QR Code PIX"
                  className="h-52 w-52 rounded-2xl object-contain"
                />
              </button>
            ) : (
              <div className="px-4 text-center text-sm font-semibold text-navy/60">
                Gerando QR Code do PIX…
              </div>
            )}
          </div>
          {hint}
        </div>
        <div className="mt-4 rounded-2xl bg-white/10 p-4">
          <p className="text-xs uppercase tracking-wide text-white/70">PIX</p>
          <p className="break-all text-sm font-semibold">{PIX_KEY}</p>
          <Button className="mt-3 w-full" variant="gold" onClick={copyPix}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Copiar PIX
          </Button>
        </div>
      </section>
      {overlay}
    </>
  );
}
