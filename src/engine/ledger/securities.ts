import type { AssetId } from "../types";
import type { FxQuote, LedgerBundle, Security, Transaction } from "./types";

const NORDIC = new Set(["NO", "SE", "DK", "FI", "IS"]);
const KNOWN_CCY = new Set(["USD", "EUR", "SEK", "DKK", "GBP", "CHF", "CAD", "AUD", "JPY", "NOK"]);

const CCY_NAME_ALIASES: [RegExp, string][] = [
  [/\b(us\s*dollar|amerikanske\s+dollar|usd)\b/i, "USD"],
  [/\b(euro|eur)\b/i, "EUR"],
  [/\b(svenska\s+kronor|svenske\s+kroner|sek)\b/i, "SEK"],
  [/\b(danske\s+kroner|dkk)\b/i, "DKK"],
  [/\b(sterling|britiske\s+pund|gbp)\b/i, "GBP"],
  [/\b(swiss\s+franc|sveitsiske\s+franc|chf)\b/i, "CHF"],
];

export function looksLikeFund(name: string): boolean {
  const n = name.toLowerCase();
  return /etf|ucits|fond|fund|indeks|index|ishares|vanguard|xact|sicav|obligasjon|rentebevis|pengemarked|money market|kredittfond|likviditet|likvider|aksjefond|rentefond|kombinasjonsfond|mutual|unit trust/.test(
    n,
  );
}

/**
 * Nordnet files have no ticker and no exchange. Never invent them from the ISIN.
 * Funds are labelled exchange "Fund"; everything else stays blank for the user to fill.
 */
export function inferTicker(_name: string, _isin: string): string {
  return "";
}

export function inferExchange(name: string, _isin: string): string {
  return looksLikeFund(name) ? "Fund" : "";
}

export function inferAssetClass(isin: string, name: string): AssetId {
  const n = name.toLowerCase();
  if (/obligasjon|obligation|bond|rente|gilt|kredit|credit|treasury|rentebevis/.test(n)) return "bonds";
  if (/eiendom|real estate|reit|property|fastighet|bolig/.test(n)) return "real_estate";
  if (/money market|pengemarked|likviditet|cash fund/.test(n)) return "cash";
  const p = isin.slice(0, 2).toUpperCase();
  if (p === "US") return "us_eq";
  if (NORDIC.has(p)) return "nordic_eq";
  return "global_eq";
}

/** True when a ticker was produced by the old ISIN-tail / name-prefix heuristic. */
export function looksGeneratedTicker(ticker: string, name: string, isin: string): boolean {
  const t = ticker.trim();
  if (!t) return true;
  if (isin && (t === isin.slice(-4) || t === isin.slice(-3) || t === isin.slice(-5))) return true;
  if (/^\d{3,6}$/.test(t)) return true;
  const m = /^([A-Z0-9.\-]{1,12})\b/i.exec(name.trim());
  if (m && t.toUpperCase() === m[1]!.toUpperCase()) return true;
  return false;
}

function cleanCcy(raw: string): string {
  const c = raw.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(c) ? c : "";
}

function ccyInText(s: string): string {
  const up = s.toUpperCase();
  for (const c of ["USD", "EUR", "SEK", "DKK", "GBP", "CHF", "CAD", "AUD", "JPY"]) {
    const re = new RegExp(`\\b${c}\\b`);
    if (re.test(up)) return c;
  }
  for (const [re, ccy] of CCY_NAME_ALIASES) {
    if (re.test(s)) return ccy;
  }
  return "";
}

export function fxRateFromRow(row: { fxRate: number; valutakurs: number }): number {
  if (row.fxRate > 0) return row.fxRate;
  if (row.valutakurs > 0) return row.valutakurs;
  return 0;
}

export function fxRateFromTrade(row: {
  fxRate: number;
  valutakurs: number;
  price: number;
  qty: number;
  amount: number;
  isFxTrade?: boolean;
}): number {
  const tagged = fxRateFromRow(row);
  if (tagged > 0) return tagged;
  if (row.isFxTrade && row.price > 0) return row.price;
  if (row.isFxTrade && row.qty && Number.isFinite(row.amount / row.qty)) {
    const implied = Math.abs(row.amount / row.qty);
    if (implied > 0.01) return implied;
  }
  return 0;
}

/** Non-NOK currency carried on a row, if any. */
export function foreignCcyFromRow(row: {
  purchaseCcy: string;
  resultCcy: string;
  feeCcy: string;
  brokerageCcy: string;
  amountCcy: string;
  name: string;
  text: string;
  cells?: string[];
}): string {
  const cols = [row.purchaseCcy, row.resultCcy, row.feeCcy, row.brokerageCcy, row.amountCcy];
  for (const raw of cols) {
    const c = cleanCcy(raw);
    if (c && c !== "NOK") return c;
  }
  const named = cleanCcy(row.name);
  if (named && named !== "NOK" && KNOWN_CCY.has(named)) return named;
  const fromText = ccyInText(`${row.name} ${row.text}`);
  if (fromText) return fromText;
  if (row.cells) {
    for (const cell of row.cells) {
      const c = cleanCcy(cell);
      if (c && c !== "NOK" && KNOWN_CCY.has(c)) return c;
      const t = ccyInText(cell);
      if (t) return t;
    }
  }
  return "";
}

