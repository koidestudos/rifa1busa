import { formatDateTime } from "@/lib/format";

export function LoginStatusBadge({
  hasLoggedIn,
  firstLoginAt,
  lastLoginAt,
  compact = false,
}: {
  hasLoggedIn: boolean;
  firstLoginAt?: string | null;
  lastLoginAt?: string | null;
  compact?: boolean;
}) {
  if (!hasLoggedIn) {
    return (
      <span className="inline-flex items-center rounded-full bg-red/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-red">
        Ainda não entrou
      </span>
    );
  }

  const when = firstLoginAt ?? lastLoginAt;

  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <span className="inline-flex items-center rounded-full bg-navy px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white">
        Já entrou
      </span>
      {!compact && when ? (
        <span className="text-[11px] font-semibold text-navy/55">
          Primeiro acesso: {formatDateTime(when)}
        </span>
      ) : null}
    </span>
  );
}
