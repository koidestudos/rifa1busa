export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-navy/10 ${className}`} />
  );
}

export function NumberGridSkeleton({ count = 15 }: { count?: number }) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="aspect-square rounded-full" />
      ))}
    </div>
  );
}
