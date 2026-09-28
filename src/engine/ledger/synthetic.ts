/**
 * Demo Nordnet export: exact Norwegian "Transaksjoner og notaer" layout,
 * then imported through the same pipeline as a user file.
 */

import { createRng } from "../prng";
import type { AssetId } from "../types";
import type {
  FxQuote,
  LedgerBundle,
  PriceQuote,
  Security,
  Transaction,
  TxKind,
} from "./types";
import { NORDNET_COL_COUNT, NORDNET_HEADERS_NB } from "./types";
import { nnNumber, round2, round4, formatIso } from "./numbers";
import { encodeUtf16Le, csvEscape } from "./parse";
import { classifyType } from "./classify";
import { emptyLedgerBundle, importNordnetBuffer } from "./pipeline";
import { buildSyntheticBenchmarks } from "./benchmarks";

export interface DemoInstrument {
  isin: string;
  name: string;
  ticker: string;
  currency: string;
  exchange: string;
  assetClass: AssetId;
  startPrice: number;
  mu: number;
  vol: number;
}

export const DEMO_INSTRUMENTS: DemoInstrument[] = [
  {
    isin: "NO0010096985",
    name: "Equinor ASA",
    ticker: "EQNR",
    currency: "NOK",
    exchange: "OSE",
    assetClass: "nordic_eq",
    startPrice: 175,
    mu: 0.08,
    vol: 0.28,
  },
  {
    isin: "NO0010031479",
    name: "DNB Bank ASA",
    ticker: "DNB",
    currency: "NOK",
    exchange: "OSE",
    assetClass: "nordic_eq",
    startPrice: 165,
    mu: 0.09,
    vol: 0.22,
  },
  {
    isin: "US0378331005",
    name: "Apple Inc",
    ticker: "AAPL",
    currency: "USD",
    exchange: "NASDAQ",
    assetClass: "us_eq",
    startPrice: 120,
    mu: 0.12,
    vol: 0.24,
  },
  {
    isin: "IE00B4L5Y983",
    name: "iShares Core MSCI World",
    ticker: "IWDA",
    currency: "USD",
    exchange: "AMS",
    assetClass: "global_eq",
    startPrice: 72,
    mu: 0.08,
    vol: 0.15,
  },
  {
    isin: "NO0010582984",
    name: "Storebrand Obligasjon",
    ticker: "STB-OBL",
    currency: "NOK",
    exchange: "OSE",
    assetClass: "bonds",
    startPrice: 102,
    mu: 0.03,
    vol: 0.04,
  },
];

const PORTFOLIO = "Default";
export const DEMO_AS_OF = "2026-09-01";
const ACCOUNT_CCY = "NOK";

interface Draft {
  date: string;
  type: string;
  name?: string;
  isin?: string;
  qty?: number;
  price?: number;
  priceCcy?: string;
  fx?: number;
  fees?: number;
  amount?: number;
  text?: string;
  cancelDate?: string;
  interest?: number;
}

interface Materialized {
  id: number;
  bookingDate: string;
  tradeDate: string;
  settleDate: string;
  portfolio: string;
  type: string;
  name: string;
  isin: string;
  qty: number;
  price: number;
  interest: number;
  fees: number;
  feeCcy: string;
  amount: number;
  amountCcy: string;
  purchaseValue: number;
  purchaseCcy: string;
  result: number;
  resultCcy: string;
  totalQty: number | null;
  saldo: number;
  fx: number;
  text: string;
  cancelDate: string;
  note: string;
  verification: string;
  brokerage: number;
  brokerageCcy: string;
  valutakurs: number;
}

function inst(isin: string): DemoInstrument {
  return DEMO_INSTRUMENTS.find((s) => s.isin === isin)!;
}

function settle(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d! + 2));
  return formatIso(dt);
}

function usdNok(date: string): number {
  const t = (Date.parse(date) - Date.parse("2021-01-01")) / (365 * 86400000);
  return round4(8.55 + 2.1 * (1 - Math.exp(-t / 2)) + 0.15 * Math.sin(t * 4));
}

