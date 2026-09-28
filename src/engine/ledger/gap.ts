/** Gap vs the recommended model book, with whole-share rebalancing trades. */

import type { AssetId, ModelPortfolio } from "../types";
import { ASSET_IDS } from "../types";
import type { GapAnalysis, GapRow, HoldingsResult, RebalanceTrade, Security } from "./types";
import { round2 } from "./numbers";

const CLASS_CORE: Record<AssetId, { name: string; ticker: string; isin: string }> = {
  global_eq: { name: "iShares Core MSCI World", ticker: "IWDA", isin: "IE00B4L5Y983" },
  us_eq: { name: "Apple Inc", ticker: "AAPL", isin: "US0378331005" },
  nordic_eq: { name: "Equinor ASA", ticker: "EQNR", isin: "NO0010096985" },
  bonds: { name: "Storebrand Obligasjon", ticker: "STB-OBL", isin: "NO0010582984" },
  real_estate: { name: "Listed real estate", ticker: "RE", isin: "RE-PROXY" },
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
    const inClass = holdings.holdings.filter((h) => h.security.assetClass === row.assetClass);
    if (row.gap < 0) {
      let remain = -row.gap;
      const ordered = inClass.slice().sort((a, b) => b.marketNok - a.marketNok);
      for (const h of ordered) {
        if (remain < 50) break;
        const px = h.price * h.fx;
        if (px <= 0) continue;
        const maxShares = h.qty;
        const want = remain / px;
        const shares = Math.min(maxShares, Math.round(want));
        if (shares <= 0) continue;
        const value = shares * px;
        trades.push({
          isin: h.isin,
          name: h.security.name,
          ticker: h.security.ticker,
          assetClass: row.assetClass,
          side: "sell",
          shares,
          price: h.price,
          valueNok: round2(value),
        });
        remain -= value;
      }
      residualCash += -row.gap - (-row.gap - remain);
    } else {
      const existing = inClass[0];
      const pick = existing
        ? {
            isin: existing.isin,
            name: existing.security.name,
            ticker: existing.security.ticker,
            price: existing.price,
            fx: existing.fx,
          }
        : coreSecurity(row.assetClass, securities, holdings);
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
  securities: Security[],
  holdings: HoldingsResult,
): { isin: string; name: string; ticker: string; price: number; fx: number } {
  const existing = securities.find((s) => s.assetClass === assetClass);
  if (existing) {
    const h = holdings.holdings.find((x) => x.isin === existing.isin);
    return {
      isin: existing.isin,
      name: existing.name,
      ticker: existing.ticker,
      price: h?.price || 100,
      fx: h?.fx || 1,
    };
  }
  const c = CLASS_CORE[assetClass];
  const h = holdings.holdings.find((x) => x.isin === c.isin);
  return { isin: c.isin, name: c.name, ticker: c.ticker, price: h?.price || 100, fx: h?.fx || 1 };
}
