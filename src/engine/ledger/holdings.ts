/** FIFO / average-cost holdings, realized & unrealized P&L split into price vs currency. */

import type { AssetId } from "../types";
import { ASSET_IDS } from "../types";
import type {
  CostMethod,
  FxQuote,
  Holding,
  HoldingsResult,
  LedgerBundle,
  Lot,
  PriceQuote,
  RealizedPnL,
  Security,
  Transaction,
} from "./types";
import { round2, round4 } from "./numbers";
import { lookupFx, lookupPrice } from "./securities";

const CASH_KINDS = new Set([
  "deposit",
  "withdrawal",
  "dividend",
  "withholding_tax",
  "fee",
  "interest",
  "currency_exchange",
  "buy",
  "sell",
]);

function securityOf(isin: string, list: Security[], tx?: Transaction): Security {
  const found = list.find((s) => s.isin === isin);
  if (found) return found;
  return {
    isin,
    ticker: "",
    name: tx?.name || isin,
    currency: tx?.purchaseCcy || tx?.priceCcy || "NOK",
    exchange: "",
    assetClass: "global_eq",
  };
}

function tradeFx(tx: Transaction): number {
  if (tx.fxRate && tx.fxRate > 0) return tx.fxRate;
  if (tx.valutakurs && tx.valutakurs > 0) return tx.valutakurs;
  return 1;
}

function consumeFifo(
  lots: Lot[],
  qty: number,
  sellPrice: number,
  sellFx: number,
  sellFees: number,
): { lots: Lot[]; realized: { qty: number; realizedNok: number; priceEffect: number; currencyEffect: number; feeEffect: number } } {
  let remain = round4(qty);
  let priceEffect = 0;
  let currencyEffect = 0;
  let feeEffect = -sellFees;
  let realizedNok = -sellFees;
  const next: Lot[] = [];
  const totalQty = lots.reduce((s, l) => s + l.qty, 0) || 1;

  for (const lot of lots) {
    if (remain <= 0) {
      next.push(lot);
      continue;
    }
    const take = Math.min(lot.qty, remain);
    const lotFeeShare = lot.qty > 0 ? (take / lot.qty) * lot.feesNok : 0;
    const proceeds = take * sellPrice * sellFx;
    const cost = take * lot.unitPrice * lot.fx + lotFeeShare;
    priceEffect += take * (sellPrice - lot.unitPrice) * sellFx;
    currencyEffect += take * lot.unitPrice * (sellFx - lot.fx);
    feeEffect -= lotFeeShare;
    realizedNok += proceeds - cost;
    remain = round4(remain - take);
    const left = round4(lot.qty - take);
    if (left > 0.00005) {
      next.push({
        ...lot,
        qty: left,
        feesNok: lot.feesNok - lotFeeShare,
      });
    }
  }
  void totalQty;
  return {
    lots: next,
    realized: {
      qty,
      realizedNok: round2(realizedNok),
      priceEffect: round2(priceEffect),
      currencyEffect: round2(currencyEffect),
      feeEffect: round2(feeEffect),
    },
  };
}

function avgFromLots(lots: Lot[]): { qty: number; unitPrice: number; fx: number; feesNok: number } {
  let qty = 0;
  let native = 0;
  let nok = 0;
  let fees = 0;
  for (const l of lots) {
    qty += l.qty;
    native += l.qty * l.unitPrice;
    nok += l.qty * l.unitPrice * l.fx;
    fees += l.feesNok;
  }
  if (qty <= 0) return { qty: 0, unitPrice: 0, fx: 1, feesNok: 0 };
  const unitPrice = native / qty;
  const fx = native === 0 ? 1 : nok / native;
  return { qty, unitPrice, fx, feesNok: fees };
}

