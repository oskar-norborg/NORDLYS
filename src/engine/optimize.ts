/** Mean-variance active-set QP, risk parity, Black–Litterman. */

import {
  addDiag,
  cloneMatrix,
  invertMatrix,
  matMul,
  matVec,
  solveLinear,
  transpose,
  vecDot,
  zeros,
} from "./matrix";
import { covFromVolCorr, portfolioVariance } from "./cov";
import type { CapitalMarketAssumptions, ModelPortfolio } from "./types";

export interface GroupCap {
  name: string;
  indices: number[];
  cap: number;
  floor?: number;
}

export interface MvConstraints {
  longOnly: boolean;
  caps: number[];
  floors?: number[];
  groups: GroupCap[];
}

export interface KktResiduals {
  stationarity: number;
  primalEq: number;
  primalIneq: number;
  complementary: number;
  dual: number;
  max: number;
}

export interface QpResult {
  x: number[];
  value: number;
  eqLam: number[];
  ineqLam: number[];
  iters: number;
  kkt: KktResiduals;
  feasible: boolean;
}

const EQ_TOL = 1e-12;
const STEP_TOL = 1e-14;

function dot(a: number[], b: ArrayLike<number>): number {
  return vecDot(a, b);
}

function solveEqualityQp(
  H: number[][],
  g: number[],
  A: number[][],
  b: number[],
): { x: number[]; lam: number[] } {
  const n = g.length;
  const m = A.length;
  if (m === 0) {
    const x = solveLinear(addDiag(H, 1e-14), g.map((v) => -v));
    return { x, lam: [] };
  }
  const k = n + m;
  const K = zeros(k);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) K[i]![j] = H[i]![j]!;
    K[i]![i]! += 1e-14;
    for (let j = 0; j < m; j++) {
      K[i]![n + j] = A[j]![i]!;
      K[n + j]![i] = A[j]![i]!;
    }
  }
  const rhs = new Array<number>(k).fill(0);
  for (let i = 0; i < n; i++) rhs[i] = -g[i]!;
  for (let j = 0; j < m; j++) rhs[n + j] = b[j]!;
  let z: number[];
  try {
    z = solveLinear(K, rhs);
  } catch {
    for (let i = 0; i < n; i++) K[i]![i]! += 1e-8;
    z = solveLinear(K, rhs);
  }
  return { x: z.slice(0, n), lam: z.slice(n) };
}

export function kktOf(
  H: number[][],
  g: number[],
  Aeq: number[][],
  beq: number[],
  Aineq: number[][],
  bineq: number[],
  x: number[],
  eqLam: number[],
  ineqLam: number[],
): KktResiduals {
  const n = x.length;
  const grad = matVec(H, x);
  for (let i = 0; i < n; i++) grad[i]! += g[i]!;
  for (let i = 0; i < Aeq.length; i++) {
    const lam = eqLam[i] ?? 0;
    const row = Aeq[i]!;
    for (let j = 0; j < n; j++) grad[j]! += lam * row[j]!;
  }
  for (let i = 0; i < Aineq.length; i++) {
    const lam = ineqLam[i] ?? 0;
    const row = Aineq[i]!;
    for (let j = 0; j < n; j++) grad[j]! += lam * row[j]!;
  }
  let stationarity = 0;
  for (const v of grad) stationarity = Math.max(stationarity, Math.abs(v));

  let primalEq = 0;
  for (let i = 0; i < Aeq.length; i++) {
    primalEq = Math.max(primalEq, Math.abs(dot(Aeq[i]!, x) - beq[i]!));
  }
  let primalIneq = 0;
  let complementary = 0;
  let dual = 0;
  for (let i = 0; i < Aineq.length; i++) {
    const slack = bineq[i]! - dot(Aineq[i]!, x);
    primalIneq = Math.max(primalIneq, Math.max(0, -slack));
    const lam = ineqLam[i] ?? 0;
    dual = Math.max(dual, Math.max(0, -lam));
    complementary = Math.max(complementary, Math.abs(lam * slack));
  }
  const max = Math.max(stationarity, primalEq, primalIneq, complementary, dual);
  return { stationarity, primalEq, primalIneq, complementary, dual, max };
}

/**
 * Primal active-set solver for
 *   min  1/2 x' H x + g' x
 *   s.t. Aeq x = beq,  Aineq x ≤ bineq
 */
