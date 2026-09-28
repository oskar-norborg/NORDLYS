import { useEffect, useRef } from "react";

function token(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function mix(c0: [number, number, number], c1: [number, number, number], t: number): string {
  const tt = Math.min(1, Math.max(0, t));
  return `rgb(${lerp(c0[0], c1[0], tt).toFixed(0)} ${lerp(c0[1], c1[1], tt).toFixed(0)} ${lerp(c0[2], c1[2], tt).toFixed(0)})`;
}

export function HeatmapChart({
  labels,
  matrix,
}: {
  labels: string[];
  matrix: number[][];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const n = labels.length;
      const width = wrap.clientWidth;
      const cell = Math.max(22, Math.min(44, Math.floor((width - 72) / Math.max(n, 1))));
      const height = 48 + cell * n;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const muted = token("--color-muted", "#8b958f");
      const fg = token("--color-fg", "#e4eae6");
      const origin = 68;
      const cool: [number, number, number] = [20, 36, 42];
      const mid: [number, number, number] = [143, 191, 178];
      const hot: [number, number, number] = [192, 112, 112];
      ctx.font = "10px IBM Plex Mono, monospace";
      ctx.fillStyle = muted;
      for (let i = 0; i < n; i++) {
        ctx.textAlign = "right";
        ctx.fillText(labels[i]!.slice(0, 8), origin - 6, 36 + i * cell + cell * 0.62);
        ctx.save();
        ctx.translate(origin + i * cell + cell * 0.5, 22);
        ctx.rotate(-Math.PI / 4);
        ctx.textAlign = "left";
        ctx.fillText(labels[i]!.slice(0, 8), 0, 0);
        ctx.restore();
      }
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const v = matrix[i]?.[j] ?? 0;
          const t = (v + 1) / 2;
          const color = t < 0.5 ? mix(hot, mid, t * 2) : mix(mid, cool, (t - 0.5) * 2);
          ctx.fillStyle = i === j ? mix(mid, [232, 234, 230], 0.25) : color;
          ctx.fillRect(origin + j * cell + 1, 28 + i * cell + 1, cell - 2, cell - 2);
          ctx.fillStyle = Math.abs(v) > 0.55 ? fg : muted;
          ctx.textAlign = "center";
          ctx.fillText(v.toFixed(2), origin + j * cell + cell / 2, 28 + i * cell + cell * 0.62);
        }
      }
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [labels, matrix]);

  return (
    <div ref={wrapRef} className="w-full">
      <canvas ref={canvasRef} className="block w-full" />
    </div>
  );
}