/**
 * Trading currency of a security from a trade row.
 * Rule: Vekslingskurs filled, or Kjøpsverdi/Resultat valuta other than NOK → that currency.
 * Do not stamp NOK when an FX rate is present — a later (or earlier) row may carry USD.
 */
export function inferTradeCurrency(row: {
  fxRate: number;
  valutakurs: number;
  purchaseCcy: string;
  resultCcy: string;
  feeCcy: string;
  brokerageCcy: string;
  amountCcy: string;
  name: string;
  text: string;
  cells?: string[];
}): string {
  const purchase = cleanCcy(row.purchaseCcy);
  const result = cleanCcy(row.resultCcy);
  if (purchase && purchase !== "NOK") return purchase;
  if (result && result !== "NOK") return result;
  const fx = fxRateFromRow(row);
  const foreign = foreignCcyFromRow(row);
  if (foreign) return foreign;
  if (fx > 0 && Math.abs(fx - 1) > 1e-8) return "";
  return "NOK";
}

function preferCurrency(prev: string, incoming: string): string {
  const a = cleanCcy(prev);
  const b = cleanCcy(incoming);
  if (b && b !== "NOK") return b;
  if (a && a !== "NOK") return a;
  return b || a || "NOK";
}

export function emptyUserSet(): NonNullable<Security["userSet"]> {
  return {};
}

export function withUserPatch(sec: Security, patch: Partial<Security>): Security {
  const userSet = { ...(sec.userSet ?? {}) };
  if (patch.ticker !== undefined) userSet.ticker = true;
  if (patch.name !== undefined) userSet.name = true;
  if (patch.currency !== undefined) userSet.currency = true;
  if (patch.exchange !== undefined) userSet.exchange = true;
  if (patch.assetClass !== undefined || patch.assetClassConfirmed === true) userSet.assetClass = true;
  const assetClassConfirmed =
    patch.assetClass !== undefined || patch.assetClassConfirmed === true
      ? true
      : (patch.assetClassConfirmed ?? sec.assetClassConfirmed);
  return { ...sec, ...patch, userSet, assetClassConfirmed };
}

export function upsertSecurity(list: Security[], incoming: Security): Security[] {
  const i = list.findIndex((s) => s.isin === incoming.isin);
  if (i < 0) {
    return [
      ...list,
      {
        ...incoming,
        ticker: incoming.userSet?.ticker ? incoming.ticker : incoming.ticker || "",
        exchange: incoming.userSet?.exchange ? incoming.exchange : incoming.exchange || inferExchange(incoming.name, incoming.isin),
        userSet: incoming.userSet ?? {},
        assetClassConfirmed: incoming.assetClassConfirmed ?? false,
      },
    ];
  }
  const prev = list[i]!;
  const user = prev.userSet ?? {};
  const next = [...list];
  const name = user.name ? prev.name : incoming.name || prev.name;
  next[i] = {
    isin: prev.isin,
    ticker: user.ticker ? prev.ticker : incoming.ticker || "",
    name,
    currency: user.currency ? prev.currency : preferCurrency(prev.currency, incoming.currency),
    exchange: user.exchange ? prev.exchange : incoming.exchange || inferExchange(name, prev.isin),
    assetClass: user.assetClass || prev.assetClassConfirmed ? prev.assetClass : incoming.assetClass || prev.assetClass,
    assetClassConfirmed: prev.assetClassConfirmed ?? false,
    userSet: user,
  };
  return next;
}

export function overlaySecurityMaster(
  secs: Security[],
  master: Record<string, Partial<Security>>,
): Security[] {
  return secs.map((s) => {
    const o = master[s.isin];
    if (!o) return s;
    const ou = o.userSet ?? {};
    return {
      ...s,
      ticker: ou.ticker ? (o.ticker ?? s.ticker) : s.ticker,
      name: ou.name ? (o.name ?? s.name) : s.name,
      currency: ou.currency ? (o.currency ?? s.currency) : s.currency,
      exchange: ou.exchange ? (o.exchange ?? s.exchange) : s.exchange,
      assetClass: ou.assetClass || o.assetClassConfirmed ? (o.assetClass ?? s.assetClass) : s.assetClass,
      assetClassConfirmed: o.assetClassConfirmed ?? s.assetClassConfirmed,
      userSet: { ...(s.userSet ?? {}), ...ou },
    };
  });
}

/**
 * One-time cleanup: drop auto-generated tickers/exchanges, keep only user-entered
 * fields. Funds without a user exchange become "Fund".
 */
