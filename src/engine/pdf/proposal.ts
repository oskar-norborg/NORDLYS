/** Client proposal PDF from the Planner engines. */

import type { CapitalMarketAssumptions, ClientProfile, SimResult, WhatIf } from "../types";
import { ASSET_LABELS, ASSET_IDS, GOAL_TYPE_LABELS, RISK_LABELS, AS_OF_YEAR, N_PATHS } from "../types";
import { formatBp, formatIndex, formatMoney, formatPct } from "../format";
import { deflateByInflation } from "../finance";
import { profileFromAnswers, riskRationale } from "../risk";
import { buildSimInput, effectivePortfolio, effectiveRiskLevel } from "../schedule";
import { runMonteCarlo } from "../montecarlo";
import { defaultWhatIf } from "@/data/storage";
import { analyzeGap } from "../ledger/gap";
import type { GapAnalysis, HoldingsResult } from "../ledger/types";
import { PdfDoc, C } from "./layout";
import { pieWithLegend, fanOps, barPairOps } from "./charts";

export interface ProposalInput {
  profile: ClientProfile;
  cma: CapitalMarketAssumptions;
  whatIf: WhatIf;
  privacy: boolean;
  result?: SimResult | null;
  baseline?: SimResult | null;
  holdings?: HoldingsResult | null;
  nPaths?: number;
  asOf?: string;
}

export interface BuiltPdf {
  bytes: Uint8Array;
  fileName: string;
  layout?: import("./layout").LayoutReport;
}

function moneyOrIndex(value: number, profile: ClientProfile, privacy: boolean, start: number): string {
  if (privacy) return `idx ${formatIndex(value, Math.max(start, 1))}`;
  return formatMoney(value, profile.currency, false);
}

