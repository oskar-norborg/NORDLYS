import { B as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/about-nDcL8zI3.js
var import_jsx_runtime = require_jsx_runtime();
function AboutPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "kicker mb-2",
				children: "Method"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-medium tracking-tight",
				children: "About NORDLYS"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-sm leading-relaxed text-fg",
				children: "NORDLYS — designed and directed by Grok Build, built with Grok Build Mode."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex flex-col gap-5 text-sm leading-relaxed text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "A private wealth planner. Client planning, Nordnet import, holdings, risk analytics (covariance, VaR, drawdowns, an in-house mean-variance solver), a Black–Scholes options book, and a historical backtester all run in this browser." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-2 text-fg",
						children: "What it does"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "list-disc space-y-1 pl-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "10,000-path monthly Monte Carlo on five model books" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Nordnet import (UTF-16 LE, 30 columns) with a review queue" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Holdings, FIFO or average cost, TWR and XIRR" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Risk: covariance, VaR/ES, drawdowns, frontier, Black–Litterman" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Options: Black–Scholes, implied vol, American tree, seeded Monte Carlo" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Historical backtester with Pine-style history, sweeps and walk-forward" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Client proposal and portfolio report as PDF 1.4" })
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-2 text-fg",
						children: "Data stays here"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "All client data is stored in this browser’s localStorage. The application does not send household figures, answers, imports, or simulation results anywhere. Demo mode is the default. Privacy Mode replaces every currency amount with a mask and shows indexed values (start = 100) and percentages — intended for screenshots." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-2 text-fg",
						children: "Risk profile"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Twelve questions, scored 1–5. The first six average to willingness (tolerance); the last six to ability (capacity). Each average is rounded to an integer in 1–5. The book is the minimum of the two, with a plain-language rationale. A what-if control can override the book without rewriting the questionnaire." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-2 text-fg",
						children: "Capital markets"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Five model portfolios are solved from the capital-market assumptions with a long-only active-set quadratic programme (per-asset and group caps). Expected returns, volatilities, the correlation matrix, and inflation remain editable. Monthly steps use μ/12 and σ/√12. Correlated normals are formed from the Cholesky factor L of the correlation matrix: r = μ + σ ⊙ Lz, z ~ N(0, I)." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-2 text-fg",
						children: "Monte Carlo"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "10,000 paths, monthly, seeded with xoshiro256** (SplitMix64 seed). Contributions run until each member's retirement; retirement income (today's currency, inflated) starts when the last member has retired. Home and education goals are lump sums in priority order; a bequest is tested at the plan horizon (age 95). The same return draws are applied with and without the advisory fee so the fee panel is a pure cost comparison. Randomness is never taken from Math.random." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-2 text-fg",
						children: "Portfolio import"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Nordnet “Transaksjoner og notaer” files are decoded in this browser (UTF-16 LE with BOM, tabs, 30 columns, duplicate Valuta fields). Unrecognized types go to a review queue; mappings persist. Duplicate Ids are skipped. Saldo and Totalt antall are recomputed. Holdings use FIFO or average cost, with P&L split into price and currency. Time-weighted return is linked sub-period; money-weighted return is XIRR. Demo mode writes a synthetic Nordnet file and imports it through the same pipeline." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-2 text-fg",
						children: "Risk"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Covariance is sample, EWMA, or Ledoit–Wolf shrinkage toward constant correlation. VaR and expected shortfall are historical, parametric normal, Cornish–Fisher, or Monte Carlo. Drawdowns, Sharpe, Sortino, Calmar, beta, tracking error and information ratio are computed from the book’s NAV. Stresses are instantaneous asset and FX shocks on current holdings. The efficient frontier, risk parity and Black–Litterman views share the same quadratic solver as the planner’s model books." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-2 text-fg",
						children: "Options"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Black–Scholes–Merton with a continuous dividend yield, live Greeks, and an implied-volatility Newton solver with bisection fallback. American exercise uses a CRR binomial tree. The Monte Carlo pricer uses antithetic variates and a discounted-spot control variate, seeded with xoshiro256**." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-2 text-fg",
						children: "Backtest"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Strategies are written in a small language (indicators, comparisons, and/or/not, if/else, target_weight). Series history follows Pine Script: close is this bar, close[1] the previous close, close[2] two bars ago. Negative offsets are a parse error, so the series cannot read the future. Signals use that session’s close; fills occur at the next trading day’s price. Costs, slippage and cash yield apply in NOK; USD names are converted on each date with imported FX. Demo mode supplies seeded OHLC for MSFT, KOG, MOWI and DNB. My Data runs only on imported price history — missing tickers are listed, never filled in. Parameter sweeps and walk-forward windows run in Web Workers." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-2 text-fg",
						children: "Documents"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Client proposals and portfolio reports are written as PDF 1.4 in this browser — objects, a cross-reference table, Helvetica with WinAnsi (including æ ø å), and vector charts. Privacy Mode applies to the file. Projections in a proposal are hypothetical and not guaranteed." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-2 text-fg",
						children: "Reproducibility"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Each household carries an integer seed. The same seed, cashflows, and assumptions produce the same paths. The Diagnostics page re-runs identities: the zero-volatility future-value formula, the 25 risk-profile combinations, Cholesky reconstruction, PRNG streams, simulated means and volatilities against sample-size tolerances, a 100,000-input fuzz of the parsers, and timed 10,000-path, PDF and 100,000-row import runs." })] })
				]
			})
		]
	});
}
//#endregion
export { AboutPage as component };
