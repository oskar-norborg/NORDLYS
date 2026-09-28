import { i as __toESM } from "../_runtime.mjs";
import { B as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { ht as useAppStore, it as cn, lt as formatPct, q as drawdownFromNav, s as usePortfolioStore, st as formatMoney } from "./router-DE00T9yP.mjs";
import { o as TextInput, r as Panel, t as Field } from "./field-CX5Y1XAQ.mjs";
import { t as PerformanceChart } from "./performance-chart-DnBrQo_v.mjs";
import { t as UnderwaterChart } from "./underwater-chart-CxEI4lI6.mjs";
import { C as trimResult, _ as runSweep, b as sliceSeries, c as compile, d as pickBestParams, f as pointFromResult, g as runBacktest, m as resolveBacktestData, n as DEFAULT_STRATEGY, p as requiredLookback, r as PARAM_STRATEGY, s as cartesian, t as DEFAULT_BACKTEST_CONFIG, u as linspace, w as tryCompile, x as sma, y as sliceFx } from "./sweep-DdRBD4po.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/backtest-CvkyWFtv.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FNS = /* @__PURE__ */ new Set([
	"sma",
	"ema",
	"rsi",
	"stdev",
	"momentum",
	"count"
]);
var KWS = /* @__PURE__ */ new Set([
	"universe",
	"rebalance",
	"monthly",
	"weekly",
	"daily",
	"for",
	"each",
	"asset",
	"if",
	"else",
	"and",
	"or",
	"not",
	"target_weight",
	"rebalance_to",
	"exit",
	"param"
]);
var SERIES = /* @__PURE__ */ new Set([
	"close",
	"open",
	"high",
	"low",
	"volume",
	"signals"
]);
function classifyIdent(name) {
	if (KWS.has(name)) return "tok-kw";
	if (FNS.has(name) || SERIES.has(name)) return "tok-fn";
	return "tok-id";
}
function highlight(source, err) {
	return source.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").map((line, idx) => {
		const segs = [];
		let i = 0;
		const ln = idx + 1;
		const push = (text, cls, startCol) => {
			if (!text) return;
			const endCol = startCol + text.length;
			const hit = err && err.line === ln && err.col <= endCol && err.endCol > startCol && text.trim().length > 0;
			segs.push({
				text,
				cls: hit ? `${cls} tok-err`.trim() : cls
			});
		};
		while (i < line.length) {
			const col = i + 1;
			const c = line[i];
			if (c === "#" || c === "/" && line[i + 1] === "/") {
				push(line.slice(i), "tok-cmt", col);
				break;
			}
			if (c === " " || c === "	") {
				let j = i;
				while (j < line.length && (line[j] === " " || line[j] === "	")) j += 1;
				push(line.slice(i, j), "", col);
				i = j;
				continue;
			}
			if (/[0-9]/.test(c) || c === "." && /[0-9]/.test(line[i + 1] ?? "")) {
				let j = i;
				while (j < line.length && /[0-9]/.test(line[j])) j += 1;
				if (line[j] === ".") {
					j += 1;
					while (j < line.length && /[0-9]/.test(line[j])) j += 1;
				}
				push(line.slice(i, j), "tok-num", col);
				i = j;
				continue;
			}
			if (/[A-Za-z_]/.test(c)) {
				let j = i;
				while (j < line.length && /[A-Za-z0-9_]/.test(line[j])) j += 1;
				const id = line.slice(i, j);
				push(id, classifyIdent(id), col);
				i = j;
				continue;
			}
			if ((c === ">" || c === "<" || c === "=" || c === "!") && line[i + 1] === "=") {
				push(line.slice(i, i + 2), "tok-op", col);
				i += 2;
				continue;
			}
			push(c, "tok-op", col);
			i += 1;
		}
		if (!segs.length) segs.push({
			text: " ",
			cls: ""
		});
		return segs;
	});
}
function StrategyEditor({ value, onChange, error }) {
	const compiled = (0, import_react.useMemo)(() => tryCompile(value), [value]);
	const err = error ?? (compiled.ok ? null : compiled.error);
	const lines = highlight(value, err);
	const preRef = (0, import_react.useRef)(null);
	const taRef = (0, import_react.useRef)(null);
	const gutterRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const ta = taRef.current;
		const pre = preRef.current;
		const gutter = gutterRef.current;
		if (!ta || !pre) return;
		const sync = () => {
			pre.scrollTop = ta.scrollTop;
			pre.scrollLeft = ta.scrollLeft;
			if (gutter) gutter.scrollTop = ta.scrollTop;
		};
		ta.addEventListener("scroll", sync);
		return () => ta.removeEventListener("scroll", sync);
	}, []);
	const onKeyDown = (e) => {
		if (e.key !== "Tab") return;
		e.preventDefault();
		const el = e.currentTarget;
		const start = el.selectionStart;
		const end = el.selectionEnd;
		onChange(value.slice(0, start) + "  " + value.slice(end));
		requestAnimationFrame(() => {
			el.selectionStart = el.selectionEnd = start + 2;
		});
	};
	const nLines = Math.max(1, value.split("\n").length);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "strategy-editor rounded-lg border border-border bg-surface-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref: gutterRef,
			className: "strategy-gutter",
			"aria-hidden": true,
			children: Array.from({ length: nLines }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("strategy-ln", err && err.line === i + 1 && "text-danger"),
				children: i + 1
			}, i))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "strategy-code",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
				ref: preRef,
				className: "strategy-pre",
				"aria-hidden": true,
				children: lines.map((segs, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "strategy-line",
					children: [segs.map((s, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: s.cls,
						children: s.text
					}, j)), "\n"]
				}, i))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				ref: taRef,
				className: "strategy-textarea",
				value,
				spellCheck: false,
				autoCapitalize: "off",
				autoCorrect: "off",
				autoComplete: "off",
				onChange: (e) => onChange(e.target.value),
				onKeyDown,
				"aria-label": "Strategy source"
			})]
		})]
	});
}
function ErrorBanner({ error }) {
	if (!error) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-md border border-danger/40 bg-surface px-3 py-2 font-mono text-xs text-danger",
		children: [
			"line ",
			error.line,
			", col ",
			error.col,
			": ",
			error.message
		]
	});
}
function token(name, fallback) {
	if (typeof window === "undefined") return fallback;
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
function CandlestickChart({ series, ticker, onTicker, tickers }) {
	const canvasRef = (0, import_react.useRef)(null);
	const wrapRef = (0, import_react.useRef)(null);
	const bars = series?.bars ?? [];
	const [view, setView] = (0, import_react.useState)(null);
	const drag = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		setView(null);
	}, [ticker, bars.length]);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		const wrap = wrapRef.current;
		if (!canvas || !wrap) return;
		const draw = () => {
			const dpr = window.devicePixelRatio || 1;
			const width = wrap.clientWidth;
			const height = Math.max(240, Math.min(360, Math.round(width * .42)));
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
			const warn = token("--color-warn", "#c4a574");
			const ok = token("--color-ok", "#7dba8a");
			const danger = token("--color-danger", "#c07070");
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, width, height);
			if (bars.length < 2) {
				ctx.fillStyle = muted;
				ctx.font = "12px IBM Plex Sans, sans-serif";
				ctx.fillText("No bars", 16, 24);
				return;
			}
			const a = view ? Math.max(0, Math.min(view.a, bars.length - 2)) : Math.max(0, bars.length - 180);
			const b = view ? Math.max(a + 1, Math.min(view.b, bars.length - 1)) : bars.length - 1;
			const slice = bars.slice(a, b + 1);
			const pad = {
				l: 52,
				r: 12,
				t: 20,
				b: 28
			};
			const plotW = width - pad.l - pad.r;
			const plotH = height - pad.t - pad.b;
			let lo = Infinity;
			let hi = -Infinity;
			for (const bar of slice) {
				lo = Math.min(lo, bar.low);
				hi = Math.max(hi, bar.high);
			}
			const closes = bars.map((x) => x.close);
			const sma50 = [];
			const sma200 = [];
			for (let i = 0; i < bars.length; i++) {
				sma50.push(sma(closes.slice(0, i + 1), 50));
				sma200.push(sma(closes.slice(0, i + 1), 200));
			}
			for (let i = a; i <= b; i++) {
				const s5 = sma50[i];
				const s2 = sma200[i];
				if (s5 != null) {
					lo = Math.min(lo, s5);
					hi = Math.max(hi, s5);
				}
				if (s2 != null) {
					lo = Math.min(lo, s2);
					hi = Math.max(hi, s2);
				}
			}
			if (!(hi > lo)) {
				lo *= .98;
				hi *= 1.02;
			}
			const span = hi - lo || 1;
			const slot = plotW / slice.length;
			const xOf = (i) => pad.l + (i + .5) * slot;
			const yOf = (v) => pad.t + (1 - (v - lo) / span) * plotH;
			ctx.strokeStyle = grid;
			ctx.fillStyle = muted;
			ctx.font = "10px IBM Plex Mono, monospace";
			ctx.lineWidth = 1;
			for (let i = 0; i <= 4; i++) {
				const v = lo + span * i / 4;
				const y = yOf(v);
				ctx.beginPath();
				ctx.moveTo(pad.l, y);
				ctx.lineTo(width - pad.r, y);
				ctx.stroke();
				ctx.fillText(v.toFixed(1), 6, y + 3);
			}
			const bodyW = Math.max(1, Math.min(8, slot * .7));
			slice.forEach((bar, i) => {
				const x = xOf(i);
				const up = bar.close >= bar.open;
				ctx.strokeStyle = up ? ok : danger;
				ctx.fillStyle = up ? ok : danger;
				ctx.beginPath();
				ctx.moveTo(x, yOf(bar.high));
				ctx.lineTo(x, yOf(bar.low));
				ctx.stroke();
				const y1 = yOf(Math.max(bar.open, bar.close));
				const y2 = yOf(Math.min(bar.open, bar.close));
				const h = Math.max(1, y2 - y1);
				ctx.fillRect(x - bodyW / 2, y1, bodyW, h);
			});
			const line = (arr, color) => {
				ctx.beginPath();
				ctx.strokeStyle = color;
				ctx.lineWidth = 1.4;
				let started = false;
				for (let i = a; i <= b; i++) {
					const v = arr[i];
					if (v == null) continue;
					const x = xOf(i - a);
					const y = yOf(v);
					if (!started) {
						ctx.moveTo(x, y);
						started = true;
					} else ctx.lineTo(x, y);
				}
				ctx.stroke();
			};
			line(sma50, accent);
			line(sma200, warn);
			ctx.fillStyle = muted;
			ctx.fillText(slice[0].date, pad.l, height - 8);
			ctx.fillText(slice[slice.length - 1].date, width - pad.r - 72, height - 8);
			ctx.fillStyle = accent;
			ctx.fillText("SMA 50", pad.l, 12);
			ctx.fillStyle = warn;
			ctx.fillText("SMA 200", pad.l + 64, 12);
		};
		draw();
		const ro = new ResizeObserver(draw);
		ro.observe(wrap);
		return () => ro.disconnect();
	}, [
		bars,
		view,
		ticker
	]);
	(0, import_react.useEffect)(() => {
		const wrap = wrapRef.current;
		if (!wrap) return;
		const handler = (e) => {
			if (!bars.length) return;
			e.preventDefault();
			const a0 = view?.a ?? Math.max(0, bars.length - 180);
			const b0 = view?.b ?? bars.length - 1;
			const span = Math.max(8, b0 - a0);
			const rect = wrap.getBoundingClientRect();
			const t = rect.width ? (e.clientX - rect.left) / rect.width : .5;
			const zoom = e.deltaY > 0 ? 1.18 : .85;
			const next = Math.max(8, Math.min(bars.length - 1, Math.round(span * zoom)));
			const center = a0 + t * span;
			let a = Math.round(center - t * next);
			let b = a + next;
			if (a < 0) {
				a = 0;
				b = next;
			}
			if (b > bars.length - 1) {
				b = bars.length - 1;
				a = Math.max(0, b - next);
			}
			setView({
				a,
				b
			});
		};
		wrap.addEventListener("wheel", handler, { passive: false });
		return () => wrap.removeEventListener("wheel", handler);
	}, [bars.length, view]);
	const onPointerDown = (e) => {
		const a0 = view?.a ?? Math.max(0, bars.length - 180);
		const b0 = view?.b ?? bars.length - 1;
		drag.current = {
			x: e.clientX,
			a: a0,
			b: b0
		};
		e.currentTarget.setPointerCapture(e.pointerId);
	};
	const onPointerMove = (e) => {
		if (!drag.current || !wrapRef.current) return;
		const { a, b, x } = drag.current;
		const span = b - a;
		const dx = e.clientX - x;
		const shift = Math.round(-dx / Math.max(1, wrapRef.current.clientWidth) * span);
		let na = a + shift;
		let nb = b + shift;
		if (na < 0) {
			na = 0;
			nb = span;
		}
		if (nb > bars.length - 1) {
			nb = bars.length - 1;
			na = Math.max(0, nb - span);
		}
		setView({
			a: na,
			b: nb
		});
	};
	const onPointerUp = () => {
		drag.current = null;
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-3 flex flex-wrap items-center gap-2",
		children: [tickers.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => onTicker(t),
			className: cn("h-11 rounded-md border px-3 text-xs font-medium", t === ticker ? "border-accent bg-accent text-accent-fg" : "border-border text-muted"),
			children: t
		}, t)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-xs text-subtle",
			children: "Scroll to zoom, drag to pan"
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: wrapRef,
		className: "w-full touch-none select-none",
		onPointerDown,
		onPointerMove,
		onPointerUp,
		onPointerCancel: onPointerUp,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			ref: canvasRef,
			className: "block w-full"
		})
	})] });
}
function addMonths(iso, n) {
	const d = /* @__PURE__ */ new Date(iso + "T00:00:00Z");
	d.setUTCMonth(d.getUTCMonth() + n);
	return d.toISOString().slice(0, 10);
}
function firstOnOrAfter(dates, iso) {
	for (let i = 0; i < dates.length; i++) if (dates[i] >= iso) return i;
	return dates.length;
}
function lastOnOrBefore(dates, iso) {
	for (let i = dates.length - 1; i >= 0; i--) if (dates[i] <= iso) return i;
	return -1;
}
function planFolds(dates, lookback, spec) {
	if (dates.length < lookback + 20) return [];
	const startDate = dates[lookback];
	const last = dates[dates.length - 1];
	const out = [];
	let cursor = startDate;
	let i = 0;
	while (true) {
		const trainStart = cursor;
		const trainEnd = addMonths(trainStart, spec.trainMonths);
		const testStart = trainEnd;
		const testEnd = addMonths(testStart, spec.testMonths);
		const t0 = firstOnOrAfter(dates, trainStart);
		const t1 = lastOnOrBefore(dates, trainEnd);
		const o0 = firstOnOrAfter(dates, testStart);
		const o1 = lastOnOrBefore(dates, testEnd);
		if (t1 - t0 < 10 || o1 - o0 < 5) break;
		if (dates[o1] > last) break;
		out.push({
			i,
			trainStart: dates[t0],
			trainEnd: dates[t1],
			testStart: dates[o0],
			testEnd: dates[o1]
		});
		i += 1;
		cursor = addMonths(cursor, spec.stepMonths);
		if (addMonths(cursor, spec.trainMonths + spec.testMonths) > last) break;
		if (out.length > 40) break;
	}
	return out;
}
function runWalkForward(program, series, fx, config, spec, onFold) {
	const dates = series[0]?.bars.map((b) => b.date) ?? [];
	const lookback = requiredLookback(program, {
		...Object.fromEntries(program.params.map((p) => [p.name, p.value])),
		...config.params
	});
	const planned = planFolds(dates, lookback, spec);
	const folds = [];
	const combined = [];
	let nav = config.initialCash;
	const grid = spec.grid ?? {};
	const sets = cartesian(grid);
	const total = Math.max(1, planned.length);
	for (let i = 0; i < planned.length; i++) {
		const p = planned[i];
		const trainSeries = sliceSeries(series, p.trainStart, p.trainEnd);
		const trainFx = sliceFx(fx, p.trainStart, p.trainEnd);
		let fitted = { ...config.params ?? {} };
		let isSharpe = 0;
		if (sets.length && Object.keys(grid).length) {
			const pts = sets.map((params) => {
				const r = runBacktest(program, trainSeries, trainFx, {
					...config,
					params: {
						...fitted,
						...params
					}
				});
				return pointFromResult(params, r.stats);
			});
			fitted = {
				...fitted,
				...pickBestParams(pts)
			};
			isSharpe = pts.reduce((m, x) => Math.max(m, x.sharpe), -Infinity);
		} else isSharpe = runBacktest(program, trainSeries, trainFx, {
			...config,
			params: fitted
		}).stats.sharpe;
		const histStart = dates[Math.max(0, dates.indexOf(p.testStart) - lookback)] ?? p.testStart;
		const oosSeries = sliceSeries(series, histStart, p.testEnd);
		const oosFx = sliceFx(fx, histStart, p.testEnd);
		const raw = runBacktest(program, oosSeries, oosFx, {
			...config,
			params: fitted,
			tradeStartDate: p.testStart,
			tradeEndDate: p.testEnd
		});
		const oos = trimResult(raw, p.testStart);
		const fold = {
			...p,
			params: fitted,
			isSharpe,
			oosSharpe: oos.stats.sharpe,
			oosReturn: oos.stats.totalReturn,
			oosMaxDd: oos.stats.maxDd,
			nTrades: oos.stats.nTrades
		};
		folds.push(fold);
		if (oos.equity.length) {
			const base = oos.equity[0].value || 1;
			for (const pt of oos.equity) combined.push({
				date: pt.date,
				value: nav * (pt.value / base),
				cash: pt.cash,
				invested: pt.invested
			});
			const last = oos.equity[oos.equity.length - 1];
			nav = nav * (last.value / base);
		}
		onFold?.(i + 1, total, fold);
	}
	return {
		folds,
		combined
	};
}
var seq = 1;
var workerFailed = false;
var pool = [];
var pending = /* @__PURE__ */ new Map();
function poolSize() {
	if (typeof navigator === "undefined") return 1;
	return Math.max(1, Math.min(4, navigator.hardwareConcurrency || 2));
}
function spawn() {
	if (workerFailed || typeof window === "undefined" || typeof Worker === "undefined") return null;
	try {
		const w = new Worker(new URL("./backtest.worker.ts", import.meta.url), { type: "module" });
		w.onmessage = (e) => {
			const msg = e.data;
			const job = pending.get(msg.id);
			if (!job) return;
			if (msg.ok && msg.kind === "progress") {
				job.onProgress?.(msg.done, msg.total, msg.label);
				return;
			}
			pending.delete(msg.id);
			job.resolve(msg);
		};
		w.onerror = () => {
			workerFailed = true;
		};
		return w;
	} catch {
		workerFailed = true;
		return null;
	}
}
function getPool() {
	if (workerFailed) return [];
	while (pool.length < poolSize()) {
		const w = spawn();
		if (!w) break;
		pool.push(w);
	}
	return pool;
}
function post(req, onProgress) {
	const workers = getPool();
	if (!workers.length) return Promise.resolve(runLocal(req, onProgress));
	const w = workers[req.id % workers.length];
	return new Promise((resolve) => {
		pending.set(req.id, {
			id: req.id,
			resolve,
			onProgress
		});
		w.postMessage(req);
	});
}
function runLocal(req, onProgress) {
	try {
		const program = compile(req.source);
		if (req.kind === "backtest") return {
			id: req.id,
			ok: true,
			kind: "backtest",
			result: runBacktest(program, req.series, req.fx, req.config)
		};
		if (req.kind === "sweep") {
			const result = runSweep(program, req.series, req.fx, req.config, req.grid, (done, total) => onProgress?.(done, total, "sweep"));
			return {
				id: req.id,
				ok: true,
				kind: "sweep",
				result
			};
		}
		const result = runWalkForward(program, req.series, req.fx, req.config, req.spec, (done, total) => onProgress?.(done, total, "walk-forward"));
		return {
			id: req.id,
			ok: true,
			kind: "walkforward",
			result
		};
	} catch (err) {
		return {
			id: req.id,
			ok: false,
			error: err instanceof Error ? err.message : String(err)
		};
	}
}
async function runSweepJob(source, series, fx, config, grid, onProgress) {
	const res = await post({
		id: ++seq,
		kind: "sweep",
		source,
		series,
		fx,
		config,
		grid
	}, (d, t) => onProgress?.(d, t));
	if (!res.ok) throw new Error(res.error);
	if (res.kind !== "sweep") throw new Error("Unexpected worker result");
	return res.result;
}
async function runWalkForwardJob(source, series, fx, config, spec, onProgress) {
	const res = await post({
		id: ++seq,
		kind: "walkforward",
		source,
		series,
		fx,
		config,
		spec
	}, (d, t) => onProgress?.(d, t));
	if (!res.ok) throw new Error(res.error);
	if (res.kind !== "walkforward") throw new Error("Unexpected worker result");
	return res.result;
}
var STORE_KEY = "nordlys.backtest.v1";
function loadStored() {
	const base = {
		source: DEFAULT_STRATEGY,
		costBps: DEFAULT_BACKTEST_CONFIG.costBps,
		slippageBps: DEFAULT_BACKTEST_CONFIG.slippageBps,
		cashYieldPct: DEFAULT_BACKTEST_CONFIG.cashYield * 100,
		ticker: "MSFT"
	};
	if (typeof window === "undefined") return base;
	try {
		const raw = window.localStorage.getItem(STORE_KEY);
		if (!raw) return base;
		const p = JSON.parse(raw);
		return {
			source: typeof p.source === "string" && p.source.length ? p.source : base.source,
			costBps: Number.isFinite(p.costBps) ? Number(p.costBps) : base.costBps,
			slippageBps: Number.isFinite(p.slippageBps) ? Number(p.slippageBps) : base.slippageBps,
			cashYieldPct: Number.isFinite(p.cashYieldPct) ? Number(p.cashYieldPct) : base.cashYieldPct,
			ticker: typeof p.ticker === "string" ? p.ticker : base.ticker
		};
	} catch {
		return base;
	}
}
function Metric({ label, value, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-md border border-border p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-xs text-muted",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 font-mono text-lg tabular-nums text-fg",
				children: value
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 text-xs text-subtle",
				children: hint
			}) : null
		]
	});
}
function BacktestPage() {
	const mode = useAppStore((s) => s.mode);
	const privacy = useAppStore((s) => s.privacy);
	const demo = usePortfolioStore((s) => s.demo);
	const mydata = usePortfolioStore((s) => s.mydata);
	const ledger = mode === "demo" ? demo : mydata;
	const [source, setSource] = (0, import_react.useState)(DEFAULT_STRATEGY);
	const [costBps, setCostBps] = (0, import_react.useState)(DEFAULT_BACKTEST_CONFIG.costBps);
	const [slippageBps, setSlippageBps] = (0, import_react.useState)(DEFAULT_BACKTEST_CONFIG.slippageBps);
	const [cashYieldPct, setCashYieldPct] = (0, import_react.useState)(DEFAULT_BACKTEST_CONFIG.cashYield * 100);
	const [ticker, setTicker] = (0, import_react.useState)("MSFT");
	const [result, setResult] = (0, import_react.useState)(null);
	const [runError, setRunError] = (0, import_react.useState)(null);
	const [missing, setMissing] = (0, import_react.useState)([]);
	const [busy, setBusy] = (0, import_react.useState)(null);
	const [progress, setProgress] = (0, import_react.useState)(null);
	const [sweep, setSweep] = (0, import_react.useState)(null);
	const [walk, setWalk] = (0, import_react.useState)(null);
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	const [trainMonths, setTrainMonths] = (0, import_react.useState)(24);
	const [testMonths, setTestMonths] = (0, import_react.useState)(12);
	const [stepMonths, setStepMonths] = (0, import_react.useState)(12);
	(0, import_react.useEffect)(() => {
		const s = loadStored();
		setSource(s.source);
		setCostBps(s.costBps);
		setSlippageBps(s.slippageBps);
		setCashYieldPct(s.cashYieldPct);
		setTicker(s.ticker);
		setHydrated(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!hydrated || typeof window === "undefined") return;
		const payload = {
			source,
			costBps,
			slippageBps,
			cashYieldPct,
			ticker
		};
		try {
			window.localStorage.setItem(STORE_KEY, JSON.stringify(payload));
		} catch {}
	}, [
		hydrated,
		source,
		costBps,
		slippageBps,
		cashYieldPct,
		ticker
	]);
	const compiled = (0, import_react.useMemo)(() => tryCompile(source), [source]);
	const compileError = compiled.ok ? null : compiled.error;
	const config = (0, import_react.useMemo)(() => ({
		costBps,
		slippageBps,
		cashYield: cashYieldPct / 100,
		initialCash: DEFAULT_BACKTEST_CONFIG.initialCash
	}), [
		costBps,
		slippageBps,
		cashYieldPct
	]);
	const resolved = (0, import_react.useMemo)(() => {
		if (!compiled.ok) return null;
		return resolveBacktestData(mode, compiled.program.universe.map((u) => u.ticker), ledger);
	}, [
		compiled,
		mode,
		ledger
	]);
	const run = (0, import_react.useCallback)(() => {
		if (!compiled.ok) return;
		const data = resolveBacktestData(mode, compiled.program.universe.map((u) => u.ticker), ledger);
		if (!data.ok) {
			setResult(null);
			setMissing(data.missing);
			setRunError(data.message);
			return;
		}
		setMissing([]);
		setRunError(null);
		setBusy("run");
		try {
			const r = runBacktest(compiled.program, data.series, data.fx, config);
			setResult(r);
			if (!data.series.some((s) => s.ticker === ticker)) setTicker(data.series[0]?.ticker ?? ticker);
		} catch (e) {
			setRunError(e instanceof Error ? e.message : String(e));
		} finally {
			setBusy(null);
		}
	}, [
		compiled,
		mode,
		ledger,
		config,
		ticker
	]);
	(0, import_react.useEffect)(() => {
		if (!hydrated) return;
		const handle = window.setTimeout(() => run(), 350);
		return () => window.clearTimeout(handle);
	}, [hydrated, run]);
	const paramGrid = (0, import_react.useMemo)(() => {
		if (!compiled.ok || !compiled.program.params.length) return {};
		const g = {};
		for (const p of compiled.program.params) {
			const v = p.value;
			if (/rsi/i.test(p.name)) g[p.name] = linspace(Math.max(10, v - 10), Math.min(90, v + 10), 10);
			else if (v >= 80) g[p.name] = linspace(Math.max(20, v - 50), v + 50, 50);
			else g[p.name] = linspace(Math.max(5, v - 20), v + 20, 20);
		}
		return g;
	}, [compiled]);
	const onSweep = async () => {
		if (!compiled.ok) return;
		if (!Object.keys(paramGrid).length) {
			setRunError("Declare param name = value in the strategy to sweep, or load the parameterized example.");
			return;
		}
		const data = resolveBacktestData(mode, compiled.program.universe.map((u) => u.ticker), ledger);
		if (!data.ok) {
			setMissing(data.missing);
			setRunError(data.message);
			return;
		}
		setBusy("sweep");
		setProgress({
			done: 0,
			total: 1,
			label: "sweep"
		});
		setRunError(null);
		try {
			const r = await runSweepJob(source, data.series, data.fx, config, paramGrid, (done, total) => setProgress({
				done,
				total,
				label: "sweep"
			}));
			setSweep(r);
		} catch (e) {
			setRunError(e instanceof Error ? e.message : String(e));
		} finally {
			setBusy(null);
			setProgress(null);
		}
	};
	const onWalk = async () => {
		if (!compiled.ok) return;
		const data = resolveBacktestData(mode, compiled.program.universe.map((u) => u.ticker), ledger);
		if (!data.ok) {
			setMissing(data.missing);
			setRunError(data.message);
			return;
		}
		setBusy("walk");
		setProgress({
			done: 0,
			total: 1,
			label: "walk-forward"
		});
		setRunError(null);
		try {
			const r = await runWalkForwardJob(source, data.series, data.fx, config, {
				trainMonths,
				testMonths,
				stepMonths,
				grid: Object.keys(paramGrid).length ? paramGrid : void 0
			}, (done, total) => setProgress({
				done,
				total,
				label: "walk-forward"
			}));
			setWalk(r);
		} catch (e) {
			setRunError(e instanceof Error ? e.message : String(e));
		} finally {
			setBusy(null);
			setProgress(null);
		}
	};
	const dd = (0, import_react.useMemo)(() => result ? drawdownFromNav(result.equity.map((p) => ({
		date: p.date,
		value: p.value,
		cash: p.cash,
		holdings: p.invested,
		externalCf: 0
	}))) : null, [result]);
	const candleSeries = resolved?.ok ? resolved.series.find((s) => s.ticker === ticker) ?? resolved.series[0] ?? null : null;
	const universe = compiled.ok ? compiled.program.universe.map((u) => u.ticker) : [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-[1180px] px-4 py-6 sm:px-6 sm:py-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "kicker mb-2",
					children: "Historical replay"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-medium tracking-tight",
					children: "Backtest"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 max-w-2xl text-sm text-muted",
					children: "Write a strategy. close is this bar; close[1] is the previous close. Signals use that day's close; orders fill at the next session. Demo prices are seeded OHLC for MSFT, KOG, MOWI and DNB. My Data uses only imported history."
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-4 lg:flex-row lg:items-start",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 flex-1 flex-col gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
						kicker: "Language",
						title: "Strategy",
						action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-11 rounded-md border border-border px-3 text-xs",
								onClick: () => setSource(DEFAULT_STRATEGY),
								children: "Example"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-11 rounded-md border border-border px-3 text-xs",
								onClick: () => setSource(PARAM_STRATEGY),
								children: "With params"
							})]
						}),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StrategyEditor, {
								value: source,
								onChange: setSource,
								error: compileError
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorBanner, { error: compileError })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-3 text-xs leading-relaxed text-muted",
								children: [
									"History: ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono text-fg",
										children: "close"
									}),
									" is this bar,",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono text-fg",
										children: "close[1]"
									}),
									" the previous close,",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono text-fg",
										children: "close[2]"
									}),
									" two bars ago. Negative offsets are a parse error — the series cannot read the future."
								]
							}),
							compiled.ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-3 text-xs text-muted",
								children: [
									"Universe ",
									compiled.program.universe.map((u) => u.ticker).join(", "),
									" · rebalance",
									" ",
									compiled.program.rebalance,
									compiled.program.params.length ? ` · params ${compiled.program.params.map((p) => `${p.name}=${p.value}`).join(", ")}` : ""
								]
							}) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
						kicker: "Book",
						title: "Equity vs equal-weight buy-and-hold",
						children: result && result.equity.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PerformanceChart, {
							portfolio: result.equity,
							benchmark: result.benchmark,
							benchmarkLabel: "Buy & hold",
							privacy,
							currency: "NOK"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: busy ? "Running…" : "No equity yet."
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
						kicker: "Risk",
						title: "Drawdown",
						children: dd && dd.underwater.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UnderwaterChart, { series: dd.underwater }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "Drawdown appears after a run."
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
						id: "candles",
						kicker: "Price",
						title: "Candles with SMA 50 / 200",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CandlestickChart, {
							series: candleSeries,
							ticker: candleSeries?.ticker ?? ticker,
							onTicker: setTicker,
							tickers: universe
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
						kicker: "Fills",
						title: "Trade list",
						children: result && result.trades.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "overflow-x-auto",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
								className: "w-full min-w-[40rem] text-left text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-b border-border text-xs text-muted",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "px-2 py-2 font-medium",
											children: "Fill"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "px-2 py-2 font-medium",
											children: "Signal"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "px-2 py-2 font-medium",
											children: "Ticker"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "px-2 py-2 font-medium",
											children: "Side"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "px-2 py-2 font-medium",
											children: "Native"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "px-2 py-2 font-medium",
											children: "NOK"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "px-2 py-2 font-medium",
											children: "Cost"
										})
									]
								}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: result.trades.slice(0, 80).map((tr, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-b border-border last:border-0",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-2 py-2 font-mono text-xs",
											children: tr.date
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-2 py-2 font-mono text-xs text-muted",
											children: tr.signalDate
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-2 py-2",
											children: tr.ticker
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: cn("px-2 py-2", tr.side === "buy" ? "text-ok" : "text-danger"),
											children: tr.side
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-2 py-2 font-mono text-xs",
											children: privacy ? "••••" : tr.priceNative.toFixed(2)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-2 py-2 font-mono text-xs",
											children: formatMoney(tr.valueNok, "NOK", privacy)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-2 py-2 font-mono text-xs",
											children: formatMoney(tr.costNok, "NOK", privacy)
										})
									]
								}, `${tr.date}-${tr.ticker}-${i}`)) })]
							}), result.trades.length > 80 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 text-xs text-subtle",
								children: [result.trades.length, " fills — first 80 shown."]
							}) : null]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "No fills. A cold SMA 200 needs 200 sessions before the first order."
						})
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex w-full shrink-0 flex-col gap-4 lg:w-80",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
						kicker: "Costs",
						title: "Market frictions",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Commission bp",
									hint: "Round-trip is charged on each fill",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
										type: "number",
										min: 0,
										step: 1,
										value: costBps,
										onChange: (e) => setCostBps(Number(e.target.value))
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Slippage bp",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
										type: "number",
										min: 0,
										step: 1,
										value: slippageBps,
										onChange: (e) => setSlippageBps(Number(e.target.value))
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Cash yield %",
									hint: "Annual, applied daily on uninvested cash",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
										type: "number",
										min: 0,
										step: .1,
										value: cashYieldPct,
										onChange: (e) => setCashYieldPct(Number(e.target.value))
									})
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
						kicker: "Run",
						title: "Engine",
						children: [
							mode === "mydata" && missing.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mb-3 text-sm text-danger",
								children: [
									"Missing imported prices: ",
									missing.join(", "),
									". Import a price/NAV file for each ticker. Demo series are never used here."
								]
							}) : null,
							runError && !missing.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-3 text-sm text-danger",
								children: runError
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-11 w-full rounded-md bg-accent text-sm font-medium text-accent-fg disabled:opacity-50",
								disabled: Boolean(compileError) || busy !== null,
								onClick: run,
								children: busy === "run" ? "Running…" : "Run backtest"
							}),
							progress ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mb-1 flex justify-between text-xs text-muted",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: progress.label }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-mono",
										children: [
											progress.done,
											" / ",
											progress.total
										]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-2 overflow-hidden rounded-full bg-surface-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "h-full bg-accent",
										style: { width: `${progress.total ? 100 * progress.done / progress.total : 0}%` }
									})
								})]
							}) : null
						]
					}),
					result ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
						kicker: "Stage 3",
						title: "Risk metrics",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Return",
									value: formatPct(result.stats.totalReturn, 1, true)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Ann. return",
									value: formatPct(result.stats.annReturn, 1, true)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Vol",
									value: formatPct(result.stats.vol, 1)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Sharpe",
									value: result.stats.sharpe.toFixed(2)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Sortino",
									value: result.stats.sortino.toFixed(2)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Calmar",
									value: result.stats.calmar.toFixed(2)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Max DD",
									value: formatPct(result.stats.maxDd, 1)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "VaR 95",
									value: formatPct(result.stats.var95, 2)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "ES 95",
									value: formatPct(result.stats.es95, 2)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Trades",
									value: String(result.stats.nTrades)
								})
							]
						}), result.readyDate ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-xs text-muted",
							children: [
								"Indicators ready ",
								result.readyDate,
								". First fill ",
								result.stats.firstFillDate ?? "—",
								" at",
								" ",
								privacy ? "••••" : result.stats.firstFillPrice?.toFixed(2) ?? "—",
								" ",
								result.stats.firstFillTicker ?? "",
								"."
							]
						}) : null]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
						kicker: "Workers",
						title: "Parameter sweep",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-3 text-xs text-muted",
								children: "Runs the declared params on a small grid in Web Workers. Load “With params” if the example has none. Ranked on in-sample Sharpe (first 70% of the calendar). Out-of-sample is the later 30% with the same lookback so indicators are warm."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-11 w-full rounded-md border border-border text-sm disabled:opacity-50",
								disabled: Boolean(compileError) || busy !== null,
								onClick: () => void onSweep(),
								children: busy === "sweep" ? "Sweeping…" : "Sweep parameters"
							}),
							sweep?.best ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-3 text-xs text-muted",
								children: [
									"Best in-sample Sharpe ",
									sweep.best.sharpe.toFixed(2),
									" (out-of-sample",
									" ",
									sweep.best.oosSharpe.toFixed(2),
									") at",
									" ",
									Object.entries(sweep.best.params).map(([k, v]) => `${k}=${v}`).join(", ") || "defaults",
									"."
								]
							}) : null,
							sweep && sweep.points.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-xs leading-relaxed text-muted",
								children: "A wide gap between in-sample and out-of-sample is a sign of overfitting — do not pick a parameter set from in-sample alone."
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 max-h-56 overflow-auto",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
									className: "w-full min-w-[28rem] text-left text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "text-muted",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "py-1 font-medium",
												children: "Params"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "py-1 font-medium",
												children: "IS Sh"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "py-1 font-medium",
												children: "OOS Sh"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "py-1 font-medium",
												children: "IS Ret"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "py-1 font-medium",
												children: "OOS Ret"
											})
										]
									}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: sweep.points.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "border-t border-border",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "py-1 font-mono",
												children: Object.entries(p.params).map(([k, v]) => `${k}=${v}`).join(" ")
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "py-1 font-mono",
												children: p.sharpe.toFixed(2)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "py-1 font-mono",
												children: p.oosSharpe.toFixed(2)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "py-1 font-mono",
												children: formatPct(p.totalReturn, 0)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "py-1 font-mono",
												children: formatPct(p.oosReturn, 0)
											})
										]
									}, i)) })]
								})
							})] }) : busy === "sweep" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm text-muted",
								children: "Sweeping the grid…"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm text-muted",
								children: "No sweep yet. Run one to compare in-sample and out-of-sample."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
						kicker: "Workers",
						title: "Walk-forward",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-3 grid grid-cols-3 gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Train mo",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
											type: "number",
											min: 6,
											value: trainMonths,
											onChange: (e) => setTrainMonths(Number(e.target.value))
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Test mo",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
											type: "number",
											min: 3,
											value: testMonths,
											onChange: (e) => setTestMonths(Number(e.target.value))
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "Step mo",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
											type: "number",
											min: 1,
											value: stepMonths,
											onChange: (e) => setStepMonths(Number(e.target.value))
										})
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-11 w-full rounded-md border border-border text-sm disabled:opacity-50",
								disabled: Boolean(compileError) || busy !== null,
								onClick: () => void onWalk(),
								children: busy === "walk" ? "Walking…" : "Walk-forward"
							}),
							walk && walk.folds.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 max-h-56 overflow-auto",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
									className: "w-full text-left text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "text-muted",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "py-1 font-medium",
												children: "OOS"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "py-1 font-medium",
												children: "IS Sh"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "py-1 font-medium",
												children: "OOS Sh"
											})
										]
									}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: walk.folds.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "border-t border-border",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
												className: "py-1 font-mono",
												children: [
													f.testStart.slice(0, 7),
													"–",
													f.testEnd.slice(0, 7)
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "py-1 font-mono",
												children: f.isSharpe.toFixed(2)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "py-1 font-mono",
												children: f.oosSharpe.toFixed(2)
											})
										]
									}, f.i)) })]
								})
							}) : busy === "walk" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm text-muted",
								children: "Walking the windows…"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm text-muted",
								children: "No walk-forward yet. Train, test and step set the window sizes."
							})
						]
					})
				]
			})]
		})]
	});
}
function BacktestRoute() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BacktestPage, {});
}
//#endregion
export { BacktestRoute as component };
