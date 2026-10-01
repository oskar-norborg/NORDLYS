/** Sample, EWMA, and Ledoit–Wolf covariance. All from scratch. */

import { addMat, frobenius2, isPositiveDefinite, zeros } from "./matrix";
import { mean } from "./finance";

export type CovMethod = "sample" | "ewma" | "ledoit";

export interface ReturnFrame {
  labels: string[];
  dates: string[];
  /** T × N simple returns. */
  R: number[][];
}

export function covFromVolCorr(vol: number[], corr: number[][]): number[][] {
  const n = vol.length;
  const S = zeros(n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) S[i]![j] = vol[i]! * vol[j]! * corr[i]![j]!;
  }
  return S;
}

export function corrFromCov(S: number[][]): number[][] {
  const n = S.length;
  const C = zeros(n);
  const s = S.map((row, i) => Math.sqrt(Math.max(row[i]!, 0)));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const d = s[i]! * s[j]!;
      C[i]![j] = d > 0 ? S[i]![j]! / d : i === j ? 1 : 0;
    }
    C[i]![i] = 1;
  }
  return C;
}

export function columnMeans(R: number[][]): number[] {
  const T = R.length;
  const n = R[0]?.length ?? 0;
  const m = new Array<number>(n).fill(0);
  if (T === 0) return m;
  for (let t = 0; t < T; t++) {
    const row = R[t]!;
    for (let i = 0; i < n; i++) m[i] += row[i]!;
  }
  for (let i = 0; i < n; i++) m[i]! /= T;
  return m;
}

export function demean(R: number[][]): { X: number[][]; mu: number[] } {
  const mu = columnMeans(R);
  const X = R.map((row) => row.map((v, i) => v - mu[i]!));
  return { X, mu };
}

/** Unbiased sample covariance (1/(T-1)). */
export function sampleCovariance(R: number[][]): number[][] {
  const T = R.length;
  const n = R[0]?.length ?? 0;
  const S = zeros(n);
  if (T < 2) return S;
  const { X } = demean(R);
  const den = T - 1;
  for (let t = 0; t < T; t++) {
    const xt = X[t]!;
    for (let i = 0; i < n; i++) {
      const xi = xt[i]!;
      const Si = S[i]!;
      for (let j = 0; j < n; j++) Si[j] += xi * xt[j]!;
    }
  }
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) S[i]![j]! /= den;
  return S;
}

/**
 * RiskMetrics EWMA covariance. λ ≈ 0.94 daily, 0.97 monthly is common.
 * Recursion: Σ_t = λ Σ_{t-1} + (1-λ) r_t r_t'  (zero-mean).
 * Seeded with the sample covariance (or first outer product).
 */
export function ewmaCovariance(R: number[][], lambda = 0.94): number[][] {
  const T = R.length;
  const n = R[0]?.length ?? 0;
  const lam = Math.min(0.999, Math.max(0.5, lambda));
  const one = 1 - lam;
  const S = T >= 2 ? sampleCovariance(R) : zeros(n);
  if (T === 0) return S;
  for (let t = 0; t < T; t++) {
    const r = R[t]!;
    for (let i = 0; i < n; i++) {
      const ri = r[i]!;
      const Si = S[i]!;
      for (let j = 0; j < n; j++) Si[j] = lam * Si[j]! + one * ri * r[j]!;
    }
  }
  return S;
}

/**
 * Ledoit–Wolf (2004) shrinkage toward a constant-correlation target.
 * Uses the 1/T sample covariance of the paper. Result is SPD whenever the
 * target is (sample variances positive).
 */
export function ledoitWolfCovariance(R: number[][]): { cov: number[][]; delta: number; pd: boolean } {
  const T = R.length;
  const n = R[0]?.length ?? 0;
  if (T < 2 || n === 0) {
    const cov = zeros(n);
    return { cov, delta: 1, pd: n === 0 };
  }
  const { X } = demean(R);
  const S = zeros(n);
  for (let t = 0; t < T; t++) {
    const xt = X[t]!;
    for (let i = 0; i < n; i++) {
      const xi = xt[i]!;
      const Si = S[i]!;
      for (let j = 0; j < n; j++) Si[j] += xi * xt[j]!;
    }
  }
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) S[i]![j]! /= T;

  const sd = S.map((row, i) => Math.sqrt(Math.max(row[i]!, 1e-18)));
  let rBar = 0;
  let npair = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      rBar += S[i]![j]! / (sd[i]! * sd[j]!);
      npair += 1;
    }
  }
  rBar = npair > 0 ? rBar / npair : 0;
  const F = zeros(n);
  for (let i = 0; i < n; i++) {
    F[i]![i] = S[i]![i]!;
    for (let j = 0; j < i; j++) {
      const v = rBar * sd[i]! * sd[j]!;
      F[i]![j] = v;
      F[j]![i] = v;
    }
  }

  let piHat = 0;
  const theta = zeros(n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let acc = 0;
      let th_ii_ij = 0;
      const sij = S[i]![j]!;
      const sii = S[i]![i]!;
      for (let t = 0; t < T; t++) {
        const xit = X[t]![i]!;
        const xjt = X[t]![j]!;
        const d = xit * xjt - sij;
        acc += d * d;
        th_ii_ij += (xit * xit - sii) * d;
      }
      piHat += acc / T;
      theta[i]![j] = th_ii_ij / T;
    }
  }

  let rhoHat = 0;
  for (let i = 0; i < n; i++) rhoHat += theta[i]![i]!;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const term =
        (rBar / 2) *
        ((sd[j]! / sd[i]!) * theta[i]![j]! + (sd[i]! / sd[j]!) * theta[j]![i]!);
      rhoHat += term;
    }
  }

  const gamma = frobenius2(addMat(S, F, 1, -1));
  const kappa = gamma > 0 ? (piHat - rhoHat) / gamma : 0;
  const delta = Math.min(1, Math.max(0, kappa / T));
  const cov = addMat(S, F, 1 - delta, delta);
  for (let i = 0; i < n; i++) {
    if (!(cov[i]![i]! > 0)) cov[i]![i] = 1e-12;
  }
  return { cov, delta, pd: isPositiveDefinite(cov) };
}

export function estimateCovariance(R: number[][], method: CovMethod, lambda = 0.94): number[][] {
  if (method === "ewma") return ewmaCovariance(R, lambda);
  if (method === "ledoit") return ledoitWolfCovariance(R).cov;
  return sampleCovariance(R);
}

export function portfolioVariance(w: number[], S: number[][]): number {
  let v = 0;
  const n = w.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) v += w[i]! * S[i]![j]! * w[j]!;
  }
  return Math.max(v, 0);
}

