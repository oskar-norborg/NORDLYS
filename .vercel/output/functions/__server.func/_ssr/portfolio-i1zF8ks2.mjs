import { i as __toESM } from "../_runtime.mjs";
import { B as require_jsx_runtime, y as useNavigate, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as resolveBenchmarkSeries, G as computeReturns, O as BENCHMARKS, U as annualize, _t as ASSET_LABELS, h as effectivePortfolio, ht as useAppStore, it as cn, k as DEMO_AS_OF, kt as TX_KIND_LABELS, lt as formatPct, r as buildPortfolioReportPdf, rt as computeHoldings, s as usePortfolioStore, st as formatMoney } from "./router-DE00T9yP.mjs";
import { i as SelectInput, r as Panel, t as Field } from "./field-CX5Y1XAQ.mjs";
import { t as PerformanceChart } from "./performance-chart-DnBrQo_v.mjs";
import { n as PdfDownloadButton, t as GapPanel } from "./download-button-OlItG-DI.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/portfolio-i1zF8ks2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var COLORS = {
	global_eq: "#8fbfb2",
	us_eq: "#6a9b8f",
	nordic_eq: "#c4a574",
	bonds: "#7d9bb0",
	real_estate: "#a09078",
	cash: "#5c6560"
};
function token(name, fallback) {
	if (typeof window === "undefined") return fallback;
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
function AllocationChart({ slices }) {
	const canvasRef = (0, import_react.useRef)(null);
	const wrapRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		const wrap = wrapRef.current;
		if (!canvas || !wrap) return;
		const draw = () => {
			const dpr = window.devicePixelRatio || 1;
			const width = wrap.clientWidth;
			const height = 220;
			canvas.width = Math.floor(width * dpr);
			canvas.height = Math.floor(height * dpr);
			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, width, height);
			const cx = 90;
			const cy = height / 2;
			const r = 72;
			let a0 = -Math.PI / 2;
			const active = slices.filter((s) => s.weight > 5e-4);
			if (active.length === 0) {
				ctx.strokeStyle = token("--color-border", "#232a27");
				ctx.beginPath();
				ctx.arc(cx, cy, r, 0, Math.PI * 2);
				ctx.stroke();
				return;
			}
			for (const s of active) {
				const a1 = a0 + s.weight * Math.PI * 2;
				ctx.beginPath();
				ctx.moveTo(cx, cy);
				ctx.arc(cx, cy, r, a0, a1);
				ctx.closePath();
				ctx.fillStyle = COLORS[s.assetClass];
				ctx.fill();
				a0 = a1;
			}
			ctx.beginPath();
			ctx.arc(cx, cy, 42, 0, Math.PI * 2);
			ctx.fillStyle = token("--color-surface", "#101513");
			ctx.fill();
			ctx.font = "12px IBM Plex Sans, sans-serif";
			ctx.textBaseline = "middle";
			let y = 28;
			for (const s of slices) {
				ctx.fillStyle = COLORS[s.assetClass];
				ctx.fillRect(190, y - 5, 8, 8);
				ctx.fillStyle = token("--color-fg", "#e4eae6");
				ctx.fillText(ASSET_LABELS[s.assetClass], 206, y);
				ctx.fillStyle = token("--color-muted", "#8b958f");
				ctx.fillText(formatPct(s.weight, 1), width - 16 - ctx.measureText(formatPct(s.weight, 1)).width, y);
				y += 28;
			}
		};
		draw();
		const ro = new ResizeObserver(draw);
		ro.observe(wrap);
		return () => ro.disconnect();
	}, [slices]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: wrapRef,
		className: "w-full",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			ref: canvasRef,
			className: "block w-full"
		})
	});
}
function asOf() {
	return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function PortfolioPage() {
	const navigate = useNavigate();
	const mode = useAppStore((s) => s.mode);
	const privacy = useAppStore((s) => s.privacy);
	const profile = useAppStore((s) => s.profile);
	const whatIf = useAppStore((s) => s.whatIf);
	const cma = useAppStore((s) => s.cma);
	const setProfile = useAppStore((s) => s.setProfile);
	const demo = usePortfolioStore((s) => s.demo);
	const mydata = usePortfolioStore((s) => s.mydata);
	const costMethod = usePortfolioStore((s) => s.costMethod);
	const setCostMethod = usePortfolioStore((s) => s.setCostMethod);
	const benchmarkId = usePortfolioStore((s) => s.benchmarkId);
	const setBenchmark = usePortfolioStore((s) => s.setBenchmark);
	const markUsedAsClient = usePortfolioStore((s) => s.markUsedAsClient);
	const ledger = mode === "demo" ? demo : mydata;
	const date = mode === "demo" ? DEMO_AS_OF : asOf();
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
	const model = effectivePortfolio(profile, whatIf, cma);
	const bench = BENCHMARKS.find((b) => b.id === benchmarkId) ?? BENCHMARKS[0];
	const navIdx = (0, import_react.useMemo)(() => {
		const pts = returns.nav.filter((_, i) => i % 2 === 0 || i === returns.nav.length - 1);
		const src = pts.length >= 2 ? pts : returns.nav;
		const base = src[0]?.value || 1;
		return src.map((p) => ({
			date: p.date,
			value: p.value,
			idx: p.value / base * 100
		}));
	}, [returns.nav]);
	const benchSeries = (0, import_react.useMemo)(() => resolveBenchmarkSeries(ledger, bench.id, mode, navIdx.map((p) => p.date)), [
		ledger,
		bench.id,
		mode,
		navIdx
	]);
	const twrAnn = annualize(returns.twr, returns.startDate, returns.endDate);
	const priceStale = holdings.holdings.some((h) => h.priceStale);
	const fxStale = holdings.holdings.some((h) => h.fxStale);
	const showBenchmark = benchSeries.length >= 2;
	const useAsClient = () => {
		setProfile({ currentAssets: Math.round(holdings.totalMarket) });
		markUsedAsClient(holdings.totalMarket);
		navigate({ to: "/" });
	};
	if (ledger.transactions.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-[1100px] px-4 py-6 sm:px-6 sm:py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "kicker mb-2",
				children: "Holdings"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-medium tracking-tight",
				children: "Portfolio"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-4 rounded-lg border border-border bg-surface px-4 py-6 text-sm text-muted",
				children: [
					"No transactions in ",
					mode === "demo" ? "Demo" : "My Data",
					". Open Import and load a Nordnet file, or the demo export — Demo and My Data run the same parser."
				]
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-6 flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "kicker mb-2",
						children: "Holdings"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-2xl font-medium tracking-tight",
						children: "Portfolio"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-muted",
						children: [
							"Base currency NOK · as of ",
							date,
							priceStale ? " · prices from last trade (stale)" : "",
							fxStale ? " · FX not imported (stale)" : "",
							privacy ? " · Privacy on" : ""
						]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PdfDownloadButton, {
							label: "Download report PDF",
							build: () => buildPortfolioReportPdf({
								ledger,
								profile,
								cma,
								whatIf,
								costMethod,
								privacy,
								asOf: date,
								mode
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "inline-flex rounded-full border border-border p-0.5",
							children: ["fifo", "average"].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setCostMethod(m),
								className: cn("h-9 rounded-full px-3 text-xs font-medium", costMethod === m ? "bg-accent text-accent-fg" : "text-muted"),
								children: m === "fifo" ? "FIFO" : "Average cost"
							}, m))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: useAsClient,
							className: "h-11 rounded-md bg-accent px-4 text-sm text-accent-fg",
							children: "Use as client"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Market value",
						value: privacy ? "••••" : formatMoney(holdings.totalMarket, "NOK", false)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Cash",
						value: privacy ? "••••" : formatMoney(holdings.cash, "NOK", false)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Unrealized P&L",
						value: privacy ? formatPct(holdings.totalUnrealized / Math.max(holdings.totalCost, 1), 1, true) : formatMoney(holdings.totalUnrealized, "NOK", false)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Realized P&L",
						value: privacy ? "••••" : formatMoney(holdings.totalRealized, "NOK", false)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 grid gap-3 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Time-weighted",
						value: formatPct(returns.twr, 1, true),
						hint: `annualized ${formatPct(twrAnn, 1, true)}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Money-weighted (XIRR)",
						value: Number.isFinite(returns.xirr) ? formatPct(returns.xirr, 1, true) : "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Price / currency effect",
						value: privacy ? `${formatPct(holdings.totalPriceEffect / Math.max(holdings.totalCost, 1), 1, true)} / ${formatPct(holdings.totalCurrencyEffect / Math.max(holdings.totalCost, 1), 1, true)}` : `${formatMoney(holdings.totalPriceEffect, "NOK", false)} / ${formatMoney(holdings.totalCurrencyEffect, "NOK", false)}`
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-4 lg:flex-row lg:items-start",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 flex-1 flex-col gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
							kicker: "Positions",
							title: "Holdings",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "overflow-x-auto",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
									className: "w-full min-w-[52rem] text-left text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "border-b border-border text-xs text-muted",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-2 py-2 font-medium",
												children: "Name"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-2 py-2 font-medium",
												children: "Qty"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-2 py-2 font-medium",
												children: "Price"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-2 py-2 font-medium",
												children: "FX"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-2 py-2 font-medium",
												children: "MV NOK"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-2 py-2 font-medium",
												children: "Wgt"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-2 py-2 font-medium",
												children: "uP&L"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-2 py-2 font-medium",
												children: "Price"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-2 py-2 font-medium",
												children: "Ccy"
											})
										]
									}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [holdings.holdings.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "border-b border-border",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
												className: "px-2 py-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: h.security.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "font-mono text-[11px] text-muted",
													children: [
														h.security.ticker || "add ticker",
														" · ",
														h.isin
													]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-2 py-2 font-mono tabular-nums",
												children: h.qty.toFixed(4)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
												className: "px-2 py-2 font-mono tabular-nums",
												children: [privacy ? "••••" : `${h.price.toFixed(2)} ${h.security.currency}`, h.priceStale ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "ml-1 text-[10px] uppercase text-warn",
													children: "stale"
												}) : null]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
												className: "px-2 py-2 font-mono tabular-nums text-xs",
												children: [h.security.currency === "NOK" ? "—" : h.fx.toFixed(4), h.fxStale ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "ml-1 text-[10px] uppercase text-warn",
													children: "stale"
												}) : null]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-2 py-2 font-mono tabular-nums",
												children: privacy ? "••••" : formatMoney(h.marketNok, "NOK", false)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-2 py-2 font-mono tabular-nums",
												children: formatPct(h.weight, 1)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: cn("px-2 py-2 font-mono tabular-nums", h.unrealizedNok >= 0 ? "text-ok" : "text-danger"),
												children: privacy ? formatPct(h.unrealizedNok / Math.max(h.costNok, 1), 1, true) : formatMoney(h.unrealizedNok, "NOK", false)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-2 py-2 font-mono text-xs tabular-nums",
												children: privacy ? "—" : formatMoney(h.priceEffect, "NOK", false)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-2 py-2 font-mono text-xs tabular-nums",
												children: privacy ? "—" : formatMoney(h.currencyEffect, "NOK", false)
											})
										]
									}, h.isin)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-2 py-2 text-muted",
											children: "Cash"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-2 py-2 font-mono tabular-nums",
											children: privacy ? "••••" : formatMoney(holdings.cash, "NOK", false)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-2 py-2 font-mono tabular-nums",
											children: formatPct(holdings.totalMarket > 0 ? holdings.cash / holdings.totalMarket : 0, 1)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {})
									] })] })]
								})
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
							kicker: "Performance",
							title: "Vs benchmark",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Benchmark",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectInput, {
										value: benchmarkId,
										onChange: (e) => setBenchmark(e.target.value),
										children: BENCHMARKS.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: b.id,
											children: b.label
										}, b.id))
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PerformanceChart, {
										portfolio: navIdx.map((p) => ({
											date: p.date,
											value: p.value
										})),
										benchmark: showBenchmark ? benchSeries : [],
										benchmarkLabel: bench.label,
										privacy,
										currency: "NOK"
									})
								}),
								showBenchmark ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2 text-xs text-muted",
									children: [
										"Indexed to 100 at ",
										returns.startDate,
										". Benchmark from",
										" ",
										mode === "demo" ? "the demo series" : "imported prices",
										" for ",
										bench.label,
										"."
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2 rounded-md border border-border bg-surface-2 px-3 py-2 text-xs text-muted",
									children: [
										"No benchmark prices imported for ",
										bench.label,
										". Import a date + close/NAV history on the Import page to overlay a comparison. NORDLYS never generates benchmark paths in My Data."
									]
								})
							]
						}),
						holdings.realized.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
							kicker: "Closed",
							title: "Realized P&L",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "overflow-x-auto",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
									className: "w-full min-w-[32rem] text-left text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "border-b border-border text-xs text-muted",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-2 py-2 font-medium",
												children: "Security"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-2 py-2 font-medium",
												children: "Qty"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-2 py-2 font-medium",
												children: "Total"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-2 py-2 font-medium",
												children: "Price"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-2 py-2 font-medium",
												children: "Currency"
											})
										]
									}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: holdings.realized.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "border-b border-border",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-2 py-2",
												children: r.name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-2 py-2 font-mono",
												children: r.qty.toFixed(4)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-2 py-2 font-mono",
												children: privacy ? "••••" : formatMoney(r.realizedNok, "NOK", false)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-2 py-2 font-mono text-xs",
												children: privacy ? "—" : formatMoney(r.priceEffect, "NOK", false)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-2 py-2 font-mono text-xs",
												children: privacy ? "—" : formatMoney(r.currencyEffect, "NOK", false)
											})
										]
									}, r.isin)) })]
								})
							})
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
							kicker: "Ledger",
							title: "Transactions",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "max-h-80 overflow-auto",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
									className: "w-full min-w-[40rem] text-left text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "border-b border-border text-muted",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-2 py-1 font-medium",
												children: "Id"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-2 py-1 font-medium",
												children: "Date"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-2 py-1 font-medium",
												children: "Type"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-2 py-1 font-medium",
												children: "Name"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-2 py-1 font-medium",
												children: "Qty"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-2 py-1 font-medium",
												children: "Amount"
											})
										]
									}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: ledger.transactions.slice().reverse().map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "border-b border-border",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-2 py-1 font-mono",
												children: t.nordnetId
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-2 py-1 font-mono",
												children: t.tradeDate
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-2 py-1",
												children: TX_KIND_LABELS[t.kind]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-2 py-1",
												children: t.name || t.text
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-2 py-1 font-mono",
												children: t.qty ? t.qty.toFixed(4) : ""
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-2 py-1 font-mono",
												children: privacy ? "••••" : formatMoney(t.amount, "NOK", false)
											})
										]
									}, t.id)) })]
								})
							})
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex w-full shrink-0 flex-col gap-4 lg:w-96",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
						kicker: "Mix",
						title: "Allocation",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AllocationChart, { slices: holdings.allocation }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-2 text-xs text-muted",
							children: holdings.allocation.filter((a) => a.weight > 5e-4).map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex justify-between py-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: ASSET_LABELS[a.assetClass] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono",
									children: formatPct(a.weight, 1)
								})]
							}, a.assetClass))
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GapPanel, {
						holdings,
						model,
						securities: ledger.securities,
						privacy
					})]
				})]
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
function PortfolioRoute() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PortfolioPage, {});
}
//#endregion
export { PortfolioRoute as component };
