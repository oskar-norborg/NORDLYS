/** VaR, ES, drawdown, ratios, contributions, stress. */

import { createRng } from "./prng";
import { cholesky, matVec } from "./matrix";
import { mean, percentile, sampleStdev } from "./finance";
import { normInv, normPdf } from "./norm";
import { portfolioVariance } from "./cov";
import type { AssetId } from "./types";
import { ASSET_IDS } from "./types";
import type { Holding, LedgerBundle, NavPoint } from "./ledger/types";
import { computeHoldings } from "./ledger/holdings";
import { computeReturns } from "./ledger/returns";
import { lookupFx, lookupPrice } from "./ledger/securities";

export type VarMethod = "historical" | "normal" | "cornish" | "montecarlo";

export interface VarEs {
  var: number;
  es: number;
  method: VarMethod;
  alpha: number;
}

export interface DrawdownStats {
  underwater: { date: string; dd: number }[];
  maxDd: number;
  maxDdStart: string;
  maxDdTrough: string;
  recoveryDays: number | null;
  recovered: boolean;
}

export interface RatioStats {
  mean: number;
  vol: number;
  sharpe: number;
  sortino: number;
  calmar: number;
  beta: number | null;
  te: number | null;
  ir: number | null;
  rf: number;
}

export function simpleReturns(values: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const a = values[i - 1]!;
    const b = values[i]!;
    if (a > 0 && Number.isFinite(b)) out.push(b / a - 1);
  }
  return out;
}

function skewKurt(xs: number[]): { skew: number; exKurt: number } {
  const n = xs.length;
  if (n < 4) return { skew: 0, exKurt: 0 };
  const m = mean(xs);
  let m2 = 0;
  let m3 = 0;
  let m4 = 0;
  for (const x of xs) {
    const d = x - m;
    const d2 = d * d;
    m2 += d2;
    m3 += d2 * d;
    m4 += d2 * d2;
  }
  m2 /= n;
  m3 /= n;
  m4 /= n;
  const s = Math.sqrt(Math.max(m2, 1e-18));
  return { skew: m3 / (s * s * s), exKurt: m4 / (m2 * m2) - 3 };
}

export function historicalVarEs(returns: number[], alpha: number): VarEs {
  const losses = returns.map((r) => -r).sort((a, b) => a - b);
  const v = percentile(losses, alpha);
  const tail = losses.filter((x) => x >= v - 1e-18);
  const es = tail.length ? mean(tail) : v;
  return { var: v, es, method: "historical", alpha };
}

export function normalVarEs(returns: number[], alpha: number): VarEs {
  const mu = mean(returns);
  const sig = sampleStdev(returns);
  const z = normInv(alpha);
  const v = -mu + sig * z;
  const es = -mu + sig * (normPdf(z) / (1 - alpha));
  return { var: v, es, method: "normal", alpha };
}

export function cornishFisherVarEs(returns: number[], alpha: number): VarEs {
  const mu = mean(returns);
  const sig = sampleStdev(returns);
  const { skew, exKurt } = skewKurt(returns);
  const quantile = (p: number) => {
    const z = normInv(p);
    const z2 = z * z;
    const z3 = z2 * z;
    return z + (z2 - 1) * skew / 6 + (z3 - 3 * z) * exKurt / 24 - (2 * z3 - 5 * z) * (skew * skew) / 36;
  };
  const w = quantile(alpha);
  const v = -mu + sig * w;
  const steps = 48;
  let acc = 0;
  for (let i = 1; i <= steps; i++) {
    const p = alpha + ((1 - alpha) * i) / steps;
    acc += -mu + sig * quantile(p);
  }
  const es = acc / steps;
  return { var: v, es, method: "cornish", alpha };
}

