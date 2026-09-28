/** Generic price, NAV, FX, and benchmark CSV import with column mapper + layout presets. */

import type { BenchmarkQuote, FxQuote, LedgerBundle, PriceQuote } from "./types";
import { decodeText, detectDelimiter, splitCsvLine, splitLines } from "./parse";
import { parseDate, parseNumber } from "./numbers";

export interface ColumnMap {
  date: number;
  price: number;
  ticker?: number;
  isin?: number;
  pair?: number;
}

export interface PricePreset {
  id: string;
  label: string;
  hint: string;
  delimiter?: string;
  map: ColumnMap;
}

export const PRICE_PRESETS: PricePreset[] = [
  {
    id: "nav",
    label: "Date + NAV",
    hint: "Mutual fund history: Date, NAV — no OHLC required",
    delimiter: ",",
    map: { date: 0, price: 1 },
  },
  {
    id: "yahoo",
    label: "ISO + Adj Close",
    hint: "Date, Open, High, Low, Close, Adj Close, Volume",
    delimiter: ",",
    map: { date: 0, price: 5 },
  },
  {
    id: "us_dollar",
    label: "US dates with $",
    hint: "MM/DD/YYYY and $1,234.56 closes",
    delimiter: ",",
    map: { date: 0, price: 1 },
  },
  {
    id: "european",
    label: "European decimal commas",
    hint: "DD.MM.YYYY; 1.234,56  (semicolon)",
    delimiter: ";",
    map: { date: 0, price: 1 },
  },
];

const DATE_CANDIDATES = ["date", "dato", "datum", "päivä", "paiva", "kursdato", "tradedate", "nav date"];
const PRICE_CANDIDATES = [
  "adj close",
  "adj. close",
  "adjusted",
  "nav",
  "n.a.v",
  "net asset",
  "andelsverdi",
  "andelverdi",
  "andelskurs",
  "innløsningskurs",
  "innlosningskurs",
  "fondskurs",
  "lukkekurs",
  "close",
  "slutt",
  "kurs",
  "price",
  "last",
  "verdi",
];

function normHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

function pickColumn(headers: string[], cands: string[], used: Set<number>): number {
  const n = headers.map(normHeader);
  for (const c of cands) {
    const exact = n.findIndex((h, i) => !used.has(i) && h === c);
    if (exact >= 0) {
      used.add(exact);
      return exact;
    }
  }
  for (const c of cands) {
    const i = n.findIndex((h, idx) => !used.has(idx) && h.includes(c));
    if (i >= 0) {
      used.add(i);
      return i;
    }
  }
  return -1;
}

export function sniffPriceMap(headers: string[]): ColumnMap {
  const used = new Set<number>();
  const date = pickColumn(headers, DATE_CANDIDATES, used);
  const price = pickColumn(headers, PRICE_CANDIDATES, used);
  const isin = pickColumn(headers, ["isin"], used);
  const ticker = pickColumn(headers, ["ticker", "symbol", "instrument"], used);
  const fallbackPrice = headers.length === 2 ? (date === 0 ? 1 : 0) : 1;
  return {
    date: date >= 0 ? date : 0,
    price: price >= 0 ? price : fallbackPrice,
    isin: isin >= 0 ? isin : undefined,
    ticker: ticker >= 0 ? ticker : undefined,
  };
}

function looksLikeDataRow(cells: string[]): boolean {
  if (cells.length < 2) return false;
  return parseDate(cells[0] ?? "") != null && parseNumber(cells[1] ?? "") != null;
}

export function parsePriceCsv(
  buf: ArrayBuffer | Uint8Array,
  isin: string,
  map?: ColumnMap,
  delimiterHint?: string,
): PriceQuote[] {
  const { text } = decodeText(buf);
  const { lines } = splitLines(text.replace(/^\uFEFF/, ""));
  if (lines.length < 1) return [];
  const delim = delimiterHint || detectDelimiter(lines[0]!);
  const first = splitCsvLine(lines[0]!, delim);
  const headerless = looksLikeDataRow(first);
  const col = map ?? (headerless ? { date: 0, price: Math.min(1, first.length - 1) } : sniffPriceMap(first));
  const from = headerless ? 0 : 1;
  const out: PriceQuote[] = [];
  for (let i = from; i < lines.length; i++) {
    if (!lines[i]!.trim()) continue;
    const cells = splitCsvLine(lines[i]!, delim);
    const date = parseDate(cells[col.date] ?? "");
    const price = parseNumber(cells[col.price] ?? "");
    if (!date || price == null) continue;
    const rowIsin = col.isin != null ? (cells[col.isin] ?? "").trim() : "";
    out.push({
      isin: rowIsin || isin,
      date,
      close: price,
      source: "import",
    });
  }
  return out;
}