function eurNok(date: string): number {
  const t = (Date.parse(date) - Date.parse("2021-01-01")) / (365 * 86400000);
  return round4(10.05 + 1.6 * (1 - Math.exp(-t / 2.2)) + 0.1 * Math.sin(t * 3));
}

function fxFor(ccy: string, date: string): number {
  if (ccy === "USD") return usdNok(date);
  if (ccy === "EUR") return eurNok(date);
  return 1;
}

function buildDrafts(): Draft[] {
  const drafts: Draft[] = [];
  const eqnr = inst("NO0010096985");
  const dnb = inst("NO0010031479");
  const aapl = inst("US0378331005");
  const iwda = inst("IE00B4L5Y983");
  const bond = inst("NO0010582984");

  drafts.push({ date: "2021-03-02", type: "INNSKUDD", amount: 420000, text: "Overføring fra lønnskonto" });

  const buy = (
    date: string,
    sec: DemoInstrument,
    qty: number,
    price: number,
    fees: number,
  ): void => {
    const fx = sec.currency === "NOK" ? 1 : fxFor(sec.currency, date);
    drafts.push({
      date,
      type: "KJØPT",
      name: sec.name,
      isin: sec.isin,
      qty,
      price,
      priceCcy: sec.currency,
      fx,
      fees,
      text: `Kjøp ${sec.ticker}`,
    });
  };
  const sell = (
    date: string,
    sec: DemoInstrument,
    qty: number,
    price: number,
    fees: number,
  ): void => {
    const fx = sec.currency === "NOK" ? 1 : fxFor(sec.currency, date);
    drafts.push({
      date,
      type: "SALG",
      name: sec.name,
      isin: sec.isin,
      qty,
      price,
      priceCcy: sec.currency,
      fx,
      fees,
      text: `Salg ${sec.ticker}`,
    });
  };

  buy("2021-03-05", eqnr, 400, 175, 39);
  buy("2021-03-08", dnb, 250, 165, 39);
  buy("2021-03-12", aapl, 35, 120, 79);
  buy("2021-03-18", iwda, 120, 72, 79);
  buy("2021-03-22", bond, 400, 102, 39);

  const months: string[] = [];
  for (let y = 2021; y <= 2026; y++) {
    for (let m = 1; m <= 12; m++) {
      const date = `${y}-${String(m).padStart(2, "0")}-01`;
      if (date <= "2021-03-02" || date > "2026-08-01") continue;
      months.push(date);
    }
  }
  months.forEach((date, i) => {
    drafts.push({ date, type: "INNSKUDD", amount: 12000, text: "Månedlig sparing" });
    if (i % 3 === 0) buy(date.slice(0, 8) + "04", iwda, 8, round2(72 * (1 + i * 0.006)), 19);
    if (i % 5 === 2) buy(date.slice(0, 8) + "06", eqnr, 15, round2(175 * (1 + i * 0.004)), 19);
    if (i % 7 === 4) buy(date.slice(0, 8) + "08", dnb, 10, round2(165 * (1 + i * 0.005)), 19);
    if (i % 11 === 6) buy(date.slice(0, 8) + "10", aapl, 2, round2(120 * (1 + i * 0.007)), 29);
    if (i % 13 === 5) buy(date.slice(0, 8) + "12", bond, 20, round2(102 * (1 + i * 0.001)), 19);
  });

  for (const y of [2021, 2022, 2023, 2024, 2025]) {
    drafts.push({
      date: `${y}-05-12`,
      type: "UTBYTTE",
      name: eqnr.name,
      isin: eqnr.isin,
      qty: 0,
      price: 8.5 + (y - 2021) * 0.4,
      priceCcy: "NOK",
      fx: 1,
      text: "Utbytte Equinor",
    });
    drafts.push({
      date: `${y}-08-18`,
      type: "UTBYTTE",
      name: aapl.name,
      isin: aapl.isin,
      qty: 0,
      price: 0.24,
      priceCcy: "USD",
      fx: fxFor("USD", `${y}-08-18`),
      text: "Dividend Apple",
    });
    drafts.push({
      date: `${y}-08-18`,
      type: "KUPONGSKATT",
      name: aapl.name,
      isin: aapl.isin,
      amount: 0,
      text: "Kildeskatt Apple 15 %",
    });
  }

  drafts.push({ date: "2022-01-05", type: "PLATTFORMAVGIFT", amount: -99, text: "Platformavgift Q4" });
  drafts.push({ date: "2023-01-05", type: "PLATTFORMAVGIFT", amount: -99, text: "Platformavgift Q4" });
  drafts.push({ date: "2024-01-05", type: "PLATTFORMAVGIFT", amount: -129, text: "Platformavgift Q4" });
  drafts.push({ date: "2025-01-06", type: "PLATTFORMAVGIFT", amount: -129, text: "Platformavgift Q4" });
  drafts.push({ date: "2026-01-05", type: "PLATTFORMAVGIFT", amount: -129, text: "Platformavgift Q4" });

  sell("2023-06-15", eqnr, 80, 310, 49);

  drafts.push({ date: "2024-01-12", type: "UTTAK INTERNT", amount: -35000, text: "Intern overføring BSU" });
  drafts.push({ date: "2024-03-01", type: "RENTE", amount: 186.45, text: "Rente på kontantbeholdning" });

  drafts.push({
    date: "2024-09-16",
    type: "KJØPT",
    name: eqnr.name,
    isin: eqnr.isin,
    qty: 25,
    price: 290,
    priceCcy: "NOK",
    fx: 1,
    fees: 39,
    text: "Kjøp Equinor — makulert",
    cancelDate: "2024-09-17",
  });

  // 8 FX trades on 5 dates — Nordnet VALUTAVEKSLING. Quotes collapse to one rate per pair per date.
  const fxDays: [string, number][] = [
    ["2022-04-01", 1500],
    ["2022-04-01", 500],
    ["2023-01-10", 800],
    ["2023-06-20", 1200],
    ["2023-06-20", 400],
    ["2024-02-15", 900],
    ["2025-03-03", 600],
    ["2025-03-03", 300],
  ];
  for (const [date, usd] of fxDays) {
    const rate = fxFor("USD", date);
    drafts.push({
      date,
      type: "VALUTAVEKSLING",
      name: "USD",
      qty: usd,
      price: rate,
      priceCcy: "USD",
      fx: rate,
      amount: round2(-usd * rate),
      text: `Valutaveksling USD ${usd}`,
    });
  }

  const typeRank: Record<string, number> = {
    INNSKUDD: 0,
    VALUTAVEKSLING: 1,
    KJØPT: 2,
    SALG: 3,
    UTBYTTE: 4,
    KUPONGSKATT: 5,
    RENTE: 6,
    PLATTFORMAVGIFT: 7,
    "UTTAK INTERNT": 8,
  };
  drafts.sort(
    (a, b) => a.date.localeCompare(b.date) || (typeRank[a.type] ?? 8) - (typeRank[b.type] ?? 8),
  );
  return drafts;
}

