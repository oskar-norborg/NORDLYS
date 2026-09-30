/** Advisory ladder books. Optimizer first; fallback weights if the QP misses the bands. */

import { covFromVolCorr } from "./cov";
import { describeConstraints, minVariance, type MvConstraints } from "./optimize";
import type { CapitalMarketAssumptions, ModelPortfolio } from "./types";

const BOOK_META: { id: string; name: string; riskLevel: number; blurb: string }[] = [
  { id: "conservative", name: "Conservative", riskLevel: 1, blurb: "Lowest-risk book on the advisory ladder." },
  { id: "mod_conservative", name: "Moderately Conservative", riskLevel: 2, blurb: "Still mostly bonds, with a measured equity sleeve." },
  { id: "balanced", name: "Balanced", riskLevel: 3, blurb: "Default planning mix. Mid-ladder equity." },
  { id: "growth", name: "Growth", riskLevel: 4, blurb: "Equity-led book with a residual bond sleeve." },
  { id: "aggressive", name: "Aggressive", riskLevel: 5, blurb: "Near-full equity inside the same class caps." },
];

export const FALLBACK_BOOKS: ModelPortfolio[] = [
  { ...BOOK_META[0]!, weights: [0.1, 0.06, 0.04, 0.62, 0.1, 0.08], source: "fallback" },
  { ...BOOK_META[1]!, weights: [0.18, 0.14, 0.08, 0.44, 0.12, 0.04], source: "fallback" },
  { ...BOOK_META[2]!, weights: [0.28, 0.2, 0.12, 0.26, 0.1, 0.04], source: "fallback" },
  { ...BOOK_META[3]!, weights: [0.36, 0.26, 0.18, 0.12, 0.06, 0.02], source: "fallback" },
  { ...BOOK_META[4]!, weights: [0.42, 0.3, 0.23, 0.03, 0.02, 0.0], source: "fallback" },
];

const LADDER = [
  { equity: 0.2, cashCap: 0.1, bondFloor: 0.5, bondCap: 0.72 },
  { equity: 0.4, cashCap: 0.05, bondFloor: 0.35, bondCap: 0.52 },
  { equity: 0.6, cashCap: 0.05, bondFloor: 0.2, bondCap: 0.36 },
  { equity: 0.8, cashCap: 0.05, bondFloor: 0.08, bondCap: 0.18 },
  { equity: 0.95, cashCap: 0.05, bondFloor: 0.01, bondCap: 0.08 },
] as const;

export function equityShare(w: number[]): number {
  return (w[0] ?? 0) + (w[1] ?? 0) + (w[2] ?? 0);
}

export function bondShare(w: number[]): number {
  return w[3] ?? 0;
}

export function bookMeetsLadder(w: number[], step: number): boolean {
  const spec = LADDER[Math.max(0, Math.min(LADDER.length - 1, step))]!;
  const eq = equityShare(w);
  if ((w[0] ?? 0) < 0.049) return false;
  if ((w[1] ?? 0) <= 0 || (w[2] ?? 0) <= 0) return false;
  if ((w[2] ?? 0) > 0.3 + 1e-8) return false;
  if ((w[5] ?? 0) > spec.cashCap + 1e-6) return false;
  if (eq < spec.equity - 0.02 || eq > spec.equity + 0.02) return false;
  if ((w[3] ?? 0) + 1e-8 < spec.bondFloor) return false;
  if ((w[3] ?? 0) > spec.bondCap + 1e-8) return false;
  return true;
}

export function ladderConstraints(step: number, n = 6): MvConstraints {
  const spec = LADDER[Math.max(0, Math.min(LADDER.length - 1, step))]!;
  const caps = new Array(n).fill(0.55);
  caps[0] = 0.55;
  caps[1] = 0.4;
  caps[2] = 0.3;
  if (n > 3) caps[3] = spec.bondCap;
  if (n > 4) caps[4] = 0.2;
  if (n > 5) caps[5] = spec.cashCap;
  return {
    longOnly: true,
    caps,
    groups: [
      { name: "Equities", indices: [0, 1, 2].filter((i) => i < n), cap: spec.equity + 0.012 },
      { name: "Real estate", indices: [4].filter((i) => i < n), cap: 0.2 },
    ],
  };
}

function normalize(w: number[]): number[] {
  const s = w.reduce((a, b) => a + b, 0);
  if (!(s > 0)) return w.map(() => 1 / Math.max(w.length, 1));
  return w.map((v) => v / s);
}

let booksCacheKey = "";
let booksCache: ModelPortfolio[] | null = null;

export function modelBooks(cma: CapitalMarketAssumptions): ModelPortfolio[] {
  const key = JSON.stringify(cma);
  if (booksCache && booksCacheKey === key) return booksCache;
  const n = cma.mu.length;
  try {
    const cov = covFromVolCorr(cma.vol, cma.corr);
    const books: ModelPortfolio[] = LADDER.map((_spec, i) => {
      const cons = ladderConstraints(i, n);
      const sol = minVariance(cov, cons);
      const w = normalize(sol.x.slice());
      const fromOpt = describeConstraints(w, cons).ok && bookMeetsLadder(w, i);
      if (!fromOpt) {
        return { ...BOOK_META[i]!, weights: normalize(FALLBACK_BOOKS[i]!.weights.slice(0, n)), source: "fallback" };
      }
      return { ...BOOK_META[i]!, weights: w, source: "optimizer" };
    });
    booksCache = books;
    booksCacheKey = key;
    return booksCache;
  } catch {
    booksCache = FALLBACK_BOOKS.map((b) => ({ ...b, weights: b.weights.slice(), source: "fallback" as const }));
    booksCacheKey = key;
    return booksCache;
  }
}
