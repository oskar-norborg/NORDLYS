import { B as require_jsx_runtime, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as requestShowTour } from "./router-DE00T9yP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/help-Bj-yIQRB.js
var import_jsx_runtime = require_jsx_runtime();
function HelpPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "kicker mb-2",
				children: "Guide"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-medium tracking-tight",
				children: "Help"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm leading-relaxed text-muted",
				children: "NORDLYS is a private wealth planner that runs in this browser. Nothing is uploaded. This page is the written guide for someone who does not write code."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: requestShowTour,
				className: "mt-4 inline-flex h-11 items-center rounded-md border border-border px-4 text-sm text-fg",
				children: "Show this"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm leading-relaxed text-muted",
				children: "Six stops: the plan, the book, the risk, a strategy replay, a Nordnet file, and why the figures stay in this browser. The same button is at the bottom of the sidebar, and in search as “Show this”."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 flex flex-col gap-8 text-sm leading-relaxed text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mb-2 text-fg",
							children: "Demo, My Data, and Privacy"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-fg",
							children: "Demo"
						}), " is a sample household (Emilie and the others) plus a sample Nordnet file. Use it to click around without touching your own figures."] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-fg",
								children: "My Data"
							}), " is your copy. Household answers, imports, and price files stay in this browser only. Copy a demo plan or ledger into My Data when you want a starting point, then edit it."]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-fg",
								children: "Privacy"
							}), " hides kroner amounts and shows an index that starts at 100, plus percentages. Turn it on before a screenshot or a shared screen."]
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-2 text-fg",
						children: "Export transactions from Nordnet"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
						className: "list-decimal space-y-2 pl-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Sign in to Nordnet in a desktop browser." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
								"Open ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-fg",
									children: "Transaksjoner og notaer"
								}),
								" (Transactions and contract notes)."
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Choose the account and date range you want, then download / export. Nordnet usually gives a text file (often opened as .xls) with tab-separated columns and Norwegian headers — Id, Bokføringsdag, Handelsdag, and so on." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Save the file. Do not re-save it from Excel as a new workbook if you can avoid it." })
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-2 text-fg",
						children: "Import that file"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
						className: "list-decimal space-y-2 pl-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
								"Open ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/import",
									className: "text-accent",
									children: "Import"
								}),
								"."
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Drop the file on the dashed box, or tap Choose file. Parsing happens here — the file is not sent away." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Read the import report: rows created, duplicates skipped, cancelled lines (Makuleringsdato) left out. Demo has a sample export you can load or download if you want to see a clean run first." })
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-2 text-fg",
						children: "The review queue"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "If Nordnet used a transaction type NORDLYS does not recognise, that line is not dropped. It waits in the review queue. Pick a type once (buy, dividend, fee, and so on). The mapping is remembered in this browser and reused on the next file. When the queue is empty, every recognised type is already in the ledger." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mb-2 text-fg",
							children: "Price history, NAV, FX, benchmarks"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Holdings need a price or fund NAV series to mark to market. A generic CSV is enough: a date column and a close / NAV column. US dates and dollar signs, or European decimal commas, both work. Mutual-fund NAV files with no open/high/low are first-class." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
							className: "mt-2 list-decimal space-y-2 pl-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "On Import, pick the ISIN, then Import prices / NAV." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "USD names also need an FX series (USDNOK). Without it the holding is marked stale, never invented." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "In My Data, benchmark lines appear only after you import them. Demo can supply sample prices so Risk and Backtest have something to plot." })
							]
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mb-2 text-fg",
							children: "The planner"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							className: "text-accent",
							children: "Planner"
						}), " is the client page. Members, income, savings rate, goals, and twelve risk questions set the book. A 10,000-path monthly simulation then reports the chance each goal is met. The what-if sliders (save more, retire later, fee, risk book) re-run the same seed so the comparison is fair."] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2",
							children: "On Portfolio, Use as client copies the imported market value into the plan. Gap then compares the live book to the model book."
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-2 text-fg",
						children: "The proposal PDF"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "On the planner, Download proposal PDF writes a client letter in this browser (PDF 1.4, including æ ø å). Privacy Mode applies to the file. Projections are hypothetical and not a guarantee. A portfolio report is available from Portfolio once a ledger exists." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-2 text-fg",
						children: "Backtest, in brief"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Backtest replays a small strategy language on price history. close is this session; close[1] is yesterday. A signal uses that day’s close; the fill is the next session. Demo supplies MSFT, KOG, MOWI and DNB. My Data runs only on imported history — missing tickers are listed, never filled in." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-2 text-fg",
						children: "If something looks empty"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Portfolio and Risk ask for a ledger first. Backtest in My Data asks for price history. Diagnostics re-runs the built-in identities — including a 100,000-input fuzz of the parsers — and reports every result in this browser." })] })
				]
			})
		]
	});
}
//#endregion
export { HelpPage as component };