function materialize(drafts: Draft[]): Materialized[] {
  let saldo = 0;
  const qty = new Map<string, number>();
  const out: Materialized[] = [];
  let id = 0;
  let roundingBlip = false;

  for (const d of drafts) {
    id += 1;
    const sec = d.isin ? inst(d.isin) : null;
    const ccy = d.priceCcy || sec?.currency || ACCOUNT_CCY;
    const fx = ccy === "NOK" ? 1 : (d.fx ?? 1);
    const fees = d.fees ?? 0;
    let qtyNow = d.qty ?? 0;
    let amount = 0;
    let purchase = 0;
    let result = 0;
    let totalQty: number | null = null;
    const held = d.isin ? (qty.get(d.isin) ?? 0) : 0;

    if (d.type === "KJØPT") {
      const gross = round2(Math.abs(qtyNow) * (d.price ?? 0) * fx);
      amount = round2(-(gross + fees));
      purchase = round2(Math.abs(qtyNow) * (d.price ?? 0));
    } else if (d.type === "SALG") {
      const gross = round2(Math.abs(qtyNow) * (d.price ?? 0) * fx);
      amount = round2(gross - fees);
      purchase = 0;
      result = 0;
    } else if (d.type === "UTBYTTE") {
      const shares = held;
      qtyNow = shares;
      const dps = d.price ?? 0;
      amount = round2(shares * dps * fx);
      purchase = 0;
    } else if (d.type === "KUPONGSKATT") {
      amount = d.amount ?? 0;
      if (amount === 0) {
        const prevDiv = [...out].reverse().find((r) => r.type === "UTBYTTE" && r.isin === d.isin);
        amount = prevDiv ? round2(-Math.abs(prevDiv.amount) * 0.15) : 0;
      }
      qtyNow = 0;
    } else if (d.type === "VALUTAVEKSLING") {
      qtyNow = d.qty ?? 0;
      amount = d.amount ?? round2(-Math.abs(qtyNow) * fx);
      purchase = Math.abs(qtyNow);
    } else if (d.type === "INNSKUDD" || d.type === "UTTAK INTERNT" || d.type === "PLATTFORMAVGIFT" || d.type === "RENTE") {
      amount = d.amount ?? 0;
      qtyNow = 0;
    } else {
      amount = d.amount ?? 0;
    }

    const cancelled = Boolean(d.cancelDate);
    if (!cancelled) {
      saldo = round2(saldo + amount);
      if (d.isin && (d.type === "KJØPT" || d.type === "SALG" || d.type === "SPLITT" || d.type === "SPLIT")) {
        const signed = d.type === "SALG" ? -Math.abs(qtyNow) : Math.abs(qtyNow);
        const next = round4(held + signed);
        qty.set(d.isin, next);
        totalQty = next;
        if (!roundingBlip && d.type === "KJØPT") {
          totalQty = round4(next + 0.0001);
          roundingBlip = true;
        }
      } else if (d.isin) {
        // Nordnet writes Totalt antall = 0 on UTBYTTE / KUPONGSKATT. It is not a holding.
        totalQty = 0;
      }
    } else if (d.isin) {
      totalQty = round4(held);
    }

    out.push({
      id,
      bookingDate: d.date,
      tradeDate: d.date,
      settleDate: settle(d.date),
      portfolio: PORTFOLIO,
      type: d.type,
      name: d.name ?? "",
      isin: d.isin ?? "",
      qty: qtyNow,
      price: d.price ?? 0,
      interest: d.interest ?? 0,
      fees,
      feeCcy: ACCOUNT_CCY,
      amount,
      amountCcy: ACCOUNT_CCY,
      purchaseValue: purchase,
      purchaseCcy: purchase ? ccy : d.type === "VALUTAVEKSLING" ? ccy : "",
      result,
      resultCcy: result ? ccy : "",
      totalQty,
      saldo,
      fx: ccy === "NOK" ? 0 : fx,
      text: d.text ?? "",
      cancelDate: d.cancelDate ?? "",
      note: d.type === "KJØPT" || d.type === "SALG" ? `S${100000 + id}` : "",
      verification: `V${800000 + id}`,
      brokerage: fees,
      brokerageCcy: ACCOUNT_CCY,
      valutakurs: ccy === "NOK" ? 0 : fx,
    });
  }
  return out;
}

