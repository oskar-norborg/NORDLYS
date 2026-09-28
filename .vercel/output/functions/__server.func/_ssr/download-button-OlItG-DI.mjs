import { i as __toESM } from "../_runtime.mjs";
import { B as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { _t as ASSET_LABELS, f as analyzeGap, it as cn, lt as formatPct, o as downloadPdf, st as formatMoney } from "./router-DE00T9yP.mjs";
import { r as Panel } from "./field-CX5Y1XAQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/download-button-OlItG-DI.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function GapPanel({ holdings, model, securities, privacy }) {
	const gap = analyzeGap(holdings, model, securities);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
		kicker: "Alignment",
		title: `Gap vs ${model.name}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-4 text-sm text-muted",
				children: "Current holdings against the recommended book. Trades are whole shares at last price."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[28rem] text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border text-xs text-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-2 py-2 font-medium",
								children: "Class"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-2 py-2 font-medium",
								children: "Now"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-2 py-2 font-medium",
								children: "Target"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-2 py-2 font-medium",
								children: "Gap"
							})
						]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: gap.rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border last:border-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-2 py-2",
								children: ASSET_LABELS[r.assetClass]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-2 py-2 font-mono tabular-nums",
								children: formatPct(r.currentWeight, 1)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-2 py-2 font-mono tabular-nums",
								children: formatPct(r.targetWeight, 1)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: cn("px-2 py-2 font-mono tabular-nums", r.gap > 50 ? "text-ok" : r.gap < -50 ? "text-danger" : "text-muted"),
								children: privacy ? formatPct(r.targetWeight - r.currentWeight, 1, true) : formatMoney(r.gap, "NOK", false)
							})
						]
					}, r.assetClass)) })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mt-5 mb-2 text-sm font-medium",
				children: "Rebalancing trades"
			}),
			gap.trades.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "No whole-share trade larger than the residual. Book is close enough."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "flex flex-col gap-2",
				children: gap.trades.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: t.side === "buy" ? "text-ok" : "text-danger",
							children: t.side === "buy" ? "Buy" : "Sell"
						}),
						" ",
						t.shares,
						" ",
						t.ticker,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-muted",
							children: [" · ", t.name]
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-xs tabular-nums text-muted",
						children: privacy ? formatPct(t.valueNok / Math.max(gap.total, 1), 2) : formatMoney(t.valueNok, "NOK", false)
					})]
				}, `${t.side}-${t.isin}`))
			})
		]
	});
}
function PdfDownloadButton({ label, build, disabled }) {
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [err, setErr] = (0, import_react.useState)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-end gap-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			disabled: disabled || busy,
			className: cn("inline-flex h-11 items-center rounded-md border px-4 text-sm", disabled ? "border-border text-subtle" : "border-accent text-accent"),
			onClick: () => {
				setErr(null);
				setBusy(true);
				window.setTimeout(() => {
					try {
						const pdf = build();
						downloadPdf(pdf.bytes, pdf.fileName);
					} catch (e) {
						setErr(e instanceof Error ? e.message : String(e));
					} finally {
						setBusy(false);
					}
				}, 20);
			},
			children: busy ? "Building PDF…" : label
		}), err ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-xs text-danger",
			children: err
		}) : null]
	});
}
//#endregion
export { PdfDownloadButton as n, GapPanel as t };
