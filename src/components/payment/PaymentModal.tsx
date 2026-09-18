"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { X } from "lucide-react";
import { PIX_KEY, TICKET_PRICE } from "@/lib/constants";
import { formatBRL } from "@/lib/format";
import { PixCard } from "@/components/payment/PixCard";
import { BuyerForm } from "@/components/payment/BuyerForm";
import { registerNumberAction } from "@/lib/actions/numbers";
import { useToast } from "@/components/providers/ToastProvider";

type PaymentModalProps = {
  open: boolean;
  numeroId: string;
  numero: number;
  onClose: () => void;
  onSuccess: () => void;
};

export function PaymentModal({
  open,
  numeroId,
  numero,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const { notify } = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    QRCode.toDataURL(PIX_KEY, { margin: 1, width: 320 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await registerNumberAction(numeroId, formData);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      notify(result.error, "error");
      return;
    }
    notify("✓ Número registrado com sucesso! 🇺🇸", "success");
    onSuccess();
  }

  return (
    <div className="fixed inset-0 z-50 bg-navy-deep/70">
      <div className="h-full overflow-y-auto">
        <div className="mx-auto min-h-full w-full max-w-lg bg-white sm:my-6 sm:min-h-0 sm:rounded-3xl">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-navy/5 bg-white px-4 py-4 sm:rounded-t-3xl">
            <p className="font-display text-2xl tracking-[0.08em] text-navy">Comprar número</p>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-navy/5"
              aria-label="Fechar"
            >
              <X />
            </button>
          </div>

          <form action={onSubmit} className="space-y-5 p-4 pb-10">
            <div>
              <p className="font-display text-3xl tracking-[0.06em] text-navy">Número {numero}</p>
              <p className="text-sm font-semibold text-navy/60">Valor: {formatBRL(TICKET_PRICE)}</p>
            </div>
            <p className="text-sm leading-6 text-navy/70">
              Para registrar este número, faça o pagamento de {formatBRL(TICKET_PRICE)} pelo PIX e
              envie o comprovante abaixo.
            </p>
            <PixCard qrDataUrl={qrDataUrl} compact />
            <BuyerForm pending={pending} error={error} />
          </form>
        </div>
      </div>
    </div>
  );
}