export function parseFxCsv(
  buf: ArrayBuffer | Uint8Array,
  pair: string,
  map?: ColumnMap,
  delimiterHint?: string,
): FxQuote[] {
  const { text } = decodeText(buf);
  const { lines } = splitLines(text.replace(/^\uFEFF/, ""));
  if (lines.length < 1) return [];
  const delim = delimiterHint || detectDelimiter(lines[0]!);
  const first = splitCsvLine(lines[0]!, delim);
  const headerless = looksLikeDataRow(first);
  const col = map ?? (headerless ? { date: 0, price: Math.min(1, first.length - 1) } : sniffPriceMap(first));
  const from = headerless ? 0 : 1;
  const out: FxQuote[] = [];
  for (let i = from; i < lines.length; i++) {
    if (!lines[i]!.trim()) continue;
    const cells = splitCsvLine(lines[i]!, delim);
    const date = parseDate(cells[col.date] ?? "");
    const rate = parseNumber(cells[col.price] ?? "");
    if (!date || rate == null) continue;
    const rowPair = col.pair != null ? (cells[col.pair] ?? "").trim() : "";
    out.push({
      pair: (rowPair || pair).replace(/[^A-Z]/gi, "").toUpperCase(),
      date,
      rate,
      source: "import",
      stale: false,
    });
  }
  return out;
}

export function parseBenchmarkCsv(
  buf: ArrayBuffer | Uint8Array,
  id: string,
  map?: ColumnMap,
  delimiterHint?: string,
): BenchmarkQuote[] {
  return parsePriceCsv(buf, id, map, delimiterHint).map((q) => ({
    id,
    date: q.date,
    value: q.close,
    source: "import" as const,
  }));
}

export function mergePrices(existing: PriceQuote[], incoming: PriceQuote[]): PriceQuote[] {
  const m = new Map<string, PriceQuote>();
  for (const p of existing) m.set(`${p.isin}|${p.date}`, p);
  for (const p of incoming) m.set(`${p.isin}|${p.date}`, p);
  return [...m.values()].sort((a, b) => a.date.localeCompare(b.date) || a.isin.localeCompare(b.isin));
}

export function mergeFx(existing: FxQuote[], incoming: FxQuote[]): FxQuote[] {
  const m = new Map<string, FxQuote>();
  for (const p of existing) m.set(`${p.pair}|${p.date}`, p);
  for (const p of incoming) m.set(`${p.pair}|${p.date}`, { ...p, stale: false });
  return [...m.values()].sort((a, b) => a.date.localeCompare(b.date) || a.pair.localeCompare(b.pair));
}

export function mergeBenchmarks(existing: BenchmarkQuote[], incoming: BenchmarkQuote[]): BenchmarkQuote[] {
  const m = new Map<string, BenchmarkQuote>();
  for (const p of existing ?? []) m.set(`${p.id}|${p.date}`, p);
  for (const p of incoming) m.set(`${p.id}|${p.date}`, p);
  return [...m.values()].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

export function attachQuotes(
  ledger: LedgerBundle,
  prices: PriceQuote[],
  fx: FxQuote[],
  benchmarks: BenchmarkQuote[] = [],
): LedgerBundle {
  return {
    ...ledger,
    prices: mergePrices(ledger.prices, prices),
    fx: mergeFx(ledger.fx, fx),
    benchmarks: mergeBenchmarks(ledger.benchmarks ?? [], benchmarks),
  };
}

export function isImportedQuoteSource(source?: string): boolean {
  return source === "import" || source === "nordnet";
}

/** True when the ledger has a real imported price/NAV history (never CMA, never synthetic). */
export function hasImportedPriceHistory(ledger: LedgerBundle): boolean {
  const pts = ledger.prices.filter((p) => isImportedQuoteSource(p.source));
  if (pts.length < 8) return false;
  return new Set(pts.map((p) => p.date)).size >= 4;
}

/** Demo may use synthetic history; My Data risk metrics require imported price/NAV series. */
export function historicalRiskAvailable(mode: "demo" | "mydata", ledger: LedgerBundle): boolean {
  return mode === "demo" || hasImportedPriceHistory(ledger);
}

export function holdingsWithoutImportedHistory(
  ledger: LedgerBundle,
  isins: { isin: string; name: string }[],
): { isin: string; name: string }[] {
  const have = new Set(
    ledger.prices.filter((p) => isImportedQuoteSource(p.source)).map((p) => p.isin),
  );
  return isins.filter((h) => !have.has(h.isin));
}
