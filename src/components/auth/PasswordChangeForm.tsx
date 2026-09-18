"use client";

import { useState } from "react";
import { changePasswordAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

export function PasswordChangeForm({ firstLogin = false }: { firstLogin?: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await changePasswordAction(formData);
    if (result && "error" in result) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-4">
      {firstLogin ? (
        <p className="rounded-2xl bg-gold/20 px-4 py-3 text-sm leading-6 text-navy">
          Este é o seu primeiro acesso. Por segurança, escolha uma senha nova antes de
          continuar.
        </p>
      ) : null}
      <TextField
        name="password"
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        required
        placeholder="Mínimo 8 caracteres, com letras e números"
      />
      <TextField
        name="confirm"
        label="Confirmar nova senha"
        type="password"
        autoComplete="new-password"
        required
      />
      {error ? (
        <p className="rounded-2xl bg-red/10 px-4 py-3 text-sm font-semibold text-red">{error}</p>
      ) : null}
      <Button type="submit" className="w-full" size="xl" disabled={pending}>
        {pending ? "Salvando..." : "Salvar nova senha"}
      </Button>
    </form>
  );
}
