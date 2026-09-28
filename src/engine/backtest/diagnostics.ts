import type { DiagTest } from "../diagnostics";
import { relativeError } from "../finance";
import { emptyLedgerBundle } from "../ledger/pipeline";
import { rsiWilder } from "../strategy/indicators";
import { DEFAULT_STRATEGY } from "../strategy/ast";
import { compile, tryCompile } from "../strategy/compile";
import { runBacktest } from "./engine";
import { resolveBacktestData, seriesFromCloses } from "./data";
import { buildDemoAssetSeries, buildDemoFx, demoCalendar, tradingDays } from "./demo-prices";
import { ZERO_COST_CONFIG } from "./types";
import type { AssetSeries, Bar, FxPoint } from "./types";

function t(id: string, group: string, name: string, pass: boolean, expected: string, actual: string): DiagTest {
  return { id, group, name, pass, expected, actual };
}

function nTrading(n: number, start = "2020-01-02"): string[] {
  const endMs = Date.parse(start + "T00:00:00Z") + Math.ceil(n * 1.8) * 86400000 + 20 * 86400000;
  const end = new Date(endMs).toISOString().slice(0, 10);
  const days = tradingDays(start, end);
  if (days.length < n) throw new Error(`need ${n} trading days, got ${days.length}`);
  return days.slice(0, n);
}

function nok(ticker: string, dates: string[], closes: number[]): AssetSeries {
  return seriesFromCloses(ticker, "NOK", dates, closes);
}

const BH = `universe [DNB]
rebalance daily
for each asset:
  target_weight 1
`;

const NEVER = `universe [DNB]
rebalance daily
for each asset:
  if sma(close, 5) < 0:
    target_weight 1 / count(signals)
  else:
    target_weight 0
`;

const SMA200 = `universe [DNB]
rebalance daily
for each asset:
  if sma(close, 200) > 0:
    target_weight 1
  else:
    target_weight 0
`;

const PREV = `universe [DNB]
rebalance daily
for each asset:
  if close[1] == 100:
    target_weight 1
  else:
    target_weight 0
`;

const NEG_OFFSET = `universe [DNB]
rebalance daily
for each asset:
  if close[-1] > 0:
    target_weight 1
  else:
    target_weight 0
`;