export function sanitizeSecurity(sec: Security): Security {
  const user = { ...(sec.userSet ?? {}) };
  const keepTicker = Boolean(user.ticker);
  const keepExchange = Boolean(user.exchange);
  return {
    ...sec,
    ticker: keepTicker ? sec.ticker : "",
    exchange: keepExchange ? sec.exchange : inferExchange(sec.name, sec.isin),
    userSet: { ...user, ticker: keepTicker, exchange: keepExchange },
  };
}

export function sanitizeSecurities(list: Security[]): Security[] {
  return list.map(sanitizeSecurity);
}

export function sanitizeSecurityMaster(
  master: Record<string, Partial<Security>>,
): Record<string, Partial<Security>> {
  const out: Record<string, Partial<Security>> = {};
  for (const [isin, o] of Object.entries(master)) {
    const user = { ...(o.userSet ?? {}) };
    const next: Partial<Security> = { ...o, userSet: user };
    if (!user.ticker) next.ticker = "";
    if (!user.exchange) next.exchange = looksLikeFund(o.name ?? "") ? "Fund" : "";
    out[isin] = next;
  }
  return out;
}

export function majorityForeignCcy(items: { purchaseCcy?: string; resultCcy?: string; priceCcy?: string; currency?: string }[]): string {
  const counts = new Map<string, number>();
  for (const it of items) {
    for (const raw of [it.purchaseCcy, it.resultCcy, it.priceCcy, it.currency]) {
      const c = cleanCcy(raw ?? "");
      if (c && c !== "NOK") counts.set(c, (counts.get(c) ?? 0) + 1);
    }
  }
  let best = "USD";
  let n = 0;
  for (const [c, k] of counts) {
    if (k > n) {
      best = c;
      n = k;
    }
  }
  return best;
}

export function mergeFxFromTransactions(
  existing: FxQuote[],
  txs: Transaction[],
  replaceNordnet = true,
): FxQuote[] {
  const kept = replaceNordnet
    ? existing.filter((f) => f.source === "import" || f.source === "synthetic")
    : existing.slice();
  const seen = new Set(kept.map((f) => `${f.pair}|${f.date}`));
  const fallback = majorityForeignCcy(txs);
  const out = kept.slice();
  for (const tx of txs) {
    if (tx.cancelled || tx.cancelDate) continue;
    const isFxTrade = tx.kind === "currency_exchange";
    const rate = fxRateFromTrade({
      fxRate: tx.fxRate,
      valutakurs: tx.valutakurs,
      price: tx.price,
      qty: tx.qty,
      amount: tx.amount,
      isFxTrade,
    });
    if (!(rate > 0)) continue;
    if (!isFxTrade && Math.abs(rate - 1) < 1e-12) continue;
    let ccy = foreignCcyFromRow({
      purchaseCcy: tx.purchaseCcy,
      resultCcy: tx.resultCcy,
      feeCcy: tx.feeCcy,
      brokerageCcy: tx.feeCcy,
      amountCcy: tx.amountCcy,
      name: tx.name,
      text: tx.text,
    });
    if (!ccy && isFxTrade) ccy = fallback;
    if (!ccy || ccy === "NOK") continue;
    const pair = `${ccy}NOK`;
    const date = tx.tradeDate || tx.bookingDate;
    const key = `${pair}|${date}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ pair, date, rate, source: "nordnet", stale: true });
  }
  out.sort((a, b) => a.date.localeCompare(b.date) || a.pair.localeCompare(b.pair));
  return out;
}

export function rebuildLedgerFx(ledger: LedgerBundle): LedgerBundle {
  return { ...ledger, fx: mergeFxFromTransactions(ledger.fx, ledger.transactions) };
}

export function sanitizeLedger(ledger: LedgerBundle, rebuildFx = true): LedgerBundle {
  const next = { ...ledger, securities: sanitizeSecurities(ledger.securities) };
  return rebuildFx ? rebuildLedgerFx(next) : next;
}

export function lookupPrice(
  prices: { isin: string; date: string; close: number; source?: "import" | "nordnet" | "synthetic" }[],
  isin: string,
  asOf: string,
): { close: number; date: string; source: "import" | "nordnet" | "synthetic" } | null {
  let best: { close: number; date: string; source: "import" | "nordnet" | "synthetic" } | null = null;
  for (const p of prices) {
    if (p.isin !== isin) continue;
    if (p.date > asOf) continue;
    if (!best || p.date > best.date) {
      best = { close: p.close, date: p.date, source: p.source ?? "import" };
    }
  }
  return best;
}

export function lookupFx(
  fx: { pair: string; date: string; rate: number; stale: boolean }[],
  pair: string,
  asOf: string,
): { rate: number; date: string; stale: boolean } | null {
  if (pair === "NOKNOK" || pair.startsWith("NOK")) return { rate: 1, date: asOf, stale: false };
  let best: { rate: number; date: string; stale: boolean } | null = null;
  for (const p of fx) {
    if (p.pair !== pair) continue;
    if (p.date > asOf) continue;
    if (!best || p.date > best.date) best = { rate: p.rate, date: p.date, stale: p.stale };
  }
  return best;
}
