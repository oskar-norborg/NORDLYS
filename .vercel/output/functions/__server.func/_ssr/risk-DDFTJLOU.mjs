import { i as __toESM } from "../_runtime.mjs";
import { B as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { $ as stressHoldings, Bt as efficientFrontier, G as computeReturns, H as storedBenchmarkSeries, I as historicalRiskAvailable, K as computeVarEs, L as holdingsWithoutImportedHistory, Nt as corrFromCov, Pt as covFromVolCorr, Q as simpleReturns, Rt as defaultConstraints, Ut as estimateCovariance, W as classReturnFrame, X as ratiosFromReturns, Y as holdingReturnFrame, Z as riskContributions, _t as ASSET_LABELS, gt as ASSET_IDS, ht as useAppStore, it as cn, jt as blackLitterman, k as DEMO_AS_OF, lt as formatPct, nn as modelBooks, q as drawdownFromNav, rt as computeHoldings, s as usePortfolioStore, sn as riskParity, st as formatMoney, vt as ASSET_SHORT } from "./router-DE00T9yP.mjs";
import { a as SliderRow, i as SelectInput, r as Panel, t as Field } from "./field-CX5Y1XAQ.mjs";
import { t as UnderwaterChart } from "./underwater-chart-CxEI4lI6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/risk-DDFTJLOU.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function token$1(name, fallback) {
	if (typeof window === "undefined") return fallback;
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
function lerp(a, b, t) {
	return a + (b - a) * t;
}
function mix(c0, c1, t) {
	const tt = Math.min(1, Math.max(0, t));
	return `rgb(${lerp(c0[0], c1[0], tt).toFixed(0)} ${lerp(c0[1], c1[1], tt).toFixed(0)} ${lerp(c0[2], c1[2], tt).toFixed(0)})`;
}
function HeatmapChart({ labels, matrix }) {
	const canvasRef = (0, import_react.useRef)(null);
	const wrapRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		const wrap = wrapRef.current;
		if (!canvas || !wrap) return;
		const draw = () => {
			const dpr = window.devicePixelRatio || 1;
			const n = labels.length;
			const width = wrap.clientWidth;
			const cell = Math.max(22, Math.min(44, Math.floor((width - 72) / Math.max(n, 1))));
			const height = 48 + cell * n;
			canvas.width = Math.floor(width * dpr);
			canvas.height = Math.floor(height * dpr);
			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, width, height);
			const muted = token$1("--color-muted", "#8b958f");
			const fg = token$1("--color-fg", "#e4eae6");
			const origin = 68;
			const cool = [
				20,
				36,
				42
			];
			const mid = [
				143,
				191,
				178
			];
			const hot = [
				192,
				112,
				112
			];
			ctx.font = "10px IBM Plex Mono, monospace";
			ctx.fillStyle = muted;
			for (let i = 0; i < n; i++) {
				ctx.textAlign = "right";
				ctx.fillText(labels[i].slice(0, 8), 62, 36 + i * cell + cell * .62);
				ctx.save();
				ctx.translate(origin + i * cell + cell * .5, 22);
				ctx.rotate(-Math.PI / 4);
				ctx.textAlign = "left";
				ctx.fillText(labels[i].slice(0, 8), 0, 0);
				ctx.restore();
			}
			for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
				const v = matrix[i]?.[j] ?? 0;
				const t = (v + 1) / 2;
				const color = t < .5 ? mix(hot, mid, t * 2) : mix(mid, cool, (t - .5) * 2);
				ctx.fillStyle = i === j ? mix(mid, [
					232,
					234,
					230
				], .25) : color;
				ctx.fillRect(origin + j * cell + 1, 28 + i * cell + 1, cell - 2, cell - 2);
				ctx.fillStyle = Math.abs(v) > .55 ? fg : muted;
				ctx.textAlign = "center";
				ctx.fillText(v.toFixed(2), origin + j * cell + cell / 2, 28 + i * cell + cell * .62);
			}
		};
		draw();
		const ro = new ResizeObserver(draw);
		ro.observe(wrap);
		return () => ro.disconnect();
	}, [labels, matrix]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: wrapRef,
		className: "w-full",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			ref: canvasRef,
			className: "block w-full"
		})
	});
}
function token(name, fallback) {
	if (typeof window === "undefined") return fallback;
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
function FrontierChart({ points, selected, onSelect, extra }) {
	const canvasRef = (0, import_react.useRef)(null);
	const wrapRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		const wrap = wrapRef.current;
		if (!canvas || !wrap) return;
		const draw = () => {
			const dpr = window.devicePixelRatio || 1;
			const width = wrap.clientWidth;
			const height = 260;
			canvas.width = Math.floor(width * dpr);
			canvas.height = Math.floor(height * dpr);
			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			const bg = token("--color-surface", "#101513");
			const grid = token("--color-border", "#232a27");
			const muted = token("--color-muted", "#8b958f");
			const accent = token("--color-accent", "#8fbfb2");
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, width, height);
			if (points.length < 2) return;
			const pad = {
				l: 48,
				r: 12,
				t: 16,
				b: 28
			};
			const plotW = width - pad.l - pad.r;
			const plotH = height - pad.t - pad.b;
			let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
			for (const p of points) {
				minX = Math.min(minX, p.vol);
				maxX = Math.max(maxX, p.vol);
				minY = Math.min(minY, p.mu);
				maxY = Math.max(maxY, p.mu);
			}
			for (const e of extra ?? []) {
				minX = Math.min(minX, e.vol);
				maxX = Math.max(maxX, e.vol);
				minY = Math.min(minY, e.mu);
				maxY = Math.max(maxY, e.mu);
			}
			const dx = maxX - minX || .01;
			const dy = maxY - minY || .01;
			minX -= dx * .08;
			maxX += dx * .08;
			minY -= dy * .08;
			maxY += dy * .08;
			const xOf = (v) => pad.l + (v - minX) / (maxX - minX) * plotW;
			const yOf = (v) => pad.t + (1 - (v - minY) / (maxY - minY)) * plotH;
			ctx.strokeStyle = grid;
			ctx.lineWidth = 1;
			ctx.font = "10px IBM Plex Mono, monospace";
			ctx.fillStyle = muted;
			for (let i = 0; i <= 4; i++) {
				const v = minY + (maxY - minY) * i / 4;
				const y = yOf(v);
				ctx.beginPath();
				ctx.moveTo(pad.l, y);
				ctx.lineTo(width - pad.r, y);
				ctx.stroke();
				ctx.fillText(formatPct(v, 1), 6, y + 3);
			}
			ctx.beginPath();
			points.forEach((p, i) => {
				const x = xOf(p.vol);
				const y = yOf(p.mu);
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			});
			ctx.strokeStyle = accent;
			ctx.lineWidth = 1.6;
			ctx.stroke();
			points.forEach((p, i) => {
				ctx.beginPath();
				ctx.fillStyle = i === selected ? token("--color-fg", "#e4eae6") : accent;
				ctx.arc(xOf(p.vol), yOf(p.mu), i === selected ? 4.5 : 2.4, 0, Math.PI * 2);
				ctx.fill();
			});
			for (const e of extra ?? []) {
				ctx.beginPath();
				ctx.fillStyle = e.color || token("--color-warn", "#c4a574");
				ctx.arc(xOf(e.vol), yOf(e.mu), 4, 0, Math.PI * 2);
				ctx.fill();
			}
			ctx.fillStyle = muted;
			ctx.fillText("σ →", pad.l, 252);
			ctx.fillText(formatPct(maxX, 1), width - pad.r - 36, 252);
		};
		draw();
		const onClick = (ev) => {
			const rect = canvas.getBoundingClientRect();
			const x = ev.clientX - rect.left;
			const y = ev.clientY - rect.top;
			const width = rect.width;
			const height = 260;
			const pad = {
				l: 48,
				r: 12,
				t: 16,
				b: 28
			};
			const plotW = width - pad.l - pad.r;
			const plotH = height - pad.t - pad.b;
			let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
			for (const p of points) {
				minX = Math.min(minX, p.vol);
				maxX = Math.max(maxX, p.vol);
				minY = Math.min(minY, p.mu);
				maxY = Math.max(maxY, p.mu);
			}
			const dx = maxX - minX || .01;
			const dy = maxY - minY || .01;
			minX -= dx * .08;
			maxX += dx * .08;
			minY -= dy * .08;
			maxY += dy * .08;
			const xOf = (v) => pad.l + (v - minX) / (maxX - minX) * plotW;
			const yOf = (v) => pad.t + (1 - (v - minY) / (maxY - minY)) * plotH;
			let best = 0;
			let bestD = Infinity;
			points.forEach((p, i) => {
				const d = (xOf(p.vol) - x) ** 2 + (yOf(p.mu) - y) ** 2;
				if (d < bestD) {
					bestD = d;
					best = i;
				}
			});
			onSelect(best);
		};
		canvas.addEventListener("click", onClick);
		const ro = new ResizeObserver(draw);
		ro.observe(wrap);
		return () => {
			ro.disconnect();
			canvas.removeEventListener("click", onClick);
		};
	}, [
		points,
		selected,
		onSelect,
		extra
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: wrapRef,
		className: "w-full",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			ref: canvasRef,
			className: "block w-full cursor-crosshair"
		})
	});
}
function asOf() {
	return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
var VAR_METHODS = [
	{
		id: "historical",
		label: "Historical"
	},
	{
		id: "normal",
		label: "Parametric normal"
	},
	{
		id: "cornish",
		label: "Cornish–Fisher"
	},
	{
		id: "montecarlo",
		label: "Monte Carlo"
	}
];
function RiskPage() {
	const mode = useAppStore((s) => s.mode);
	const privacy = useAppStore((s) => s.privacy);
	const cma = useAppStore((s) => s.cma);
	const demo = usePortfolioStore((s) => s.demo);
	const mydata = usePortfolioStore((s) => s.mydata);
	const costMethod = usePortfolioStore((s) => s.costMethod);
	const benchmarkId = usePortfolioStore((s) => s.benchmarkId);
	const ledger = mode === "demo" ? demo : mydata;
	const date = mode === "demo" ? DEMO_AS_OF : asOf();
	const [covMethod, setCovMethod] = (0, import_react.useState)("ledoit");
	const [lambda, setLambda] = (0, import_react.useState)(.94);
	const [varMethod, setVarMethod] = (0, import_react.useState)("historical");
	const [alpha, setAlpha] = (0, import_react.useState)(.95);
	const [frontierIdx, setFrontierIdx] = (0, import_react.useState)(25);
	const [blAsset, setBlAsset] = (0, import_react.useState)(0);
	const [blMu, setBlMu] = (0, import_react.useState)(.1);
	const [blConf, setBlConf] = (0, import_react.useState)(.5);
	const [views, setViews] = (0, import_react.useState)([]);
	const [assetShocks, setAssetShocks] = (0, import_react.useState)(() => Object.fromEntries(ASSET_IDS.map((id) => [id, 0])));
	const [fxShock, setFxShock] = (0, import_react.useState)(0);
	const holdings = (0, import_react.useMemo)(() => computeHoldings(ledger, costMethod, date), [
		ledger,
		costMethod,
		date
	]);
	const returns = (0, import_react.useMemo)(() => computeReturns(ledger, costMethod, date), [
		ledger,
		costMethod,
		date
	]);
	const historyOk = historicalRiskAvailable(mode, ledger);
	const missingHist = holdingsWithoutImportedHistory(ledger, holdings.holdings.map((h) => ({
		isin: h.isin,
		name: h.security.name
	})));
	const frame = (0, import_react.useMemo)(() => {
		if (!historyOk) return null;
		return holdingReturnFrame(ledger, date) ?? classReturnFrame(ledger, date);
	}, [
		ledger,
		date,
		historyOk
	]);
	const cmaCov = (0, import_react.useMemo)(() => covFromVolCorr(cma.vol, cma.corr), [cma]);
	const books = (0, import_react.useMemo)(() => modelBooks(cma), [cma]);
	const estimated = (0, import_react.useMemo)(() => {
		if (!historyOk || !frame || frame.R.length < 3) {
			if (mode === "mydata") return null;
			return {
				cov: cmaCov,
				labels: ASSET_IDS.map((id) => ASSET_SHORT[id]),
				weights: books[2].weights,
				mu: cma.mu,
				source: "cma"
			};
		}
		return {
			cov: estimateCovariance(frame.R, covMethod, lambda),
			labels: frame.labels,
			weights: frame.weights,
			mu: frame.mu,
			source: frame.kind
		};
	}, [
		frame,
		covMethod,
		lambda,
		cmaCov,
		cma.mu,
		books,
		historyOk,
		mode
	]);
	const corr = (0, import_react.useMemo)(() => estimated ? corrFromCov(estimated.cov) : null, [estimated]);
	const portR = (0, import_react.useMemo)(() => historyOk ? simpleReturns(returns.nav.map((n) => n.value)) : [], [returns.nav, historyOk]);
	const benchSeries = storedBenchmarkSeries(ledger, benchmarkId);
	const benchR = (0, import_react.useMemo)(() => {
		if (!historyOk || benchSeries.length < 3 || portR.length < 3) return void 0;
		const aligned = [];
		const nav = returns.nav;
		for (let i = 1; i < nav.length; i++) {
			const d0 = nav[i - 1].date;
			const d1 = nav[i].date;
			const b0 = [...benchSeries].reverse().find((p) => p.date <= d0);
			const b1 = [...benchSeries].reverse().find((p) => p.date <= d1);
			if (b0 && b1 && b0.value > 0) aligned.push(b1.value / b0.value - 1);
			else aligned.push(NaN);
		}
		return aligned.every((x) => Number.isFinite(x)) ? aligned : void 0;
	}, [
		benchSeries,
		portR.length,
		returns.nav,
		historyOk
	]);
	const dd = (0, import_react.useMemo)(() => historyOk ? drawdownFromNav(returns.nav) : null, [returns.nav, historyOk]);
	const rf = cma.mu[5] ?? .028;
	const ppy = portR.length > 1 && returns.nav.length > 1 ? Math.max(4, portR.length / Math.max(1, (Date.parse(returns.endDate) - Date.parse(returns.startDate)) / 31536e6)) : 12;
	const ratios = (0, import_react.useMemo)(() => historyOk && portR.length > 2 && dd ? ratiosFromReturns(portR, rf, dd.maxDd, ppy, benchR) : null, [
		portR,
		rf,
		dd,
		ppy,
		benchR,
		historyOk
	]);
	const varEs = (0, import_react.useMemo)(() => {
		if (!historyOk || !estimated || portR.length < 2) return null;
		const w = estimated.weights;
		const n = w.length;
		const mu = estimated.mu.length === n ? estimated.mu : new Array(n).fill(0);
		return computeVarEs(portR, varMethod, alpha, {
			mu,
			cov: estimated.cov,
			weights: w,
			nPaths: 8e3,
			seed: 20260321
		});
	}, [
		portR,
		varMethod,
		alpha,
		estimated,
		historyOk
	]);
	const contrib = (0, import_react.useMemo)(() => estimated ? riskContributions(estimated.weights, estimated.mu.length === estimated.weights.length ? estimated.mu : estimated.weights.map(() => 0), estimated.cov, estimated.labels) : null, [estimated]);
	const frontier = (0, import_react.useMemo)(() => efficientFrontier(cmaCov, cma.mu, 51, defaultConstraints(6)), [cmaCov, cma.mu]);
	const selected = frontier[Math.min(frontierIdx, frontier.length - 1)] ?? frontier[0];
	const parity = (0, import_react.useMemo)(() => riskParity(cmaCov), [cmaCov]);
	const parityMom = (0, import_react.useMemo)(() => {
		let m = 0;
		let v = 0;
		for (let i = 0; i < 6; i++) m += parity[i] * cma.mu[i];
		for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) v += parity[i] * cmaCov[i][j] * parity[j];
		return {
			mu: m,
			vol: Math.sqrt(v)
		};
	}, [
		parity,
		cma.mu,
		cmaCov
	]);
	const bl = (0, import_react.useMemo)(() => {
		const wMkt = books[2].weights;
		return blackLitterman(cmaCov, wMkt, views, 2.5, .05, defaultConstraints(6));
	}, [
		cmaCov,
		books,
		views
	]);
	const stress = (0, import_react.useMemo)(() => stressHoldings(holdings.holdings, holdings.cash, assetShocks, {
		USDNOK: fxShock,
		EURNOK: fxShock
	}), [
		holdings,
		assetShocks,
		fxShock
	]);
	if (ledger.transactions.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-[1100px] px-4 py-6 sm:px-6 sm:py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "kicker mb-2",
				children: "Analytics"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-medium tracking-tight",
				children: "Risk"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-4 rounded-lg border border-border bg-surface px-4 py-6 text-sm text-muted",
				children: [
					"No holdings in ",
					mode === "demo" ? "Demo" : "My Data",
					". Import a ledger, or stay in Demo — covariance, VaR and the CMA frontier still run on the planner assumptions below once a book exists."
				]
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "kicker mb-2",
						children: "Analytics"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-2xl font-medium tracking-tight",
						children: "Risk"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-muted",
						children: [
							mode === "demo" ? "Demo" : "My Data",
							" ·",
							" ",
							!historyOk ? "Not available: import price history" : `covariance from ${estimated?.source === "cma" ? "CMA (short history)" : estimated?.source === "holdings" ? "holding returns" : "asset-class NAV"} · ${covMethod}`,
							privacy ? " · Privacy on" : ""
						]
					}),
					!historyOk && missingHist.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-xs text-muted",
						children: [
							"Holdings without imported price history: ",
							missingHist.map((h) => h.name || h.isin).join(", "),
							"."
						]
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: `${(alpha * 100).toFixed(0)}% VaR`,
						value: varEs && historyOk ? formatPct(varEs.var, 2) : "Not available: import price history",
						hint: VAR_METHODS.find((m) => m.id === varMethod)?.label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Expected shortfall",
						value: varEs && historyOk ? formatPct(varEs.es, 2) : "Not available: import price history"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Max drawdown",
						value: dd && historyOk ? formatPct(dd.maxDd, 1) : "Not available: import price history",
						hint: dd?.maxDdTrough
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Sharpe",
						value: ratios && historyOk ? ratios.sharpe.toFixed(2) : "Not available: import price history",
						hint: historyOk ? `rf ${formatPct(rf, 1)}` : void 0
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-4 lg:flex-row lg:items-start",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 flex-1 flex-col gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
							kicker: "Estimators",
							title: "Covariance",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mb-4 grid gap-3 sm:grid-cols-3",
									children: [
										"sample",
										"ewma",
										"ledoit"
									].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setCovMethod(m),
										className: cn("h-11 rounded-md border text-sm", covMethod === m ? "border-accent bg-accent text-accent-fg" : "border-border text-muted"),
										children: m === "sample" ? "Sample" : m === "ewma" ? "EWMA" : "Ledoit–Wolf"
									}, m))
								}),
								covMethod === "ewma" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRow, {
									label: "λ",
									valueLabel: lambda.toFixed(2),
									min: .8,
									max: .99,
									step: .01,
									value: lambda,
									onChange: setLambda
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-xs text-muted",
									children: !historyOk ? "Not available: import price history" : frame ? `${frame.R.length} return observations x ${frame.labels.length} series.` : "Using CMA covariance - import prices for a sample estimator."
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
							kicker: "Tails",
							title: "VaR and expected shortfall",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-4 grid gap-3 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Method",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectInput, {
										value: varMethod,
										onChange: (e) => setVarMethod(e.target.value),
										children: VAR_METHODS.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: m.id,
											children: m.label
										}, m.id))
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Confidence",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectInput, {
										value: String(alpha),
										onChange: (e) => setAlpha(Number(e.target.value)),
										children: [
											.9,
											.95,
											.975,
											.99
										].map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
											value: a,
											children: [(a * 100).toFixed(1), "%"]
										}, a))
									})
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: "One-period loss on the book. Historical and Cornish–Fisher use the NAV return series; parametric and Monte Carlo use the selected covariance. Monte Carlo: 8,000 seeded paths."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
							kicker: "Path",
							title: "Underwater",
							children: dd && historyOk ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UnderwaterChart, { series: dd.underwater }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 grid gap-2 sm:grid-cols-3 text-xs text-muted",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Peak ", dd.maxDdStart] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Trough ", dd.maxDdTrough] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Recovery ", dd.recoveryDays == null ? "open" : `${dd.recoveryDays} days`] })
								]
							})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: "Not available: import price history"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
							kicker: "Co-movement",
							title: "Correlation",
							children: corr && estimated && historyOk ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeatmapChart, {
								labels: estimated.labels,
								matrix: corr
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: "Not available: import price history"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
							kicker: "Attribution",
							title: "Contribution to return and risk",
							children: contrib && historyOk ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "overflow-x-auto",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
									className: "w-full min-w-[36rem] text-left text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "border-b border-border text-xs text-muted",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-2 py-2 font-medium",
												children: "Name"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-2 py-2 font-medium",
												children: "Wgt"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-2 py-2 font-medium",
												children: "Ret contrib"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-2 py-2 font-medium",
												children: "MCR"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-2 py-2 font-medium",
												children: "% risk"
											})
										]
									}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: contrib.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "border-b border-border",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-2 py-2",
												children: r.label
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-2 py-2 font-mono",
												children: formatPct(r.weight, 1)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-2 py-2 font-mono",
												children: formatPct(r.retContrib, 2, true)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-2 py-2 font-mono",
												children: r.mcr.toFixed(3)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-2 py-2 font-mono",
												children: formatPct(r.pctr, 1)
											})
										]
									}, r.label)) })]
								})
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: "Not available: import price history"
							})
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex w-full shrink-0 flex-col gap-4 lg:w-[26rem]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
						kicker: "Ratios",
						title: "Risk-adjusted",
						children: ratios && historyOk ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
							className: "text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RatioRow, {
									label: "Volatility",
									value: formatPct(ratios.vol, 1)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RatioRow, {
									label: "Sortino",
									value: ratios.sortino.toFixed(2)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RatioRow, {
									label: "Calmar",
									value: ratios.calmar.toFixed(2)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RatioRow, {
									label: "Beta",
									value: ratios.beta == null ? "import a benchmark" : ratios.beta.toFixed(2)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RatioRow, {
									label: "Tracking error",
									value: ratios.te == null ? "-" : formatPct(ratios.te, 1)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RatioRow, {
									label: "Information ratio",
									value: ratios.ir == null ? "-" : ratios.ir.toFixed(2)
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "Not available: import price history"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
						kicker: "What-if",
						title: "Stress",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-3 text-xs text-muted",
								children: "Instantaneous shocks on current holdings. Currency shock applies to non-NOK FX."
							}),
							ASSET_IDS.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRow, {
								label: ASSET_SHORT[id],
								valueLabel: formatPct(assetShocks[id] ?? 0, 0, true),
								min: -40,
								max: 40,
								step: 1,
								value: (assetShocks[id] ?? 0) * 100,
								onChange: (n) => setAssetShocks((s) => ({
									...s,
									[id]: n / 100
								}))
							}, id)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRow, {
									label: "FX (USD/EUR)",
									valueLabel: formatPct(fxShock, 0, true),
									min: -30,
									max: 30,
									step: 1,
									value: fxShock * 100,
									onChange: (n) => setFxShock(n / 100)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 rounded-md border border-border p-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-muted",
									children: "Stressed P&L"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: cn("mt-1 font-mono text-lg", stress.pnl >= 0 ? "text-ok" : "text-danger"),
									children: [privacy ? formatPct(stress.pnlPct, 1, true) : formatMoney(stress.pnl, "NOK", false), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "ml-2 text-sm text-muted",
										children: formatPct(stress.pnlPct, 1, true)
									})]
								})]
							})
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-4 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					kicker: "Optimizer",
					title: "Efficient frontier",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-3 text-xs text-muted",
							children: "Long-only mean-variance on the CMA, 51 points. Click a point to read the weights. Caps: 50% per asset (bonds 70%, cash 40%), equities 90%, real estate 30%."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FrontierChart, {
							points: frontier,
							selected: Math.min(frontierIdx, frontier.length - 1),
							onSelect: setFrontierIdx,
							extra: [{
								label: "Risk parity",
								mu: parityMom.mu,
								vol: parityMom.vol
							}, {
								label: "Black–Litterman",
								mu: bl.mu.reduce((s, v, i) => s + v * bl.weights[i], 0),
								vol: Math.sqrt(bl.weights.reduce((s, w, i) => s + w * bl.weights.reduce((t, wj, j) => t + cmaCov[i][j] * wj, 0), 0))
							}]
						}),
						selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-3 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-xs text-muted",
							children: selected.weights.map((w, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: ASSET_SHORT[ASSET_IDS[i]] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatPct(w, 1) })]
							}, ASSET_IDS[i]))
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-xs text-muted",
							children: [
								"E[r] ",
								selected ? formatPct(selected.mu) : "—",
								" · σ ",
								selected ? formatPct(selected.vol) : "—"
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					kicker: "Views",
					title: "Risk parity and Black–Litterman",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mb-2 text-sm font-medium",
							children: "Risk parity"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mb-4 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-xs text-muted",
							children: parity.map((w, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: ASSET_SHORT[ASSET_IDS[i]] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatPct(w, 1) })]
							}, ASSET_IDS[i]))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mb-2 text-sm font-medium",
							children: "Black–Litterman views"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-2 sm:grid-cols-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Asset",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectInput, {
										value: String(blAsset),
										onChange: (e) => setBlAsset(Number(e.target.value)),
										children: ASSET_IDS.map((id, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: i,
											children: ASSET_SHORT[id]
										}, id))
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "E[r] %",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										className: "field-input h-11",
										type: "number",
										step: .1,
										value: (blMu * 100).toFixed(1),
										onChange: (e) => setBlMu(Number(e.target.value) / 100)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Confidence",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										className: "field-input h-11",
										type: "number",
										min: .05,
										max: .95,
										step: .05,
										value: blConf,
										onChange: (e) => setBlConf(Number(e.target.value))
									})
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "mt-3 h-11 rounded-md border border-border px-3 text-sm",
							onClick: () => setViews((v) => [...v.filter((x) => x.asset !== blAsset), {
								asset: blAsset,
								expected: blMu,
								confidence: blConf
							}]),
							children: "Add view"
						}),
						views.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-3 text-xs text-muted",
							children: views.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center justify-between py-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									ASSET_LABELS[ASSET_IDS[v.asset]],
									" ",
									formatPct(v.expected),
									" · c=",
									v.confidence
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "text-danger",
									onClick: () => setViews((xs) => xs.filter((x) => x.asset !== v.asset)),
									children: "Remove"
								})]
							}, v.asset))
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-xs text-muted",
							children: "No views — posterior equals implied equilibrium from the balanced book."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-3 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-xs text-muted",
							children: bl.weights.map((w, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: ASSET_SHORT[ASSET_IDS[i]] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatPct(w, 1) })]
							}, ASSET_IDS[i]))
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				kicker: "Planner",
				title: "CMA model books (from this optimizer)",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid gap-3 sm:grid-cols-5",
					children: books.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-md border border-border p-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-muted",
							children: b.name
						}), b.weights.map((w, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between font-mono text-[11px] text-muted",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: ASSET_SHORT[ASSET_IDS[i]] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatPct(w, 0) })]
						}, ASSET_IDS[i]))]
					}, b.id))
				})
			})
		]
	});
}
function Metric({ label, value, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-border bg-surface p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-xs text-muted",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 font-mono text-lg tabular-nums",
				children: value
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 text-[11px] text-subtle",
				children: hint
			}) : null
		]
	});
}
function RatioRow({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "flex justify-between border-b border-border py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-mono",
			children: value
		})]
	});
}
function RiskRoute() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RiskPage, {});
}
//#endregion
export { RiskRoute as component };