export function mcVarEs(
  mu: number[],
  cov: number[][],
  weights: number[],
  alpha: number,
  nPaths: number,
  seed: number,
): VarEs {
  const n = weights.length;
  const L = cholesky(cov);
  const rng = createRng(seed);
  const losses: number[] = [];
  const z = new Float64Array(n);
  for (let p = 0; p < nPaths; p++) {
    for (let i = 0; i < n; i++) z[i] = rng.gaussian();
    let r = 0;
    for (let i = 0; i < n; i++) {
      let s = 0;
      const Li = L[i]!;
      for (let j = 0; j <= i; j++) s += Li[j]! * z[j]!;
      r += weights[i]! * (mu[i]! + s);
    }
    losses.push(-r);
  }
  losses.sort((a, b) => a - b);
  const v = percentile(losses, alpha);
  const tail = losses.filter((x) => x >= v - 1e-18);
  return { var: v, es: tail.length ? mean(tail) : v, method: "montecarlo", alpha };
}

export function computeVarEs(returns: number[], method: VarMethod, alpha: number, mc?: {
  mu: number[];
  cov: number[][];
  weights: number[];
  nPaths: number;
  seed: number;
}): VarEs {
  if (method === "normal") return normalVarEs(returns, alpha);
  if (method === "cornish") return cornishFisherVarEs(returns, alpha);
  if (method === "montecarlo" && mc) return mcVarEs(mc.mu, mc.cov, mc.weights, alpha, mc.nPaths, mc.seed);
  return historicalVarEs(returns, alpha);
}

export function drawdownFromNav(nav: NavPoint[]): DrawdownStats {
  const underwater: { date: string; dd: number }[] = [];
  let peak = -Infinity;
  let peakDate = nav[0]?.date ?? "";
  let maxDd = 0;
  let maxDdStart = peakDate;
  let maxDdTrough = peakDate;
  let troughDate = peakDate;
  let recovered = true;
  let recoveryDays: number | null = 0;
  let inDraw = false;
  let ddStart = peakDate;
  const toTime = (d: string) => Date.parse(d + "T00:00:00Z");

  for (const p of nav) {
    if (p.value > peak) {
      if (inDraw && peak > 0) {
        const days = Math.round((toTime(p.date) - toTime(ddStart)) / 86400000);
        if (recoveryDays == null || days > recoveryDays) recoveryDays = days;
      }
      peak = p.value;
      peakDate = p.date;
      inDraw = false;
    }
    const dd = peak > 0 ? p.value / peak - 1 : 0;
    underwater.push({ date: p.date, dd });
    if (dd < maxDd) {
      maxDd = dd;
      maxDdStart = peakDate;
      maxDdTrough = p.date;
      troughDate = p.date;
      ddStart = peakDate;
      inDraw = true;
      recovered = false;
    } else if (dd < -1e-12) {
      inDraw = true;
    } else if (inDraw && Math.abs(dd) < 1e-12) {
      recovered = true;
      inDraw = false;
    }
  }
  if (inDraw) {
    recovered = false;
    recoveryDays = null;
  }
  void troughDate;
  return { underwater, maxDd, maxDdStart, maxDdTrough, recoveryDays, recovered };
}

export function ratiosFromReturns(
  returns: number[],
  rf: number,
  maxDd: number,
  periodsPerYear: number,
  bench?: number[],
): RatioStats {
  const muP = mean(returns);
  const volP = sampleStdev(returns);
  const annMu = muP * periodsPerYear;
  const annVol = volP * Math.sqrt(periodsPerYear);
  const excess = returns.map((r) => r - rf / periodsPerYear);
  const sharpe = annVol > 0 ? (mean(excess) * periodsPerYear) / annVol : 0;
  const down = excess.filter((r) => r < 0);
  let downVar = 0;
  for (const r of down) downVar += r * r;
  const downDev = down.length ? Math.sqrt(downVar / down.length) * Math.sqrt(periodsPerYear) : 0;
  const sortino = downDev > 0 ? (mean(excess) * periodsPerYear) / downDev : 0;
  const calmar = Math.abs(maxDd) > 1e-12 ? annMu / Math.abs(maxDd) : 0;
  let beta: number | null = null;
  let te: number | null = null;
  let ir: number | null = null;
  if (bench && bench.length === returns.length && bench.length > 2) {
    const mb = mean(bench);
    const mp = muP;
    let cv = 0;
    let vb = 0;
    for (let i = 0; i < returns.length; i++) {
      cv += (returns[i]! - mp) * (bench[i]! - mb);
      vb += (bench[i]! - mb) * (bench[i]! - mb);
    }
    const den = bench.length - 1;
    beta = vb > 0 ? cv / vb : null;
    const active = returns.map((r, i) => r - bench[i]!);
    te = sampleStdev(active) * Math.sqrt(periodsPerYear);
    ir = te > 0 ? mean(active) * periodsPerYear / te : 0;
  }
  return { mean: annMu, vol: annVol, sharpe, sortino, calmar, beta, te, ir, rf };
}

