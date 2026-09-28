import { i as __toESM } from "../_runtime.mjs";
import { B as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { it as cn, lt as formatPct } from "./router-DE00T9yP.mjs";
import { i as SelectInput, r as Panel, t as Field } from "./field-CX5Y1XAQ.mjs";
import { a as impliedVol, n as bsm, o as mcOptionPrice, t as binomialPrice } from "./options-B9z_Ouho.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/options-BeOHjXju.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function OptionsPage() {
	const [S, setS] = (0, import_react.useState)(100);
	const [K, setK] = (0, import_react.useState)(100);
	const [r, setR] = (0, import_react.useState)(.05);
	const [q, setQ] = (0, import_react.useState)(0);
	const [vol, setVol] = (0, import_react.useState)(.2);
	const [T, setT] = (0, import_react.useState)(1);
	const [type, setType] = (0, import_react.useState)("call");
	const [market, setMarket] = (0, import_react.useState)(10.4506);
	const [steps, setSteps] = (0, import_react.useState)(128);
	const [paths, setPaths] = (0, import_react.useState)(2e4);
	const input = {
		S,
		K,
		r,
		vol,
		T,
		q,
		type
	};
	const inputError = S <= 0 ? "Spot must be greater than zero." : K <= 0 ? "Strike must be greater than zero." : T <= 0 ? "Maturity must be greater than zero." : vol < 0 ? "Volatility cannot be negative." : null;
	const euro = (0, import_react.useMemo)(() => bsm(input), [
		S,
		K,
		r,
		vol,
		T,
		q,
		type
	]);
	const iv = (0, import_react.useMemo)(() => impliedVol({
		S,
		K,
		r,
		T,
		q,
		type
	}, market, vol), [
		S,
		K,
		r,
		T,
		q,
		type,
		market,
		vol
	]);
	const tree = (0, import_react.useMemo)(() => binomialPrice(input, steps, "american"), [
		S,
		K,
		r,
		vol,
		T,
		q,
		type,
		steps
	]);
	const mc = (0, import_react.useMemo)(() => mcOptionPrice(input, paths, 20260321), [
		S,
		K,
		r,
		vol,
		T,
		q,
		type,
		paths
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-[1100px] px-4 py-6 sm:px-6 sm:py-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "kicker mb-2",
					children: "Derivatives"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-medium tracking-tight",
					children: "Options"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "Black–Scholes–Merton with dividend yield, implied vol, CRR American tree, and seeded Monte Carlo."
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-4 lg:flex-row lg:items-start",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex w-full shrink-0 flex-col gap-4 lg:w-80",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					kicker: "Contract",
					title: "Inputs",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Type",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectInput, {
									value: type,
									onChange: (e) => setType(e.target.value),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "call",
										children: "Call"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "put",
										children: "Put"
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
								label: "Spot",
								value: S,
								onChange: setS,
								step: 1
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
								label: "Strike",
								value: K,
								onChange: setK,
								step: 1
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
								label: "Rate %",
								value: r * 100,
								onChange: (v) => setR(v / 100),
								step: .1
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
								label: "Dividend %",
								value: q * 100,
								onChange: (v) => setQ(v / 100),
								step: .1
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
								label: "Volatility %",
								value: vol * 100,
								onChange: (v) => setVol(v / 100),
								step: .1
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
								label: "Maturity years",
								value: T,
								onChange: setT,
								step: .05
							})
						]
					})
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 flex-1 flex-col gap-4",
				children: [
					inputError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-lg border border-danger/40 px-4 py-3 text-sm text-danger",
						children: inputError
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
						kicker: "European",
						title: "Black–Scholes–Merton",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-4 grid gap-3 sm:grid-cols-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Price",
									value: euro.price.toFixed(4)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "d1",
									value: euro.d1.toFixed(4)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "d2",
									value: euro.d2.toFixed(4)
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-3 sm:grid-cols-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Delta",
									value: euro.greeks.delta.toFixed(4)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Gamma",
									value: euro.greeks.gamma.toFixed(4)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Vega",
									value: euro.greeks.vega.toFixed(4),
									hint: "per 1.00 vol"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Theta",
									value: euro.greeks.theta.toFixed(4),
									hint: "per year"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Rho",
									value: euro.greeks.rho.toFixed(4)
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
						kicker: "Invert",
						title: "Implied volatility",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-3 sm:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
								label: "Quoted price",
								value: market,
								onChange: setMarket,
								step: .01
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-md border border-border p-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-muted",
									children: "Implied vol"
								}), iv.ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-1 font-mono text-lg",
									children: formatPct(iv.vol, 2)
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-danger",
									children: iv.error
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-xs text-muted",
							children: "Newton on vega, bisection fallback. Errors if the quote is below discounted intrinsic or above the no-arbitrage cap."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
						kicker: "American",
						title: "Binomial tree",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mb-3 max-w-xs",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
									label: "Steps",
									value: steps,
									onChange: (v) => setSteps(Math.max(2, Math.round(v))),
									step: 1
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-3 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "American",
									value: tree.price.toFixed(4)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "European (same tree)",
									value: tree.european.toFixed(4)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-xs text-muted",
								children: "CRR. Early exercise is optimal for puts when the rate is positive; a call with no dividends is never exercised, so the American price sits on the European tree (and converges to BSM as N grows)."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
						kicker: "Simulation",
						title: "Monte Carlo",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mb-3 max-w-xs",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
									label: "Paths",
									value: paths,
									onChange: (v) => setPaths(Math.max(200, Math.round(v))),
									step: 1e3
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-3 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Antithetic",
									value: mc.price.toFixed(4),
									hint: `SE ${mc.se.toFixed(4)}`
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Control variate",
									value: mc.priceCv.toFixed(4),
									hint: `SE ${mc.seCv.toFixed(4)} · ${(100 * mc.seReduction).toFixed(0)}% cut`
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-3 text-xs text-muted",
								children: [
									"Terminal GBM, antithetic Z / -Z, control discounted spot with known mean. Seeded xoshiro256**. n=",
									mc.n,
									"."
								]
							})
						]
					})
				]
			})]
		})]
	});
}
function Num({ label, value, onChange, step }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
		label,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			className: "field-input h-11",
			type: "number",
			step,
			value: Number.isFinite(value) ? value : 0,
			onChange: (e) => onChange(Number(e.target.value))
		})
	});
}
function Metric({ label, value, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("rounded-md border border-border p-3"),
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
function OptionsRoute() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionsPage, {});
}
//#endregion
export { OptionsRoute as component };