function cellNum(n: number, decimals: number, emptyIfZero = false): string {
  if (!Number.isFinite(n)) return "";
  if (emptyIfZero && n === 0) return "";
  return nnNumber(n, decimals);
}

export function materializedToCells(row: Materialized): string[] {
  const cells = new Array<string>(NORDNET_COL_COUNT).fill("");
  cells[0] = String(row.id);
  cells[1] = row.bookingDate;
  cells[2] = row.tradeDate;
  cells[3] = row.settleDate;
  cells[4] = row.portfolio;
  cells[5] = row.type;
  cells[6] = row.name;
  cells[7] = row.isin;
  cells[8] = row.qty ? cellNum(row.qty, 4) : "";
  cells[9] = row.price ? cellNum(row.price, 4) : "";
  cells[10] = row.interest ? cellNum(row.interest, 2) : "";
  cells[11] = row.fees ? cellNum(row.fees, 2) : "";
  cells[12] = row.fees || row.feeCcy ? row.feeCcy : "";
  cells[13] = cellNum(row.amount, 2);
  cells[14] = row.amountCcy;
  cells[15] = row.purchaseValue ? cellNum(row.purchaseValue, 2) : "";
  cells[16] = row.purchaseCcy;
  cells[17] = row.result ? cellNum(row.result, 2) : "";
  cells[18] = row.resultCcy;
  cells[19] = row.totalQty == null ? "" : cellNum(row.totalQty, 4);
  cells[20] = cellNum(row.saldo, 2);
  cells[21] = row.fx ? cellNum(row.fx, 6) : "";
  cells[22] = row.text;
  cells[23] = row.cancelDate;
  cells[24] = row.note;
  cells[25] = row.verification;
  cells[26] = row.brokerage ? cellNum(row.brokerage, 2) : "";
  cells[27] = row.brokerage ? row.brokerageCcy : "";
  cells[28] = row.valutakurs ? cellNum(row.valutakurs, 6) : "";
  cells[29] = "";
  return cells;
}

