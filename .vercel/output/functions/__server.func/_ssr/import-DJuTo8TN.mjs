import { i as __toESM } from "../_runtime.mjs";
import { B as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { A as PRICE_PRESETS, O as BENCHMARKS, Ot as TX_KINDS, P as downloadableDemoFile, _t as ASSET_LABELS, gt as ASSET_IDS, ht as useAppStore, it as cn, kt as TX_KIND_LABELS, s as usePortfolioStore, st as formatMoney } from "./router-DE00T9yP.mjs";
import { i as SelectInput, r as Panel, t as Field } from "./field-CX5Y1XAQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/import-DJuTo8TN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ImportPage() {
	const mode = useAppStore((s) => s.mode);
	const privacy = useAppStore((s) => s.privacy);
	const lastReport = usePortfolioStore((s) => s.lastReport);
	const importBytes = usePortfolioStore((s) => s.importBytes);
	const loadDemoExport = usePortfolioStore((s) => s.loadDemoExport);
	const copyDemoToMyData = usePortfolioStore((s) => s.copyDemoToMyData);
	const applyMapping = usePortfolioStore((s) => s.applyMapping);
	const demo = usePortfolioStore((s) => s.demo);
	const mydata = usePortfolioStore((s) => s.mydata);
	const updateSecurity = usePortfolioStore((s) => s.updateSecurity);
	const importPrices = usePortfolioStore((s) => s.importPrices);
	const importFx = usePortfolioStore((s) => s.importFx);
	const importBenchmark = usePortfolioStore((s) => s.importBenchmark);
	const typeMappings = usePortfolioStore((s) => s.typeMappings);
	const ledger = mode === "demo" ? demo : mydata;
	const [drag, setDrag] = (0, import_react.useState)(false);
	const [notice, setNotice] = (0, import_react.useState)("");
	const [priceIsin, setPriceIsin] = (0, import_react.useState)(ledger.securities[0]?.isin ?? "");
	const [fxPair, setFxPair] = (0, import_react.useState)("USDNOK");
	const [benchId, setBenchId] = (0, import_react.useState)("world");
	const onFiles = (0, import_react.useCallback)(async (files) => {
		const file = files[0];
		if (!file) return;
		const buf = await file.arrayBuffer();
		const report = importBytes(buf, file.name);
		setNotice(`${file.name}: ${report.transactionsCreated} created, ${report.duplicatesSkipped} duplicates, ${report.cancelledExcluded} cancelled, ${report.reviewCount} to review.`);
	}, [importBytes]);
	const downloadDemo = () => {
		const { bytes, fileName, mime } = downloadableDemoFile();
		const copy = new ArrayBuffer(bytes.byteLength);
		new Uint8Array(copy).set(bytes);
		const blob = new Blob([copy], { type: mime });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = fileName;
		a.click();
		URL.revokeObjectURL(url);
	};
	const reconIssues = lastReport?.recon.issues ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-[1100px] px-4 py-6 sm:px-6 sm:py-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "kicker mb-2",
					children: "Ledger"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-medium tracking-tight",
					children: "Import"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "Nordnet “Transaksjoner og notaer” and generic price/FX CSVs. Parsed in this browser — nothing is uploaded."
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					kicker: "Nordnet",
					title: "Transactions",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: cn("flex min-h-36 flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center", drag ? "border-accent bg-surface-2" : "border-border"),
							onDragOver: (e) => {
								e.preventDefault();
								setDrag(true);
							},
							onDragLeave: () => setDrag(false),
							onDrop: (e) => {
								e.preventDefault();
								setDrag(false);
								onFiles(e.dataTransfer.files);
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-fg",
									children: "Drop a Nordnet export here"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs text-muted",
									children: "UTF-16 LE tab-delimited, or CSV in any Nordic language"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "mt-4 inline-flex h-11 cursor-pointer items-center rounded-md bg-accent px-4 text-sm text-accent-fg",
									children: ["Choose file", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "file",
										className: "sr-only",
										accept: ".xls,.xlsx,.txt,.csv,.tsv,.txt",
										onChange: (e) => {
											if (e.target.files) onFiles(e.target.files);
											e.target.value = "";
										}
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "h-11 rounded-md border border-border px-4 text-sm",
									onClick: () => {
										const report = loadDemoExport();
										setNotice(`Demo export imported: ${report.transactionsCreated} transactions through the same pipeline.`);
									},
									children: "Load demo Nordnet export"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "h-11 rounded-md border border-border px-4 text-sm",
									onClick: downloadDemo,
									children: "Download demo file"
								}),
								mode === "demo" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "h-11 rounded-md border border-border px-4 text-sm",
									onClick: copyDemoToMyData,
									children: "Copy demo ledger into My Data"
								}) : null
							]
						}),
						notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm text-accent",
							children: notice
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-xs text-muted",
							children: [
								"Active ledger: ",
								ledger.transactions.length,
								" transactions · ",
								ledger.securities.length,
								" securities ·",
								" ",
								mode === "demo" ? "Demo" : "My Data"
							]
						})
					]
				}),
				lastReport ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					kicker: "Result",
					title: "Import report",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-3 sm:grid-cols-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Rows read",
									value: String(lastReport.rowsRead)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Created",
									value: String(lastReport.transactionsCreated)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Duplicates",
									value: String(lastReport.duplicatesSkipped)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Cancelled",
									value: String(lastReport.cancelledExcluded)
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 font-mono text-xs text-muted",
							children: [
								lastReport.encoding,
								" · ",
								lastReport.delimiter === "tab" ? "tab" : lastReport.delimiter,
								" ·",
								" ",
								lastReport.positional ? "positional 30-col Nordnet" : "header aliases"
							]
						}),
						lastReport.cancelled.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "mb-2 text-sm font-medium",
								children: "Cancelled (Makuleringsdato)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "text-sm text-muted",
								children: lastReport.cancelled.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
									"Row ",
									c.rowNumber,
									" · Id ",
									c.nordnetId,
									" · ",
									c.rawType,
									" · ",
									c.name,
									" · ",
									c.date
								] }, c.nordnetId))
							})]
						}) : null,
						lastReport.skipped.filter((s) => s.reason !== "cancelled" && s.reason !== "duplicate").length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "mb-2 text-sm font-medium",
								children: "Skipped"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "max-h-40 overflow-auto text-xs text-muted",
								children: lastReport.skipped.filter((s) => s.reason !== "duplicate").slice(0, 40).map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
									"Row ",
									s.rowNumber,
									": ",
									s.reason,
									" — ",
									s.detail
								] }, `${s.rowNumber}-${s.reason}`))
							})]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "mb-2 text-sm font-medium",
									children: "Reconciliation"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm text-muted",
									children: [
										"Saldo errors ",
										lastReport.recon.saldoErrors,
										" · quantity errors ",
										lastReport.recon.qtyErrors,
										" · rounding notes",
										" ",
										lastReport.recon.qtyRounding
									]
								}),
								reconIssues.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-sm text-ok",
									children: "Saldo and Totalt antall recompute cleanly."
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-2 overflow-x-auto",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
										className: "w-full min-w-[32rem] text-left text-xs",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
											className: "border-b border-border text-muted",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-2 py-1 font-medium",
													children: "Row"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-2 py-1 font-medium",
													children: "Id"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-2 py-1 font-medium",
													children: "Field"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-2 py-1 font-medium",
													children: "Level"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-2 py-1 font-medium",
													children: "Δ"
												})
											]
										}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: reconIssues.slice(0, 50).map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
											className: "border-b border-border",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "px-2 py-1 font-mono",
													children: i.rowNumber
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "px-2 py-1 font-mono",
													children: i.nordnetId
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "px-2 py-1",
													children: i.field
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: i.level === "error" ? "text-danger" : "text-warn",
													children: i.level
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "px-2 py-1 font-mono",
													children: i.delta
												})
											]
										}, `${i.rowNumber}-${i.field}`)) })]
									})
								})
							]
						})
					]
				}) : null,
				lastReport && lastReport.review.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					kicker: "Unmapped",
					title: "Review queue",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-4 text-sm text-muted",
						children: "Unrecognized types are never dropped. Map them once; the mapping is stored in this browser and reused."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "flex flex-col gap-3",
						children: uniqTypes(lastReport.review).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-mono text-sm",
									children: item.rawType || "(blank type)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-xs text-muted",
									children: [
										item.name,
										" · ",
										item.date,
										" · ",
										formatMoney(item.amount, "NOK", privacy)
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectInput, {
								value: typeMappings[item.rawType] ?? "",
								onChange: (e) => {
									const v = e.target.value;
									if (v) applyMapping(item.rawType, v);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "Map to…"
								}), TX_KINDS.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: k,
									children: TX_KIND_LABELS[k]
								}, k))]
							})]
						}, item.rawType))
					})]
				}) : lastReport ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					kicker: "Unmapped",
					title: "Review queue",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Review queue is empty. Every recognised type is in the ledger. If Nordnet used a type this page does not know, it would wait here — map it once and the mapping is remembered."
					})
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					kicker: "Master",
					title: "Securities",
					children: ledger.securities.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "No securities yet. Import a Nordnet file or load the demo export."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-x-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full min-w-[64rem] text-left text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-border text-xs text-muted",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-2 py-2 font-medium",
										children: "ISIN"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "min-w-24 px-2 py-2 font-medium",
										children: "Ticker"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "min-w-56 px-2 py-2 font-medium",
										children: "Name"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-2 py-2 font-medium",
										children: "Ccy"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-2 py-2 font-medium",
										children: "Exchange"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "min-w-40 px-2 py-2 font-medium",
										children: "Class"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "px-2 py-2 font-medium" })
								]
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: ledger.securities.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-border",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-2 py-2 font-mono text-xs",
										title: s.isin,
										children: s.isin
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "px-2 py-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											className: "field-input h-9 min-w-24!",
											value: s.ticker,
											placeholder: "add ticker",
											title: s.ticker || "add ticker",
											onChange: (e) => updateSecurity(s.isin, { ticker: e.target.value })
										}), !s.ticker ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-1 text-[10px] text-warn",
											children: "add ticker"
										}) : null]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-2 py-1",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											className: "field-input h-9 min-w-56!",
											value: s.name,
											title: s.name,
											onChange: (e) => updateSecurity(s.isin, { name: e.target.value })
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-2 py-1",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											className: "field-input h-9 w-16",
											value: s.currency,
											title: s.currency,
											onChange: (e) => updateSecurity(s.isin, { currency: e.target.value.toUpperCase() })
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-2 py-1",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											className: "field-input h-9 w-20",
											value: s.exchange,
											placeholder: s.exchange ? void 0 : "—",
											title: s.exchange || "—",
											onChange: (e) => updateSecurity(s.isin, { exchange: e.target.value })
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "px-2 py-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
											className: "field-input h-9 min-w-40!",
											value: s.assetClass,
											title: ASSET_LABELS[s.assetClass],
											onChange: (e) => updateSecurity(s.isin, {
												assetClass: e.target.value,
												assetClassConfirmed: true
											}),
											children: ASSET_IDS.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: id,
												children: ASSET_LABELS[id]
											}, id))
										}), !s.assetClassConfirmed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-1 text-[10px] tracking-wide text-warn uppercase",
											children: "suggested, please review"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-1 text-[10px] tracking-wide text-muted uppercase",
											children: "confirmed"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-2 py-1",
										children: !s.assetClassConfirmed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "h-9 whitespace-nowrap px-2 text-xs text-accent",
											onClick: () => updateSecurity(s.isin, { assetClassConfirmed: true }),
											children: "Confirm"
										}) : null
									})
								]
							}, s.isin)) })]
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					kicker: "Market data",
					title: "Prices, NAV, FX, benchmarks",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-4 text-sm text-muted",
							children: "Generic CSV. Mutual-fund NAV files (date + NAV, no OHLC) are first-class. Also: ISO + Adj Close; US dates with $; European decimal commas. Holdings without a price file stay on last-trade and are marked stale. USD without an imported FX series is marked stale. In My Data, benchmark lines appear only after you import them — they are never generated."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 sm:grid-cols-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
									label: "Price / NAV file for ISIN",
									hint: PRICE_PRESETS.map((p) => p.label).join(" · "),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectInput, {
										value: priceIsin,
										onChange: (e) => setPriceIsin(e.target.value),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											children: "Select ISIN"
										}), ledger.securities.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
											value: s.isin,
											children: [
												s.ticker,
												" ",
												s.isin
											]
										}, s.isin))]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "mt-2 inline-flex h-11 items-center rounded-md border border-border px-3 text-sm",
										children: ["Import prices / NAV", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "file",
											className: "sr-only",
											accept: ".csv,.txt",
											onChange: async (e) => {
												const f = e.target.files?.[0];
												if (!f || !priceIsin) return;
												const n = importPrices(await f.arrayBuffer(), priceIsin);
												setNotice(`${n} price/NAV points for ${priceIsin}`);
												e.target.value = "";
											}
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
									label: "FX pair (e.g. USDNOK)",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										className: "field-input",
										value: fxPair,
										onChange: (e) => setFxPair(e.target.value.toUpperCase())
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "mt-2 inline-flex h-11 items-center rounded-md border border-border px-3 text-sm",
										children: ["Import FX", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "file",
											className: "sr-only",
											accept: ".csv,.txt",
											onChange: async (e) => {
												const f = e.target.files?.[0];
												if (!f) return;
												const n = importFx(await f.arrayBuffer(), fxPair);
												setNotice(`${n} FX points for ${fxPair}`);
												e.target.value = "";
											}
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
									label: "Benchmark series",
									hint: "Date + close or NAV. Required in My Data — nothing is generated.",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectInput, {
										value: benchId,
										onChange: (e) => setBenchId(e.target.value),
										children: BENCHMARKS.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: b.id,
											children: b.label
										}, b.id))
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "mt-2 inline-flex h-11 items-center rounded-md border border-border px-3 text-sm",
										children: ["Import benchmark", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "file",
											className: "sr-only",
											accept: ".csv,.txt",
											onChange: async (e) => {
												const f = e.target.files?.[0];
												if (!f) return;
												const n = importBenchmark(await f.arrayBuffer(), benchId);
												setNotice(`${n} benchmark points for ${benchId}`);
												e.target.value = "";
											}
										})]
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-xs text-muted",
							children: [
								ledger.prices.length,
								" price points · ",
								ledger.fx.length,
								" FX quotes · ",
								(ledger.benchmarks ?? []).length,
								" ",
								"benchmark points",
								ledger.fx.some((f) => f.stale) ? " · some FX marked stale (from Nordnet trades)" : ""
							]
						}),
						ledger.fx.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-xs text-muted",
							children: uniqueFxSummary(ledger.fx)
						}) : null
					]
				})
			]
		})]
	});
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-md border border-border p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-xs text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-1 font-mono text-lg tabular-nums",
			children: value
		})]
	});
}
function uniqTypes(items) {
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const it of items) {
		if (seen.has(it.rawType)) continue;
		seen.add(it.rawType);
		out.push(it);
	}
	return out;
}
function uniqueFxSummary(fx) {
	const byPair = /* @__PURE__ */ new Map();
	for (const q of fx) {
		const set = byPair.get(q.pair) ?? /* @__PURE__ */ new Set();
		set.add(q.date);
		byPair.set(q.pair, set);
	}
	return [...byPair.entries()].map(([pair, dates]) => `${pair}: ${dates.size} dates (${[...dates].sort().join(", ")})`).join(" · ");
}
function ImportRoute() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImportPage, {});
}
//#endregion
export { ImportRoute as component };
