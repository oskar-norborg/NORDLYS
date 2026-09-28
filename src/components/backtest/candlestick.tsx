import { useEffect, useRef, useState, type PointerEvent } from "react";
import { sma } from "@/engine/strategy";
import type { AssetSeries } from "@/engine/backtest";
import { cn } from "@/lib/utils";

function token(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

export function CandlestickChart({
  series,
  ticker,
  onTicker,
  tickers,
}: {
  series: AssetSeries | null;
  ticker: string;
  onTicker: (t: string) => void;
  tickers: string[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const bars = series?.bars ?? [];
  const [view, setView] = useState<{ a: number; b: number } | null>(null);
  const drag = useRef<{ x: number; a: number; b: number } | null>(null);

  useEffect(() => {
    setView(null);
  }, [ticker, bars.length]);

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
      const bg = token("--color-surface", "#101513");
      const grid = token("--color-border", "#232a27");
      const muted = token("--color-muted", "#8b958f");
      const accent = token("--color-accent", "#8fbfb2");
      const warn = token("--color-warn", "#c4a574");
      const ok = token("--color-ok", "#7dba8a");
      const danger = token("--color-danger", "#c07070");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
      if (bars.length < 2) {
        ctx.fillStyle = muted;
        ctx.font = "12px IBM Plex Sans, sans-serif";
        ctx.fillText("No bars", 16, 24);
        return;
      }
      const a = view ? Math.max(0, Math.min(view.a, bars.length - 2)) : Math.max(0, bars.length - 180);
      const b = view ? Math.max(a + 1, Math.min(view.b, bars.length - 1)) : bars.length - 1;
      const slice = bars.slice(a, b + 1);
      const pad = { l: 52, r: 12, t: 20, b: 28 };
      const plotW = width - pad.l - pad.r;
      const plotH = height - pad.t - pad.b;
      let lo = Infinity;
      let hi = -Infinity;
      for (const bar of slice) {
        lo = Math.min(lo, bar.low);
        hi = Math.max(hi, bar.high);
      }
      const closes = bars.map((x) => x.close);
      const sma50: (number | undefined)[] = [];
      const sma200: (number | undefined)[] = [];
      for (let i = 0; i < bars.length; i++) {
        sma50.push(sma(closes.slice(0, i + 1), 50));
        sma200.push(sma(closes.slice(0, i + 1), 200));
      }
      for (let i = a; i <= b; i++) {
        const s5 = sma50[i];
        const s2 = sma200[i];
        if (s5 != null) {
          lo = Math.min(lo, s5);
          hi = Math.max(hi, s5);
        }
        if (s2 != null) {
          lo = Math.min(lo, s2);
          hi = Math.max(hi, s2);
        }
      }
      if (!(hi > lo)) {
        lo *= 0.98;
        hi *= 1.02;
      }
      const span = hi - lo || 1;
      const n = slice.length;
      const slot = plotW / n;
      const xOf = (i: number) => pad.l + (i + 0.5) * slot;
      const yOf = (v: number) => pad.t + (1 - (v - lo) / span) * plotH;

      ctx.strokeStyle = grid;
      ctx.fillStyle = muted;
      ctx.font = "10px IBM Plex Mono, monospace";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const v = lo + (span * i) / 4;
        const y = yOf(v);
        ctx.beginPath();
        ctx.moveTo(pad.l, y);
        ctx.lineTo(width - pad.r, y);
        ctx.stroke();
        ctx.fillText(v.toFixed(1), 6, y + 3);
      }

      const bodyW = Math.max(1, Math.min(8, slot * 0.7));
      slice.forEach((bar, i) => {
        const x = xOf(i);
        const up = bar.close >= bar.open;
        ctx.strokeStyle = up ? ok : danger;
        ctx.fillStyle = up ? ok : danger;
        ctx.beginPath();
        ctx.moveTo(x, yOf(bar.high));
        ctx.lineTo(x, yOf(bar.low));
        ctx.stroke();
        const y1 = yOf(Math.max(bar.open, bar.close));
        const y2 = yOf(Math.min(bar.open, bar.close));
        const h = Math.max(1, y2 - y1);
        ctx.fillRect(x - bodyW / 2, y1, bodyW, h);
      });

      const line = (arr: (number | undefined)[], color: string) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.4;
        let started = false;
        for (let i = a; i <= b; i++) {
          const v = arr[i];
          if (v == null) continue;
          const x = xOf(i - a);
          const y = yOf(v);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };
      line(sma50, accent);
      line(sma200, warn);

      ctx.fillStyle = muted;
      ctx.fillText(slice[0]!.date, pad.l, height - 8);
      ctx.fillText(slice[slice.length - 1]!.date, width - pad.r - 72, height - 8);
      ctx.fillStyle = accent;
      ctx.fillText("SMA 50", pad.l, 12);
      ctx.fillStyle = warn;
      ctx.fillText("SMA 200", pad.l + 64, 12);
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [bars, view, ticker]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const handler = (e: WheelEvent) => {
      if (!bars.length) return;
      e.preventDefault();
      const a0 = view?.a ?? Math.max(0, bars.length - 180);
      const b0 = view?.b ?? bars.length - 1;
      const span = Math.max(8, b0 - a0);
      const rect = wrap.getBoundingClientRect();
      const t = rect.width ? (e.clientX - rect.left) / rect.width : 0.5;
      const zoom = e.deltaY > 0 ? 1.18 : 0.85;
      const next = Math.max(8, Math.min(bars.length - 1, Math.round(span * zoom)));
      const center = a0 + t * span;
      let a = Math.round(center - t * next);
      let b = a + next;
      if (a < 0) {
        a = 0;
        b = next;
      }
      if (b > bars.length - 1) {
        b = bars.length - 1;
        a = Math.max(0, b - next);
      }
      setView({ a, b });
    };
    wrap.addEventListener("wheel", handler, { passive: false });
    return () => wrap.removeEventListener("wheel", handler);
  }, [bars.length, view]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const a0 = view?.a ?? Math.max(0, bars.length - 180);
    const b0 = view?.b ?? bars.length - 1;
    drag.current = { x: e.clientX, a: a0, b: b0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !wrapRef.current) return;
    const { a, b, x } = drag.current;
    const span = b - a;
    const dx = e.clientX - x;
    const shift = Math.round((-dx / Math.max(1, wrapRef.current.clientWidth)) * span);
    let na = a + shift;
    let nb = b + shift;
    if (na < 0) {
      na = 0;
      nb = span;
    }
    if (nb > bars.length - 1) {
      nb = bars.length - 1;
      na = Math.max(0, nb - span);
    }
    setView({ a: na, b: nb });
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {tickers.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onTicker(t)}
            className={cn(
              "h-11 rounded-md border px-3 text-xs font-medium",
              t === ticker ? "border-accent bg-accent text-accent-fg" : "border-border text-muted",
            )}
          >
            {t}
          </button>
        ))}
        <span className="text-xs text-subtle">Scroll to zoom, drag to pan</span>
      </div>
      <div
        ref={wrapRef}
        className="w-full touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <canvas ref={canvasRef} className="block w-full" />
      </div>
    </div>
  );
}