export function buildProposalPdf(input: ProposalInput): BuiltPdf {
  const { profile, cma, whatIf, privacy } = input;
  const nPaths = input.nPaths ?? N_PATHS;
  const asOf = input.asOf ?? `${AS_OF_YEAR}-09-10`;
  const book = effectivePortfolio(profile, whatIf, cma);
  const scored = profileFromAnswers(profile.answers);
  const level = effectiveRiskLevel(profile, whatIf);
  let result = input.result ?? null;
  if (!result || result.nPaths !== nPaths) {
    result = runMonteCarlo(buildSimInput(profile, cma, whatIf, nPaths));
  }
  const baseWhat = defaultWhatIf(profile.fee);
  const sameWhat =
    whatIf.extraSavingsPts === 0 &&
    whatIf.retireLaterYears === 0 &&
    whatIf.riskOverride == null &&
    Math.abs(whatIf.fee - profile.fee) < 1e-12;
  let baseline = input.baseline ?? null;
  if (!baseline || baseline.nPaths !== nPaths) {
    baseline = sameWhat ? result : runMonteCarlo(buildSimInput(profile, cma, baseWhat, nPaths));
  }

  let gap: GapAnalysis | null = null;
  if (input.holdings && input.holdings.totalMarket > 0) {
    gap = analyzeGap(input.holdings, book, input.holdings.holdings.map((h) => h.security));
  }

  const members = profile.members.map((m) => m.name).join(" · ") || profile.name;
  const start = result.startWealth || profile.currentAssets || 1;

  const doc = new PdfDoc({
    title: `NORDLYS Investment Proposal — ${profile.name}`,
    headerLeft: "NORDLYS  ·  Investment proposal",
    headerRight: privacy ? `${profile.name}  ·  Privacy` : profile.name,
    footerNote: "Hypothetical illustration - not a guarantee of future results",
    privacy,
  });

  doc.coverBand(
    profile.name,
    "Investment proposal",
    `As of ${asOf}${privacy ? "" : `  ·  ${profile.currency}`}  ·  seed ${profile.seed}`,
    privacy ? "PRIVACY MODE" : "CONFIDENTIAL",
  );

  doc.paragraph(
    `Prepared for ${members}. This document summarises the recommended book, the probability of reaching each goal under the stated assumptions, and the effect of the advisory fee. Figures are produced in-browser by the NORDLYS engine; nothing in this file was typed in by hand.`,
    { size: 9.5, leading: 13, color: C.ink },
  );
  doc.spacer(10);

  doc.heading("Executive summary");
  const primary = profile.goals[0];
  const pRes = primary ? result.goals.find((g) => g.goalId === primary.id) : null;
  const summaryBits = [
    `${profile.members.length} member${profile.members.length === 1 ? "" : "s"}; current capital ${formatMoney(profile.currentAssets, profile.currency, privacy)}.`,
    `Risk book ${RISK_LABELS[level]} (${book.name}) from willingness ${scored.tolerance} and capacity ${scored.capacity}.`,
    pRes && primary
      ? `Primary goal “${primary.name}” succeeds in ${formatPct(pRes.successRate, 1)} of ${result.nPaths.toLocaleString()} paths.`
      : `Horizon ${result.nYears} years; median terminal ${moneyOrIndex(result.medianTerminal, profile, privacy, start)}.`,
    `Advisory fee ${formatPct(whatIf.fee, 2)} reduces median ending wealth by ${privacy ? formatPct(result.feeDragPct) : `${formatMoney(result.feeDrag, profile.currency, false)} (${formatPct(result.feeDragPct)})`}.`,
  ];
  for (const b of summaryBits) doc.paragraph(b, { size: 9, leading: 12.5 });

  doc.metricRow([
    { label: "Median terminal", value: moneyOrIndex(result.medianTerminal, profile, privacy, start) },
    {
      label: "Primary success",
      value: pRes ? formatPct(pRes.successRate, 1) : "—",
    },
    { label: "Fee drag", value: formatPct(result.feeDragPct) },
    { label: "Paths x years", value: `${result.nPaths} x ${result.nYears}` },
  ]);

  doc.heading("Goals");
  if (profile.goals.length === 0) {
    doc.paragraph("No goals are on the plan. Add a retirement income, home, education or legacy target to score success.");
  } else {
    doc.addTable(
      [
        { header: "Goal", width: 160 },
        { header: "Type", width: 90 },
        { header: "When", width: 50, align: "right" },
        { header: "Amount", width: 80, align: "right" },
        { header: "Success", width: 55, align: "right" },
        { header: "Median shortfall", width: 80, align: "right" },
      ],
      profile.goals.map((g) => {
        const r = result.goals.find((x) => x.goalId === g.id);
        return [
          g.name,
          GOAL_TYPE_LABELS[g.type],
          String(g.year),
          formatMoney(g.targetAmount, profile.currency, privacy),
          r ? formatPct(r.successRate, 1) : "—",
          r && r.nFail > 0 ? moneyOrIndex(r.medianShortfall, profile, privacy, Math.max(g.targetAmount, 1)) : "None",
        ];
      }),
    );
  }

  doc.heading("Risk profile");
  doc.paragraph(riskRationale(scored.tolerance, scored.capacity, scored.profile), { size: 9, leading: 12.5 });
  doc.spacer(4);
  doc.addTable(
    [
      { header: "Dimension", width: 160 },
      { header: "Score", width: 70, align: "right" },
      { header: "Label", width: 180 },
    ],
    [
      ["Willingness (tolerance)", String(scored.tolerance), RISK_LABELS[scored.tolerance] ?? ""],
      ["Ability (capacity)", String(scored.capacity), RISK_LABELS[scored.capacity] ?? ""],
      ["Recommended book", String(scored.profile), RISK_LABELS[scored.profile] ?? ""],
      [
        "Applied book",
        String(level),
        whatIf.riskOverride != null ? `${RISK_LABELS[level]} (what-if override)` : RISK_LABELS[level] ?? "",
      ],
    ],
  );

  doc.heading("Recommended allocation", 160);
  doc.paragraph(`${book.name}. ${book.blurb}`, { size: 9, leading: 12 });
  const pieBox = doc.chartBox(150);
  doc.raw(
    pieWithLegend(
      pieBox,
      ASSET_IDS.map((id, i) => ({
        value: book.weights[i] ?? 0,
        label: ASSET_LABELS[id],
        caption: formatPct(book.weights[i] ?? 0, 1),
      })),
    ),
  );
  doc.addTable(
    [
      { header: "Asset class", width: 200 },
      { header: "Weight", width: 80, align: "right" },
      { header: "Expected return", width: 90, align: "right" },
      { header: "Volatility", width: 80, align: "right" },
    ],
    ASSET_IDS.map((id, i) => [
      ASSET_LABELS[id],
      formatPct(book.weights[i] ?? 0, 1),
      formatPct(cma.mu[i] ?? 0, 1),
      formatPct(cma.vol[i] ?? 0, 1),
    ]),
  );

  doc.heading("Projected outcomes", 180);
  doc.paragraph(
    `Percentile fan of portfolio wealth in today’s money (real), ${result.nPaths.toLocaleString()} monthly paths, seed ${profile.seed}. ` +
      (privacy
        ? "Privacy mode: series are indexed to 100 at the start."
        : `Inflation ${formatPct(cma.inflation, 1)} is stripped from the paths so the chart is comparable to today’s goals.`),
    { size: 9, leading: 12 },
  );
  const realP5 = deflateByInflation(result.p5, result.years, cma.inflation);
  const realP25 = deflateByInflation(result.p25, result.years, cma.inflation);
  const realP50 = deflateByInflation(result.p50, result.years, cma.inflation);
  const realP75 = deflateByInflation(result.p75, result.years, cma.inflation);
  const realP95 = deflateByInflation(result.p95, result.years, cma.inflation);
  const scale = privacy ? 100 / Math.max(start, 1) : 1;
  const fanBox = doc.chartBox(168);
  const calYears = result.years.map((y) => AS_OF_YEAR + y);
  doc.raw(
    fanOps(
      fanBox,
      calYears,
      {
        p5: realP5.map((v) => v * scale),
        p25: realP25.map((v) => v * scale),
        p50: realP50.map((v) => v * scale),
        p75: realP75.map((v) => v * scale),
        p95: realP95.map((v) => v * scale),
      },
      privacy ? "Index (start = 100)" : `Today’s ${profile.currency}`,
    ),
  );
  doc.paragraph("Shaded bands are the 5th–95th and 25th–75th percentiles; the line is the median. Amounts are real.", {
    size: 8,
    color: C.muted,
  });

  doc.heading("Probability of success");
  if (profile.goals.length === 0) {
    doc.paragraph("No goals to score.");
  } else {
    doc.addTable(
      [
        { header: "Goal", width: 200 },
        { header: "P(success)", width: 80, align: "right" },
        { header: "Failures", width: 70, align: "right" },
        { header: "Median shortfall when unsuccessful", width: 150, align: "right" },
      ],
      profile.goals.map((g) => {
        const r = result.goals.find((x) => x.goalId === g.id);
        return [
          g.name,
          r ? formatPct(r.successRate, 1) : "—",
          r ? String(r.nFail) : "—",
          r && r.nFail ? moneyOrIndex(r.medianShortfall, profile, privacy, Math.max(g.targetAmount, 1)) : "—",
        ];
      }),
    );
  }

  doc.heading("Fee impact");
  doc.paragraph(
    `The same return draws are applied with and without the advisory fee of ${formatPct(whatIf.fee, 2)} (${formatBp(whatIf.fee)}). Drag is the difference in median terminal wealth.`,
    { size: 9, leading: 12 },
  );
  doc.addTable(
    [
      { header: "Measure", width: 220 },
      { header: "With fee", width: 120, align: "right" },
      { header: "Without fee", width: 120, align: "right" },
    ],
    [
      [
        "Median ending wealth",
        moneyOrIndex(result.medianTerminal, profile, privacy, start),
        moneyOrIndex(result.medianTerminalNoFee, profile, privacy, start),
      ],
      [
        "Fee drag",
        privacy ? formatPct(result.feeDragPct) : formatMoney(result.feeDrag, profile.currency, false),
        formatPct(result.feeDragPct),
      ],
    ],
  );

  doc.heading("What-if comparison");
  const whatBits: string[] = [];
  if (whatIf.extraSavingsPts) whatBits.push(`save ${whatIf.extraSavingsPts.toFixed(0)} pp more`);
  if (whatIf.retireLaterYears) whatBits.push(`retire ${whatIf.retireLaterYears} year(s) later`);
  if (whatIf.riskOverride != null) whatBits.push(`risk override ${RISK_LABELS[whatIf.riskOverride]}`);
  if (Math.abs(whatIf.fee - profile.fee) > 1e-12) whatBits.push(`fee ${formatPct(whatIf.fee, 2)}`);
  doc.paragraph(
    whatBits.length
      ? `Applied adjustments: ${whatBits.join("; ")}.`
      : "No what-if adjustments are applied; both columns use the questionnaire book, stated savings rate, and the household fee.",
    { size: 9, leading: 12 },
  );
  const goalRows = profile.goals.map((g) => {
    const a = baseline.goals.find((x) => x.goalId === g.id);
    const b = result.goals.find((x) => x.goalId === g.id);
    return [g.name, a ? formatPct(a.successRate, 1) : "—", b ? formatPct(b.successRate, 1) : "—"];
  });
  doc.addTable(
    [
      { header: "Measure", width: 200 },
      { header: "Base plan", width: 130, align: "right" },
      { header: "What-if", width: 130, align: "right" },
    ],
    [
      [
        "Median terminal wealth",
        moneyOrIndex(baseline.medianTerminal, profile, privacy, start),
        moneyOrIndex(result.medianTerminal, profile, privacy, start),
      ],
      ["Fee drag", formatPct(baseline.feeDragPct), formatPct(result.feeDragPct)],
      ...goalRows,
    ],
  );

  doc.heading("Current versus recommended", 170);
  if (gap && input.holdings) {
    const barBox = doc.chartBox(Math.min(168, 28 + gap.rows.length * 22));
    doc.raw(
      barPairOps(
        barBox,
        gap.rows.map((r) => ({
          label: ASSET_LABELS[r.assetClass],
          a: r.currentWeight,
          b: r.targetWeight,
        })),
        ["Current", "Recommended"],
      ),
    );
    doc.addTable(
      [
        { header: "Class", width: 120 },
        { header: "Current", width: 70, align: "right" },
        { header: "Target", width: 70, align: "right" },
        { header: "Gap", width: 90, align: "right" },
      ],
      gap.rows.map((r) => [
        ASSET_LABELS[r.assetClass],
        formatPct(r.currentWeight, 1),
        formatPct(r.targetWeight, 1),
        privacy ? formatPct(r.targetWeight - r.currentWeight, 1, true) : formatMoney(r.gap, "NOK", false),
      ]),
    );
    if (gap.trades.length) {
      doc.paragraph("Rebalancing trades, whole-share rounded:", { size: 9 });
      doc.addTable(
        [
          { header: "Side", width: 50 },
          { header: "Name", width: 160 },
          { header: "Shares", width: 60, align: "right" },
          { header: "Value", width: 90, align: "right" },
        ],
        gap.trades.map((t) => [
          t.side.toUpperCase(),
          t.name,
          String(t.shares),
          privacy ? "••••" : formatMoney(t.valueNok, "NOK", false),
        ]),
      );
    } else {
      doc.paragraph("No whole-share trades are required at the current gap tolerance.");
    }
  } else {
    doc.paragraph(
      "No imported holdings are linked to this household. The table is the model book only. Use “Use as client” on the Portfolio page to load current weights and a trade list.",
      { size: 9, leading: 12 },
    );
    doc.addTable(
      [
        { header: "Asset class", width: 220 },
        { header: "Recommended weight", width: 140, align: "right" },
      ],
      ASSET_IDS.map((id, i) => [ASSET_LABELS[id], formatPct(book.weights[i] ?? 0, 1)]),
    );
  }

  doc.heading("Assumptions", 120);
  doc.paragraph(
    `Capital-market assumptions are arithmetic, nominal, annual. Monthly steps use mu/12 and vol/sqrt(12). Correlated normals come from the Cholesky factor of the correlation matrix. Rebalancing is ${whatIf.rebalance === "none" ? "off (weights drift)" : "monthly to target weights"}. Inflation ${formatPct(cma.inflation, 1)}. Engine seed ${profile.seed}.`,
    { size: 9, leading: 12 },
  );
  doc.addTable(
    [
      { header: "Class", width: 140 },
      { header: "mu", width: 50, align: "right" },
      { header: "vol", width: 50, align: "right" },
      ...ASSET_IDS.map((id) => ({ header: ASSET_LABELS[id].slice(0, 6), width: 42, align: "right" as const })),
    ],
    ASSET_IDS.map((id, i) => [
      ASSET_LABELS[id],
      formatPct(cma.mu[i] ?? 0, 1),
      formatPct(cma.vol[i] ?? 0, 1),
      ...ASSET_IDS.map((_, j) => (cma.corr[i]?.[j] ?? 0).toFixed(2)),
    ]),
    { fontSize: 7 },
  );

  if (book.source === "fallback") {
    doc.paragraph("Allocation source: fallback allocation. The optimizer did not meet the advisory ladder bands for this book, so the published fallback weights are used.", {
      size: 8,
      leading: 11,
      color: C.muted,
    });
  } else {
    doc.paragraph("Allocation source: mean-variance optimizer inside the advisory ladder bands.", {
      size: 8,
      leading: 11,
      color: C.muted,
    });
  }

  doc.heading("Appendix — nominal fan", 80);
  doc.paragraph(
    "The same percentile paths before deflating by inflation. Use this table if you need year-of-spend kroner; the chart above is in today’s money.",
    { size: 8, leading: 11, color: C.muted },
  );
  const step = result.years.length > 20 ? 10 : result.years.length > 10 ? 5 : 2;
  const rows: string[][] = [];
  for (let i = 0; i < result.years.length; i += step) {
    rows.push([
      String(AS_OF_YEAR + result.years[i]!),
      privacy ? "—" : formatMoney(result.p5[i] ?? 0, profile.currency, false),
      privacy ? "—" : formatMoney(result.p50[i] ?? 0, profile.currency, false),
      privacy ? "—" : formatMoney(result.p95[i] ?? 0, profile.currency, false),
    ]);
  }
  const last = result.years.length - 1;
  if (last >= 0 && last % step !== 0) {
    rows.push([
      String(AS_OF_YEAR + result.years[last]!),
      privacy ? "—" : formatMoney(result.p5[last] ?? 0, profile.currency, false),
      privacy ? "—" : formatMoney(result.p50[last] ?? 0, profile.currency, false),
      privacy ? "—" : formatMoney(result.p95[last] ?? 0, profile.currency, false),
    ]);
  }
  doc.addTable(
    [
      { header: "Year", width: 70 },
      { header: "p5 nominal", width: 110, align: "right" },
      { header: "Median nominal", width: 120, align: "right" },
      { header: "p95 nominal", width: 110, align: "right" },
    ],
    rows,
    { fontSize: 8 },
  );

  doc.heading("Disclaimer");
  doc.paragraph(
    "This proposal is prepared by NORDLYS for the named household. Monte Carlo projections use the stated capital-market assumptions, the household’s cash-flows, and a seeded generator so every figure can be reproduced. They are hypothetical illustrations, not forecasts or guarantees of future results. Markets can lose money. Fees reduce wealth. Past performance is not indicative of future results. NORDLYS does not provide legal, tax, or regulated investment advice in this document.",
    { size: 8, leading: 11, color: C.muted },
  );

  const bytes = doc.finish();
  const slug = profile.name.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "") || "client";
  return { bytes, fileName: `NORDLYS-Proposal-${slug}-${asOf}.pdf`, layout: doc.layout };
}
