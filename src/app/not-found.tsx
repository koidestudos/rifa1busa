import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PatrioticScene } from "@/components/brand/Decor";

export default function NotFound() {
  return (
    <PatrioticScene
      compact
      className="min-h-screen"
      contentClassName="flex min-h-screen items-center justify-center px-4"
    >
      <div className="max-w-lg rounded-3xl bg-white p-8 text-center text-navy">
        <h1 className="font-display text-4xl tracking-[0.08em]">Página não encontrada</h1>
        <p className="mt-2 text-navy/70">Esse endereço não existe nesta rifa.</p>
        <Link href="/" className="mt-6 inline-block">
          <Button>Voltar ao início</Button>
        </Link>
      </div>
    </PatrioticScene>
  );
}
