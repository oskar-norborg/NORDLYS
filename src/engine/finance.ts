/** Closed-form time-value-of-money and sample statistics. */

/** Ordinary annuity: FV = PV(1+r)^n + PMT*((1+r)^n - 1)/r. Per-period r, n, PMT. */
export function futureValue(pv: number, r: number, n: number, pmt: number): number {
  if (n === 0) return pv;
  if (Math.abs(r) < 1e-18) return pv + pmt * n;
  const growth = Math.pow(1 + r, n);
  return pv * growth + pmt * ((growth - 1) / r);
}

export function mean(xs: ArrayLike<number>): number {
  const n = xs.length;
  if (n === 0) return NaN;
  let s = 0;
  for (let i = 0; i < n; i++) s += xs[i]!;
  return s / n;
}

/** Sample standard deviation (Bessel-corrected, n-1). */
export function sampleStdev(xs: ArrayLike<number>): number {
  const n = xs.length;
  if (n < 2) return 0;
  const m = mean(xs);
  let v = 0;
  for (let i = 0; i < n; i++) {
    const d = xs[i]! - m;
    v += d * d;
  }
  return Math.sqrt(v / (n - 1));
}

/** Linear-interpolated percentile. `p` in [0, 1]. `sorted` must be ascending. */
export function percentileSorted(sorted: ArrayLike<number>, p: number): number {
  const n = sorted.length;
  if (n === 0) return NaN;
  if (n === 1) return sorted[0]!;
  const idx = Math.min(1, Math.max(0, p)) * (n - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo]!;
  const t = idx - lo;
  return sorted[lo]! * (1 - t) + sorted[hi]! * t;
}

export function percentile(xs: number[], p: number): number {
  const sorted = xs.slice().sort((a, b) => a - b);
  return percentileSorted(sorted, p);
}

export function medianOf(xs: number[]): number {
  if (xs.length === 0) return 0;
  return percentile(xs, 0.5);
}

export function relativeError(actual: number, expected: number): number {
  const denom = Math.max(Math.abs(expected), 1e-18);
  return Math.abs(actual - expected) / denom;
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

export function sum(xs: ArrayLike<number>): number {
  let s = 0;
  for (let i = 0; i < xs.length; i++) s += xs[i]!;
  return s;
}

/** Annual arithmetic stats of a weight vector under CMA (μ, Σ). */
export function portfolioMoments(
  weights: number[],
  mu: number[],
  vol: number[],
  corr: number[][],
): { mu: number; vol: number } {
  const n = weights.length;
  let m = 0;
  for (let i = 0; i < n; i++) m += weights[i]! * mu[i]!;
  let v = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      v += weights[i]! * weights[j]! * vol[i]! * vol[j]! * corr[i]![j]!;
    }
  }
  return { mu: m, vol: Math.sqrt(Math.max(v, 0)) };
}
