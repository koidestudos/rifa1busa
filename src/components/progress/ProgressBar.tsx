export function ProgressBar({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label?: string;
}) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      {label ? (
        <div className="mb-2 flex items-center justify-between text-sm font-semibold">
          <span>{label}</span>
          <span>{percent}%</span>
        </div>
      ) : null}
      <div className="h-3 overflow-hidden rounded-full bg-navy/10">
        <div
          className="h-full rounded-full bg-linear-to-r from-red to-navy transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