export function solveQP(
  H: number[][],
  g: number[],
  Aeq: number[][],
  beq: number[],
  Aineq: number[][],
  bineq: number[],
  x0?: number[],
): QpResult {
  const n = g.length;
  const mI = Aineq.length;
  let x = (x0 ?? new Array(n).fill(1 / n)).slice();
  for (let sweep = 0; sweep < 8; sweep++) {
    for (let i = 0; i < mI; i++) {
      const viol = dot(Aineq[i]!, x) - bineq[i]!;
      if (viol > 0) {
        const row = Aineq[i]!;
        const nn = vecDot(row, row) || 1;
        for (let j = 0; j < n; j++) x[j]! -= (viol * row[j]!) / nn;
      }
    }
    for (let i = 0; i < Aeq.length; i++) {
      const err = dot(Aeq[i]!, x) - beq[i]!;
      const row = Aeq[i]!;
      const nn = vecDot(row, row) || 1;
      for (let j = 0; j < n; j++) x[j]! -= (err * row[j]!) / nn;
    }
  }

  const W: number[] = [];
  for (let i = 0; i < mI; i++) {
    if (dot(Aineq[i]!, x) >= bineq[i]! - 1e-10) W.push(i);
  }

  let eqLam = new Array<number>(Aeq.length).fill(0);
  let ineqLam = new Array<number>(mI).fill(0);
  let iters = 0;

  for (iters = 0; iters < 120; iters++) {
    while (W.length + Aeq.length > n && W.length) W.pop();
    const Arows = [...Aeq, ...W.map((i) => Aineq[i]!)];
    const brows = [...beq, ...W.map((i) => bineq[i]!)];
    const { x: xHat, lam } = solveEqualityQp(H, g, Arows, brows);
    eqLam = lam.slice(0, Aeq.length);
    const lamW = lam.slice(Aeq.length);
    ineqLam = new Array<number>(mI).fill(0);
    for (let k = 0; k < W.length; k++) ineqLam[W[k]!] = lamW[k] ?? 0;

    const p = xHat.map((v, i) => v - x[i]!);
    let pNorm = 0;
    for (const v of p) pNorm = Math.max(pNorm, Math.abs(v));

    if (pNorm < 1e-12) {
      let dropAt = -1;
      let minLam = -1e-12;
      for (let k = 0; k < W.length; k++) {
        const lamk = lamW[k] ?? 0;
        if (lamk < minLam) {
          minLam = lamk;
          dropAt = k;
        }
      }
      if (dropAt < 0) {
        x = xHat;
        break;
      }
      W.splice(dropAt, 1);
      x = xHat;
      continue;
    }

    let alpha = 1;
    let block = -1;
    for (let i = 0; i < mI; i++) {
      if (W.includes(i)) continue;
      const ap = dot(Aineq[i]!, p);
      if (ap <= STEP_TOL) continue;
      const slack = bineq[i]! - dot(Aineq[i]!, x);
      const t = slack / ap;
      if (t < alpha - 1e-15) {
        alpha = Math.max(0, t);
        block = i;
      }
    }
    for (let i = 0; i < n; i++) x[i]! += alpha * p[i]!;
    if (block >= 0 && alpha < 1 - 1e-12) {
      if (!W.includes(block) && W.length + Aeq.length < n) W.push(block);
    } else {
      x = xHat;
    }
  }

  const kkt = kktOf(H, g, Aeq, beq, Aineq, bineq, x, eqLam, ineqLam);
  const primalOk = kkt.primalEq < 1e-6 && kkt.primalIneq < 1e-6;
  const value = 0.5 * vecDot(x, matVec(H, x)) + vecDot(g, x);
  return { x, value, eqLam, ineqLam, iters, kkt, feasible: primalOk };
}

export function defaultConstraints(n = 6): MvConstraints {
  const caps = new Array(n).fill(0.5);
  if (n > 5) caps[5] = 0.4;
  if (n > 3) caps[3] = 0.7;
  return {
    longOnly: true,
    caps,
    groups: [
      { name: "Equities", indices: [0, 1, 2].filter((i) => i < n), cap: 0.9 },
      { name: "Real estate", indices: [4].filter((i) => i < n), cap: 0.3 },
    ],
  };
}

