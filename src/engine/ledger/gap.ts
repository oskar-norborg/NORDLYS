/** Gap vs the recommended model book, with whole-share rebalancing trades. */

import type { AssetId, ModelPortfolio } from "../types";
import { ASSET_IDS } from "../types";
import type { GapAnalysis, GapRow, HoldingsResult, RebalanceTrade, Security } from "./types";
import { round2 } from "./numbers";

const CLASS_CORE: Record<AssetId, { name: string; ticker: string; isin: string }> = {
  global_eq: { name: "iShares Core MSCI World", ticker: "IWDA", isin: "IE00B4L5Y983" },
  us_eq: { name: "iShares Core S&P 500", ticker: "CSPX", isin: "IE00B5BMR087" },
  nordic_eq: { name: "iShares MSCI Nordic", ticker: "DNOR", isin: "IE00B53QDK08" },
  bonds: { name: "iShares Core Global Aggregate Bond", ticker: "AGGU", isin: "IE00BDBRDM35" },
  real_estate: { name: "iShares Developed Markets Property Yield", ticker: "IWDP", isin: "IE00B1FZS350" },
  cash: { name: "Cash", ticker: "CASH", isin: "CASH" },
};

export function analyzeGap(
  holdings: HoldingsResult,
  model: ModelPortfolio,
  securities: Security[],
): GapAnalysis {
  const total = holdings.totalMarket;
  const rows: GapRow[] = ASSET_IDS.map((assetClass, i) => {
    const current = holdings.allocation.find((a) => a.assetClass === assetClass)?.value ?? 0;
    const targetWeight = model.weights[i] ?? 0;
    const target = total * targetWeight;
    return {
      assetClass,
      current,
      currentWeight: total > 0 ? current / total : 0,
      targetWeight,
      target,
      gap: target - current,
    };
  });

  const trades: RebalanceTrade[] = [];
  let residualCash = 0;

  for (const row of rows) {
    if (row.assetClass === "cash") {
      residualCash += row.gap;
      continue;
    }
    if (Math.abs(row.gap) < 50) continue;
    const pick = coreSecurity(row.assetClass, securities, holdings);
    if (row.gap < 0) {
      const px = pick.price * (pick.fx || 1);
      if (px <= 0) continue;
      const shares = Math.round(-row.gap / px);
      if (shares <= 0) {
        residualCash += -row.gap;
        continue;
      }
      const value = shares * px;
      trades.push({
        isin: pick.isin,
        name: pick.name,
        ticker: pick.ticker,
        assetClass: row.assetClass,
        side: "sell",
        shares,
        price: pick.price,
        valueNok: round2(value),
      });
      residualCash += -row.gap - value;
    } else {
      const pxNative = pick.price;
      const fx = pick.fx || 1;
      const px = pxNative * fx;
      if (px <= 0) continue;
      const shares = Math.round(row.gap / px);
      if (shares <= 0) {
        residualCash += row.gap;
        continue;
      }
      const value = shares * px;
      trades.push({
        isin: pick.isin,
        name: pick.name,
        ticker: pick.ticker,
        assetClass: row.assetClass,
        side: "buy",
        shares,
        price: pxNative,
        valueNok: round2(value),
      });
      residualCash += row.gap - value;
    }
  }

  return {
    total,
    asOf: holdings.asOf,
    modelName: model.name,
    rows,
    trades,
    residualCash: round2(residualCash),
  };
}

function coreSecurity(
  assetClass: AssetId,
  _securities: Security[],
  holdings: HoldingsResult,
): { isin: string; name: string; ticker: string; price: number; fx: number } {
  const c = CLASS_CORE[assetClass];
  const h = holdings.holdings.find((x) => x.isin === c.isin);
  return { isin: c.isin, name: c.name, ticker: c.ticker, price: h?.price || 100, fx: h?.fx || 1 };
}