export function serializeNordnet(rowsAsc: Materialized[], delimiter = "\t", eol = "\r\n"): string {
  const newestFirst = rowsAsc.slice().sort((a, b) => b.id - a.id);
  const header = NORDNET_HEADERS_NB.join(delimiter);
  const body = newestFirst.map((r) => {
    const cells = materializedToCells(r);
    return cells.map((c) => (delimiter === "," ? csvEscape(c, ",") : c)).join(delimiter);
  });
  return [header, ...body].join(eol) + eol;
}

export function buildSyntheticNordnet(): {
  rowsAsc: Materialized[];
  text: string;
  bytes: Uint8Array;
  utf8Csv: Uint8Array;
} {
  const rowsAsc = materialize(buildDrafts());
  const text = serializeNordnet(rowsAsc, "\t", "\r\n");
  const bytes = encodeUtf16Le(text, true);
  const csv = serializeNordnet(rowsAsc, ",", "\n");
  const utf8Csv = new TextEncoder().encode(csv);
  return { rowsAsc, text, bytes, utf8Csv };
}

function kindOf(type: string): TxKind {
  return classifyType(type, {}) ?? "other_corporate";
}

export function expectedTransactions(rowsAsc: Materialized[]): Transaction[] {
  const out: Transaction[] = [];
  for (const row of rowsAsc) {
    if (row.cancelDate) continue;
    const kind = kindOf(row.type);
    const fx = row.fx || row.valutakurs || 1;
    out.push({
      id: `nn-${PORTFOLIO}-${row.id}`,
      nordnetId: String(row.id),
      fingerprint: `id:${PORTFOLIO}|${row.id}`,
      bookingDate: row.bookingDate,
      tradeDate: row.tradeDate,
      settleDate: row.settleDate,
      portfolio: PORTFOLIO,
      kind,
      rawType: row.type,
      name: row.name,
      isin: row.isin,
      qty: round4(row.qty),
      price: row.price,
      priceCcy: row.purchaseCcy || (Math.abs(fx - 1) < 1e-9 ? ACCOUNT_CCY : row.feeCcy),
      interest: row.interest,
      fees: Math.abs(row.fees),
      feeCcy: row.feeCcy,
      amount: row.amount,
      amountCcy: row.amountCcy,
      purchaseValue: row.purchaseValue,
      purchaseCcy: row.purchaseCcy,
      result: row.result,
      resultCcy: row.resultCcy,
      fileQty: row.totalQty,
      fileSaldo: row.saldo,
      fxRate: fx,
      text: row.text,
      cancelDate: "",
      cancelled: false,
      noteNumber: row.note,
      verification: row.verification,
      brokerage: Math.abs(row.brokerage),
      valutakurs: row.valutakurs,
      sourceFile: "nordnet-demo.txt",
      rowNumber: 0,
    });
  }
  return out;
}

