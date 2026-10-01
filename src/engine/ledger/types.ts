/** Ledger, import, and holdings types. Stage 2 of NORDLYS. */

import type { AssetId } from "../types";

export type TxKind =
  | "buy"
  | "sell"
  | "dividend"
  | "withholding_tax"
  | "fee"
  | "interest"
  | "deposit"
  | "withdrawal"
  | "currency_exchange"
  | "split"
  | "other_corporate";

export const TX_KIND_LABELS: Record<TxKind, string> = {
  buy: "Buy",
  sell: "Sell",
  dividend: "Dividend",
  withholding_tax: "Withholding tax",
  fee: "Fee",
  interest: "Interest",
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  currency_exchange: "Currency exchange",
  split: "Split",
  other_corporate: "Corporate action",
};

export const TX_KINDS: TxKind[] = [
  "buy",
  "sell",
  "dividend",
  "withholding_tax",
  "fee",
  "interest",
  "deposit",
  "withdrawal",
  "currency_exchange",
  "split",
  "other_corporate",
];

export type CostMethod = "fifo" | "average";

export interface Security {
  isin: string;
  ticker: string;
  name: string;
  currency: string;
  exchange: string;
  assetClass: AssetId;
  /** Set once the user confirms or edits the auto-suggested class. */
  assetClassConfirmed?: boolean;
  /** Fields the user has edited — import must not overwrite these. */
  userSet?: {
    ticker?: boolean;
    name?: boolean;
    currency?: boolean;
    exchange?: boolean;
    assetClass?: boolean;
  };
}

export interface Transaction {
  id: string;
  nordnetId: string;
  fingerprint: string;
  bookingDate: string;
  tradeDate: string;
  settleDate: string;
  portfolio: string;
  kind: TxKind;
  rawType: string;
  name: string;
  isin: string;
  qty: number;
  price: number;
  priceCcy: string;
  interest: number;
  fees: number;
  feeCcy: string;
  amount: number;
  amountCcy: string;
  purchaseValue: number;
  purchaseCcy: string;
  result: number;
  resultCcy: string;
  fileQty: number | null;
  fileSaldo: number | null;
  fxRate: number;
  text: string;
  cancelDate: string;
  cancelled: boolean;
  noteNumber: string;
  verification: string;
  brokerage: number;
  valutakurs: number;
  sourceFile: string;
  rowNumber: number;
}

export interface PriceQuote {
  isin: string;
  date: string;
  close: number;
  source: "import" | "nordnet" | "synthetic";
}

export interface BenchmarkQuote {
  id: string;
  date: string;
  value: number;
  source: "import" | "synthetic";
}

export interface FxQuote {
  pair: string;
  date: string;
  rate: number;
  source: "import" | "nordnet" | "synthetic";
  stale: boolean;
}

export interface NordnetRow {
  rowNumber: number;
  cells: string[];
  id: string;
  bookingDate: string;
  tradeDate: string;
  settleDate: string;
  portfolio: string;
  rawType: string;
  name: string;
  isin: string;
  qty: number;
  price: number;
  interest: number;
  totalFees: number;
  feeCcy: string;
  amount: number;
  amountCcy: string;
  purchaseValue: number;
  purchaseCcy: string;
  result: number;
  resultCcy: string;
  totalQty: number | null;
  saldo: number | null;
  fxRate: number;
  text: string;
  cancelDate: string;
  noteNumber: string;
  verification: string;
  brokerage: number;
  brokerageCcy: string;
  valutakurs: number;
  initialInterest: number;
}

export interface ParseMeta {
  encoding: string;
  delimiter: string;
  lineEnding: "crlf" | "lf" | "cr" | "mixed";
  headerCount: number;
  positional: boolean;
  headers: string[];
}

export interface SkipRecord {
  rowNumber: number;
  reason: string;
  detail: string;
}

export interface ReviewItem {
  id: string;
  rowNumber: number;
  rawType: string;
  name: string;
  isin: string;
  date: string;
  amount: number;
  sample: string[];
}

export interface ReconIssue {
  rowNumber: number;
  nordnetId: string;
  field: "saldo" | "qty";
  expected: number;
  reported: number;
  delta: number;
  level: "error" | "info";
}

export interface ReconResult {
  issues: ReconIssue[];
  saldoErrors: number;
  qtyErrors: number;
  qtyRounding: number;
  openingSaldo: number;
  closingSaldo: number;
}

