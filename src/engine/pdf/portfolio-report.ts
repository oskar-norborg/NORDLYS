/** Portfolio report PDF: performance, risk, allocation, contributors. */

import type { CapitalMarketAssumptions, ClientProfile, WhatIf } from "../types";
import { ASSET_IDS, ASSET_LABELS } from "../types";
import { formatIndex, formatMoney, formatPct } from "../format";
import { computeHoldings } from "../ledger/holdings";
import { computeReturns, annualize } from "../ledger/returns";
import type { CostMethod, LedgerBundle } from "../ledger/types";
import { historicalRiskAvailable, holdingsWithoutImportedHistory } from "../ledger/prices";
import { covFromVolCorr } from "../cov";
import {
  drawdownFromNav,
  ratiosFromReturns,
  riskContributions,
  simpleReturns,
  historicalVarEs,
} from "../risk-metrics";
import { effectivePortfolio } from "../schedule";
import { PdfDoc, C, CHART_PALETTE } from "./layout";
import { pieWithLegend, lineOps, barPairOps } from "./charts";
import type { BuiltPdf } from "./proposal";

export interface PortfolioReportInput {
  ledger: LedgerBundle;
  profile: ClientProfile;
  cma: CapitalMarketAssumptions;
  whatIf: WhatIf;
  costMethod: CostMethod;
  privacy: boolean;
  asOf: string;
  mode: "demo" | "mydata";
}