function packConstraints(n: number, c: MvConstraints): { Aineq: number[][]; bineq: number[] } {
  const Aineq: number[][] = [];
  const bineq: number[] = [];
  if (c.longOnly) {
    for (let i = 0; i < n; i++) {
      const row = new Array(n).fill(0);
      row[i] = -1;
      Aineq.push(row);
      bineq.push(0);
    }
  }
  for (let i = 0; i < n; i++) {
    const cap = c.caps[i] ?? 1;
    const row = new Array(n).fill(0);
    row[i] = 1;
    Aineq.push(row);
    bineq.push(cap);
  }
  for (let i = 0; i < n; i++) {
    const floor = c.floors?.[i] ?? 0;
    if (floor > 0) {
      const row = new Array(n).fill(0);
      row[i] = -1;
      Aineq.push(row);
      bineq.push(-floor);
    }
  }
  for (const g of c.groups) {
    const row = new Array(n).fill(0);
    for (const i of g.indices) if (i >= 0 && i < n) row[i] = 1;
    Aineq.push(row);
    bineq.push(g.cap);
    if (g.floor != null && g.floor > 0) {
      const flo = new Array(n).fill(0);
      for (const i of g.indices) if (i >= 0 && i < n) flo[i] = -1;
      Aineq.push(flo);
      bineq.push(-g.floor);
    }
  }
  return { Aineq, bineq };
}

function onesEq(n: number): { Aeq: number[][]; beq: number[] } {
  return { Aeq: [new Array(n).fill(1)], beq: [1] };
}

export function minVariance(cov: number[][], c: MvConstraints = defaultConstraints(cov.length)): QpResult {
  const n = cov.length;
  const { Aeq, beq } = onesEq(n);
  const { Aineq, bineq } = packConstraints(n, c);
  const g = new Array(n).fill(0);
  const x0 = c.caps.map((cap) => Math.min(1 / n, cap));
  const s = x0.reduce((a, b) => a + b, 0) || 1;
  return solveQP(cloneMatrix(cov), g, Aeq, beq, Aineq, bineq, x0.map((v) => v / s));
}

export function meanVarianceTarget(
  cov: number[][],
  mu: number[],
  target: number,
  c: MvConstraints = defaultConstraints(mu.length),
): QpResult {
  const n = mu.length;
  const { Aineq, bineq } = packConstraints(n, c);
  const Aeq = [new Array(n).fill(1), mu.slice()];
  const beq = [1, target];
  const g = new Array(n).fill(0);
  const x0 = c.caps.map((cap, i) => Math.min(Math.max(1 / n, 0), cap));
  const s = x0.reduce((a, b) => a + b, 0) || 1;
  return solveQP(cloneMatrix(cov), g, Aeq, beq, Aineq, bineq, x0.map((v) => v / s));
}

export function maxReturn(mu: number[], c: MvConstraints = defaultConstraints(mu.length)): QpResult {
  const n = mu.length;
  const H = zeros(n);
  for (let i = 0; i < n; i++) H[i]![i] = 1e-8;
  const { Aeq, beq } = onesEq(n);
  const { Aineq, bineq } = packConstraints(n, c);
  const g = mu.map((v) => -v);
  return solveQP(H, g, Aeq, beq, Aineq, bineq);
}

export interface FrontierPoint {
  mu: number;
  vol: number;
  weights: number[];
  kkt: KktResiduals;
}

export function efficientFrontier(
  cov: number[][],
  mu: number[],
  nPoints = 51,
  c: MvConstraints = defaultConstraints(mu.length),
): FrontierPoint[] {
  const minV = minVariance(cov, c);
  const maxR = maxReturn(mu, c);
  const r0 = vecDot(minV.x, mu);
  const r1 = vecDot(maxR.x, mu);
  const lo = Math.min(r0, r1);
  const hi = Math.max(r0, r1);
  const pts: FrontierPoint[] = [];
  const n = Math.max(2, nPoints);
  for (let k = 0; k < n; k++) {
    const t = k / (n - 1);
    const target = lo + t * (hi - lo);
    const sol = t === 0 ? minV : t === 1 ? maxR : meanVarianceTarget(cov, mu, target, c);
    const w = sol.x.slice();
    const s = w.reduce((a, b) => a + b, 0);
    if (Math.abs(s - 1) > 1e-8 && s !== 0) for (let i = 0; i < w.length; i++) w[i]! /= s;
    pts.push({
      mu: vecDot(w, mu),
      vol: Math.sqrt(portfolioVariance(w, cov)),
      weights: w,
      kkt: sol.kkt,
    });
  }
  return pts;
}

