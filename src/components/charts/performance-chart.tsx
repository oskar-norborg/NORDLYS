import { useEffect, useRef } from "react";
import { formatIndex, formatMoney, formatPct } from "@/engine/format";
import type { CurrencyCode } from "@/engine/types";

function token(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

export function PerformanceChart({
  portfolio,
  benchmark,
  benchmarkLabel,
  privacy,
  currency,
}: {
  portfolio: { date: string; value: number }[];
  benchmark: { date: string; value: number }[];
  benchmarkLabel: string;
  privacy: boolean;
  currency: CurrencyCode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = wrap.clientWidth;
      const height = Math.max(220, Math.min(320, Math.round(width * 0.38)));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const bg = token("--color-surface", "#101513");
      const grid = token("--color-border", "#232a27");
      const muted = token("--color-muted", "#8b958f");
      const accent = token("--color-accent", "#8fbfb2");
      const warn = token("--color-warn", "#c4a574");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
      if (portfolio.length < 2) return;
      const pad = { l: 48, r: 12, t: 16, b: 28 };
      const plotW = width - pad.l - pad.r;
      const plotH = height - pad.t - pad.b;
      const p0 = portfolio[0]!.value || 1;
      const hasBench = benchmark.length >= 2;
      const b0 = hasBench ? benchmark[0]!.value || 1 : 1;
      const p = portfolio.map((x) => (x.value / p0) * 100);
      const b = hasBench ? benchmark.map((x) => (x.value / b0) * 100) : [];
      let min = Infinity;
      let max = -Infinity;
      for (const v of p) {
        min = Math.min(min, v);
        max = Math.max(max, v);
      }
      for (const v of b) {
        min = Math.min(min, v);
        max = Math.max(max, v);
      }
      if (min === max) {
        min *= 0.95;
        max *= 1.05;
      }
      const span = max - min || 1;
      const xOf = (i: number, n: number) => pad.l + (i / Math.max(1, n - 1)) * plotW;
      const yOf = (v: number) => pad.t + (1 - (v - min) / span) * plotH;
      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      ctx.font = "10px IBM Plex Mono, monospace";
      ctx.fillStyle = muted;
      for (let i = 0; i <= 4; i++) {
        const v = min + (span * i) / 4;
        const y = yOf(v);
        ctx.beginPath();
        ctx.moveTo(pad.l, y);
        ctx.lineTo(width - pad.r, y);
        ctx.stroke();
        ctx.fillText(v.toFixed(0), 8, y + 3);
      }
      const line = (arr: number[], color: string) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.6;
        arr.forEach((v, i) => {
          const x = xOf(i, arr.length);
          const y = yOf(v);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      };
      if (b.length > 1) line(b, warn);
      line(p, accent);
      ctx.fillStyle = muted;
      ctx.fillText(portfolio[0]!.date.slice(0, 7), pad.l, height - 8);
      ctx.fillText(portfolio[portfolio.length - 1]!.date.slice(0, 7), width - pad.r - 44, height - 8);
      ctx.fillStyle = accent;
      ctx.fillText("Portfolio", pad.l, 12);
      if (b.length > 1) {
        ctx.fillStyle = warn;
        ctx.fillText(benchmarkLabel, pad.l + 78, 12);
      }
      void formatIndex;
      void formatMoney;
      void formatPct;
      void currency;
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [portfolio, benchmark, benchmarkLabel, privacy, currency]);

  return (
    <div ref={wrapRef} className="w-full">
      <canvas ref={canvasRef} className="block w-full" />
    </div>
  );
}
