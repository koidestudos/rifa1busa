"use client";

import { useEffect, useRef } from "react";
import { formatRaffleNumber } from "@/lib/format";
import {
  isLightRoletaBackground,
  pointerIndex,
  type RoletaBackgroundId,
} from "@/lib/roleta";
import type { RoletaNumber } from "@/lib/types";
import { cn } from "@/lib/cn";

type RoletaWheelProps = {
  numbers: RoletaNumber[];
  rotation: number;
  background: RoletaBackgroundId;
  className?: string;
};

export function RoletaWheel({
  numbers,
  rotation,
  background,
  className,
}: RoletaWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const numbersRef = useRef(numbers);
  const rotationRef = useRef(rotation);
  const lightRef = useRef(isLightRoletaBackground(background));
  const drawRef = useRef<() => void>(() => undefined);
  const light = isLightRoletaBackground(background);
  const count = numbers.length;
  const liveNumero = count === 0 ? null : numbers[pointerIndex(rotation, count)]?.numero ?? null;

  useEffect(() => {
    numbersRef.current = numbers;
    rotationRef.current = rotation;
    lightRef.current = light;
  }, [light, numbers, rotation]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const draw = () => {
      const items = numbersRef.current;
      const total = items.length;
      const size = Math.max(120, Math.floor(wrap.clientWidth));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx || total === 0) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cx = size / 2;
      const cy = size / 2;
      const radius = size / 2 - 10;
      const slice = (Math.PI * 2) / total;
      const rot = (rotationRef.current * Math.PI) / 180;
      const lightTheme = lightRef.current;

      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);

      for (let i = 0; i < total; i += 1) {
        const item = items[i];
        const a0 = i * slice - Math.PI / 2;
        const a1 = a0 + slice;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, a0, a1);
        ctx.closePath();
        ctx.fillStyle = sliceFill(item, i, lightTheme);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "#d4a017";
      ctx.lineWidth = Math.max(8, size * 0.018);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, radius - Math.max(10, size * 0.022), 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.28)";
      ctx.lineWidth = 2;
      ctx.stroke();

      const tickOuter = radius - 4;
      const tickInner = radius - Math.max(12, size * 0.03);
      ctx.strokeStyle = "rgba(6,20,40,0.35)";
      ctx.lineWidth = 1;
      for (let i = 0; i < total; i += 1) {
        const a = i * slice - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * tickInner, Math.sin(a) * tickInner);
        ctx.lineTo(Math.cos(a) * tickOuter, Math.sin(a) * tickOuter);
        ctx.stroke();
      }

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = lightTheme ? "#061428" : "#fff7d6";
      ctx.font = `700 ${Math.max(9, size * 0.018)}px ui-sans-serif`;
      const step = Math.max(1, Math.round(total / 24));
      for (let i = 0; i < total; i += step) {
        const item = items[i];
        if (!item) continue;
        const a = (i + 0.5) * slice - Math.PI / 2;
        const r = radius * 0.82;
        ctx.save();
        ctx.translate(Math.cos(a) * r, Math.sin(a) * r);
        ctx.rotate(a + Math.PI / 2);
        ctx.fillText(formatRaffleNumber(item.numero), 0, 0);
        ctx.restore();
      }

      ctx.restore();

      const gloss = ctx.createLinearGradient(0, 0, 0, size);
      gloss.addColorStop(0, "rgba(255,255,255,0.18)");
      gloss.addColorStop(0.45, "rgba(255,255,255,0)");
      ctx.fillStyle = gloss;
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 6, 0, Math.PI * 2);
      ctx.fill();
    };

    drawRef.current = draw;
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    drawRef.current();
  }, [rotation, numbers, light]);

  return (
    <div ref={wrapRef} className={cn("relative aspect-square w-full max-w-[min(78vh,720px)]", className)}>
      <canvas ref={canvasRef} className="relative z-10 h-full w-full" />
      <div className="pointer-events-none absolute left-1/2 top-[1.5%] z-20 -translate-x-1/2">
        <div className="h-0 w-0 border-l-[14px] border-r-[14px] border-t-[28px] border-l-transparent border-r-transparent border-t-amber-300 drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)]" />
      </div>
      <div
        className={cn(
          "absolute left-1/2 top-1/2 z-20 grid h-[38%] w-[38%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-amber-300 shadow-[0_0_40px_rgba(212,160,23,0.45)]",
          light ? "bg-white text-navy" : "bg-navy-deep/90 text-white",
        )}
      >
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-300">Número</p>
          <p className="font-display text-5xl leading-none tracking-[0.06em] sm:text-6xl md:text-7xl">
            {liveNumero == null ? "—" : formatRaffleNumber(liveNumero)}
          </p>
        </div>
      </div>
    </div>
  );
}

function sliceFill(item: RoletaNumber | undefined, index: number, light: boolean) {
  if (!item) return "#1e4e8c";
  if (item.sorteado) return index % 2 === 0 ? "#27272a" : "#3f3f46";
  if (item.status === "PEGO") return index % 2 === 0 ? "#bf0a30" : "#f2e6c9";
  if (light) return index % 2 === 0 ? "#dbe7f5" : "#f8fafc";
  return index % 2 === 0 ? "#0a3161" : "#1e5aa8";
}
