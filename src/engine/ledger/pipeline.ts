/** Import pipeline: classify, cancel filter, dedup, merge, report. */

import type {
  ImportReport,
  LedgerBundle,
  NordnetRow,
  ParseMeta,
  ReviewItem,
  SkipRecord,
  Transaction,
  TxKind,
  FxQuote,
} from "./types";
import { classifyType } from "./classify";
import { parseNordnetBytes } from "./parse";
import { reconcileRows } from "./reconcile";
import {
  inferAssetClass,
  inferExchange,
  inferTicker,
  inferTradeCurrency,
  foreignCcyFromRow,
  fxRateFromTrade,
  majorityForeignCcy,
  upsertSecurity,
} from "./securities";
import { round2, round4 } from "./numbers";

export function fingerprintOf(row: NordnetRow): string {
  if (row.id) return `id:${row.portfolio}|${row.id}`;
  return `fp:${row.bookingDate}|${row.rawType}|${row.isin}|${round4(row.qty)}|${round2(row.amount)}|${row.text}|${row.verification}`;
}

function impliedFx(row: NordnetRow): number {
  const fx = fxRateFromTrade({
    fxRate: row.fxRate,
    valutakurs: row.valutakurs,
    price: row.price,
    qty: row.qty,
    amount: row.amount,
    isFxTrade: classifyType(row.rawType, {}) === "currency_exchange",
  });
  if (fx > 0) return fx;
  return 1;
}

function toTx(row: NordnetRow, kind: TxKind, sourceFile: string, cancelled: boolean): Transaction {
  const fees = row.totalFees !== 0 ? Math.abs(row.totalFees) : Math.abs(row.brokerage);
  const fx = impliedFx(row);
  const tradeCcy = inferTradeCurrency(row);
  const priceCcy = tradeCcy || row.purchaseCcy || "NOK";
  return {
    id: `nn-${row.portfolio || "acc"}-${row.id || fingerprintOf(row)}`,
    nordnetId: row.id,
    fingerprint: fingerprintOf(row),
    bookingDate: row.bookingDate,
    tradeDate: row.tradeDate || row.bookingDate,
    settleDate: row.settleDate || row.tradeDate || row.bookingDate,
    portfolio: row.portfolio,
    kind,
    rawType: row.rawType,
    name: row.name,
    isin: row.isin,
    qty: round4(row.qty),
    price: row.price,
    priceCcy,
    interest: row.interest,
    fees,
    feeCcy: row.feeCcy || row.brokerageCcy || row.amountCcy || "NOK",
    amount: row.amount,
    amountCcy: row.amountCcy || "NOK",
    purchaseValue: row.purchaseValue,
    purchaseCcy: row.purchaseCcy || "",
    result: row.result,
    resultCcy: row.resultCcy || "",
    fileQty: row.totalQty,
    fileSaldo: row.saldo,
    fxRate: fx,
    text: row.text,
    cancelDate: row.cancelDate,
    cancelled,
    noteNumber: row.noteNumber,
    verification: row.verification,
    brokerage: Math.abs(row.brokerage),
    valutakurs: row.valutakurs,
    sourceFile,
    rowNumber: row.rowNumber,
  };
}

function emptyLedger(): LedgerBundle {
  return { accountCurrency: "NOK", transactions: [], securities: [], prices: [], fx: [], benchmarks: [] };
}

export function cloneLedger(l: LedgerBundle): LedgerBundle {
  return {
    accountCurrency: "NOK",
    transactions: l.transactions.map((t) => ({ ...t })),
    securities: l.securities.map((s) => ({ ...s })),
    prices: l.prices.map((p) => ({ ...p })),
    fx: l.fx.map((f) => ({ ...f })),
    benchmarks: (l.benchmarks ?? []).map((b) => ({ ...b })),
  };
}

export function emptyLedgerBundle(): LedgerBundle {
  return emptyLedger();
}

export { inferTicker, inferExchange };

