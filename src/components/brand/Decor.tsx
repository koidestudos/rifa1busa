import { cn } from "@/lib/cn";

export function FlagStripes({ className = "" }: { className?: string }) {
  return <div aria-hidden className={cn("flag-stripes h-2 w-full", className)} />;
}

export function UsaFlag({ className = "" }: { className?: string }) {
  return <span aria-hidden className={cn("usa-flag h-5 w-7 shrink-0", className)} />;
}

export function StarsRow({ className = "" }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2 text-gold", className)} aria-hidden>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className="text-sm">
          ★
        </span>
      ))}
    </div>
  );
}

export function Skyline({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 180" className={className} aria-hidden preserveAspectRatio="none">
      <path
        fill="currentColor"
        d="M0 180V118h28v-36h18v36h22V72h14v10h10V58h16v62h20V88h36v92H0zM180 180V96h12V70h20v26h14v84h-46zm70 0V64h18V40h12l8-18 8 18h12v24h18v116H250zm92 0V80h22V52h16v28h10v20h18v80h-66zm90 0V48h14V22h10v26h18V8h12v40h16v132h-70zm96 0v-70h20V78h28v32h16v80h-64zm86 0V60h18V36h22v24h14V88h20v92h-74zm98 0V44h12V18h20v26h16v136h-48zm72 0V92h36V60h18v32h22v88h-76zm98 0V70h16V42h24v28h20v110h-60zm88 0V54h40v22h18v104h-58zM1100 180V86h28V50h22v36h18v94h-68zM0 148h1200v32H0z"
      />
    </svg>
  );
}

export function PatrioticScene({
  children,
  className = "",
  contentClassName = "",
  compact = false,
}: {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("hero-eua relative overflow-hidden text-white", className)}>
      <div className="hero-stripes pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.16),transparent_28%)]" />
      <div
        className={cn(
          "relative z-10",
          compact ? "" : "px-4 py-12 sm:py-16",
          contentClassName,
        )}
      >
        {children}
      </div>
      <Skyline className="pointer-events-none absolute inset-x-0 bottom-0 h-16 text-navy-deep/80 sm:h-24" />
    </div>
  );
}
