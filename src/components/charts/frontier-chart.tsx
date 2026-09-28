import { useEffect, useRef } from "react";
import { formatPct } from "@/engine/format";
import type { FrontierPoint } from "@/engine/optimize";

function token(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

export function FrontierChart({
  points,
  selected,
  onSelect,
  extra,
}: {
  points: FrontierPoint[];
  selected: number;
  onSelect: (i: number) => void;
  extra?: { label: string; mu: number; vol: number; color?: string }[];
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
      const height = 260;
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
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
      if (points.length < 2) return;
      const pad = { l: 48, r: 12, t: 16, b: 28 };
      const plotW = width - pad.l - pad.r;
      const plotH = height - pad.t - pad.b;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of points) {
        minX = Math.min(minX, p.vol);
        maxX = Math.max(maxX, p.vol);
        minY = Math.min(minY, p.mu);
        maxY = Math.max(maxY, p.mu);
      }
      for (const e of extra ?? []) {
        minX = Math.min(minX, e.vol);
        maxX = Math.max(maxX, e.vol);
        minY = Math.min(minY, e.mu);
        maxY = Math.max(maxY, e.mu);
      }
      const dx = maxX - minX || 0.01;
      const dy = maxY - minY || 0.01;
      minX -= dx * 0.08;
      maxX += dx * 0.08;
      minY -= dy * 0.08;
      maxY += dy * 0.08;
      const xOf = (v: number) => pad.l + ((v - minX) / (maxX - minX)) * plotW;
      const yOf = (v: number) => pad.t + (1 - (v - minY) / (maxY - minY)) * plotH;
      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      ctx.font = "10px IBM Plex Mono, monospace";
      ctx.fillStyle = muted;
      for (let i = 0; i <= 4; i++) {
        const v = minY + ((maxY - minY) * i) / 4;
        const y = yOf(v);
        ctx.beginPath();
        ctx.moveTo(pad.l, y);
        ctx.lineTo(width - pad.r, y);
        ctx.stroke();
        ctx.fillText(formatPct(v, 1), 6, y + 3);
      }
      ctx.beginPath();
      points.forEach((p, i) => {
        const x = xOf(p.vol);
        const y = yOf(p.mu);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      points.forEach((p, i) => {
        ctx.beginPath();
        ctx.fillStyle = i === selected ? token("--color-fg", "#e4eae6") : accent;
        ctx.arc(xOf(p.vol), yOf(p.mu), i === selected ? 4.5 : 2.4, 0, Math.PI * 2);
        ctx.fill();
      });
      for (const e of extra ?? []) {
        ctx.beginPath();
        ctx.fillStyle = e.color || token("--color-warn", "#c4a574");
        ctx.arc(xOf(e.vol), yOf(e.mu), 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = muted;
      ctx.fillText("σ →", pad.l, height - 8);
      ctx.fillText(formatPct(maxX, 1), width - pad.r - 36, height - 8);
    };
    draw();
    const onClick = (ev: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const width = rect.width;
      const height = 260;
      const pad = { l: 48, r: 12, t: 16, b: 28 };
      const plotW = width - pad.l - pad.r;
      const plotH = height - pad.t - pad.b;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of points) {
        minX = Math.min(minX, p.vol);
        maxX = Math.max(maxX, p.vol);
        minY = Math.min(minY, p.mu);
        maxY = Math.max(maxY, p.mu);
      }
      const dx = maxX - minX || 0.01;
      const dy = maxY - minY || 0.01;
      minX -= dx * 0.08;
      maxX += dx * 0.08;
      minY -= dy * 0.08;
      maxY += dy * 0.08;
      const xOf = (v: number) => pad.l + ((v - minX) / (maxX - minX)) * plotW;
      const yOf = (v: number) => pad.t + (1 - (v - minY) / (maxY - minY)) * plotH;
      let best = 0;
      let bestD = Infinity;
      points.forEach((p, i) => {
        const d = (xOf(p.vol) - x) ** 2 + (yOf(p.mu) - y) ** 2;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      onSelect(best);
    };
    canvas.addEventListener("click", onClick);
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => {
      ro.disconnect();
      canvas.removeEventListener("click", onClick);
    };
  }, [points, selected, onSelect, extra]);

  return (
    <div ref={wrapRef} className="w-full">
      <canvas ref={canvasRef} className="block w-full cursor-crosshair" />
    </div>
  );
}
