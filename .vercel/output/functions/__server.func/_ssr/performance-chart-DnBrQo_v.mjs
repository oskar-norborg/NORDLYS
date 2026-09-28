import { i as __toESM } from "../_runtime.mjs";
import { B as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/performance-chart-DnBrQo_v.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function token(name, fallback) {
	if (typeof window === "undefined") return fallback;
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
function PerformanceChart({ portfolio, benchmark, benchmarkLabel, privacy, currency }) {
	const canvasRef = (0, import_react.useRef)(null);
	const wrapRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		const wrap = wrapRef.current;
		if (!canvas || !wrap) return;
		const draw = () => {
			const dpr = window.devicePixelRatio || 1;
			const width = wrap.clientWidth;
			const height = Math.max(220, Math.min(320, Math.round(width * .38)));
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
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, width, height);
			if (portfolio.length < 2) return;
			const pad = {
				l: 48,
				r: 12,
				t: 16,
				b: 28
			};
			const plotW = width - pad.l - pad.r;
			const plotH = height - pad.t - pad.b;
			const p0 = portfolio[0].value || 1;
			const hasBench = benchmark.length >= 2;
			const b0 = hasBench ? benchmark[0].value || 1 : 1;
			const p = portfolio.map((x) => x.value / p0 * 100);
			const b = hasBench ? benchmark.map((x) => x.value / b0 * 100) : [];
			let min = Infinity;
			let max = -Infinity;
			for (const v of p) {
				min = Math.min(min, v);
				max = Math.max(max, v);
			}
			for (const v of b) {
				min = Math.min(min, v);
				max = Math.max(max, v);
			}
			if (min === max) {
				min *= .95;
				max *= 1.05;
			}
			const span = max - min || 1;
			const xOf = (i, n) => pad.l + i / Math.max(1, n - 1) * plotW;
			const yOf = (v) => pad.t + (1 - (v - min) / span) * plotH;
			ctx.strokeStyle = grid;
			ctx.lineWidth = 1;
			ctx.font = "10px IBM Plex Mono, monospace";
			ctx.fillStyle = muted;
			for (let i = 0; i <= 4; i++) {
				const v = min + span * i / 4;
				const y = yOf(v);
				ctx.beginPath();
				ctx.moveTo(pad.l, y);
				ctx.lineTo(width - pad.r, y);
				ctx.stroke();
				ctx.fillText(v.toFixed(0), 8, y + 3);
			}
			const line = (arr, color) => {
				ctx.beginPath();
				ctx.strokeStyle = color;
				ctx.lineWidth = 1.6;
				arr.forEach((v, i) => {
					const x = xOf(i, arr.length);
					const y = yOf(v);
					if (i === 0) ctx.moveTo(x, y);
					else ctx.lineTo(x, y);
				});
				ctx.stroke();
			};
			if (b.length > 1) line(b, warn);
			line(p, accent);
			ctx.fillStyle = muted;
			ctx.fillText(portfolio[0].date.slice(0, 7), pad.l, height - 8);
			ctx.fillText(portfolio[portfolio.length - 1].date.slice(0, 7), width - pad.r - 44, height - 8);
			ctx.fillStyle = accent;
			ctx.fillText("Portfolio", pad.l, 12);
			if (b.length > 1) {
				ctx.fillStyle = warn;
				ctx.fillText(benchmarkLabel, pad.l + 78, 12);
			}
		};
		draw();
		const ro = new ResizeObserver(draw);
		ro.observe(wrap);
		return () => ro.disconnect();
	}, [
		portfolio,
		benchmark,
		benchmarkLabel,
		privacy,
		currency
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: wrapRef,
		className: "w-full",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			ref: canvasRef,
			className: "block w-full"
		})
	});
}
//#endregion
export { PerformanceChart as t };
