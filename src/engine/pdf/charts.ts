/** Vector charts as PDF path operators (pie, fan, bars, polyline). */

import type { RGB } from "./layout";
import { C, CHART_PALETTE } from "./layout";
import { pdfString, textWidth } from "./winansi";
import { niceTicksFromZero } from "../finance";

function nn(x: number, fallback = 0): number {
  return Number.isFinite(x) ? x : fallback;
}

function rgb(c: RGB, op: "rg" | "RG"): string {
  return `${nn(c[0]).toFixed(3)} ${nn(c[1]).toFixed(3)} ${nn(c[2]).toFixed(3)} ${op}`;
}

function bezierArc(cx: number, cy: number, r: number, a0: number, a1: number): string[] {
  const segs: string[] = [];
  let start = a0;
  while (start < a1 - 1e-9) {
    const span = Math.min(Math.PI / 2, a1 - start);
    const end = start + span;
    const k = (4 / 3) * Math.tan(span / 4);
    const p0x = cx + r * Math.cos(start);
    const p0y = cy + r * Math.sin(start);
    const p1x = cx + r * Math.cos(end);
    const p1y = cy + r * Math.sin(end);
    const t0x = -r * Math.sin(start);
    const t0y = r * Math.cos(start);
    const t1x = -r * Math.sin(end);
    const t1y = r * Math.cos(end);
    const c1x = p0x + k * t0x;
    const c1y = p0y + k * t0y;
    const c2x = p1x - k * t1x;
    const c2y = p1y - k * t1y;
    segs.push(
      `${nn(c1x).toFixed(2)} ${nn(c1y).toFixed(2)} ${nn(c2x).toFixed(2)} ${nn(c2y).toFixed(2)} ${nn(p1x).toFixed(2)} ${nn(p1y).toFixed(2)} c`,
    );
    start = end;
  }
  return segs;
}

export function pieWithLegend(
  box: { x: number; y: number; w: number; h: number },
  slices: { value: number; label: string; caption?: string }[],
): string {
  const colored = slices.map((s, i) => ({
    ...s,
    color: CHART_PALETTE[i % CHART_PALETTE.length]!,
  }));
  const r = Math.min(box.h * 0.42, 58);
  const cx = box.x + r + 8;
  const cy = box.y + box.h / 2;
  const out = [pieOpsFixed(cx, cy, r, colored)];
  const lx = cx + r + 22;
  let ly = box.y + box.h - 18;
  const total = colored.reduce((s, x) => s + Math.max(0, x.value), 0);
  for (const sl of colored) {
    const pct = total > 0 ? sl.value / total : 0;
    out.push(rgb(sl.color, "rg"));
    out.push(`${lx.toFixed(2)} ${(ly - 2).toFixed(2)} 8 8 re f`);
    out.push(
      `BT /F1 8 Tf ${rgb(C.ink, "rg")} 1 0 0 1 ${(lx + 14).toFixed(2)} ${ly.toFixed(2)} Tm ${pdfString(sl.label)} Tj ET`,
    );
    const cap = sl.caption ?? `${(pct * 100).toFixed(1)}%`;
    const cw = textWidth(cap, "r", 8);
    out.push(
      `BT /F1 8 Tf ${rgb(C.muted, "rg")} 1 0 0 1 ${(box.x + box.w - cw).toFixed(2)} ${ly.toFixed(2)} Tm ${pdfString(cap)} Tj ET`,
    );
    ly -= 16;
  }
  return out.join("\n");
}

function pieOpsFixed(
  cx: number,
  cy: number,
  r: number,
  slices: { value: number; color: RGB }[],
): string {
  const total = slices.reduce((s, x) => s + Math.max(0, x.value), 0);
  const out: string[] = [];
  if (!(total > 0)) {
    out.push(`0.5 w ${rgb(C.rule, "RG")}`);
    out.push(`${(cx - r).toFixed(2)} ${(cy - r).toFixed(2)} ${(2 * r).toFixed(2)} ${(2 * r).toFixed(2)} re S`);
    return out.join("\n");
  }
  let a = Math.PI / 2;
  for (const sl of slices) {
    const frac = Math.max(0, sl.value) / total;
    if (frac <= 1e-12) continue;
    const a1 = a - frac * Math.PI * 2;
    const xStart = cx + r * Math.cos(a1);
    const yStart = cy + r * Math.sin(a1);
    out.push(rgb(sl.color, "rg"));
    out.push(`${cx.toFixed(2)} ${cy.toFixed(2)} m ${xStart.toFixed(2)} ${yStart.toFixed(2)} l`);
    const hi = a1 < a ? a : a + Math.PI * 2;
    out.push(...bezierArc(cx, cy, r, a1, hi));
    out.push("f");
    a = a1;
  }
  return out.join("\n");
}

