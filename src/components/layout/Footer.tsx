import { UsaFlag } from "@/components/brand/Decor";

export function Footer() {
  return (
    <footer className="mt-auto bg-navy-deep text-white">
      <div className="flag-stripes h-1.5" />
      <div className="hero-eua relative overflow-hidden">
        <div className="relative mx-auto max-w-6xl px-4 py-10 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <UsaFlag className="h-6 w-9" />
            <UsaFlag className="h-6 w-9" />
          </div>
          <p className="font-display text-4xl tracking-[0.08em] sm:text-5xl">
            Juntos fazemos
            <span className="text-red"> mais!</span>
          </p>
          <p className="mt-3 text-sm text-white/75">
            Rifa Feira dos Países 2026 · Estados Unidos · Cada número custa R$ 5,00
          </p>
        </div>
      </div>
    </footer>
  );
}
