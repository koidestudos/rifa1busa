"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
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
      <div className="relative">
        <TextField
          name="password"
          label="Senha"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          required
          placeholder="Sua senha"
        />
        <button
          type="button"
          className="absolute right-3 top-9 inline-flex min-h-10 min-w-10 items-center justify-center text-navy/60"
          onClick={() => setShowPassword((value) => !value)}
          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
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
