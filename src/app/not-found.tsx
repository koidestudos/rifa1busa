import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <p className="text-4xl">🇺🇸</p>
      <h1 className="mt-3 font-display text-3xl">Página não encontrada</h1>
      <p className="mt-2 text-navy/70">Esse endereço não existe nesta rifa.</p>
      <Link href="/" className="mt-6 inline-block">
        <Button>Voltar ao início</Button>
      </Link>
    </main>
  );
}
