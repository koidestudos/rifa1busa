"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { assignFileToInput, prepareReceiptFile } from "@/lib/receipt-image";

export function ReceiptPicker({
  required = false,
  disabled = false,
  label = "Comprovante de pagamento",
  onBusyChange,
}: {
  required?: boolean;
  disabled?: boolean;
  label?: string;
  onBusyChange?: (busy: boolean) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const assigningRef = useRef(false);
  const [fileName, setFileName] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function applyFile(file: File | undefined, cameraInput?: HTMLInputElement) {
    if (!file) return;
    setLocalError(null);
    setPreparing(true);
    onBusyChange?.(true);
    try {
      const prepared = await prepareReceiptFile(file);
      assigningRef.current = true;
      assignFileToInput(fileInputRef.current, prepared);
      assigningRef.current = false;
      setFileName(cameraInput ? "Foto do comprovante" : file.name || prepared.name);
    } catch {
      setFileName("");
      setLocalError("Não foi possível usar esta foto. Tente de novo ou envie um arquivo.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setPreparing(false);
      onBusyChange?.(false);
      if (cameraInput) cameraInput.value = "";
    }
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-navy">{label}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full border border-navy/15 bg-white px-4 text-sm font-semibold">
          <Camera className="h-5 w-5" />
          Tirar foto
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            disabled={disabled || preparing}
            onChange={(event) => {
              void applyFile(event.target.files?.[0], event.currentTarget);
            }}
          />
        </label>
        <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full border border-navy/15 bg-white px-4 text-sm font-semibold">
          <ImagePlus className="h-5 w-5" />
          Enviar arquivo
          <input
            ref={fileInputRef}
            type="file"
            name="comprovante"
            accept="image/jpeg,image/png,image/webp,image/jpg,.jpg,.jpeg,.png,.webp"
            className="sr-only"
            required={required}
            disabled={disabled || preparing}
            onChange={(event) => {
              if (assigningRef.current) return;
              void applyFile(event.target.files?.[0]);
            }}
          />
        </label>
      </div>
      <p className="mt-2 text-xs text-navy/60">JPG, JPEG, PNG, WebP. A foto da câmera é compactada antes de enviar.</p>
      {preparing ? (
        <p className="mt-1 text-sm font-semibold text-navy/70">Preparando foto...</p>
      ) : fileName ? (
        <p className="mt-1 text-sm font-semibold text-navy">Arquivo: {fileName}</p>
      ) : null}
      {localError ? (
        <p className="mt-2 rounded-2xl bg-red/10 px-4 py-3 text-sm font-semibold text-red">
          {localError}
        </p>
      ) : null}
    </div>
  );
}
