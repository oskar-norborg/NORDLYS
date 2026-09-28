import { useEffect, useRef } from "react";
import { formatPct } from "@/engine/format";

function token(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

export function UnderwaterChart({
  series,
}: {
  series: { date: string; dd: number }[];
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
      const height = 200;
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
      const danger = token("--color-danger", "#c07070");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
      if (series.length < 2) return;
      const pad = { l: 48, r: 12, t: 12, b: 24 };
      const plotW = width - pad.l - pad.r;
      const plotH = height - pad.t - pad.b;
      let min = 0;
      for (const p of series) min = Math.min(min, p.dd);
      if (min === 0) min = -0.05;
      const xOf = (i: number) => pad.l + (i / Math.max(1, series.length - 1)) * plotW;
      const yOf = (v: number) => pad.t + (1 - (v - min) / (0 - min)) * plotH;
      ctx.strokeStyle = grid;
      ctx.fillStyle = muted;
      ctx.font = "10px IBM Plex Mono, monospace";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const v = min + ((0 - min) * i) / 4;
        const y = yOf(v);
        ctx.beginPath();
        ctx.moveTo(pad.l, y);
        ctx.lineTo(width - pad.r, y);
        ctx.stroke();
        ctx.fillText(formatPct(v, 0), 8, y + 3);
      }
      ctx.beginPath();
      series.forEach((p, i) => {
        const x = xOf(i);
        const y = yOf(p.dd);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(xOf(series.length - 1), yOf(0));
      ctx.lineTo(xOf(0), yOf(0));
      ctx.closePath();
      ctx.fillStyle = "rgba(192,112,112,0.18)";
      ctx.fill();
      ctx.beginPath();
      series.forEach((p, i) => {
        const x = xOf(i);
        const y = yOf(p.dd);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = danger;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.fillStyle = muted;
      ctx.fillText(series[0]!.date.slice(0, 7), pad.l, height - 8);
      ctx.fillText(series[series.length - 1]!.date.slice(0, 7), width - pad.r - 44, height - 8);
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [series]);

  return (
    <div ref={wrapRef} className="w-full">
      <canvas ref={canvasRef} className="block w-full" />
    </div>
  );
}
