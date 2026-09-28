export type AssetCcy = "NOK" | "USD";

export interface Bar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AssetSeries {
  ticker: string;
  currency: AssetCcy;
  bars: Bar[];
}

export interface FxPoint {
  date: string;
  usdNok: number;
}

export interface Trade {
  date: string;
  signalDate: string;
  ticker: string;
  side: "buy" | "sell";
  shares: number;
  priceNative: number;
  priceNok: number;
  valueNok: number;
  costNok: number;
}

export interface EquityPoint {
  date: string;
  value: number;
  cash: number;
  invested: number;
}

export interface WeightPoint {
  date: string;
  ticker: string;
  weight: number;
}

export interface BacktestStats {
  totalReturn: number;
  annReturn: number;
  vol: number;
  sharpe: number;
  sortino: number;
  calmar: number;
  maxDd: number;
  maxDdStart: string;
  maxDdTrough: string;
  var95: number;
  es95: number;
  nTrades: number;
  nDays: number;
  firstFillDate: string | null;
  firstFillPrice: number | null;
  firstFillTicker: string | null;
}

export interface BacktestResult {
  equity: EquityPoint[];
  benchmark: EquityPoint[];
  trades: Trade[];
  weights: WeightPoint[];
  stats: BacktestStats;
  universe: string[];
  lookback: number;
  readyDate: string | null;
}

export interface BacktestConfig {
  costBps: number;
  slippageBps: number;
  cashYield: number;
  initialCash: number;
  params?: Record<string, number>;
  /** No new signals before this ISO date. History before it is still visible to indicators. */
  tradeStartDate?: string;
  /** No new signals after this ISO date. A pending fill from the last signal may still execute. */
  tradeEndDate?: string;
}

export const DEFAULT_BACKTEST_CONFIG: BacktestConfig = {
  costBps: 5,
  slippageBps: 5,
  cashYield: 0.02,
  initialCash: 1_000_000,
};

export const ZERO_COST_CONFIG: BacktestConfig = {
  costBps: 0,
  slippageBps: 0,
  cashYield: 0,
  initialCash: 1_000_000,
};

export interface DataResolveOk {
  ok: true;
  series: AssetSeries[];
  fx: FxPoint[];
}

export interface DataResolveErr {
  ok: false;
  missing: string[];
  message: string;
}

export type DataResolve = DataResolveOk | DataResolveErr;

export interface SweepPoint {
  params: Record<string, number>;
  sharpe: number;
  totalReturn: number;
  maxDd: number;
  vol: number;
  nTrades: number;
  oosSharpe: number;
  oosReturn: number;
  oosMaxDd: number;
}

export interface SweepResult {
  points: SweepPoint[];
  best: SweepPoint | null;
}

export interface WalkFold {
  i: number;
  trainStart: string;
  trainEnd: string;
  testStart: string;
  testEnd: string;
  params: Record<string, number>;
  isSharpe: number;
  oosSharpe: number;
  oosReturn: number;
  oosMaxDd: number;
  nTrades: number;
}

export interface WalkForwardResult {
  folds: WalkFold[];
  combined: EquityPoint[];
}
