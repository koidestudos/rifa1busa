"use client";

import { PRIZES } from "@/lib/constants";
import { ROLETA_BACKGROUNDS, type RoletaSettings } from "@/lib/roleta";
import { cn } from "@/lib/cn";

export function RoletaSettingsPanel({
  open,
  settings,
  isSuperAdmin,
  spinning,
  onClose,
  onPatch,
  onFullscreen,
  fullscreen,
  onClearHistory,
  onReset,
}: {
  open: boolean;
  settings: RoletaSettings;
  isSuperAdmin: boolean;
  spinning: boolean;
  onClose: () => void;
  onPatch: (partial: Partial<RoletaSettings>) => void;
  onFullscreen: () => void;
  fullscreen: boolean;
  onClearHistory: () => void;
  onReset: () => void;
}) {
  if (!open) return null;

  return (
    <aside className="absolute inset-y-0 right-0 z-40 flex w-full max-w-md flex-col overflow-y-auto border-l border-white/10 bg-navy-deep/95 p-5 text-white shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-3xl tracking-[0.1em]">Configurações</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide"
        >
          Fechar
        </button>
      </div>

      <section className="mt-5 space-y-3">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-white/50">Cor do fundo</p>
        <div className="grid grid-cols-3 gap-2">
          {ROLETA_BACKGROUNDS.map((bg) => (
            <button
              key={bg.id}
              type="button"
              onClick={() => onPatch({ background: bg.id })}
              className={cn(
                "rounded-2xl border-2 px-2 py-3 text-sm font-bold",
                settings.background === bg.id ? "border-amber-300" : "border-white/10",
                bg.id === "white" || bg.id === "green" ? "text-navy-deep" : "text-white",
              )}
              style={{ background: bg.solid }}
            >
              {bg.emoji} {bg.label}
            </button>
          ))}
        </div>
      </section>

      <Toggle
        label="Fundo gradiente"
        checked={settings.gradient}
        onChange={(gradient) => onPatch({ gradient })}
      />
      <Toggle
        label="🔊 Sons"
        checked={settings.sound}
        onChange={(sound) => onPatch({ sound })}
      />
      <Toggle
        label="🎊 Confetes"
        checked={settings.confetti}
        onChange={(confetti) => onPatch({ confetti })}
      />
      <Toggle
        label="🎟️ Apenas números vendidos (PEGO)"
        checked={settings.soldOnly}
        onChange={(soldOnly) => onPatch({ soldOnly })}
      />
      <Toggle
        label="Mostrar histórico"
        checked={settings.showHistory}
        onChange={(showHistory) => onPatch({ showHistory })}
      />
      <Toggle
        label="📺 Modo transmissão"
        checked={settings.broadcast}
        onChange={(broadcast) => onPatch({ broadcast })}
      />
      <Toggle
        label="🧪 Modo teste"
        checked={settings.testMode}
        onChange={(testMode) => onPatch({ testMode })}
      />

      <label className="mt-4 block text-xs font-black uppercase tracking-[0.22em] text-white/50">
        Duração da roleta
        <select
          value={settings.durationMs}
          onChange={(event) => onPatch({ durationMs: Number(event.target.value) })}
          className="mt-2 min-h-12 w-full rounded-2xl bg-white/10 px-3 text-sm font-bold"
        >
          <option value={3500}>3,5 segundos</option>
          <option value={4500}>4,5 segundos</option>
          <option value={5500}>5,5 segundos</option>
          <option value={7000}>7 segundos</option>
          <option value={9000}>9 segundos</option>
          <option value={11000}>11 segundos</option>
        </select>
      </label>

      <label className="mt-4 block text-xs font-black uppercase tracking-[0.22em] text-white/50">
        Prêmio do sorteio
        <select
          value={settings.prizePlace}
          onChange={(event) => onPatch({ prizePlace: Number(event.target.value) })}
          className="mt-2 min-h-12 w-full rounded-2xl bg-white/10 px-3 text-sm font-bold"
        >
          {PRIZES.map((prize) => (
            <option key={prize.place} value={prize.place}>
              {prize.place}º — {prize.description}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={onFullscreen}
        className="mt-5 min-h-12 rounded-full bg-white/10 text-sm font-black uppercase tracking-wide"
      >
        {fullscreen ? "Sair da tela cheia" : "⛶ Tela cheia"}
      </button>

      <div className="mt-8 space-y-3 border-t border-white/10 pt-5">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-white/50">Testes</p>
        <button
          type="button"
          disabled={spinning}
          onClick={onClearHistory}
          className="min-h-12 w-full rounded-full bg-white/10 text-sm font-black uppercase tracking-wide disabled:opacity-50"
        >
          🗑️ Apagar histórico
        </button>
        {isSuperAdmin ? (
          <button
            type="button"
            disabled={spinning}
            onClick={onReset}
            className="min-h-12 w-full rounded-full bg-red/80 text-sm font-black uppercase tracking-wide disabled:opacity-50"
          >
            🔄 Resetar sorteios
          </button>
        ) : (
          <p className="text-xs text-white/50">O reset completo é só para o SUPER ADMIN.</p>
        )}
      </div>
    </aside>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-4 py-3 text-sm font-bold">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-amber-300"
      />
    </label>
  );
}
