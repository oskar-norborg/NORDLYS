/** Technical indicators. RSI uses Wilder's smoothing. */

import { sampleStdev } from "../finance";

export function sma(xs: ArrayLike<number>, period: number): number | undefined {
  const n = xs.length;
  if (!(period >= 1) || n < period) return undefined;
  let s = 0;
  for (let i = n - period; i < n; i++) s += xs[i]!;
  return s / period;
}

export function ema(xs: ArrayLike<number>, period: number): number | undefined {
  const n = xs.length;
  if (!(period >= 1) || n < period) return undefined;
  const k = 2 / (period + 1);
  let e = 0;
  for (let i = 0; i < period; i++) e += xs[i]!;
  e /= period;
  for (let i = period; i < n; i++) e = xs[i]! * k + e * (1 - k);
  return e;
}

export function stdev(xs: ArrayLike<number>, period: number): number | undefined {
  const n = xs.length;
  if (!(period >= 2) || n < period) return undefined;
  const slice: number[] = [];
  for (let i = n - period; i < n; i++) slice.push(xs[i]!);
  return sampleStdev(slice);
}

/** Rate of change: close / close[n] − 1. Needs n+1 prices. */
export function momentum(xs: ArrayLike<number>, period: number): number | undefined {
  const n = xs.length;
  if (!(period >= 1) || n < period + 1) return undefined;
  const now = xs[n - 1]!;
  const then = xs[n - 1 - period]!;
  if (!(then > 0) || !Number.isFinite(now)) return undefined;
  return now / then - 1;
}

/**
 * Wilder RSI. First average is the SMA of the first `period` changes
 * (needs `period + 1` prices). Later values use
 * avg = (prev * (period − 1) + current) / period.
 */
export function rsiWilder(xs: ArrayLike<number>, period: number): number | undefined {
  const n = xs.length;
  if (!(period >= 1) || n < period + 1) return undefined;
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const ch = xs[i]! - xs[i - 1]!;
    if (ch >= 0) avgGain += ch;
    else avgLoss -= ch;
  }
  avgGain /= period;
  avgLoss /= period;
  for (let i = period + 1; i < n; i++) {
    const ch = xs[i]! - xs[i - 1]!;
    const g = ch > 0 ? ch : 0;
    const l = ch < 0 ? -ch : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
  }
  if (avgLoss === 0) return avgGain > 0 ? 100 : 50;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/** First index at which sma(period) is defined. */
export function smaReadyAt(period: number): number {
  return Math.max(0, period - 1);
}

export function rsiReadyAt(period: number): number {
  return Math.max(0, period);
}
