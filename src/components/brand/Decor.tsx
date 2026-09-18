export function FlagStripes({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`flag-stripes h-2 w-full ${className}`} />;
}

export function StarsRow({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 text-gold ${className}`} aria-hidden>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className="text-sm">
          ★
        </span>
      ))}
    </div>
  );
}

export function LibertySilhouette({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 420"
      className={className}
      aria-hidden
      fill="currentColor"
    >
      <path d="M109 12c6 0 14 8 16 18 2 8-2 16-2 16s8 2 10 10-4 12-4 12 14 18 14 34c0 12-8 20-14 24l6 14c12 6 22 20 22 38 0 10-4 18-10 24l8 70c2 16-4 28-14 34l6 48h-28l-4 36H99l-6-36H67l6-48c-10-6-16-18-14-34l8-70c-6-6-10-14-10-24 0-18 10-32 22-38l6-14c-6-4-14-12-14-24 0-16 14-34 14-34s-6-4-4-12 10-10 10-10-4-8-2-16c2-10 10-18 16-18z" />
      <rect x="86" y="372" width="48" height="36" rx="4" />
    </svg>
  );
}