export interface RiskContrib {
  label: string;
  weight: number;
  retContrib: number;
  mcr: number;
  ctr: number;
  pctr: number;
}

export function riskContributions(weights: number[], mu: number[], cov: number[][], labels: string[]): RiskContrib[] {
  const sig = Math.sqrt(portfolioVariance(weights, cov));
  const Sw = matVec(cov, weights);
  const out: RiskContrib[] = [];
  for (let i = 0; i < weights.length; i++) {
    const mcr = sig > 0 ? Sw[i]! / sig : 0;
    const ctr = weights[i]! * mcr;
    out.push({
      label: labels[i] ?? String(i),
      weight: weights[i]!,
      retContrib: weights[i]! * mu[i]!,
      mcr,
      ctr,
      pctr: sig > 0 ? ctr / sig : 0,
    });
  }
  return out;
}

export interface StressResult {
  baseNok: number;
  shockedNok: number;
  pnl: number;
  pnlPct: number;
  rows: { label: string; base: number; shocked: number; pnl: number }[];
}

export function stressHoldings(
  holdings: Holding[],
  cash: number,
  assetShocks: Record<AssetId, number>,
  fxShocks: Record<string, number>,
): StressResult {
  const rows: StressResult["rows"] = [];
  let base = cash;
  let shocked = cash;
  for (const h of holdings) {
    const aShock = assetShocks[h.security.assetClass] ?? 0;
    const ccy = h.security.currency;
    const fShock = ccy === "NOK" ? 0 : (fxShocks[`${ccy}NOK`] ?? fxShocks[ccy] ?? 0);
    const b = h.marketNok;
    const s = h.qty * h.price * (1 + aShock) * h.fx * (1 + fShock);
    base += b;
    shocked += s;
    rows.push({ label: h.security.ticker || h.isin, base: b, shocked: s, pnl: s - b });
  }
  return {
    baseNok: base,
    shockedNok: shocked,
    pnl: shocked - base,
    pnlPct: base > 0 ? (shocked - base) / base : 0,
    rows,
  };
}

export interface AssetReturnFrame {
  labels: string[];
  ids: string[];
  dates: string[];
  R: number[][];
  mu: number[];
  weights: number[];
  kind: "holdings" | "asset_class" | "cma";
}

