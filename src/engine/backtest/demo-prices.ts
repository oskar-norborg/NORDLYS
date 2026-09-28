/** Seeded OHLC series for the four example tickers, plus USDNOK. */

import { createRng } from "../prng";
import type { AssetCcy, AssetSeries, Bar, FxPoint } from "./types";

export const DEMO_TICKERS: { ticker: string; currency: AssetCcy; start: number; mu: number; vol: number }[] = [
  { ticker: "MSFT", currency: "USD", start: 160, mu: 0.16, vol: 0.24 },
  { ticker: "KOG", currency: "NOK", start: 180, mu: 0.14, vol: 0.28 },
  { ticker: "MOWI", currency: "NOK", start: 185, mu: 0.08, vol: 0.22 },
  { ticker: "DNB", currency: "NOK", start: 155, mu: 0.1, vol: 0.22 },
];

export const DEMO_PRICE_START = "2020-01-02";
export const DEMO_PRICE_END = "2026-09-01";

function iso(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function tradingDays(start: string, end: string): string[] {
  const out: string[] = [];
  let t = Date.parse(start + "T00:00:00Z");
  const last = Date.parse(end + "T00:00:00Z");
  while (t <= last) {
    const wd = new Date(t).getUTCDay();
    if (wd !== 0 && wd !== 6) out.push(iso(t));
    t += 86400000;
  }
  return out;
}

/** Same USDNOK path the demo ledger uses. */
export function demoUsdNok(date: string): number {
  const t = (Date.parse(date + "T00:00:00Z") - Date.parse("2021-01-01T00:00:00Z")) / (365 * 86400000);
  return 8.55 + 2.1 * (1 - Math.exp(-t / 2)) + 0.15 * Math.sin(t * 4);
}

export function buildDemoFx(dates: string[]): FxPoint[] {
  return dates.map((date) => ({ date, usdNok: demoUsdNok(date) }));
}

export function buildDemoAssetSeries(seed = 20260321): AssetSeries[] {
  const dates = tradingDays(DEMO_PRICE_START, DEMO_PRICE_END);
  const rng = createRng(seed);
  return DEMO_TICKERS.map((spec) => {
    const bars: Bar[] = [];
    let px = spec.start;
    let prev = spec.start;
    for (let i = 0; i < dates.length; i++) {
      const z = rng.gaussian();
      const r = spec.mu / 252 + (spec.vol / Math.sqrt(252)) * z;
      px = Math.max(1, px * (1 + r));
      const gap = rng.gaussian() * 0.004;
      const open = Math.max(1, prev * (1 + gap));
      const span = Math.abs(rng.gaussian()) * 0.012;
      const high = Math.max(open, px) * (1 + span);
      const low = Math.min(open, px) * (1 - span);
      const volume = Math.round(400_000 + Math.abs(rng.gaussian()) * 250_000);
      bars.push({
        date: dates[i]!,
        open,
        high,
        low,
        close: px,
        volume,
      });
      prev = px;
    }
    return { ticker: spec.ticker, currency: spec.currency, bars };
  });
}

export function demoCalendar(): string[] {
  return tradingDays(DEMO_PRICE_START, DEMO_PRICE_END);
}
