/** Dense matrix helpers + Cholesky decomposition. No external numeric libraries. */

export function zeros(n: number, m = n): number[][] {
  return Array.from({ length: n }, () => Array(m).fill(0));
}

export function identity(n: number): number[][] {
  const A = zeros(n);
  for (let i = 0; i < n; i++) A[i]![i] = 1;
  return A;
}

export function transpose(A: number[][]): number[][] {
  const n = A.length;
  const m = A[0]?.length ?? 0;
  const T = zeros(m, n);
  for (let i = 0; i < n; i++) {
    const row = A[i]!;
    for (let j = 0; j < m; j++) T[j]![i] = row[j]!;
  }
  return T;
}

export function matMul(A: number[][], B: number[][]): number[][] {
  const n = A.length;
  const p = B.length;
  const m = B[0]?.length ?? 0;
  const C = zeros(n, m);
  for (let i = 0; i < n; i++) {
    const Ai = A[i]!;
    const Ci = C[i]!;
    for (let k = 0; k < p; k++) {
      const aik = Ai[k]!;
      const Bk = B[k]!;
      for (let j = 0; j < m; j++) Ci[j] += aik * Bk[j]!;
    }
  }
  return C;
}

export function maxAbsDiff(A: number[][], B: number[][]): number {
  let m = 0;
  for (let i = 0; i < A.length; i++) {
    const Ai = A[i]!;
    const Bi = B[i]!;
    for (let j = 0; j < Ai.length; j++) m = Math.max(m, Math.abs(Ai[j]! - Bi[j]!));
  }
  return m;
}

export function cloneMatrix(A: number[][]): number[][] {
  return A.map((row) => row.slice());
}

/**
 * Lower-triangular Cholesky factor L of a symmetric positive-definite A,
 * satisfying L * L^T = A. Throws if A is not PD.
 */
export function cholesky(A: number[][]): number[][] {
  const n = A.length;
  const L = zeros(n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      const Li = L[i]!;
      const Lj = L[j]!;
      for (let k = 0; k < j; k++) sum += Li[k]! * Lj[k]!;
      if (i === j) {
        const d = A[i]![i]! - sum;
        if (!(d > 0) || !Number.isFinite(d)) {
          throw new Error(`Matrix is not positive definite at (${i},${i}), d=${d}`);
        }
        Li[j] = Math.sqrt(d);
      } else {
        const denom = Lj[j]!;
        Li[j] = (A[i]![j]! - sum) / denom;
      }
    }
  }
  return L;
}

export function tryCholesky(A: number[][]): number[][] | null {
  try {
    return cholesky(A);
  } catch {
    return null;
  }
}

export function isSymmetric(A: number[][], tol = 1e-12): boolean {
  const n = A.length;
  for (let i = 0; i < n; i++) {
    if (A[i]!.length !== n) return false;
    for (let j = 0; j < i; j++) {
      if (Math.abs(A[i]![j]! - A[j]![i]!) > tol) return false;
    }
  }
  return true;
}

export function vecDot(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i]! * b[i]!;
  return s;
}

export function matVec(A: number[][], x: ArrayLike<number>): number[] {
  const n = A.length;
  const y = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    const row = A[i]!;
    let s = 0;
    for (let j = 0; j < row.length; j++) s += row[j]! * x[j]!;
    y[i] = s;
  }
  return y;
}

export function outer(a: ArrayLike<number>, b: ArrayLike<number> = a): number[][] {
  const n = a.length;
  const m = b.length;
  const O = zeros(n, m);
  for (let i = 0; i < n; i++) {
    const ai = a[i]!;
    const row = O[i]!;
    for (let j = 0; j < m; j++) row[j] = ai * b[j]!;
  }
  return O;
}

export function addMat(A: number[][], B: number[][], sa = 1, sb = 1): number[][] {
  const n = A.length;
  const m = A[0]?.length ?? 0;
  const C = zeros(n, m);
  for (let i = 0; i < n; i++) {
    const Ai = A[i]!;
    const Bi = B[i]!;
    const Ci = C[i]!;
    for (let j = 0; j < m; j++) Ci[j] = sa * Ai[j]! + sb * Bi[j]!;
  }
  return C;
}

export function scaleMat(A: number[][], s: number): number[][] {
  return A.map((row) => row.map((v) => v * s));
}

export function addDiag(A: number[][], jitter: number): number[][] {
  const B = cloneMatrix(A);
  for (let i = 0; i < B.length; i++) B[i]![i] = (B[i]![i] ?? 0) + jitter;
  return B;
}

export function frobenius2(A: number[][]): number {
  let s = 0;
  for (const row of A) for (const v of row) s += v * v;
  return s;
}

/** Gauss–Jordan with partial pivoting. Throws if singular. */
export function solveLinear(A: number[][], b: number[]): number[] {
  const n = A.length;
  if (n === 0) return [];
  const M: number[][] = A.map((row, i) => {
    const r = row.slice();
    r.push(b[i]!);
    return r;
  });
  for (let k = 0; k < n; k++) {
    let piv = k;
    let best = Math.abs(M[k]![k]!);
    for (let i = k + 1; i < n; i++) {
      const v = Math.abs(M[i]![k]!);
      if (v > best) {
        best = v;
        piv = i;
      }
    }
    if (best < 1e-16) throw new Error("singular linear system");
    if (piv !== k) {
      const tmp = M[k]!;
      M[k] = M[piv]!;
      M[piv] = tmp;
    }
    const dk = M[k]![k]!;
    for (let j = k; j <= n; j++) M[k]![j]! /= dk;
    for (let i = 0; i < n; i++) {
      if (i === k) continue;
      const f = M[i]![k]!;
      if (f === 0) continue;
      for (let j = k; j <= n; j++) M[i]![j]! -= f * M[k]![j]!;
    }
  }
  return M.map((row) => row[n]!);
}

export function invertMatrix(A: number[][]): number[][] {
  const n = A.length;
  const inv = zeros(n);
  for (let j = 0; j < n; j++) {
    const e = new Array<number>(n).fill(0);
    e[j] = 1;
    const col = solveLinear(A, e);
    for (let i = 0; i < n; i++) inv[i]![j] = col[i]!;
  }
  return inv;
}

export function isPositiveDefinite(A: number[][]): boolean {
  return tryCholesky(A) != null;
}
