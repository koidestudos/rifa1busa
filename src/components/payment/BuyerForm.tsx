"use client";

import { useState } from "react";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { ReceiptPicker } from "@/components/payment/ReceiptPicker";
import { formatPhone } from "@/lib/format";

type BuyerFormProps = {
  pending?: boolean;
  error?: string | null;
};

export function BuyerForm({ pending = false, error = null }: BuyerFormProps) {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-4">
      <h3 className="font-display text-2xl tracking-[0.08em] text-navy">Dados do comprador</h3>
      <TextField
        name="nome"
        label="Nome completo"
        autoComplete="name"
        required
        placeholder="Ex: João da Silva"
      />
      <TextField
        name="telefone"
        label="Telefone"
        inputMode="tel"
        autoComplete="tel"
        required
        placeholder="(00) 00000-0000"
        value={phone}
        onChange={(event) => setPhone(formatPhone(event.target.value))}
      />

      <ReceiptPicker required disabled={pending} onBusyChange={setBusy} />

      {error ? (
        <p className="rounded-2xl bg-red/10 px-4 py-3 text-sm font-semibold text-red">{error}</p>
      ) : null}

      <Button type="submit" className="w-full" size="xl" disabled={pending || busy}>
        {busy ? "Preparando foto..." : pending ? "Enviando comprovante..." : "Registrar número"}
      </Button>
    </div>
  );
}
