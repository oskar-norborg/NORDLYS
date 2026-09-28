import { useEffect, useRef } from "react";
import type { AssetId } from "@/engine/types";
import { ASSET_LABELS } from "@/engine/types";
import { formatPct } from "@/engine/format";

const COLORS: Record<AssetId, string> = {
  global_eq: "#8fbfb2",
  us_eq: "#6a9b8f",
  nordic_eq: "#c4a574",
  bonds: "#7d9bb0",
  real_estate: "#a09078",
  cash: "#5c6560",
};

function token(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

export function AllocationChart({
  slices,
}: {
  slices: { assetClass: AssetId; weight: number; value: number }[];
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
      const height = 220;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const cx = 90;
      const cy = height / 2;
      const r = 72;
      let a0 = -Math.PI / 2;
      const active = slices.filter((s) => s.weight > 0.0005);
      if (active.length === 0) {
        ctx.strokeStyle = token("--color-border", "#232a27");
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        return;
      }
      for (const s of active) {
        const a1 = a0 + s.weight * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, a0, a1);
        ctx.closePath();
        ctx.fillStyle = COLORS[s.assetClass];
        ctx.fill();
        a0 = a1;
      }
      ctx.beginPath();
      ctx.arc(cx, cy, 42, 0, Math.PI * 2);
      ctx.fillStyle = token("--color-surface", "#101513");
      ctx.fill();
      ctx.font = "12px IBM Plex Sans, sans-serif";
      ctx.textBaseline = "middle";
      let y = 28;
      for (const s of slices) {
        ctx.fillStyle = COLORS[s.assetClass];
        ctx.fillRect(190, y - 5, 8, 8);
        ctx.fillStyle = token("--color-fg", "#e4eae6");
        ctx.fillText(ASSET_LABELS[s.assetClass], 206, y);
        ctx.fillStyle = token("--color-muted", "#8b958f");
        ctx.fillText(formatPct(s.weight, 1), width - 16 - ctx.measureText(formatPct(s.weight, 1)).width, y);
        y += 28;
      }
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [slices]);

  return (
    <div ref={wrapRef} className="w-full">
      <canvas ref={canvasRef} className="block w-full" />
    </div>
  );
}