export function buildPortfolioReportPdf(input: PortfolioReportInput): BuiltPdf {
  const { ledger, profile, cma, whatIf, costMethod, privacy, asOf, mode } = input;
  const holdings = computeHoldings(ledger, costMethod, asOf);
  const returns = computeReturns(ledger, costMethod, asOf);
  const historyOk = historicalRiskAvailable(mode, ledger);
  const missingHist = holdingsWithoutImportedHistory(
    ledger,
    holdings.holdings.map((h) => ({ isin: h.isin, name: h.security.name })),
  );
  const book = effectivePortfolio(profile, whatIf, cma);
  const twrAnn = annualize(returns.twr, returns.startDate, returns.endDate);
  const navVals = returns.nav.map((p) => p.value);
  const rets = historyOk ? simpleReturns(navVals) : [];
  const dd = historyOk ? drawdownFromNav(returns.nav) : null;
  const ratios = historyOk && rets.length > 2 ? ratiosFromReturns(rets, 0.02, dd?.maxDd ?? 0, 12) : null;
  const var95 = historyOk && rets.length ? historicalVarEs(rets, 0.95) : null;
  const startNav = returns.nav[0]?.value || holdings.totalMarket || 1;

  const doc = new PdfDoc({
    title: `NORDLYS Portfolio Report — ${profile.name}`,
    headerLeft: "NORDLYS  ·  Portfolio report",
    headerRight: privacy ? `${profile.name}  ·  Privacy` : profile.name,
    footerNote: "Hypothetical illustration - not a guarantee of future results",
    privacy,
  });

  doc.coverBand(
    profile.name,
    "Portfolio report",
    `As of ${asOf}  ·  ${costMethod === "fifo" ? "FIFO" : "Average cost"}  ·  ${mode === "demo" ? "Demo" : "My Data"}`,
    privacy ? "PRIVACY MODE" : "CONFIDENTIAL",
  );
  doc.paragraph(
    privacy
      ? `Holdings, returns and risk are computed from the ledger in this browser. The planning household is ${profile.name}.`
      : `Holdings, returns and risk are computed from the ledger in this browser. Base currency NOK for positions; the planning household is ${profile.name} (${profile.currency}).`,
    { size: 9.5, leading: 13 },
  );
  doc.spacer(8);

  doc.heading("Performance");
  doc.metricRow([
    {
      label: "Market value",
      value: privacy ? `idx ${formatIndex(holdings.totalMarket, startNav)}` : formatMoney(holdings.totalMarket, "NOK", false),
    },
    { label: "TWR (ann.)", value: Number.isFinite(twrAnn) ? formatPct(twrAnn, 1, true) : "—" },
    { label: "XIRR", value: Number.isFinite(returns.xirr) ? formatPct(returns.xirr, 1, true) : "—" },
    { label: "Unreal. P&L", value: privacy ? formatPct(holdings.totalMarket ? holdings.totalUnrealized / holdings.totalMarket : 0, 1, true) : formatMoney(holdings.totalUnrealized, "NOK", false) },
  ]);

  if (returns.nav.length >= 2) {
    const base = returns.nav[0]!.value || 1;
    const series = returns.nav.map((p, i) => ({
      x: i,
      y: privacy ? (p.value / base) * 100 : p.value,
    }));
    const box = doc.chartBox(150);
    doc.raw(lineOps(box, [series], [C.navy], privacy ? "Index" : "NOK"));
    doc.paragraph(
      `NAV from ${returns.startDate} to ${returns.endDate}. ${privacy ? "Indexed to 100 at the first point." : ""}`,
      { size: 8, color: C.muted },
    );
  } else {
    doc.paragraph("Not enough NAV points to draw a performance line.");
  }

  doc.heading("Risk metrics", 80);
  if (!historyOk) {
    doc.paragraph("Not available: import price history");
    if (missingHist.length) {
      doc.paragraph(
        `Holdings without imported price history: ${missingHist.map((h) => h.name || h.isin).join(", ")}.`,
        { size: 9, leading: 12 },
      );
    }
  } else {
    doc.addTable(
      [
        { header: "Metric", width: 160 },
        { header: "Value", width: 100, align: "right" },
        { header: "Note", width: 200 },
      ],
      [
        ["Volatility (ann.)", formatPct(ratios?.vol ?? 0, 1), "Sample standard deviation of simple returns"],
        ["Sharpe (rf 2%)", (ratios?.sharpe ?? 0).toFixed(2), "Annualised excess / vol"],
        ["Sortino", (ratios?.sortino ?? 0).toFixed(2), "Downside deviation of excess returns"],
        ["Calmar", (ratios?.calmar ?? 0).toFixed(2), "Annualised mean / max drawdown"],
        ["Max drawdown", formatPct(dd?.maxDd ?? 0, 1), dd?.maxDdTrough ? `Trough ${dd.maxDdTrough}` : ""],
        [
          "Recovery",
          dd?.recovered && dd.recoveryDays != null ? `${dd.recoveryDays} days` : "Open",
          dd?.recovered ? "Returned to prior peak" : "Still underwater vs peak",
        ],
        ["Hist. 95% VaR", var95 ? formatPct(var95.var, 2) : "-", "Monthly loss quantile"],
        ["Hist. 95% ES", var95 ? formatPct(var95.es, 2) : "-", "Mean loss beyond VaR"],
      ],
    );
  }

  doc.heading("Allocation", 170);
  const pieBox = doc.chartBox(150);
  doc.raw(
    pieWithLegend(
      pieBox,
      holdings.allocation.map((a, i) => ({
        value: a.value,
        label: ASSET_LABELS[a.assetClass],
        caption: formatPct(a.weight, 1),
        color: CHART_PALETTE[i % CHART_PALETTE.length],
      })),
    ),
  );
  const barBox = doc.chartBox(Math.min(160, 24 + ASSET_IDS.length * 20));
  doc.raw(
    barPairOps(
      barBox,
      ASSET_IDS.map((id, i) => ({
        label: ASSET_LABELS[id],
        a: holdings.allocation.find((x) => x.assetClass === id)?.weight ?? 0,
        b: book.weights[i] ?? 0,
      })),
      ["Current", "Model book"],
    ),
  );

  doc.heading("Top contributors");
  const top = holdings.holdings.slice().sort((a, b) => Math.abs(b.unrealizedNok) - Math.abs(a.unrealizedNok)).slice(0, 8);
  if (top.length === 0) {
    doc.paragraph("No security holdings.");
  } else {
    doc.addTable(
      [
        { header: "Name", width: 150 },
        { header: "Weight", width: 55, align: "right" },
        { header: "uP&L", width: 75, align: "right" },
        { header: "Price", width: 70, align: "right" },
        { header: privacy ? "FX" : "Ccy", width: 70, align: "right" },
      ],
      top.map((h) => [
        h.security.name,
        formatPct(h.weight, 1),
        privacy
          ? formatPct(h.costNok ? h.unrealizedNok / h.costNok : 0, 1, true)
          : formatMoney(h.unrealizedNok, "NOK", false),
        privacy ? "-" : formatMoney(h.priceEffect, "NOK", false),
        privacy ? "-" : formatMoney(h.currencyEffect, "NOK", false),
      ]),
    );
  }
  if (mode === "demo") {
    const cov = covFromVolCorr(cma.vol, cma.corr);
    const w = ASSET_IDS.map((id) => holdings.allocation.find((a) => a.assetClass === id)?.weight ?? 0);
    const contrib = riskContributions(w, cma.mu, cov, ASSET_IDS.map((id) => ASSET_LABELS[id]));
    doc.paragraph("Risk contribution by asset class (demo book; My Data uses imported history only):", {
      size: 8,
      color: C.muted,
    });
    doc.addTable(
      [
        { header: "Class", width: 140 },
        { header: "Weight", width: 70, align: "right" },
        { header: "% of risk", width: 80, align: "right" },
        { header: "Return contrib.", width: 90, align: "right" },
      ],
      contrib.map((c) => [c.label, formatPct(c.weight, 1), formatPct(c.pctr, 1), formatPct(c.retContrib, 2)]),
    );
  } else if (!historyOk) {
    doc.paragraph("Not available: import price history");
  }

  if (holdings.holdings.length) {
    doc.heading("Holdings");
    doc.addTable(
      privacy
        ? [
            { header: "Name", width: 180 },
            { header: "Qty", width: 55, align: "right" },
            { header: "Weight", width: 70, align: "right" },
            { header: "MV", width: 80, align: "right" },
          ]
        : [
            { header: "Name", width: 150 },
            { header: "Qty", width: 55, align: "right" },
            { header: "Ccy", width: 40 },
            { header: "Weight", width: 55, align: "right" },
            { header: "MV", width: 80, align: "right" },
          ],
      holdings.holdings.map((h) =>
        privacy
          ? [h.security.name, h.qty.toFixed(2), formatPct(h.weight, 1), "••••"]
          : [
              h.security.name,
              h.qty.toFixed(2),
              h.security.currency,
              formatPct(h.weight, 1),
              formatMoney(h.marketNok, "NOK", false),
            ],
      ),
    );
  }

  doc.heading("Disclaimer");
  doc.paragraph(
    privacy
      ? "Performance and risk figures are computed from imported transactions and prices in this browser. Positions without imported history are listed above. Projections elsewhere in NORDLYS are hypothetical illustrations, not forecasts. This report is not regulated investment advice."
      : "Performance and risk figures are computed from imported transactions and prices. Positions without an imported price are marked stale and valued at last trade. Foreign currency without an imported FX series is marked stale. Projections elsewhere in NORDLYS are hypothetical illustrations, not forecasts. This report is not regulated investment advice.",
    { size: 8, leading: 11, color: C.muted },
  );

  const bytes = doc.finish();
  const slug = profile.name.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "") || "portfolio";
  return { bytes, fileName: `NORDLYS-Portfolio-${slug}-${asOf}.pdf`, layout: doc.layout };
}
