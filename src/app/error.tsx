"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-display text-4xl tracking-[0.08em]">Algo deu errado</h1>
      <p className="mt-3 text-navy/70">Recarregue a página ou tente novamente em instantes.</p>
      <Button className="mt-6" onClick={reset}>
        Tentar de novo
      </Button>
    </main>
  );
}
