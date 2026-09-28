import { i as __toESM } from "../_runtime.mjs";
import { B as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Trash2, s as Plus } from "../_libs/lucide-react.mjs";
import { At as assertCma, C as riskRationale, Ct as MODEL_PORTFOLIOS, Dt as RISK_LABELS, Et as N_PATHS_PREVIEW, S as profileFromAnswers, St as GOAL_TYPE_LABELS, Tt as N_PATHS, _t as ASSET_LABELS, a as runMonteCarlo, bt as DEMO_BLURBS, ct as formatNumber, d as RISK_QUESTIONS, ft as portfolioMoments, g as effectiveRiskLevel, gt as ASSET_IDS, h as effectivePortfolio, ht as useAppStore, i as buildProposalPdf, it as cn, k as DEMO_AS_OF, ln as symmetrizeCorr, lt as formatPct, m as buildSimInput, n as requestShowTour, nn as modelBooks, ot as formatIndex, rt as computeHoldings, s as usePortfolioStore, st as formatMoney, vt as ASSET_SHORT, xt as DEMO_CLIENTS, yt as AS_OF_YEAR } from "./router-DE00T9yP.mjs";
import { a as SliderRow, i as SelectInput, n as MoneyInput, o as TextInput, r as Panel, t as Field } from "./field-CX5Y1XAQ.mjs";
import { n as PdfDownloadButton, t as GapPanel } from "./download-button-OlItG-DI.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-D32JEeAx.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var seq$1 = 0;
function uid(prefix) {
	seq$1 += 1;
	return `${prefix}_${Date.now().toString(36)}_${seq$1}`;
}
function newMember(partial) {
	return {
		id: uid("m"),
		name: partial?.name ?? "Member",
		age: partial?.age ?? 40,
		retirementAge: partial?.retirementAge ?? 65,
		annualIncome: partial?.annualIncome ?? 0,
		savingsRate: partial?.savingsRate ?? .15
	};
}
function newGoal(partial) {
	const type = partial?.type ?? "home";
	return {
		id: uid("g"),
		type,
		name: partial?.name ?? {
			retirement_income: "Retirement income",
			home: "Home purchase",
			education: "Education",
			legacy: "Legacy"
		}[type],
		targetAmount: partial?.targetAmount ?? 0,
		year: partial?.year ?? 2030,
		priority: partial?.priority ?? 2
	};
}
function HouseholdForm() {
	const profile = useAppStore((s) => s.profile);
	const privacy = useAppStore((s) => s.privacy);
	const setProfile = useAppStore((s) => s.setProfile);
	const setMembers = useAppStore((s) => s.setMembers);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
		id: "profile",
		kicker: "Household",
		title: "Client profile",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-5 grid gap-3 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Household name",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
							value: profile.name,
							onChange: (e) => setProfile({ name: e.target.value })
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Planning currency",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectInput, {
							value: profile.currency,
							onChange: (e) => setProfile({ currency: e.target.value }),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "NOK",
									children: "NOK — Norwegian krone"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "USD",
									children: "USD — US dollar"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "EUR",
									children: "EUR — Euro"
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Current investable assets",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoneyInput, {
							value: profile.currentAssets,
							onChange: (n) => setProfile({ currentAssets: Math.max(0, n) }),
							currency: profile.currency,
							privacy
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-sm font-medium text-fg",
					children: "Members"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "inline-flex h-11 items-center gap-1.5 rounded-md px-3 text-sm text-accent",
					onClick: () => setMembers([...profile.members, newMember({ name: `Member ${profile.members.length + 1}` })]),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), " Add member"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col gap-4",
				children: profile.members.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-md border border-border bg-surface-2 p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs text-muted",
							children: ["Member ", i + 1]
						}), profile.members.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "inline-flex h-11 items-center gap-1 px-2 text-sm text-danger",
							onClick: () => setMembers(profile.members.filter((x) => x.id !== m.id)),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), " Remove"]
						}) : null]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Name",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
									value: m.name,
									onChange: (e) => setMembers(profile.members.map((x) => x.id === m.id ? {
										...x,
										name: e.target.value
									} : x))
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Age",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
									type: "number",
									min: 18,
									max: 100,
									value: m.age,
									onChange: (e) => setMembers(profile.members.map((x) => x.id === m.id ? {
										...x,
										age: Number(e.target.value)
									} : x))
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Retirement age",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
									type: "number",
									min: 40,
									max: 80,
									value: m.retirementAge,
									onChange: (e) => setMembers(profile.members.map((x) => x.id === m.id ? {
										...x,
										retirementAge: Number(e.target.value)
									} : x))
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Annual income",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoneyInput, {
									value: m.annualIncome,
									onChange: (n) => setMembers(profile.members.map((x) => x.id === m.id ? {
										...x,
										annualIncome: n
									} : x)),
									currency: profile.currency,
									privacy
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Savings rate (%)",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
									type: "number",
									min: 0,
									max: 90,
									step: 1,
									value: Math.round(m.savingsRate * 100),
									onChange: (e) => setMembers(profile.members.map((x) => x.id === m.id ? {
										...x,
										savingsRate: Number(e.target.value) / 100
									} : x))
								})
							})
						]
					})]
				}, m.id))
			})
		]
	});
}
function GoalsForm() {
	const profile = useAppStore((s) => s.profile);
	const privacy = useAppStore((s) => s.privacy);
	const setGoals = useAppStore((s) => s.setGoals);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
		id: "goals",
		kicker: "Objectives",
		title: "Goals",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mb-4 text-sm text-muted",
				children: [
					"Amounts are in today's ",
					profile.currency,
					". The engine inflates them to the goal date. Retirement income is an annual real spending need from the last retirement."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-3 flex justify-end",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "inline-flex h-11 items-center gap-1.5 rounded-md px-3 text-sm text-accent",
					onClick: () => setGoals([...profile.goals, newGoal({ year: AS_OF_YEAR + 5 })]),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), " Add goal"]
				})
			}),
			profile.goals.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted",
				children: "No goals yet. Add retirement income, a home, education, or a bequest."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col gap-4",
				children: profile.goals.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-md border border-border bg-surface-2 p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-3 flex justify-end",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "inline-flex h-11 items-center gap-1 text-sm text-danger",
							onClick: () => setGoals(profile.goals.filter((x) => x.id !== g.id)),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), " Remove"]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Type",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectInput, {
									value: g.type,
									onChange: (e) => {
										const type = e.target.value;
										setGoals(profile.goals.map((x) => x.id === g.id ? {
											...x,
											type,
											name: GOAL_TYPE_LABELS[type]
										} : x));
									},
									children: Object.keys(GOAL_TYPE_LABELS).map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: t,
										children: GOAL_TYPE_LABELS[t]
									}, t))
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Label",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
									value: g.name,
									onChange: (e) => setGoals(profile.goals.map((x) => x.id === g.id ? {
										...x,
										name: e.target.value
									} : x))
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: g.type === "retirement_income" ? "Annual income (today)" : "Target amount (today)",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoneyInput, {
									value: g.targetAmount,
									onChange: (n) => setGoals(profile.goals.map((x) => x.id === g.id ? {
										...x,
										targetAmount: n
									} : x)),
									currency: profile.currency,
									privacy
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: g.type === "legacy" ? "Horizon year" : g.type === "retirement_income" ? "Ref. year" : "Target year",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
									type: "number",
									min: AS_OF_YEAR,
									max: AS_OF_YEAR + 80,
									value: g.year,
									onChange: (e) => setGoals(profile.goals.map((x) => x.id === g.id ? {
										...x,
										year: Number(e.target.value)
									} : x))
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Priority (1 = first)",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectInput, {
									value: g.priority,
									onChange: (e) => setGoals(profile.goals.map((x) => x.id === g.id ? {
										...x,
										priority: Number(e.target.value)
									} : x)),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: 1,
											children: "1 — highest"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: 2,
											children: "2 — medium"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: 3,
											children: "3 — lower"
										})
									]
								})
							})
						]
					})]
				}, g.id))
			})
		]
	});
}
function RiskPanel() {
	const answers = useAppStore((s) => s.profile.answers);
	const setAnswers = useAppStore((s) => s.setAnswers);
	const scored = profileFromAnswers(answers);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
		id: "risk",
		kicker: "Questionnaire",
		title: "Risk tolerance and capacity",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-5 text-sm text-muted",
				children: "Twelve questions. Six measure willingness (tolerance), six measure ability (capacity). The book is the lower of the two."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-6 grid gap-3 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScoreCard, {
						label: "Willingness",
						value: scored.tolerance,
						mean: scored.toleranceMean
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScoreCard, {
						label: "Ability",
						value: scored.capacity,
						mean: scored.capacityMean
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScoreCard, {
						label: "Profile",
						value: scored.profile,
						mean: scored.profile,
						accent: true
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-6 text-sm leading-relaxed text-fg",
				children: riskRationale(scored.tolerance, scored.capacity, scored.profile)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "flex flex-col gap-6",
				children: RISK_QUESTIONS.map((q, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-1 text-[10px] tracking-[0.14em] text-subtle uppercase",
						children: [
							q.dimension === "tolerance" ? "Willingness" : "Ability",
							" · ",
							q.title
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-3 text-sm text-fg",
						children: q.prompt
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: `${q.low} → ${q.high}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-5 gap-1",
							children: q.options.map((opt, k) => {
								const val = k + 1;
								const on = answers[i] === val;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => {
										const next = answers.slice();
										next[i] = val;
										setAnswers(next);
									},
									className: cn("flex min-h-11 items-center justify-center rounded-md border px-1 py-2 text-center text-[11px] leading-tight sm:text-xs", on ? "border-accent bg-accent text-accent-fg" : "border-border bg-surface-2 text-muted"),
									"aria-pressed": on,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "hidden sm:inline",
										children: opt
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "sm:hidden",
										children: val
									})]
								}, opt);
							})
						})
					})
				] }, q.id))
			})
		]
	});
}
function ScoreCard({ label, value, mean, accent }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("rounded-md border p-4", accent ? "border-accent/40 bg-surface-2" : "border-border"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "kicker mb-2",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "font-mono text-lg tabular-nums text-fg",
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-xs text-muted",
				children: RISK_LABELS[value]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-1 font-mono text-[11px] text-subtle",
				children: ["mean ", mean.toFixed(2)]
			})
		]
	});
}
function MarketsPanel() {
	const cma = useAppStore((s) => s.cma);
	const setCma = useAppStore((s) => s.setCma);
	const resetCma = useAppStore((s) => s.resetCma);
	const answers = useAppStore((s) => s.profile.answers);
	const whatIf = useAppStore((s) => s.whatIf);
	const recommended = profileFromAnswers(answers).profile;
	const active = whatIf.riskOverride ?? recommended;
	const books = modelBooks(cma);
	function setMu(i, pct) {
		const mu = cma.mu.slice();
		mu[i] = pct / 100;
		setCma({
			...cma,
			mu
		});
	}
	function setVol(i, pct) {
		const vol = cma.vol.slice();
		vol[i] = Math.max(0, pct / 100);
		setCma({
			...cma,
			vol
		});
	}
	function setCorr(i, j, v) {
		const corr = cma.corr.map((row) => row.slice());
		corr[i][j] = v;
		corr[j][i] = v;
		setCma({
			...cma,
			corr: symmetrizeCorr(corr)
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
		id: "portfolios",
		kicker: "Books",
		title: "Model portfolios",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-col gap-3",
			children: books.map((p) => {
				const stats = portfolioMoments(p.weights, cma.mu, cma.vol, cma.corr);
				const on = p.riskLevel === active;
				const rec = p.riskLevel === recommended;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: cn("rounded-md border p-4", on ? "border-accent" : "border-border"),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-2 flex flex-wrap items-baseline justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm font-medium text-fg",
									children: p.name
								}),
								rec ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ml-2 text-[10px] tracking-wider text-accent uppercase",
									children: "Recommended"
								}) : null,
								on && !rec ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ml-2 text-[10px] tracking-wider text-warn uppercase",
									children: "What-if"
								}) : null
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "font-mono text-xs tabular-nums text-muted",
								children: [
									"E[r] ",
									formatPct(stats.mu),
									" · σ ",
									formatPct(stats.vol)
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-3 text-xs text-muted",
							children: p.blurb
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex h-3 overflow-hidden rounded-full",
							children: p.weights.map((w, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: {
									width: `${w * 100}%`,
									background: barColor(i)
								},
								title: `${ASSET_LABELS[ASSET_IDS[i]]} ${formatPct(w, 0)}`
							}, ASSET_IDS[i]))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-subtle",
							children: p.weights.map((w, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								ASSET_SHORT[ASSET_IDS[i]],
								" ",
								formatPct(w, 0)
							] }, ASSET_IDS[i]))
						})
					]
				}, p.id);
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-4 text-xs text-subtle",
			children: [
				"Active book: ",
				RISK_LABELS[active],
				". Weights are the CMA mean-variance frontier (long-only, caps). Change the book with the risk-profile control in What-if."
			]
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
		id: "cma",
		kicker: "Assumptions",
		title: "Capital market assumptions",
		action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "h-11 px-3 text-sm text-accent",
			onClick: resetCma,
			children: "Reset"
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-4 text-sm text-muted",
				children: "Annual arithmetic expected returns and volatilities, pairwise correlations, and inflation. Used as-is in the monthly engine (μ/12, σ/√12) with a Cholesky factor of the correlation matrix."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-4 max-w-xs",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Inflation",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
						type: "number",
						step: .1,
						value: (cma.inflation * 100).toFixed(1),
						onChange: (e) => setCma({
							...cma,
							inflation: Number(e.target.value) / 100
						})
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[36rem] text-left text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "text-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "pb-2 font-medium",
								children: "Asset"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "pb-2 font-medium",
								children: "E[r] %"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "pb-2 font-medium",
								children: "Vol %"
							})
						]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: ASSET_IDS.map((id, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-t border-border",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2 pr-3 text-fg",
								children: ASSET_LABELS[id]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2 pr-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
									type: "number",
									step: .1,
									value: (cma.mu[i] * 100).toFixed(1),
									onChange: (e) => setMu(i, Number(e.target.value)),
									className: "h-11 w-24"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
									type: "number",
									step: .1,
									min: 0,
									value: (cma.vol[i] * 100).toFixed(1),
									onChange: (e) => setVol(i, Number(e.target.value)),
									className: "h-11 w-24"
								})
							})
						]
					}, id)) })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mt-6 mb-2 text-sm font-medium",
				children: "Correlation"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "text-left font-mono text-[11px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "pr-2 pb-2" }), ASSET_IDS.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-1 pb-2 font-medium text-muted",
						children: ASSET_SHORT[id]
					}, id))] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: ASSET_IDS.map((id, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "pr-2 text-muted",
						children: ASSET_SHORT[id]
					}), ASSET_IDS.map((jd, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "p-1",
						children: j < i ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block w-16 text-center text-subtle",
							children: cma.corr[i][j].toFixed(2)
						}) : j === i ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block w-16 text-center text-subtle",
							children: "1.00"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
							type: "number",
							step: .01,
							min: -.99,
							max: .99,
							value: cma.corr[i][j],
							onChange: (e) => setCorr(i, j, Number(e.target.value)),
							className: "h-11 w-16 px-1 text-center"
						})
					}, jd))] }, id)) })]
				})
			})
		]
	})] });
}
function barColor(i) {
	return [
		"var(--color-accent)",
		"color-mix(in oklab, var(--color-accent) 80%, var(--color-fg))",
		"color-mix(in oklab, var(--color-accent) 60%, var(--color-fg))",
		"var(--color-muted)",
		"color-mix(in oklab, var(--color-muted) 70%, var(--color-bg))",
		"var(--color-subtle)"
	][i] ?? "var(--color-subtle)";
}
function readToken(name, fallback) {
	if (typeof window === "undefined") return fallback;
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
function FanChart({ result, privacy, currency }) {
	const canvasRef = (0, import_react.useRef)(null);
	const wrapRef = (0, import_react.useRef)(null);
	const [hover, setHover] = (0, import_react.useState)(null);
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
			const bg = readToken("--color-surface", "#101513");
			const grid = readToken("--color-border", "#232a27");
			const muted = readToken("--color-muted", "#8b958f");
			const fg = readToken("--color-fg", "#e4eae6");
			const accent = readToken("--color-accent", "#8fbfb2");
			const outer = readToken("--color-band-outer", "rgba(143,191,178,0.14)");
			const inner = readToken("--color-band-inner", "rgba(143,191,178,0.28)");
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, width, height);
			const pad = {
				l: 56,
				r: 16,
				t: 16,
				b: 32
			};
			const plotW = width - pad.l - pad.r;
			const plotH = height - pad.t - pad.b;
			const n = result.years.length;
			if (n < 2 || plotW <= 0) return;
			const series = privacy ? {
				p5: result.p5.map((v) => result.startWealth ? v / result.startWealth * 100 : 100),
				p25: result.p25.map((v) => result.startWealth ? v / result.startWealth * 100 : 100),
				p50: result.p50.map((v) => result.startWealth ? v / result.startWealth * 100 : 100),
				p75: result.p75.map((v) => result.startWealth ? v / result.startWealth * 100 : 100),
				p95: result.p95.map((v) => result.startWealth ? v / result.startWealth * 100 : 100)
			} : {
				p5: result.p5,
				p25: result.p25,
				p50: result.p50,
				p75: result.p75,
				p95: result.p95
			};
			let min = Infinity;
			let max = -Infinity;
			for (const arr of [series.p5, series.p95]) for (const v of arr) {
				min = Math.min(min, v);
				max = Math.max(max, v);
			}
			if (min === max) {
				min *= .9;
				max *= 1.1;
			}
			const span = max - min || 1;
			min -= span * .08;
			max += span * .08;
			const xAt = (i) => pad.l + i / (n - 1) * plotW;
			const yAt = (v) => pad.t + (1 - (v - min) / (max - min)) * plotH;
			ctx.strokeStyle = grid;
			ctx.lineWidth = 1;
			ctx.font = "11px IBM Plex Sans, sans-serif";
			ctx.fillStyle = muted;
			const ticks = 4;
			for (let t = 0; t <= ticks; t++) {
				const v = min + (max - min) * t / ticks;
				const y = yAt(v);
				ctx.beginPath();
				ctx.moveTo(pad.l, y);
				ctx.lineTo(width - pad.r, y);
				ctx.stroke();
				const label = privacy ? v.toFixed(0) : compact(v);
				ctx.fillText(label, 8, y + 4);
			}
			const yearStep = result.nYears > 40 ? 10 : result.nYears > 20 ? 5 : 2;
			for (let i = 0; i < n; i += yearStep) {
				const x = xAt(i);
				ctx.fillText(String(AS_OF_YEAR + result.years[i]), x - 12, height - 10);
			}
			const band = (hi, lo, color) => {
				ctx.beginPath();
				ctx.fillStyle = color;
				ctx.moveTo(xAt(0), yAt(hi[0]));
				for (let i = 1; i < n; i++) ctx.lineTo(xAt(i), yAt(hi[i]));
				for (let i = n - 1; i >= 0; i--) ctx.lineTo(xAt(i), yAt(lo[i]));
				ctx.closePath();
				ctx.fill();
			};
			band(series.p95, series.p5, outer);
			band(series.p75, series.p25, inner);
			ctx.beginPath();
			ctx.strokeStyle = accent;
			ctx.lineWidth = 1.8;
			ctx.moveTo(xAt(0), yAt(series.p50[0]));
			for (let i = 1; i < n; i++) ctx.lineTo(xAt(i), yAt(series.p50[i]));
			ctx.stroke();
			if (hover != null && hover >= 0 && hover < n) {
				const x = xAt(hover);
				ctx.strokeStyle = fg;
				ctx.globalAlpha = .35;
				ctx.beginPath();
				ctx.moveTo(x, pad.t);
				ctx.lineTo(x, pad.t + plotH);
				ctx.stroke();
				ctx.globalAlpha = 1;
				ctx.fillStyle = accent;
				ctx.beginPath();
				ctx.arc(x, yAt(series.p50[hover]), 3.5, 0, Math.PI * 2);
				ctx.fill();
			}
		};
		draw();
		const ro = new ResizeObserver(draw);
		ro.observe(wrap);
		return () => ro.disconnect();
	}, [
		result,
		privacy,
		hover
	]);
	const i = hover ?? 0;
	const year = AS_OF_YEAR + (result.years[i] ?? 0);
	const med = result.p50[i] ?? 0;
	const lo = result.p5[i] ?? 0;
	const hi = result.p95[i] ?? 0;
	function onMove(e) {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const rect = canvas.getBoundingClientRect();
		const padL = 56;
		const padR = 16;
		const x = e.clientX - rect.left;
		const plotW = rect.width - padL - padR;
		const t = Math.min(1, Math.max(0, (x - padL) / plotW));
		setHover(Math.round(t * (result.years.length - 1)));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: wrapRef,
		className: "relative",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			ref: canvasRef,
			className: "w-full",
			onMouseMove: onMove,
			onMouseLeave: () => setHover(null),
			"aria-label": "Percentile fan chart of projected wealth"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {
						swatch: "var(--color-band-outer)",
						label: "5–95"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {
						swatch: "var(--color-band-inner)",
						label: "25–75"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {
						swatch: "var(--color-accent)",
						label: "Median",
						line: true
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "font-mono tabular-nums text-fg",
				children: [
					year,
					" · ",
					privacy ? `idx ${formatIndex(med, result.startWealth)} (5–95: ${formatIndex(lo, result.startWealth)}–${formatIndex(hi, result.startWealth)})` : `${formatMoney(med, currency, false)}  ·  ${formatNumber(lo, false, 0)} – ${formatNumber(hi, false, 0)}`
				]
			})]
		})]
	});
}
function Legend({ swatch, label, line }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "inline-flex items-center gap-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "inline-block h-2 w-4 rounded-sm",
			style: {
				background: swatch,
				height: line ? 2 : 8
			}
		}), label]
	});
}
function compact(v) {
	const a = Math.abs(v);
	if (a >= 1e6) return `${(v / 1e6).toFixed(1)}m`;
	if (a >= 1e3) return `${(v / 1e3).toFixed(0)}k`;
	return v.toFixed(0);
}
var worker = null;
var workerFailed = false;
var seq = 1;
var busy = false;
var pending = null;
var inflight = null;
function getWorker() {
	if (workerFailed || typeof window === "undefined" || typeof Worker === "undefined") return null;
	if (worker) return worker;
	try {
		worker = new Worker(new URL("./montecarlo.worker.ts", import.meta.url), { type: "module" });
		worker.onmessage = (e) => {
			const msg = e.data;
			const job = inflight;
			inflight = null;
			busy = false;
			if (job && job.id === msg.id) job.resolve(msg.ok ? msg.result : null);
			pump();
		};
		worker.onerror = () => {
			workerFailed = true;
			worker = null;
			if (inflight) {
				inflight.resolve(null);
				inflight = null;
			}
			busy = false;
		};
		return worker;
	} catch {
		workerFailed = true;
		return null;
	}
}
function pump() {
	if (busy) return;
	const next = pending;
	if (!next) return;
	pending = null;
	const w = getWorker();
	if (!w) {
		next.resolve(runMonteCarlo(next.input));
		return;
	}
	busy = true;
	inflight = next;
	w.postMessage({
		id: next.id,
		input: next.input
	});
}
/** Latest-job-wins. Stale runs are dropped. Falls back to the main thread. */
function enqueueMonteCarlo(input) {
	const id = ++seq;
	return new Promise((resolve) => {
		if (pending) pending.resolve(null);
		pending = {
			id,
			input,
			resolve
		};
		if (!getWorker()) {
			pending = null;
			resolve(runMonteCarlo(input));
			return;
		}
		pump();
	});
}
function useSimulation() {
	const profile = useAppStore((s) => s.profile);
	const cma = useAppStore((s) => s.cma);
	const whatIf = useAppStore((s) => s.whatIf);
	const simQuality = useAppStore((s) => s.simQuality);
	const [result, setResult] = (0, import_react.useState)(null);
	const [progress, setProgress] = (0, import_react.useState)(0);
	const [running, setRunning] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const gen = (0, import_react.useRef)(0);
	const cmaError = (0, import_react.useMemo)(() => assertCma(cma), [cma]);
	const nPaths = simQuality === "preview" ? N_PATHS_PREVIEW : N_PATHS;
	const input = (0, import_react.useMemo)(() => {
		if (cmaError) return null;
		return buildSimInput(profile, cma, whatIf, nPaths);
	}, [
		profile,
		cma,
		whatIf,
		cmaError,
		nPaths
	]);
	(0, import_react.useEffect)(() => {
		if (!input) {
			setError(cmaError);
			setRunning(false);
			return;
		}
		setError(null);
		const id = ++gen.current;
		setRunning(true);
		setProgress(0);
		const delay = simQuality === "preview" ? 40 : 80;
		const handle = window.setTimeout(() => {
			setProgress(.15);
			enqueueMonteCarlo(input).then((res) => {
				if (gen.current !== id) return;
				if (res) setResult(res);
				setRunning(false);
				setProgress(1);
			});
		}, delay);
		return () => {
			window.clearTimeout(handle);
			gen.current++;
		};
	}, [
		input,
		cmaError,
		simQuality
	]);
	return {
		result,
		running,
		progress,
		error,
		input,
		nPaths
	};
}
function ResultsPanel() {
	const profile = useAppStore((s) => s.profile);
	const privacy = useAppStore((s) => s.privacy);
	const whatIf = useAppStore((s) => s.whatIf);
	const cma = useAppStore((s) => s.cma);
	const setWhatIf = useAppStore((s) => s.setWhatIf);
	const resetWhatIf = useAppStore((s) => s.resetWhatIf);
	const beginLiveEdit = useAppStore((s) => s.beginLiveEdit);
	const endLiveEdit = useAppStore((s) => s.endLiveEdit);
	const { result, running, progress, error, nPaths } = useSimulation();
	const scored = profileFromAnswers(profile.answers);
	const level = effectiveRiskLevel(profile, whatIf);
	const book = effectivePortfolio(profile, whatIf, cma);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4 lg:sticky lg:top-20",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				id: "whatif",
				kicker: "Live",
				title: "What-if",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-4 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Sliders re-run 10,000 paths on the same seed."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-11 px-2 text-sm text-accent",
						onClick: resetWhatIf,
						children: "Reset"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRow, {
							label: "Save more",
							valueLabel: `+${whatIf.extraSavingsPts.toFixed(0)} pp`,
							min: 0,
							max: 20,
							step: 1,
							value: whatIf.extraSavingsPts,
							onChange: (n) => setWhatIf({ extraSavingsPts: n }),
							onLiveStart: beginLiveEdit,
							onLiveEnd: endLiveEdit
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRow, {
							label: "Retire later",
							valueLabel: `+${whatIf.retireLaterYears.toFixed(0)} yr`,
							min: 0,
							max: 10,
							step: 1,
							value: whatIf.retireLaterYears,
							onChange: (n) => setWhatIf({ retireLaterYears: n }),
							onLiveStart: beginLiveEdit,
							onLiveEnd: endLiveEdit
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Risk profile",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-5 gap-1",
								children: MODEL_PORTFOLIOS.map((p) => {
									const on = level === p.riskLevel;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setWhatIf({ riskOverride: p.riskLevel }),
										className: cn("flex h-11 items-center justify-center rounded-md border text-[11px]", on ? "border-accent bg-accent text-accent-fg" : "border-border text-muted"),
										children: p.riskLevel
									}, p.id);
								})
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-xs text-muted",
							children: [
								RISK_LABELS[level],
								" · questionnaire ",
								RISK_LABELS[scored.profile]
							]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRow, {
							label: "Advisory fee",
							valueLabel: `${(whatIf.fee * 100).toFixed(2)}%`,
							min: 0,
							max: 1.5,
							step: .05,
							value: whatIf.fee * 100,
							onChange: (n) => setWhatIf({ fee: n / 100 }),
							onLiveStart: beginLiveEdit,
							onLiveEnd: endLiveEdit
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Rebalancing",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setWhatIf({ rebalance: "monthly" }),
									className: cn("flex h-11 items-center justify-center rounded-md border text-xs", whatIf.rebalance !== "none" ? "border-accent bg-accent text-accent-fg" : "border-border text-muted"),
									children: "Monthly"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setWhatIf({ rebalance: "none" }),
									className: cn("flex h-11 items-center justify-center rounded-md border text-xs", whatIf.rebalance === "none" ? "border-accent bg-accent text-accent-fg" : "border-border text-muted"),
									children: "Let weights drift"
								})]
							})
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				id: "results",
				kicker: "Projection",
				title: "Goal Monte Carlo",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-4 flex flex-wrap items-center gap-3 text-xs text-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-mono tabular-nums",
							children: [nPaths.toLocaleString(), " paths"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "· monthly · 6-asset" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["· ", whatIf.rebalance === "none" ? "no rebalance" : "rebalanced"] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["· seed ", profile.seed] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["· ", book.name] }),
						nPaths < 1e4 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-warn",
							children: "preview"
						}) : null,
						running ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-accent",
							children: [
								"Updating ",
								(progress * 100).toFixed(0),
								"%"
							]
						}) : null
					]
				}), error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-danger",
					children: error
				}) : !result ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Running the first 10,000 paths…"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					profile.goals.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-4 text-sm text-muted",
						children: "Add a goal to see success probabilities."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-5 flex flex-col gap-2",
						children: profile.goals.map((g) => {
							const r = result.goals.find((x) => x.goalId === g.id);
							if (!r) return null;
							const tone = r.successRate >= .8 ? "text-ok" : r.successRate >= .5 ? "text-warn" : "text-danger";
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-border px-3 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-sm text-fg",
									children: g.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-xs text-muted",
									children: ["Priority ", g.priority]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-right",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: cn("font-mono text-lg tabular-nums", tone),
										children: formatPct(r.successRate, 1)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs text-muted",
										children: r.nFail === 0 ? "No shortfall" : privacy ? `median shortfall idx ${formatIndex(r.medianShortfall, Math.max(g.targetAmount, 1))}` : `median shortfall ${formatMoney(r.medianShortfall, profile.currency, false)}`
									})]
								})]
							}, g.id);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FanChart, {
						result,
						privacy,
						currency: profile.currency
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-xs leading-relaxed text-subtle",
						children: riskRationale(scored.tolerance, scored.capacity, scored.profile)
					})
				] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				id: "fees",
				kicker: "Cost",
				title: "Fee impact",
				children: [!result ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Waiting for the simulation."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 sm:grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Median ending wealth, with fee",
							value: privacy ? `idx ${formatIndex(result.medianTerminal, result.startWealth || 1)}` : formatMoney(result.medianTerminal, profile.currency, false)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Without fee",
							value: privacy ? `idx ${formatIndex(result.medianTerminalNoFee, result.startWealth || 1)}` : formatMoney(result.medianTerminalNoFee, profile.currency, false)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Fee drag",
							value: privacy ? formatPct(result.feeDragPct) : `${formatMoney(result.feeDrag, profile.currency, false)}  (${formatPct(result.feeDragPct)})`,
							warn: true
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-4 text-xs text-muted",
					children: [
						"Same return path, same cashflows, with and without the advisory fee of ",
						formatPct(whatIf.fee, 2),
						". Drag is the difference in median terminal wealth."
					]
				})]
			})
		]
	});
}
function Metric({ label, value, warn }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-md border border-border p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-2 text-xs text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: cn("font-mono text-sm tabular-nums", warn ? "text-warn" : "text-fg"),
			children: value
		})]
	});
}
function PlannerPage() {
	const mode = useAppStore((s) => s.mode);
	const demoId = useAppStore((s) => s.demoId);
	const loadDemo = useAppStore((s) => s.loadDemo);
	const copyDemoToMyData = useAppStore((s) => s.copyDemoToMyData);
	const profile = useAppStore((s) => s.profile);
	const privacy = useAppStore((s) => s.privacy);
	const whatIf = useAppStore((s) => s.whatIf);
	const cma = useAppStore((s) => s.cma);
	const usedAsClient = usePortfolioStore((s) => s.usedAsClient);
	const demoLedger = usePortfolioStore((s) => s.demo);
	const mydataLedger = usePortfolioStore((s) => s.mydata);
	const costMethod = usePortfolioStore((s) => s.costMethod);
	const ledger = mode === "demo" ? demoLedger : mydataLedger;
	const holdings = usedAsClient && ledger.transactions.length ? computeHoldings(ledger, costMethod, mode === "demo" ? DEMO_AS_OF : (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)) : null;
	const book = effectivePortfolio(profile, whatIf, cma);
	const { result } = useSimulation();
	const asOf = mode === "demo" ? `${AS_OF_YEAR}-09-01` : (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-6 flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "kicker mb-2",
						children: "Client planning"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-2xl font-medium tracking-tight text-fg sm:text-3xl",
						children: profile.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-muted",
						children: [
							mode === "demo" ? "Demo household" : "My Data · stored only in this browser",
							" · as of ",
							AS_OF_YEAR,
							privacy ? " · Privacy on" : ""
						]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: requestShowTour,
							className: "inline-flex h-11 items-center rounded-md border border-border px-4 text-sm text-fg",
							children: "Show this"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PdfDownloadButton, {
							label: "Download proposal PDF",
							build: () => buildProposalPdf({
								profile,
								cma,
								whatIf,
								privacy,
								result: result && result.nPaths === 1e4 ? result : void 0,
								nPaths: N_PATHS,
								holdings,
								asOf
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: copyDemoToMyData,
							className: "inline-flex h-11 items-center rounded-md border border-border px-4 text-sm text-fg",
							children: "Copy into My Data"
						})
					]
				})]
			}),
			mode === "demo" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-6 grid gap-2 sm:grid-cols-3",
				children: DEMO_CLIENTS.map((c) => {
					const on = demoId === c.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => loadDemo(c.id),
						className: cn("rounded-lg border p-4 text-left", on ? "border-accent bg-surface" : "border-border bg-surface-2"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm font-medium text-fg",
								children: c.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1 text-xs text-muted",
								children: DEMO_BLURBS[c.id]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2 font-mono text-[11px] text-subtle",
								children: c.currency
							})
						]
					}, c.id);
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-6 rounded-md border border-border bg-surface px-4 py-3 text-sm text-muted",
				children: "Figures stay in localStorage on this device. Nothing is sent to a server."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-4 lg:flex-row lg:items-start",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "order-2 flex min-w-0 flex-1 flex-col gap-4 lg:order-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HouseholdForm, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GoalsForm, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RiskPanel, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarketsPanel, {})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "order-1 w-full shrink-0 lg:order-2 lg:w-96",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultsPanel, {}), holdings ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GapPanel, {
							holdings,
							model: book,
							securities: ledger.securities,
							privacy
						})
					}) : null]
				})]
			})
		]
	});
}
function Planner() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlannerPage, {});
}
//#endregion
export { Planner as component };
