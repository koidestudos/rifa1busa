"use client";

import { useState } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { formatPhone } from "@/lib/format";

type BuyerFormProps = {
  pending?: boolean;
  error?: string | null;
};

export function BuyerForm({ pending = false, error = null }: BuyerFormProps) {
  const [phone, setPhone] = useState("");
  const [fileName, setFileName] = useState("");

  return (
    <div className="space-y-4">
      <h3 className="font-display text-2xl text-navy">Dados do comprador</h3>
      <TextField
        name="nome"
        label="Nome completo"
        autoComplete="name"
        required
        placeholder="Nome de quem comprou o número"
      />
      <TextField
        name="telefone"
        label="Número de telefone"
        inputMode="tel"
        autoComplete="tel"
        required
        placeholder="(00) 00000-0000"
        value={phone}
        onChange={(event) => setPhone(formatPhone(event.target.value))}
      />

      <div>
        <p className="mb-1.5 text-sm font-semibold text-navy">Comprovante de pagamento</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-navy/15 bg-white px-4 font-semibold">
            <Camera className="h-5 w-5" />
            Tirar foto
            <input
              type="file"
              name="comprovante_camera"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              capture="environment"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const transfer = new DataTransfer();
                transfer.items.add(file);
                const hidden = event.currentTarget
                  .closest("form")
                  ?.querySelector<HTMLInputElement>('input[name="comprovante"]');
                if (hidden) hidden.files = transfer.files;
                setFileName(file.name);
              }}
            />
          </label>
          <label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-navy/15 bg-white px-4 font-semibold">
            <ImagePlus className="h-5 w-5" />
            Enviar imagem
            <input
              type="file"
              name="comprovante"
              accept="image/jpeg,image/png,image/webp,image/jpg,.jpg,.jpeg,.png,.webp"
              className="sr-only"
              onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-navy/60">JPG, JPEG, PNG ou WebP · até 8 MB</p>
        {fileName ? (
          <p className="mt-1 text-sm font-semibold text-navy">Arquivo: {fileName}</p>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-2xl bg-red/10 px-4 py-3 text-sm font-semibold text-red">{error}</p>
      ) : null}

      <Button type="submit" className="w-full" size="xl" disabled={pending}>
        {pending ? "Enviando comprovante..." : "REGISTRAR NÚMERO"}
      </Button>
    </div>
  );
}