export function computeHoldings(
  ledger: LedgerBundle,
  method: CostMethod,
  asOf: string,
): HoldingsResult {
  const txs = ledger.transactions
    .filter((t) => !t.cancelled && (t.tradeDate || t.bookingDate) <= asOf)
    .slice()
    .sort((a, b) => {
      const da = (a.tradeDate || a.bookingDate).localeCompare(b.tradeDate || b.bookingDate);
      if (da !== 0) return da;
      const ai = Number(a.nordnetId);
      const bi = Number(b.nordnetId);
      if (Number.isFinite(ai) && Number.isFinite(bi)) return ai - bi;
      return a.nordnetId.localeCompare(b.nordnetId, undefined, { numeric: true });
    });

  let cash = 0;
  const lots = new Map<string, Lot[]>();
  const realized: RealizedPnL[] = [];

  for (const tx of txs) {
    if (CASH_KINDS.has(tx.kind)) cash = round2(cash + tx.amount);

    if (tx.kind === "buy" && tx.isin) {
      const q = Math.abs(tx.qty);
      const fx = tradeFx(tx);
      const unit = tx.price;
      const list = lots.get(tx.isin) ?? [];
      list.push({
        isin: tx.isin,
        qty: q,
        unitPrice: unit,
        fx,
        date: tx.tradeDate || tx.bookingDate,
        feesNok: tx.fees,
      });
      lots.set(tx.isin, list);
    } else if (tx.kind === "sell" && tx.isin) {
      const q = Math.abs(tx.qty);
      const fx = tradeFx(tx);
      const existing = lots.get(tx.isin) ?? [];
      const source = method === "average" ? collapseToAverage(existing) : existing;
      const consumed = consumeFifo(source, q, tx.price, fx, tx.fees);
      lots.set(tx.isin, consumed.lots);
      realized.push({
        isin: tx.isin,
        name: tx.name,
        qty: q,
        realizedNok: consumed.realized.realizedNok,
        priceEffect: consumed.realized.priceEffect,
        currencyEffect: consumed.realized.currencyEffect,
        feeEffect: consumed.realized.feeEffect,
      });
    } else if (tx.kind === "split" && tx.isin) {
      const existing = lots.get(tx.isin) ?? [];
      const before = existing.reduce((s, l) => s + l.qty, 0);
      if (before > 0 && tx.qty !== 0) {
        const after = tx.fileQty != null && tx.fileQty > 0 ? tx.fileQty : round4(before + tx.qty);
        const ratio = after / before;
        lots.set(
          tx.isin,
          existing.map((l) => ({
            ...l,
            qty: round4(l.qty * ratio),
            unitPrice: l.unitPrice / ratio,
          })),
        );
      }
    }
  }

  const holdings: Holding[] = [];
  for (const [isin, isinLots] of lots) {
    const collapsed = method === "average" ? collapseToAverage(isinLots) : isinLots;
    const agg = avgFromLots(collapsed);
    if (agg.qty <= QTY_EPS) continue;
    const sec = securityOf(isin, ledger.securities);
    const px = lookupPrice(ledger.prices, isin, asOf);
    const tradePx = lastTradePrice(txs, isin);
    const priceStale = !px;
    const price = px?.close ?? tradePx ?? agg.unitPrice;
    const priceSource = px ? px.source : "last_trade";
    const priceDate = px?.date ?? (tradePx != null ? lastTradeDate(txs, isin) ?? asOf : asOf);
    const pair = `${sec.currency}NOK`;
    const fxq = sec.currency === "NOK" ? { rate: 1, date: asOf, stale: false } : lookupFx(ledger.fx, pair, asOf);
    const fx = fxq?.rate ?? 1;
    const fxStale = sec.currency !== "NOK" && (fxq?.stale ?? true);
    const marketNative = agg.qty * price;
    const marketNok = marketNative * fx;
    const costNok = agg.qty * agg.unitPrice * agg.fx + agg.feesNok;
    const priceEffect = agg.qty * (price - agg.unitPrice) * fx;
    const currencyEffect = agg.qty * agg.unitPrice * (fx - agg.fx);
    holdings.push({
      isin,
      security: sec,
      qty: round4(agg.qty),
      unitCostNative: agg.unitPrice,
      avgFx: agg.fx,
      costNok,
      price,
      priceDate,
      priceStale,
      priceSource,
      fx,
      fxStale,
      marketNative,
      marketNok,
      unrealizedNok: marketNok - costNok,
      priceEffect,
      currencyEffect,
      weight: 0,
      asOf,
    });
  }

  holdings.sort((a, b) => b.marketNok - a.marketNok);
  const totalHoldings = holdings.reduce((s, h) => s + h.marketNok, 0);
  const totalMarket = totalHoldings + cash;
  for (const h of holdings) h.weight = totalMarket > 0 ? h.marketNok / totalMarket : 0;

  const allocMap = new Map<AssetId, number>();
  for (const id of ASSET_IDS) allocMap.set(id, 0);
  for (const h of holdings) {
    allocMap.set(h.security.assetClass, (allocMap.get(h.security.assetClass) ?? 0) + h.marketNok);
  }
  allocMap.set("cash", (allocMap.get("cash") ?? 0) + cash);
  const allocation = ASSET_IDS.map((assetClass) => {
    const value = allocMap.get(assetClass) ?? 0;
    return { assetClass, value, weight: totalMarket > 0 ? value / totalMarket : 0 };
  });

  const realizedMerged = mergeRealized(realized);

  return {
    method,
    asOf,
    cash,
    holdings,
    realized: realizedMerged,
    totalMarket,
    totalCost: holdings.reduce((s, h) => s + h.costNok, 0),
    totalUnrealized: holdings.reduce((s, h) => s + h.unrealizedNok, 0),
    totalPriceEffect: holdings.reduce((s, h) => s + h.priceEffect, 0),
    totalCurrencyEffect: holdings.reduce((s, h) => s + h.currencyEffect, 0),
    totalRealized: realizedMerged.reduce((s, r) => s + r.realizedNok, 0),
    allocation,
  };
}

