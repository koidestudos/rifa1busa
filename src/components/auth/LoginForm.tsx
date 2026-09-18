"use client";

import { useState } from "react";
import { loginAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await loginAction(formData);
    if (result && "error" in result) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <TextField
        name="login"
        label="Login"
        autoComplete="username"
        required
        placeholder="seu.login"
      />
      <div>
        <TextField
          name="password"
          label="Senha"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          required
          placeholder="Sua senha"
        />
        <label className="mt-2 flex min-h-11 items-center gap-2 text-sm font-semibold text-navy/80">
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(event) => setShowPassword(event.target.checked)}
            className="h-4 w-4 accent-navy"
          />
          Mostrar senha
        </label>
      </div>
      {error ? (
        <p className="rounded-2xl bg-red/10 px-4 py-3 text-sm font-semibold text-red">{error}</p>
      ) : null}
      <Button type="submit" className="w-full" size="xl" disabled={pending}>
        {pending ? "Entrando..." : "ENTRAR"}
      </Button>
    </form>
  );
}