export function mergeFxFromRows(existing: FxQuote[], rows: NordnetRow[]): FxQuote[] {
  const kept = existing.filter((f) => f.source === "import" || f.source === "synthetic");
  const seen = new Set(kept.map((f) => `${f.pair}|${f.date}`));
  const fallback = majorityForeignCcy(
    rows.map((r) => ({ purchaseCcy: r.purchaseCcy, resultCcy: r.resultCcy, priceCcy: r.purchaseCcy })),
  );
  const out = kept.slice();
  for (const row of rows) {
    if (row.cancelDate) continue;
    const kind = classifyType(row.rawType, {});
    const isFxTrade = kind === "currency_exchange";
    const rate = fxRateFromTrade({
      fxRate: row.fxRate,
      valutakurs: row.valutakurs,
      price: row.price,
      qty: row.qty,
      amount: row.amount,
      isFxTrade,
    });
    if (!(rate > 0)) continue;
    if (!isFxTrade && Math.abs(rate - 1) < 1e-12) continue;
    let ccy = foreignCcyFromRow(row);
    if (!ccy && isFxTrade) ccy = fallback;
    if (!ccy || ccy === "NOK") continue;
    const pair = `${ccy}NOK`;
    const date = row.tradeDate || row.bookingDate;
    const key = `${pair}|${date}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ pair, date, rate, source: "nordnet", stale: true });
  }
  out.sort((a, b) => a.date.localeCompare(b.date) || a.pair.localeCompare(b.pair));
  return out;
}

function securityFromRow(row: NordnetRow, tx: Transaction): Parameters<typeof upsertSecurity>[1] {
  const ccy = inferTradeCurrency(row) || tx.priceCcy || "";
  return {
    isin: tx.isin,
    name: tx.name,
    ticker: inferTicker(tx.name, tx.isin),
    currency: ccy,
    exchange: inferExchange(tx.name, tx.isin),
    assetClass: inferAssetClass(tx.isin, tx.name),
    assetClassConfirmed: false,
  };
}

function byIdAsc(a: Transaction, b: Transaction): number {
  const ai = Number(a.nordnetId);
  const bi = Number(b.nordnetId);
  if (Number.isFinite(ai) && Number.isFinite(bi) && ai !== bi) return ai - bi;
  const c = a.nordnetId.localeCompare(b.nordnetId, undefined, { numeric: true });
  if (c !== 0) return c;
  return a.tradeDate.localeCompare(b.tradeDate);
}

export function importNordnetBuffer(
  buf: ArrayBuffer | Uint8Array,
  fileName: string,
  existing: LedgerBundle | null,
  mappings: Record<string, TxKind>,
): { ledger: LedgerBundle; report: ImportReport; mappings: Record<string, TxKind> } {
  const { rows, meta } = parseNordnetBytes(buf);
  return importNordnetRows(rows, meta, fileName, existing, mappings);
}

export function importNordnetRows(
  rows: NordnetRow[],
  meta: ParseMeta,
  fileName: string,
  existing: LedgerBundle | null,
  mappings: Record<string, TxKind>,
): { ledger: LedgerBundle; report: ImportReport; mappings: Record<string, TxKind> } {
  const base = existing ? cloneLedger(existing) : emptyLedger();
  const known = new Set(base.transactions.map((t) => t.fingerprint));
  const skipped: SkipRecord[] = [];
  const review: ReviewItem[] = [];
  const cancelled: ImportReport["cancelled"] = [];
  let created = 0;
  let dup = 0;
  let cancelN = 0;
  let emptyN = 0;

  const recon = reconcileRows(rows);
  const active: Transaction[] = [];

  for (const row of rows) {
    if (!row.id && !row.rawType && !row.isin && row.amount === 0 && row.qty === 0) {
      emptyN += 1;
      skipped.push({ rowNumber: row.rowNumber, reason: "empty", detail: "Blank row" });
      continue;
    }
    if (row.cancelDate) {
      cancelN += 1;
      cancelled.push({
        rowNumber: row.rowNumber,
        nordnetId: row.id,
        date: row.cancelDate,
        rawType: row.rawType,
        name: row.name,
      });
      skipped.push({
        rowNumber: row.rowNumber,
        reason: "cancelled",
        detail: `Makuleringsdato ${row.cancelDate}`,
      });
      continue;
    }
    const kind = classifyType(row.rawType, mappings);
    if (!kind) {
      review.push({
        id: `rev-${row.rowNumber}-${row.id}`,
        rowNumber: row.rowNumber,
        rawType: row.rawType,
        name: row.name,
        isin: row.isin,
        date: row.tradeDate || row.bookingDate,
        amount: row.amount,
        sample: row.cells.slice(0, 8),
      });
      skipped.push({
        rowNumber: row.rowNumber,
        reason: "unrecognized",
        detail: `Type “${row.rawType}” is not mapped`,
      });
      continue;
    }
    const tx = toTx(row, kind, fileName, false);
    if (tx.isin) {
      base.securities = upsertSecurity(base.securities, securityFromRow(row, tx));
    }
    if (known.has(tx.fingerprint)) {
      dup += 1;
      skipped.push({
        rowNumber: row.rowNumber,
        reason: "duplicate",
        detail: `Id ${tx.nordnetId || tx.fingerprint} already in ledger`,
      });
      continue;
    }
    known.add(tx.fingerprint);
    active.push(tx);
    created += 1;
  }

  active.sort(byIdAsc);
  base.transactions = [...base.transactions, ...active].sort(byIdAsc);
  base.fx = mergeFxFromRows(base.fx, rows);

  const report: ImportReport = {
    fileName,
    encoding: meta.encoding,
    delimiter: meta.delimiter,
    positional: meta.positional,
    rowsRead: rows.length,
    transactionsCreated: created,
    duplicatesSkipped: dup,
    cancelledExcluded: cancelN,
    emptySkipped: emptyN,
    reviewCount: review.length,
    skipped,
    review,
    recon,
    cancelled,
  };

  return { ledger: base, report, mappings };
}

export function applyReviewMapping(
  ledger: LedgerBundle,
  report: ImportReport,
  rawType: string,
  kind: TxKind,
  rows: NordnetRow[],
  fileName: string,
  mappings: Record<string, TxKind>,
): { ledger: LedgerBundle; report: ImportReport; mappings: Record<string, TxKind> } {
  const nextMap: Record<string, TxKind> = { ...mappings, [rawType]: kind, [rawType.trim()]: kind };
  const pending = rows.filter((r) => r.rawType === rawType && !r.cancelDate);
  const known = new Set(ledger.transactions.map((t) => t.fingerprint));
  const next = cloneLedger(ledger);
  const extra: Transaction[] = [];
  for (const row of pending) {
    const tx = toTx(row, kind, fileName, false);
    if (known.has(tx.fingerprint)) continue;
    known.add(tx.fingerprint);
    extra.push(tx);
    if (tx.isin) {
      next.securities = upsertSecurity(next.securities, securityFromRow(row, tx));
    }
  }
  const remaining = report.review.filter((r) => r.rawType !== rawType);
  const skipped = report.skipped.filter(
    (s) => !(s.reason === "unrecognized" && s.detail.includes(`“${rawType}”`)),
  );
  next.transactions = [...next.transactions, ...extra].sort(byIdAsc);
  return {
    ledger: next,
    report: {
      ...report,
      transactionsCreated: report.transactionsCreated + extra.length,
      reviewCount: remaining.length,
      skipped,
      review: remaining,
    },
    mappings: nextMap,
  };
}