/** Equal-risk-contribution weights via cyclical coordinate descent (Spinu). */
export function riskParity(cov: number[][], nIter = 400): number[] {
  const n = cov.length;
  const w = new Array(n).fill(1 / n);
  for (let it = 0; it < nIter; it++) {
    const Sw = matVec(cov, w);
    const sig2 = vecDot(w, Sw);
    const rc = sig2 / n;
    let changed = 0;
    for (let i = 0; i < n; i++) {
      const a = cov[i]![i]!;
      let b = 0;
      for (let j = 0; j < n; j++) if (j !== i) b += cov[i]![j]! * w[j]!;
      const disc = b * b + 4 * a * rc;
      const wi = a > 0 ? (-b + Math.sqrt(Math.max(disc, 0))) / (2 * a) : w[i]!;
      changed += Math.abs(wi - w[i]!);
      w[i] = Math.max(1e-12, wi);
    }
    const s = w.reduce((a, b) => a + b, 0) || 1;
    for (let i = 0; i < n; i++) w[i]! /= s;
    if (changed < 1e-12) break;
  }
  return w;
}

export interface BlView {
  /** 1-based? No: asset index. */
  asset: number;
  expected: number;
  confidence: number;
}

export interface BlResult {
  mu: number[];
  cov: number[][];
  pi: number[];
  weights: number[];
}

/**
 * Black–Litterman posterior from absolute views on individual assets.
 * Ω_ii = (1/c - 1) τ P Σ P'  with c in (0,1]; τ = 1/T analogue (0.05).
 */
export function blackLitterman(
  cov: number[][],
  wMkt: number[],
  views: BlView[],
  delta = 2.5,
  tau = 0.05,
  c: MvConstraints = defaultConstraints(wMkt.length),
): BlResult {
  const n = wMkt.length;
  const pi = matVec(cov, wMkt).map((v) => delta * v);
  const active = views.filter((v) => v.asset >= 0 && v.asset < n && v.confidence > 0);
  if (active.length === 0) {
    const sol = meanVarianceTarget(cov, pi, vecDot(pi, wMkt), c);
    return { mu: pi, cov, pi, weights: sol.x };
  }
  const k = active.length;
  const P = zeros(k, n);
  const q = new Array<number>(k);
  const Omega = zeros(k);
  for (let i = 0; i < k; i++) {
    const v = active[i]!;
    P[i]![v.asset] = 1;
    q[i] = v.expected;
    const pSp = cov[v.asset]![v.asset]!;
    const conf = Math.min(0.999, Math.max(0.01, v.confidence));
    Omega[i]![i] = ((1 - conf) / conf) * tau * pSp;
  }
  const tauS = addDiag(
    cov.map((row) => row.map((v) => v * tau)),
    1e-14,
  );
  const tauSinv = invertMatrix(tauS);
  const OmInv = invertMatrix(Omega);
  const Pt = transpose(P);
  const mid = addMatSafe(tauSinv, matMul(Pt, matMul(OmInv, P)));
  const rhs = matVec(tauSinv, pi);
  const POq = matVec(Pt, matVec(OmInv, q));
  for (let i = 0; i < n; i++) rhs[i]! += POq[i]!;
  const mu = solveLinear(mid, rhs);
  const covPost = invertMatrix(mid);
  const sol = minVariance(
    covPost.map((row, i) =>
      row.map((v, j) => v + (i === j ? 0 : 0)),
    ),
    c,
  );
  // Use mean-variance at BL mean, targeting the implied return of the posterior min-var is too conservative.
  // Target the BL-implied return of the market weights, clipped to the feasible range.
  const rMkt = vecDot(mu, wMkt);
  const mv = meanVarianceTarget(cov, mu, rMkt, c);
  void sol;
  void covPost;
  return { mu, cov, pi, weights: mv.x };
}

function addMatSafe(A: number[][], B: number[][]): number[][] {
  const n = A.length;
  const C = zeros(n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) C[i]![j] = A[i]![j]! + B[i]![j]!;
  return C;
}

