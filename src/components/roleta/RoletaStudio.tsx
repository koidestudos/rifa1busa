"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clearSorteioHistoryAction,
  drawSorteioAction,
  resetSorteiosAction,
} from "@/lib/actions/sorteios";
import { PRIZES } from "@/lib/constants";
import { cn } from "@/lib/cn";
import {
  easeOutQuint,
  eligibleRoletaNumbers,
  extraSpinsForDuration,
  isLightRoletaBackground,
  prizeMeta,
  roletaBackground,
  targetRotation,
} from "@/lib/roleta";
import type { RoletaNumber, SorteioRecord } from "@/lib/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/providers/ToastProvider";
import { RoletaConfetti } from "@/components/roleta/RoletaConfetti";
import { RoletaHistory } from "@/components/roleta/RoletaHistory";
import { RoletaResultModal } from "@/components/roleta/RoletaResultModal";
import { RoletaSettingsPanel } from "@/components/roleta/RoletaSettingsPanel";
import { RoletaWheel } from "@/components/roleta/RoletaWheel";
import { playStopSound, playWinSound, startSpinSound } from "@/components/roleta/roleta-sounds";
import { useRoletaSettings } from "@/components/roleta/useRoletaSettings";

export function RoletaStudio({
  isSuperAdmin,
  initialNumbers,
  initialHistory,
}: {
  isSuperAdmin: boolean;
  initialNumbers: RoletaNumber[];
  initialHistory: SorteioRecord[];
}) {
  const { notify } = useToast();
  const { settings, patch } = useRoletaSettings();
  const [numbers, setNumbers] = useState(initialNumbers);
  const [history, setHistory] = useState(initialHistory);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<SorteioRecord | null>(null);
  const [confettiOn, setConfettiOn] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [confirm, setConfirm] = useState<"clear" | "reset1" | "reset2" | null>(null);
  const [confirmPending, setConfirmPending] = useState(false);
  const rotationRef = useRef(0);
  const spinAudioRef = useRef<{ stop: () => void } | null>(null);

  const light = isLightRoletaBackground(settings.background);
  const bg = roletaBackground(settings.background);
  const prize = prizeMeta(settings.prizePlace);
  const orderedNumbers = useMemo(
    () => [...numbers].sort((a, b) => a.numero - b.numero),
    [numbers],
  );
  const eligible = useMemo(
    () => eligibleRoletaNumbers(orderedNumbers, settings.soldOnly),
    [orderedNumbers, settings.soldOnly],
  );

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add("roleta-live");
    body.classList.add("roleta-live");
    return () => {
      html.classList.remove("roleta-live");
      body.classList.remove("roleta-live");
    };
  }, []);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      notify("Não foi possível alterar a tela cheia neste navegador.", "error");
    }
  }, [notify]);

  const animateTo = useCallback(
    (winnerNumero: number, durationMs: number) =>
      new Promise<void>((resolve) => {
        const winnerIndex = orderedNumbers.findIndex((item) => item.numero === winnerNumero);
        if (winnerIndex < 0) {
          resolve();
          return;
        }
        const from = rotationRef.current;
        const to = targetRotation(
          from,
          winnerIndex,
          orderedNumbers.length,
          extraSpinsForDuration(durationMs),
        );
        const started = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - started) / durationMs);
          const value = from + (to - from) * easeOutQuint(t);
          rotationRef.current = value;
          setRotation(value);
          if (t < 1) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      }),
    [orderedNumbers],
  );

  const handleDraw = useCallback(async () => {
    if (spinning || pending || result) return;
    if (eligible.length === 0) {
      notify(
        settings.soldOnly
          ? "Não há números PEGO disponíveis para sortear."
          : "Não há números disponíveis para sortear.",
        "error",
      );
      return;
    }

    setPending(true);
    const response = await drawSorteioAction({
      soldOnly: settings.soldOnly,
      prizePlace: settings.prizePlace,
      testMode: settings.testMode,
    });

    if ("error" in response) {
      setPending(false);
      notify(response.error, "error");
      return;
    }

    setHistory(response.history);
    setSpinning(true);

    if (settings.sound) {
      spinAudioRef.current = await startSpinSound(settings.durationMs);
    }

    await animateTo(response.sorteio.numero, settings.durationMs);
    spinAudioRef.current?.stop();
    spinAudioRef.current = null;

    if (settings.sound) {
      await playStopSound();
      await playWinSound();
    }
    if (settings.confetti) {
      setConfettiOn(false);
      window.requestAnimationFrame(() => setConfettiOn(true));
    }

    setNumbers(response.numbers);
    setResult(response.sorteio);
    setSpinning(false);
    setPending(false);
  }, [
    animateTo,
    eligible.length,
    notify,
    pending,
    result,
    settings.confetti,
    settings.durationMs,
    settings.prizePlace,
    settings.soldOnly,
    settings.sound,
    settings.testMode,
    spinning,
  ]);

  const closeResult = useCallback(() => {
    setResult(null);
    setConfettiOn(false);
  }, []);

  async function handleClear() {
    setConfirmPending(true);
    const response = await clearSorteioHistoryAction();
    setConfirmPending(false);
    if ("error" in response) {
      notify(response.error, "error");
      return;
    }
    setHistory(response.history);
    setNumbers(response.numbers);
    setConfirm(null);
    notify("Histórico apagado com sucesso.", "success");
  }

  async function handleReset() {
    setConfirmPending(true);
    const response = await resetSorteiosAction();
    setConfirmPending(false);
    if ("error" in response) {
      notify(response.error, "error");
      return;
    }
    setHistory(response.history);
    setNumbers(response.numbers);
    setResult(null);
    setConfettiOn(false);
    setConfirm(null);
    notify("Sorteios resetados. Os números podem participar de novo.", "success");
  }

  const backgroundStyle = { backgroundColor: bg.solid };

  const busy = spinning || pending;
  const textClass = light ? "text-navy" : "text-white";

  return (
    <div
      className={cn(
        "roleta-stage relative h-[100dvh] w-screen overflow-hidden",
        textClass,
        settings.broadcast && "roleta-broadcast",
      )}
      style={backgroundStyle}
    >

      {settings.testMode ? (
        <div className="absolute left-1/2 top-3 z-30 -translate-x-1/2 rounded-full bg-amber-300 px-4 py-1 text-xs font-black uppercase tracking-[0.2em] text-navy-deep shadow-lg">
          🧪 Modo teste
        </div>
      ) : null}

      {!settings.broadcast ? (
        <div className="absolute left-4 top-4 z-30 flex flex-wrap items-center gap-2">
          <Link
            href="/admin"
            className={cn(
              "rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide",
              light ? "bg-navy text-white" : "bg-white/15 text-white",
            )}
          >
            ← Admin
          </Link>
        </div>
      ) : null}

      <div className="absolute right-4 top-4 z-30 flex flex-wrap items-center gap-2">
        {!settings.showHistory ? (
          <button
            type="button"
            onClick={() => patch({ showHistory: true })}
            className="rounded-full bg-black/25 px-3 py-2 text-xs font-black uppercase tracking-wide backdrop-blur"
          >
            Histórico
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => patch({ sound: !settings.sound })}
          className="rounded-full bg-black/25 px-3 py-2 text-xs font-black uppercase tracking-wide backdrop-blur"
        >
          {settings.sound ? "🔊 Sons ON" : "🔇 Sons OFF"}
        </button>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="rounded-full bg-black/25 px-3 py-2 text-xs font-black uppercase tracking-wide backdrop-blur"
        >
          ⛶ Tela cheia
        </button>
        {!settings.broadcast ? (
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="rounded-full bg-black/25 px-3 py-2 text-xs font-black uppercase tracking-wide backdrop-blur"
          >
            ⚙️ Config
          </button>
        ) : (
          <button
            type="button"
            onClick={() => patch({ broadcast: false })}
            className="rounded-full bg-black/25 px-3 py-2 text-xs font-black uppercase tracking-wide backdrop-blur"
          >
            Sair da transmissão
          </button>
        )}
      </div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 pb-6 pt-14">
        <p className="font-display text-3xl tracking-[0.18em] text-amber-300 sm:text-5xl">
          Sorteio ao vivo
        </p>
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.24em] opacity-80">
          Rifa Feira dos Países 2026 🇺🇸
        </p>

        <div className="mt-4 flex w-full max-w-6xl flex-1 items-center justify-center gap-6">
          {settings.showHistory ? (
            <div className={cn("hidden lg:block", settings.broadcast && "lg:opacity-90")}>
              <RoletaHistory
                history={history}
                light={light}
                canManage={!settings.broadcast}
                spinning={busy}
                onClear={() => setConfirm("clear")}
                onReset={() => setConfirm("reset1")}
                onClose={() => patch({ showHistory: false })}
                isSuperAdmin={isSuperAdmin && !settings.broadcast}
              />
            </div>
          ) : null}

          <RoletaWheel
            numbers={orderedNumbers}
            rotation={rotation}
            background={settings.background}
          />
        </div>

        <div className="mt-4 flex w-full max-w-5xl flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => patch({ soldOnly: true })}
              className={chipClass(settings.soldOnly, light)}
            >
              🎟️ Apenas números vendidos
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => patch({ soldOnly: false })}
              className={chipClass(!settings.soldOnly, light)}
            >
              🎟️ Todos os números
            </button>
          </div>

          {!settings.broadcast ? (
            <div className="flex max-w-full flex-wrap items-center justify-center gap-2">
              {PRIZES.map((item) => (
                <button
                  key={item.place}
                  type="button"
                  disabled={busy}
                  onClick={() => patch({ prizePlace: item.place })}
                  className={chipClass(settings.prizePlace === item.place, light)}
                >
                  {prizeMeta(item.place).badge} {item.place}º
                </button>
              ))}
            </div>
          ) : null}

          <p className="text-center text-sm font-bold opacity-80">
            {prize.badge} {prize.title}: {prize.description}
            <span className="mx-2">·</span>
            {eligible.length} número(s) na roleta
          </p>

          <button
            type="button"
            disabled={busy || Boolean(result)}
            onClick={() => void handleDraw()}
            className="min-h-16 rounded-full bg-amber-300 px-12 text-2xl font-black uppercase tracking-[0.18em] text-navy-deep shadow-[0_12px_40px_rgba(212,160,23,0.45)] transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending && !spinning ? "Sorteando..." : spinning ? "Girando..." : "🎲 Sortear"}
          </button>

          {settings.broadcast ? null : (
            <button
              type="button"
              onClick={() => patch({ broadcast: true })}
              className="text-xs font-black uppercase tracking-[0.2em] opacity-80"
            >
              📺 Modo transmissão
            </button>
          )}
        </div>
      </div>

      {settings.showHistory ? (
        <div className="absolute bottom-3 left-3 z-20 lg:hidden">
          <RoletaHistory
            history={history}
            light={light}
            compact
            canManage={!settings.broadcast}
            spinning={busy}
            onClear={() => setConfirm("clear")}
            onReset={() => setConfirm("reset1")}
            onClose={() => patch({ showHistory: false })}
            isSuperAdmin={isSuperAdmin && !settings.broadcast}
          />
        </div>
      ) : null}

      <RoletaSettingsPanel
        open={settingsOpen && !settings.broadcast}
        settings={settings}
        isSuperAdmin={isSuperAdmin}
        spinning={busy}
        onClose={() => setSettingsOpen(false)}
        onPatch={patch}
        onFullscreen={() => void toggleFullscreen()}
        fullscreen={fullscreen}
        onClearHistory={() => setConfirm("clear")}
        onReset={() => setConfirm("reset1")}
      />

      {result ? (
        <RoletaResultModal
          sorteio={result}
          light={light}
          onClose={closeResult}
          onNewDraw={closeResult}
        />
      ) : null}

      <RoletaConfetti active={confettiOn && settings.confetti} />

      <ConfirmDialog
        open={confirm === "clear"}
        title="⚠️ Apagar histórico?"
        description="Isso removerá os registros dos sorteios realizados. Os números sorteados continuam marcados e não voltam para a roleta."
        confirmLabel="Apagar"
        cancelLabel="Cancelar"
        danger
        pending={confirmPending}
        onClose={() => setConfirm(null)}
        onConfirm={() => void handleClear()}
      />
      <ConfirmDialog
        open={confirm === "reset1"}
        title="⚠️ Resetar sorteios?"
        description="Todos os resultados dos sorteios serão apagados e os números sorteados poderão ser sorteados novamente. Os dados das vendas NÃO serão apagados."
        confirmLabel="Continuar"
        cancelLabel="Cancelar"
        danger
        pending={confirmPending}
        onClose={() => setConfirm(null)}
        onConfirm={() => setConfirm("reset2")}
      />
      <ConfirmDialog
        open={confirm === "reset2"}
        title="Confirmar reset"
        description="Última confirmação: histórico apagado, marcação SORTEADO removida, vendas e alunos intactos."
        confirmLabel="Resetar"
        cancelLabel="Cancelar"
        danger
        pending={confirmPending}
        onClose={() => setConfirm(null)}
        onConfirm={() => void handleReset()}
      />
    </div>
  );
}

function chipClass(active: boolean, light: boolean) {
  return cn(
    "rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide",
    active
      ? "bg-amber-300 text-navy-deep"
      : light
        ? "bg-navy/10 text-navy"
        : "bg-white/10 text-white",
  );
}
