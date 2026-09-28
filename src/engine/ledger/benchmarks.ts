import { createRng } from "../prng";
import { defaultCma } from "../portfolios";
import { portfolioMoments } from "../finance";
import { round4 } from "./numbers";
import type { BenchmarkQuote, LedgerBundle } from "./types";

export interface Benchmark {
  id: string;
  label: string;
  weights: number[];
}

export const BENCHMARKS: Benchmark[] = [
  { id: "world", label: "MSCI World", weights: [1, 0, 0, 0, 0, 0] },
  { id: "spx", label: "S&P 500", weights: [0, 1, 0, 0, 0, 0] },
  { id: "osebx", label: "OSEBX", weights: [0, 0, 1, 0, 0, 0] },
  { id: "balanced", label: "Global 60/40", weights: [0.6, 0, 0, 0.4, 0, 0] },
];

/** Demo-only GBM path. Never call this for My Data. */
export function benchmarkSeries(
  id: string,
  dates: string[],
  seed = 20260321,
): { date: string; value: number }[] {
  if (dates.length === 0) return [];
  const b = BENCHMARKS.find((x) => x.id === id) ?? BENCHMARKS[0]!;
  const cma = defaultCma();
  const { mu, vol } = portfolioMoments(b.weights, cma.mu, cma.vol, cma.corr);
  const rng = createRng(seed + id.length * 17);
  const out: { date: string; value: number }[] = [];
  let v = 100;
  let prev: string | null = null;
  for (const date of dates) {
    if (prev) {
      const dt = (Date.parse(date) - Date.parse(prev)) / (365 * 86400000);
      const z = rng.gaussian();
      v *= Math.exp((mu - 0.5 * vol * vol) * dt + vol * Math.sqrt(Math.max(dt, 0)) * z);
    }
    out.push({ date, value: round4(v) });
    prev = date;
  }
  return out;
}

export function storedBenchmarkSeries(
  ledger: LedgerBundle,
  id: string,
): { date: string; value: number }[] {
  return (ledger.benchmarks ?? [])
    .filter((q) => q.id === id)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((q) => ({ date: q.date, value: q.value }));
}

/**
 * My Data: only stored (imported) quotes — never a generated path.
 * Demo: stored quotes if present, otherwise a seeded CMA path used to seed the demo ledger.
 */
export function resolveBenchmarkSeries(
  ledger: LedgerBundle,
  id: string,
  mode: "demo" | "mydata",
  dates: string[],
): { date: string; value: number }[] {
  const stored = storedBenchmarkSeries(ledger, id);
  if (stored.length >= 2) return stored;
  if (mode === "demo") return benchmarkSeries(id, dates);
  return [];
}

export function buildSyntheticBenchmarks(dates: string[], seed = 20260321): BenchmarkQuote[] {
  const out: BenchmarkQuote[] = [];
  for (const b of BENCHMARKS) {
    for (const p of benchmarkSeries(b.id, dates, seed)) {
      out.push({ id: b.id, date: p.date, value: p.value, source: "synthetic" });
    }
  }
  return out;
}