const QTY_EPS = 5e-5;

function collapseToAverage(lots: Lot[]): Lot[] {
  if (lots.length <= 1) return lots.map((l) => ({ ...l }));
  const agg = avgFromLots(lots);
  if (agg.qty <= 0) return [];
  return [
    {
      isin: lots[0]!.isin,
      qty: agg.qty,
      unitPrice: agg.unitPrice,
      fx: agg.fx,
      date: lots[0]!.date,
      feesNok: agg.feesNok,
    },
  ];
}

function lastTradePrice(txs: Transaction[], isin: string): number | null {
  for (let i = txs.length - 1; i >= 0; i--) {
    const t = txs[i]!;
    if (t.isin === isin && t.price && (t.kind === "buy" || t.kind === "sell")) return t.price;
  }
  return null;
}

function lastTradeDate(txs: Transaction[], isin: string): string | null {
  for (let i = txs.length - 1; i >= 0; i--) {
    const t = txs[i]!;
    if (t.isin === isin && t.price && (t.kind === "buy" || t.kind === "sell")) {
      return t.tradeDate || t.bookingDate;
    }
  }
  return null;
}

function mergeRealized(rows: RealizedPnL[]): RealizedPnL[] {
  const m = new Map<string, RealizedPnL>();
  for (const r of rows) {
    const prev = m.get(r.isin);
    if (!prev) m.set(r.isin, { ...r });
    else {
      prev.qty += r.qty;
      prev.realizedNok += r.realizedNok;
      prev.priceEffect += r.priceEffect;
      prev.currencyEffect += r.currencyEffect;
      prev.feeEffect += r.feeEffect;
    }
  }
  return [...m.values()];
}

export function navOnDate(ledger: LedgerBundle, method: CostMethod, asOf: string): number {
  return computeHoldings(ledger, method, asOf).totalMarket;
}

export type { PriceQuote, FxQuote };