function monthEndDates(start: string, end: string): string[] {
  const out: string[] = [];
  const [ys, ms] = start.split("-").map(Number);
  let y = ys!;
  let m = ms!;
  const endKey = end.slice(0, 7);
  while (`${y}-${String(m).padStart(2, "0")}` <= endKey) {
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const iso = `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
    if (iso >= start && iso <= end) out.push(iso);
    m += 1;
    if (m === 13) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

export function holdingReturnFrame(ledger: LedgerBundle, asOf: string): AssetReturnFrame | null {
  const secs = ledger.securities.filter((s) => ledger.prices.some((p) => p.isin === s.isin));
  if (secs.length < 2 || ledger.prices.length < 8) return null;
  const dates = [...new Set(ledger.prices.map((p) => p.date))].filter((d) => d <= asOf).sort();
  const months = monthEndDates(dates[0]!, asOf);
  if (months.length < 4) return null;
  const snap = computeHoldings(ledger, "fifo", asOf);
  const live = snap.holdings.filter((h) => h.qty > 0);
  if (live.length < 2) return null;
  const R: number[][] = [];
  const usedDates: string[] = [];
  const prev = new Array<number>(live.length).fill(NaN);
  for (const d of months) {
    const row: number[] = [];
    let ok = true;
    for (let i = 0; i < live.length; i++) {
      const h = live[i]!;
      const px = lookupPrice(ledger.prices, h.isin, d);
      if (!px) {
        ok = false;
        break;
      }
      const pair = `${h.security.currency}NOK`;
      const fx = h.security.currency === "NOK" ? 1 : (lookupFx(ledger.fx, pair, d)?.rate ?? h.fx);
      const nok = px.close * fx;
      if (Number.isFinite(prev[i]) && prev[i]! > 0) row.push(nok / prev[i]! - 1);
      else row.push(NaN);
      prev[i] = nok;
    }
    if (ok && row.every((v) => Number.isFinite(v))) {
      R.push(row);
      usedDates.push(d);
    }
  }
  if (R.length < 3) return null;
  const weights = live.map((h) => h.weight);
  const mu = new Array(live.length).fill(0);
  for (const row of R) for (let i = 0; i < row.length; i++) mu[i] += row[i]!;
  for (let i = 0; i < mu.length; i++) mu[i]! /= R.length;
  return {
    labels: live.map((h) => h.security.ticker || h.isin),
    ids: live.map((h) => h.isin),
    dates: usedDates,
    R,
    mu,
    weights,
    kind: "holdings",
  };
}

export function classReturnFrame(ledger: LedgerBundle, asOf: string): AssetReturnFrame | null {
  const stats = computeReturns(ledger, "fifo", asOf);
  if (stats.nav.length < 6) return null;
  const months = stats.nav.filter((_, i) => i === 0 || i === stats.nav.length - 1 || stats.nav[i]!.date.endsWith("-28") || /-\d{2}-(\d{2})$/.test(stats.nav[i]!.date));
  const dates = [...new Set(stats.nav.map((n) => n.date))].sort();
  const sample = dates.filter((_, i) => i % Math.max(1, Math.floor(dates.length / 48)) === 0 || i === dates.length - 1);
  const series: number[][] = ASSET_IDS.map(() => []);
  const used: string[] = [];
  const prev = new Array(ASSET_IDS.length).fill(NaN);
  for (const d of sample) {
    const h = computeHoldings(ledger, "fifo", d);
    const row: number[] = [];
    for (let i = 0; i < ASSET_IDS.length; i++) {
      const v = h.allocation[i]?.value ?? 0;
      if (Number.isFinite(prev[i]) && prev[i]! > 1e-6 && v > 1e-6) row.push(v / prev[i]! - 1);
      else row.push(NaN);
      prev[i] = v;
    }
    if (row.every((x) => Number.isFinite(x))) {
      series.forEach((s, i) => s.push(row[i]!));
      used.push(d);
    }
  }
  if (used.length < 3) return null;
  const T = used.length;
  const R: number[][] = [];
  for (let t = 0; t < T; t++) R.push(ASSET_IDS.map((_, i) => series[i]![t]!));
  const last = computeHoldings(ledger, "fifo", asOf);
  const mu = ASSET_IDS.map((_, i) => mean(series[i]!));
  void months;
  return {
    labels: ASSET_IDS.map((id) => id),
    ids: [...ASSET_IDS],
    dates: used,
    R,
    mu,
    weights: last.allocation.map((a) => a.weight),
    kind: "asset_class",
  };
}

export function annualizeFactor(dates: string[]): number {
  if (dates.length < 2) return 12;
  const a = Date.parse(dates[0]! + "T00:00:00Z");
  const b = Date.parse(dates[dates.length - 1]! + "T00:00:00Z");
  const years = (b - a) / (365.25 * 86400000);
  if (years <= 0) return 12;
  return (dates.length - 1) / years;
}