export function fanOps(
  box: { x: number; y: number; w: number; h: number },
  years: number[],
  bands: { p5: number[]; p25: number[]; p50: number[]; p75: number[]; p95: number[] },
  yLabel: string,
): string {
  const padL = 42;
  const padB = 22;
  const padT = 16;
  const padR = 8;
  const x0 = box.x + padL;
  const y0 = box.y + padB;
  const w = box.w - padL - padR;
  const h = box.h - padB - padT;
  const n = Math.min(years.length, bands.p50.length);
  let hi = 0;
  for (let i = 0; i < Math.max(n, 1); i++) {
    hi = Math.max(hi, nn(bands.p5[i], 0), nn(bands.p50[i], 0), nn(bands.p95[i], 0));
  }
  if (!Number.isFinite(hi) || hi <= 0) hi = 1;
  const yTicks = niceTicksFromZero(hi);
  const top = yTicks[yTicks.length - 1] ?? hi;
  const count = Math.max(n, 2);
  const X = (i: number) => x0 + (i / (count - 1)) * w;
  const Y = (v: number) => y0 + (nn(v, 0) / top) * h;
  const out: string[] = [];
  out.push(`0.4 w ${rgb(C.rule, "RG")}`);
  out.push(`${nn(x0).toFixed(2)} ${nn(y0).toFixed(2)} m ${nn(x0 + w).toFixed(2)} ${nn(y0).toFixed(2)} l S`);
  out.push(`${nn(x0).toFixed(2)} ${nn(y0).toFixed(2)} m ${nn(x0).toFixed(2)} ${nn(y0 + h).toFixed(2)} l S`);
  if (n < 2) {
    out.push(
      `BT /F1 7 Tf ${rgb(C.muted, "rg")} 1 0 0 1 ${nn(x0).toFixed(2)} ${nn(y0 + h / 2).toFixed(2)} Tm ${pdfString("Insufficient path history")} Tj ET`,
    );
    return out.join("\n");
  }

  const band = (top: number[], bot: number[], color: RGB, a: number) => {
    out.push(`${color[0]} ${color[1]} ${color[2]} ${a.toFixed(2)} rg`);
    // PDF has no per-path alpha in 1.4 without ExtGState. Mix with white instead.
    const mixed: RGB = [
      color[0] * a + 1 * (1 - a),
      color[1] * a + 1 * (1 - a),
      color[2] * a + 1 * (1 - a),
    ];
    out.pop();
    out.push(rgb(mixed, "rg"));
    out.push(`${X(0).toFixed(2)} ${Y(top[0]!).toFixed(2)} m`);
    for (let i = 1; i < n; i++) out.push(`${X(i).toFixed(2)} ${Y(top[i]!).toFixed(2)} l`);
    for (let i = n - 1; i >= 0; i--) out.push(`${X(i).toFixed(2)} ${Y(bot[i]!).toFixed(2)} l`);
    out.push("f");
  };
  band(bands.p95, bands.p5, C.sage, 0.18);
  band(bands.p75, bands.p25, C.sage, 0.32);
  out.push(`${1.2} w ${rgb(C.navy, "RG")}`);
  out.push(`${X(0).toFixed(2)} ${Y(bands.p50[0]!).toFixed(2)} m`);
  for (let i = 1; i < n; i++) out.push(`${X(i).toFixed(2)} ${Y(bands.p50[i]!).toFixed(2)} l`);
  out.push("S");

  for (const v of yTicks) {
    const yy = Y(v);
    const lab = formatTick(v);
    const tw = textWidth(lab, "r", 7);
    out.push(
      `BT /F1 7 Tf ${rgb(C.muted, "rg")} 1 0 0 1 ${(x0 - 6 - tw).toFixed(2)} ${(yy - 2).toFixed(2)} Tm ${pdfString(lab)} Tj ET`,
    );
  }
  out.push(
    `BT /F1 7 Tf ${rgb(C.muted, "rg")} 1 0 0 1 ${x0.toFixed(2)} ${(box.y + 4).toFixed(2)} Tm ${pdfString(String(years[0]))} Tj ET`,
  );
  const last = String(years[n - 1]);
  const lw = textWidth(last, "r", 7);
  out.push(
    `BT /F1 7 Tf ${rgb(C.muted, "rg")} 1 0 0 1 ${(x0 + w - lw).toFixed(2)} ${(box.y + 4).toFixed(2)} Tm ${pdfString(last)} Tj ET`,
  );
  out.push(
    `BT /F1 7 Tf ${rgb(C.muted, "rg")} 1 0 0 1 ${(box.x).toFixed(2)} ${(y0 + h + 8).toFixed(2)} Tm ${pdfString(yLabel)} Tj ET`,
  );
  return out.join("\n");
}