const BOOK_META: { id: string; name: string; riskLevel: number; blurb: string }[] = [
  {
    id: "conservative",
    name: "Conservative",
    riskLevel: 1,
    blurb: "Minimum-variance book on the CMA efficient frontier, long-only with caps.",
  },
  {
    id: "mod_conservative",
    name: "Moderately Conservative",
    riskLevel: 2,
    blurb: "A quarter of the way from min-vol to max-return on the CMA frontier.",
  },
  {
    id: "balanced",
    name: "Balanced",
    riskLevel: 3,
    blurb: "Mid-frontier mean-variance book. The default planning mix.",
  },
  {
    id: "growth",
    name: "Growth",
    riskLevel: 4,
    blurb: "Three-quarters of the way to the maximum-return vertex.",
  },
  {
    id: "aggressive",
    name: "Aggressive",
    riskLevel: 5,
    blurb: "Maximum expected return on the CMA frontier subject to the same caps.",
  },
];

export const FALLBACK_BOOKS: ModelPortfolio[] = [
  { ...BOOK_META[0]!, weights: [0.1, 0.06, 0.04, 0.62, 0.1, 0.08], source: "fallback" },
  { ...BOOK_META[1]!, weights: [0.18, 0.14, 0.08, 0.44, 0.12, 0.04], source: "fallback" },
  { ...BOOK_META[2]!, weights: [0.28, 0.2, 0.12, 0.26, 0.1, 0.04], source: "fallback" },
  { ...BOOK_META[3]!, weights: [0.36, 0.26, 0.18, 0.12, 0.06, 0.02], source: "fallback" },
  { ...BOOK_META[4]!, weights: [0.42, 0.3, 0.23, 0.03, 0.02, 0.0], source: "fallback" },
];

const EQ_IDX = [0, 1, 2];

const LADDER = [
  { equity: 0.2, cashCap: 0.1, bondFloor: 0.5, bondCap: 0.72 },
  { equity: 0.4, cashCap: 0.05, bondFloor: 0.35, bondCap: 0.52 },
  { equity: 0.6, cashCap: 0.05, bondFloor: 0.2, bondCap: 0.36 },
  { equity: 0.8, cashCap: 0.05, bondFloor: 0.08, bondCap: 0.18 },
  { equity: 0.95, cashCap: 0.05, bondFloor: 0.01, bondCap: 0.08 },
] as const;

export function ladderConstraints(step: number, n = 6): MvConstraints {
  const spec = LADDER[Math.max(0, Math.min(LADDER.length - 1, step))]!;
  const caps = new Array(n).fill(0.55);
  caps[0] = 0.55;
  caps[1] = 0.4;
  caps[2] = 0.3;
  if (n > 3) caps[3] = spec.bondCap;
  if (n > 4) caps[4] = 0.2;
  if (n > 5) caps[5] = spec.cashCap;
  const floors = new Array(n).fill(0);
  floors[0] = 0.05;
  floors[1] = 0.03;
  floors[2] = 0.02;
  if (n > 3) floors[3] = spec.bondFloor;
  if (n > 4) floors[4] = 0.01;
  return {
    longOnly: true,
    caps,
    floors,
    groups: [
      {
        name: "Equities",
        indices: EQ_IDX.filter((i) => i < n),
        cap: spec.equity + 0.012,
        floor: Math.max(0, spec.equity - 0.012),
      },
      { name: "Real estate", indices: [4].filter((i) => i < n), cap: 0.2 },
    ],
  };
}

export function equityShare(w: number[]): number {
  return (w[0] ?? 0) + (w[1] ?? 0) + (w[2] ?? 0);
}

export function bondShare(w: number[]): number {
  return w[3] ?? 0;
}

export function bookMeetsLadder(w: number[], step: number): boolean {
  const spec = LADDER[Math.max(0, Math.min(LADDER.length - 1, step))]!;
  const eq = equityShare(w);
  const cashCap = spec.cashCap;
  if ((w[0] ?? 0) < 0.049) return false;
  if ((w[1] ?? 0) <= 0 || (w[2] ?? 0) <= 0) return false;
  if ((w[2] ?? 0) > 0.3 + 1e-8) return false;
  if ((w[5] ?? 0) > cashCap + 1e-6) return false;
  if (eq < spec.equity - 0.02 || eq > spec.equity + 0.02) return false;
  if ((w[3] ?? 0) + 1e-8 < spec.bondFloor) return false;
  if ((w[3] ?? 0) > spec.bondCap + 1e-8) return false;
  return true;
}

function normalize(w: number[]): number[] {
  const s = w.reduce((a, b) => a + b, 0);
  if (!(s > 0)) return w.map(() => 1 / w.length);
  return w.map((v) => v / s);
}

