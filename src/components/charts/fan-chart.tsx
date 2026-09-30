import { useEffect, useRef, useState } from "react";
import type { SimResult } from "@/engine/types";
import { formatIndex, formatMoney, formatNumber } from "@/engine/format";
import type { CurrencyCode } from "@/engine/types";
import { AS_OF_YEAR } from "@/engine/types";
import { deflateByInflation, niceTicksFromZero } from "@/engine/finance";

interface Props {
  result: SimResult;
  privacy: boolean;
  currency: CurrencyCode;
  inflation: number;
}

function readToken(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export function FanChart({ result, privacy, currency, inflation }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = wrap.clientWidth;
      const height = Math.max(240, Math.min(360, Math.round(width * 0.42)));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const bg = readToken("--color-surface", "#101513");
      const grid = readToken("--color-border", "#232a27");
      const muted = readToken("--color-muted", "#8b958f");
      const fg = readToken("--color-fg", "#e4eae6");
      const accent = readToken("--color-accent", "#8fbfb2");
      const outer = readToken("--color-band-outer", "rgba(143,191,178,0.14)");
      const inner = readToken("--color-band-inner", "rgba(143,191,178,0.28)");

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const pad = { l: 56, r: 16, t: 16, b: 32 };
      const plotW = width - pad.l - pad.r;
      const plotH = height - pad.t - pad.b;
      const n = result.years.length;
      if (n < 2 || plotW <= 0) return;

      const real = {
        p5: deflateByInflation(result.p5, result.years, inflation),
        p25: deflateByInflation(result.p25, result.years, inflation),
        p50: deflateByInflation(result.p50, result.years, inflation),
        p75: deflateByInflation(result.p75, result.years, inflation),
        p95: deflateByInflation(result.p95, result.years, inflation),
      };
      const series = privacy
        ? {
            p5: real.p5.map((v) => (result.startWealth ? (v / result.startWealth) * 100 : 100)),
            p25: real.p25.map((v) => (result.startWealth ? (v / result.startWealth) * 100 : 100)),
            p50: real.p50.map((v) => (result.startWealth ? (v / result.startWealth) * 100 : 100)),
            p75: real.p75.map((v) => (result.startWealth ? (v / result.startWealth) * 100 : 100)),
            p95: real.p95.map((v) => (result.startWealth ? (v / result.startWealth) * 100 : 100)),
          }
        : real;

      let max = 0;
      for (const arr of [series.p5, series.p95, series.p50]) {
        for (const v of arr) max = Math.max(max, v);
      }
      const yTicks = niceTicksFromZero(max || 1);
      const top = yTicks[yTicks.length - 1] ?? max ?? 1;

      const xAt = (i: number) => pad.l + (i / (n - 1)) * plotW;
      const yAt = (v: number) => pad.t + (1 - v / top) * plotH;

      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      ctx.font = "11px IBM Plex Sans, sans-serif";
      ctx.fillStyle = muted;
      for (const v of yTicks) {
        const y = yAt(v);
        ctx.beginPath();
        ctx.moveTo(pad.l, y);
        ctx.lineTo(width - pad.r, y);
        ctx.stroke();
        const label = privacy ? v.toFixed(0) : compact(v);
        ctx.fillText(label, 8, y + 4);
      }

      const yearStep = result.nYears > 40 ? 10 : result.nYears > 20 ? 5 : 2;
      for (let i = 0; i < n; i += yearStep) {
        const x = xAt(i);
        ctx.fillText(String(AS_OF_YEAR + result.years[i]!), x - 12, height - 10);
      }

      const band = (hi: number[], lo: number[], color: string) => {
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.moveTo(xAt(0), yAt(hi[0]!));
        for (let i = 1; i < n; i++) ctx.lineTo(xAt(i), yAt(hi[i]!));
        for (let i = n - 1; i >= 0; i--) ctx.lineTo(xAt(i), yAt(lo[i]!));
        ctx.closePath();
        ctx.fill();
      };

      band(series.p95, series.p5, outer);
      band(series.p75, series.p25, inner);

      ctx.beginPath();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.8;
      ctx.moveTo(xAt(0), yAt(series.p50[0]!));
      for (let i = 1; i < n; i++) ctx.lineTo(xAt(i), yAt(series.p50[i]!));
      ctx.stroke();

      if (hover != null && hover >= 0 && hover < n) {
        const x = xAt(hover);
        ctx.strokeStyle = fg;
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.moveTo(x, pad.t);
        ctx.lineTo(x, pad.t + plotH);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(x, yAt(series.p50[hover]!), 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [result, privacy, hover, inflation]);

  const i = hover ?? 0;
  const year = AS_OF_YEAR + (result.years[i] ?? 0);
  const realP50 = deflateByInflation(result.p50, result.years, inflation);
  const realP5 = deflateByInflation(result.p5, result.years, inflation);
  const realP95 = deflateByInflation(result.p95, result.years, inflation);
  const med = realP50[i] ?? 0;
  const lo = realP5[i] ?? 0;
  const hi = realP95[i] ?? 0;

  function onMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const padL = 56;
    const padR = 16;
    const x = e.clientX - rect.left;
    const plotW = rect.width - padL - padR;
    const t = Math.min(1, Math.max(0, (x - padL) / plotW));
    setHover(Math.round(t * (result.years.length - 1)));
  }

  return (
    <div ref={wrapRef} className="relative">
      <canvas
        ref={canvasRef}
        className="w-full"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        aria-label="Percentile fan chart of projected wealth"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <div className="flex items-center gap-3">
          <Legend swatch="var(--color-band-outer)" label="5–95" />
          <Legend swatch="var(--color-band-inner)" label="25–75" />
          <Legend swatch="var(--color-accent)" label="Median" line />
          <span>Today’s kroner (real)</span>
        </div>
        <div className="font-mono tabular-nums text-fg">
          {year}
          {" · "}
          {privacy
            ? `idx ${formatIndex(med, result.startWealth)} (5–95: ${formatIndex(lo, result.startWealth)}–${formatIndex(hi, result.startWealth)})`
            : `${formatMoney(med, currency, false)}  ·  ${formatNumber(lo, false, 0)} – ${formatNumber(hi, false, 0)}`}
        </div>
      </div>
    </div>
  );
}

function Legend({ swatch, label, line }: { swatch: string; label: string; line?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-2 w-4 rounded-sm"
        style={{ background: swatch, height: line ? 2 : 8 }}
      />
      {label}
    </span>
  );
}

function compact(v: number): string {
  const a = Math.abs(v);
  if (a >= 1e6) {
    const m = v / 1e6;
    return Number.isInteger(m) ? `${m}m` : `${m.toFixed(0)}m`;
  }
  if (a >= 1e3) return `${(v / 1e3).toFixed(0)}k`;
  return v.toFixed(0);
}
