import { at as createRng, dt as mean, mt as sampleStdev, nt as normPdf, tt as normCdf } from "./router-DE00T9yP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/options-B9z_Ouho.js
/** Black–Scholes–Merton, implied vol, binomial American, Monte Carlo. */
function d1d2(S, K, r, vol, T, q) {
	if (T <= 0 || vol <= 0) {
		const sign = S * Math.exp(-q * Math.max(T, 0)) - K * Math.exp(-r * Math.max(T, 0)) >= 0 ? Infinity : -Infinity;
		return {
			d1: sign,
			d2: sign
		};
	}
	const srt = vol * Math.sqrt(T);
	const d1 = (Math.log(S / K) + (r - q + .5 * vol * vol) * T) / srt;
	return {
		d1,
		d2: d1 - srt
	};
}
function bsmPrice(p) {
	const { S, K, r, vol, T, q, type } = p;
	if (T <= 0) return type === "call" ? Math.max(S - K, 0) : Math.max(K - S, 0);
	const dfq = Math.exp(-q * T);
	const dfr = Math.exp(-r * T);
	const { d1, d2 } = d1d2(S, K, r, vol, T, q);
	if (type === "call") return S * dfq * normCdf(d1) - K * dfr * normCdf(d2);
	return K * dfr * normCdf(-d2) - S * dfq * normCdf(-d1);
}
function bsmGreeks(p) {
	const { S, K, r, vol, T, q, type } = p;
	if (T <= 0 || vol <= 0 || S <= 0) return {
		delta: type === "call" ? S > K ? 1 : S < K ? 0 : .5 : S < K ? -1 : S > K ? 0 : -.5,
		gamma: 0,
		vega: 0,
		theta: 0,
		rho: 0
	};
	const { d1, d2 } = d1d2(S, K, r, vol, T, q);
	const dfq = Math.exp(-q * T);
	const dfr = Math.exp(-r * T);
	const nd1 = normPdf(d1);
	const srt = vol * Math.sqrt(T);
	const delta = type === "call" ? dfq * normCdf(d1) : dfq * (normCdf(d1) - 1);
	const gamma = dfq * nd1 / (S * srt);
	const vega = S * dfq * nd1 * Math.sqrt(T);
	const thetaCall = -(S * dfq * nd1 * vol) / (2 * Math.sqrt(T)) - r * K * dfr * normCdf(d2) + q * S * dfq * normCdf(d1);
	const thetaPut = -(S * dfq * nd1 * vol) / (2 * Math.sqrt(T)) + r * K * dfr * normCdf(-d2) - q * S * dfq * normCdf(-d1);
	const rho = type === "call" ? K * T * dfr * normCdf(d2) : -K * T * dfr * normCdf(-d2);
	return {
		delta,
		gamma,
		vega,
		theta: type === "call" ? thetaCall : thetaPut,
		rho
	};
}
function bsm(p) {
	const { d1, d2 } = d1d2(p.S, p.K, p.r, p.vol, p.T, p.q);
	return {
		price: bsmPrice(p),
		greeks: bsmGreeks(p),
		d1,
		d2
	};
}
function intrinsicDiscounted(p) {
	const fwd = p.S * Math.exp(-p.q * p.T) - p.K * Math.exp(-p.r * p.T);
	if (p.type === "call") return Math.max(fwd, 0);
	return Math.max(-fwd, 0);
}
function maxPrice(p) {
	if (p.type === "call") return p.S * Math.exp(-p.q * p.T);
	return p.K * Math.exp(-p.r * p.T);
}
function impliedVol(p, market, guess = .2) {
	if (!(p.S > 0) || !(p.K > 0) || !(p.T > 0)) return {
		ok: false,
		error: "Spot, strike and maturity must be positive."
	};
	const loBound = intrinsicDiscounted({
		...p,
		vol: 0
	});
	const hiBound = maxPrice({
		...p,
		vol: 0
	});
	if (market < loBound - 1e-10) return {
		ok: false,
		error: `Price ${market.toFixed(4)} is below intrinsic ${loBound.toFixed(4)} — no positive volatility solves it.`
	};
	if (market > hiBound + 1e-10) return {
		ok: false,
		error: `Price ${market.toFixed(4)} is above the no-arbitrage cap ${hiBound.toFixed(4)}.`
	};
	if (Math.abs(market - loBound) < 1e-12) return {
		ok: true,
		vol: 0
	};
	let sigma = Math.min(5, Math.max(1e-6, guess));
	for (let i = 0; i < 40; i++) {
		const diff = bsmPrice({
			...p,
			vol: sigma
		}) - market;
		if (Math.abs(diff) < 1e-12) return {
			ok: true,
			vol: sigma
		};
		const vega = bsmGreeks({
			...p,
			vol: sigma
		}).vega;
		if (!(vega > 1e-14)) break;
		const next = sigma - diff / vega;
		if (!(next > 0) || next > 8) break;
		sigma = next;
		if (Math.abs(diff / Math.max(market, 1e-8)) < 1e-14) return {
			ok: true,
			vol: sigma
		};
	}
	let lo = 1e-8;
	let hi = 5;
	let flo = bsmPrice({
		...p,
		vol: lo
	}) - market;
	let fhi = bsmPrice({
		...p,
		vol: hi
	}) - market;
	if (flo * fhi > 0) {
		hi = 8;
		fhi = bsmPrice({
			...p,
			vol: hi
		}) - market;
		if (flo * fhi > 0) return {
			ok: false,
			error: "Implied volatility did not bracket — check the quoted price."
		};
	}
	for (let i = 0; i < 80; i++) {
		const mid = .5 * (lo + hi);
		const fm = bsmPrice({
			...p,
			vol: mid
		}) - market;
		if (Math.abs(fm) < 1e-14) return {
			ok: true,
			vol: mid
		};
		if (flo * fm <= 0) {
			hi = mid;
			fhi = fm;
		} else {
			lo = mid;
			flo = fm;
		}
	}
	return {
		ok: true,
		vol: .5 * (lo + hi)
	};
}
/** CRR binomial. American takes max(exercise, continuation) at each node. */
function binomialPrice(p, nSteps, exercise) {
	const n = Math.max(2, Math.floor(nSteps));
	const dt = p.T / n;
	const u = Math.exp(p.vol * Math.sqrt(dt));
	const d = 1 / u;
	const pu = (Math.exp((p.r - p.q) * dt) - d) / (u - d);
	const pd = 1 - pu;
	const disc = Math.exp(-p.r * dt);
	if (!(pu > 0 && pu < 1)) {
		const euro = bsmPrice(p);
		return {
			price: euro,
			european: euro
		};
	}
	const pay = (s) => p.type === "call" ? Math.max(s - p.K, 0) : Math.max(p.K - s, 0);
	const spot = new Float64Array(n + 1);
	for (let j = 0; j <= n; j++) spot[j] = p.S * Math.pow(u, 2 * j - n);
	const euro = new Float64Array(n + 1);
	const amer = new Float64Array(n + 1);
	for (let j = 0; j <= n; j++) {
		const v = pay(spot[j]);
		euro[j] = v;
		amer[j] = v;
	}
	for (let i = n - 1; i >= 0; i--) for (let j = 0; j <= i; j++) {
		const s = p.S * Math.pow(u, 2 * j - i);
		const contE = disc * (pu * euro[j + 1] + pd * euro[j]);
		const contA = disc * (pu * amer[j + 1] + pd * amer[j]);
		euro[j] = contE;
		amer[j] = exercise === "american" ? Math.max(pay(s), contA) : contA;
	}
	return {
		price: amer[0],
		european: euro[0]
	};
}
/**
* Terminal GBM Monte Carlo. Antithetic variates, plus a control variate
* e^{-rT} S_T (known mean S e^{-qT}).
*/
function mcOptionPrice(p, nPaths, seed) {
	const n = Math.max(2, Math.floor(nPaths / 2) * 2);
	const half = n / 2;
	const rng = createRng(seed);
	const drift = (p.r - p.q - .5 * p.vol * p.vol) * p.T;
	const sig = p.vol * Math.sqrt(p.T);
	const df = Math.exp(-p.r * p.T);
	const payoffs = new Float64Array(n);
	const controls = new Float64Array(n);
	const eST = p.S * Math.exp(-p.q * p.T);
	for (let i = 0; i < half; i++) {
		const z = rng.gaussian();
		const s1 = p.S * Math.exp(drift + sig * z);
		const s2 = p.S * Math.exp(drift - sig * z);
		const y1 = df * (p.type === "call" ? Math.max(s1 - p.K, 0) : Math.max(p.K - s1, 0));
		const y2 = df * (p.type === "call" ? Math.max(s2 - p.K, 0) : Math.max(p.K - s2, 0));
		payoffs[2 * i] = y1;
		payoffs[2 * i + 1] = y2;
		controls[2 * i] = df * s1;
		controls[2 * i + 1] = df * s2;
	}
	const pairPay = [];
	const pairCtl = [];
	for (let i = 0; i < half; i++) {
		pairPay.push(.5 * (payoffs[2 * i] + payoffs[2 * i + 1]));
		pairCtl.push(.5 * (controls[2 * i] + controls[2 * i + 1]));
	}
	const price = mean(pairPay);
	const se = sampleStdev(pairPay) / Math.sqrt(pairPay.length);
	const mx = mean(pairCtl);
	const my = price;
	let cxx = 0;
	let cxy = 0;
	for (let i = 0; i < pairPay.length; i++) {
		const dx = pairCtl[i] - mx;
		const dy = pairPay[i] - my;
		cxx += dx * dx;
		cxy += dx * dy;
	}
	const beta = cxx > 0 ? cxy / cxx : 0;
	const adj = [];
	for (let i = 0; i < pairPay.length; i++) adj.push(pairPay[i] - beta * (pairCtl[i] - eST));
	const priceCv = mean(adj);
	const seCv = sampleStdev(adj) / Math.sqrt(adj.length);
	return {
		price,
		se,
		priceCv,
		seCv,
		seReduction: se > 0 ? 1 - seCv / se : 0,
		n
	};
}
//#endregion
export { impliedVol as a, bsmPrice as i, bsm as n, mcOptionPrice as o, bsmGreeks as r, binomialPrice as t };