export function describeConstraints(
  w: number[],
  c: MvConstraints,
): { ok: boolean; msg: string; sumW: number } {
  const n = w.length;
  const sumW = w.reduce((a, b) => a + b, 0);
  const parts: string[] = [];
  let ok = Math.abs(sumW - 1) < 1e-8;
  if (!ok) parts.push(`sum=${sumW.toFixed(8)}`);
  if (c.longOnly) {
    for (let i = 0; i < n; i++) {
      if (w[i]! < -1e-8) {
        ok = false;
        parts.push(`w${i}=${w[i]!.toFixed(6)}<0`);
      }
    }
  }
  for (let i = 0; i < n; i++) {
    const cap = c.caps[i] ?? 1;
    if (w[i]! > cap + 1e-8) {
      ok = false;
      parts.push(`w${i}=${w[i]!.toFixed(6)}>${cap}`);
    }
  }
  if (c.floors) {
    for (let i = 0; i < n; i++) {
      const floor = c.floors[i] ?? 0;
      if (w[i]! + 1e-8 < floor) {
        ok = false;
        parts.push(`w${i}=${w[i]!.toFixed(6)}<${floor}`);
      }
    }
  }
  for (const g of c.groups) {
    let s = 0;
    for (const i of g.indices) s += w[i] ?? 0;
    if (s > g.cap + 1e-8) {
      ok = false;
      parts.push(`${g.name}=${s.toFixed(6)}>${g.cap}`);
    }
    if (g.floor != null && s + 1e-8 < g.floor) {
      ok = false;
      parts.push(`${g.name}=${s.toFixed(6)}<${g.floor}`);
    }
  }
  return { ok, msg: ok ? "all constraints hold" : parts.join("; "), sumW };
}

export function defaultCmaBooksKkt(): {
  sumW: number;
  constraintsOk: boolean;
  constraintMsg: string;
  kkt: KktResiduals;
  weights: number[];
} {
  const cma = {
    mu: [0.078, 0.082, 0.085, 0.038, 0.062, 0.028],
    vol: [0.15, 0.165, 0.185, 0.055, 0.125, 0.008],
    corr: [
      [1.0, 0.82, 0.78, 0.12, 0.52, 0.05],
      [0.82, 1.0, 0.68, 0.08, 0.46, 0.03],
      [0.78, 0.68, 1.0, 0.1, 0.4, 0.04],
      [0.12, 0.08, 0.1, 1.0, 0.22, 0.18],
      [0.52, 0.46, 0.4, 0.22, 1.0, 0.06],
      [0.05, 0.03, 0.04, 0.18, 0.06, 1.0],
    ],
  };
  const cov = covFromVolCorr(cma.vol, cma.corr);
  const cons = defaultConstraints(cma.mu.length);
  const sol = minVariance(cov, cons);
  const desc = describeConstraints(sol.x, cons);
  return {
    sumW: desc.sumW,
    constraintsOk: desc.ok,
    constraintMsg: desc.msg,
    kkt: sol.kkt,
    weights: sol.x,
  };
}

let booksCacheKey = "";
let booksCache: ModelPortfolio[] | null = null;

export function modelBooks(cma: CapitalMarketAssumptions): ModelPortfolio[] {
  const key = JSON.stringify(cma);
  if (booksCache && booksCacheKey === key) return booksCache;
  const n = cma.mu.length;
  const fallback = (): ModelPortfolio[] =>
    FALLBACK_BOOKS.map((b) => ({ ...b, weights: b.weights.slice(), source: "fallback" as const }));
  try {
    const cov = covFromVolCorr(cma.vol, cma.corr);
    const books: ModelPortfolio[] = LADDER.map((spec, i) => {
      const cons = ladderConstraints(i, n);
      const start = FALLBACK_BOOKS[i]!.weights.slice(0, n);
      const sol = minVariance(cov, cons);
      let w = sol.x.slice();
      w = normalize(w);
      const fromOpt = describeConstraints(w, cons).ok && bookMeetsLadder(w, i);
      if (!fromOpt) {
        return { ...BOOK_META[i]!, weights: normalize(start), source: "fallback" };
      }
      return { ...BOOK_META[i]!, weights: w, source: "optimizer" };
    });
    booksCache = books;
    booksCacheKey = key;
    return booksCache;
  } catch {
    booksCache = fallback();
    booksCacheKey = key;
    return booksCache;
  }
}