function formatTick(v: number): string {
  const x = nn(v, 0);
  const a = Math.abs(x);
  if (a >= 1e9) {
    const n = x / 1e9;
    return Number.isInteger(n) ? `${n}bn` : `${n.toFixed(1)}bn`;
  }
  if (a >= 1e6) {
    const n = x / 1e6;
    return Number.isInteger(n) ? `${n}m` : `${n.toFixed(0)}m`;
  }
  if (a >= 1e3) return `${(x / 1e3).toFixed(0)}k`;
  if (a >= 10) return x.toFixed(0);
  return x.toFixed(1);
}

export function barPairOps(
  box: { x: number; y: number; w: number; h: number },
  rows: { label: string; a: number; b: number }[],
  legend: [string, string],
): string {
  const padL = 92;
  const padR = 12;
  const padT = 16;
  const padB = 8;
  const x0 = box.x + padL;
  const w = box.w - padL - padR;
  const innerH = box.h - padT - padB;
  const max = Math.max(1e-9, ...rows.flatMap((r) => [r.a, r.b]));
  const rowH = innerH / Math.max(rows.length, 1);
  const barH = Math.min(6, rowH * 0.32);
  const out: string[] = [];
  out.push(
    `BT /F1 7 Tf ${rgb(C.navy, "rg")} 1 0 0 1 ${x0.toFixed(2)} ${(box.y + box.h - 10).toFixed(2)} Tm ${pdfString(legend[0])} Tj ET`,
  );
  const l2 = textWidth(legend[1], "r", 7);
  out.push(
    `BT /F1 7 Tf ${rgb(C.bronze, "rg")} 1 0 0 1 ${(box.x + box.w - padR - l2).toFixed(2)} ${(box.y + box.h - 10).toFixed(2)} Tm ${pdfString(legend[1])} Tj ET`,
  );
  rows.forEach((r, i) => {
    const yMid = box.y + padB + innerH - (i + 0.5) * rowH;
    const tw = textWidth(r.label, "r", 7);
    out.push(
      `BT /F1 7 Tf ${rgb(C.ink, "rg")} 1 0 0 1 ${(x0 - 8 - tw).toFixed(2)} ${(yMid - 2).toFixed(2)} Tm ${pdfString(r.label)} Tj ET`,
    );
    const wa = (r.a / max) * w;
    const wb = (r.b / max) * w;
    out.push(rgb(C.navy, "rg"));
    out.push(`${x0.toFixed(2)} ${(yMid + 2).toFixed(2)} ${Math.max(0.4, wa).toFixed(2)} ${barH.toFixed(2)} re f`);
    out.push(rgb(C.bronze, "rg"));
    out.push(`${x0.toFixed(2)} ${(yMid - barH - 2).toFixed(2)} ${Math.max(0.4, wb).toFixed(2)} ${barH.toFixed(2)} re f`);
  });
  return out.join("\n");
}

export function lineOps(
  box: { x: number; y: number; w: number; h: number },
  series: { x: number; y: number }[][],
  colors: RGB[],
  yLabel: string,
): string {
  const padL = 36;
  const padB = 18;
  const padT = 14;
  const padR = 8;
  const x0 = box.x + padL;
  const y0 = box.y + padB;
  const w = box.w - padL - padR;
  const h = box.h - padB - padT;
  const pts = series.flat();
  if (pts.length < 2) return "";
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  if (maxY === minY) {
    maxY += 1;
    minY -= 1;
  }
  const X = (x: number) => x0 + ((x - minX) / (maxX - minX || 1)) * w;
  const Y = (y: number) => y0 + ((y - minY) / (maxY - minY || 1)) * h;
  const out: string[] = [];
  out.push(`0.35 w ${rgb(C.rule, "RG")} ${x0.toFixed(2)} ${y0.toFixed(2)} m ${(x0 + w).toFixed(2)} ${y0.toFixed(2)} l S`);
  series.forEach((s, si) => {
    if (s.length < 2) return;
    out.push(`1.1 w ${rgb(colors[si] ?? C.navy, "RG")}`);
    out.push(`${X(s[0]!.x).toFixed(2)} ${Y(s[0]!.y).toFixed(2)} m`);
    for (let i = 1; i < s.length; i++) out.push(`${X(s[i]!.x).toFixed(2)} ${Y(s[i]!.y).toFixed(2)} l`);
    out.push("S");
  });
  out.push(
    `BT /F1 7 Tf ${rgb(C.muted, "rg")} 1 0 0 1 ${box.x.toFixed(2)} ${(y0 + h + 6).toFixed(2)} Tm ${pdfString(yLabel)} Tj ET`,
  );
  return out.join("\n");
}
