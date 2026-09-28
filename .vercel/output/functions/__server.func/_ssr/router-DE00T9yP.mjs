import { i as __toESM } from "../_runtime.mjs";
import { B as require_jsx_runtime, _ as createRootRoute, b as useRouter, d as useRouterState, g as createFileRoute, h as lazyRouteComponent, l as Scripts, m as Outlet, p as createRouter, u as HeadContent, v as Link, y as useNavigate, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as create } from "../_libs/zustand.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { _ as Activity, a as Shield, c as Menu, d as FlaskConical, f as Eye, g as Briefcase, h as ChartLine, l as Info, m as CircleHelp, n as Upload, o as Search, p as EyeOff, r as TriangleAlert, t as X, u as History } from "../_libs/lucide-react.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/storage-DulveTtr.js
/** Dense matrix helpers + Cholesky decomposition. No external numeric libraries. */
function zeros(n, m = n) {
	return Array.from({ length: n }, () => Array(m).fill(0));
}
function identity(n) {
	const A = zeros(n);
	for (let i = 0; i < n; i++) A[i][i] = 1;
	return A;
}
function transpose(A) {
	const n = A.length;
	const m = A[0]?.length ?? 0;
	const T = zeros(m, n);
	for (let i = 0; i < n; i++) {
		const row = A[i];
		for (let j = 0; j < m; j++) T[j][i] = row[j];
	}
	return T;
}
function matMul(A, B) {
	const n = A.length;
	const p = B.length;
	const m = B[0]?.length ?? 0;
	const C = zeros(n, m);
	for (let i = 0; i < n; i++) {
		const Ai = A[i];
		const Ci = C[i];
		for (let k = 0; k < p; k++) {
			const aik = Ai[k];
			const Bk = B[k];
			for (let j = 0; j < m; j++) Ci[j] += aik * Bk[j];
		}
	}
	return C;
}
function maxAbsDiff(A, B) {
	let m = 0;
	for (let i = 0; i < A.length; i++) {
		const Ai = A[i];
		const Bi = B[i];
		for (let j = 0; j < Ai.length; j++) m = Math.max(m, Math.abs(Ai[j] - Bi[j]));
	}
	return m;
}
function cloneMatrix(A) {
	return A.map((row) => row.slice());
}
/**
* Lower-triangular Cholesky factor L of a symmetric positive-definite A,
* satisfying L * L^T = A. Throws if A is not PD.
*/
function cholesky(A) {
	const n = A.length;
	const L = zeros(n);
	for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
		let sum = 0;
		const Li = L[i];
		const Lj = L[j];
		for (let k = 0; k < j; k++) sum += Li[k] * Lj[k];
		if (i === j) {
			const d = A[i][i] - sum;
			if (!(d > 0) || !Number.isFinite(d)) throw new Error(`Matrix is not positive definite at (${i},${i}), d=${d}`);
			Li[j] = Math.sqrt(d);
		} else {
			const denom = Lj[j];
			Li[j] = (A[i][j] - sum) / denom;
		}
	}
	return L;
}
function tryCholesky(A) {
	try {
		return cholesky(A);
	} catch {
		return null;
	}
}
function vecDot(a, b) {
	let s = 0;
	const n = Math.min(a.length, b.length);
	for (let i = 0; i < n; i++) s += a[i] * b[i];
	return s;
}
function matVec(A, x) {
	const n = A.length;
	const y = new Array(n).fill(0);
	for (let i = 0; i < n; i++) {
		const row = A[i];
		let s = 0;
		for (let j = 0; j < row.length; j++) s += row[j] * x[j];
		y[i] = s;
	}
	return y;
}
function addMat(A, B, sa = 1, sb = 1) {
	const n = A.length;
	const m = A[0]?.length ?? 0;
	const C = zeros(n, m);
	for (let i = 0; i < n; i++) {
		const Ai = A[i];
		const Bi = B[i];
		const Ci = C[i];
		for (let j = 0; j < m; j++) Ci[j] = sa * Ai[j] + sb * Bi[j];
	}
	return C;
}
function addDiag(A, jitter) {
	const B = cloneMatrix(A);
	for (let i = 0; i < B.length; i++) B[i][i] = (B[i][i] ?? 0) + jitter;
	return B;
}
function frobenius2(A) {
	let s = 0;
	for (const row of A) for (const v of row) s += v * v;
	return s;
}
/** Gauss–Jordan with partial pivoting. Throws if singular. */
function solveLinear(A, b) {
	const n = A.length;
	if (n === 0) return [];
	const M = A.map((row, i) => {
		const r = row.slice();
		r.push(b[i]);
		return r;
	});
	for (let k = 0; k < n; k++) {
		let piv = k;
		let best = Math.abs(M[k][k]);
		for (let i = k + 1; i < n; i++) {
			const v = Math.abs(M[i][k]);
			if (v > best) {
				best = v;
				piv = i;
			}
		}
		if (best < 1e-16) throw new Error("singular linear system");
		if (piv !== k) {
			const tmp = M[k];
			M[k] = M[piv];
			M[piv] = tmp;
		}
		const dk = M[k][k];
		for (let j = k; j <= n; j++) M[k][j] /= dk;
		for (let i = 0; i < n; i++) {
			if (i === k) continue;
			const f = M[i][k];
			if (f === 0) continue;
			for (let j = k; j <= n; j++) M[i][j] -= f * M[k][j];
		}
	}
	return M.map((row) => row[n]);
}
function invertMatrix(A) {
	const n = A.length;
	const inv = zeros(n);
	for (let j = 0; j < n; j++) {
		const e = new Array(n).fill(0);
		e[j] = 1;
		const col = solveLinear(A, e);
		for (let i = 0; i < n; i++) inv[i][j] = col[i];
	}
	return inv;
}
function isPositiveDefinite(A) {
	return tryCholesky(A) != null;
}
/** Sample, EWMA, and Ledoit–Wolf covariance. All from scratch. */
function covFromVolCorr(vol, corr) {
	const n = vol.length;
	const S = zeros(n);
	for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) S[i][j] = vol[i] * vol[j] * corr[i][j];
	return S;
}
function corrFromCov(S) {
	const n = S.length;
	const C = zeros(n);
	const s = S.map((row, i) => Math.sqrt(Math.max(row[i], 0)));
	for (let i = 0; i < n; i++) {
		for (let j = 0; j < n; j++) {
			const d = s[i] * s[j];
			C[i][j] = d > 0 ? S[i][j] / d : i === j ? 1 : 0;
		}
		C[i][i] = 1;
	}
	return C;
}
function columnMeans(R) {
	const T = R.length;
	const n = R[0]?.length ?? 0;
	const m = new Array(n).fill(0);
	if (T === 0) return m;
	for (let t = 0; t < T; t++) {
		const row = R[t];
		for (let i = 0; i < n; i++) m[i] += row[i];
	}
	for (let i = 0; i < n; i++) m[i] /= T;
	return m;
}
function demean(R) {
	const mu = columnMeans(R);
	return {
		X: R.map((row) => row.map((v, i) => v - mu[i])),
		mu
	};
}
/** Unbiased sample covariance (1/(T-1)). */
function sampleCovariance(R) {
	const T = R.length;
	const n = R[0]?.length ?? 0;
	const S = zeros(n);
	if (T < 2) return S;
	const { X } = demean(R);
	const den = T - 1;
	for (let t = 0; t < T; t++) {
		const xt = X[t];
		for (let i = 0; i < n; i++) {
			const xi = xt[i];
			const Si = S[i];
			for (let j = 0; j < n; j++) Si[j] += xi * xt[j];
		}
	}
	for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) S[i][j] /= den;
	return S;
}
/**
* RiskMetrics EWMA covariance. λ ≈ 0.94 daily, 0.97 monthly is common.
* Recursion: Σ_t = λ Σ_{t-1} + (1-λ) r_t r_t'  (zero-mean).
* Seeded with the sample covariance (or first outer product).
*/
function ewmaCovariance(R, lambda = .94) {
	const T = R.length;
	const n = R[0]?.length ?? 0;
	const lam = Math.min(.999, Math.max(.5, lambda));
	const one = 1 - lam;
	let S = T >= 2 ? sampleCovariance(R) : zeros(n);
	if (T === 0) return S;
	for (let t = 0; t < T; t++) {
		const r = R[t];
		for (let i = 0; i < n; i++) {
			const ri = r[i];
			const Si = S[i];
			for (let j = 0; j < n; j++) Si[j] = lam * Si[j] + one * ri * r[j];
		}
	}
	return S;
}
/**
* Ledoit–Wolf (2004) shrinkage toward a constant-correlation target.
* Uses the 1/T sample covariance of the paper. Result is SPD whenever the
* target is (sample variances positive).
*/
function ledoitWolfCovariance(R) {
	const T = R.length;
	const n = R[0]?.length ?? 0;
	if (T < 2 || n === 0) return {
		cov: zeros(n),
		delta: 1,
		pd: n === 0
	};
	const { X } = demean(R);
	const S = zeros(n);
	for (let t = 0; t < T; t++) {
		const xt = X[t];
		for (let i = 0; i < n; i++) {
			const xi = xt[i];
			const Si = S[i];
			for (let j = 0; j < n; j++) Si[j] += xi * xt[j];
		}
	}
	for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) S[i][j] /= T;
	const sd = S.map((row, i) => Math.sqrt(Math.max(row[i], 1e-18)));
	let rBar = 0;
	let npair = 0;
	for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
		rBar += S[i][j] / (sd[i] * sd[j]);
		npair += 1;
	}
	rBar = npair > 0 ? rBar / npair : 0;
	const F = zeros(n);
	for (let i = 0; i < n; i++) {
		F[i][i] = S[i][i];
		for (let j = 0; j < i; j++) {
			const v = rBar * sd[i] * sd[j];
			F[i][j] = v;
			F[j][i] = v;
		}
	}
	let piHat = 0;
	const theta = zeros(n);
	for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
		let acc = 0;
		let th_ii_ij = 0;
		const sij = S[i][j];
		const sii = S[i][i];
		for (let t = 0; t < T; t++) {
			const xit = X[t][i];
			const d = xit * X[t][j] - sij;
			acc += d * d;
			th_ii_ij += (xit * xit - sii) * d;
		}
		piHat += acc / T;
		theta[i][j] = th_ii_ij / T;
	}
	let rhoHat = 0;
	for (let i = 0; i < n; i++) rhoHat += theta[i][i];
	for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
		if (i === j) continue;
		const term = rBar / 2 * (sd[j] / sd[i] * theta[i][j] + sd[i] / sd[j] * theta[j][i]);
		rhoHat += term;
	}
	const gamma = frobenius2(addMat(S, F, 1, -1));
	const kappa = gamma > 0 ? (piHat - rhoHat) / gamma : 0;
	const delta = Math.min(1, Math.max(0, kappa / T));
	const cov = addMat(S, F, 1 - delta, delta);
	for (let i = 0; i < n; i++) if (!(cov[i][i] > 0)) cov[i][i] = 1e-12;
	return {
		cov,
		delta,
		pd: isPositiveDefinite(cov)
	};
}
function estimateCovariance(R, method, lambda = .94) {
	if (method === "ewma") return ewmaCovariance(R, lambda);
	if (method === "ledoit") return ledoitWolfCovariance(R).cov;
	return sampleCovariance(R);
}
function portfolioVariance(w, S) {
	let v = 0;
	const n = w.length;
	for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) v += w[i] * S[i][j] * w[j];
	return Math.max(v, 0);
}
/** Mean-variance active-set QP, risk parity, Black–Litterman. */
var STEP_TOL = 1e-14;
function dot(a, b) {
	return vecDot(a, b);
}
function solveEqualityQp(H, g, A, b) {
	const n = g.length;
	const m = A.length;
	if (m === 0) return {
		x: solveLinear(addDiag(H, 1e-14), g.map((v) => -v)),
		lam: []
	};
	const k = n + m;
	const K = zeros(k);
	for (let i = 0; i < n; i++) {
		for (let j = 0; j < n; j++) K[i][j] = H[i][j];
		K[i][i] += 1e-14;
		for (let j = 0; j < m; j++) {
			K[i][n + j] = A[j][i];
			K[n + j][i] = A[j][i];
		}
	}
	const rhs = new Array(k).fill(0);
	for (let i = 0; i < n; i++) rhs[i] = -g[i];
	for (let j = 0; j < m; j++) rhs[n + j] = b[j];
	let z;
	try {
		z = solveLinear(K, rhs);
	} catch {
		for (let i = 0; i < n; i++) K[i][i] += 1e-8;
		z = solveLinear(K, rhs);
	}
	return {
		x: z.slice(0, n),
		lam: z.slice(n)
	};
}
function kktOf(H, g, Aeq, beq, Aineq, bineq, x, eqLam, ineqLam) {
	const n = x.length;
	const grad = matVec(H, x);
	for (let i = 0; i < n; i++) grad[i] += g[i];
	for (let i = 0; i < Aeq.length; i++) {
		const lam = eqLam[i] ?? 0;
		const row = Aeq[i];
		for (let j = 0; j < n; j++) grad[j] += lam * row[j];
	}
	for (let i = 0; i < Aineq.length; i++) {
		const lam = ineqLam[i] ?? 0;
		const row = Aineq[i];
		for (let j = 0; j < n; j++) grad[j] += lam * row[j];
	}
	let stationarity = 0;
	for (const v of grad) stationarity = Math.max(stationarity, Math.abs(v));
	let primalEq = 0;
	for (let i = 0; i < Aeq.length; i++) primalEq = Math.max(primalEq, Math.abs(dot(Aeq[i], x) - beq[i]));
	let primalIneq = 0;
	let complementary = 0;
	let dual = 0;
	for (let i = 0; i < Aineq.length; i++) {
		const slack = bineq[i] - dot(Aineq[i], x);
		primalIneq = Math.max(primalIneq, Math.max(0, -slack));
		const lam = ineqLam[i] ?? 0;
		dual = Math.max(dual, Math.max(0, -lam));
		complementary = Math.max(complementary, Math.abs(lam * slack));
	}
	return {
		stationarity,
		primalEq,
		primalIneq,
		complementary,
		dual,
		max: Math.max(stationarity, primalEq, primalIneq, complementary, dual)
	};
}
/**
* Primal active-set solver for
*   min  1/2 x' H x + g' x
*   s.t. Aeq x = beq,  Aineq x ≤ bineq
*/
function solveQP(H, g, Aeq, beq, Aineq, bineq, x0) {
	const n = g.length;
	const mI = Aineq.length;
	let x = (x0 ?? new Array(n).fill(1 / n)).slice();
	for (let sweep = 0; sweep < 8; sweep++) {
		for (let i = 0; i < mI; i++) {
			const viol = dot(Aineq[i], x) - bineq[i];
			if (viol > 0) {
				const row = Aineq[i];
				const nn = vecDot(row, row) || 1;
				for (let j = 0; j < n; j++) x[j] -= viol * row[j] / nn;
			}
		}
		for (let i = 0; i < Aeq.length; i++) {
			const err = dot(Aeq[i], x) - beq[i];
			const row = Aeq[i];
			const nn = vecDot(row, row) || 1;
			for (let j = 0; j < n; j++) x[j] -= err * row[j] / nn;
		}
	}
	const W = [];
	for (let i = 0; i < mI; i++) if (dot(Aineq[i], x) >= bineq[i] - 1e-10) W.push(i);
	let eqLam = new Array(Aeq.length).fill(0);
	let ineqLam = new Array(mI).fill(0);
	let iters = 0;
	for (iters = 0; iters < 120; iters++) {
		while (W.length + Aeq.length > n && W.length) W.pop();
		const { x: xHat, lam } = solveEqualityQp(H, g, [...Aeq, ...W.map((i) => Aineq[i])], [...beq, ...W.map((i) => bineq[i])]);
		eqLam = lam.slice(0, Aeq.length);
		const lamW = lam.slice(Aeq.length);
		ineqLam = new Array(mI).fill(0);
		for (let k = 0; k < W.length; k++) ineqLam[W[k]] = lamW[k] ?? 0;
		const p = xHat.map((v, i) => v - x[i]);
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
			const ap = dot(Aineq[i], p);
			if (ap <= STEP_TOL) continue;
			const t = (bineq[i] - dot(Aineq[i], x)) / ap;
			if (t < alpha - 1e-15) {
				alpha = Math.max(0, t);
				block = i;
			}
		}
		for (let i = 0; i < n; i++) x[i] += alpha * p[i];
		if (block >= 0 && alpha < 1 - 1e-12) {
			if (!W.includes(block) && W.length + Aeq.length < n) W.push(block);
		} else x = xHat;
	}
	const kkt = kktOf(H, g, Aeq, beq, Aineq, bineq, x, eqLam, ineqLam);
	let primalOk = kkt.primalEq < 1e-6 && kkt.primalIneq < 1e-6;
	const value = .5 * vecDot(x, matVec(H, x)) + vecDot(g, x);
	return {
		x,
		value,
		eqLam,
		ineqLam,
		iters,
		kkt,
		feasible: primalOk
	};
}
function defaultConstraints(n = 6) {
	const caps = new Array(n).fill(.5);
	if (n > 5) caps[5] = .4;
	if (n > 3) caps[3] = .7;
	return {
		longOnly: true,
		caps,
		groups: [{
			name: "Equities",
			indices: [
				0,
				1,
				2
			].filter((i) => i < n),
			cap: .9
		}, {
			name: "Real estate",
			indices: [4].filter((i) => i < n),
			cap: .3
		}]
	};
}
function packConstraints(n, c) {
	const Aineq = [];
	const bineq = [];
	if (c.longOnly) for (let i = 0; i < n; i++) {
		const row = new Array(n).fill(0);
		row[i] = -1;
		Aineq.push(row);
		bineq.push(0);
	}
	for (let i = 0; i < n; i++) {
		const cap = c.caps[i] ?? 1;
		const row = new Array(n).fill(0);
		row[i] = 1;
		Aineq.push(row);
		bineq.push(cap);
	}
	for (const g of c.groups) {
		const row = new Array(n).fill(0);
		for (const i of g.indices) if (i >= 0 && i < n) row[i] = 1;
		Aineq.push(row);
		bineq.push(g.cap);
	}
	return {
		Aineq,
		bineq
	};
}
function onesEq(n) {
	return {
		Aeq: [new Array(n).fill(1)],
		beq: [1]
	};
}
function minVariance(cov, c = defaultConstraints(cov.length)) {
	const n = cov.length;
	const { Aeq, beq } = onesEq(n);
	const { Aineq, bineq } = packConstraints(n, c);
	const g = new Array(n).fill(0);
	const x0 = c.caps.map((cap) => Math.min(1 / n, cap));
	const s = x0.reduce((a, b) => a + b, 0) || 1;
	return solveQP(cloneMatrix(cov), g, Aeq, beq, Aineq, bineq, x0.map((v) => v / s));
}
function meanVarianceTarget(cov, mu, target, c = defaultConstraints(mu.length)) {
	const n = mu.length;
	const { Aineq, bineq } = packConstraints(n, c);
	const Aeq = [new Array(n).fill(1), mu.slice()];
	const beq = [1, target];
	const g = new Array(n).fill(0);
	const x0 = c.caps.map((cap, i) => Math.min(Math.max(1 / n, 0), cap));
	const s = x0.reduce((a, b) => a + b, 0) || 1;
	return solveQP(cloneMatrix(cov), g, Aeq, beq, Aineq, bineq, x0.map((v) => v / s));
}
function maxReturn(mu, c = defaultConstraints(mu.length)) {
	const n = mu.length;
	const H = zeros(n);
	for (let i = 0; i < n; i++) H[i][i] = 1e-8;
	const { Aeq, beq } = onesEq(n);
	const { Aineq, bineq } = packConstraints(n, c);
	return solveQP(H, mu.map((v) => -v), Aeq, beq, Aineq, bineq);
}
function efficientFrontier(cov, mu, nPoints = 51, c = defaultConstraints(mu.length)) {
	const minV = minVariance(cov, c);
	const maxR = maxReturn(mu, c);
	const r0 = vecDot(minV.x, mu);
	const r1 = vecDot(maxR.x, mu);
	const lo = Math.min(r0, r1);
	const hi = Math.max(r0, r1);
	const pts = [];
	const n = Math.max(2, nPoints);
	for (let k = 0; k < n; k++) {
		const t = k / (n - 1);
		const target = lo + t * (hi - lo);
		const sol = t === 0 ? minV : t === 1 ? maxR : meanVarianceTarget(cov, mu, target, c);
		const w = sol.x.slice();
		const s = w.reduce((a, b) => a + b, 0);
		if (Math.abs(s - 1) > 1e-8 && s !== 0) for (let i = 0; i < w.length; i++) w[i] /= s;
		pts.push({
			mu: vecDot(w, mu),
			vol: Math.sqrt(portfolioVariance(w, cov)),
			weights: w,
			kkt: sol.kkt
		});
	}
	return pts;
}
/** Equal-risk-contribution weights via cyclical coordinate descent (Spinu). */
function riskParity(cov, nIter = 400) {
	const n = cov.length;
	let w = new Array(n).fill(1 / n);
	for (let it = 0; it < nIter; it++) {
		const rc = vecDot(w, matVec(cov, w)) / n;
		let changed = 0;
		for (let i = 0; i < n; i++) {
			const a = cov[i][i];
			let b = 0;
			for (let j = 0; j < n; j++) if (j !== i) b += cov[i][j] * w[j];
			const disc = b * b + 4 * a * rc;
			const wi = a > 0 ? (-b + Math.sqrt(Math.max(disc, 0))) / (2 * a) : w[i];
			changed += Math.abs(wi - w[i]);
			w[i] = Math.max(1e-12, wi);
		}
		const s = w.reduce((a, b) => a + b, 0) || 1;
		for (let i = 0; i < n; i++) w[i] /= s;
		if (changed < 1e-12) break;
	}
	return w;
}
/**
* Black–Litterman posterior from absolute views on individual assets.
* Ω_ii = (1/c - 1) τ P Σ P'  with c in (0,1]; τ = 1/T analogue (0.05).
*/
function blackLitterman(cov, wMkt, views, delta = 2.5, tau = .05, c = defaultConstraints(wMkt.length)) {
	const n = wMkt.length;
	const pi = matVec(cov, wMkt).map((v) => delta * v);
	const active = views.filter((v) => v.asset >= 0 && v.asset < n && v.confidence > 0);
	if (active.length === 0) return {
		mu: pi,
		cov,
		pi,
		weights: meanVarianceTarget(cov, pi, vecDot(pi, wMkt), c).x
	};
	const k = active.length;
	const P = zeros(k, n);
	const q = new Array(k);
	const Omega = zeros(k);
	for (let i = 0; i < k; i++) {
		const v = active[i];
		P[i][v.asset] = 1;
		q[i] = v.expected;
		const pSp = cov[v.asset][v.asset];
		const conf = Math.min(.999, Math.max(.01, v.confidence));
		Omega[i][i] = (1 - conf) / conf * tau * pSp;
	}
	const tauSinv = invertMatrix(addDiag(cov.map((row) => row.map((v) => v * tau)), 1e-14));
	const OmInv = invertMatrix(Omega);
	const Pt = transpose(P);
	const mid = addMatSafe(tauSinv, matMul(Pt, matMul(OmInv, P)));
	const rhs = matVec(tauSinv, pi);
	const POq = matVec(Pt, matVec(OmInv, q));
	for (let i = 0; i < n; i++) rhs[i] += POq[i];
	const mu = solveLinear(mid, rhs);
	minVariance(invertMatrix(mid).map((row, i) => row.map((v, j) => v + (i === j ? 0 : 0))), c);
	return {
		mu,
		cov,
		pi,
		weights: meanVarianceTarget(cov, mu, vecDot(mu, wMkt), c).x
	};
}
function addMatSafe(A, B) {
	const n = A.length;
	const C = zeros(n);
	for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) C[i][j] = A[i][j] + B[i][j];
	return C;
}
var BOOK_META = [
	{
		id: "conservative",
		name: "Conservative",
		riskLevel: 1,
		blurb: "Minimum-variance book on the CMA efficient frontier, long-only with caps."
	},
	{
		id: "mod_conservative",
		name: "Moderately Conservative",
		riskLevel: 2,
		blurb: "A quarter of the way from min-vol to max-return on the CMA frontier."
	},
	{
		id: "balanced",
		name: "Balanced",
		riskLevel: 3,
		blurb: "Mid-frontier mean-variance book. The default planning mix."
	},
	{
		id: "growth",
		name: "Growth",
		riskLevel: 4,
		blurb: "Three-quarters of the way to the maximum-return vertex."
	},
	{
		id: "aggressive",
		name: "Aggressive",
		riskLevel: 5,
		blurb: "Maximum expected return on the CMA frontier subject to the same caps."
	}
];
var FALLBACK_BOOKS = [
	{
		...BOOK_META[0],
		weights: [
			.08,
			.06,
			.04,
			.52,
			.1,
			.2
		]
	},
	{
		...BOOK_META[1],
		weights: [
			.14,
			.1,
			.06,
			.42,
			.12,
			.16
		]
	},
	{
		...BOOK_META[2],
		weights: [
			.22,
			.16,
			.1,
			.3,
			.14,
			.08
		]
	},
	{
		...BOOK_META[3],
		weights: [
			.28,
			.22,
			.14,
			.18,
			.13,
			.05
		]
	},
	{
		...BOOK_META[4],
		weights: [
			.32,
			.26,
			.18,
			.08,
			.13,
			.03
		]
	}
];
function normalize(w) {
	const s = w.reduce((a, b) => a + b, 0);
	if (!(s > 0)) return w.map(() => 1 / w.length);
	return w.map((v) => v / s);
}
function describeConstraints(w, c) {
	const n = w.length;
	const sumW = w.reduce((a, b) => a + b, 0);
	const parts = [];
	let ok = Math.abs(sumW - 1) < 1e-8;
	if (!ok) parts.push(`sum=${sumW.toFixed(8)}`);
	if (c.longOnly) {
		for (let i = 0; i < n; i++) if (w[i] < -1e-8) {
			ok = false;
			parts.push(`w${i}=${w[i].toFixed(6)}<0`);
		}
	}
	for (let i = 0; i < n; i++) {
		const cap = c.caps[i] ?? 1;
		if (w[i] > cap + 1e-8) {
			ok = false;
			parts.push(`w${i}=${w[i].toFixed(6)}>${cap}`);
		}
	}
	for (const g of c.groups) {
		let s = 0;
		for (const i of g.indices) s += w[i] ?? 0;
		if (s > g.cap + 1e-8) {
			ok = false;
			parts.push(`${g.name}=${s.toFixed(6)}>${g.cap}`);
		}
	}
	return {
		ok,
		msg: ok ? "all constraints hold" : parts.join("; "),
		sumW
	};
}
function defaultCmaBooksKkt() {
	const cma = {
		mu: [
			.078,
			.082,
			.085,
			.038,
			.062,
			.028
		],
		vol: [
			.15,
			.165,
			.185,
			.055,
			.125,
			.008
		],
		corr: [
			[
				1,
				.82,
				.78,
				.12,
				.52,
				.05
			],
			[
				.82,
				1,
				.68,
				.08,
				.46,
				.03
			],
			[
				.78,
				.68,
				1,
				.1,
				.4,
				.04
			],
			[
				.12,
				.08,
				.1,
				1,
				.22,
				.18
			],
			[
				.52,
				.46,
				.4,
				.22,
				1,
				.06
			],
			[
				.05,
				.03,
				.04,
				.18,
				.06,
				1
			]
		]
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
		weights: sol.x
	};
}
var booksCacheKey = "";
var booksCache = null;
function modelBooks(cma) {
	const key = JSON.stringify(cma);
	if (booksCache && booksCacheKey === key) return booksCache;
	try {
		const cov = covFromVolCorr(cma.vol, cma.corr);
		const cons = defaultConstraints(cma.mu.length);
		const pts = efficientFrontier(cov, cma.mu, 5, cons);
		if (pts.length !== 5) throw new Error("frontier size");
		booksCache = pts.map((p, i) => ({
			...BOOK_META[i],
			weights: normalize(p.weights)
		}));
		booksCacheKey = key;
		return booksCache;
	} catch {
		booksCache = FALLBACK_BOOKS.map((b) => ({
			...b,
			weights: b.weights.slice()
		}));
		booksCacheKey = key;
		return booksCache;
	}
}
/**
* Default capital-market assumptions (nominal, annual, arithmetic).
* Correlation is constructed to be well-conditioned SPD so Cholesky is stable.
*/
function defaultCma() {
	return {
		mu: [
			.078,
			.082,
			.085,
			.038,
			.062,
			.028
		],
		vol: [
			.15,
			.165,
			.185,
			.055,
			.125,
			.008
		],
		corr: [
			[
				1,
				.82,
				.78,
				.12,
				.52,
				.05
			],
			[
				.82,
				1,
				.68,
				.08,
				.46,
				.03
			],
			[
				.78,
				.68,
				1,
				.1,
				.4,
				.04
			],
			[
				.12,
				.08,
				.1,
				1,
				.22,
				.18
			],
			[
				.52,
				.46,
				.4,
				.22,
				1,
				.06
			],
			[
				.05,
				.03,
				.04,
				.18,
				.06,
				1
			]
		],
		inflation: .024
	};
}
/** Optimizer-derived books on the default CMA. Live CMA uses `modelBooks(cma)`. */
var MODEL_PORTFOLIOS = modelBooks(defaultCma());
function portfolioByRiskLevel(level, cma) {
	const books = cma ? modelBooks(cma) : MODEL_PORTFOLIOS;
	return books.find((p) => p.riskLevel === level) ?? books[2] ?? FALLBACK_BOOKS[2];
}
function assertCma(cma) {
	const n = cma.mu.length;
	if (cma.vol.length !== n || cma.corr.length !== n) return "CMA dimensions do not match.";
	for (let i = 0; i < n; i++) {
		if (!(cma.vol[i] >= 0)) return `Volatility for asset ${i} is negative.`;
		if (cma.corr[i].length !== n) return "Correlation matrix is not square.";
		if (Math.abs(cma.corr[i][i] - 1) > 1e-6) return "Correlation diagonal must be 1.";
		for (let j = 0; j < i; j++) {
			const a = cma.corr[i][j];
			const b = cma.corr[j][i];
			if (Math.abs(a - b) > 1e-9) return "Correlation matrix is not symmetric.";
			if (a < -1 || a > 1) return "Correlation out of [-1, 1].";
		}
	}
	if (!(cma.inflation > -.05 && cma.inflation < .2)) return "Inflation is outside a plausible range.";
	try {
		cholesky(cma.corr);
	} catch {
		return "Correlation matrix is not positive definite.";
	}
	return null;
}
function symmetrizeCorr(corr) {
	const n = corr.length;
	const out = corr.map((row) => row.slice());
	for (let i = 0; i < n; i++) {
		out[i][i] = 1;
		for (let j = 0; j < i; j++) {
			const v = out[j][i];
			out[i][j] = v;
		}
	}
	return out;
}
/** Shared domain types for NORDLYS. Later stages (portfolio, risk, options, backtest) extend these. */
var ASSET_IDS = [
	"global_eq",
	"us_eq",
	"nordic_eq",
	"bonds",
	"real_estate",
	"cash"
];
var ASSET_LABELS = {
	global_eq: "Global equities",
	us_eq: "US equities",
	nordic_eq: "Nordic equities",
	bonds: "Bonds",
	real_estate: "Real estate",
	cash: "Cash"
};
var ASSET_SHORT = {
	global_eq: "Glbl",
	us_eq: "US",
	nordic_eq: "Nord",
	bonds: "Bond",
	real_estate: "RE",
	cash: "Cash"
};
var GOAL_TYPE_LABELS = {
	retirement_income: "Retirement income",
	home: "Home purchase",
	education: "Education",
	legacy: "Legacy"
};
var AS_OF_YEAR = 2026;
var N_PATHS = 1e4;
var N_PATHS_PREVIEW = 2e3;
var DEFAULT_FEE = .0075;
var RISK_LABELS = {
	1: "Conservative",
	2: "Moderately Conservative",
	3: "Balanced",
	4: "Growth",
	5: "Aggressive"
};
var DEMO_CLIENTS = [
	{
		id: "demo-emilie",
		name: "Emilie Voss",
		currency: "NOK",
		members: [{
			id: "demo-emilie-m1",
			name: "Emilie Voss",
			age: 31,
			retirementAge: 65,
			annualIncome: 92e4,
			savingsRate: .26
		}],
		currentAssets: 115e4,
		goals: [
			{
				id: "demo-emilie-g-ret",
				type: "retirement_income",
				name: "Retirement income",
				targetAmount: 48e4,
				year: 2060,
				priority: 1
			},
			{
				id: "demo-emilie-g-home",
				type: "home",
				name: "Oslo apartment (equity)",
				targetAmount: 16e5,
				year: 2031,
				priority: 1
			},
			{
				id: "demo-emilie-g-leg",
				type: "legacy",
				name: "Bequest",
				targetAmount: 25e5,
				year: 2090,
				priority: 3
			}
		],
		answers: [
			4,
			5,
			4,
			4,
			5,
			4,
			5,
			4,
			3,
			3,
			4,
			5
		],
		fee: DEFAULT_FEE,
		seed: 11001
	},
	{
		id: "demo-ward",
		name: "James & Priya Ward",
		currency: "USD",
		members: [{
			id: "demo-ward-m1",
			name: "James Ward",
			age: 58,
			retirementAge: 66,
			annualIncome: 185e3,
			savingsRate: .18
		}, {
			id: "demo-ward-m2",
			name: "Priya Ward",
			age: 56,
			retirementAge: 65,
			annualIncome: 12e4,
			savingsRate: .2
		}],
		currentAssets: 215e4,
		goals: [
			{
				id: "demo-ward-g-ret",
				type: "retirement_income",
				name: "Retirement income",
				targetAmount: 105e3,
				year: 2034,
				priority: 1
			},
			{
				id: "demo-ward-g-edu",
				type: "education",
				name: "Grandchild education",
				targetAmount: 18e4,
				year: 2029,
				priority: 2
			},
			{
				id: "demo-ward-g-home",
				type: "home",
				name: "Coastal house (equity)",
				targetAmount: 4e5,
				year: 2028,
				priority: 2
			},
			{
				id: "demo-ward-g-leg",
				type: "legacy",
				name: "Bequest",
				targetAmount: 75e4,
				year: 2055,
				priority: 3
			}
		],
		answers: [
			3,
			3,
			3,
			3,
			3,
			3,
			3,
			4,
			4,
			3,
			3,
			3
		],
		fee: .008,
		seed: 22002
	},
	{
		id: "demo-ingrid",
		name: "Ingrid Solberg",
		currency: "EUR",
		members: [{
			id: "demo-ingrid-m1",
			name: "Ingrid Solberg",
			age: 73,
			retirementAge: 67,
			annualIncome: 0,
			savingsRate: 0
		}],
		currentAssets: 185e4,
		goals: [
			{
				id: "demo-ingrid-g-ret",
				type: "retirement_income",
				name: "Retirement spending",
				targetAmount: 72e3,
				year: 2026,
				priority: 1
			},
			{
				id: "demo-ingrid-g-edu",
				type: "education",
				name: "Gift to niece",
				targetAmount: 5e4,
				year: 2028,
				priority: 2
			},
			{
				id: "demo-ingrid-g-leg",
				type: "legacy",
				name: "Bequest",
				targetAmount: 4e5,
				year: 2048,
				priority: 2
			}
		],
		answers: [
			3,
			3,
			3,
			3,
			3,
			3,
			1,
			2,
			3,
			2,
			2,
			2
		],
		fee: .006,
		seed: 33003
	}
];
var DEMO_BLURBS = {
	"demo-emilie": "Young professional · Oslo · long horizon, home purchase in five years.",
	"demo-ward": "Pre-retiree couple · mixed goals, seven to ten years to work-optional.",
	"demo-ingrid": "Retiree · drawing a real spending rate, protecting a bequest."
};
function blankProfile() {
	return {
		id: "mydata",
		name: "My household",
		currency: "NOK",
		members: [{
			id: "mydata-m1",
			name: "Me",
			age: 40,
			retirementAge: 65,
			annualIncome: 0,
			savingsRate: .15
		}],
		currentAssets: 0,
		goals: [],
		answers: [
			3,
			3,
			3,
			3,
			3,
			3,
			3,
			3,
			3,
			3,
			3,
			3
		],
		fee: DEFAULT_FEE,
		seed: 44004
	};
}
function cloneProfile(p) {
	return structuredClone(p);
}
function normType(raw) {
	return raw.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
}
var EXACT = {
	KJOPT: "buy",
	KØBT: "buy",
	KOBT: "buy",
	KOPT: "buy",
	"KÖPT": "buy",
	OSTO: "buy",
	BUY: "buy",
	BOUGHT: "buy",
	KJØPT: "buy",
	SALG: "sell",
	SALGT: "sell",
	SOLGT: "sell",
	SALD: "sell",
	"SÅLD": "sell",
	SOLD: "sell",
	SELL: "sell",
	MYYNTI: "sell",
	INNSKUDD: "deposit",
	INSETTING: "deposit",
	INSATTNING: "deposit",
	"INSÄTTNING": "deposit",
	INDBETALING: "deposit",
	TALLETONO: "deposit",
	DEPOSIT: "deposit",
	"CASH DEPOSIT": "deposit",
	UTTAK: "withdrawal",
	"UTTAK INTERNT": "withdrawal",
	"UTTAK EKSTERNT": "withdrawal",
	"INTERN UTTAG": "withdrawal",
	UTTAG: "withdrawal",
	"INTERN HAEVNING": "withdrawal",
	"INTERN HÆVNING": "withdrawal",
	HAEVNING: "withdrawal",
	"SISAINEN NOSTO": "withdrawal",
	NOSTO: "withdrawal",
	WITHDRAWAL: "withdrawal",
	"INTERNAL WITHDRAWAL": "withdrawal",
	"CASH WITHDRAWAL": "withdrawal",
	UTBYTTE: "dividend",
	UTDELNING: "dividend",
	UDBYTTE: "dividend",
	OSINKO: "dividend",
	DIVIDEND: "dividend",
	DIVIDENDI: "dividend",
	KUPONGSKATT: "withholding_tax",
	KUPONSKAT: "withholding_tax",
	KALLSKATT: "withholding_tax",
	"KÄLLSKATT": "withholding_tax",
	LAHDEVERO: "withholding_tax",
	"LÄHDEVERO": "withholding_tax",
	"WITHHOLDING TAX": "withholding_tax",
	"DIVIDEND WITHHOLDING TAX": "withholding_tax",
	KILDESSKATT: "withholding_tax",
	PLATTFORMAVGIFT: "fee",
	PLATTFORMGEBYR: "fee",
	PLATFORMGEBYR: "fee",
	ALUSTAMAKSU: "fee",
	"PLATFORM FEE": "fee",
	"PLATFORMFEES": "fee",
	DEPOTGEBYR: "fee",
	DEPOTAVGIFT: "fee",
	KURTAGE: "fee",
	COURTAGE: "fee",
	RENTE: "interest",
	RANTA: "interest",
	"RÄNTA": "interest",
	RENTEINNTEKT: "interest",
	INTEREST: "interest",
	KORKO: "interest",
	VALUTAVEKSLING: "currency_exchange",
	VALUTAVAXLING: "currency_exchange",
	"VALUTAVÄXLING": "currency_exchange",
	VALUTAHANDEL: "currency_exchange",
	VEKSLING: "currency_exchange",
	FX: "currency_exchange",
	"CURRENCY EXCHANGE": "currency_exchange",
	"CURRENCY CONVERSION": "currency_exchange",
	"FX TRADE": "currency_exchange",
	SPLITT: "split",
	SPLIT: "split",
	AKSJESPLITT: "split",
	AKTIESPLIT: "split",
	STOCKSPLIT: "split",
	"STOCK SPLIT": "split",
	EMISSION: "other_corporate",
	NYEMISSION: "other_corporate",
	FUSION: "other_corporate",
	MERGER: "other_corporate",
	SPINOFF: "other_corporate",
	"SPIN-OFF": "other_corporate",
	INLOSNING: "other_corporate",
	"INLÖSNING": "other_corporate",
	TILDELING: "other_corporate",
	"CORPORATE ACTION": "other_corporate"
};
function classifyType(rawType, mappings) {
	const trimmed = rawType.trim();
	if (!trimmed) return null;
	if (mappings[trimmed]) return mappings[trimmed];
	const key = normType(trimmed);
	if (mappings[key]) return mappings[key];
	if (EXACT[trimmed.toUpperCase()]) return EXACT[trimmed.toUpperCase()];
	if (EXACT[key]) return EXACT[key];
	if (EXACT[key.replace(/ /g, "")]) return EXACT[key.replace(/ /g, "")];
	if (/VALUTA/.test(key) && /VEKSL|VAXL|VÄXL|EXCHANGE|HANDEL|CONVERSION/.test(key)) return "currency_exchange";
	return null;
}
var TX_KIND_LABELS = {
	buy: "Buy",
	sell: "Sell",
	dividend: "Dividend",
	withholding_tax: "Withholding tax",
	fee: "Fee",
	interest: "Interest",
	deposit: "Deposit",
	withdrawal: "Withdrawal",
	currency_exchange: "Currency exchange",
	split: "Split",
	other_corporate: "Corporate action"
};
var TX_KINDS = [
	"buy",
	"sell",
	"dividend",
	"withholding_tax",
	"fee",
	"interest",
	"deposit",
	"withdrawal",
	"currency_exchange",
	"split",
	"other_corporate"
];
var NORDNET_COL = {
	id: 0,
	bookingDate: 1,
	tradeDate: 2,
	settleDate: 3,
	portfolio: 4,
	type: 5,
	security: 6,
	isin: 7,
	qty: 8,
	price: 9,
	interest: 10,
	totalFees: 11,
	feeCcy: 12,
	amount: 13,
	amountCcy: 14,
	purchaseValue: 15,
	purchaseCcy: 16,
	result: 17,
	resultCcy: 18,
	totalQty: 19,
	saldo: 20,
	fxRate: 21,
	text: 22,
	cancelDate: 23,
	noteNumber: 24,
	verification: 25,
	brokerage: 26,
	brokerageCcy: 27,
	valutakurs: 28,
	initialInterest: 29
};
var NORDNET_HEADERS_NB = [
	"Id",
	"Bokføringsdag",
	"Handelsdag",
	"Oppgjørsdag",
	"Portefølje",
	"Transaksjonstype",
	"Verdipapir",
	"ISIN",
	"Antall",
	"Kurs",
	"Rente",
	"Totale Avgifter",
	"Valuta",
	"Beløp",
	"Valuta",
	"Kjøpsverdi",
	"Valuta",
	"Resultat",
	"Valuta",
	"Totalt antall",
	"Saldo",
	"Vekslingskurs",
	"Transaksjonstekst",
	"Makuleringsdato",
	"Sluttseddelnummer",
	"Verifikationsnummer",
	"Kurtasje",
	"Valuta",
	"Valutakurs",
	"Innledende rente"
];
/** Locale-aware number and date parsing. No external libraries. */
var SPACES = /[\s\u00A0\u202F\u2007\u2009\u200A]/g;
var CURRENCY_TOKEN = /(?:NOK|USD|EUR|SEK|DKK|GBP|CHF|JPY|AUD|CAD|\$|€|£|kr\.?)/gi;
function round2(n) {
	return Math.round((n + Number.EPSILON) * 100) / 100;
}
function round4(n) {
	return Math.round((n + Number.EPSILON) * 1e4) / 1e4;
}
/**
* Parse a numeric cell in any of the common bank/CSV conventions:
*   "1 234,56"  "1\u00A0234,56"  "1.234,56"  "$1,234.56" → 1234.56
*   "(1,234.56)"  "1234,56-" → -1234.56
*/
function parseNumber(raw) {
	if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
	if (raw == null) return null;
	let s = String(raw).trim();
	if (s === "" || s === "-" || s === "–") return null;
	let neg = false;
	if (s.startsWith("(") && s.endsWith(")")) {
		neg = true;
		s = s.slice(1, -1).trim();
	}
	if (s.endsWith("-") || s.endsWith("−")) {
		neg = true;
		s = s.slice(0, -1).trim();
	}
	if (s.startsWith("+")) s = s.slice(1).trim();
	if (s.startsWith("-") || s.startsWith("−")) {
		neg = true;
		s = s.slice(1).trim();
	}
	s = s.replace(CURRENCY_TOKEN, "");
	s = s.replace(SPACES, "");
	s = s.replace(/['`]/g, "");
	if (s === "") return null;
	if (/^\d+$/.test(s)) {
		const n = Number(s);
		return Number.isFinite(n) ? neg ? -n : n : null;
	}
	if (/^\d+\.\d+$/.test(s)) {
		const n = Number(s);
		return Number.isFinite(n) ? neg ? -n : n : null;
	}
	const lastComma = s.lastIndexOf(",");
	const lastDot = s.lastIndexOf(".");
	let normalized;
	if (lastComma >= 0 && lastDot >= 0) {
		if (lastComma > lastDot) normalized = s.replace(/\./g, "").replace(",", ".");
		else normalized = s.replace(/,/g, "");
	} else if (lastComma >= 0) {
		const commas = (s.match(/,/g) ?? []).length;
		const frac = s.length - lastComma - 1;
		if (commas > 1 && frac === 3) normalized = s.replace(/,/g, "");
		else normalized = s.replace(",", ".");
	} else if (lastDot >= 0) {
		const dots = (s.match(/\./g) ?? []).length;
		const frac = s.length - lastDot - 1;
		if (dots > 1 && frac === 3) normalized = s.replace(/\./g, "");
		else normalized = s;
	} else normalized = s;
	const n = Number(normalized);
	if (!Number.isFinite(n)) return null;
	return neg ? -n : n;
}
function parseNumberOr0(raw) {
	return parseNumber(raw) ?? 0;
}
/** Return ISO YYYY-MM-DD, or null. */
function parseDate(raw) {
	if (raw == null) return null;
	const s = raw.trim();
	if (!s) return null;
	const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
	if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
	const dmy = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(s);
	if (dmy) {
		const dd = dmy[1].padStart(2, "0");
		const mm = dmy[2].padStart(2, "0");
		return `${dmy[3]}-${mm}-${dd}`;
	}
	const mdy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
	if (mdy) {
		const mm = mdy[1].padStart(2, "0");
		const dd = mdy[2].padStart(2, "0");
		return `${mdy[3]}-${mm}-${dd}`;
	}
	const us = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(s);
	if (us) {
		const a = Number(us[1]);
		const b = Number(us[2]);
		if (a > 12) return `${us[3]}-${String(b).padStart(2, "0")}-${String(a).padStart(2, "0")}`;
		return `${us[3]}-${String(a).padStart(2, "0")}-${String(b).padStart(2, "0")}`;
	}
	return null;
}
function formatIso(d) {
	return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
function daysBetween(a, b) {
	const ta = Date.parse(a + "T00:00:00Z");
	const tb = Date.parse(b + "T00:00:00Z");
	return Math.round((tb - ta) / 864e5);
}
function nnNumber(n, decimals) {
	if (!Number.isFinite(n)) return "";
	return (n < 0 ? "-" : "") + Math.abs(n).toFixed(decimals).replace(".", ",");
}
/** Encoding detection, delimiter sniffing, CSV split, Nordnet 30-column parse. */
function decodeText(buf) {
	const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
	if (u8.length >= 2 && u8[0] === 255 && u8[1] === 254) return {
		text: new TextDecoder("utf-16le").decode(u8.subarray(2)),
		encoding: "utf-16le"
	};
	if (u8.length >= 2 && u8[0] === 254 && u8[1] === 255) return {
		text: new TextDecoder("utf-16be").decode(u8.subarray(2)),
		encoding: "utf-16be"
	};
	if (u8.length >= 3 && u8[0] === 239 && u8[1] === 187 && u8[2] === 191) return {
		text: new TextDecoder("utf-8").decode(u8.subarray(3)),
		encoding: "utf-8-bom"
	};
	if (looksLikeUtf16(u8, "le")) return {
		text: new TextDecoder("utf-16le").decode(u8),
		encoding: "utf-16le"
	};
	if (looksLikeUtf16(u8, "be")) return {
		text: new TextDecoder("utf-16be").decode(u8),
		encoding: "utf-16be"
	};
	return {
		text: new TextDecoder("utf-8").decode(u8),
		encoding: "utf-8"
	};
}
function looksLikeUtf16(u8, endian) {
	if (u8.length < 8) return false;
	const n = Math.min(u8.length, 400);
	let zeros = 0;
	const odd = endian === "le" ? 1 : 0;
	for (let i = odd; i < n; i += 2) if (u8[i] === 0) zeros += 1;
	return zeros / (n / 2) > .3;
}
function encodeUtf16Le(text, bom = true) {
	const out = new Uint8Array((bom ? 2 : 0) + text.length * 2);
	let o = 0;
	if (bom) {
		out[o++] = 255;
		out[o++] = 254;
	}
	for (let i = 0; i < text.length; i++) {
		const c = text.charCodeAt(i);
		out[o++] = c & 255;
		out[o++] = c >> 8 & 255;
	}
	return out;
}
function splitLines(text) {
	let crlf = 0;
	let lf = 0;
	let cr = 0;
	const lines = [];
	let cur = "";
	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		if (ch === "\r") {
			if (text[i + 1] === "\n") {
				crlf += 1;
				i += 1;
			} else cr += 1;
			lines.push(cur);
			cur = "";
		} else if (ch === "\n") {
			lf += 1;
			lines.push(cur);
			cur = "";
		} else cur += ch;
	}
	if (cur.length || text.endsWith("\n") || text.endsWith("\r")) {
		if (cur.length) lines.push(cur);
	}
	const lineEnding = [
		crlf > 0,
		lf > 0,
		cr > 0
	].filter(Boolean).length > 1 ? "mixed" : crlf > 0 ? "crlf" : cr > 0 ? "cr" : "lf";
	while (lines.length && lines[lines.length - 1] === "") lines.pop();
	return {
		lines,
		lineEnding
	};
}
function countUnquoted(line, delim) {
	let n = 0;
	let q = false;
	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (ch === "\"") {
			if (q && line[i + 1] === "\"") i += 1;
			else q = !q;
		} else if (!q && ch === delim) n += 1;
	}
	return n;
}
function detectDelimiter(headerLine) {
	const tab = countUnquoted(headerLine, "	");
	const semi = countUnquoted(headerLine, ";");
	const comma = countUnquoted(headerLine, ",");
	if (tab >= semi && tab >= comma && tab > 0) return "	";
	if (semi >= comma && semi > 0) return ";";
	if (comma > 0) return ",";
	return "	";
}
function splitCsvLine(line, delimiter) {
	if (!line.includes("\"")) {
		const parts = line.split(delimiter);
		for (let i = 0; i < parts.length; i++) parts[i] = parts[i].trim();
		return parts;
	}
	const out = [];
	let cur = "";
	let q = false;
	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (ch === "\"") {
			if (q && line[i + 1] === "\"") {
				cur += "\"";
				i += 1;
			} else q = !q;
		} else if (!q && ch === delimiter) {
			out.push(cur);
			cur = "";
		} else cur += ch;
	}
	out.push(cur);
	return out.map((c) => c.trim());
}
function csvEscape(value, delimiter) {
	if (value.includes("\"") || value.includes(delimiter) || value.includes("\n") || value.includes("\r")) return `"${value.replace(/"/g, "\"\"")}"`;
	return value;
}
var HEADER_ALIASES = {};
function alias(keys, field) {
	for (const k of keys) HEADER_ALIASES[normHeader$1(k)] = field;
}
function normHeader$1(h) {
	return h.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
}
alias([
	"Id",
	"ID",
	"Transaksjons-id",
	"Transaction id"
], "id");
alias([
	"Bokføringsdag",
	"Bokforingsdag",
	"Bokföringsdag",
	"Bogføringsdag",
	"Kirjauspäivä",
	"Booking day",
	"Booked",
	"Accounting date"
], "bookingDate");
alias([
	"Handelsdag",
	"Affärsdag",
	"Kauppapäivä",
	"Trade date",
	"Trade day",
	"Transaction date"
], "tradeDate");
alias([
	"Oppgjørsdag",
	"Likviddag",
	"Afviklingsdag",
	"Selvityspäivä",
	"Settlement date",
	"Settlement day"
], "settleDate");
alias([
	"Portefølje",
	"Portfölj",
	"Salkku",
	"Portfolio",
	"Account"
], "portfolio");
alias([
	"Transaksjonstype",
	"Transaktionstyp",
	"Tapahtumatyyppi",
	"Transaction type",
	"Type"
], "type");
alias([
	"Verdipapir",
	"Värdepapper",
	"Værdipapir",
	"Arvopaperi",
	"Security",
	"Instrument",
	"Name"
], "security");
alias(["ISIN"], "isin");
alias([
	"Antall",
	"Antal",
	"Määrä",
	"Quantity",
	"Qty",
	"Shares"
], "qty");
alias([
	"Kurs",
	"Kurssi",
	"Price",
	"Rate"
], "price");
alias([
	"Rente",
	"Ränta",
	"Ränta",
	"Korko",
	"Interest"
], "interest");
alias([
	"Totale Avgifter",
	"Totale avgifter",
	"Courtage totalt",
	"Total fees",
	"Fees",
	"Avgift"
], "totalFees");
alias([
	"Beløp",
	"Belopp",
	"Amount",
	"Summa"
], "amount");
alias([
	"Kjøpsverdi",
	"Anskaffningsvärde",
	"Purchase value",
	"Cost"
], "purchaseValue");
alias([
	"Resultat",
	"Result",
	"Tulos",
	"Gain"
], "result");
alias([
	"Totalt antall",
	"Totalt antal",
	"Total quantity",
	"Balance qty"
], "totalQty");
alias([
	"Saldo",
	"Balance",
	"Cash balance"
], "saldo");
alias([
	"Vekslingskurs",
	"Växelkurs",
	"Exchange rate",
	"FX rate",
	"Fx"
], "fxRate");
alias([
	"Transaksjonstekst",
	"Transaktionstext",
	"Text",
	"Description",
	"Memo"
], "text");
alias([
	"Makuleringsdato",
	"Makuleringsdatum",
	"Cancellation date",
	"Cancelled"
], "cancelDate");
alias([
	"Sluttseddelnummer",
	"Slutsedelnummer",
	"Note number",
	"Contract note"
], "noteNumber");
alias([
	"Verifikationsnummer",
	"Verification number",
	"Verificate"
], "verification");
alias([
	"Kurtasje",
	"Courtage",
	"Brokerage",
	"Commission"
], "brokerage");
alias(["Valutakurs", "Valutakursi"], "valutakurs");
alias([
	"Innledende rente",
	"Ingående ränta",
	"Initial interest"
], "initialInterest");
function isNordnetHeader(headers) {
	if (headers.length >= 30 && normHeader$1(headers[0] ?? "") === "id") return true;
	return headers.filter((h) => HEADER_ALIASES[normHeader$1(h)]).length >= 8 && headers.length >= 14;
}
function parseTable(text) {
	const { lines, lineEnding } = splitLines(text.replace(/^\uFEFF/, ""));
	if (lines.length === 0) return {
		headers: [],
		rows: [],
		meta: {
			encoding: "",
			delimiter: "	",
			lineEnding,
			headerCount: 0,
			positional: false,
			headers: []
		}
	};
	let headerIdx = 0;
	while (headerIdx < lines.length && lines[headerIdx].trim() === "") headerIdx += 1;
	const headerLine = lines[headerIdx] ?? "";
	const delimiter = detectDelimiter(headerLine);
	const headers = splitCsvLine(headerLine, delimiter);
	const rows = [];
	for (let i = headerIdx + 1; i < lines.length; i++) {
		const line = lines[i];
		if (line.trim() === "") continue;
		rows.push(splitCsvLine(line, delimiter));
	}
	const positional = headers.length >= 30 && isNordnetHeader(headers);
	return {
		headers,
		rows,
		meta: {
			encoding: "",
			delimiter: delimiter === "	" ? "tab" : delimiter,
			lineEnding,
			headerCount: headers.length,
			positional,
			headers
		}
	};
}
function cell(cells, i) {
	return (cells[i] ?? "").trim();
}
function buildIndexMap(headers) {
	const map = Array.from({ length: 30 }, () => -1);
	const seenValuta = [];
	for (let i = 0; i < headers.length; i++) {
		const n = normHeader$1(headers[i] ?? "");
		if (n === "valuta" || n === "currency" || n === "ccy") {
			seenValuta.push(i);
			continue;
		}
		const field = HEADER_ALIASES[n];
		if (field && field !== "skip" && map[NORDNET_COL[field]] === -1) map[NORDNET_COL[field]] = i;
	}
	const valutaTargets = [
		NORDNET_COL.feeCcy,
		NORDNET_COL.amountCcy,
		NORDNET_COL.purchaseCcy,
		NORDNET_COL.resultCcy,
		NORDNET_COL.brokerageCcy
	];
	for (let k = 0; k < valutaTargets.length && k < seenValuta.length; k++) map[valutaTargets[k]] = seenValuta[k];
	return map;
}
function mappedCell(cells, map, pos) {
	if (!map) return cell(cells, pos);
	const i = map[pos];
	if (i < 0) return "";
	return cell(cells, i);
}
function rowsToNordnet(headers, rows, positional) {
	const map = positional ? null : buildIndexMap(headers);
	const out = [];
	for (let r = 0; r < rows.length; r++) {
		const cells = rows[r];
		const get = (pos) => mappedCell(cells, map, pos);
		const getNum = (pos) => parseNumberOr0(get(pos));
		const getNumNull = (pos) => {
			const raw = get(pos);
			if (raw === "") return null;
			return parseNumber(raw);
		};
		if (cells.every((c) => c.trim() === "")) continue;
		out.push({
			rowNumber: r + 2,
			cells,
			id: get(NORDNET_COL.id),
			bookingDate: parseDate(get(NORDNET_COL.bookingDate)) ?? get(NORDNET_COL.bookingDate),
			tradeDate: parseDate(get(NORDNET_COL.tradeDate)) ?? get(NORDNET_COL.tradeDate),
			settleDate: parseDate(get(NORDNET_COL.settleDate)) ?? get(NORDNET_COL.settleDate),
			portfolio: get(NORDNET_COL.portfolio),
			rawType: get(NORDNET_COL.type),
			name: get(NORDNET_COL.security),
			isin: get(NORDNET_COL.isin),
			qty: getNum(NORDNET_COL.qty),
			price: getNum(NORDNET_COL.price),
			interest: getNum(NORDNET_COL.interest),
			totalFees: getNum(NORDNET_COL.totalFees),
			feeCcy: get(NORDNET_COL.feeCcy),
			amount: getNum(NORDNET_COL.amount),
			amountCcy: get(NORDNET_COL.amountCcy),
			purchaseValue: getNum(NORDNET_COL.purchaseValue),
			purchaseCcy: get(NORDNET_COL.purchaseCcy),
			result: getNum(NORDNET_COL.result),
			resultCcy: get(NORDNET_COL.resultCcy),
			totalQty: getNumNull(NORDNET_COL.totalQty),
			saldo: getNumNull(NORDNET_COL.saldo),
			fxRate: getNum(NORDNET_COL.fxRate),
			text: get(NORDNET_COL.text),
			cancelDate: parseDate(get(NORDNET_COL.cancelDate)) ?? get(NORDNET_COL.cancelDate),
			noteNumber: get(NORDNET_COL.noteNumber),
			verification: get(NORDNET_COL.verification),
			brokerage: getNum(NORDNET_COL.brokerage),
			brokerageCcy: get(NORDNET_COL.brokerageCcy),
			valutakurs: getNum(NORDNET_COL.valutakurs),
			initialInterest: getNum(NORDNET_COL.initialInterest)
		});
	}
	return out;
}
function parseNordnetBytes(buf) {
	const { text, encoding } = decodeText(buf);
	const table = parseTable(text);
	table.meta.encoding = encoding;
	return {
		rows: rowsToNordnet(table.headers, table.rows, table.meta.positional),
		meta: table.meta,
		text
	};
}
function inspectNordnetFormat(buf) {
	const bomUtf16Le = buf.length >= 2 && buf[0] === 255 && buf[1] === 254;
	const { text } = decodeText(buf);
	const { lines, lineEnding } = splitLines(text.replace(/^\uFEFF/, ""));
	const header = lines[0] ?? "";
	header.includes("	") && !header.includes(",") || header.split("	").length;
	const headers = header.split("	");
	const valutaColumns = [];
	headers.forEach((h, i) => {
		if (h === "Valuta") valutaColumns.push(i);
	});
	const headersMatch = headers.length === 30 && NORDNET_HEADERS_NB.every((h, i) => headers[i] === h);
	return {
		bomUtf16Le,
		tabDelimited: headers.length === 30 && header.split("	").length === 30,
		crlf: lineEnding === "crlf",
		columnCount: headers.length,
		valutaColumns,
		headersMatch,
		headers
	};
}
function idNum(id) {
	const n = Number(id);
	return Number.isFinite(n) ? n : NaN;
}
function byIdAsc$1(a, b) {
	const ai = idNum(a.id);
	const bi = idNum(b.id);
	if (Number.isFinite(ai) && Number.isFinite(bi) && ai !== bi) return ai - bi;
	return a.id.localeCompare(b.id, void 0, { numeric: true });
}
/** Rows that actually change a position. UTBYTTE / KUPONGSKATT do not. */
function isQtyChangingKind(kind) {
	return kind === "buy" || kind === "sell" || kind === "split" || kind === "other_corporate";
}
function signedQty(row, kind) {
	if (kind === "sell") return -Math.abs(row.qty);
	if (kind === "buy") return Math.abs(row.qty);
	if (kind === "split" || kind === "other_corporate") return row.qty;
	return 0;
}
function reconcileRows(rows) {
	const active = rows.filter((r) => !r.cancelDate).slice().sort(byIdAsc$1);
	const issues = [];
	let saldo = 0;
	let opening = 0;
	const qty = /* @__PURE__ */ new Map();
	if (active.length && active[0].saldo != null) {
		opening = round2(active[0].saldo - active[0].amount);
		saldo = opening;
	}
	for (const row of active) {
		saldo = round2(saldo + row.amount);
		if (row.saldo != null && !Number.isNaN(row.saldo)) {
			const delta = round2(saldo - row.saldo);
			if (Math.abs(delta) > .005) {
				issues.push({
					rowNumber: row.rowNumber,
					nordnetId: row.id,
					field: "saldo",
					expected: saldo,
					reported: row.saldo,
					delta,
					level: "error"
				});
				saldo = row.saldo;
			}
		}
		const kind = classifyType(row.rawType, {});
		if (!row.isin || !isQtyChangingKind(kind)) continue;
		const signed = signedQty(row, kind);
		if (kind === "other_corporate" && signed === 0) continue;
		const next = round4((qty.get(row.isin) ?? 0) + signed);
		qty.set(row.isin, next);
		if (row.totalQty != null) {
			const qDelta = round4(next - row.totalQty);
			if (Math.abs(qDelta) > 0) issues.push({
				rowNumber: row.rowNumber,
				nordnetId: row.id,
				field: "qty",
				expected: next,
				reported: row.totalQty,
				delta: qDelta,
				level: Math.abs(qDelta) <= 1e-4 ? "info" : "error"
			});
		}
	}
	const closing = active.length ? active[active.length - 1].saldo ?? saldo : opening;
	return {
		issues,
		saldoErrors: issues.filter((i) => i.field === "saldo" && i.level === "error").length,
		qtyErrors: issues.filter((i) => i.field === "qty" && i.level === "error").length,
		qtyRounding: issues.filter((i) => i.field === "qty" && i.level === "info").length,
		openingSaldo: opening,
		closingSaldo: closing
	};
}
var NORDIC = /* @__PURE__ */ new Set([
	"NO",
	"SE",
	"DK",
	"FI",
	"IS"
]);
var KNOWN_CCY = /* @__PURE__ */ new Set([
	"USD",
	"EUR",
	"SEK",
	"DKK",
	"GBP",
	"CHF",
	"CAD",
	"AUD",
	"JPY",
	"NOK"
]);
var CCY_NAME_ALIASES = [
	[/\b(us\s*dollar|amerikanske\s+dollar|usd)\b/i, "USD"],
	[/\b(euro|eur)\b/i, "EUR"],
	[/\b(svenska\s+kronor|svenske\s+kroner|sek)\b/i, "SEK"],
	[/\b(danske\s+kroner|dkk)\b/i, "DKK"],
	[/\b(sterling|britiske\s+pund|gbp)\b/i, "GBP"],
	[/\b(swiss\s+franc|sveitsiske\s+franc|chf)\b/i, "CHF"]
];
function looksLikeFund(name) {
	const n = name.toLowerCase();
	return /etf|ucits|fond|fund|indeks|index|ishares|vanguard|xact|sicav|obligasjon|rentebevis|pengemarked|money market|kredittfond|likviditet|likvider|aksjefond|rentefond|kombinasjonsfond|mutual|unit trust/.test(n);
}
/**
* Nordnet files have no ticker and no exchange. Never invent them from the ISIN.
* Funds are labelled exchange "Fund"; everything else stays blank for the user to fill.
*/
function inferTicker(_name, _isin) {
	return "";
}
function inferExchange(name, _isin) {
	return looksLikeFund(name) ? "Fund" : "";
}
function inferAssetClass(isin, name) {
	const n = name.toLowerCase();
	if (/obligasjon|obligation|bond|rente|gilt|kredit|credit|treasury|rentebevis/.test(n)) return "bonds";
	if (/eiendom|real estate|reit|property|fastighet|bolig/.test(n)) return "real_estate";
	if (/money market|pengemarked|likviditet|cash fund/.test(n)) return "cash";
	const p = isin.slice(0, 2).toUpperCase();
	if (p === "US") return "us_eq";
	if (NORDIC.has(p)) return "nordic_eq";
	return "global_eq";
}
function cleanCcy(raw) {
	const c = raw.trim().toUpperCase();
	return /^[A-Z]{3}$/.test(c) ? c : "";
}
function ccyInText(s) {
	const up = s.toUpperCase();
	for (const c of [
		"USD",
		"EUR",
		"SEK",
		"DKK",
		"GBP",
		"CHF",
		"CAD",
		"AUD",
		"JPY"
	]) if (new RegExp(`\\b${c}\\b`).test(up)) return c;
	for (const [re, ccy] of CCY_NAME_ALIASES) if (re.test(s)) return ccy;
	return "";
}
function fxRateFromRow(row) {
	if (row.fxRate > 0) return row.fxRate;
	if (row.valutakurs > 0) return row.valutakurs;
	return 0;
}
function fxRateFromTrade(row) {
	const tagged = fxRateFromRow(row);
	if (tagged > 0) return tagged;
	if (row.isFxTrade && row.price > 0) return row.price;
	if (row.isFxTrade && row.qty && Number.isFinite(row.amount / row.qty)) {
		const implied = Math.abs(row.amount / row.qty);
		if (implied > .01) return implied;
	}
	return 0;
}
/** Non-NOK currency carried on a row, if any. */
function foreignCcyFromRow(row) {
	const cols = [
		row.purchaseCcy,
		row.resultCcy,
		row.feeCcy,
		row.brokerageCcy,
		row.amountCcy
	];
	for (const raw of cols) {
		const c = cleanCcy(raw);
		if (c && c !== "NOK") return c;
	}
	const named = cleanCcy(row.name);
	if (named && named !== "NOK" && KNOWN_CCY.has(named)) return named;
	const fromText = ccyInText(`${row.name} ${row.text}`);
	if (fromText) return fromText;
	if (row.cells) for (const cell of row.cells) {
		const c = cleanCcy(cell);
		if (c && c !== "NOK" && KNOWN_CCY.has(c)) return c;
		const t = ccyInText(cell);
		if (t) return t;
	}
	return "";
}
/**
* Trading currency of a security from a trade row.
* Rule: Vekslingskurs filled, or Kjøpsverdi/Resultat valuta other than NOK → that currency.
* Do not stamp NOK when an FX rate is present — a later (or earlier) row may carry USD.
*/
function inferTradeCurrency(row) {
	const purchase = cleanCcy(row.purchaseCcy);
	const result = cleanCcy(row.resultCcy);
	if (purchase && purchase !== "NOK") return purchase;
	if (result && result !== "NOK") return result;
	const fx = fxRateFromRow(row);
	const foreign = foreignCcyFromRow(row);
	if (foreign) return foreign;
	if (fx > 0 && Math.abs(fx - 1) > 1e-8) return "";
	return "NOK";
}
function preferCurrency(prev, incoming) {
	const a = cleanCcy(prev);
	const b = cleanCcy(incoming);
	if (b && b !== "NOK") return b;
	if (a && a !== "NOK") return a;
	return b || a || "NOK";
}
function withUserPatch(sec, patch) {
	const userSet = { ...sec.userSet ?? {} };
	if (patch.ticker !== void 0) userSet.ticker = true;
	if (patch.name !== void 0) userSet.name = true;
	if (patch.currency !== void 0) userSet.currency = true;
	if (patch.exchange !== void 0) userSet.exchange = true;
	if (patch.assetClass !== void 0 || patch.assetClassConfirmed === true) userSet.assetClass = true;
	const assetClassConfirmed = patch.assetClass !== void 0 || patch.assetClassConfirmed === true ? true : patch.assetClassConfirmed ?? sec.assetClassConfirmed;
	return {
		...sec,
		...patch,
		userSet,
		assetClassConfirmed
	};
}
function upsertSecurity(list, incoming) {
	const i = list.findIndex((s) => s.isin === incoming.isin);
	if (i < 0) return [...list, {
		...incoming,
		ticker: incoming.userSet?.ticker ? incoming.ticker : incoming.ticker || "",
		exchange: incoming.userSet?.exchange ? incoming.exchange : incoming.exchange || inferExchange(incoming.name, incoming.isin),
		userSet: incoming.userSet ?? {},
		assetClassConfirmed: incoming.assetClassConfirmed ?? false
	}];
	const prev = list[i];
	const user = prev.userSet ?? {};
	const next = [...list];
	const name = user.name ? prev.name : incoming.name || prev.name;
	next[i] = {
		isin: prev.isin,
		ticker: user.ticker ? prev.ticker : incoming.ticker || "",
		name,
		currency: user.currency ? prev.currency : preferCurrency(prev.currency, incoming.currency),
		exchange: user.exchange ? prev.exchange : incoming.exchange || inferExchange(name, prev.isin),
		assetClass: user.assetClass || prev.assetClassConfirmed ? prev.assetClass : incoming.assetClass || prev.assetClass,
		assetClassConfirmed: prev.assetClassConfirmed ?? false,
		userSet: user
	};
	return next;
}
function overlaySecurityMaster(secs, master) {
	return secs.map((s) => {
		const o = master[s.isin];
		if (!o) return s;
		const ou = o.userSet ?? {};
		return {
			...s,
			ticker: ou.ticker ? o.ticker ?? s.ticker : s.ticker,
			name: ou.name ? o.name ?? s.name : s.name,
			currency: ou.currency ? o.currency ?? s.currency : s.currency,
			exchange: ou.exchange ? o.exchange ?? s.exchange : s.exchange,
			assetClass: ou.assetClass || o.assetClassConfirmed ? o.assetClass ?? s.assetClass : s.assetClass,
			assetClassConfirmed: o.assetClassConfirmed ?? s.assetClassConfirmed,
			userSet: {
				...s.userSet ?? {},
				...ou
			}
		};
	});
}
/**
* One-time cleanup: drop auto-generated tickers/exchanges, keep only user-entered
* fields. Funds without a user exchange become "Fund".
*/
function sanitizeSecurity(sec) {
	const user = { ...sec.userSet ?? {} };
	const keepTicker = Boolean(user.ticker);
	const keepExchange = Boolean(user.exchange);
	return {
		...sec,
		ticker: keepTicker ? sec.ticker : "",
		exchange: keepExchange ? sec.exchange : inferExchange(sec.name, sec.isin),
		userSet: {
			...user,
			ticker: keepTicker,
			exchange: keepExchange
		}
	};
}
function sanitizeSecurities(list) {
	return list.map(sanitizeSecurity);
}
function sanitizeSecurityMaster(master) {
	const out = {};
	for (const [isin, o] of Object.entries(master)) {
		const user = { ...o.userSet ?? {} };
		const next = {
			...o,
			userSet: user
		};
		if (!user.ticker) next.ticker = "";
		if (!user.exchange) next.exchange = looksLikeFund(o.name ?? "") ? "Fund" : "";
		out[isin] = next;
	}
	return out;
}
function majorityForeignCcy(items) {
	const counts = /* @__PURE__ */ new Map();
	for (const it of items) for (const raw of [
		it.purchaseCcy,
		it.resultCcy,
		it.priceCcy,
		it.currency
	]) {
		const c = cleanCcy(raw ?? "");
		if (c && c !== "NOK") counts.set(c, (counts.get(c) ?? 0) + 1);
	}
	let best = "USD";
	let n = 0;
	for (const [c, k] of counts) if (k > n) {
		best = c;
		n = k;
	}
	return best;
}
function mergeFxFromTransactions(existing, txs, replaceNordnet = true) {
	const kept = replaceNordnet ? existing.filter((f) => f.source === "import" || f.source === "synthetic") : existing.slice();
	const seen = new Set(kept.map((f) => `${f.pair}|${f.date}`));
	const fallback = majorityForeignCcy(txs);
	const out = kept.slice();
	for (const tx of txs) {
		if (tx.cancelled || tx.cancelDate) continue;
		const isFxTrade = tx.kind === "currency_exchange";
		const rate = fxRateFromTrade({
			fxRate: tx.fxRate,
			valutakurs: tx.valutakurs,
			price: tx.price,
			qty: tx.qty,
			amount: tx.amount,
			isFxTrade
		});
		if (!(rate > 0)) continue;
		if (!isFxTrade && Math.abs(rate - 1) < 1e-12) continue;
		let ccy = foreignCcyFromRow({
			purchaseCcy: tx.purchaseCcy,
			resultCcy: tx.resultCcy,
			feeCcy: tx.feeCcy,
			brokerageCcy: tx.feeCcy,
			amountCcy: tx.amountCcy,
			name: tx.name,
			text: tx.text
		});
		if (!ccy && isFxTrade) ccy = fallback;
		if (!ccy || ccy === "NOK") continue;
		const pair = `${ccy}NOK`;
		const date = tx.tradeDate || tx.bookingDate;
		const key = `${pair}|${date}`;
		if (seen.has(key)) continue;
		seen.add(key);
		out.push({
			pair,
			date,
			rate,
			source: "nordnet",
			stale: true
		});
	}
	out.sort((a, b) => a.date.localeCompare(b.date) || a.pair.localeCompare(b.pair));
	return out;
}
function rebuildLedgerFx(ledger) {
	return {
		...ledger,
		fx: mergeFxFromTransactions(ledger.fx, ledger.transactions)
	};
}
function sanitizeLedger(ledger, rebuildFx = true) {
	const next = {
		...ledger,
		securities: sanitizeSecurities(ledger.securities)
	};
	return rebuildFx ? rebuildLedgerFx(next) : next;
}
function lookupPrice(prices, isin, asOf) {
	let best = null;
	for (const p of prices) {
		if (p.isin !== isin) continue;
		if (p.date > asOf) continue;
		if (!best || p.date > best.date) best = {
			close: p.close,
			date: p.date,
			source: p.source ?? "import"
		};
	}
	return best;
}
function lookupFx(fx, pair, asOf) {
	if (pair === "NOKNOK" || pair.startsWith("NOK")) return {
		rate: 1,
		date: asOf,
		stale: false
	};
	let best = null;
	for (const p of fx) {
		if (p.pair !== pair) continue;
		if (p.date > asOf) continue;
		if (!best || p.date > best.date) best = {
			rate: p.rate,
			date: p.date,
			stale: p.stale
		};
	}
	return best;
}
function fingerprintOf(row) {
	if (row.id) return `id:${row.portfolio}|${row.id}`;
	return `fp:${row.bookingDate}|${row.rawType}|${row.isin}|${round4(row.qty)}|${round2(row.amount)}|${row.text}|${row.verification}`;
}
function impliedFx(row) {
	const fx = fxRateFromTrade({
		fxRate: row.fxRate,
		valutakurs: row.valutakurs,
		price: row.price,
		qty: row.qty,
		amount: row.amount,
		isFxTrade: classifyType(row.rawType, {}) === "currency_exchange"
	});
	if (fx > 0) return fx;
	return 1;
}
function toTx(row, kind, sourceFile, cancelled) {
	const fees = row.totalFees !== 0 ? Math.abs(row.totalFees) : Math.abs(row.brokerage);
	const fx = impliedFx(row);
	const priceCcy = inferTradeCurrency(row) || row.purchaseCcy || "NOK";
	return {
		id: `nn-${row.portfolio || "acc"}-${row.id || fingerprintOf(row)}`,
		nordnetId: row.id,
		fingerprint: fingerprintOf(row),
		bookingDate: row.bookingDate,
		tradeDate: row.tradeDate || row.bookingDate,
		settleDate: row.settleDate || row.tradeDate || row.bookingDate,
		portfolio: row.portfolio,
		kind,
		rawType: row.rawType,
		name: row.name,
		isin: row.isin,
		qty: round4(row.qty),
		price: row.price,
		priceCcy,
		interest: row.interest,
		fees,
		feeCcy: row.feeCcy || row.brokerageCcy || row.amountCcy || "NOK",
		amount: row.amount,
		amountCcy: row.amountCcy || "NOK",
		purchaseValue: row.purchaseValue,
		purchaseCcy: row.purchaseCcy || "",
		result: row.result,
		resultCcy: row.resultCcy || "",
		fileQty: row.totalQty,
		fileSaldo: row.saldo,
		fxRate: fx,
		text: row.text,
		cancelDate: row.cancelDate,
		cancelled,
		noteNumber: row.noteNumber,
		verification: row.verification,
		brokerage: Math.abs(row.brokerage),
		valutakurs: row.valutakurs,
		sourceFile,
		rowNumber: row.rowNumber
	};
}
function emptyLedger() {
	return {
		accountCurrency: "NOK",
		transactions: [],
		securities: [],
		prices: [],
		fx: [],
		benchmarks: []
	};
}
function cloneLedger(l) {
	return {
		accountCurrency: "NOK",
		transactions: l.transactions.map((t) => ({ ...t })),
		securities: l.securities.map((s) => ({ ...s })),
		prices: l.prices.map((p) => ({ ...p })),
		fx: l.fx.map((f) => ({ ...f })),
		benchmarks: (l.benchmarks ?? []).map((b) => ({ ...b }))
	};
}
function emptyLedgerBundle() {
	return emptyLedger();
}
function mergeFxFromRows(existing, rows) {
	const kept = existing.filter((f) => f.source === "import" || f.source === "synthetic");
	const seen = new Set(kept.map((f) => `${f.pair}|${f.date}`));
	const fallback = majorityForeignCcy(rows.map((r) => ({
		purchaseCcy: r.purchaseCcy,
		resultCcy: r.resultCcy,
		priceCcy: r.purchaseCcy
	})));
	const out = kept.slice();
	for (const row of rows) {
		if (row.cancelDate) continue;
		const isFxTrade = classifyType(row.rawType, {}) === "currency_exchange";
		const rate = fxRateFromTrade({
			fxRate: row.fxRate,
			valutakurs: row.valutakurs,
			price: row.price,
			qty: row.qty,
			amount: row.amount,
			isFxTrade
		});
		if (!(rate > 0)) continue;
		if (!isFxTrade && Math.abs(rate - 1) < 1e-12) continue;
		let ccy = foreignCcyFromRow(row);
		if (!ccy && isFxTrade) ccy = fallback;
		if (!ccy || ccy === "NOK") continue;
		const pair = `${ccy}NOK`;
		const date = row.tradeDate || row.bookingDate;
		const key = `${pair}|${date}`;
		if (seen.has(key)) continue;
		seen.add(key);
		out.push({
			pair,
			date,
			rate,
			source: "nordnet",
			stale: true
		});
	}
	out.sort((a, b) => a.date.localeCompare(b.date) || a.pair.localeCompare(b.pair));
	return out;
}
function securityFromRow(row, tx) {
	const ccy = inferTradeCurrency(row) || tx.priceCcy || "";
	return {
		isin: tx.isin,
		name: tx.name,
		ticker: inferTicker(tx.name, tx.isin),
		currency: ccy,
		exchange: inferExchange(tx.name, tx.isin),
		assetClass: inferAssetClass(tx.isin, tx.name),
		assetClassConfirmed: false
	};
}
function byIdAsc(a, b) {
	const ai = Number(a.nordnetId);
	const bi = Number(b.nordnetId);
	if (Number.isFinite(ai) && Number.isFinite(bi) && ai !== bi) return ai - bi;
	const c = a.nordnetId.localeCompare(b.nordnetId, void 0, { numeric: true });
	if (c !== 0) return c;
	return a.tradeDate.localeCompare(b.tradeDate);
}
function importNordnetBuffer(buf, fileName, existing, mappings) {
	const { rows, meta } = parseNordnetBytes(buf);
	return importNordnetRows(rows, meta, fileName, existing, mappings);
}
function importNordnetRows(rows, meta, fileName, existing, mappings) {
	const base = existing ? cloneLedger(existing) : emptyLedger();
	const known = new Set(base.transactions.map((t) => t.fingerprint));
	const skipped = [];
	const review = [];
	const cancelled = [];
	let created = 0;
	let dup = 0;
	let cancelN = 0;
	let emptyN = 0;
	const recon = reconcileRows(rows);
	const active = [];
	for (const row of rows) {
		if (!row.id && !row.rawType && !row.isin && row.amount === 0 && row.qty === 0) {
			emptyN += 1;
			skipped.push({
				rowNumber: row.rowNumber,
				reason: "empty",
				detail: "Blank row"
			});
			continue;
		}
		if (row.cancelDate) {
			cancelN += 1;
			cancelled.push({
				rowNumber: row.rowNumber,
				nordnetId: row.id,
				date: row.cancelDate,
				rawType: row.rawType,
				name: row.name
			});
			skipped.push({
				rowNumber: row.rowNumber,
				reason: "cancelled",
				detail: `Makuleringsdato ${row.cancelDate}`
			});
			continue;
		}
		const kind = classifyType(row.rawType, mappings);
		if (!kind) {
			review.push({
				id: `rev-${row.rowNumber}-${row.id}`,
				rowNumber: row.rowNumber,
				rawType: row.rawType,
				name: row.name,
				isin: row.isin,
				date: row.tradeDate || row.bookingDate,
				amount: row.amount,
				sample: row.cells.slice(0, 8)
			});
			skipped.push({
				rowNumber: row.rowNumber,
				reason: "unrecognized",
				detail: `Type “${row.rawType}” is not mapped`
			});
			continue;
		}
		const tx = toTx(row, kind, fileName, false);
		if (tx.isin) base.securities = upsertSecurity(base.securities, securityFromRow(row, tx));
		if (known.has(tx.fingerprint)) {
			dup += 1;
			skipped.push({
				rowNumber: row.rowNumber,
				reason: "duplicate",
				detail: `Id ${tx.nordnetId || tx.fingerprint} already in ledger`
			});
			continue;
		}
		known.add(tx.fingerprint);
		active.push(tx);
		created += 1;
	}
	active.sort(byIdAsc);
	base.transactions = [...base.transactions, ...active].sort(byIdAsc);
	base.fx = mergeFxFromRows(base.fx, rows);
	return {
		ledger: base,
		report: {
			fileName,
			encoding: meta.encoding,
			delimiter: meta.delimiter,
			positional: meta.positional,
			rowsRead: rows.length,
			transactionsCreated: created,
			duplicatesSkipped: dup,
			cancelledExcluded: cancelN,
			emptySkipped: emptyN,
			reviewCount: review.length,
			skipped,
			review,
			recon,
			cancelled
		},
		mappings
	};
}
function applyReviewMapping(ledger, report, rawType, kind, rows, fileName, mappings) {
	const nextMap = {
		...mappings,
		[rawType]: kind,
		[rawType.trim()]: kind
	};
	const pending = rows.filter((r) => r.rawType === rawType && !r.cancelDate);
	const known = new Set(ledger.transactions.map((t) => t.fingerprint));
	let next = cloneLedger(ledger);
	const extra = [];
	for (const row of pending) {
		const tx = toTx(row, kind, fileName, false);
		if (known.has(tx.fingerprint)) continue;
		known.add(tx.fingerprint);
		extra.push(tx);
		if (tx.isin) next.securities = upsertSecurity(next.securities, securityFromRow(row, tx));
	}
	const remaining = report.review.filter((r) => r.rawType !== rawType);
	const skipped = report.skipped.filter((s) => !(s.reason === "unrecognized" && s.detail.includes(`“${rawType}”`)));
	next.transactions = [...next.transactions, ...extra].sort(byIdAsc);
	return {
		ledger: next,
		report: {
			...report,
			transactionsCreated: report.transactionsCreated + extra.length,
			reviewCount: remaining.length,
			skipped,
			review: remaining
		},
		mappings: nextMap
	};
}
var KEY = "nordlys.v1";
function defaultWhatIf(fee = DEFAULT_FEE) {
	return {
		extraSavingsPts: 0,
		retireLaterYears: 0,
		riskOverride: null,
		fee,
		rebalance: "monthly"
	};
}
function defaultPersisted() {
	return {
		mode: "demo",
		privacy: false,
		demoId: "demo-emilie",
		mydata: blankProfile(),
		cma: defaultCma(),
		whatIf: defaultWhatIf(),
		mydataLedger: emptyLedgerBundle(),
		typeMappings: {},
		costMethod: "fifo",
		benchmarkId: "world",
		securityMaster: {}
	};
}
function loadPersisted() {
	const base = defaultPersisted();
	if (typeof window === "undefined") return base;
	try {
		const raw = window.localStorage.getItem(KEY);
		if (!raw) return base;
		const parsed = JSON.parse(raw);
		return {
			mode: parsed.mode === "mydata" ? "mydata" : "demo",
			privacy: Boolean(parsed.privacy),
			demoId: typeof parsed.demoId === "string" ? parsed.demoId : base.demoId,
			mydata: {
				...base.mydata,
				...parsed.mydata ?? {}
			},
			cma: parsed.cma ? {
				...base.cma,
				...parsed.cma
			} : base.cma,
			whatIf: {
				...base.whatIf,
				...parsed.whatIf ?? {}
			},
			mydataLedger: parsed.mydataLedger ? {
				accountCurrency: "NOK",
				transactions: parsed.mydataLedger.transactions ?? [],
				securities: parsed.mydataLedger.securities ?? [],
				prices: parsed.mydataLedger.prices ?? [],
				fx: parsed.mydataLedger.fx ?? [],
				benchmarks: parsed.mydataLedger.benchmarks ?? []
			} : emptyLedgerBundle(),
			typeMappings: parsed.typeMappings ?? {},
			costMethod: parsed.costMethod === "average" ? "average" : "fifo",
			benchmarkId: parsed.benchmarkId ?? "world",
			securityMaster: parsed.securityMaster ?? {}
		};
	} catch {
		return base;
	}
}
function savePersisted(patch) {
	if (typeof window === "undefined") return;
	try {
		const merged = {
			...loadPersisted(),
			...patch
		};
		window.localStorage.setItem(KEY, JSON.stringify(merged));
	} catch {}
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/app-store-BnwWTbnX.js
function demoById(id) {
	return cloneProfile(DEMO_CLIENTS.find((c) => c.id === id) ?? DEMO_CLIENTS[0]);
}
function activeProfile(mode, demoId, mydata) {
	return mode === "demo" ? demoById(demoId) : mydata;
}
var useAppStore = create((set, get) => ({
	hydrated: false,
	mode: "demo",
	privacy: false,
	demoId: "demo-emilie",
	profile: demoById("demo-emilie"),
	mydata: blankProfile(),
	cma: defaultCma(),
	whatIf: defaultWhatIf(),
	simQuality: "full",
	hydrate: () => {
		if (get().hydrated) return;
		const saved = loadPersisted();
		const profile = activeProfile(saved.mode, saved.demoId, saved.mydata);
		set({
			hydrated: true,
			mode: saved.mode,
			privacy: saved.privacy,
			demoId: saved.demoId,
			profile,
			mydata: saved.mydata,
			cma: saved.cma,
			whatIf: {
				...saved.whatIf,
				fee: saved.whatIf.fee ?? profile.fee,
				rebalance: saved.whatIf.rebalance === "none" ? "none" : "monthly"
			},
			simQuality: "full"
		});
	},
	persist: () => {
		const s = get();
		savePersisted({
			mode: s.mode,
			privacy: s.privacy,
			demoId: s.demoId,
			mydata: s.mydata,
			cma: s.cma,
			whatIf: s.whatIf
		});
	},
	setMode: (mode) => {
		if (get().mode === mode) return;
		const s = get();
		const profile = activeProfile(mode, s.demoId, s.mydata);
		set({
			mode,
			profile,
			whatIf: { ...defaultWhatIf(profile.fee) }
		});
		get().persist();
	},
	setPrivacy: (privacy) => {
		set({ privacy });
		get().persist();
	},
	loadDemo: (id) => {
		const profile = demoById(id);
		set({
			mode: "demo",
			demoId: id,
			profile,
			whatIf: defaultWhatIf(profile.fee)
		});
		get().persist();
	},
	copyDemoToMyData: () => {
		const profile = {
			...cloneProfile(get().profile),
			id: "mydata"
		};
		set({
			mode: "mydata",
			mydata: profile,
			profile,
			whatIf: defaultWhatIf(profile.fee)
		});
		get().persist();
	},
	setProfile: (patch) => {
		const s = get();
		const profile = {
			...s.profile,
			...patch
		};
		if (s.mode === "mydata") set({
			profile,
			mydata: profile
		});
		else set({ profile });
		get().persist();
	},
	setMembers: (members) => get().setProfile({ members }),
	setGoals: (goals) => get().setProfile({ goals }),
	setAnswers: (answers) => get().setProfile({ answers }),
	setCma: (cma) => {
		set({ cma });
		get().persist();
	},
	resetCma: () => {
		set({ cma: defaultCma() });
		get().persist();
	},
	setWhatIf: (patch) => set({ whatIf: {
		...get().whatIf,
		...patch
	} }),
	resetWhatIf: () => set({
		whatIf: defaultWhatIf(get().profile.fee),
		simQuality: "full"
	}),
	beginLiveEdit: () => set({ simQuality: "preview" }),
	endLiveEdit: () => set({ simQuality: "full" })
}));
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/utils-Chq9uUxA.js
/**
* xoshiro256** PRNG, seeded via SplitMix64.
* 64-bit state lives in a Uint32Array so the inner loop stays in the integer
* JIT instead of BigInt. Bit-identical to the 64-bit C reference.
* Reference: Vigna & Blackman, https://prng.di.unimi.it/xoshiro256starstar.c
*/
var INV_2_53 = 1 / 9007199254740992;
var TWO_PI = 2 * Math.PI;
function u32(n) {
	return n >>> 0;
}
function add64(a0, a1, b0, b1) {
	const lo = u32(a0 + b0);
	return [lo, u32(a1 + b1 + (lo < a0 ? 1 : 0))];
}
function shr64(a0, a1, k) {
	if (k === 0) return [a0, a1];
	if (k >= 32) return [u32(a1 >>> k - 32), 0];
	return [u32(a0 >>> k | a1 << 32 - k), u32(a1 >>> k)];
}
function xor64(a0, a1, b0, b1) {
	return [a0 ^ b0, a1 ^ b1];
}
/** 32×32 → [lo, hi]. Each partial product stays < 2^32 so bitwise ops are safe. */
function mul32(a, b) {
	a = u32(a);
	b = u32(b);
	const aL = a & 65535;
	const aH = a >>> 16;
	const bL = b & 65535;
	const bH = b >>> 16;
	const p0 = aL * bL;
	const p1 = aH * bL;
	const p2 = aL * bH;
	const p3 = aH * bH;
	const mid = (p0 >>> 16) + (p1 & 65535) + (p2 & 65535);
	return [u32(p0 & 65535 | mid << 16), u32(p3 + (p1 >>> 16) + (p2 >>> 16) + (mid >>> 16))];
}
/** Low 64 bits of a 64×64 product. */
function mul64(a0, a1, b0, b1) {
	const [ll, lh] = mul32(a0, b0);
	const [c0] = mul32(a0, b1);
	const [d0] = mul32(a1, b0);
	return [ll, u32(lh + c0 + d0)];
}
function splitmix64(state0, state1) {
	let [s0, s1] = add64(state0, state1, 2135587861, 2654435769);
	let z0 = s0;
	let z1 = s1;
	[z0, z1] = xor64(z0, z1, ...shr64(z0, z1, 30));
	[z0, z1] = mul64(z0, z1, 484763065, 3210233709);
	[z0, z1] = xor64(z0, z1, ...shr64(z0, z1, 27));
	[z0, z1] = mul64(z0, z1, 321982955, 2496678331);
	[z0, z1] = xor64(z0, z1, ...shr64(z0, z1, 31));
	return {
		s0,
		s1,
		v0: z0,
		v1: z1
	};
}
var Xoshiro256ss = class {
	s = /* @__PURE__ */ new Uint32Array(8);
	spare = null;
	/** High 32 bits of the last `nextLo()` result. */
	hi = 0;
	constructor(seed) {
		let s0;
		let s1;
		if (typeof seed === "bigint") {
			s0 = Number(seed & 4294967295n) >>> 0;
			s1 = Number(seed >> 32n & 4294967295n) >>> 0;
		} else {
			s0 = Math.trunc(seed) >>> 0;
			s1 = 0;
		}
		const a = splitmix64(s0, s1);
		this.s[0] = a.v0;
		this.s[1] = a.v1;
		const b = splitmix64(a.s0, a.s1);
		this.s[2] = b.v0;
		this.s[3] = b.v1;
		const c = splitmix64(b.s0, b.s1);
		this.s[4] = c.v0;
		this.s[5] = c.v1;
		const d = splitmix64(c.s0, c.s1);
		this.s[6] = d.v0;
		this.s[7] = d.v1;
	}
	nextU64() {
		const lo = this.nextLo();
		return BigInt(this.hi) << 32n | BigInt(lo);
	}
	/** Uniform in [0, 1). Uses the top 53 bits. */
	nextFloat() {
		const lo = this.nextLo();
		return (this.hi * 2097152 + (lo >>> 11)) * INV_2_53;
	}
	/**
	* Fill `out` with standard normals via Box–Muller. Even lengths avoid a spare.
	*/
	fillGaussians(out) {
		const n = out.length;
		let i = 0;
		if (this.spare !== null && n > 0) {
			out[0] = this.spare;
			this.spare = null;
			i = 1;
		}
		for (; i + 1 < n; i += 2) {
			let u = this.nextFloat();
			if (u < 1e-16) u = 1e-16;
			const v = this.nextFloat();
			const mag = Math.sqrt(-2 * Math.log(u));
			const tau = TWO_PI * v;
			out[i] = mag * Math.cos(tau);
			out[i + 1] = mag * Math.sin(tau);
		}
		if (i < n) out[i] = this.gaussian();
	}
	gaussian() {
		if (this.spare !== null) {
			const v = this.spare;
			this.spare = null;
			return v;
		}
		let u = this.nextFloat();
		if (u < 1e-16) u = 1e-16;
		const v = this.nextFloat();
		const mag = Math.sqrt(-2 * Math.log(u));
		const tau = TWO_PI * v;
		this.spare = mag * Math.sin(tau);
		return mag * Math.cos(tau);
	}
	/**
	* One xoshiro256** step. Returns the low 32 bits; high 32 bits in `this.hi`.
	* Fully inlined — no tuple allocations on the hot path.
	*/
	nextLo() {
		const s = this.s;
		const s0 = s[0];
		const s1 = s[1];
		const s2 = s[2];
		const s3 = s[3];
		const s4 = s[4];
		const s5 = s[5];
		const s6 = s[6];
		const s7 = s[7];
		let t0 = s2 << 2 >>> 0;
		let t1 = (s3 << 2 | s2 >>> 30) >>> 0;
		let m0 = t0 + s2 >>> 0;
		let m1 = t1 + s3 + (m0 < t0 ? 1 : 0) >>> 0;
		t0 = (m0 << 7 | m1 >>> 25) >>> 0;
		t1 = (m1 << 7 | m0 >>> 25) >>> 0;
		m0 = t0 << 3 >>> 0;
		m1 = (t1 << 3 | t0 >>> 29) >>> 0;
		const r0 = m0 + t0 >>> 0;
		this.hi = m1 + t1 + (r0 < m0 ? 1 : 0) >>> 0;
		t0 = s2 << 17 >>> 0;
		t1 = (s3 << 17 | s2 >>> 15) >>> 0;
		const n4 = s4 ^ s0;
		const n5 = s5 ^ s1;
		const n6 = s6 ^ s2;
		const n7 = s7 ^ s3;
		s[2] = s2 ^ n4;
		s[3] = s3 ^ n5;
		s[0] = s0 ^ n6;
		s[1] = s1 ^ n7;
		s[4] = n4 ^ t0;
		s[5] = n5 ^ t1;
		s[6] = (n6 >>> 19 | n7 << 13) >>> 0;
		s[7] = (n6 << 13 | n7 >>> 19) >>> 0;
		return r0;
	}
};
function createRng(seed) {
	return new Xoshiro256ss(seed);
}
/** Closed-form time-value-of-money and sample statistics. */
/** Ordinary annuity: FV = PV(1+r)^n + PMT*((1+r)^n - 1)/r. Per-period r, n, PMT. */
function futureValue(pv, r, n, pmt) {
	if (n === 0) return pv;
	if (Math.abs(r) < 1e-18) return pv + pmt * n;
	const growth = Math.pow(1 + r, n);
	return pv * growth + pmt * ((growth - 1) / r);
}
function mean(xs) {
	const n = xs.length;
	if (n === 0) return NaN;
	let s = 0;
	for (let i = 0; i < n; i++) s += xs[i];
	return s / n;
}
/** Sample standard deviation (Bessel-corrected, n-1). */
function sampleStdev(xs) {
	const n = xs.length;
	if (n < 2) return 0;
	const m = mean(xs);
	let v = 0;
	for (let i = 0; i < n; i++) {
		const d = xs[i] - m;
		v += d * d;
	}
	return Math.sqrt(v / (n - 1));
}
/** Linear-interpolated percentile. `p` in [0, 1]. `sorted` must be ascending. */
function percentileSorted(sorted, p) {
	const n = sorted.length;
	if (n === 0) return NaN;
	if (n === 1) return sorted[0];
	const idx = Math.min(1, Math.max(0, p)) * (n - 1);
	const lo = Math.floor(idx);
	const hi = Math.ceil(idx);
	if (lo === hi) return sorted[lo];
	const t = idx - lo;
	return sorted[lo] * (1 - t) + sorted[hi] * t;
}
function percentile(xs, p) {
	return percentileSorted(xs.slice().sort((a, b) => a - b), p);
}
function relativeError(actual, expected) {
	const denom = Math.max(Math.abs(expected), 1e-18);
	return Math.abs(actual - expected) / denom;
}
function clamp(x, lo, hi) {
	return Math.min(hi, Math.max(lo, x));
}
/** Annual arithmetic stats of a weight vector under CMA (μ, Σ). */
function portfolioMoments(weights, mu, vol, corr) {
	const n = weights.length;
	let m = 0;
	for (let i = 0; i < n; i++) m += weights[i] * mu[i];
	let v = 0;
	for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) v += weights[i] * weights[j] * vol[i] * vol[j] * corr[i][j];
	return {
		mu: m,
		vol: Math.sqrt(Math.max(v, 0))
	};
}
var LOCALES = {
	NOK: "nb-NO",
	USD: "en-US",
	EUR: "de-DE"
};
function formatMoney(value, currency, privacy, opts) {
	if (privacy) return "••••";
	const digits = opts?.digits ?? 0;
	try {
		return new Intl.NumberFormat(LOCALES[currency], {
			style: "currency",
			currency,
			maximumFractionDigits: digits,
			minimumFractionDigits: digits
		}).format(value);
	} catch {
		return `${value.toFixed(digits)} ${currency}`;
	}
}
function formatNumber(value, privacy, digits = 0) {
	if (privacy) return "••••";
	return new Intl.NumberFormat("en-US", {
		maximumFractionDigits: digits,
		minimumFractionDigits: digits
	}).format(value);
}
function formatPct(value, digits = 1, signed = false) {
	const pct = value * 100;
	const body = pct.toFixed(digits);
	if (signed && pct > 0) return `+${body}%`;
	return `${body}%`;
}
function formatBp(fee) {
	return `${Math.round(fee * 1e4)} bp`;
}
function indexValue(value, base) {
	if (base === 0) return 100;
	return value / base * 100;
}
function formatIndex(value, base, digits = 1) {
	return indexValue(value, base).toFixed(digits);
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/holdings--6iADFv6.js
var CASH_KINDS = /* @__PURE__ */ new Set([
	"deposit",
	"withdrawal",
	"dividend",
	"withholding_tax",
	"fee",
	"interest",
	"currency_exchange",
	"buy",
	"sell"
]);
function securityOf(isin, list, tx) {
	const found = list.find((s) => s.isin === isin);
	if (found) return found;
	return {
		isin,
		ticker: "",
		name: tx?.name || isin,
		currency: tx?.purchaseCcy || tx?.priceCcy || "NOK",
		exchange: "",
		assetClass: "global_eq"
	};
}
function tradeFx(tx) {
	if (tx.fxRate && tx.fxRate > 0) return tx.fxRate;
	if (tx.valutakurs && tx.valutakurs > 0) return tx.valutakurs;
	return 1;
}
function consumeFifo(lots, qty, sellPrice, sellFx, sellFees) {
	let remain = round4(qty);
	let priceEffect = 0;
	let currencyEffect = 0;
	let feeEffect = -sellFees;
	let realizedNok = -sellFees;
	const next = [];
	lots.reduce((s, l) => s + l.qty, 0);
	for (const lot of lots) {
		if (remain <= 0) {
			next.push(lot);
			continue;
		}
		const take = Math.min(lot.qty, remain);
		const lotFeeShare = lot.qty > 0 ? take / lot.qty * lot.feesNok : 0;
		const proceeds = take * sellPrice * sellFx;
		const cost = take * lot.unitPrice * lot.fx + lotFeeShare;
		priceEffect += take * (sellPrice - lot.unitPrice) * sellFx;
		currencyEffect += take * lot.unitPrice * (sellFx - lot.fx);
		feeEffect -= lotFeeShare;
		realizedNok += proceeds - cost;
		remain = round4(remain - take);
		const left = round4(lot.qty - take);
		if (left > 5e-5) next.push({
			...lot,
			qty: left,
			feesNok: lot.feesNok - lotFeeShare
		});
	}
	return {
		lots: next,
		realized: {
			qty,
			realizedNok: round2(realizedNok),
			priceEffect: round2(priceEffect),
			currencyEffect: round2(currencyEffect),
			feeEffect: round2(feeEffect)
		}
	};
}
function avgFromLots(lots) {
	let qty = 0;
	let native = 0;
	let nok = 0;
	let fees = 0;
	for (const l of lots) {
		qty += l.qty;
		native += l.qty * l.unitPrice;
		nok += l.qty * l.unitPrice * l.fx;
		fees += l.feesNok;
	}
	if (qty <= 0) return {
		qty: 0,
		unitPrice: 0,
		fx: 1,
		feesNok: 0
	};
	const unitPrice = native / qty;
	const fx = native === 0 ? 1 : nok / native;
	return {
		qty,
		unitPrice,
		fx,
		feesNok: fees
	};
}
function computeHoldings(ledger, method, asOf) {
	const txs = ledger.transactions.filter((t) => !t.cancelled && (t.tradeDate || t.bookingDate) <= asOf).slice().sort((a, b) => {
		const da = (a.tradeDate || a.bookingDate).localeCompare(b.tradeDate || b.bookingDate);
		if (da !== 0) return da;
		const ai = Number(a.nordnetId);
		const bi = Number(b.nordnetId);
		if (Number.isFinite(ai) && Number.isFinite(bi)) return ai - bi;
		return a.nordnetId.localeCompare(b.nordnetId, void 0, { numeric: true });
	});
	let cash = 0;
	const lots = /* @__PURE__ */ new Map();
	const realized = [];
	for (const tx of txs) {
		if (CASH_KINDS.has(tx.kind)) cash = round2(cash + tx.amount);
		if (tx.kind === "buy" && tx.isin) {
			const q = Math.abs(tx.qty);
			const fx = tradeFx(tx);
			const unit = tx.price;
			const list = lots.get(tx.isin) ?? [];
			list.push({
				isin: tx.isin,
				qty: q,
				unitPrice: unit,
				fx,
				date: tx.tradeDate || tx.bookingDate,
				feesNok: tx.fees
			});
			lots.set(tx.isin, list);
		} else if (tx.kind === "sell" && tx.isin) {
			const q = Math.abs(tx.qty);
			const fx = tradeFx(tx);
			const existing = lots.get(tx.isin) ?? [];
			const consumed = consumeFifo(method === "average" ? collapseToAverage(existing) : existing, q, tx.price, fx, tx.fees);
			lots.set(tx.isin, consumed.lots);
			realized.push({
				isin: tx.isin,
				name: tx.name,
				qty: q,
				realizedNok: consumed.realized.realizedNok,
				priceEffect: consumed.realized.priceEffect,
				currencyEffect: consumed.realized.currencyEffect,
				feeEffect: consumed.realized.feeEffect
			});
		} else if (tx.kind === "split" && tx.isin) {
			const existing = lots.get(tx.isin) ?? [];
			const before = existing.reduce((s, l) => s + l.qty, 0);
			if (before > 0 && tx.qty !== 0) {
				const ratio = (tx.fileQty != null && tx.fileQty > 0 ? tx.fileQty : round4(before + tx.qty)) / before;
				lots.set(tx.isin, existing.map((l) => ({
					...l,
					qty: round4(l.qty * ratio),
					unitPrice: l.unitPrice / ratio
				})));
			}
		}
	}
	const holdings = [];
	for (const [isin, isinLots] of lots) {
		const agg = avgFromLots(method === "average" ? collapseToAverage(isinLots) : isinLots);
		if (agg.qty <= QTY_EPS) continue;
		const sec = securityOf(isin, ledger.securities);
		const px = lookupPrice(ledger.prices, isin, asOf);
		const tradePx = lastTradePrice(txs, isin);
		const priceStale = !px;
		const price = px?.close ?? tradePx ?? agg.unitPrice;
		const priceSource = px ? px.source : "last_trade";
		const priceDate = px?.date ?? (tradePx != null ? lastTradeDate(txs, isin) ?? asOf : asOf);
		const pair = `${sec.currency}NOK`;
		const fxq = sec.currency === "NOK" ? {
			rate: 1,
			date: asOf,
			stale: false
		} : lookupFx(ledger.fx, pair, asOf);
		const fx = fxq?.rate ?? 1;
		const fxStale = sec.currency !== "NOK" && (fxq?.stale ?? true);
		const marketNative = agg.qty * price;
		const marketNok = marketNative * fx;
		const costNok = agg.qty * agg.unitPrice * agg.fx + agg.feesNok;
		const priceEffect = agg.qty * (price - agg.unitPrice) * fx;
		const currencyEffect = agg.qty * agg.unitPrice * (fx - agg.fx);
		holdings.push({
			isin,
			security: sec,
			qty: round4(agg.qty),
			unitCostNative: agg.unitPrice,
			avgFx: agg.fx,
			costNok,
			price,
			priceDate,
			priceStale,
			priceSource,
			fx,
			fxStale,
			marketNative,
			marketNok,
			unrealizedNok: marketNok - costNok,
			priceEffect,
			currencyEffect,
			weight: 0,
			asOf
		});
	}
	holdings.sort((a, b) => b.marketNok - a.marketNok);
	const totalMarket = holdings.reduce((s, h) => s + h.marketNok, 0) + cash;
	for (const h of holdings) h.weight = totalMarket > 0 ? h.marketNok / totalMarket : 0;
	const allocMap = /* @__PURE__ */ new Map();
	for (const id of ASSET_IDS) allocMap.set(id, 0);
	for (const h of holdings) allocMap.set(h.security.assetClass, (allocMap.get(h.security.assetClass) ?? 0) + h.marketNok);
	allocMap.set("cash", (allocMap.get("cash") ?? 0) + cash);
	const allocation = ASSET_IDS.map((assetClass) => {
		const value = allocMap.get(assetClass) ?? 0;
		return {
			assetClass,
			value,
			weight: totalMarket > 0 ? value / totalMarket : 0
		};
	});
	const realizedMerged = mergeRealized(realized);
	return {
		method,
		asOf,
		cash,
		holdings,
		realized: realizedMerged,
		totalMarket,
		totalCost: holdings.reduce((s, h) => s + h.costNok, 0),
		totalUnrealized: holdings.reduce((s, h) => s + h.unrealizedNok, 0),
		totalPriceEffect: holdings.reduce((s, h) => s + h.priceEffect, 0),
		totalCurrencyEffect: holdings.reduce((s, h) => s + h.currencyEffect, 0),
		totalRealized: realizedMerged.reduce((s, r) => s + r.realizedNok, 0),
		allocation
	};
}
var QTY_EPS = 5e-5;
function collapseToAverage(lots) {
	if (lots.length <= 1) return lots.map((l) => ({ ...l }));
	const agg = avgFromLots(lots);
	if (agg.qty <= 0) return [];
	return [{
		isin: lots[0].isin,
		qty: agg.qty,
		unitPrice: agg.unitPrice,
		fx: agg.fx,
		date: lots[0].date,
		feesNok: agg.feesNok
	}];
}
function lastTradePrice(txs, isin) {
	for (let i = txs.length - 1; i >= 0; i--) {
		const t = txs[i];
		if (t.isin === isin && t.price && (t.kind === "buy" || t.kind === "sell")) return t.price;
	}
	return null;
}
function lastTradeDate(txs, isin) {
	for (let i = txs.length - 1; i >= 0; i--) {
		const t = txs[i];
		if (t.isin === isin && t.price && (t.kind === "buy" || t.kind === "sell")) return t.tradeDate || t.bookingDate;
	}
	return null;
}
function mergeRealized(rows) {
	const m = /* @__PURE__ */ new Map();
	for (const r of rows) {
		const prev = m.get(r.isin);
		if (!prev) m.set(r.isin, { ...r });
		else {
			prev.qty += r.qty;
			prev.realizedNok += r.realizedNok;
			prev.priceEffect += r.priceEffect;
			prev.currencyEffect += r.currencyEffect;
			prev.feeEffect += r.feeEffect;
		}
	}
	return [...m.values()];
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/norm-DrsOJM-o.js
/** Standard normal pdf, cdf, and inverse cdf. No external libraries. */
var INV_SQRT_2PI = .3989422804014327;
var SQRT2 = Math.SQRT2;
function normPdf(x) {
	return INV_SQRT_2PI * Math.exp(-.5 * x * x);
}
/**
* Abramowitz & Stegun 7.1.26 erf, composed into Φ. Max |err| ≈ 1.5e-7.
*/
function erf(x) {
	const sign = x < 0 ? -1 : 1;
	const ax = Math.abs(x);
	const a1 = .254829592;
	const a2 = -.284496736;
	const a3 = 1.421413741;
	const a4 = -1.453152027;
	const a5 = 1.061405429;
	const t = 1 / (1 + .3275911 * ax);
	return sign * (1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax));
}
function normCdf(x) {
	if (!Number.isFinite(x)) return x > 0 ? 1 : 0;
	return .5 * (1 + erf(x / SQRT2));
}
/** Peter J. Acklam's rational approximation to Φ^{-1}. */
function normInv(p) {
	if (p <= 0) return p === 0 ? -Infinity : NaN;
	if (p >= 1) return p === 1 ? Infinity : NaN;
	const a = [
		-39.69683028665376,
		220.9460984245205,
		-275.9285104469687,
		138.3577509590705,
		-30.66479806614716,
		2.506628277459239
	];
	const b = [
		-54.47609879822406,
		161.5858368580409,
		-155.6989798598866,
		66.80131188771972,
		-13.28068155288572
	];
	const c = [
		-.007784894002430293,
		-.3223964580411365,
		-2.400758277161838,
		-2.549732539343734,
		4.374664141464968,
		2.938163982698783
	];
	const d = [
		.007784695709041462,
		.3224671290700398,
		2.445134137142996,
		3.754408661907416
	];
	const plow = .02425;
	const phigh = .97575;
	if (p < plow) {
		const q = Math.sqrt(-2 * Math.log(p));
		return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
	}
	if (p > phigh) {
		const q = Math.sqrt(-2 * Math.log(1 - p));
		return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
	}
	const q = p - .5;
	const r = q * q;
	return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/risk-metrics-4Ze0O5z-.js
var EXTERNAL = /* @__PURE__ */ new Set(["deposit", "withdrawal"]);
function xirr(flows, guess = .1) {
	const xs = flows.filter((f) => f.amount !== 0 && f.date).slice().sort((a, b) => a.date.localeCompare(b.date));
	if (xs.length < 2) return NaN;
	const t0 = Date.parse(xs[0].date + "T00:00:00Z");
	const times = xs.map((f) => (Date.parse(f.date + "T00:00:00Z") - t0) / 31536e6);
	const amounts = xs.map((f) => f.amount);
	const npv = (r) => {
		let s = 0;
		for (let i = 0; i < amounts.length; i++) s += amounts[i] / Math.pow(1 + r, times[i]);
		return s;
	};
	const dnpv = (r) => {
		let s = 0;
		for (let i = 0; i < amounts.length; i++) s += -times[i] * amounts[i] / Math.pow(1 + r, times[i] + 1);
		return s;
	};
	let r = guess;
	for (let i = 0; i < 80; i++) {
		const f = npv(r);
		const df = dnpv(r);
		if (!Number.isFinite(f) || !Number.isFinite(df) || Math.abs(df) < 1e-18) break;
		const next = r - f / df;
		if (!Number.isFinite(next) || next <= -.999999) {
			r = (r - .4) * .5;
			continue;
		}
		if (Math.abs(next - r) < 1e-14) return next;
		r = next;
	}
	let lo = -.999999;
	let hi = 20;
	let flo = npv(lo);
	const fhi = npv(hi);
	if (flo * fhi > 0 && Math.abs(npv(r)) < 1e-8) return r;
	for (let i = 0; i < 220; i++) {
		const mid = (lo + hi) / 2;
		const fm = npv(mid);
		if (Math.abs(fm) < 1e-14) return mid;
		if (flo * fm <= 0) hi = mid;
		else {
			lo = mid;
			flo = fm;
		}
	}
	return (lo + hi) / 2;
}
function uniqueDates(txs, extra) {
	const s = new Set(extra);
	for (const t of txs) s.add(t.tradeDate || t.bookingDate);
	return [...s].filter(Boolean).sort();
}
function monthEnds(start, end) {
	const out = [];
	const [ys, ms] = start.split("-").map(Number);
	let y = ys;
	let m = ms;
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
function computeReturns(ledger, method, asOf) {
	const txs = ledger.transactions.filter((t) => !t.cancelled && (t.tradeDate || t.bookingDate) <= asOf);
	if (txs.length === 0) return {
		twr: 0,
		xirr: NaN,
		startDate: asOf,
		endDate: asOf,
		startValue: 0,
		endValue: 0,
		nav: []
	};
	const start = txs[0].tradeDate || txs[0].bookingDate;
	const dates = uniqueDates(txs, [
		start,
		asOf,
		...monthEnds(start, asOf)
	]);
	const byDate = /* @__PURE__ */ new Map();
	for (const t of txs) {
		const d = t.tradeDate || t.bookingDate;
		const list = byDate.get(d) ?? [];
		list.push(t);
		byDate.set(d, list);
	}
	const nav = [];
	for (const d of dates) {
		const snap = computeHoldings(ledger, method, d);
		const ext = (byDate.get(d) ?? []).filter((t) => EXTERNAL.has(t.kind)).reduce((s, t) => s + t.amount, 0);
		nav.push({
			date: d,
			value: snap.totalMarket,
			cash: snap.cash,
			holdings: snap.totalMarket - snap.cash,
			externalCf: ext
		});
	}
	let twr = 1;
	for (let i = 1; i < nav.length; i++) {
		const prev = nav[i - 1].value;
		const cur = nav[i];
		const cf = cur.externalCf;
		const begin = prev;
		if (Math.abs(begin) < 1e-8) continue;
		const r = (cur.value - cf - begin) / begin;
		if (Number.isFinite(r) && r > -.9999 && r < 20) twr *= 1 + r;
	}
	twr -= 1;
	const firstPositive = nav.find((p) => p.value > 0) ?? nav[0];
	const last = nav[nav.length - 1];
	const flows = [];
	flows.push({
		date: firstPositive.date,
		amount: -(firstPositive.value - firstPositive.externalCf)
	});
	for (const p of nav) if (p.date === firstPositive.date) {
		if (p.externalCf) flows.push({
			date: p.date,
			amount: -p.externalCf
		});
	} else if (p.externalCf) flows.push({
		date: p.date,
		amount: -p.externalCf
	});
	flows.push({
		date: last.date,
		amount: last.value
	});
	const cleaned = [];
	const acc = /* @__PURE__ */ new Map();
	for (const f of flows) acc.set(f.date, (acc.get(f.date) ?? 0) + f.amount);
	for (const [date, amount] of [...acc.entries()].sort((a, b) => a[0].localeCompare(b[0]))) if (Math.abs(amount) > 1e-8) cleaned.push({
		date,
		amount
	});
	let irr = NaN;
	try {
		irr = xirr(cleaned, .08);
	} catch {
		irr = NaN;
	}
	return {
		twr,
		xirr: irr,
		startDate: firstPositive.date,
		endDate: last.date,
		startValue: firstPositive.value,
		endValue: last.value,
		nav
	};
}
function annualize(r, start, end) {
	const years = daysBetween(start, end) / 365;
	if (years <= 0 || r <= -1) return r;
	return Math.pow(1 + r, 1 / years) - 1;
}
/** VaR, ES, drawdown, ratios, contributions, stress. */
function simpleReturns(values) {
	const out = [];
	for (let i = 1; i < values.length; i++) {
		const a = values[i - 1];
		const b = values[i];
		if (a > 0 && Number.isFinite(b)) out.push(b / a - 1);
	}
	return out;
}
function skewKurt(xs) {
	const n = xs.length;
	if (n < 4) return {
		skew: 0,
		exKurt: 0
	};
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
	return {
		skew: m3 / (s * s * s),
		exKurt: m4 / (m2 * m2) - 3
	};
}
function historicalVarEs(returns, alpha) {
	const losses = returns.map((r) => -r).sort((a, b) => a - b);
	const v = percentile(losses, alpha);
	const tail = losses.filter((x) => x >= v - 1e-18);
	return {
		var: v,
		es: tail.length ? mean(tail) : v,
		method: "historical",
		alpha
	};
}
function normalVarEs(returns, alpha) {
	const mu = mean(returns);
	const sig = sampleStdev(returns);
	const z = normInv(alpha);
	return {
		var: -mu + sig * z,
		es: -mu + sig * (normPdf(z) / (1 - alpha)),
		method: "normal",
		alpha
	};
}
function cornishFisherVarEs(returns, alpha) {
	const mu = mean(returns);
	const sig = sampleStdev(returns);
	const { skew, exKurt } = skewKurt(returns);
	const quantile = (p) => {
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
		const p = alpha + (1 - alpha) * i / steps;
		acc += -mu + sig * quantile(p);
	}
	return {
		var: v,
		es: acc / steps,
		method: "cornish",
		alpha
	};
}
function mcVarEs(mu, cov, weights, alpha, nPaths, seed) {
	const n = weights.length;
	const L = cholesky(cov);
	const rng = createRng(seed);
	const losses = [];
	const z = new Float64Array(n);
	for (let p = 0; p < nPaths; p++) {
		for (let i = 0; i < n; i++) z[i] = rng.gaussian();
		let r = 0;
		for (let i = 0; i < n; i++) {
			let s = 0;
			const Li = L[i];
			for (let j = 0; j <= i; j++) s += Li[j] * z[j];
			r += weights[i] * (mu[i] + s);
		}
		losses.push(-r);
	}
	losses.sort((a, b) => a - b);
	const v = percentile(losses, alpha);
	const tail = losses.filter((x) => x >= v - 1e-18);
	return {
		var: v,
		es: tail.length ? mean(tail) : v,
		method: "montecarlo",
		alpha
	};
}
function computeVarEs(returns, method, alpha, mc) {
	if (method === "normal") return normalVarEs(returns, alpha);
	if (method === "cornish") return cornishFisherVarEs(returns, alpha);
	if (method === "montecarlo" && mc) return mcVarEs(mc.mu, mc.cov, mc.weights, alpha, mc.nPaths, mc.seed);
	return historicalVarEs(returns, alpha);
}
function drawdownFromNav(nav) {
	const underwater = [];
	let peak = -Infinity;
	let peakDate = nav[0]?.date ?? "";
	let maxDd = 0;
	let maxDdStart = peakDate;
	let maxDdTrough = peakDate;
	let recovered = true;
	let recoveryDays = 0;
	let inDraw = false;
	let ddStart = peakDate;
	const toTime = (d) => Date.parse(d + "T00:00:00Z");
	for (const p of nav) {
		if (p.value > peak) {
			if (inDraw && peak > 0) {
				const days = Math.round((toTime(p.date) - toTime(ddStart)) / 864e5);
				if (recoveryDays == null || days > recoveryDays) recoveryDays = days;
			}
			peak = p.value;
			peakDate = p.date;
			inDraw = false;
		}
		const dd = peak > 0 ? p.value / peak - 1 : 0;
		underwater.push({
			date: p.date,
			dd
		});
		if (dd < maxDd) {
			maxDd = dd;
			maxDdStart = peakDate;
			maxDdTrough = p.date;
			p.date;
			ddStart = peakDate;
			inDraw = true;
			recovered = false;
		} else if (dd < -1e-12) inDraw = true;
		else if (inDraw && Math.abs(dd) < 1e-12) {
			recovered = true;
			inDraw = false;
		}
	}
	if (inDraw) {
		recovered = false;
		recoveryDays = null;
	}
	return {
		underwater,
		maxDd,
		maxDdStart,
		maxDdTrough,
		recoveryDays,
		recovered
	};
}
function ratiosFromReturns(returns, rf, maxDd, periodsPerYear, bench) {
	const muP = mean(returns);
	const volP = sampleStdev(returns);
	const annMu = muP * periodsPerYear;
	const annVol = volP * Math.sqrt(periodsPerYear);
	const excess = returns.map((r) => r - rf / periodsPerYear);
	const sharpe = annVol > 0 ? mean(excess) * periodsPerYear / annVol : 0;
	const down = excess.filter((r) => r < 0);
	let downVar = 0;
	for (const r of down) downVar += r * r;
	const downDev = down.length ? Math.sqrt(downVar / down.length) * Math.sqrt(periodsPerYear) : 0;
	const sortino = downDev > 0 ? mean(excess) * periodsPerYear / downDev : 0;
	const calmar = Math.abs(maxDd) > 1e-12 ? annMu / Math.abs(maxDd) : 0;
	let beta = null;
	let te = null;
	let ir = null;
	if (bench && bench.length === returns.length && bench.length > 2) {
		const mb = mean(bench);
		const mp = muP;
		let cv = 0;
		let vb = 0;
		for (let i = 0; i < returns.length; i++) {
			cv += (returns[i] - mp) * (bench[i] - mb);
			vb += (bench[i] - mb) * (bench[i] - mb);
		}
		bench.length - 1;
		beta = vb > 0 ? cv / vb : null;
		const active = returns.map((r, i) => r - bench[i]);
		te = sampleStdev(active) * Math.sqrt(periodsPerYear);
		ir = te > 0 ? mean(active) * periodsPerYear / te : 0;
	}
	return {
		mean: annMu,
		vol: annVol,
		sharpe,
		sortino,
		calmar,
		beta,
		te,
		ir,
		rf
	};
}
function riskContributions(weights, mu, cov, labels) {
	const sig = Math.sqrt(portfolioVariance(weights, cov));
	const Sw = matVec(cov, weights);
	const out = [];
	for (let i = 0; i < weights.length; i++) {
		const mcr = sig > 0 ? Sw[i] / sig : 0;
		const ctr = weights[i] * mcr;
		out.push({
			label: labels[i] ?? String(i),
			weight: weights[i],
			retContrib: weights[i] * mu[i],
			mcr,
			ctr,
			pctr: sig > 0 ? ctr / sig : 0
		});
	}
	return out;
}
function stressHoldings(holdings, cash, assetShocks, fxShocks) {
	const rows = [];
	let base = cash;
	let shocked = cash;
	for (const h of holdings) {
		const aShock = assetShocks[h.security.assetClass] ?? 0;
		const ccy = h.security.currency;
		const fShock = ccy === "NOK" ? 0 : fxShocks[`${ccy}NOK`] ?? fxShocks[ccy] ?? 0;
		const b = h.marketNok;
		const s = h.qty * h.price * (1 + aShock) * h.fx * (1 + fShock);
		base += b;
		shocked += s;
		rows.push({
			label: h.security.ticker || h.isin,
			base: b,
			shocked: s,
			pnl: s - b
		});
	}
	return {
		baseNok: base,
		shockedNok: shocked,
		pnl: shocked - base,
		pnlPct: base > 0 ? (shocked - base) / base : 0,
		rows
	};
}
function monthEndDates(start, end) {
	const out = [];
	const [ys, ms] = start.split("-").map(Number);
	let y = ys;
	let m = ms;
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
function holdingReturnFrame(ledger, asOf) {
	if (ledger.securities.filter((s) => ledger.prices.some((p) => p.isin === s.isin)).length < 2 || ledger.prices.length < 8) return null;
	const months = monthEndDates([...new Set(ledger.prices.map((p) => p.date))].filter((d) => d <= asOf).sort()[0], asOf);
	if (months.length < 4) return null;
	const live = computeHoldings(ledger, "fifo", asOf).holdings.filter((h) => h.qty > 0);
	if (live.length < 2) return null;
	const R = [];
	const usedDates = [];
	const prev = new Array(live.length).fill(NaN);
	for (const d of months) {
		const row = [];
		let ok = true;
		for (let i = 0; i < live.length; i++) {
			const h = live[i];
			const px = lookupPrice(ledger.prices, h.isin, d);
			if (!px) {
				ok = false;
				break;
			}
			const pair = `${h.security.currency}NOK`;
			const fx = h.security.currency === "NOK" ? 1 : lookupFx(ledger.fx, pair, d)?.rate ?? h.fx;
			const nok = px.close * fx;
			if (Number.isFinite(prev[i]) && prev[i] > 0) row.push(nok / prev[i] - 1);
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
	for (const row of R) for (let i = 0; i < row.length; i++) mu[i] += row[i];
	for (let i = 0; i < mu.length; i++) mu[i] /= R.length;
	return {
		labels: live.map((h) => h.security.ticker || h.isin),
		ids: live.map((h) => h.isin),
		dates: usedDates,
		R,
		mu,
		weights,
		kind: "holdings"
	};
}
function classReturnFrame(ledger, asOf) {
	const stats = computeReturns(ledger, "fifo", asOf);
	if (stats.nav.length < 6) return null;
	stats.nav.filter((_, i) => i === 0 || i === stats.nav.length - 1 || stats.nav[i].date.endsWith("-28") || /-\d{2}-(\d{2})$/.test(stats.nav[i].date));
	const dates = [...new Set(stats.nav.map((n) => n.date))].sort();
	const sample = dates.filter((_, i) => i % Math.max(1, Math.floor(dates.length / 48)) === 0 || i === dates.length - 1);
	const series = ASSET_IDS.map(() => []);
	const used = [];
	const prev = new Array(ASSET_IDS.length).fill(NaN);
	for (const d of sample) {
		const h = computeHoldings(ledger, "fifo", d);
		const row = [];
		for (let i = 0; i < ASSET_IDS.length; i++) {
			const v = h.allocation[i]?.value ?? 0;
			if (Number.isFinite(prev[i]) && prev[i] > 1e-6 && v > 1e-6) row.push(v / prev[i] - 1);
			else row.push(NaN);
			prev[i] = v;
		}
		if (row.every((x) => Number.isFinite(x))) {
			series.forEach((s, i) => s.push(row[i]));
			used.push(d);
		}
	}
	if (used.length < 3) return null;
	const T = used.length;
	const R = [];
	for (let t = 0; t < T; t++) R.push(ASSET_IDS.map((_, i) => series[i][t]));
	const last = computeHoldings(ledger, "fifo", asOf);
	const mu = ASSET_IDS.map((_, i) => mean(series[i]));
	return {
		labels: ASSET_IDS.map((id) => id),
		ids: [...ASSET_IDS],
		dates: used,
		R,
		mu,
		weights: last.allocation.map((a) => a.weight),
		kind: "asset_class"
	};
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/prices-BPuAXbSu.js
var BENCHMARKS = [
	{
		id: "world",
		label: "MSCI World",
		weights: [
			1,
			0,
			0,
			0,
			0,
			0
		]
	},
	{
		id: "spx",
		label: "S&P 500",
		weights: [
			0,
			1,
			0,
			0,
			0,
			0
		]
	},
	{
		id: "osebx",
		label: "OSEBX",
		weights: [
			0,
			0,
			1,
			0,
			0,
			0
		]
	},
	{
		id: "balanced",
		label: "Global 60/40",
		weights: [
			.6,
			0,
			0,
			.4,
			0,
			0
		]
	}
];
/** Demo-only GBM path. Never call this for My Data. */
function benchmarkSeries(id, dates, seed = 20260321) {
	if (dates.length === 0) return [];
	const b = BENCHMARKS.find((x) => x.id === id) ?? BENCHMARKS[0];
	const cma = defaultCma();
	const { mu, vol } = portfolioMoments(b.weights, cma.mu, cma.vol, cma.corr);
	const rng = createRng(seed + id.length * 17);
	const out = [];
	let v = 100;
	let prev = null;
	for (const date of dates) {
		if (prev) {
			const dt = (Date.parse(date) - Date.parse(prev)) / 31536e6;
			const z = rng.gaussian();
			v *= Math.exp((mu - .5 * vol * vol) * dt + vol * Math.sqrt(Math.max(dt, 0)) * z);
		}
		out.push({
			date,
			value: round4(v)
		});
		prev = date;
	}
	return out;
}
function storedBenchmarkSeries(ledger, id) {
	return (ledger.benchmarks ?? []).filter((q) => q.id === id).slice().sort((a, b) => a.date.localeCompare(b.date)).map((q) => ({
		date: q.date,
		value: q.value
	}));
}
/**
* My Data: only stored (imported) quotes — never a generated path.
* Demo: stored quotes if present, otherwise a seeded CMA path used to seed the demo ledger.
*/
function resolveBenchmarkSeries(ledger, id, mode, dates) {
	const stored = storedBenchmarkSeries(ledger, id);
	if (stored.length >= 2) return stored;
	if (mode === "demo") return benchmarkSeries(id, dates);
	return [];
}
function buildSyntheticBenchmarks(dates, seed = 20260321) {
	const out = [];
	for (const b of BENCHMARKS) for (const p of benchmarkSeries(b.id, dates, seed)) out.push({
		id: b.id,
		date: p.date,
		value: p.value,
		source: "synthetic"
	});
	return out;
}
/**
* Demo Nordnet export: exact Norwegian "Transaksjoner og notaer" layout,
* then imported through the same pipeline as a user file.
*/
var DEMO_INSTRUMENTS = [
	{
		isin: "NO0010096985",
		name: "Equinor ASA",
		ticker: "EQNR",
		currency: "NOK",
		exchange: "OSE",
		assetClass: "nordic_eq",
		startPrice: 175,
		mu: .08,
		vol: .28
	},
	{
		isin: "NO0010031479",
		name: "DNB Bank ASA",
		ticker: "DNB",
		currency: "NOK",
		exchange: "OSE",
		assetClass: "nordic_eq",
		startPrice: 165,
		mu: .09,
		vol: .22
	},
	{
		isin: "US0378331005",
		name: "Apple Inc",
		ticker: "AAPL",
		currency: "USD",
		exchange: "NASDAQ",
		assetClass: "us_eq",
		startPrice: 120,
		mu: .12,
		vol: .24
	},
	{
		isin: "IE00B4L5Y983",
		name: "iShares Core MSCI World",
		ticker: "IWDA",
		currency: "USD",
		exchange: "AMS",
		assetClass: "global_eq",
		startPrice: 72,
		mu: .08,
		vol: .15
	},
	{
		isin: "NO0010582984",
		name: "Storebrand Obligasjon",
		ticker: "STB-OBL",
		currency: "NOK",
		exchange: "OSE",
		assetClass: "bonds",
		startPrice: 102,
		mu: .03,
		vol: .04
	}
];
var PORTFOLIO = "Default";
var DEMO_AS_OF = "2026-09-01";
var ACCOUNT_CCY = "NOK";
function inst(isin) {
	return DEMO_INSTRUMENTS.find((s) => s.isin === isin);
}
function settle(date) {
	const [y, m, d] = date.split("-").map(Number);
	return formatIso(new Date(Date.UTC(y, m - 1, d + 2)));
}
function usdNok(date) {
	const t = (Date.parse(date) - Date.parse("2021-01-01")) / 31536e6;
	return round4(8.55 + 2.1 * (1 - Math.exp(-t / 2)) + .15 * Math.sin(t * 4));
}
function eurNok(date) {
	const t = (Date.parse(date) - Date.parse("2021-01-01")) / 31536e6;
	return round4(10.05 + 1.6 * (1 - Math.exp(-t / 2.2)) + .1 * Math.sin(t * 3));
}
function fxFor(ccy, date) {
	if (ccy === "USD") return usdNok(date);
	if (ccy === "EUR") return eurNok(date);
	return 1;
}
function buildDrafts() {
	const drafts = [];
	const eqnr = inst("NO0010096985");
	const dnb = inst("NO0010031479");
	const aapl = inst("US0378331005");
	const iwda = inst("IE00B4L5Y983");
	const bond = inst("NO0010582984");
	drafts.push({
		date: "2021-03-02",
		type: "INNSKUDD",
		amount: 42e4,
		text: "Overføring fra lønnskonto"
	});
	const buy = (date, sec, qty, price, fees) => {
		const fx = sec.currency === "NOK" ? 1 : fxFor(sec.currency, date);
		drafts.push({
			date,
			type: "KJØPT",
			name: sec.name,
			isin: sec.isin,
			qty,
			price,
			priceCcy: sec.currency,
			fx,
			fees,
			text: `Kjøp ${sec.ticker}`
		});
	};
	const sell = (date, sec, qty, price, fees) => {
		const fx = sec.currency === "NOK" ? 1 : fxFor(sec.currency, date);
		drafts.push({
			date,
			type: "SALG",
			name: sec.name,
			isin: sec.isin,
			qty,
			price,
			priceCcy: sec.currency,
			fx,
			fees,
			text: `Salg ${sec.ticker}`
		});
	};
	buy("2021-03-05", eqnr, 400, 175, 39);
	buy("2021-03-08", dnb, 250, 165, 39);
	buy("2021-03-12", aapl, 35, 120, 79);
	buy("2021-03-18", iwda, 120, 72, 79);
	buy("2021-03-22", bond, 400, 102, 39);
	const months = [];
	for (let y = 2021; y <= 2026; y++) for (let m = 1; m <= 12; m++) {
		const date = `${y}-${String(m).padStart(2, "0")}-01`;
		if (date <= "2021-03-02" || date > "2026-08-01") continue;
		months.push(date);
	}
	months.forEach((date, i) => {
		drafts.push({
			date,
			type: "INNSKUDD",
			amount: 12e3,
			text: "Månedlig sparing"
		});
		if (i % 3 === 0) buy(date.slice(0, 8) + "04", iwda, 8, round2(72 * (1 + i * .006)), 19);
		if (i % 5 === 2) buy(date.slice(0, 8) + "06", eqnr, 15, round2(175 * (1 + i * .004)), 19);
		if (i % 7 === 4) buy(date.slice(0, 8) + "08", dnb, 10, round2(165 * (1 + i * .005)), 19);
		if (i % 11 === 6) buy(date.slice(0, 8) + "10", aapl, 2, round2(120 * (1 + i * .007)), 29);
		if (i % 13 === 5) buy(date.slice(0, 8) + "12", bond, 20, round2(102 * (1 + i * .001)), 19);
	});
	for (const y of [
		2021,
		2022,
		2023,
		2024,
		2025
	]) {
		drafts.push({
			date: `${y}-05-12`,
			type: "UTBYTTE",
			name: eqnr.name,
			isin: eqnr.isin,
			qty: 0,
			price: 8.5 + (y - 2021) * .4,
			priceCcy: "NOK",
			fx: 1,
			text: "Utbytte Equinor"
		});
		drafts.push({
			date: `${y}-08-18`,
			type: "UTBYTTE",
			name: aapl.name,
			isin: aapl.isin,
			qty: 0,
			price: .24,
			priceCcy: "USD",
			fx: fxFor("USD", `${y}-08-18`),
			text: "Dividend Apple"
		});
		drafts.push({
			date: `${y}-08-18`,
			type: "KUPONGSKATT",
			name: aapl.name,
			isin: aapl.isin,
			amount: 0,
			text: "Kildeskatt Apple 15 %"
		});
	}
	drafts.push({
		date: "2022-01-05",
		type: "PLATTFORMAVGIFT",
		amount: -99,
		text: "Platformavgift Q4"
	});
	drafts.push({
		date: "2023-01-05",
		type: "PLATTFORMAVGIFT",
		amount: -99,
		text: "Platformavgift Q4"
	});
	drafts.push({
		date: "2024-01-05",
		type: "PLATTFORMAVGIFT",
		amount: -129,
		text: "Platformavgift Q4"
	});
	drafts.push({
		date: "2025-01-06",
		type: "PLATTFORMAVGIFT",
		amount: -129,
		text: "Platformavgift Q4"
	});
	drafts.push({
		date: "2026-01-05",
		type: "PLATTFORMAVGIFT",
		amount: -129,
		text: "Platformavgift Q4"
	});
	sell("2023-06-15", eqnr, 80, 310, 49);
	drafts.push({
		date: "2024-01-12",
		type: "UTTAK INTERNT",
		amount: -35e3,
		text: "Intern overføring BSU"
	});
	drafts.push({
		date: "2024-03-01",
		type: "RENTE",
		amount: 186.45,
		text: "Rente på kontantbeholdning"
	});
	drafts.push({
		date: "2024-09-16",
		type: "KJØPT",
		name: eqnr.name,
		isin: eqnr.isin,
		qty: 25,
		price: 290,
		priceCcy: "NOK",
		fx: 1,
		fees: 39,
		text: "Kjøp Equinor — makulert",
		cancelDate: "2024-09-17"
	});
	for (const [date, usd] of [
		["2022-04-01", 1500],
		["2022-04-01", 500],
		["2023-01-10", 800],
		["2023-06-20", 1200],
		["2023-06-20", 400],
		["2024-02-15", 900],
		["2025-03-03", 600],
		["2025-03-03", 300]
	]) {
		const rate = fxFor("USD", date);
		drafts.push({
			date,
			type: "VALUTAVEKSLING",
			name: "USD",
			qty: usd,
			price: rate,
			priceCcy: "USD",
			fx: rate,
			amount: round2(-usd * rate),
			text: `Valutaveksling USD ${usd}`
		});
	}
	const typeRank = {
		INNSKUDD: 0,
		VALUTAVEKSLING: 1,
		KJØPT: 2,
		SALG: 3,
		UTBYTTE: 4,
		KUPONGSKATT: 5,
		RENTE: 6,
		PLATTFORMAVGIFT: 7,
		"UTTAK INTERNT": 8
	};
	drafts.sort((a, b) => a.date.localeCompare(b.date) || (typeRank[a.type] ?? 8) - (typeRank[b.type] ?? 8));
	return drafts;
}
function materialize(drafts) {
	let saldo = 0;
	const qty = /* @__PURE__ */ new Map();
	const out = [];
	let id = 0;
	let roundingBlip = false;
	for (const d of drafts) {
		id += 1;
		const sec = d.isin ? inst(d.isin) : null;
		const ccy = d.priceCcy || sec?.currency || ACCOUNT_CCY;
		const fx = ccy === "NOK" ? 1 : d.fx ?? 1;
		const fees = d.fees ?? 0;
		let qtyNow = d.qty ?? 0;
		let amount = 0;
		let purchase = 0;
		let result = 0;
		let totalQty = null;
		const held = d.isin ? qty.get(d.isin) ?? 0 : 0;
		if (d.type === "KJØPT") {
			amount = round2(-(round2(Math.abs(qtyNow) * (d.price ?? 0) * fx) + fees));
			purchase = round2(Math.abs(qtyNow) * (d.price ?? 0));
		} else if (d.type === "SALG") {
			amount = round2(round2(Math.abs(qtyNow) * (d.price ?? 0) * fx) - fees);
			purchase = 0;
			result = 0;
		} else if (d.type === "UTBYTTE") {
			const shares = held;
			qtyNow = shares;
			amount = round2(shares * (d.price ?? 0) * fx);
			purchase = 0;
		} else if (d.type === "KUPONGSKATT") {
			amount = d.amount ?? 0;
			if (amount === 0) {
				const prevDiv = [...out].reverse().find((r) => r.type === "UTBYTTE" && r.isin === d.isin);
				amount = prevDiv ? round2(-Math.abs(prevDiv.amount) * .15) : 0;
			}
			qtyNow = 0;
		} else if (d.type === "VALUTAVEKSLING") {
			qtyNow = d.qty ?? 0;
			amount = d.amount ?? round2(-Math.abs(qtyNow) * fx);
			purchase = Math.abs(qtyNow);
		} else if (d.type === "INNSKUDD" || d.type === "UTTAK INTERNT" || d.type === "PLATTFORMAVGIFT" || d.type === "RENTE") {
			amount = d.amount ?? 0;
			qtyNow = 0;
		} else amount = d.amount ?? 0;
		if (!Boolean(d.cancelDate)) {
			saldo = round2(saldo + amount);
			if (d.isin && (d.type === "KJØPT" || d.type === "SALG" || d.type === "SPLITT" || d.type === "SPLIT")) {
				const next = round4(held + (d.type === "SALG" ? -Math.abs(qtyNow) : Math.abs(qtyNow)));
				qty.set(d.isin, next);
				totalQty = next;
				if (!roundingBlip && d.type === "KJØPT") {
					totalQty = round4(next + 1e-4);
					roundingBlip = true;
				}
			} else if (d.isin) totalQty = 0;
		} else if (d.isin) totalQty = round4(held);
		out.push({
			id,
			bookingDate: d.date,
			tradeDate: d.date,
			settleDate: settle(d.date),
			portfolio: PORTFOLIO,
			type: d.type,
			name: d.name ?? "",
			isin: d.isin ?? "",
			qty: qtyNow,
			price: d.price ?? 0,
			interest: d.interest ?? 0,
			fees,
			feeCcy: ACCOUNT_CCY,
			amount,
			amountCcy: ACCOUNT_CCY,
			purchaseValue: purchase,
			purchaseCcy: purchase ? ccy : d.type === "VALUTAVEKSLING" ? ccy : "",
			result,
			resultCcy: result ? ccy : "",
			totalQty,
			saldo,
			fx: ccy === "NOK" ? 0 : fx,
			text: d.text ?? "",
			cancelDate: d.cancelDate ?? "",
			note: d.type === "KJØPT" || d.type === "SALG" ? `S${1e5 + id}` : "",
			verification: `V${8e5 + id}`,
			brokerage: fees,
			brokerageCcy: ACCOUNT_CCY,
			valutakurs: ccy === "NOK" ? 0 : fx
		});
	}
	return out;
}
function cellNum(n, decimals, emptyIfZero = false) {
	if (!Number.isFinite(n)) return "";
	if (emptyIfZero && n === 0) return "";
	return nnNumber(n, decimals);
}
function materializedToCells(row) {
	const cells = new Array(30).fill("");
	cells[0] = String(row.id);
	cells[1] = row.bookingDate;
	cells[2] = row.tradeDate;
	cells[3] = row.settleDate;
	cells[4] = row.portfolio;
	cells[5] = row.type;
	cells[6] = row.name;
	cells[7] = row.isin;
	cells[8] = row.qty ? cellNum(row.qty, 4) : "";
	cells[9] = row.price ? cellNum(row.price, 4) : "";
	cells[10] = row.interest ? cellNum(row.interest, 2) : "";
	cells[11] = row.fees ? cellNum(row.fees, 2) : "";
	cells[12] = row.fees || row.feeCcy ? row.feeCcy : "";
	cells[13] = cellNum(row.amount, 2);
	cells[14] = row.amountCcy;
	cells[15] = row.purchaseValue ? cellNum(row.purchaseValue, 2) : "";
	cells[16] = row.purchaseCcy;
	cells[17] = row.result ? cellNum(row.result, 2) : "";
	cells[18] = row.resultCcy;
	cells[19] = row.totalQty == null ? "" : cellNum(row.totalQty, 4);
	cells[20] = cellNum(row.saldo, 2);
	cells[21] = row.fx ? cellNum(row.fx, 6) : "";
	cells[22] = row.text;
	cells[23] = row.cancelDate;
	cells[24] = row.note;
	cells[25] = row.verification;
	cells[26] = row.brokerage ? cellNum(row.brokerage, 2) : "";
	cells[27] = row.brokerage ? row.brokerageCcy : "";
	cells[28] = row.valutakurs ? cellNum(row.valutakurs, 6) : "";
	cells[29] = "";
	return cells;
}
function serializeNordnet(rowsAsc, delimiter = "	", eol = "\r\n") {
	const newestFirst = rowsAsc.slice().sort((a, b) => b.id - a.id);
	return [NORDNET_HEADERS_NB.join(delimiter), ...newestFirst.map((r) => {
		return materializedToCells(r).map((c) => delimiter === "," ? csvEscape(c, ",") : c).join(delimiter);
	})].join(eol) + eol;
}
function buildSyntheticNordnet() {
	const rowsAsc = materialize(buildDrafts());
	const text = serializeNordnet(rowsAsc, "	", "\r\n");
	const bytes = encodeUtf16Le(text, true);
	const csv = serializeNordnet(rowsAsc, ",", "\n");
	return {
		rowsAsc,
		text,
		bytes,
		utf8Csv: new TextEncoder().encode(csv)
	};
}
function kindOf(type) {
	return classifyType(type, {}) ?? "other_corporate";
}
function expectedTransactions(rowsAsc) {
	const out = [];
	for (const row of rowsAsc) {
		if (row.cancelDate) continue;
		const kind = kindOf(row.type);
		const fx = row.fx || row.valutakurs || 1;
		out.push({
			id: `nn-${PORTFOLIO}-${row.id}`,
			nordnetId: String(row.id),
			fingerprint: `id:${PORTFOLIO}|${row.id}`,
			bookingDate: row.bookingDate,
			tradeDate: row.tradeDate,
			settleDate: row.settleDate,
			portfolio: PORTFOLIO,
			kind,
			rawType: row.type,
			name: row.name,
			isin: row.isin,
			qty: round4(row.qty),
			price: row.price,
			priceCcy: row.purchaseCcy || (Math.abs(fx - 1) < 1e-9 ? ACCOUNT_CCY : row.feeCcy),
			interest: row.interest,
			fees: Math.abs(row.fees),
			feeCcy: row.feeCcy,
			amount: row.amount,
			amountCcy: row.amountCcy,
			purchaseValue: row.purchaseValue,
			purchaseCcy: row.purchaseCcy,
			result: row.result,
			resultCcy: row.resultCcy,
			fileQty: row.totalQty,
			fileSaldo: row.saldo,
			fxRate: fx,
			text: row.text,
			cancelDate: "",
			cancelled: false,
			noteNumber: row.note,
			verification: row.verification,
			brokerage: Math.abs(row.brokerage),
			valutakurs: row.valutakurs,
			sourceFile: "nordnet-demo.txt",
			rowNumber: 0
		});
	}
	return out;
}
function monthDates(start, end) {
	const out = [];
	let [y, m] = start.split("-").map(Number);
	const endKey = end.slice(0, 7);
	while (`${y}-${String(m).padStart(2, "0")}` <= endKey) {
		const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
		out.push(`${y}-${String(m).padStart(2, "0")}-${String(Math.min(last, 28)).padStart(2, "0")}`);
		m += 1;
		if (m === 13) {
			m = 1;
			y += 1;
		}
	}
	return out;
}
function buildDemoQuotes(seed = 11001) {
	const rng = createRng(seed);
	const prices = [];
	const fx = [];
	const dates = monthDates("2021-03-01", DEMO_AS_OF);
	for (const sec of DEMO_INSTRUMENTS) {
		let px = sec.startPrice;
		for (const date of dates) {
			const z = rng.gaussian();
			px = Math.max(.5, px * (1 + sec.mu / 12 + sec.vol / Math.sqrt(12) * z));
			prices.push({
				isin: sec.isin,
				date,
				close: round4(px),
				source: "synthetic"
			});
		}
	}
	for (const date of dates) {
		fx.push({
			pair: "USDNOK",
			date,
			rate: usdNok(date),
			source: "synthetic",
			stale: false
		});
		fx.push({
			pair: "EURNOK",
			date,
			rate: eurNok(date),
			source: "synthetic",
			stale: false
		});
	}
	return {
		prices,
		fx
	};
}
function buildDemoLedger() {
	const { rowsAsc, bytes, text, utf8Csv } = buildSyntheticNordnet();
	const imported = importNordnetBuffer(bytes, "nordnet-demo.txt", emptyLedgerBundle(), {});
	const quotes = buildDemoQuotes();
	const priceDates = [...new Set(quotes.prices.map((p) => p.date))].sort();
	const securities = imported.ledger.securities.map((s) => {
		const demo = DEMO_INSTRUMENTS.find((d) => d.isin === s.isin);
		return demo ? {
			...s,
			ticker: demo.ticker,
			name: demo.name,
			currency: demo.currency,
			exchange: demo.exchange,
			assetClass: demo.assetClass,
			assetClassConfirmed: true,
			userSet: {
				ticker: true,
				name: true,
				currency: true,
				exchange: true,
				assetClass: true
			}
		} : s;
	});
	return {
		ledger: {
			...imported.ledger,
			securities,
			prices: quotes.prices,
			fx: mergeKeepImported(imported.ledger.fx, quotes.fx),
			benchmarks: buildSyntheticBenchmarks(priceDates)
		},
		bytes,
		text,
		utf8Csv
	};
}
function mergeKeepImported(fromTx, synthetic) {
	const m = /* @__PURE__ */ new Map();
	for (const f of fromTx) m.set(`${f.pair}|${f.date}`, f);
	for (const f of synthetic) {
		const k = `${f.pair}|${f.date}`;
		if (!m.has(k)) m.set(k, f);
		else m.set(k, {
			...f,
			stale: false
		});
	}
	return [...m.values()].sort((a, b) => a.date.localeCompare(b.date) || a.pair.localeCompare(b.pair));
}
function downloadableDemoFile() {
	const { bytes } = buildSyntheticNordnet();
	return {
		bytes,
		fileName: "Transaksjoner_og_notaer.xls",
		mime: "text/tab-separated-values"
	};
}
var PRICE_PRESETS = [
	{
		id: "nav",
		label: "Date + NAV",
		hint: "Mutual fund history: Date, NAV — no OHLC required",
		delimiter: ",",
		map: {
			date: 0,
			price: 1
		}
	},
	{
		id: "yahoo",
		label: "ISO + Adj Close",
		hint: "Date, Open, High, Low, Close, Adj Close, Volume",
		delimiter: ",",
		map: {
			date: 0,
			price: 5
		}
	},
	{
		id: "us_dollar",
		label: "US dates with $",
		hint: "MM/DD/YYYY and $1,234.56 closes",
		delimiter: ",",
		map: {
			date: 0,
			price: 1
		}
	},
	{
		id: "european",
		label: "European decimal commas",
		hint: "DD.MM.YYYY; 1.234,56  (semicolon)",
		delimiter: ";",
		map: {
			date: 0,
			price: 1
		}
	}
];
var DATE_CANDIDATES = [
	"date",
	"dato",
	"datum",
	"päivä",
	"paiva",
	"kursdato",
	"tradedate",
	"nav date"
];
var PRICE_CANDIDATES = [
	"adj close",
	"adj. close",
	"adjusted",
	"nav",
	"n.a.v",
	"net asset",
	"andelsverdi",
	"andelverdi",
	"andelskurs",
	"innløsningskurs",
	"innlosningskurs",
	"fondskurs",
	"lukkekurs",
	"close",
	"slutt",
	"kurs",
	"price",
	"last",
	"verdi"
];
function normHeader(h) {
	return h.trim().toLowerCase().replace(/\s+/g, " ");
}
function pickColumn(headers, cands, used) {
	const n = headers.map(normHeader);
	for (const c of cands) {
		const exact = n.findIndex((h, i) => !used.has(i) && h === c);
		if (exact >= 0) {
			used.add(exact);
			return exact;
		}
	}
	for (const c of cands) {
		const i = n.findIndex((h, idx) => !used.has(idx) && h.includes(c));
		if (i >= 0) {
			used.add(i);
			return i;
		}
	}
	return -1;
}
function sniffPriceMap(headers) {
	const used = /* @__PURE__ */ new Set();
	const date = pickColumn(headers, DATE_CANDIDATES, used);
	const price = pickColumn(headers, PRICE_CANDIDATES, used);
	const isin = pickColumn(headers, ["isin"], used);
	const ticker = pickColumn(headers, [
		"ticker",
		"symbol",
		"instrument"
	], used);
	const fallbackPrice = headers.length === 2 ? date === 0 ? 1 : 0 : 1;
	return {
		date: date >= 0 ? date : 0,
		price: price >= 0 ? price : fallbackPrice,
		isin: isin >= 0 ? isin : void 0,
		ticker: ticker >= 0 ? ticker : void 0
	};
}
function looksLikeDataRow(cells) {
	if (cells.length < 2) return false;
	return parseDate(cells[0] ?? "") != null && parseNumber(cells[1] ?? "") != null;
}
function parsePriceCsv(buf, isin, map, delimiterHint) {
	const { text } = decodeText(buf);
	const { lines } = splitLines(text.replace(/^\uFEFF/, ""));
	if (lines.length < 1) return [];
	const delim = delimiterHint || detectDelimiter(lines[0]);
	const first = splitCsvLine(lines[0], delim);
	const headerless = looksLikeDataRow(first);
	const col = map ?? (headerless ? {
		date: 0,
		price: Math.min(1, first.length - 1)
	} : sniffPriceMap(first));
	const from = headerless ? 0 : 1;
	const out = [];
	for (let i = from; i < lines.length; i++) {
		if (!lines[i].trim()) continue;
		const cells = splitCsvLine(lines[i], delim);
		const date = parseDate(cells[col.date] ?? "");
		const price = parseNumber(cells[col.price] ?? "");
		if (!date || price == null) continue;
		const rowIsin = col.isin != null ? (cells[col.isin] ?? "").trim() : "";
		out.push({
			isin: rowIsin || isin,
			date,
			close: price,
			source: "import"
		});
	}
	return out;
}
function parseFxCsv(buf, pair, map, delimiterHint) {
	const { text } = decodeText(buf);
	const { lines } = splitLines(text.replace(/^\uFEFF/, ""));
	if (lines.length < 1) return [];
	const delim = delimiterHint || detectDelimiter(lines[0]);
	const first = splitCsvLine(lines[0], delim);
	const headerless = looksLikeDataRow(first);
	const col = map ?? (headerless ? {
		date: 0,
		price: Math.min(1, first.length - 1)
	} : sniffPriceMap(first));
	const from = headerless ? 0 : 1;
	const out = [];
	for (let i = from; i < lines.length; i++) {
		if (!lines[i].trim()) continue;
		const cells = splitCsvLine(lines[i], delim);
		const date = parseDate(cells[col.date] ?? "");
		const rate = parseNumber(cells[col.price] ?? "");
		if (!date || rate == null) continue;
		const rowPair = col.pair != null ? (cells[col.pair] ?? "").trim() : "";
		out.push({
			pair: (rowPair || pair).replace(/[^A-Z]/gi, "").toUpperCase(),
			date,
			rate,
			source: "import",
			stale: false
		});
	}
	return out;
}
function parseBenchmarkCsv(buf, id, map, delimiterHint) {
	return parsePriceCsv(buf, id, map, delimiterHint).map((q) => ({
		id,
		date: q.date,
		value: q.close,
		source: "import"
	}));
}
function mergePrices(existing, incoming) {
	const m = /* @__PURE__ */ new Map();
	for (const p of existing) m.set(`${p.isin}|${p.date}`, p);
	for (const p of incoming) m.set(`${p.isin}|${p.date}`, p);
	return [...m.values()].sort((a, b) => a.date.localeCompare(b.date) || a.isin.localeCompare(b.isin));
}
function mergeFx(existing, incoming) {
	const m = /* @__PURE__ */ new Map();
	for (const p of existing) m.set(`${p.pair}|${p.date}`, p);
	for (const p of incoming) m.set(`${p.pair}|${p.date}`, {
		...p,
		stale: false
	});
	return [...m.values()].sort((a, b) => a.date.localeCompare(b.date) || a.pair.localeCompare(b.pair));
}
function mergeBenchmarks(existing, incoming) {
	const m = /* @__PURE__ */ new Map();
	for (const p of existing ?? []) m.set(`${p.id}|${p.date}`, p);
	for (const p of incoming) m.set(`${p.id}|${p.date}`, p);
	return [...m.values()].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}
function attachQuotes(ledger, prices, fx, benchmarks = []) {
	return {
		...ledger,
		prices: mergePrices(ledger.prices, prices),
		fx: mergeFx(ledger.fx, fx),
		benchmarks: mergeBenchmarks(ledger.benchmarks ?? [], benchmarks)
	};
}
function isImportedQuoteSource(source) {
	return source === "import" || source === "nordnet";
}
/** True when the ledger has a real imported price/NAV history (never CMA, never synthetic). */
function hasImportedPriceHistory(ledger) {
	const pts = ledger.prices.filter((p) => isImportedQuoteSource(p.source));
	if (pts.length < 8) return false;
	return new Set(pts.map((p) => p.date)).size >= 4;
}
/** Demo may use synthetic history; My Data risk metrics require imported price/NAV series. */
function historicalRiskAvailable(mode, ledger) {
	return mode === "demo" || hasImportedPriceHistory(ledger);
}
function holdingsWithoutImportedHistory(ledger, isins) {
	const have = new Set(ledger.prices.filter((p) => isImportedQuoteSource(p.source)).map((p) => p.isin));
	return isins.filter((h) => !have.has(h.isin));
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/charts-DDSl4Dqs.js
var RISK_QUESTIONS = [
	{
		id: "t1",
		dimension: "tolerance",
		title: "A sharp decline",
		prompt: "If your portfolio fell 20% in a single year, you would…",
		low: "Sell everything",
		high: "Buy more",
		options: [
			"Sell all risk assets",
			"Sell a meaningful portion",
			"Hold and wait it out",
			"Rebalance by buying a little",
			"Add a substantial amount"
		]
	},
	{
		id: "t2",
		dimension: "tolerance",
		title: "Return path",
		prompt: "Which 10-year path would you rather own?",
		low: "Steady and low",
		high: "Higher and uneven",
		options: [
			"About 3% every year, almost no dips",
			"About 5%, with a few mild down years",
			"About 7%, with occasional 15% declines",
			"About 9%, with a chance of a 25% decline",
			"About 11%, with a chance of a 40% decline"
		]
	},
	{
		id: "t3",
		dimension: "tolerance",
		title: "Peak-to-trough",
		prompt: "Largest one-year decline you could accept without changing the plan:",
		low: "Almost none",
		high: "Very large",
		options: [
			"5% or less",
			"About 10%",
			"About 20%",
			"About 30%",
			"40% or more"
		]
	},
	{
		id: "t4",
		dimension: "tolerance",
		title: "Sleep",
		prompt: "How often would you check a volatile portfolio?",
		low: "Constantly, with anxiety",
		high: "Rarely, with ease",
		options: [
			"Daily, and it would bother me",
			"Several times a week",
			"Monthly, as a matter of course",
			"A few times a year",
			"At the annual review only"
		]
	},
	{
		id: "t5",
		dimension: "tolerance",
		title: "Primary objective",
		prompt: "Your primary investment objective is to…",
		low: "Protect capital",
		high: "Maximise growth",
		options: [
			"Preserve capital above all",
			"Income and stability, some growth",
			"Balance growth and capital protection",
			"Grow wealth, accepting drawdowns",
			"Maximise long-term growth"
		]
	},
	{
		id: "t6",
		dimension: "tolerance",
		title: "Experience",
		prompt: "How do you regard your experience with listed investments?",
		low: "None",
		high: "Extensive",
		options: [
			"None — this is new",
			"Limited, mostly cash and deposits",
			"Some funds or equity exposure",
			"Comfortable with a diversified portfolio",
			"Extensive, including stressed markets"
		]
	},
	{
		id: "c1",
		dimension: "capacity",
		title: "Horizon",
		prompt: "When will you need a substantial portion of this portfolio?",
		low: "Very soon",
		high: "Decades away",
		options: [
			"Within 2 years",
			"2–5 years",
			"5–10 years",
			"10–20 years",
			"More than 20 years / not in my lifetime"
		]
	},
	{
		id: "c2",
		dimension: "capacity",
		title: "Income stability",
		prompt: "Over the next five years, household earned income is…",
		low: "Fragile",
		high: "Very secure",
		options: [
			"Uncertain or ending soon",
			"Somewhat unstable",
			"Reasonably stable",
			"Stable with some upside",
			"Very secure (pension, tenure, or similar)"
		]
	},
	{
		id: "c3",
		dimension: "capacity",
		title: "Reserves",
		prompt: "Emergency cash, in months of essential spending:",
		low: "None",
		high: "Two years+",
		options: [
			"Under 1 month",
			"1–3 months",
			"3–6 months",
			"6–12 months",
			"More than 12 months"
		]
	},
	{
		id: "c4",
		dimension: "capacity",
		title: "Concentration",
		prompt: "This portfolio as a share of household net worth:",
		low: "Almost all of it",
		high: "A small slice",
		options: [
			"More than 80%",
			"60–80%",
			"40–60%",
			"20–40%",
			"Under 20%"
		]
	},
	{
		id: "c5",
		dimension: "capacity",
		title: "Spending flexibility",
		prompt: "If markets are weak, could you reduce spending for a few years?",
		low: "No",
		high: "Easily",
		options: [
			"No — spending is rigid",
			"Only with difficulty",
			"Somewhat",
			"Yes, without much strain",
			"Easily — most spending is discretionary"
		]
	},
	{
		id: "c6",
		dimension: "capacity",
		title: "Obligations",
		prompt: "Dependents and inflexible financial obligations:",
		low: "Heavy",
		high: "None",
		options: [
			"Heavy (high debt, several dependents)",
			"Material obligations",
			"Moderate, manageable",
			"Light",
			"None of note"
		]
	}
];
function scoreDimension(answers) {
	if (answers.length === 0) return 3;
	const s = answers.reduce((a, b) => a + b, 0) / answers.length;
	return clamp(Math.round(s), 1, 5);
}
/** Final risk profile is the lower of willingness and ability. */
function finalRiskProfile(tolerance, capacity) {
	return Math.min(tolerance, capacity);
}
function profileFromAnswers(answers) {
	const tAns = answers.slice(0, 6);
	const cAns = answers.slice(6, 12);
	const tMean = tAns.length ? tAns.reduce((a, b) => a + b, 0) / tAns.length : 3;
	const cMean = cAns.length ? cAns.reduce((a, b) => a + b, 0) / cAns.length : 3;
	const tolerance = scoreDimension(tAns);
	const capacity = scoreDimension(cAns);
	return {
		tolerance,
		capacity,
		profile: finalRiskProfile(tolerance, capacity),
		toleranceMean: tMean,
		capacityMean: cMean
	};
}
function riskRationale(tolerance, capacity, profile) {
	const tName = RISK_LABELS[tolerance] ?? String(tolerance);
	const cName = RISK_LABELS[capacity] ?? String(capacity);
	const pName = RISK_LABELS[profile] ?? String(profile);
	if (tolerance === capacity) return `Willingness and ability both score ${tolerance} (${tName}). The recommended book is ${pName}.`;
	if (capacity < tolerance) return `You are willing to sit with ${tName} risk, but your circumstances (horizon, income security, reserves, and obligations) only support ${cName}. The book is set to the lower of the two: ${pName}.`;
	return `Your finances could support ${cName} risk, but your stated comfort is ${tName}. We do not stretch past willingness, so the book is ${pName}.`;
}
function effectiveRiskLevel(profile, whatIf) {
	if (whatIf.riskOverride != null) return clamp(whatIf.riskOverride, 1, 5);
	return profileFromAnswers(profile.answers).profile;
}
function effectivePortfolio(profile, whatIf, cma) {
	return portfolioByRiskLevel(effectiveRiskLevel(profile, whatIf), cma);
}
function horizonMonths(profile) {
	let maxYears = 1;
	for (const m of profile.members) maxYears = Math.max(maxYears, 95 - m.age);
	return Math.max(12, Math.round(maxYears * 12));
}
function buildSimInput(profile, cma, whatIf, nPaths = N_PATHS) {
	const nMonths = horizonMonths(profile);
	const extra = whatIf.extraSavingsPts / 100;
	const later = whatIf.retireLaterYears;
	const contribution = new Float64Array(nMonths);
	const withdrawal = new Float64Array(nMonths);
	const retireMonths = profile.members.map((m) => {
		const retireAge = Math.min(80, m.retirementAge + later);
		return Math.max(0, Math.round((retireAge - m.age) * 12));
	});
	for (let t = 0; t < nMonths; t++) {
		let c = 0;
		for (let i = 0; i < profile.members.length; i++) {
			const member = profile.members[i];
			if (t < retireMonths[i]) {
				const rate = clamp(member.savingsRate + extra, 0, .9);
				c += member.annualIncome * rate / 12;
			}
		}
		contribution[t] = c;
	}
	const lastRetire = retireMonths.length === 0 ? 0 : Math.max(0, ...retireMonths);
	const retGoal = profile.goals.find((g) => g.type === "retirement_income");
	if (retGoal && retGoal.targetAmount > 0) {
		const monthly = retGoal.targetAmount / 12;
		for (let t = lastRetire; t < nMonths; t++) withdrawal[t] = monthly;
	}
	const lumps = [];
	for (const g of profile.goals) {
		if (g.type !== "home" && g.type !== "education") continue;
		const raw = Math.round((g.year - AS_OF_YEAR) * 12);
		const month = Math.min(nMonths - 1, Math.max(0, raw));
		lumps.push({
			month,
			goalId: g.id,
			amount: g.targetAmount,
			priority: g.priority
		});
	}
	const legacyGoals = profile.goals.filter((g) => g.type === "legacy").map((g) => ({
		goalId: g.id,
		amount: g.targetAmount
	}));
	const port = effectivePortfolio(profile, whatIf, cma);
	return {
		seed: profile.seed,
		nPaths,
		nMonths,
		startWealth: profile.currentAssets,
		weights: port.weights.slice(),
		mu: cma.mu.slice(),
		vol: cma.vol.slice(),
		corr: cma.corr.map((row) => row.slice()),
		inflation: cma.inflation,
		fee: whatIf.fee,
		contribution,
		withdrawal,
		lumps,
		retirementGoalId: retGoal?.id ?? null,
		legacyGoals,
		goalIds: profile.goals.map((g) => g.id),
		rebalance: whatIf.rebalance ?? "monthly",
		engine: "assets"
	};
}
var CLASS_CORE = {
	global_eq: {
		name: "iShares Core MSCI World",
		ticker: "IWDA",
		isin: "IE00B4L5Y983"
	},
	us_eq: {
		name: "Apple Inc",
		ticker: "AAPL",
		isin: "US0378331005"
	},
	nordic_eq: {
		name: "Equinor ASA",
		ticker: "EQNR",
		isin: "NO0010096985"
	},
	bonds: {
		name: "Storebrand Obligasjon",
		ticker: "STB-OBL",
		isin: "NO0010582984"
	},
	real_estate: {
		name: "Listed real estate",
		ticker: "RE",
		isin: "RE-PROXY"
	},
	cash: {
		name: "Cash",
		ticker: "CASH",
		isin: "CASH"
	}
};
function analyzeGap(holdings, model, securities) {
	const total = holdings.totalMarket;
	const rows = ASSET_IDS.map((assetClass, i) => {
		const current = holdings.allocation.find((a) => a.assetClass === assetClass)?.value ?? 0;
		const targetWeight = model.weights[i] ?? 0;
		const target = total * targetWeight;
		return {
			assetClass,
			current,
			currentWeight: total > 0 ? current / total : 0,
			targetWeight,
			target,
			gap: target - current
		};
	});
	const trades = [];
	let residualCash = 0;
	for (const row of rows) {
		if (row.assetClass === "cash") {
			residualCash += row.gap;
			continue;
		}
		if (Math.abs(row.gap) < 50) continue;
		const inClass = holdings.holdings.filter((h) => h.security.assetClass === row.assetClass);
		if (row.gap < 0) {
			let remain = -row.gap;
			const ordered = inClass.slice().sort((a, b) => b.marketNok - a.marketNok);
			for (const h of ordered) {
				if (remain < 50) break;
				const px = h.price * h.fx;
				if (px <= 0) continue;
				const maxShares = h.qty;
				const want = remain / px;
				const shares = Math.min(maxShares, Math.round(want));
				if (shares <= 0) continue;
				const value = shares * px;
				trades.push({
					isin: h.isin,
					name: h.security.name,
					ticker: h.security.ticker,
					assetClass: row.assetClass,
					side: "sell",
					shares,
					price: h.price,
					valueNok: round2(value)
				});
				remain -= value;
			}
			residualCash += -row.gap - (-row.gap - remain);
		} else {
			const existing = inClass[0];
			const pick = existing ? {
				isin: existing.isin,
				name: existing.security.name,
				ticker: existing.security.ticker,
				price: existing.price,
				fx: existing.fx
			} : coreSecurity(row.assetClass, securities, holdings);
			const pxNative = pick.price;
			const px = pxNative * (pick.fx || 1);
			if (px <= 0) continue;
			const shares = Math.round(row.gap / px);
			if (shares <= 0) {
				residualCash += row.gap;
				continue;
			}
			const value = shares * px;
			trades.push({
				isin: pick.isin,
				name: pick.name,
				ticker: pick.ticker,
				assetClass: row.assetClass,
				side: "buy",
				shares,
				price: pxNative,
				valueNok: round2(value)
			});
			residualCash += row.gap - value;
		}
	}
	return {
		total,
		asOf: holdings.asOf,
		modelName: model.name,
		rows,
		trades,
		residualCash: round2(residualCash)
	};
}
function coreSecurity(assetClass, securities, holdings) {
	const existing = securities.find((s) => s.assetClass === assetClass);
	if (existing) {
		const h = holdings.holdings.find((x) => x.isin === existing.isin);
		return {
			isin: existing.isin,
			name: existing.name,
			ticker: existing.ticker,
			price: h?.price || 100,
			fx: h?.fx || 1
		};
	}
	const c = CLASS_CORE[assetClass];
	const h = holdings.holdings.find((x) => x.isin === c.isin);
	return {
		isin: c.isin,
		name: c.name,
		ticker: c.ticker,
		price: h?.price || 100,
		fx: h?.fx || 1
	};
}
/** Hand-rolled PDF 1.4 writer: objects, streams, xref, trailer. */
var PAGE_W = 595.28;
var PAGE_H = 841.89;
function latin1(s) {
	const u = new Uint8Array(s.length);
	for (let i = 0; i < s.length; i++) {
		const c = s.charCodeAt(i);
		if (c > 255) throw new Error(`PDF buffer requires Latin-1, got U+${c.toString(16)}`);
		u[i] = c;
	}
	return u;
}
var ByteBuf = class {
	parts = [];
	len = 0;
	push(s) {
		const u = latin1(s);
		this.parts.push(u);
		this.len += u.length;
	}
	concat() {
		const out = new Uint8Array(this.len);
		let o = 0;
		for (const p of this.parts) {
			out.set(p, o);
			o += p.length;
		}
		return out;
	}
};
var PdfWriter = class {
	objects = [];
	add(body) {
		this.objects.push(body.trim() + "\n");
		return this.objects.length;
	}
	/** `dict` is the inner dictionary without the closing `>>`. `/Length` is appended. */
	addStream(dictInner, data) {
		const body = `<< ${dictInner.trim()} /Length ${data.length} >>\nstream\n${data}\nendstream\n`;
		this.objects.push(body);
		return this.objects.length;
	}
	assemble(catalogId, infoId) {
		const buf = new ByteBuf();
		buf.push("%PDF-1.4\n%âãÏÓ\n");
		const offsets = [0];
		for (let i = 0; i < this.objects.length; i++) {
			offsets.push(buf.len);
			buf.push(`${i + 1} 0 obj\n`);
			buf.push(this.objects[i]);
			buf.push("endobj\n");
		}
		const xrefAt = buf.len;
		const n = this.objects.length + 1;
		buf.push(`xref\n0 ${n}\n`);
		buf.push("0000000000 65535 f \n");
		for (let i = 1; i < n; i++) buf.push(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
		buf.push(`trailer\n<< /Size ${n} /Root ${catalogId} 0 R /Info ${infoId} 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`);
		return buf.concat();
	}
	get count() {
		return this.objects.length;
	}
};
function pdfDate(d = /* @__PURE__ */ new Date()) {
	return `D:${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}${String(d.getUTCHours()).padStart(2, "0")}${String(d.getUTCMinutes()).padStart(2, "0")}${String(d.getUTCSeconds()).padStart(2, "0")}Z`;
}
/** Unicode → WinAnsi (PDF Helvetica) and AFM glyph widths. */
var TO_WIN = {
	8364: 128,
	8218: 130,
	402: 131,
	8222: 132,
	8230: 133,
	8224: 134,
	8225: 135,
	710: 136,
	8240: 137,
	352: 138,
	8249: 139,
	338: 140,
	381: 142,
	8216: 145,
	8217: 146,
	8220: 147,
	8221: 148,
	8226: 149,
	8211: 150,
	8212: 151,
	732: 152,
	8482: 153,
	353: 154,
	8250: 155,
	339: 156,
	382: 158,
	376: 159
};
/** Replace glyphs that Helvetica/WinAnsi cannot print with ASCII words or signs. */
var REPLACEMENTS = [
	[/\u2265/g, "at least"],
	[/\u2264/g, "at most"],
	[/\u2260/g, "!="],
	[/\u00b1/g, "+/-"],
	[/\u2212/g, "-"],
	[/\u2010/g, "-"],
	[/\u2011/g, "-"],
	[/\u221a/g, "sqrt"],
	[/\u03c3/g, "volatility"],
	[/\u03a3/g, "volatility"],
	[/\u03bc/g, "mu"],
	[/\u039c/g, "mu"],
	[/\u0394/g, "delta"],
	[/\u03b4/g, "delta"],
	[/\u03bb/g, "lambda"],
	[/\u039b/g, "lambda"],
	[/\u2713/g, "ok"],
	[/\u2714/g, "ok"],
	[/\u2074/g, "4"],
	[/\u2075/g, "5"],
	[/\u2076/g, "6"],
	[/\u2077/g, "7"],
	[/\u2078/g, "8"],
	[/\u2079/g, "9"],
	[/\u2070/g, "0"],
	[/\u00b9/g, "1"],
	[/\u2192/g, "->"],
	[/\u2190/g, "<-"],
	[/\u00d7/g, "x"],
	[/\u2026/g, "..."]
];
function sanitizePdfText(text) {
	let s = text;
	for (const [re, rep] of REPLACEMENTS) s = s.replace(re, rep);
	return s;
}
function isWinAnsiMapped(cp) {
	if (cp === 9 || cp === 10 || cp === 13) return true;
	if (cp < 128) return true;
	if (TO_WIN[cp] != null) return true;
	if (cp >= 160 && cp <= 255) return true;
	return false;
}
/** Code points in `text` that are outside WinAnsi (does not apply replacements). */
function unmappedWinAnsiChars(text) {
	const out = [];
	for (const ch of text) {
		const cp = ch.codePointAt(0);
		if (!isWinAnsiMapped(cp)) out.push(`U+${cp.toString(16).toUpperCase().padStart(4, "0")}`);
	}
	return out;
}
function unicodeToWinAnsiByte(cp) {
	if (cp < 128) return cp;
	if (TO_WIN[cp] != null) return TO_WIN[cp];
	if (cp >= 160 && cp <= 255) return cp;
	throw new Error(`Unmapped character U+${cp.toString(16).toUpperCase().padStart(4, "0")} is outside WinAnsi; replace it with a Latin equivalent before drawing.`);
}
function toWinAnsiBytes(text) {
	const s = sanitizePdfText(text);
	const out = [];
	for (const ch of s) {
		const cp = ch.codePointAt(0);
		if (cp === 10 || cp === 13 || cp === 9) {
			out.push(cp);
			continue;
		}
		out.push(unicodeToWinAnsiByte(cp));
	}
	return Uint8Array.from(out);
}
function winAnsiToUnicode(bytes) {
	const FROM = {
		128: "€",
		130: "‚",
		131: "ƒ",
		132: "„",
		133: "…",
		134: "†",
		135: "‡",
		136: "ˆ",
		137: "‰",
		138: "Š",
		139: "‹",
		140: "Œ",
		142: "Ž",
		145: "‘",
		146: "’",
		147: "“",
		148: "”",
		149: "•",
		150: "–",
		151: "—",
		152: "˜",
		153: "™",
		154: "š",
		155: "›",
		156: "œ",
		158: "ž",
		159: "Ÿ"
	};
	let s = "";
	for (let i = 0; i < bytes.length; i++) {
		const b = bytes[i] & 255;
		if (FROM[b]) s += FROM[b];
		else s += String.fromCharCode(b);
	}
	return s;
}
/** Escape a Unicode string as a PDF literal `(...)` in WinAnsi. Throws on unmapped glyphs. */
function pdfString(text) {
	const bytes = toWinAnsiBytes(text);
	let out = "(";
	for (let i = 0; i < bytes.length; i++) {
		const b = bytes[i];
		if (b === 40 || b === 41 || b === 92) out += `\\${String.fromCharCode(b)}`;
		else if (b < 32 || b > 126) out += `\\${b.toString(8).padStart(3, "0")}`;
		else out += String.fromCharCode(b);
	}
	return out + ")";
}
var HELV = [
	278,
	278,
	355,
	556,
	556,
	889,
	667,
	191,
	333,
	333,
	389,
	584,
	278,
	333,
	278,
	278,
	556,
	556,
	556,
	556,
	556,
	556,
	556,
	556,
	556,
	556,
	278,
	278,
	584,
	584,
	584,
	556,
	1015,
	667,
	667,
	722,
	722,
	667,
	611,
	778,
	722,
	278,
	500,
	667,
	556,
	833,
	722,
	778,
	667,
	778,
	722,
	667,
	611,
	722,
	667,
	944,
	667,
	667,
	611,
	278,
	278,
	278,
	469,
	556,
	333,
	556,
	556,
	500,
	556,
	556,
	278,
	556,
	556,
	222,
	222,
	500,
	222,
	833,
	556,
	556,
	556,
	556,
	333,
	500,
	278,
	556,
	500,
	722,
	500,
	500,
	500,
	334,
	260,
	334,
	584
];
var HELV_B = [
	278,
	333,
	474,
	556,
	556,
	889,
	722,
	238,
	333,
	333,
	389,
	584,
	278,
	333,
	278,
	278,
	556,
	556,
	556,
	556,
	556,
	556,
	556,
	556,
	556,
	556,
	333,
	333,
	584,
	584,
	584,
	611,
	975,
	722,
	722,
	722,
	722,
	667,
	611,
	778,
	722,
	278,
	556,
	722,
	611,
	833,
	722,
	778,
	667,
	778,
	722,
	667,
	611,
	722,
	667,
	944,
	667,
	667,
	611,
	333,
	278,
	333,
	584,
	556,
	333,
	556,
	611,
	556,
	611,
	556,
	333,
	611,
	611,
	278,
	278,
	556,
	278,
	889,
	611,
	611,
	611,
	611,
	389,
	556,
	333,
	611,
	556,
	778,
	556,
	556,
	500,
	389,
	280,
	389,
	584
];
var EXTRA = {
	128: [556, 556],
	197: [667, 722],
	198: [889, 1e3],
	216: [778, 778],
	229: [556, 611],
	230: [667, 722],
	248: [611, 611],
	196: [667, 722],
	214: [778, 778],
	228: [556, 611],
	246: [556, 611],
	220: [722, 722],
	252: [556, 611],
	223: [611, 611]
};
function glyphWidth(code, bold) {
	if (code >= 32 && code <= 126) {
		const i = code - 32;
		return (bold ? HELV_B[i] : HELV[i]) ?? 500;
	}
	const extra = EXTRA[code];
	if (extra) return bold ? extra[1] : extra[0];
	return 600;
}
function textWidth(text, font, size, tracking = 0) {
	const bold = font === "b";
	const s = sanitizePdfText(text);
	const bytes = toWinAnsiBytes(s);
	let w = 0;
	for (let i = 0; i < bytes.length; i++) w += glyphWidth(bytes[i], bold);
	const extra = tracking * Math.max(0, [...s].length - 1);
	return w * size / 1e3 + extra;
}
function fitText(text, font, size, maxWidth) {
	const s = sanitizePdfText(text);
	if (textWidth(s, font, size) <= maxWidth) return s;
	if (maxWidth < 8) return "";
	let lo = 0;
	let hi = s.length;
	while (lo < hi) {
		const mid = Math.ceil((lo + hi) / 2);
		if (textWidth(`${s.slice(0, mid)}...`, font, size) <= maxWidth) lo = mid;
		else hi = mid - 1;
	}
	return lo <= 0 ? "..." : `${s.slice(0, lo)}...`;
}
function wrapText(text, font, size, maxWidth) {
	const raw = sanitizePdfText(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
	const lines = [];
	for (const para of raw) {
		if (para === "") {
			lines.push("");
			continue;
		}
		const words = para.split(/\s+/);
		let line = "";
		for (const word of words) {
			const trial = line ? `${line} ${word}` : word;
			if (textWidth(trial, font, size) <= maxWidth) {
				line = trial;
				continue;
			}
			if (line) lines.push(line);
			if (textWidth(word, font, size) <= maxWidth) line = word;
			else {
				let chunk = "";
				for (const ch of word) {
					const t = chunk + ch;
					if (textWidth(t, font, size) <= maxWidth) chunk = t;
					else {
						if (chunk) lines.push(chunk);
						chunk = ch;
					}
				}
				line = chunk;
			}
		}
		if (line) lines.push(line);
	}
	return lines.length ? lines : [""];
}
var CONTENT_W = PAGE_W - 108;
var HEADER_Y = PAGE_H - 28;
var C = {
	navy: [
		.102,
		.153,
		.267
	],
	navyDeep: [
		.063,
		.094,
		.165
	],
	ink: [
		.145,
		.165,
		.184
	],
	muted: [
		.38,
		.42,
		.45
	],
	rule: [
		.78,
		.8,
		.82
	],
	paper: [
		.965,
		.957,
		.945
	],
	bronze: [
		.545,
		.451,
		.333
	],
	sage: [
		.29,
		.42,
		.39
	],
	white: [
		1,
		1,
		1
	],
	band: [
		.93,
		.91,
		.88
	],
	danger: [
		.55,
		.22,
		.22
	],
	ok: [
		.22,
		.42,
		.3
	]
};
var CHART_PALETTE = [
	[
		.102,
		.153,
		.267
	],
	[
		.545,
		.451,
		.333
	],
	[
		.29,
		.42,
		.39
	],
	[
		.45,
		.5,
		.58
	],
	[
		.55,
		.33,
		.28
	],
	[
		.62,
		.62,
		.58
	]
];
function rgb$1(c, op) {
	const a = c[0];
	const b = c[1];
	const d = c[2];
	if (![
		a,
		b,
		d
	].every((x) => Number.isFinite(x))) throw new Error("non-finite colour");
	return `${a.toFixed(3)} ${b.toFixed(3)} ${d.toFixed(3)} ${op}`;
}
function fontName(f) {
	return f === "b" ? "/F2" : f === "i" ? "/F3" : "/F1";
}
function n(x) {
	if (!Number.isFinite(x)) throw new Error(`non-finite PDF number ${x}`);
	return x.toFixed(2);
}
var PdfDoc = class {
	pages = [];
	cmds = [];
	y = PAGE_H - 58;
	kind = "body";
	headerLeft;
	headerRight;
	footerNote;
	title;
	privacy;
	boxes = [];
	pageNo = 0;
	endedWithHeading = false;
	tableHeaderRepeats = 0;
	violations = [];
	layout = {
		pageCount: 0,
		boxes: [],
		violations: [],
		tableHeaderRepeats: 0,
		emptyPages: 0
	};
	constructor(opts) {
		this.title = opts.title;
		this.headerLeft = opts.headerLeft ?? "NORDLYS";
		this.headerRight = opts.headerRight ?? "";
		this.footerNote = opts.footerNote ?? "Hypothetical illustration - not a guarantee of future results";
		this.privacy = opts.privacy;
	}
	get width() {
		return CONTENT_W;
	}
	remaining() {
		return this.y - 48 - 8;
	}
	currentPage() {
		return this.pageNo;
	}
	addBox(b) {
		this.boxes.push({
			...b,
			page: this.currentPage()
		});
	}
	push(...c) {
		for (const s of c) if (/\bNaN\b|\bInfinity\b/.test(s)) throw new Error(`non-finite token in PDF stream: ${s.slice(0, 80)}`);
		this.cmds.push(...c);
	}
	newPage(kind = "body") {
		if (this.endedWithHeading && this.cmds.length) this.violations.push(`page ${this.pageNo} ends with a heading`);
		if (this.cmds.length) this.pages.push({
			kind: this.kind,
			cmds: this.cmds
		});
		else if (this.pages.length) this.violations.push(`empty page before page ${this.pages.length + 1}`);
		this.kind = kind;
		this.cmds = [];
		this.pageNo = this.pages.length + 1;
		this.y = PAGE_H - (kind === "cover" ? 0 : 58);
		this.endedWithHeading = false;
	}
	ensure(h) {
		if (this.pages.length === 0 && this.cmds.length === 0) this.newPage(this.kind);
		if (this.y - h < 58) this.newPage("body");
	}
	rect(x, y, w, h, fill, stroke, lw = .4, role = "body") {
		const c = [];
		if (fill) c.push(rgb$1(fill, "rg"));
		if (stroke) c.push(`${lw} w`, rgb$1(stroke, "RG"));
		c.push(`${n(x)} ${n(y)} ${n(w)} ${n(h)} re`);
		if (fill && stroke) c.push("B");
		else if (fill) c.push("f");
		else c.push("S");
		this.push(c.join(" "));
		this.addBox({
			x,
			y,
			w,
			h,
			kind: "rect",
			role
		});
	}
	line(x1, y1, x2, y2, color = C.rule, lw = .4, role = "body") {
		this.push(`${lw} w ${rgb$1(color, "RG")} ${n(x1)} ${n(y1)} m ${n(x2)} ${n(y2)} l S`);
		const x = Math.min(x1, x2);
		const y = Math.min(y1, y2);
		this.addBox({
			x,
			y,
			w: Math.abs(x2 - x1) || lw,
			h: Math.abs(y2 - y1) || lw,
			kind: "rule",
			role
		});
	}
	raw(ops) {
		if (/\bNaN\b|\bInfinity\b/.test(ops)) throw new Error("chart stream contains NaN/Infinity");
		this.push(ops);
	}
	text(str, x, y, opts) {
		const f = opts.font ?? "r";
		const color = opts.color ?? C.ink;
		const Tc = opts.tracking ?? 0;
		const tw = textWidth(str, f, opts.size, Tc);
		this.push(`BT ${fontName(f)} ${opts.size} Tf ${Tc} Tc ${rgb$1(color, "rg")} 1 0 0 1 ${n(x)} ${n(y)} Tm ${pdfString(str)} Tj ET`);
		this.addBox({
			x,
			y: y - opts.size * .22,
			w: Math.max(tw, .5),
			h: opts.size,
			kind: "text",
			role: opts.role ?? "body",
			text: str
		});
	}
	textRight(str, right, y, opts) {
		const w = textWidth(str, opts.font ?? "r", opts.size);
		this.text(str, right - w, y, opts);
	}
	paragraph(str, opts) {
		const font = opts?.font ?? "r";
		const size = opts?.size ?? 9;
		const leading = opts?.leading ?? size + 3;
		const lines = wrapText(str, font, size, opts?.width ?? CONTENT_W);
		this.ensure(lines.length * leading + 2);
		for (const ln of lines) {
			this.ensure(leading);
			this.text(ln, 54, this.y - size, {
				font,
				size,
				color: opts?.color ?? C.ink,
				role: "body"
			});
			this.y -= leading;
		}
		this.endedWithHeading = false;
		return lines.length;
	}
	spacer(h = 8) {
		this.ensure(h);
		this.y -= h;
	}
	kicker(label) {
		this.ensure(16);
		this.text(label.toUpperCase(), 54, this.y - 8, {
			font: "b",
			size: 7.5,
			color: C.bronze,
			tracking: 1.1,
			role: "body"
		});
		this.y -= 14;
		this.endedWithHeading = false;
	}
	heading(title, keep = 52) {
		this.ensure(28 + keep);
		this.text(title, 54, this.y - 13, {
			font: "b",
			size: 13,
			color: C.navy,
			role: "heading"
		});
		this.y -= 18;
		this.line(54, this.y, 90, this.y, C.bronze, 1.2, "heading");
		this.y -= 10;
		this.endedWithHeading = true;
	}
	addTable(cols, rows, opts) {
		const fs = opts?.fontSize ?? 8;
		const headerH = 16;
		const rowH = 14;
		const scale = CONTENT_W / cols.reduce((s, c) => s + c.width, 0);
		const widths = cols.map((c) => c.width * scale);
		const paintHeader = (repeat) => {
			this.endedWithHeading = false;
			this.ensure(30);
			let x = 54;
			this.rect(54, this.y - headerH, CONTENT_W, headerH, C.navy, void 0, .4, "table");
			for (let i = 0; i < cols.length; i++) {
				const col = cols[i];
				const w = widths[i];
				const label = fitText(col.header, "b", fs, w - 10);
				const pad = 5;
				const tw = textWidth(label, "b", fs);
				let tx = x + pad;
				if (col.align === "right") tx = x + w - pad - tw;
				if (col.align === "center") tx = x + (w - tw) / 2;
				this.text(label, tx, this.y - headerH + 4.5, {
					font: "b",
					size: fs,
					color: C.white,
					role: "table"
				});
				x += w;
			}
			this.y -= headerH;
			if (repeat) this.tableHeaderRepeats += 1;
		};
		paintHeader(false);
		for (let r = 0; r < rows.length; r++) {
			if (this.y - rowH < 60) {
				this.newPage("body");
				paintHeader(true);
			}
			if (r % 2 === 1) this.rect(54, this.y - rowH, CONTENT_W, rowH, C.paper, void 0, .4, "table");
			let x = 54;
			const row = rows[r];
			for (let i = 0; i < cols.length; i++) {
				const col = cols[i];
				const w = widths[i];
				const font = col.font ?? "r";
				const val = fitText(row[i] ?? "", font, fs, w - 10);
				const pad = 5;
				const tw = textWidth(val, font, fs);
				let tx = x + pad;
				if (col.align === "right") tx = x + w - pad - tw;
				if (col.align === "center") tx = x + (w - tw) / 2;
				this.text(val, tx, this.y - rowH + 4, {
					font,
					size: fs,
					color: C.ink,
					role: "table"
				});
				x += w;
			}
			this.line(54, this.y - rowH, PAGE_W - 54, this.y - rowH, C.rule, .25, "table");
			this.y -= rowH;
		}
		this.y -= 6;
		this.endedWithHeading = false;
	}
	metricRow(items) {
		const nItems = items.length;
		const gap = 8;
		const w = (CONTENT_W - gap * (nItems - 1)) / nItems;
		const h = 44;
		this.ensure(52);
		for (let i = 0; i < nItems; i++) {
			const x = 54 + i * (w + gap);
			this.rect(x, this.y - h, w, h, C.paper, C.rule, .3, "body");
			const lab = fitText(items[i].label.toUpperCase(), "b", 6.5, w - 16);
			const val = fitText(items[i].value, "b", 11, w - 16);
			this.text(lab, x + 8, this.y - 14, {
				font: "b",
				size: 6.5,
				color: C.muted,
				tracking: .4,
				role: "body"
			});
			this.text(val, x + 8, this.y - 32, {
				font: "b",
				size: 11,
				color: C.navy,
				role: "body"
			});
		}
		this.y -= 54;
		this.endedWithHeading = false;
	}
	chartBox(h) {
		this.ensure(h + 4);
		const box = {
			x: 54,
			y: this.y - h,
			w: CONTENT_W,
			h
		};
		this.addBox({
			...box,
			kind: "chart",
			role: "chart"
		});
		this.y -= h + 6;
		this.endedWithHeading = false;
		return box;
	}
	coverBand(client, subtitle, dateLabel, confidential) {
		this.newPage("cover");
		this.rect(0, PAGE_H - 168, PAGE_W, 168, C.navyDeep, void 0, .4, "cover");
		this.rect(0, PAGE_H - 171, PAGE_W, 3, C.bronze, void 0, .4, "cover");
		this.text("NORDLYS", 54, PAGE_H - 48, {
			font: "b",
			size: 11,
			color: C.bronze,
			tracking: 2.2,
			role: "cover"
		});
		this.text("PRIVATE WEALTH", 54, PAGE_H - 62, {
			font: "r",
			size: 8,
			color: C.white,
			tracking: 1.4,
			role: "cover"
		});
		this.text(fitText(subtitle, "r", 11, CONTENT_W), 54, PAGE_H - 108, {
			font: "r",
			size: 11,
			color: C.white,
			role: "cover"
		});
		this.text(fitText(client, "b", 22, CONTENT_W), 54, PAGE_H - 138, {
			font: "b",
			size: 22,
			color: C.white,
			role: "cover"
		});
		this.y = PAGE_H - 196;
		this.text(dateLabel, 54, this.y, {
			font: "r",
			size: 9,
			color: C.muted,
			role: "cover"
		});
		this.textRight(confidential, PAGE_W - 54, this.y, {
			font: "b",
			size: 8,
			color: C.bronze,
			role: "cover"
		});
		this.y -= 22;
		this.endedWithHeading = false;
	}
	finish() {
		if (this.endedWithHeading) this.violations.push(`page ${this.pageNo} ends with a heading`);
		if (this.cmds.length) this.pages.push({
			kind: this.kind,
			cmds: this.cmds
		});
		const w = new PdfWriter();
		const fontR = w.add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
		const fontB = w.add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
		const fontI = w.add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>");
		const nPages = this.pages.length;
		const pageIds = [];
		const contentIds = [];
		let emptyPages = 0;
		for (let i = 0; i < nPages; i++) {
			const rec = this.pages[i];
			if (rec.cmds.length === 0) emptyPages += 1;
			const header = [];
			const pageIndex = i + 1;
			if (rec.kind !== "cover") {
				header.push(`0.35 w ${rgb$1(C.rule, "RG")} ${n(54)} ${n(PAGE_H - 32)} m ${n(PAGE_W - 54)} ${n(PAGE_H - 32)} l S`);
				header.push(`BT /F2 8 Tf 0.8 Tc ${rgb$1(C.navy, "rg")} 1 0 0 1 ${n(54)} ${n(HEADER_Y)} Tm ${pdfString(this.headerLeft)} Tj ET`);
				const right = this.headerRight;
				const rw = textWidth(right, "r", 8);
				header.push(`BT /F1 8 Tf 0 Tc ${rgb$1(C.muted, "rg")} 1 0 0 1 ${n(PAGE_W - 54 - rw)} ${n(HEADER_Y)} Tm ${pdfString(right)} Tj ET`);
				this.boxes.push({
					page: pageIndex,
					x: 54,
					y: HEADER_Y - 2,
					w: textWidth(this.headerLeft, "b", 8, .8),
					h: 8,
					kind: "text",
					role: "header",
					text: this.headerLeft
				});
				this.boxes.push({
					page: pageIndex,
					x: PAGE_W - 54 - rw,
					y: HEADER_Y - 2,
					w: rw,
					h: 8,
					kind: "text",
					role: "header",
					text: right
				});
			}
			const pageLabel = `${i + 1}  /  ${nPages}`;
			const lw = textWidth(pageLabel, "r", 8);
			const footer = [
				`0.35 w ${rgb$1(C.rule, "RG")} ${n(54)} 36 m ${n(PAGE_W - 54)} 36 l S`,
				`BT /F1 7.5 Tf ${rgb$1(C.muted, "rg")} 1 0 0 1 ${n(54)} ${n(24)} Tm ${pdfString(this.footerNote)} Tj ET`,
				`BT /F1 8 Tf ${rgb$1(C.navy, "rg")} 1 0 0 1 ${n(PAGE_W - 54 - lw)} ${n(24)} Tm ${pdfString(pageLabel)} Tj ET`
			];
			this.boxes.push({
				page: pageIndex,
				x: 54,
				y: 22,
				w: textWidth(this.footerNote, "r", 7.5),
				h: 8,
				kind: "text",
				role: "footer",
				text: this.footerNote
			});
			this.boxes.push({
				page: pageIndex,
				x: PAGE_W - 54 - lw,
				y: 22,
				w: lw,
				h: 8,
				kind: "text",
				role: "footer",
				text: pageLabel
			});
			const stream = [
				...header,
				...rec.cmds,
				...footer
			].join("\n");
			contentIds.push(w.addStream("", stream));
		}
		const pagesId = 3 + nPages + nPages + 1;
		for (let i = 0; i < nPages; i++) pageIds.push(w.add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 ${fontR} 0 R /F2 ${fontB} 0 R /F3 ${fontI} 0 R >> >> /Contents ${contentIds[i]} 0 R >>`));
		const kids = pageIds.map((id) => `${id} 0 R`).join(" ");
		const actualPagesId = w.add(`<< /Type /Pages /Kids [ ${kids} ] /Count ${nPages} >>`);
		if (actualPagesId !== pagesId) throw new Error(`Pages object id mismatch: expected ${pagesId}, got ${actualPagesId}`);
		const catalogId = w.add(`<< /Type /Catalog /Pages ${actualPagesId} 0 R >>`);
		const infoId = w.add(`<< /Title ${pdfString(this.title)} /Author ${pdfString("NORDLYS")} /Creator ${pdfString("NORDLYS")} /Producer ${pdfString("NORDLYS PDF 1.4")} /CreationDate (${pdfDate()}) >>`);
		this.layout = {
			pageCount: nPages,
			boxes: this.boxes,
			violations: [...this.violations, ...layoutViolations(this.boxes, nPages, emptyPages)],
			tableHeaderRepeats: this.tableHeaderRepeats,
			emptyPages
		};
		return w.assemble(catalogId, infoId);
	}
};
function boxesOverlap(a, b, pad = .55) {
	const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
	const iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
	return ix > pad && iy > pad;
}
function layoutViolations(boxes, pageCount, emptyPages) {
	const out = [];
	if (emptyPages) out.push(`${emptyPages} empty page(s)`);
	for (const b of boxes) {
		if (b.x < -.2 || b.y < -.2 || b.x + b.w > 595.48 || b.y + b.h > 842.09) out.push(`box off page p${b.page} ${b.kind} ${b.text ?? ""}`);
		if (!(b.role === "header" || b.role === "footer" || b.role === "cover")) {
			if (b.x < 53 || b.x + b.w > 542.28) out.push(`box outside side margins p${b.page} ${b.kind} ${b.text ?? ""}`);
			if (b.y < 46) out.push(`box below content margin p${b.page} ${b.kind}`);
			if (b.y + b.h > 797.89 && b.role !== "heading") {}
		}
	}
	const texts = boxes.filter((b) => b.kind === "text");
	const charts = boxes.filter((b) => b.kind === "chart");
	for (let i = 0; i < texts.length; i++) {
		for (let j = i + 1; j < texts.length; j++) {
			const a = texts[i];
			const b = texts[j];
			if (a.page !== b.page) continue;
			if (boxesOverlap(a, b)) out.push(`text overlap p${a.page}: "${(a.text ?? "").slice(0, 24)}" / "${(b.text ?? "").slice(0, 24)}"`);
		}
		for (const c of charts) {
			if (c.page !== texts[i].page) continue;
			if (texts[i].role === "header" || texts[i].role === "footer") continue;
			if (boxesOverlap(texts[i], c, 1.2)) out.push(`text overlaps chart p${c.page}: "${(texts[i].text ?? "").slice(0, 24)}"`);
		}
	}
	return out;
}
function nn(x, fallback = 0) {
	return Number.isFinite(x) ? x : fallback;
}
function rgb(c, op) {
	return `${nn(c[0]).toFixed(3)} ${nn(c[1]).toFixed(3)} ${nn(c[2]).toFixed(3)} ${op}`;
}
function bezierArc(cx, cy, r, a0, a1) {
	const segs = [];
	let start = a0;
	while (start < a1 - 1e-9) {
		const span = Math.min(Math.PI / 2, a1 - start);
		const end = start + span;
		const k = 4 / 3 * Math.tan(span / 4);
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
		segs.push(`${nn(c1x).toFixed(2)} ${nn(c1y).toFixed(2)} ${nn(c2x).toFixed(2)} ${nn(c2y).toFixed(2)} ${nn(p1x).toFixed(2)} ${nn(p1y).toFixed(2)} c`);
		start = end;
	}
	return segs;
}
function pieWithLegend(box, slices) {
	const colored = slices.map((s, i) => ({
		...s,
		color: CHART_PALETTE[i % CHART_PALETTE.length]
	}));
	const r = Math.min(box.h * .42, 58);
	const cx = box.x + r + 8;
	const out = [pieOpsFixed(cx, box.y + box.h / 2, r, colored)];
	const lx = cx + r + 22;
	let ly = box.y + box.h - 18;
	const total = colored.reduce((s, x) => s + Math.max(0, x.value), 0);
	for (const sl of colored) {
		const pct = total > 0 ? sl.value / total : 0;
		out.push(rgb(sl.color, "rg"));
		out.push(`${lx.toFixed(2)} ${(ly - 2).toFixed(2)} 8 8 re f`);
		out.push(`BT /F1 8 Tf ${rgb(C.ink, "rg")} 1 0 0 1 ${(lx + 14).toFixed(2)} ${ly.toFixed(2)} Tm ${pdfString(sl.label)} Tj ET`);
		const cap = sl.caption ?? `${(pct * 100).toFixed(1)}%`;
		const cw = textWidth(cap, "r", 8);
		out.push(`BT /F1 8 Tf ${rgb(C.muted, "rg")} 1 0 0 1 ${(box.x + box.w - cw).toFixed(2)} ${ly.toFixed(2)} Tm ${pdfString(cap)} Tj ET`);
		ly -= 16;
	}
	return out.join("\n");
}
function pieOpsFixed(cx, cy, r, slices) {
	const total = slices.reduce((s, x) => s + Math.max(0, x.value), 0);
	const out = [];
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
function fanOps(box, years, bands, yLabel) {
	const padL = 42;
	const padB = 22;
	const padT = 16;
	const padR = 8;
	const x0 = box.x + padL;
	const y0 = box.y + padB;
	const w = box.w - padL - padR;
	const h = box.h - padB - padT;
	const n = Math.min(years.length, bands.p50.length);
	let lo = Infinity;
	let hi = -Infinity;
	for (let i = 0; i < Math.max(n, 1); i++) {
		lo = Math.min(lo, nn(bands.p5[i], 0), nn(bands.p50[i], 0), nn(bands.p95[i], 0));
		hi = Math.max(hi, nn(bands.p5[i], 0), nn(bands.p50[i], 0), nn(bands.p95[i], 0));
	}
	if (!Number.isFinite(lo) || !Number.isFinite(hi) || !(hi > lo)) {
		if (!Number.isFinite(lo)) lo = 0;
		if (!Number.isFinite(hi) || hi <= lo) hi = lo + 1;
	}
	const pad = Math.max((hi - lo) * .06, 1e-6);
	lo -= pad;
	hi += pad;
	const count = Math.max(n, 2);
	const X = (i) => x0 + i / (count - 1) * w;
	const Y = (v) => y0 + (nn(v, lo) - lo) / (hi - lo) * h;
	const out = [];
	out.push(`0.4 w ${rgb(C.rule, "RG")}`);
	out.push(`${nn(x0).toFixed(2)} ${nn(y0).toFixed(2)} m ${nn(x0 + w).toFixed(2)} ${nn(y0).toFixed(2)} l S`);
	out.push(`${nn(x0).toFixed(2)} ${nn(y0).toFixed(2)} m ${nn(x0).toFixed(2)} ${nn(y0 + h).toFixed(2)} l S`);
	if (n < 2) {
		out.push(`BT /F1 7 Tf ${rgb(C.muted, "rg")} 1 0 0 1 ${nn(x0).toFixed(2)} ${nn(y0 + h / 2).toFixed(2)} Tm ${pdfString("Insufficient path history")} Tj ET`);
		return out.join("\n");
	}
	const band = (top, bot, color, a) => {
		out.push(`${color[0]} ${color[1]} ${color[2]} ${a.toFixed(2)} rg`);
		const mixed = [
			color[0] * a + 1 * (1 - a),
			color[1] * a + 1 * (1 - a),
			color[2] * a + 1 * (1 - a)
		];
		out.pop();
		out.push(rgb(mixed, "rg"));
		out.push(`${X(0).toFixed(2)} ${Y(top[0]).toFixed(2)} m`);
		for (let i = 1; i < n; i++) out.push(`${X(i).toFixed(2)} ${Y(top[i]).toFixed(2)} l`);
		for (let i = n - 1; i >= 0; i--) out.push(`${X(i).toFixed(2)} ${Y(bot[i]).toFixed(2)} l`);
		out.push("f");
	};
	band(bands.p95, bands.p5, C.sage, .18);
	band(bands.p75, bands.p25, C.sage, .32);
	out.push(`1.2 w ${rgb(C.navy, "RG")}`);
	out.push(`${X(0).toFixed(2)} ${Y(bands.p50[0]).toFixed(2)} m`);
	for (let i = 1; i < n; i++) out.push(`${X(i).toFixed(2)} ${Y(bands.p50[i]).toFixed(2)} l`);
	out.push("S");
	const ticks = 4;
	for (let t = 0; t <= ticks; t++) {
		const v = lo + (hi - lo) * t / ticks;
		const yy = Y(v);
		const lab = formatTick(v);
		const tw = textWidth(lab, "r", 7);
		out.push(`BT /F1 7 Tf ${rgb(C.muted, "rg")} 1 0 0 1 ${(x0 - 6 - tw).toFixed(2)} ${(yy - 2).toFixed(2)} Tm ${pdfString(lab)} Tj ET`);
	}
	out.push(`BT /F1 7 Tf ${rgb(C.muted, "rg")} 1 0 0 1 ${x0.toFixed(2)} ${(box.y + 4).toFixed(2)} Tm ${pdfString(String(years[0]))} Tj ET`);
	const last = String(years[n - 1]);
	const lw = textWidth(last, "r", 7);
	out.push(`BT /F1 7 Tf ${rgb(C.muted, "rg")} 1 0 0 1 ${(x0 + w - lw).toFixed(2)} ${(box.y + 4).toFixed(2)} Tm ${pdfString(last)} Tj ET`);
	out.push(`BT /F1 7 Tf ${rgb(C.muted, "rg")} 1 0 0 1 ${box.x.toFixed(2)} ${(y0 + h + 8).toFixed(2)} Tm ${pdfString(yLabel)} Tj ET`);
	return out.join("\n");
}
function formatTick(v) {
	const x = nn(v, 0);
	const a = Math.abs(x);
	if (a >= 1e9) return `${(x / 1e9).toFixed(1)}bn`;
	if (a >= 1e6) return `${(x / 1e6).toFixed(1)}m`;
	if (a >= 1e3) return `${(x / 1e3).toFixed(0)}k`;
	if (a >= 10) return x.toFixed(0);
	return x.toFixed(1);
}
function barPairOps(box, rows, legend) {
	const padL = 92;
	const padR = 12;
	const padT = 16;
	const padB = 8;
	const x0 = box.x + padL;
	const w = box.w - padL - padR;
	const innerH = box.h - padT - padB;
	const max = Math.max(1e-9, ...rows.flatMap((r) => [r.a, r.b]));
	const rowH = innerH / Math.max(rows.length, 1);
	const barH = Math.min(6, rowH * .32);
	const out = [];
	out.push(`BT /F1 7 Tf ${rgb(C.navy, "rg")} 1 0 0 1 ${x0.toFixed(2)} ${(box.y + box.h - 10).toFixed(2)} Tm ${pdfString(legend[0])} Tj ET`);
	const l2 = textWidth(legend[1], "r", 7);
	out.push(`BT /F1 7 Tf ${rgb(C.bronze, "rg")} 1 0 0 1 ${(box.x + box.w - padR - l2).toFixed(2)} ${(box.y + box.h - 10).toFixed(2)} Tm ${pdfString(legend[1])} Tj ET`);
	rows.forEach((r, i) => {
		const yMid = box.y + padB + innerH - (i + .5) * rowH;
		const tw = textWidth(r.label, "r", 7);
		out.push(`BT /F1 7 Tf ${rgb(C.ink, "rg")} 1 0 0 1 ${(x0 - 8 - tw).toFixed(2)} ${(yMid - 2).toFixed(2)} Tm ${pdfString(r.label)} Tj ET`);
		const wa = r.a / max * w;
		const wb = r.b / max * w;
		out.push(rgb(C.navy, "rg"));
		out.push(`${x0.toFixed(2)} ${(yMid + 2).toFixed(2)} ${Math.max(.4, wa).toFixed(2)} ${barH.toFixed(2)} re f`);
		out.push(rgb(C.bronze, "rg"));
		out.push(`${x0.toFixed(2)} ${(yMid - barH - 2).toFixed(2)} ${Math.max(.4, wb).toFixed(2)} ${barH.toFixed(2)} re f`);
	});
	return out.join("\n");
}
function lineOps(box, series, colors, yLabel) {
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
	let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
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
	const X = (x) => x0 + (x - minX) / (maxX - minX || 1) * w;
	const Y = (y) => y0 + (y - minY) / (maxY - minY || 1) * h;
	const out = [];
	out.push(`0.35 w ${rgb(C.rule, "RG")} ${x0.toFixed(2)} ${y0.toFixed(2)} m ${(x0 + w).toFixed(2)} ${y0.toFixed(2)} l S`);
	series.forEach((s, si) => {
		if (s.length < 2) return;
		out.push(`1.1 w ${rgb(colors[si] ?? C.navy, "RG")}`);
		out.push(`${X(s[0].x).toFixed(2)} ${Y(s[0].y).toFixed(2)} m`);
		for (let i = 1; i < s.length; i++) out.push(`${X(s[i].x).toFixed(2)} ${Y(s[i].y).toFixed(2)} l`);
		out.push("S");
	});
	out.push(`BT /F1 7 Tf ${rgb(C.muted, "rg")} 1 0 0 1 ${box.x.toFixed(2)} ${(y0 + h + 6).toFixed(2)} Tm ${pdfString(yLabel)} Tj ET`);
	return out.join("\n");
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-DE00T9yP.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: errorMessage(error)
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
/** Stage flags — later stages flip `enabled` without renaming routes. */
var NAV = [
	{
		id: "planner",
		label: "Planner",
		path: "/",
		enabled: true,
		hint: "Client planning"
	},
	{
		id: "portfolio",
		label: "Portfolio",
		path: "/portfolio",
		enabled: true,
		hint: "Holdings"
	},
	{
		id: "import",
		label: "Import",
		path: "/import",
		enabled: true,
		hint: "Account import"
	},
	{
		id: "risk",
		label: "Risk",
		path: "/risk",
		enabled: true,
		hint: "Risk analytics"
	},
	{
		id: "options",
		label: "Options",
		path: "/options",
		enabled: true,
		hint: "Options overlay"
	},
	{
		id: "backtest",
		label: "Backtest",
		path: "/backtest",
		enabled: true,
		hint: "Historical replay"
	},
	{
		id: "help",
		label: "Help",
		path: "/help",
		enabled: true,
		hint: "How to use NORDLYS"
	},
	{
		id: "diagnostics",
		label: "Diagnostics",
		path: "/diagnostics",
		enabled: true,
		hint: "Built-in tests"
	},
	{
		id: "about",
		label: "About",
		path: "/about",
		enabled: true,
		hint: "Method and privacy"
	}
];
/** Primary tabs on a phone-width bar. Full list lives in the drawer and sidebar. */
var MOBILE_NAV_IDS = [
	"planner",
	"portfolio",
	"import",
	"backtest",
	"help"
];
var demoCache = null;
function demoLedger() {
	if (!demoCache || demoCache.transactions.length === 0) demoCache = buildDemoLedger().ledger;
	return cloneLedger(demoCache);
}
var usePortfolioStore = create((set, get) => ({
	hydrated: false,
	demo: demoLedger(),
	mydata: emptyLedgerBundle(),
	typeMappings: {},
	costMethod: "fifo",
	benchmarkId: "world",
	lastReport: null,
	lastFile: null,
	usedAsClient: null,
	securityMaster: {},
	hydrate: () => {
		const saved = loadPersisted();
		if (get().hydrated && get().demo.transactions.length > 0) return;
		const master = sanitizeSecurityMaster(saved.securityMaster ?? {});
		const raw = saved.mydataLedger ?? emptyLedgerBundle();
		const cleaned = sanitizeLedger({
			...raw,
			securities: overlaySecurityMaster(raw.securities, master)
		});
		set({
			hydrated: true,
			demo: demoLedger(),
			mydata: cleaned,
			typeMappings: saved.typeMappings ?? {},
			costMethod: saved.costMethod ?? "fifo",
			benchmarkId: saved.benchmarkId ?? "world",
			securityMaster: master
		});
		get().persist();
	},
	persist: () => {
		const s = get();
		savePersisted({
			mydataLedger: s.mydata,
			typeMappings: s.typeMappings,
			costMethod: s.costMethod,
			benchmarkId: s.benchmarkId,
			securityMaster: s.securityMaster
		});
	},
	activeLedger: () => {
		return useAppStore.getState().mode === "demo" ? get().demo : get().mydata;
	},
	setActiveLedger: (ledger) => {
		if (useAppStore.getState().mode === "demo") set({ demo: ledger });
		else {
			set({ mydata: ledger });
			get().persist();
		}
	},
	importBytes: (bytes, fileName) => {
		const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
		const s = get();
		const { rows } = parseNordnetBytes(u8);
		const result = importNordnetBuffer(u8, fileName, s.activeLedger(), s.typeMappings);
		result.ledger.securities = overlaySecurityMaster(result.ledger.securities, get().securityMaster);
		const ledger = sanitizeLedger(result.ledger, false);
		get().setActiveLedger(ledger);
		set({
			lastReport: result.report,
			lastFile: {
				bytes: u8,
				fileName,
				rows
			}
		});
		return result.report;
	},
	loadDemoExport: () => {
		const built = buildDemoLedger();
		if (useAppStore.getState().mode === "demo") {
			const ledger = cloneLedger(built.ledger);
			ledger.securities = overlaySecurityMaster(ledger.securities, get().securityMaster);
			demoCache = ledger;
			set({ demo: cloneLedger(ledger) });
		} else {
			const result = importNordnetBuffer(built.bytes, "nordnet-demo.txt", get().mydata, get().typeMappings);
			result.ledger.securities = overlaySecurityMaster(mergeSecs(result.ledger.securities, built.ledger.securities), get().securityMaster);
			set({ mydata: result.ledger });
			get().persist();
		}
		const report = importNordnetBuffer(built.bytes, "nordnet-demo.txt", emptyLedgerBundle(), get().typeMappings).report;
		const { rows } = parseNordnetBytes(built.bytes);
		set({
			lastReport: report,
			lastFile: {
				bytes: built.bytes,
				fileName: "nordnet-demo.txt",
				rows
			}
		});
		return report;
	},
	copyDemoToMyData: () => {
		set({ mydata: cloneLedger(get().demo.transactions.length ? get().demo : demoLedger()) });
		get().persist();
		useAppStore.getState().setMode("mydata");
	},
	applyMapping: (rawType, kind) => {
		const s = get();
		const file = s.lastFile;
		if (!file || !s.lastReport) {
			set({ typeMappings: {
				...s.typeMappings,
				[rawType]: kind
			} });
			get().persist();
			return;
		}
		const applied = applyReviewMapping(s.activeLedger(), s.lastReport, rawType, kind, file.rows, file.fileName, s.typeMappings);
		get().setActiveLedger(applied.ledger);
		set({
			lastReport: applied.report,
			typeMappings: applied.mappings
		});
		get().persist();
	},
	setCostMethod: (costMethod) => {
		set({ costMethod });
		get().persist();
	},
	setBenchmark: (benchmarkId) => {
		set({ benchmarkId });
		get().persist();
	},
	updateSecurity: (isin, patch) => {
		const ledger = cloneLedger(get().activeLedger());
		ledger.securities = ledger.securities.map((sec) => sec.isin === isin ? withUserPatch(sec, patch) : sec);
		const updated = ledger.securities.find((s) => s.isin === isin);
		const master = { ...get().securityMaster };
		if (updated) master[isin] = {
			ticker: updated.ticker,
			name: updated.name,
			currency: updated.currency,
			exchange: updated.exchange,
			assetClass: updated.assetClass,
			assetClassConfirmed: updated.assetClassConfirmed,
			userSet: updated.userSet
		};
		set({ securityMaster: master });
		get().setActiveLedger(ledger);
		get().persist();
	},
	importPrices: (bytes, isin) => {
		const quotes = parsePriceCsv(bytes, isin);
		get().setActiveLedger(attachQuotes(get().activeLedger(), quotes, []));
		return quotes.length;
	},
	importFx: (bytes, pair) => {
		const quotes = parseFxCsv(bytes, pair);
		get().setActiveLedger(attachQuotes(get().activeLedger(), [], quotes));
		return quotes.length;
	},
	importBenchmark: (bytes, id) => {
		const quotes = parseBenchmarkCsv(bytes, id);
		get().setActiveLedger(attachQuotes(get().activeLedger(), [], [], quotes));
		return quotes.length;
	},
	clearMyData: () => {
		set({
			mydata: emptyLedgerBundle(),
			lastReport: null
		});
		get().persist();
	},
	markUsedAsClient: (marketValue) => {
		set({ usedAsClient: {
			at: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
			marketValue
		} });
	}
}));
function mergeSecs(a, b) {
	const m = new Map(a.map((s) => [s.isin, s]));
	for (const s of b) {
		const prev = m.get(s.isin);
		m.set(s.isin, prev ? {
			...s,
			...prev,
			ticker: prev.ticker || s.ticker
		} : s);
	}
	return [...m.values()];
}
/** Trigger a real file download of a generated PDF (not window.print). */
function downloadPdf(bytes, fileName) {
	const copy = new Uint8Array(bytes.byteLength);
	copy.set(bytes);
	const blob = new Blob([copy], { type: "application/pdf" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = fileName;
	a.rel = "noopener";
	document.body.appendChild(a);
	a.click();
	a.remove();
	window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
var MC_KERNEL_WASM_B64 = "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AAAAnwAAAAAkAAAAATwDBNdBAAAJAAAAB+0DAAAAAJ8uAAAAUwAAAAEKAQMAAAAAJg0uZGVidWdfcmFuZ2Vz4UEAAOhBAADXQQAA4EEAAAAAAAAAAAAAAM8CCi5kZWJ1Z19zdHJfUk52TnRDc2tuVWNpa0l5eUJtXzRjb3JlOXBhbmlja2luZzlwYW5pY19mbXQAX1JOdk50Q3NrblVjaWtJeXlCbV80Y29yZTlwYW5pY2tpbmcxOHBhbmljX2JvdW5kc19jaGVjawBwYW5pY2tpbmcAY29yZQAvcnVzdGMvNDhhMjI5Y2VhZWZkNDk4NWM1MDk5MGIxNDExNmI2ZDg1NmFmMDk4NQAvcnVzdGMvNDhhMjI5Y2VhZWZkNDk4NWM1MDk5MGIxNDExNmI2ZDg1NmFmMDk4NS9saWJyYXJ5L2NvcmUvc3JjL2xpYi5ycy9AL2NvcmUuZWQ3MThjM2Q2MGViZDU0Ni1jZ3UuMABjbGFuZyBMTFZNIChydXN0YyB2ZXJzaW9uIDEuOTguMSAoNDhhMjI5Y2VhIDIwMjYtMDktMDEpKQAAdgsuZGVidWdfbGluZWYAAAAEADUAAAABAQH7Dg0AAQEBAQAAAAEAAAFsaWJyYXJ5L2NvcmUvc3JjAABwYW5pY2tpbmcucnMAAQAAAAUOCgAFAuJBAAADzwABBgOwf0oCAgABAQUFCgAFAthBAAADjgIBAggAAQEA4gEEbmFtZQAPDm1jX2tlcm5lbC53YXNtAaIBBwAFYWxsb2MBCWluaXRfaGVhcAIOa2VybmVsX3ZlcnNpb24DCnJlc2V0X2hlYXAECXJ1bl9wYXRocwU3X1JOdk50Q3NrblVjaWtJeXlCbV80Y29yZTlwYW5pY2tpbmcxOHBhbmljX2JvdW5kc19jaGVjawYtX1JOdk50Q3NrblVjaWtJeXlCbV80Y29yZTlwYW5pY2tpbmc5cGFuaWNfZm10BxIBAA9fX3N0YWNrX3BvaW50ZXIJEQIABy5yb2RhdGEBBS5kYXRhAE0JcHJvZHVjZXJzAghsYW5ndWFnZQEEUnVzdAAMcHJvY2Vzc2VkLWJ5AQVydXN0Yx0xLjk4LjEgKDQ4YTIyOWNlYSAyMDI2LTA5LTAxKQCUAQ90YXJnZXRfZmVhdHVyZXMIKwtidWxrLW1lbW9yeSsPYnVsay1tZW1vcnktb3B0KxZjYWxsLWluZGlyZWN0LW92ZXJsb25nKwptdWx0aXZhbHVlKw9tdXRhYmxlLWdsb2JhbHMrE25vbnRyYXBwaW5nLWZwdG9pbnQrD3JlZmVyZW5jZS10eXBlcysIc2lnbi1leHQ=";
function mcKernelBytes() {
	const bin = atob(MC_KERNEL_WASM_B64);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
	return out;
}
function sortCopy(col) {
	const a = col.slice();
	a.sort();
	return a;
}
var wasm = null;
function getWasm() {
	if (wasm) return wasm;
	const raw = mcKernelBytes();
	const buf = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);
	const mod = new WebAssembly.Module(buf);
	const ex = new WebAssembly.Instance(mod, {}).exports;
	if (ex.init_heap() !== 0) throw new Error("NORDLYS kernel memory init failed");
	wasm = ex;
	return ex;
}
function copyF64(src, dst) {
	for (let i = 0; i < src.length; i++) dst[i] = src[i];
}
/**
* Production Monte Carlo. Monthly steps, six-asset correlated returns via
* Cholesky (unless engine === "legacyShock"), holdings-level wealth, optional
* monthly rebalance, inflation, contributions, withdrawals, and advisory fee.
*
* The path loop runs in the bundled WASM kernel (native i64 xoshiro256**,
* Acklam inverse-normal). Setup, Cholesky, and fan-chart statistics stay in JS
* so Diagnostics and the planner share this function.
*/
function runMonteCarlo(input) {
	const k = getWasm();
	k.reset_heap();
	const buf = () => k.memory.buffer;
	const { nPaths, nMonths, mu, vol, corr, weights, fee, inflation, lumps, goalIds, retirementGoalId, legacyGoals } = input;
	const nA = mu.length;
	if (nA > 8) throw new Error("engine supports at most 8 assets");
	const nGoals = goalIds.length;
	if (nGoals > 16) throw new Error("engine supports at most 16 goals");
	const L = cholesky(corr);
	const nYears = Math.ceil(nMonths / 12);
	const goalIndex = /* @__PURE__ */ new Map();
	goalIds.forEach((id, i) => goalIndex.set(id, i));
	const lumpsByMonth = Array.from({ length: nMonths }, () => []);
	for (const lump of lumps) {
		if (lump.month < 0 || lump.month >= nMonths) continue;
		const gi = goalIndex.get(lump.goalId);
		if (gi === void 0) continue;
		lumpsByMonth[lump.month].push({
			gi,
			amount: lump.amount,
			priority: lump.priority
		});
	}
	for (const list of lumpsByMonth) list.sort((a, b) => a.priority - b.priority);
	let nLumpEvents = 0;
	for (const list of lumpsByMonth) nLumpEvents += list.length;
	const retGi = retirementGoalId != null ? goalIndex.get(retirementGoalId) : void 0;
	const legacyIdx = legacyGoals.map((g) => {
		const gi = goalIndex.get(g.goalId);
		return gi === void 0 ? null : {
			gi,
			amount: g.amount
		};
	}).filter((x) => x !== null);
	function f64(n) {
		const ptr = k.alloc(n * 8);
		return {
			ptr,
			view: new Float64Array(buf(), ptr, n)
		};
	}
	function i32(n) {
		const ptr = k.alloc(n * 4);
		return {
			ptr,
			view: new Int32Array(buf(), ptr, n)
		};
	}
	const muM = f64(nA);
	const volM = f64(nA);
	const w = f64(nA);
	const Lflat = f64(nA * nA);
	for (let i = 0; i < nA; i++) {
		muM.view[i] = mu[i] / 12;
		volM.view[i] = vol[i] / Math.sqrt(12);
		w.view[i] = weights[i];
		for (let j = 0; j < nA; j++) Lflat.view[i * nA + j] = L[i][j];
	}
	let muP = 0;
	const v = new Float64Array(nA);
	for (let i = 0; i < nA; i++) {
		muP += w.view[i] * muM.view[i];
		v[i] = w.view[i] * volM.view[i];
	}
	let sigP2 = 0;
	for (let j = 0; j < nA; j++) {
		let s = 0;
		for (let i = j; i < nA; i++) s += Lflat.view[i * nA + j] * v[i];
		sigP2 += s * s;
	}
	const contribution = f64(nMonths);
	const withdrawal = f64(nMonths);
	copyF64(input.contribution, contribution.view);
	copyF64(input.withdrawal, withdrawal.view);
	const lumpOff = i32(nMonths);
	const lumpCount = i32(nMonths);
	const lumpGi = i32(Math.max(nLumpEvents, 1));
	const lumpAmt = f64(Math.max(nLumpEvents, 1));
	let cursor = 0;
	for (let m = 0; m < nMonths; m++) {
		const list = lumpsByMonth[m];
		lumpOff.view[m] = cursor;
		lumpCount.view[m] = list.length;
		for (const ev of list) {
			lumpGi.view[cursor] = ev.gi;
			lumpAmt.view[cursor] = ev.amount;
			cursor += 1;
		}
	}
	const nLegacy = legacyIdx.length;
	const legacyGi = i32(Math.max(nLegacy, 1));
	const legacyAmt = f64(Math.max(nLegacy, 1));
	for (let i = 0; i < nLegacy; i++) {
		legacyGi.view[i] = legacyIdx[i].gi;
		legacyAmt.view[i] = legacyIdx[i].amount;
	}
	const yearly = f64(nPaths * (nYears + 1));
	const terminal = f64(nPaths);
	const terminalNF = f64(nPaths);
	const terminalAssets = f64(nPaths * nA);
	const successCount = i32(Math.max(nGoals, 1));
	const shortfall = f64(Math.max(nPaths * nGoals, 1));
	const sumPort = f64(1);
	const sumPort2 = f64(1);
	const nRet = i32(1);
	const sumAsset = f64(nA);
	const sumAsset2 = f64(nA);
	const weightSum = f64((nYears + 1) * nA);
	const tKernel = performance.now();
	k.run_paths(nPaths, nMonths, nA, nGoals, nYears, input.startWealth, Math.pow(1 - fee, 1 / 12), Math.pow(1 + inflation, 1 / 12), muP, Math.sqrt(Math.max(sigP2, 0)), (input.rebalance ?? "monthly") === "monthly" ? 1 : 0, (input.engine ?? "assets") === "legacyShock" ? 1 : 0, input.seed >>> 0, muM.ptr, volM.ptr, w.ptr, Lflat.ptr, contribution.ptr, withdrawal.ptr, lumpOff.ptr, lumpCount.ptr, lumpGi.ptr, lumpAmt.ptr, retGi === void 0 ? -1 : retGi, nLegacy, legacyGi.ptr, legacyAmt.ptr, yearly.ptr, terminal.ptr, terminalNF.ptr, terminalAssets.ptr, successCount.ptr, shortfall.ptr, sumPort.ptr, sumPort2.ptr, nRet.ptr, sumAsset.ptr, sumAsset2.ptr, weightSum.ptr);
	const kernelMs = performance.now() - tKernel;
	const years = [];
	const p5 = [];
	const p25 = [];
	const p50 = [];
	const p75 = [];
	const p95 = [];
	const col = new Float64Array(nPaths);
	const yearlyView = new Float64Array(buf(), yearly.ptr, nPaths * (nYears + 1));
	for (let yIdx = 0; yIdx <= nYears; yIdx++) {
		for (let p = 0; p < nPaths; p++) col[p] = yearlyView[p * (nYears + 1) + yIdx];
		const sorted = sortCopy(col);
		years.push(yIdx);
		p5.push(percentileSorted(sorted, .05));
		p25.push(percentileSorted(sorted, .25));
		p50.push(percentileSorted(sorted, .5));
		p75.push(percentileSorted(sorted, .75));
		p95.push(percentileSorted(sorted, .95));
	}
	const terminalView = new Float64Array(buf(), terminal.ptr, nPaths);
	const terminalNFView = new Float64Array(buf(), terminalNF.ptr, nPaths);
	const medianTerminal = percentileSorted(sortCopy(terminalView), .5);
	const medianTerminalNoFee = percentileSorted(sortCopy(terminalNFView), .5);
	const feeDrag = medianTerminalNoFee - medianTerminal;
	const feeDragPct = medianTerminalNoFee === 0 ? 0 : feeDrag / medianTerminalNoFee;
	const successView = new Int32Array(buf(), successCount.ptr, Math.max(nGoals, 1));
	const shortView = new Float64Array(buf(), shortfall.ptr, Math.max(nPaths * nGoals, 1));
	const failShortfalls = Array.from({ length: nGoals }, () => []);
	for (let p = 0; p < nPaths; p++) for (let g = 0; g < nGoals; g++) {
		const s = shortView[p * nGoals + g];
		if (s > 0) failShortfalls[g].push(s);
	}
	const goals = input.goalIds.map((goalId, g) => {
		const fails = failShortfalls[g];
		return {
			goalId,
			successRate: nPaths === 0 ? 0 : successView[g] / nPaths,
			medianShortfall: fails.length === 0 ? 0 : percentileSorted(fails.slice().sort((a, b) => a - b), .5),
			nFail: fails.length
		};
	});
	let meanTerminal = 0;
	for (let i = 0; i < nPaths; i++) meanTerminal += terminalView[i];
	meanTerminal /= Math.max(nPaths, 1);
	const nRetVal = new Int32Array(buf(), nRet.ptr, 1)[0];
	const sumPortVal = new Float64Array(buf(), sumPort.ptr, 1)[0];
	const sumPort2Val = new Float64Array(buf(), sumPort2.ptr, 1)[0];
	const portReturnMean = nRetVal ? sumPortVal / nRetVal : 0;
	const portReturnVol = nRetVal > 1 ? Math.sqrt(Math.max(0, (sumPort2Val - nRetVal * portReturnMean * portReturnMean) / (nRetVal - 1))) : 0;
	const sumAssetView = new Float64Array(buf(), sumAsset.ptr, nA);
	const sumAsset2View = new Float64Array(buf(), sumAsset2.ptr, nA);
	const assetReturnMean = [];
	const assetReturnVol = [];
	for (let i = 0; i < nA; i++) {
		const m = nRetVal ? sumAssetView[i] / nRetVal : 0;
		const vA = nRetVal > 1 ? Math.sqrt(Math.max(0, (sumAsset2View[i] - nRetVal * m * m) / (nRetVal - 1))) : 0;
		assetReturnMean.push(m);
		assetReturnVol.push(vA);
	}
	const weightView = new Float64Array(buf(), weightSum.ptr, (nYears + 1) * nA);
	const meanWeightsByYear = [];
	const denom = Math.max(nPaths, 1);
	for (let y = 0; y <= nYears; y++) {
		const row = [];
		for (let i = 0; i < nA; i++) row.push(weightView[y * nA + i] / denom);
		meanWeightsByYear.push(row);
	}
	return {
		nPaths,
		nMonths,
		nYears,
		startWealth: input.startWealth,
		years,
		p5,
		p25,
		p50,
		p75,
		p95,
		medianTerminal,
		medianTerminalNoFee,
		feeDrag,
		feeDragPct,
		goals,
		meanTerminal,
		portReturnMean,
		portReturnVol,
		assetReturnMean,
		assetReturnVol,
		nReturnObs: nRetVal,
		meanWeightsByYear,
		terminalAssets: new Float64Array(new Float64Array(buf(), terminalAssets.ptr, nPaths * nA)),
		nAssets: nA,
		runtimeMs: kernelMs
	};
}
try {
	getWasm();
} catch {
	wasm = null;
}
function moneyOrIndex(value, profile, privacy, start) {
	if (privacy) return `idx ${formatIndex(value, Math.max(start, 1))}`;
	return formatMoney(value, profile.currency, false);
}
function buildProposalPdf(input) {
	const { profile, cma, whatIf, privacy } = input;
	const nPaths = input.nPaths ?? 1e4;
	const asOf = input.asOf ?? `2026-09-10`;
	const book = effectivePortfolio(profile, whatIf, cma);
	const scored = profileFromAnswers(profile.answers);
	const level = effectiveRiskLevel(profile, whatIf);
	let result = input.result ?? null;
	if (!result || result.nPaths !== nPaths) result = runMonteCarlo(buildSimInput(profile, cma, whatIf, nPaths));
	const baseWhat = defaultWhatIf(profile.fee);
	const sameWhat = whatIf.extraSavingsPts === 0 && whatIf.retireLaterYears === 0 && whatIf.riskOverride == null && Math.abs(whatIf.fee - profile.fee) < 1e-12;
	let baseline = input.baseline ?? null;
	if (!baseline || baseline.nPaths !== nPaths) baseline = sameWhat ? result : runMonteCarlo(buildSimInput(profile, cma, baseWhat, nPaths));
	let gap = null;
	if (input.holdings && input.holdings.totalMarket > 0) gap = analyzeGap(input.holdings, book, input.holdings.holdings.map((h) => h.security));
	const members = profile.members.map((m) => m.name).join(" · ") || profile.name;
	const start = result.startWealth || profile.currentAssets || 1;
	const doc = new PdfDoc({
		title: `NORDLYS Investment Proposal — ${profile.name}`,
		headerLeft: "NORDLYS  ·  Investment proposal",
		headerRight: privacy ? `${profile.name}  ·  Privacy` : profile.name,
		footerNote: "Hypothetical illustration - not a guarantee of future results",
		privacy
	});
	doc.coverBand(profile.name, "Investment proposal", `As of ${asOf}${privacy ? "" : `  ·  ${profile.currency}`}  ·  seed ${profile.seed}`, privacy ? "PRIVACY MODE" : "CONFIDENTIAL");
	doc.paragraph(`Prepared for ${members}. This document summarises the recommended book, the probability of reaching each goal under the stated assumptions, and the effect of the advisory fee. Figures are produced in-browser by the NORDLYS engine; nothing in this file was typed in by hand.`, {
		size: 9.5,
		leading: 13,
		color: C.ink
	});
	doc.spacer(10);
	doc.heading("Executive summary");
	const primary = profile.goals[0];
	const pRes = primary ? result.goals.find((g) => g.goalId === primary.id) : null;
	const summaryBits = [
		`${profile.members.length} member${profile.members.length === 1 ? "" : "s"}; current capital ${formatMoney(profile.currentAssets, profile.currency, privacy)}.`,
		`Risk book ${RISK_LABELS[level]} (${book.name}) from willingness ${scored.tolerance} and capacity ${scored.capacity}.`,
		pRes && primary ? `Primary goal “${primary.name}” succeeds in ${formatPct(pRes.successRate, 1)} of ${result.nPaths.toLocaleString()} paths.` : `Horizon ${result.nYears} years; median terminal ${moneyOrIndex(result.medianTerminal, profile, privacy, start)}.`,
		`Advisory fee ${formatPct(whatIf.fee, 2)} reduces median ending wealth by ${privacy ? formatPct(result.feeDragPct) : `${formatMoney(result.feeDrag, profile.currency, false)} (${formatPct(result.feeDragPct)})`}.`
	];
	for (const b of summaryBits) doc.paragraph(b, {
		size: 9,
		leading: 12.5
	});
	doc.metricRow([
		{
			label: "Median terminal",
			value: moneyOrIndex(result.medianTerminal, profile, privacy, start)
		},
		{
			label: "Primary success",
			value: pRes ? formatPct(pRes.successRate, 1) : "—"
		},
		{
			label: "Fee drag",
			value: formatPct(result.feeDragPct)
		},
		{
			label: "Paths x years",
			value: `${result.nPaths} x ${result.nYears}`
		}
	]);
	doc.heading("Goals");
	if (profile.goals.length === 0) doc.paragraph("No goals are on the plan. Add a retirement income, home, education or legacy target to score success.");
	else doc.addTable([
		{
			header: "Goal",
			width: 160
		},
		{
			header: "Type",
			width: 90
		},
		{
			header: "When",
			width: 50,
			align: "right"
		},
		{
			header: "Amount",
			width: 80,
			align: "right"
		},
		{
			header: "Success",
			width: 55,
			align: "right"
		},
		{
			header: "Median shortfall",
			width: 80,
			align: "right"
		}
	], profile.goals.map((g) => {
		const r = result.goals.find((x) => x.goalId === g.id);
		return [
			g.name,
			GOAL_TYPE_LABELS[g.type],
			String(g.year),
			formatMoney(g.targetAmount, profile.currency, privacy),
			r ? formatPct(r.successRate, 1) : "—",
			r && r.nFail > 0 ? moneyOrIndex(r.medianShortfall, profile, privacy, Math.max(g.targetAmount, 1)) : "None"
		];
	}));
	doc.heading("Risk profile");
	doc.paragraph(riskRationale(scored.tolerance, scored.capacity, scored.profile), {
		size: 9,
		leading: 12.5
	});
	doc.spacer(4);
	doc.addTable([
		{
			header: "Dimension",
			width: 160
		},
		{
			header: "Score",
			width: 70,
			align: "right"
		},
		{
			header: "Label",
			width: 180
		}
	], [
		[
			"Willingness (tolerance)",
			String(scored.tolerance),
			RISK_LABELS[scored.tolerance] ?? ""
		],
		[
			"Ability (capacity)",
			String(scored.capacity),
			RISK_LABELS[scored.capacity] ?? ""
		],
		[
			"Recommended book",
			String(scored.profile),
			RISK_LABELS[scored.profile] ?? ""
		],
		[
			"Applied book",
			String(level),
			whatIf.riskOverride != null ? `${RISK_LABELS[level]} (what-if override)` : RISK_LABELS[level] ?? ""
		]
	]);
	doc.heading("Recommended allocation", 160);
	doc.paragraph(`${book.name}. ${book.blurb}`, {
		size: 9,
		leading: 12
	});
	const pieBox = doc.chartBox(150);
	doc.raw(pieWithLegend(pieBox, ASSET_IDS.map((id, i) => ({
		value: book.weights[i] ?? 0,
		label: ASSET_LABELS[id],
		caption: formatPct(book.weights[i] ?? 0, 1)
	}))));
	doc.addTable([
		{
			header: "Asset class",
			width: 200
		},
		{
			header: "Weight",
			width: 80,
			align: "right"
		},
		{
			header: "Expected return",
			width: 90,
			align: "right"
		},
		{
			header: "Volatility",
			width: 80,
			align: "right"
		}
	], ASSET_IDS.map((id, i) => [
		ASSET_LABELS[id],
		formatPct(book.weights[i] ?? 0, 1),
		formatPct(cma.mu[i] ?? 0, 1),
		formatPct(cma.vol[i] ?? 0, 1)
	]));
	doc.heading("Projected outcomes", 180);
	doc.paragraph(`Percentile fan of portfolio wealth, ${result.nPaths.toLocaleString()} monthly paths, seed ${profile.seed}. ` + (privacy ? "Privacy mode: series are indexed to 100 at the start." : `Nominal ${profile.currency}, inflation ${formatPct(cma.inflation, 1)} in the cash-flow schedule.`), {
		size: 9,
		leading: 12
	});
	const scale = privacy ? 100 / Math.max(start, 1) : 1;
	const fanBox = doc.chartBox(168);
	doc.raw(fanOps(fanBox, result.years, {
		p5: result.p5.map((v) => v * scale),
		p25: result.p25.map((v) => v * scale),
		p50: result.p50.map((v) => v * scale),
		p75: result.p75.map((v) => v * scale),
		p95: result.p95.map((v) => v * scale)
	}, privacy ? "Index (start = 100)" : profile.currency));
	doc.paragraph("Shaded bands are the 5th–95th and 25th–75th percentiles; the line is the median.", {
		size: 8,
		color: C.muted
	});
	doc.heading("Probability of success");
	if (profile.goals.length === 0) doc.paragraph("No goals to score.");
	else doc.addTable([
		{
			header: "Goal",
			width: 200
		},
		{
			header: "P(success)",
			width: 80,
			align: "right"
		},
		{
			header: "Failures",
			width: 70,
			align: "right"
		},
		{
			header: "Median shortfall when unsuccessful",
			width: 150,
			align: "right"
		}
	], profile.goals.map((g) => {
		const r = result.goals.find((x) => x.goalId === g.id);
		return [
			g.name,
			r ? formatPct(r.successRate, 1) : "—",
			r ? String(r.nFail) : "—",
			r && r.nFail ? moneyOrIndex(r.medianShortfall, profile, privacy, Math.max(g.targetAmount, 1)) : "—"
		];
	}));
	doc.heading("Fee impact");
	doc.paragraph(`The same return draws are applied with and without the advisory fee of ${formatPct(whatIf.fee, 2)} (${formatBp(whatIf.fee)}). Drag is the difference in median terminal wealth.`, {
		size: 9,
		leading: 12
	});
	doc.addTable([
		{
			header: "Measure",
			width: 220
		},
		{
			header: "With fee",
			width: 120,
			align: "right"
		},
		{
			header: "Without fee",
			width: 120,
			align: "right"
		}
	], [[
		"Median ending wealth",
		moneyOrIndex(result.medianTerminal, profile, privacy, start),
		moneyOrIndex(result.medianTerminalNoFee, profile, privacy, start)
	], [
		"Fee drag",
		privacy ? formatPct(result.feeDragPct) : formatMoney(result.feeDrag, profile.currency, false),
		formatPct(result.feeDragPct)
	]]);
	doc.heading("What-if comparison");
	const whatBits = [];
	if (whatIf.extraSavingsPts) whatBits.push(`save ${whatIf.extraSavingsPts.toFixed(0)} pp more`);
	if (whatIf.retireLaterYears) whatBits.push(`retire ${whatIf.retireLaterYears} year(s) later`);
	if (whatIf.riskOverride != null) whatBits.push(`risk override ${RISK_LABELS[whatIf.riskOverride]}`);
	if (Math.abs(whatIf.fee - profile.fee) > 1e-12) whatBits.push(`fee ${formatPct(whatIf.fee, 2)}`);
	doc.paragraph(whatBits.length ? `Applied adjustments: ${whatBits.join("; ")}.` : "No what-if adjustments are applied; both columns use the questionnaire book, stated savings rate, and the household fee.", {
		size: 9,
		leading: 12
	});
	const goalRows = profile.goals.map((g) => {
		const a = baseline.goals.find((x) => x.goalId === g.id);
		const b = result.goals.find((x) => x.goalId === g.id);
		return [
			g.name,
			a ? formatPct(a.successRate, 1) : "—",
			b ? formatPct(b.successRate, 1) : "—"
		];
	});
	doc.addTable([
		{
			header: "Measure",
			width: 200
		},
		{
			header: "Base plan",
			width: 130,
			align: "right"
		},
		{
			header: "What-if",
			width: 130,
			align: "right"
		}
	], [
		[
			"Median terminal wealth",
			moneyOrIndex(baseline.medianTerminal, profile, privacy, start),
			moneyOrIndex(result.medianTerminal, profile, privacy, start)
		],
		[
			"Fee drag",
			formatPct(baseline.feeDragPct),
			formatPct(result.feeDragPct)
		],
		...goalRows
	]);
	doc.heading("Current versus recommended", 170);
	if (gap && input.holdings) {
		const barBox = doc.chartBox(Math.min(168, 28 + gap.rows.length * 22));
		doc.raw(barPairOps(barBox, gap.rows.map((r) => ({
			label: ASSET_LABELS[r.assetClass],
			a: r.currentWeight,
			b: r.targetWeight
		})), ["Current", "Recommended"]));
		doc.addTable([
			{
				header: "Class",
				width: 120
			},
			{
				header: "Current",
				width: 70,
				align: "right"
			},
			{
				header: "Target",
				width: 70,
				align: "right"
			},
			{
				header: "Gap",
				width: 90,
				align: "right"
			}
		], gap.rows.map((r) => [
			ASSET_LABELS[r.assetClass],
			formatPct(r.currentWeight, 1),
			formatPct(r.targetWeight, 1),
			privacy ? formatPct(r.targetWeight - r.currentWeight, 1, true) : formatMoney(r.gap, "NOK", false)
		]));
		if (gap.trades.length) {
			doc.paragraph("Rebalancing trades, whole-share rounded:", { size: 9 });
			doc.addTable([
				{
					header: "Side",
					width: 50
				},
				{
					header: "Name",
					width: 160
				},
				{
					header: "Shares",
					width: 60,
					align: "right"
				},
				{
					header: "Value",
					width: 90,
					align: "right"
				}
			], gap.trades.map((t) => [
				t.side.toUpperCase(),
				t.name,
				String(t.shares),
				privacy ? "••••" : formatMoney(t.valueNok, "NOK", false)
			]));
		} else doc.paragraph("No whole-share trades are required at the current gap tolerance.");
	} else {
		doc.paragraph("No imported holdings are linked to this household. The table is the model book only. Use “Use as client” on the Portfolio page to load current weights and a trade list.", {
			size: 9,
			leading: 12
		});
		doc.addTable([{
			header: "Asset class",
			width: 220
		}, {
			header: "Recommended weight",
			width: 140,
			align: "right"
		}], ASSET_IDS.map((id, i) => [ASSET_LABELS[id], formatPct(book.weights[i] ?? 0, 1)]));
	}
	doc.heading("Assumptions", 120);
	doc.paragraph(`Capital-market assumptions are arithmetic, nominal, annual. Monthly steps use mu/12 and vol/sqrt(12). Correlated normals come from the Cholesky factor of the correlation matrix. Rebalancing is ${whatIf.rebalance === "none" ? "off (weights drift)" : "monthly to target weights"}. Inflation ${formatPct(cma.inflation, 1)}. Engine seed ${profile.seed}.`, {
		size: 9,
		leading: 12
	});
	doc.addTable([
		{
			header: "Class",
			width: 140
		},
		{
			header: "mu",
			width: 50,
			align: "right"
		},
		{
			header: "vol",
			width: 50,
			align: "right"
		},
		...ASSET_IDS.map((id) => ({
			header: ASSET_LABELS[id].slice(0, 6),
			width: 42,
			align: "right"
		}))
	], ASSET_IDS.map((id, i) => [
		ASSET_LABELS[id],
		formatPct(cma.mu[i] ?? 0, 1),
		formatPct(cma.vol[i] ?? 0, 1),
		...ASSET_IDS.map((_, j) => (cma.corr[i]?.[j] ?? 0).toFixed(2))
	]), { fontSize: 7 });
	doc.heading("Disclaimer");
	doc.paragraph("This proposal is prepared by NORDLYS for the named household. Monte Carlo projections use the stated capital-market assumptions, the household’s cash-flows, and a seeded generator so every figure can be reproduced. They are hypothetical illustrations, not forecasts or guarantees of future results. Markets can lose money. Fees reduce wealth. Past performance is not indicative of future results. NORDLYS does not provide legal, tax, or regulated investment advice in this document. Ålesund, Tromsø, Bærum — Nordic characters are encoded for the archive.", {
		size: 8,
		leading: 11,
		color: C.muted
	});
	return {
		bytes: doc.finish(),
		fileName: `NORDLYS-Proposal-${profile.name.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "") || "client"}-${asOf}.pdf`,
		layout: doc.layout
	};
}
function buildPortfolioReportPdf(input) {
	const { ledger, profile, cma, whatIf, costMethod, privacy, asOf, mode } = input;
	const holdings = computeHoldings(ledger, costMethod, asOf);
	const returns = computeReturns(ledger, costMethod, asOf);
	const historyOk = historicalRiskAvailable(mode, ledger);
	const missingHist = holdingsWithoutImportedHistory(ledger, holdings.holdings.map((h) => ({
		isin: h.isin,
		name: h.security.name
	})));
	const book = effectivePortfolio(profile, whatIf, cma);
	const twrAnn = annualize(returns.twr, returns.startDate, returns.endDate);
	const navVals = returns.nav.map((p) => p.value);
	const rets = historyOk ? simpleReturns(navVals) : [];
	const dd = historyOk ? drawdownFromNav(returns.nav) : null;
	const ratios = historyOk && rets.length > 2 ? ratiosFromReturns(rets, .02, dd?.maxDd ?? 0, 12) : null;
	const var95 = historyOk && rets.length ? historicalVarEs(rets, .95) : null;
	const startNav = returns.nav[0]?.value || holdings.totalMarket || 1;
	const doc = new PdfDoc({
		title: `NORDLYS Portfolio Report — ${profile.name}`,
		headerLeft: "NORDLYS  ·  Portfolio report",
		headerRight: privacy ? `${profile.name}  ·  Privacy` : profile.name,
		footerNote: "Hypothetical illustration - not a guarantee of future results",
		privacy
	});
	doc.coverBand(profile.name, "Portfolio report", `As of ${asOf}  ·  ${costMethod === "fifo" ? "FIFO" : "Average cost"}  ·  ${mode === "demo" ? "Demo" : "My Data"}`, privacy ? "PRIVACY MODE" : "CONFIDENTIAL");
	doc.paragraph(privacy ? `Holdings, returns and risk are computed from the ledger in this browser. The planning household is ${profile.name}.` : `Holdings, returns and risk are computed from the ledger in this browser. Base currency NOK for positions; the planning household is ${profile.name} (${profile.currency}).`, {
		size: 9.5,
		leading: 13
	});
	doc.spacer(8);
	doc.heading("Performance");
	doc.metricRow([
		{
			label: "Market value",
			value: privacy ? `idx ${formatIndex(holdings.totalMarket, startNav)}` : formatMoney(holdings.totalMarket, "NOK", false)
		},
		{
			label: "TWR (ann.)",
			value: Number.isFinite(twrAnn) ? formatPct(twrAnn, 1, true) : "—"
		},
		{
			label: "XIRR",
			value: Number.isFinite(returns.xirr) ? formatPct(returns.xirr, 1, true) : "—"
		},
		{
			label: "Unreal. P&L",
			value: privacy ? formatPct(holdings.totalMarket ? holdings.totalUnrealized / holdings.totalMarket : 0, 1, true) : formatMoney(holdings.totalUnrealized, "NOK", false)
		}
	]);
	if (returns.nav.length >= 2) {
		const base = returns.nav[0].value || 1;
		const series = returns.nav.map((p, i) => ({
			x: i,
			y: privacy ? p.value / base * 100 : p.value
		}));
		const box = doc.chartBox(150);
		doc.raw(lineOps(box, [series], [C.navy], privacy ? "Index" : "NOK"));
		doc.paragraph(`NAV from ${returns.startDate} to ${returns.endDate}. ${privacy ? "Indexed to 100 at the first point." : ""}`, {
			size: 8,
			color: C.muted
		});
	} else doc.paragraph("Not enough NAV points to draw a performance line.");
	doc.heading("Risk metrics", 80);
	if (!historyOk) {
		doc.paragraph("Not available: import price history");
		if (missingHist.length) doc.paragraph(`Holdings without imported price history: ${missingHist.map((h) => h.name || h.isin).join(", ")}.`, {
			size: 9,
			leading: 12
		});
	} else doc.addTable([
		{
			header: "Metric",
			width: 160
		},
		{
			header: "Value",
			width: 100,
			align: "right"
		},
		{
			header: "Note",
			width: 200
		}
	], [
		[
			"Volatility (ann.)",
			formatPct(ratios?.vol ?? 0, 1),
			"Sample standard deviation of simple returns"
		],
		[
			"Sharpe (rf 2%)",
			(ratios?.sharpe ?? 0).toFixed(2),
			"Annualised excess / vol"
		],
		[
			"Sortino",
			(ratios?.sortino ?? 0).toFixed(2),
			"Downside deviation of excess returns"
		],
		[
			"Calmar",
			(ratios?.calmar ?? 0).toFixed(2),
			"Annualised mean / max drawdown"
		],
		[
			"Max drawdown",
			formatPct(dd?.maxDd ?? 0, 1),
			dd?.maxDdTrough ? `Trough ${dd.maxDdTrough}` : ""
		],
		[
			"Recovery",
			dd?.recovered && dd.recoveryDays != null ? `${dd.recoveryDays} days` : "Open",
			dd?.recovered ? "Returned to prior peak" : "Still underwater vs peak"
		],
		[
			"Hist. 95% VaR",
			var95 ? formatPct(var95.var, 2) : "-",
			"Monthly loss quantile"
		],
		[
			"Hist. 95% ES",
			var95 ? formatPct(var95.es, 2) : "-",
			"Mean loss beyond VaR"
		]
	]);
	doc.heading("Allocation", 170);
	const pieBox = doc.chartBox(150);
	doc.raw(pieWithLegend(pieBox, holdings.allocation.map((a, i) => ({
		value: a.value,
		label: ASSET_LABELS[a.assetClass],
		caption: formatPct(a.weight, 1),
		color: CHART_PALETTE[i % CHART_PALETTE.length]
	}))));
	const barBox = doc.chartBox(Math.min(160, 24 + ASSET_IDS.length * 20));
	doc.raw(barPairOps(barBox, ASSET_IDS.map((id, i) => ({
		label: ASSET_LABELS[id],
		a: holdings.allocation.find((x) => x.assetClass === id)?.weight ?? 0,
		b: book.weights[i] ?? 0
	})), ["Current", "Model book"]));
	doc.heading("Top contributors");
	const top = holdings.holdings.slice().sort((a, b) => Math.abs(b.unrealizedNok) - Math.abs(a.unrealizedNok)).slice(0, 8);
	if (top.length === 0) doc.paragraph("No security holdings.");
	else doc.addTable([
		{
			header: "Name",
			width: 150
		},
		{
			header: "Weight",
			width: 55,
			align: "right"
		},
		{
			header: "uP&L",
			width: 75,
			align: "right"
		},
		{
			header: "Price",
			width: 70,
			align: "right"
		},
		{
			header: privacy ? "FX" : "Ccy",
			width: 70,
			align: "right"
		}
	], top.map((h) => [
		h.security.name,
		formatPct(h.weight, 1),
		privacy ? formatPct(h.costNok ? h.unrealizedNok / h.costNok : 0, 1, true) : formatMoney(h.unrealizedNok, "NOK", false),
		privacy ? "-" : formatMoney(h.priceEffect, "NOK", false),
		privacy ? "-" : formatMoney(h.currencyEffect, "NOK", false)
	]));
	if (mode === "demo") {
		const cov = covFromVolCorr(cma.vol, cma.corr);
		const contrib = riskContributions(ASSET_IDS.map((id) => holdings.allocation.find((a) => a.assetClass === id)?.weight ?? 0), cma.mu, cov, ASSET_IDS.map((id) => ASSET_LABELS[id]));
		doc.paragraph("Risk contribution by asset class (demo book; My Data uses imported history only):", {
			size: 8,
			color: C.muted
		});
		doc.addTable([
			{
				header: "Class",
				width: 140
			},
			{
				header: "Weight",
				width: 70,
				align: "right"
			},
			{
				header: "% of risk",
				width: 80,
				align: "right"
			},
			{
				header: "Return contrib.",
				width: 90,
				align: "right"
			}
		], contrib.map((c) => [
			c.label,
			formatPct(c.weight, 1),
			formatPct(c.pctr, 1),
			formatPct(c.retContrib, 2)
		]));
	} else if (!historyOk) doc.paragraph("Not available: import price history");
	if (holdings.holdings.length) {
		doc.heading("Holdings");
		doc.addTable(privacy ? [
			{
				header: "Name",
				width: 180
			},
			{
				header: "Qty",
				width: 55,
				align: "right"
			},
			{
				header: "Weight",
				width: 70,
				align: "right"
			},
			{
				header: "MV",
				width: 80,
				align: "right"
			}
		] : [
			{
				header: "Name",
				width: 150
			},
			{
				header: "Qty",
				width: 55,
				align: "right"
			},
			{
				header: "Ccy",
				width: 40
			},
			{
				header: "Weight",
				width: 55,
				align: "right"
			},
			{
				header: "MV",
				width: 80,
				align: "right"
			}
		], holdings.holdings.map((h) => privacy ? [
			h.security.name,
			h.qty.toFixed(2),
			formatPct(h.weight, 1),
			"••••"
		] : [
			h.security.name,
			h.qty.toFixed(2),
			h.security.currency,
			formatPct(h.weight, 1),
			formatMoney(h.marketNok, "NOK", false)
		]));
	}
	doc.heading("Disclaimer");
	doc.paragraph(privacy ? "Performance and risk figures are computed from imported transactions and prices in this browser. Positions without imported history are listed above. Projections elsewhere in NORDLYS are hypothetical illustrations, not forecasts. This report is not regulated investment advice." : "Performance and risk figures are computed from imported transactions and prices. Positions without an imported price are marked stale and valued at last trade. Foreign currency without an imported FX series is marked stale. Projections elsewhere in NORDLYS are hypothetical illustrations, not forecasts. This report is not regulated investment advice.", {
		size: 8,
		leading: 11,
		color: C.muted
	});
	return {
		bytes: doc.finish(),
		fileName: `NORDLYS-Portfolio-${profile.name.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "") || "portfolio"}-${asOf}.pdf`,
		layout: doc.layout
	};
}
var SHOW_EVENT = "nordlys-show";
function requestShowTour() {
	window.dispatchEvent(new Event(SHOW_EVENT));
}
var STEPS = [
	{
		path: "/",
		title: "Start with a client",
		body: "Emilie Voss is loaded — a long horizon, an Oslo apartment, and a retirement income. The fan is ten thousand futures, not one guess. Switch James & Priya Ward or Ingrid Solberg and the plan changes with them."
	},
	{
		path: "/portfolio",
		title: "The book behind the plan",
		body: "Holdings, cost, and the mix are built from transactions. This is the same book the planner compares with the model portfolio."
	},
	{
		path: "/risk",
		title: "Risk, measured",
		body: "Drawdown, tails, correlation, and a frontier from these holdings. Stress is a what-if you can point at, not a line in a disclaimer."
	},
	{
		path: "/backtest",
		title: "Replay a strategy",
		body: "The chart is price. close[1] is the previous bar. The sweep puts in-sample next to out-of-sample — a wide gap is overfitting, and the page says so."
	},
	{
		path: "/import",
		title: "A Nordnet file, dropped in",
		body: "Export transactions and drop the file here. A name you map once is remembered. The file stays on this device."
	},
	{
		path: "/about",
		title: "It stays in this browser",
		body: "Demo, My Data, and Privacy are switches, not accounts. The proposal PDF is built here. Diagnostics, in the sidebar, reruns the engine if someone asks for the timings — give it a moment; the checks are real."
	}
];
function ShowTour() {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [step, setStep] = (0, import_react.useState)(0);
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const navigate = useNavigate();
	const loadDemo = useAppStore((s) => s.loadDemo);
	const setPrivacy = useAppStore((s) => s.setPrivacy);
	(0, import_react.useEffect)(() => {
		const onStart = () => {
			loadDemo("demo-emilie");
			setPrivacy(false);
			setStep(0);
			setOpen(true);
			if (pathname !== "/") navigate({ to: "/" });
		};
		window.addEventListener(SHOW_EVENT, onStart);
		return () => window.removeEventListener(SHOW_EVENT, onStart);
	}, [
		loadDemo,
		navigate,
		pathname,
		setPrivacy
	]);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const match = STEPS.findIndex((s) => s.path === pathname);
		if (match >= 0) setStep(match);
		const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
		window.setTimeout(() => {
			const anchorId = pathname === "/" ? "results" : pathname === "/backtest" ? "candles" : null;
			const anchor = anchorId ? document.getElementById(anchorId) : null;
			if (anchor) {
				anchor.style.scrollMarginTop = "4.5rem";
				anchor.scrollIntoView({
					block: pathname === "/backtest" ? "start" : "center",
					behavior
				});
			} else window.scrollTo({
				top: 0,
				behavior
			});
		}, 60);
	}, [open, pathname]);
	function go(next) {
		if (next < 0) return;
		if (next >= STEPS.length) {
			setOpen(false);
			return;
		}
		const path = STEPS[next].path;
		if (path === pathname) setStep(next);
		else navigate({ to: path });
	}
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const onKey = (e) => {
			const el = e.target;
			if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) return;
			if (e.key === "Escape") {
				e.preventDefault();
				setOpen(false);
			} else if (e.key === "ArrowRight") {
				e.preventDefault();
				go(step + 1);
			} else if (e.key === "ArrowLeft") {
				e.preventDefault();
				go(step - 1);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [
		open,
		pathname,
		step,
		navigate
	]);
	if (!open) return null;
	const current = STEPS[step];
	if (!current) return null;
	const last = step === STEPS.length - 1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-x-3 bottom-16 z-40 lg:inset-x-auto lg:bottom-6 lg:left-56 lg:w-96",
		role: "dialog",
		"aria-label": "Show NORDLYS",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "panel p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "kicker",
						children: [
							"Stop ",
							step + 1,
							" of ",
							STEPS.length
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted",
						onClick: () => setOpen(false),
						"aria-label": "Close walkthrough",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-base font-medium text-fg",
					children: current.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm leading-relaxed text-muted",
					children: current.body
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-11 rounded-md border border-border px-3 text-sm text-fg disabled:text-subtle",
						onClick: () => go(step - 1),
						disabled: step === 0,
						children: "Back"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-11 rounded-md bg-accent px-4 text-sm font-medium text-accent-fg",
						onClick: () => go(step + 1),
						children: last ? "Done" : "Next"
					})]
				})
			]
		})
	});
}
function CommandPalette({ open, onClose }) {
	const navigate = useNavigate();
	const loadDemo = useAppStore((s) => s.loadDemo);
	const setMode = useAppStore((s) => s.setMode);
	const setPrivacy = useAppStore((s) => s.setPrivacy);
	const privacy = useAppStore((s) => s.privacy);
	const copyDemoToMyData = useAppStore((s) => s.copyDemoToMyData);
	const resetCma = useAppStore((s) => s.resetCma);
	const resetWhatIf = useAppStore((s) => s.resetWhatIf);
	const loadDemoExport = usePortfolioStore((s) => s.loadDemoExport);
	const copyLedger = usePortfolioStore((s) => s.copyDemoToMyData);
	const profile = useAppStore((s) => s.profile);
	const cma = useAppStore((s) => s.cma);
	const whatIf = useAppStore((s) => s.whatIf);
	const mode = useAppStore((s) => s.mode);
	const costMethod = usePortfolioStore((s) => s.costMethod);
	const demo = usePortfolioStore((s) => s.demo);
	const mydata = usePortfolioStore((s) => s.mydata);
	const usedAsClient = usePortfolioStore((s) => s.usedAsClient);
	const [q, setQ] = (0, import_react.useState)("");
	const [idx, setIdx] = (0, import_react.useState)(0);
	const commands = (0, import_react.useMemo)(() => {
		const nav = NAV.map((n) => ({
			id: `nav-${n.id}`,
			group: "Go to",
			label: n.label,
			hint: n.hint,
			disabled: !n.enabled,
			run: () => {
				if (!n.enabled) return;
				navigate({ to: n.path });
			}
		}));
		const demos = DEMO_CLIENTS.map((c) => ({
			id: `demo-${c.id}`,
			group: "Demo clients",
			label: `Load ${c.name}`,
			hint: c.currency,
			run: () => loadDemo(c.id)
		}));
		const actions = [
			{
				id: "show",
				group: "Session",
				label: "Show this — walk someone through NORDLYS",
				hint: "Six stops",
				run: () => requestShowTour()
			},
			{
				id: "mode-demo",
				group: "Session",
				label: "Switch to Demo",
				run: () => setMode("demo")
			},
			{
				id: "mode-my",
				group: "Session",
				label: "Switch to My Data",
				run: () => setMode("mydata")
			},
			{
				id: "privacy",
				group: "Session",
				label: privacy ? "Turn Privacy Mode off" : "Turn Privacy Mode on",
				run: () => setPrivacy(!privacy)
			},
			{
				id: "copy",
				group: "Session",
				label: "Copy current plan into My Data",
				run: () => copyDemoToMyData()
			},
			{
				id: "reset-cma",
				group: "Session",
				label: "Reset capital market assumptions",
				run: () => resetCma()
			},
			{
				id: "reset-whatif",
				group: "Session",
				label: "Reset what-if sliders",
				run: () => resetWhatIf()
			},
			{
				id: "demo-nordnet",
				group: "Portfolio",
				label: "Load demo Nordnet export",
				run: () => loadDemoExport()
			},
			{
				id: "copy-ledger",
				group: "Portfolio",
				label: "Copy demo ledger into My Data",
				run: () => copyLedger()
			},
			{
				id: "pdf-proposal",
				group: "Documents",
				label: "Download client proposal PDF",
				run: () => {
					const ledger = mode === "demo" ? demo : mydata;
					const holdings = usedAsClient && ledger.transactions.length ? computeHoldings(ledger, costMethod, mode === "demo" ? DEMO_AS_OF : (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)) : null;
					const pdf = buildProposalPdf({
						profile,
						cma,
						whatIf,
						privacy,
						holdings,
						asOf: mode === "demo" ? `${AS_OF_YEAR}-09-01` : (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
					});
					downloadPdf(pdf.bytes, pdf.fileName);
				}
			},
			{
				id: "pdf-report",
				group: "Documents",
				label: "Download portfolio report PDF",
				run: () => {
					const ledger = mode === "demo" ? demo : mydata;
					if (!ledger.transactions.length) return;
					const pdf = buildPortfolioReportPdf({
						ledger,
						profile,
						cma,
						whatIf,
						costMethod,
						privacy,
						asOf: mode === "demo" ? DEMO_AS_OF : (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
						mode
					});
					downloadPdf(pdf.bytes, pdf.fileName);
				}
			}
		];
		return [
			...nav,
			...demos,
			...actions
		];
	}, [
		navigate,
		loadDemo,
		setMode,
		setPrivacy,
		privacy,
		copyDemoToMyData,
		resetCma,
		resetWhatIf,
		loadDemoExport,
		copyLedger,
		profile,
		cma,
		whatIf,
		mode,
		costMethod,
		demo,
		mydata,
		usedAsClient
	]);
	const filtered = (0, import_react.useMemo)(() => {
		const s = q.trim().toLowerCase();
		if (!s) return commands.filter((c) => !c.disabled);
		return commands.filter((c) => !c.disabled && (c.label.toLowerCase().includes(s) || c.group.toLowerCase().includes(s) || (c.hint ?? "").toLowerCase().includes(s)));
	}, [commands, q]);
	(0, import_react.useEffect)(() => {
		setIdx(0);
	}, [q, open]);
	(0, import_react.useEffect)(() => {
		if (!open) {
			setQ("");
			return;
		}
		const onKey = (e) => {
			if (e.key === "Escape") {
				e.preventDefault();
				onClose();
			} else if (e.key === "ArrowDown") {
				e.preventDefault();
				setIdx((i) => Math.min(filtered.length - 1, i + 1));
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				setIdx((i) => Math.max(0, i - 1));
			} else if (e.key === "Enter") {
				e.preventDefault();
				const cmd = filtered[idx];
				if (cmd) {
					cmd.run();
					onClose();
				}
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [
		open,
		filtered,
		idx,
		onClose
	]);
	if (!open) return null;
	let lastGroup = "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-start justify-center bg-bg/70 px-3 pt-[12vh]",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "panel w-full max-w-lg overflow-hidden rounded-xl shadow-lg",
			onClick: (e) => e.stopPropagation(),
			role: "dialog",
			"aria-label": "Command palette",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				autoFocus: true,
				value: q,
				onChange: (e) => setQ(e.target.value),
				placeholder: "Jump, load a client, toggle privacy…",
				className: "h-14 w-full border-b border-border bg-transparent px-4 text-base text-fg outline-none"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "max-h-80 overflow-auto py-2",
				children: filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "px-4 py-6 text-sm text-muted",
					children: "No matching commands."
				}) : filtered.map((cmd, i) => {
					const head = cmd.group !== lastGroup;
					lastGroup = cmd.group;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [head ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "px-4 pb-1 pt-2 text-[10px] font-medium tracking-[0.14em] text-subtle uppercase",
						children: cmd.group
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onMouseEnter: () => setIdx(i),
						onClick: () => {
							cmd.run();
							onClose();
						},
						className: `flex h-11 w-full items-center justify-between px-4 text-left text-sm ${i === idx ? "bg-surface-2 text-fg" : "text-fg"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: cmd.label }), cmd.hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted",
							children: cmd.hint
						}) : null]
					})] }, cmd.id);
				})
			})]
		})
	});
}
var ICONS = {
	planner: ChartLine,
	portfolio: Briefcase,
	import: Upload,
	risk: Shield,
	options: Activity,
	backtest: History,
	help: CircleHelp,
	diagnostics: FlaskConical,
	about: Info
};
function AppShell({ children }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const mode = useAppStore((s) => s.mode);
	const setMode = useAppStore((s) => s.setMode);
	const privacy = useAppStore((s) => s.privacy);
	const setPrivacy = useAppStore((s) => s.setPrivacy);
	const hydrate = useAppStore((s) => s.hydrate);
	const hydratePort = usePortfolioStore((s) => s.hydrate);
	const profile = useAppStore((s) => s.profile);
	const [palette, setPalette] = (0, import_react.useState)(false);
	const [drawer, setDrawer] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		hydrate();
		hydratePort();
	}, [hydrate, hydratePort]);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				setPalette((v) => !v);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	(0, import_react.useEffect)(() => {
		setDrawer(false);
	}, [pathname]);
	const modeLabel = `${mode === "demo" ? "Demo" : "My Data"} · ${profile.name}`;
	const mobileNav = NAV.filter((n) => n.enabled && MOBILE_NAV_IDS.includes(n.id));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-dvh flex-col bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex h-14 items-center gap-3 px-3 sm:px-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "hidden h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border text-fg max-lg:flex",
							onClick: () => setDrawer(true),
							"aria-label": "Open navigation",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-5" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/",
							className: "flex shrink-0 items-baseline gap-2 no-underline",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-semibold tracking-[0.22em] text-fg",
								children: "NORDLYS"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "hidden text-[10px] tracking-[0.16em] text-muted uppercase sm:inline",
								children: "Private wealth"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ml-auto flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "inline-flex rounded-full border border-border p-0.5",
									role: "group",
									"aria-label": "Data source",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setMode("demo"),
										className: cn("h-9 rounded-full px-2.5 text-xs font-medium sm:px-4", mode === "demo" ? "bg-accent text-accent-fg" : "text-muted"),
										children: "Demo"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setMode("mydata"),
										className: cn("h-9 rounded-full px-2.5 text-xs font-medium sm:px-4", mode === "mydata" ? "bg-accent text-accent-fg" : "text-muted"),
										children: "My Data"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setPrivacy(!privacy),
									className: cn("inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-2.5 text-xs font-medium sm:px-3", privacy ? "border-accent text-accent" : "border-border text-muted"),
									"aria-pressed": privacy,
									title: "Privacy Mode hides currency amounts",
									children: [privacy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "hidden sm:inline",
										children: "Privacy"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setPalette(true),
									className: "inline-flex h-11 shrink-0 items-center gap-2 rounded-md border border-border px-2.5 text-xs text-muted sm:px-3",
									"aria-label": "Open command palette",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "hidden font-mono sm:inline",
										children: "⌘K"
									})]
								})
							]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-h-0 flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
						className: "sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-52 shrink-0 border-r border-border lg:flex lg:flex-col",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavList, { pathname }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SideFooter, { modeLabel })]
					}),
					drawer ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "fixed inset-0 z-50 lg:hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "absolute inset-0 bg-bg/70",
							"aria-label": "Close navigation",
							onClick: () => setDrawer(false)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
							className: "relative flex h-full w-64 flex-col border-r border-border bg-surface",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex h-14 items-center justify-between px-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm tracking-[0.22em]",
										children: "NORDLYS"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "flex h-11 w-11 items-center justify-center",
										onClick: () => setDrawer(false),
										"aria-label": "Close",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavList, { pathname }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SideFooter, { modeLabel })
							]
						})]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
						className: "min-w-0 flex-1 pb-20 lg:pb-0",
						children
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-bg max-lg:flex hidden",
				style: { paddingBottom: "env(safe-area-inset-bottom)" },
				"aria-label": "Mobile",
				children: mobileNav.map((item) => {
					const Icon = ICONS[item.id] ?? ChartLine;
					const active = pathname === item.path;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: item.path,
						className: cn("flex h-14 min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] no-underline", active ? "text-accent" : "text-muted"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), item.label]
					}, item.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandPalette, {
				open: palette,
				onClose: () => setPalette(false)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShowTour, {})
		]
	});
}
function SideFooter({ modeLabel }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-auto border-t border-border p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: requestShowTour,
			className: "flex h-11 w-full items-center justify-center rounded-md border border-border text-sm text-fg",
			children: "Show this"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "px-1 pt-3 font-mono text-[11px] text-subtle",
			children: modeLabel
		})]
	});
}
function NavList({ pathname }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		className: "flex flex-col gap-0.5 p-3",
		"aria-label": "Primary",
		children: NAV.map((item) => {
			const Icon = ICONS[item.id] ?? ChartLine;
			const active = item.enabled && pathname === item.path;
			if (!item.enabled) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "flex h-11 items-center gap-3 rounded-md px-3 text-sm text-subtle",
				title: "Not in this release",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), item.label]
			}, item.id);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: item.path,
				className: cn("flex h-11 items-center gap-3 rounded-md px-3 text-sm no-underline", active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2 hover:text-fg"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), item.label]
			}, item.id);
		})
	});
}
var styles_default = "/assets/styles-CzeKqeaJ.css";
var APP_NAME = "NORDLYS";
var Route$9 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "theme-color",
				content: "#090c0b"
			},
			{
				name: "description",
				content: "Private wealth planning. Goals, Nordnet import, holdings, and a 10,000-path Monte Carlo — all in the browser."
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		className: "antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	})
});
var $$splitComponentImporter$8 = () => import("./routes-D32JEeAx.mjs");
var Route$8 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
var $$splitComponentImporter$7 = () => import("./about-nDcL8zI3.mjs");
var Route$7 = createFileRoute("/about")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./backtest-CvkyWFtv.mjs");
var Route$6 = createFileRoute("/backtest")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var $$splitComponentImporter$5 = () => import("./diagnostics-BNEd9lsH.mjs");
var Route$5 = createFileRoute("/diagnostics")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./help-Bj-yIQRB.mjs");
var Route$4 = createFileRoute("/help")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./import-DJuTo8TN.mjs");
var Route$3 = createFileRoute("/import")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./options-BeOHjXju.mjs");
var Route$2 = createFileRoute("/options")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./portfolio-i1zF8ks2.mjs");
var Route$1 = createFileRoute("/portfolio")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./risk-DDFTJLOU.mjs");
var Route = createFileRoute("/risk")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var rootRouteChildren = {
	IndexRoute: Route$8.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$9
	}),
	AboutRoute: Route$7.update({
		id: "/about",
		path: "/about",
		getParentRoute: () => Route$9
	}),
	BacktestRoute: Route$6.update({
		id: "/backtest",
		path: "/backtest",
		getParentRoute: () => Route$9
	}),
	DiagnosticsRoute: Route$5.update({
		id: "/diagnostics",
		path: "/diagnostics",
		getParentRoute: () => Route$9
	}),
	HelpRoute: Route$4.update({
		id: "/help",
		path: "/help",
		getParentRoute: () => Route$9
	}),
	ImportRoute: Route$3.update({
		id: "/import",
		path: "/import",
		getParentRoute: () => Route$9
	}),
	OptionsRoute: Route$2.update({
		id: "/options",
		path: "/options",
		getParentRoute: () => Route$9
	}),
	PortfolioRoute: Route$1.update({
		id: "/portfolio",
		path: "/portfolio",
		getParentRoute: () => Route$9
	}),
	RiskRoute: Route.update({
		id: "/risk",
		path: "/risk",
		getParentRoute: () => Route$9
	})
};
var routeTree = Route$9._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { stressHoldings as $, matMul as $t, PRICE_PRESETS as A, assertCma as At, resolveBenchmarkSeries as B, efficientFrontier as Bt, riskRationale as C, MODEL_PORTFOLIOS as Ct, winAnsiToUnicode as D, RISK_LABELS as Dt, unmappedWinAnsiChars as E, N_PATHS_PREVIEW as Et, expectedTransactions as F, decodeText as Ft, computeReturns as G, importNordnetBuffer as Gt, storedBenchmarkSeries as H, encodeUtf16Le as Ht, historicalRiskAvailable as I, defaultCma as It, historicalVarEs as J, inferTicker as Jt, computeVarEs as K, importNordnetRows as Kt, holdingsWithoutImportedHistory as L, defaultCmaBooksKkt as Lt, buildDemoLedger as M, cholesky as Mt, buildSyntheticNordnet as N, corrFromCov as Nt, BENCHMARKS as O, TX_KINDS as Ot, downloadableDemoFile as P, covFromVolCorr as Pt, simpleReturns as Q, looksLikeFund as Qt, isImportedQuoteSource as R, defaultConstraints as Rt, profileFromAnswers as S, GOAL_TYPE_LABELS as St, textWidth as T, N_PATHS as Tt, annualize as U, estimateCovariance as Ut, sniffPriceMap as V, emptyLedgerBundle as Vt, classReturnFrame as W, identity as Wt, ratiosFromReturns as X, isPositiveDefinite as Xt, holdingReturnFrame as Y, inspectNordnetFormat as Yt, riskContributions as Z, ledoitWolfCovariance as Zt, fanOps as _, ASSET_LABELS as _t, runMonteCarlo as a, parseNumber as an, createRng as at, pdfString as b, DEMO_BLURBS as bt, C as c, sanitizeSecurities as cn, formatNumber as ct, RISK_QUESTIONS as d, withUserPatch as dn, mean as dt, maxAbsDiff as en, xirr as et, analyzeGap as f, portfolioMoments as ft, effectiveRiskLevel as g, ASSET_IDS as gt, effectivePortfolio as h, useAppStore as ht, buildProposalPdf as i, parseNordnetBytes as in, cn as it, benchmarkSeries as j, blackLitterman as jt, DEMO_AS_OF as k, TX_KIND_LABELS as kt, PAGE_H as l, symmetrizeCorr as ln, formatPct as lt, buildSimInput as m, sampleStdev as mt, requestShowTour as n, modelBooks as nn, normPdf as nt, downloadPdf as o, parseTable as on, formatIndex as ot, barPairOps as p, relativeError as pt, drawdownFromNav as q, inferExchange as qt, buildPortfolioReportPdf as r, parseDate as rn, computeHoldings as rt, usePortfolioStore as s, riskParity as sn, formatMoney as st, router_exports as t, mergeFxFromRows as tn, normCdf as tt, PdfDoc as u, transpose as un, futureValue as ut, finalRiskProfile as v, ASSET_SHORT as vt, sanitizePdfText as w, NORDNET_HEADERS_NB as wt, pieWithLegend as x, DEMO_CLIENTS as xt, lineOps as y, AS_OF_YEAR as yt, parsePriceCsv as z, defaultWhatIf as zt };
