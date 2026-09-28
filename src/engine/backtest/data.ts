/** Resolve OHLC series for a backtest: demo GBM or imported My Data history. */

import type { LedgerBundle, Security } from "../ledger/types";
import { isImportedQuoteSource } from "../ledger/prices";
import { emptyLedgerBundle } from "../ledger/pipeline";
import { buildDemoAssetSeries, buildDemoFx, DEMO_TICKERS, demoCalendar } from "./demo-prices";
import type { AssetCcy, AssetSeries, Bar, DataResolve, FxPoint } from "./types";

export function seriesFromCloses(
  ticker: string,
  currency: AssetCcy,
  dates: string[],
  closes: number[],
): AssetSeries {
  const bars: Bar[] = dates.map((date, i) => {
    const c = closes[i] ?? closes[closes.length - 1] ?? 1;
    return { date, open: c, high: c, low: c, close: c, volume: 0 };
  });
  return { ticker, currency, bars };
}

export function sliceSeries(series: AssetSeries[], from: string, to: string): AssetSeries[] {
  return series.map((s) => ({
    ...s,
    bars: s.bars.filter((b) => b.date >= from && b.date <= to),
  }));
}

export function sliceFx(fx: FxPoint[], from: string, to: string): FxPoint[] {
  return fx.filter((p) => p.date >= from && p.date <= to);
}

function matchSecurity(ledger: LedgerBundle, ticker: string): Security | undefined {
  const t = ticker.toUpperCase();
  return ledger.securities.find((s) => s.ticker.toUpperCase() === t || s.isin.toUpperCase() === t);
}

function asCcy(raw: string): AssetCcy {
  return raw.toUpperCase() === "USD" ? "USD" : "NOK";
}

function importedBars(ledger: LedgerBundle, isin: string): Bar[] {
  const quotes = ledger.prices
    .filter((p) => p.isin === isin && isImportedQuoteSource(p.source))
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
  const byDate = new Map<string, number>();
  for (const q of quotes) byDate.set(q.date, q.close);
  return [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, close]) => ({ date, open: close, high: close, low: close, close, volume: 0 }));
}

function importedFx(ledger: LedgerBundle): FxPoint[] {
  const pts: FxPoint[] = [];
  for (const q of ledger.fx) {
    if (!isImportedQuoteSource(q.source)) continue;
    const pair = q.pair.replace("/", "").toUpperCase();
    if (pair === "USDNOK" || pair === "USDNOK.") {
      pts.push({ date: q.date, usdNok: q.rate });
    } else if (pair === "NOKUSD" && q.rate > 0) {
      pts.push({ date: q.date, usdNok: 1 / q.rate });
    }
  }
  pts.sort((a, b) => a.date.localeCompare(b.date));
  const byDate = new Map<string, number>();
  for (const p of pts) byDate.set(p.date, p.usdNok);
  return [...byDate.entries()].map(([date, usdNok]) => ({ date, usdNok }));
}

const DEMO_SET = new Set(DEMO_TICKERS.map((t) => t.ticker));

let cachedSeries: AssetSeries[] | null = null;
let cachedFx: FxPoint[] | null = null;

function demoSeriesCached(): AssetSeries[] {
  if (!cachedSeries) cachedSeries = buildDemoAssetSeries();
  return cachedSeries;
}

function demoFxCached(): FxPoint[] {
  if (!cachedFx) cachedFx = buildDemoFx(demoCalendar());
  return cachedFx;
}

export function resolveBacktestData(
  mode: "demo" | "mydata",
  tickers: string[],
  ledger: LedgerBundle = emptyLedgerBundle(),
): DataResolve {
  const wanted = tickers.map((t) => t.toUpperCase());
  if (mode === "demo") {
    const missing = wanted.filter((t) => !DEMO_SET.has(t));
    if (missing.length) {
      return {
        ok: false,
        missing,
        message: `Demo prices are not available for ${missing.join(", ")}.`,
      };
    }
    const all = demoSeriesCached();
    const series = wanted.map((t) => all.find((s) => s.ticker === t)!);
    return { ok: true, series, fx: demoFxCached() };
  }

  const missing: string[] = [];
  const series: AssetSeries[] = [];
  let needsFx = false;
  for (const t of wanted) {
    const sec = matchSecurity(ledger, t);
    if (!sec) {
      missing.push(t);
      continue;
    }
    const bars = importedBars(ledger, sec.isin);
    if (bars.length < 2) {
      missing.push(t);
      continue;
    }
    const ccy = asCcy(sec.currency);
    if (ccy === "USD") needsFx = true;
    series.push({ ticker: t, currency: ccy, bars });
  }
  if (missing.length) {
    return {
      ok: false,
      missing,
      message: `My Data has no imported price history for ${missing.join(", ")}. Import a price/NAV file for each ticker — demo series are never substituted.`,
    };
  }
  let fx: FxPoint[] = [];
  if (needsFx) {
    fx = importedFx(ledger);
    if (fx.length < 2) {
      return {
        ok: false,
        missing: ["USDNOK"],
        message: "USD names need imported USDNOK rates on My Data. Demo FX is never substituted.",
      };
    }
  }
  return { ok: true, series, fx };
}