function monthDates(start: string, end: string): string[] {
  const out: string[] = [];
  let [y, m] = start.split("-").map(Number) as [number, number];
  const endKey = end.slice(0, 7);
  while (`${y}-${String(m).padStart(2, "0")}` <= endKey) {
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    out.push(`${y}-${String(m).padStart(2, "0")}-${String(Math.min(last, 28)).padStart(2, "0")}`);
    m += 1;
    if (m === 13) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

export function buildDemoQuotes(seed = 11001): { prices: PriceQuote[]; fx: FxQuote[] } {
  const rng = createRng(seed);
  const prices: PriceQuote[] = [];
  const fx: FxQuote[] = [];
  const dates = monthDates("2021-03-01", DEMO_AS_OF);
  for (const sec of DEMO_INSTRUMENTS) {
    let px = sec.startPrice;
    for (const date of dates) {
      const z = rng.gaussian();
      px = Math.max(0.5, px * (1 + sec.mu / 12 + (sec.vol / Math.sqrt(12)) * z));
      prices.push({ isin: sec.isin, date, close: round4(px), source: "synthetic" });
    }
  }
  for (const date of dates) {
    fx.push({ pair: "USDNOK", date, rate: usdNok(date), source: "synthetic", stale: false });
    fx.push({ pair: "EURNOK", date, rate: eurNok(date), source: "synthetic", stale: false });
  }
  return { prices, fx };
}

export function demoSecurities(): Security[] {
  return DEMO_INSTRUMENTS.map((s) => ({
    isin: s.isin,
    ticker: s.ticker,
    name: s.name,
    currency: s.currency,
    exchange: s.exchange,
    assetClass: s.assetClass,
  }));
}

export function buildDemoLedger(): { ledger: LedgerBundle; bytes: Uint8Array; text: string; utf8Csv: Uint8Array } {
  const { rowsAsc, bytes, text, utf8Csv } = buildSyntheticNordnet();
  const imported = importNordnetBuffer(bytes, "nordnet-demo.txt", emptyLedgerBundle(), {});
  const quotes = buildDemoQuotes();
  const priceDates = [...new Set(quotes.prices.map((p) => p.date))].sort();
  const securities = imported.ledger.securities.map((s) => {
    const demo = DEMO_INSTRUMENTS.find((d) => d.isin === s.isin);
    return demo
      ? {
          ...s,
          ticker: demo.ticker,
          name: demo.name,
          currency: demo.currency,
          exchange: demo.exchange,
          assetClass: demo.assetClass,
          assetClassConfirmed: true,
          userSet: { ticker: true, name: true, currency: true, exchange: true, assetClass: true },
        }
      : s;
  });
  return {
    ledger: {
      ...imported.ledger,
      securities,
      prices: quotes.prices,
      fx: mergeKeepImported(imported.ledger.fx, quotes.fx),
      benchmarks: buildSyntheticBenchmarks(priceDates),
    },
    bytes,
    text,
    utf8Csv,
  };
}

function mergeKeepImported(fromTx: FxQuote[], synthetic: FxQuote[]): FxQuote[] {
  const m = new Map<string, FxQuote>();
  for (const f of fromTx) m.set(`${f.pair}|${f.date}`, f);
  for (const f of synthetic) {
    const k = `${f.pair}|${f.date}`;
    if (!m.has(k)) m.set(k, f);
    else m.set(k, { ...f, stale: false });
  }
  return [...m.values()].sort((a, b) => a.date.localeCompare(b.date) || a.pair.localeCompare(b.pair));
}

export function downloadableDemoFile(): { bytes: Uint8Array; fileName: string; mime: string } {
  const { bytes } = buildSyntheticNordnet();
  return { bytes, fileName: "Transaksjoner_og_notaer.xls", mime: "text/tab-separated-values" };
}