export interface ImportReport {
  fileName: string;
  encoding: string;
  delimiter: string;
  positional: boolean;
  rowsRead: number;
  transactionsCreated: number;
  duplicatesSkipped: number;
  cancelledExcluded: number;
  emptySkipped: number;
  reviewCount: number;
  skipped: SkipRecord[];
  review: ReviewItem[];
  recon: ReconResult;
  cancelled: { rowNumber: number; nordnetId: string; date: string; rawType: string; name: string }[];
}

export interface LedgerBundle {
  accountCurrency: "NOK";
  transactions: Transaction[];
  securities: Security[];
  prices: PriceQuote[];
  fx: FxQuote[];
  benchmarks: BenchmarkQuote[];
}

export interface Lot {
  isin: string;
  qty: number;
  unitPrice: number;
  fx: number;
  date: string;
  feesNok: number;
}

export interface Holding {
  isin: string;
  security: Security;
  qty: number;
  unitCostNative: number;
  avgFx: number;
  costNok: number;
  price: number;
  priceDate: string;
  priceStale: boolean;
  priceSource: "import" | "nordnet" | "synthetic" | "last_trade";
  fx: number;
  fxStale: boolean;
  marketNative: number;
  marketNok: number;
  unrealizedNok: number;
  priceEffect: number;
  currencyEffect: number;
  feeEffect: number;
  weight: number;
  asOf: string;
}

export interface RealizedPnL {
  isin: string;
  name: string;
  qty: number;
  realizedNok: number;
  priceEffect: number;
  currencyEffect: number;
  feeEffect: number;
}

export interface HoldingsResult {
  method: CostMethod;
  asOf: string;
  cash: number;
  holdings: Holding[];
  realized: RealizedPnL[];
  totalMarket: number;
  totalCost: number;
  totalUnrealized: number;
  totalPriceEffect: number;
  totalCurrencyEffect: number;
  totalFeeEffect: number;
  totalRealized: number;
  allocation: { assetClass: AssetId; value: number; weight: number }[];
}

export interface Cashflow {
  date: string;
  amount: number;
  kind: "external" | "value";
  note: string;
}

export interface NavPoint {
  date: string;
  value: number;
  cash: number;
  holdings: number;
  externalCf: number;
}

export interface ReturnStats {
  twr: number;
  xirr: number;
  startDate: string;
  endDate: string;
  startValue: number;
  endValue: number;
  nav: NavPoint[];
}

export interface RebalanceTrade {
  isin: string;
  name: string;
  ticker: string;
  assetClass: AssetId;
  side: "buy" | "sell";
  shares: number;
  price: number;
  valueNok: number;
}

export interface GapRow {
  assetClass: AssetId;
  current: number;
  currentWeight: number;
  targetWeight: number;
  target: number;
  gap: number;
}

export interface GapAnalysis {
  total: number;
  asOf: string;
  modelName: string;
  rows: GapRow[];
  trades: RebalanceTrade[];
  residualCash: number;
}

export const NORDNET_COL = {
  id: 0,
  bookingDate: 1,
  tradeDate: 2,
  settleDate: 3,
  portfolio: 4,
  type: 5,
  security: 6,
  isin: 7,
  qty: 8,
  price: 9,
  interest: 10,
  totalFees: 11,
  feeCcy: 12,
  amount: 13,
  amountCcy: 14,
  purchaseValue: 15,
  purchaseCcy: 16,
  result: 17,
  resultCcy: 18,
  totalQty: 19,
  saldo: 20,
  fxRate: 21,
  text: 22,
  cancelDate: 23,
  noteNumber: 24,
  verification: 25,
  brokerage: 26,
  brokerageCcy: 27,
  valutakurs: 28,
  initialInterest: 29,
} as const;

export const NORDNET_COL_COUNT = 30;

export const NORDNET_HEADERS_NB = [
  "Id",
  "Bokføringsdag",
  "Handelsdag",
  "Oppgjørsdag",
  "Portefølje",
  "Transaksjonstype",
  "Verdipapir",
  "ISIN",
  "Antall",
  "Kurs",
  "Rente",
  "Totale Avgifter",
  "Valuta",
  "Beløp",
  "Valuta",
  "Kjøpsverdi",
  "Valuta",
  "Resultat",
  "Valuta",
  "Totalt antall",
  "Saldo",
  "Vekslingskurs",
  "Transaksjonstekst",
  "Makuleringsdato",
  "Sluttseddelnummer",
  "Verifikationsnummer",
  "Kurtasje",
  "Valuta",
  "Valutakurs",
  "Innledende rente",
] as const;

export const QTY_ROUND_EPS = 0.0001;
export const MONEY_EPS = 0.005;