export function runStage5Diagnostics(): DiagTest[] {
  const tests: DiagTest[] = [];
  const groupA = "5a. Strategy language";
  const groupB = "5b. Execution";
  const groupC = "5c. Indicators";
  const groupD = "5d. Data honesty";

  const def = tryCompile(DEFAULT_STRATEGY);
  tests.push(
    t(
      "5a.default",
      groupA,
      "The example strategy parses, type-checks, and compiles",
      def.ok,
      "compile ok, universe MSFT KOG MOWI DNB, monthly",
      def.ok
        ? `${def.program.universe.map((u) => u.ticker).join(" ")} / ${def.program.rebalance}`
        : def.error.message,
    ),
  );

  const prevCompile = tryCompile(PREV);
  tests.push(
    t(
      "5a.history",
      groupA,
      "close[1] is the previous bar (Pine convention) and compiles",
      prevCompile.ok,
      "compile ok",
      prevCompile.ok ? "ok" : prevCompile.error.message,
    ),
  );

  const parseSrc = `universe [MSFT]\nrebalance monthly\nfor each asset:\n  @@oops\n`;
  const pe = tryCompile(parseSrc);
  const peOk = !pe.ok && pe.error.line === 4 && pe.error.col === 3 && pe.error.code === "parse";
  tests.push(
    t(
      "5a.parse-loc",
      groupA,
      "Parse errors report the correct line and column of the offending token",
      peOk,
      "parse error at line 4 column 3",
      pe.ok ? "compiled (should have failed)" : `${pe.error.code} line ${pe.error.line} col ${pe.error.col} — ${pe.error.message}`,
    ),
  );

  const neg = tryCompile(NEG_OFFSET);
  const negOk =
    !neg.ok &&
    neg.error.code === "parse" &&
    neg.error.line === 4 &&
    neg.error.col === 12 &&
    neg.error.message === "offsets look back in time; negative values are not allowed";
  tests.push(
    t(
      "5a.neg-offset",
      groupA,
      "close[-1] is a parse error at the minus — offsets look back; negative values are not allowed",
      negOk,
      "parse error line 4 col 12: offsets look back in time; negative values are not allowed",
      neg.ok
        ? "compiled (should have failed)"
        : `${neg.error.code} line ${neg.error.line} col ${neg.error.col}: ${neg.error.message}`,
    ),
  );

  const dates5 = ["2020-01-02", "2020-01-03", "2020-01-06", "2020-01-07", "2020-01-08"];
  const px5 = [100, 110, 105, 120, 130];
  const dnb5 = nok("DNB", dates5, px5);
  const bhProg = compile(BH);
  const bh = runBacktest(bhProg, [dnb5], [], ZERO_COST_CONFIG);
  const fillPx = px5[1]!;
  const lastPx = px5[px5.length - 1]!;
  const raw = lastPx / fillPx - 1;
  const bhRel = relativeError(bh.stats.totalReturn, raw);
  tests.push(
    t(
      "5b.buyhold",
      groupB,
      "Buy-and-hold with zero costs matches the raw price return from the fill close",
      bhRel < 1e-12,
      `totalReturn = ${raw.toFixed(12)}  (130/110 − 1)`,
      `totalReturn = ${bh.stats.totalReturn.toFixed(12)}  rel=${bhRel.toExponential(3)}`,
    ),
  );

  const first = bh.trades[0];
  const nextDay =
    first != null &&
    first.date === dates5[1] &&
    first.signalDate === dates5[0] &&
    first.priceNative === px5[1] &&
    first.priceNative !== px5[0];
  tests.push(
    t(
      "5b.nextday",
      groupB,
      "Signals at t close fill at the next trading day's price, never the signal close",
      nextDay,
      `fill ${dates5[1]} @ ${px5[1]} (signal ${dates5[0]} @ ${px5[0]})`,
      first
        ? `fill ${first.date} @ ${first.priceNative} (signal ${first.signalDate})`
        : "no trades",
    ),
  );

  const prevRun = prevCompile.ok
    ? runBacktest(prevCompile.program, [dnb5], [], ZERO_COST_CONFIG)
    : null;
  const prevTrade = prevRun?.trades[0];
  const prevOk =
    prevCompile.ok &&
    prevRun != null &&
    prevTrade != null &&
    prevTrade.signalDate === dates5[1] &&
    prevTrade.date === dates5[2] &&
    prevRun.lookback === 1;
  tests.push(
    t(
      "5a.prev-bar",
      groupA,
      "close[1] equals the previous close: signal fires on the bar after 100, fill the next session",
      Boolean(prevOk),
      `lookback 1, signal ${dates5[1]} (prev close 100), fill ${dates5[2]}`,
      prevTrade
        ? `lookback ${prevRun?.lookback}, signal ${prevTrade.signalDate}, fill ${prevTrade.date}`
        : `lookback ${prevRun?.lookback ?? "n/a"}, no trades${prevCompile.ok ? "" : ` (${prevCompile.error.message})`}`,
    ),
  );

  const neverProg = compile(NEVER);
  const neverSeries = nok(
    "DNB",
    nTrading(40),
    nTrading(40).map((_, i) => 100 + i),
  );
  const neverRes = runBacktest(neverProg, [neverSeries], [], ZERO_COST_CONFIG);
  const cashOnly =
    neverRes.trades.length === 0 &&
    neverRes.equity.length > 0 &&
    neverRes.equity.every((p) => Math.abs(p.value - ZERO_COST_CONFIG.initialCash) < 1e-6);
  tests.push(
    t(
      "5b.count0",
      groupB,
      "If count(signals) is 0 the book holds cash — never divides by zero, never trades",
      cashOnly,
      "0 trades, equity stays at initial cash",
      `${neverRes.trades.length} trades, start ${neverRes.equity[0]?.value} end ${neverRes.equity[neverRes.equity.length - 1]?.value}`,
    ),
  );

  const warmDates = nTrading(250);
  const warmPx = warmDates.map((_, i) => 100 + i * 0.25);
  const warmRes = runBacktest(compile(SMA200), [nok("DNB", warmDates, warmPx)], [], ZERO_COST_CONFIG);
  const signalIdx = 199;
  const fillIdx = 200;
  const warmOk =
    warmRes.stats.firstFillDate === warmDates[fillIdx] &&
    warmRes.trades[0]?.signalDate === warmDates[signalIdx] &&
    warmRes.trades.every((tr) => tr.date >= warmDates[fillIdx]!) &&
    warmRes.lookback === 199;
  tests.push(
    t(
      "5b.warmup",
      groupB,
      "sma(close, 200) is undefined until 200 prices exist — no trades before every indicator is defined",
      Boolean(warmOk),
      `lookback 199, first signal ${warmDates[signalIdx]}, first fill ${warmDates[fillIdx]}`,
      `lookback ${warmRes.lookback}, signal ${warmRes.trades[0]?.signalDate ?? "none"}, fill ${warmRes.stats.firstFillDate}`,
    ),
  );

  const usdDates = ["2020-01-02", "2020-01-03", "2020-01-06"];
  const usdBars: Bar[] = [
    { date: usdDates[0]!, open: 100, high: 100, low: 100, close: 100, volume: 0 },
    { date: usdDates[1]!, open: 100, high: 100, low: 100, close: 100, volume: 0 },
    { date: usdDates[2]!, open: 100, high: 100, low: 100, close: 100, volume: 0 },
  ];
  const usdFx: FxPoint[] = [
    { date: usdDates[0]!, usdNok: 10 },
    { date: usdDates[1]!, usdNok: 10 },
    { date: usdDates[2]!, usdNok: 20 },
  ];
  const usdRes = runBacktest(
    compile(`universe [MSFT]
rebalance daily
for each asset:
  target_weight 1
`),
    [{ ticker: "MSFT", currency: "USD", bars: usdBars }],
    usdFx,
    ZERO_COST_CONFIG,
  );
  const usdRet = usdRes.stats.totalReturn;
  const nokPath = 20 / 10 - 1;
  const usdPath = 100 / 100 - 1;
  const usdOk = relativeError(usdRet, nokPath) < 1e-12 && Math.abs(usdRet - usdPath) > 0.5;
  const usdFill = usdRes.trades[0];
  tests.push(
    t(
      "5b.fx",
      groupB,
      "USD names are converted to NOK on each date — a flat USD price with doubling FX doubles NOK wealth",
      Boolean(usdOk && usdFill && relativeError(usdFill.priceNok, 100 * 10) < 1e-12),
      `NOK return ${nokPath} (not USD return ${usdPath}), fill priceNok 1000`,
      `return ${usdRet}, fill priceNok ${usdFill?.priceNok ?? "none"}`,
    ),
  );

  const xs = [10, 11, 12, 11, 13];
  const rsiFirst = rsiWilder(xs.slice(0, 4), 3);
  const rsiLast = rsiWilder(xs, 3);
  const handFirst = 100 - 100 / (1 + 2);
  const handLast = 100 - 100 / (1 + 5);
  tests.push(
    t(
      "5c.rsi",
      groupC,
      "Wilder RSI on [10,11,12,11,13], period 3 matches the hand-computed series (66.666… then 83.333…)",
      rsiFirst != null &&
        rsiLast != null &&
        relativeError(rsiFirst, handFirst) < 1e-12 &&
        relativeError(rsiLast, handLast) < 1e-12,
      `first ${handFirst.toFixed(10)}, last ${handLast.toFixed(10)}`,
      `first ${rsiFirst?.toFixed(10)}, last ${rsiLast?.toFixed(10)}`,
    ),
  );

  let demoRun = false;
  let demoMsg = "";
  try {
    if (!def.ok) throw new Error(def.error.message);
    const series = buildDemoAssetSeries();
    const fx = buildDemoFx(demoCalendar());
    const r = runBacktest(def.program, series, fx, ZERO_COST_CONFIG);
    demoRun = r.equity.length > 400 && r.lookback === 199 && r.readyDate != null && r.stats.firstFillDate != null;
    demoMsg = `days ${r.equity.length}, lookback ${r.lookback}, ready ${r.readyDate}, fills ${r.stats.nTrades}`;
  } catch (e) {
    demoMsg = e instanceof Error ? e.message : String(e);
  }
  tests.push(
    t(
      "5b.demo",
      groupB,
      "The example strategy runs in Demo mode on seeded OHLC for MSFT, KOG, MOWI, DNB",
      demoRun,
      "equity length > 400, lookback 199, a first fill after SMA 200 is defined",
      demoMsg,
    ),
  );

  const miss = resolveBacktestData("mydata", ["MSFT", "KOG", "MOWI", "DNB"], emptyLedgerBundle());
  const missOk = !miss.ok && miss.missing.slice().sort().join(",") === "DNB,KOG,MOWI,MSFT";
  tests.push(
    t(
      "5d.missing",
      groupD,
      "My Data backtests refuse missing imported prices and list every absent ticker — never falling back to Demo",
      missOk,
      "missing DNB, KOG, MOWI, MSFT",
      miss.ok ? "resolved (should have failed)" : miss.missing.join(", "),
    ),
  );

  const demoResolve = resolveBacktestData("demo", ["MSFT", "KOG", "MOWI", "DNB"]);
  tests.push(
    t(
      "5d.demo-resolve",
      groupD,
      "Demo mode supplies OHLC for the four example tickers without using the ledger",
      demoResolve.ok && demoResolve.series.length === 4 && demoResolve.series.every((s) => s.bars.length > 1000),
      "4 series, >1000 bars each",
      demoResolve.ok ? demoResolve.series.map((s) => `${s.ticker}:${s.bars.length}`).join(" ") : demoResolve.message,
    ),
  );

  return tests;
}
