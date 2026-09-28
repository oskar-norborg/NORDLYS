import type { Expr, Program, Stmt } from "../strategy/ast";
import { CompileError } from "../strategy/errors";
import { requiredLookback } from "../strategy/checker";
import { ema, momentum, rsiWilder, sma, stdev } from "../strategy/indicators";
import {
  drawdownFromNav,
  historicalVarEs,
  ratiosFromReturns,
  simpleReturns,
} from "../risk-metrics";
import type {
  AssetSeries,
  BacktestConfig,
  BacktestResult,
  BacktestStats,
  Bar,
  EquityPoint,
  FxPoint,
  Trade,
  WeightPoint,
} from "./types";
import { DEFAULT_BACKTEST_CONFIG } from "./types";

type Val =
  | { k: "num"; v: number }
  | { k: "bool"; v: boolean }
  | { k: "series"; field: "close" | "open" | "high" | "low" | "volume" }
  | { k: "signals" }
  | { k: "undef" };

interface EvalCtx {
  bars: Bar[];
  signalCount: number;
  params: Record<string, number>;
}

function fieldArr(bars: Bar[], field: "close" | "open" | "high" | "low" | "volume"): number[] {
  const out = new Array<number>(bars.length);
  for (let i = 0; i < bars.length; i++) out[i] = bars[i]![field];
  return out;
}

function asNum(v: Val, bars: Bar[]): Val {
  if (v.k === "series") {
    if (!bars.length) return { k: "undef" };
    return { k: "num", v: bars[bars.length - 1]![v.field] };
  }
  return v;
}

function evalExpr(expr: Expr, ctx: EvalCtx): Val {
  switch (expr.kind) {
    case "num":
      return { k: "num", v: expr.value };
    case "id": {
      if (expr.name === "signals") return { k: "signals" };
      if (expr.name === "close" || expr.name === "open" || expr.name === "high" || expr.name === "low" || expr.name === "volume") {
        return { k: "series", field: expr.name };
      }
      if (ctx.params[expr.name] != null) return { k: "num", v: ctx.params[expr.name]! };
      return { k: "undef" };
    }
    case "index": {
      const obj = evalExpr(expr.object, ctx);
      const idxV = asNum(evalExpr(expr.index, ctx), ctx.bars);
      if (obj.k !== "series" || idxV.k !== "num") return { k: "undef" };
      const off = Math.trunc(idxV.v);
      if (off < 0) {
        throw new CompileError(
          "offsets look back in time; negative values are not allowed",
          expr.index.span.line,
          expr.index.span.col,
          expr.index.span.endCol,
        );
      }
      const arr = fieldArr(ctx.bars, obj.field);
      const i = arr.length - 1 - off;
      if (i < 0 || i >= arr.length) return { k: "undef" };
      return { k: "num", v: arr[i]! };
    }
    case "call": {
      if (expr.name === "count") {
        return { k: "num", v: ctx.signalCount };
      }
      const a0 = evalExpr(expr.args[0]!, ctx);
      const a1 = asNum(evalExpr(expr.args[1]!, ctx), ctx.bars);
      if (a0.k !== "series" || a1.k !== "num") return { k: "undef" };
      const period = Math.trunc(a1.v);
      const xs = fieldArr(ctx.bars, a0.field);
      let v: number | undefined;
      if (expr.name === "sma") v = sma(xs, period);
      else if (expr.name === "ema") v = ema(xs, period);
      else if (expr.name === "rsi") v = rsiWilder(xs, period);
      else if (expr.name === "stdev") v = stdev(xs, period);
      else if (expr.name === "momentum") v = momentum(xs, period);
      if (v == null || !Number.isFinite(v)) return { k: "undef" };
      return { k: "num", v };
    }
    case "un": {
      const inner = asNum(evalExpr(expr.expr, ctx), ctx.bars);
      if (expr.op === "not") {
        if (inner.k === "undef") return { k: "undef" };
        if (inner.k !== "bool") return { k: "undef" };
        return { k: "bool", v: !inner.v };
      }
      if (inner.k === "undef") return { k: "undef" };
      if (inner.k !== "num") return { k: "undef" };
      return { k: "num", v: -inner.v };
    }
    case "bin": {
      if (expr.op === "and" || expr.op === "or") {
        const l = asNum(evalExpr(expr.left, ctx), ctx.bars);
        if (l.k === "undef") return { k: "undef" };
        if (l.k !== "bool") return { k: "undef" };
        if (expr.op === "and" && !l.v) return { k: "bool", v: false };
        if (expr.op === "or" && l.v) return { k: "bool", v: true };
        const r = asNum(evalExpr(expr.right, ctx), ctx.bars);
        if (r.k === "undef") return { k: "undef" };
        if (r.k !== "bool") return { k: "undef" };
        return { k: "bool", v: expr.op === "and" ? l.v && r.v : l.v || r.v };
      }
      const l = asNum(evalExpr(expr.left, ctx), ctx.bars);
      const r = asNum(evalExpr(expr.right, ctx), ctx.bars);
      if (l.k === "undef" || r.k === "undef") return { k: "undef" };
      if (l.k !== "num" || r.k !== "num") return { k: "undef" };
      const a = l.v;
      const b = r.v;
      switch (expr.op) {
        case "+":
          return { k: "num", v: a + b };
        case "-":
          return { k: "num", v: a - b };
        case "*":
          return { k: "num", v: a * b };
        case "/":
          if (b === 0) return { k: "num", v: 0 };
          return { k: "num", v: a / b };
        case ">":
          return { k: "bool", v: a > b };
        case "<":
          return { k: "bool", v: a < b };
        case ">=":
          return { k: "bool", v: a >= b };
        case "<=":
          return { k: "bool", v: a <= b };
        case "==":
          return { k: "bool", v: a === b };
        case "!=":
          return { k: "bool", v: a !== b };
        default:
          return { k: "undef" };
      }
    }
    default:
      return { k: "undef" };
  }
}

function evalCond(expr: Expr, ctx: EvalCtx): boolean | undefined {
  const v = asNum(evalExpr(expr, ctx), ctx.bars);
  if (v.k === "undef") return undefined;
  if (v.k === "bool") return v.v;
  return undefined;
}

function execStmts(stmts: Stmt[], ctx: EvalCtx): number {
  let w = 0;
  for (const s of stmts) {
    if (s.kind === "if") {
      const c = evalCond(s.cond, ctx);
      if (c == null) return Number.NaN;
      if (c) w = execStmts(s.then, ctx);
      else if (s.else) w = execStmts(s.else, ctx);
      else w = 0;
    } else if (s.kind === "target" || s.kind === "rebalance_to") {
      const v = asNum(evalExpr(s.expr, ctx), ctx.bars);
      if (v.k !== "num" || !Number.isFinite(v.v)) return Number.NaN;
      w = v.v;
    } else if (s.kind === "exit") {
      w = 0;
    }
  }
  return w;
}

function signalCond(body: Stmt[]): Expr | null {
  const first = body[0];
  if (first && first.kind === "if") return first.cond;
  return null;
}

function isRebalanceBar(i: number, dates: string[], freq: Program["rebalance"]): boolean {
  if (freq === "daily") return true;
  if (i >= dates.length - 1) return true;
  const a = dates[i]!;
  const b = dates[i + 1]!;
  if (freq === "monthly") return a.slice(0, 7) !== b.slice(0, 7);
  const da = new Date(a + "T00:00:00Z").getUTCDay();
  const db = new Date(b + "T00:00:00Z").getUTCDay();
  return db <= da || db === 1;
}

function fxOn(date: string, fx: FxPoint[], cache: Map<string, number>): number {
  const hit = cache.get(date);
  if (hit != null) return hit;
  let rate = 1;
  for (let i = fx.length - 1; i >= 0; i--) {
    if (fx[i]!.date <= date) {
      rate = fx[i]!.usdNok;
      break;
    }
  }
  cache.set(date, rate);
  return rate;
}

function pxNok(bar: Bar, ccy: AssetSeries["currency"], date: string, fx: FxPoint[], cache: Map<string, number>): number {
  if (ccy === "NOK") return bar.close;
  return bar.close * fxOn(date, fx, cache);
}

function align(series: AssetSeries[]): { dates: string[]; byTicker: Map<string, Map<string, Bar>> } {
  const sets = series.map((s) => new Set(s.bars.map((b) => b.date)));
  const all = series[0] ? series[0].bars.map((b) => b.date).filter((d) => sets.every((st) => st.has(d))) : [];
  const byTicker = new Map<string, Map<string, Bar>>();
  for (const s of series) {
    const m = new Map<string, Bar>();
    for (const b of s.bars) m.set(b.date, b);
    byTicker.set(s.ticker, m);
  }
  return { dates: all, byTicker };
}

export function statsFromEquity(equity: EquityPoint[], trades: Trade[], bench: EquityPoint[]): BacktestStats {
  const nav = equity.map((p) => ({
    date: p.date,
    value: p.value,
    cash: p.cash,
    holdings: p.invested,
    externalCf: 0,
  }));
  const dd = drawdownFromNav(nav);
  const rets = simpleReturns(equity.map((p) => p.value));
  const bR = simpleReturns(bench.map((p) => p.value));
  const aligned = bR.length === rets.length ? bR : undefined;
  const ratios = rets.length > 2 ? ratiosFromReturns(rets, 0.02, dd.maxDd, 252, aligned) : null;
  const varEs = rets.length ? historicalVarEs(rets, 0.95) : { var: 0, es: 0, method: "historical" as const, alpha: 0.95 };
  const start = equity[0]?.value || 1;
  const end = equity[equity.length - 1]?.value || start;
  const first = trades[0];
  return {
    totalReturn: start > 0 ? end / start - 1 : 0,
    annReturn: ratios?.mean ?? 0,
    vol: ratios?.vol ?? 0,
    sharpe: ratios?.sharpe ?? 0,
    sortino: ratios?.sortino ?? 0,
    calmar: ratios?.calmar ?? 0,
    maxDd: dd.maxDd,
    maxDdStart: dd.maxDdStart,
    maxDdTrough: dd.maxDdTrough,
    var95: varEs.var,
    es95: varEs.es,
    nTrades: trades.length,
    nDays: equity.length,
    firstFillDate: first?.date ?? null,
    firstFillPrice: first?.priceNative ?? null,
    firstFillTicker: first?.ticker ?? null,
  };
}

const EMPTY_STATS: BacktestStats = statsFromEquity([], [], []);

export function trimResult(result: BacktestResult, fromDate: string): BacktestResult {
  const equity = result.equity.filter((p) => p.date >= fromDate);
  const benchmark = result.benchmark.filter((p) => p.date >= fromDate);
  const trades = result.trades.filter((t) => t.date >= fromDate);
  const weights = result.weights.filter((w) => w.date >= fromDate);
  return {
    ...result,
    equity,
    benchmark,
    trades,
    weights,
    stats: statsFromEquity(equity, trades, benchmark),
  };
}

export function runBacktest(
  program: Program,
  series: AssetSeries[],
  fx: FxPoint[],
  config: BacktestConfig = DEFAULT_BACKTEST_CONFIG,
): BacktestResult {
  const params: Record<string, number> = {};
  for (const p of program.params) params[p.name] = config.params?.[p.name] ?? p.value;
  if (config.params) Object.assign(params, config.params);

  const wanted = program.universe.map((u) => u.ticker);
  const used = wanted.map((t) => {
    const s = series.find((x) => x.ticker === t);
    if (!s) throw new Error(`Missing price series for ${t}`);
    return s;
  });
  const { dates, byTicker } = align(used);
  const lookback = requiredLookback(program, params);
  const empty: BacktestResult = {
    equity: [],
    benchmark: [],
    trades: [],
    weights: [],
    stats: EMPTY_STATS,
    universe: wanted,
    lookback,
    readyDate: null,
  };
  if (!dates.length) return empty;

  const cost = (config.costBps + config.slippageBps) / 10_000;
  const dailyCash = config.cashYield / 252;
  const fxCache = new Map<string, number>();

  const shares: Record<string, number> = {};
  for (const t of wanted) shares[t] = 0;
  let cash = config.initialCash;
  const trades: Trade[] = [];
  const equity: EquityPoint[] = [];
  const weights: WeightPoint[] = [];
  const benchHold: Record<string, number> = {};
  let benchCash = config.initialCash;
  let benchInit = false;

  let pending: { weights: Record<string, number>; signalDate: string } | null = null;
  let readyDate: string | null = null;

  const prefix = (ticker: string, i: number): Bar[] => {
    const m = byTicker.get(ticker)!;
    const out: Bar[] = [];
    for (let k = 0; k <= i; k++) {
      const b = m.get(dates[k]!);
      if (b) out.push(b);
    }
    return out;
  };

  const mtm = (i: number): { invested: number; value: number } => {
    const date = dates[i]!;
    let invested = 0;
    for (const s of used) {
      const b = byTicker.get(s.ticker)!.get(date)!;
      invested += (shares[s.ticker] ?? 0) * pxNok(b, s.currency, date, fx, fxCache);
    }
    return { invested, value: cash + invested };
  };

  const fill = (target: Record<string, number>, signalDate: string, i: number): void => {
    const date = dates[i]!;
    const { value } = mtm(i);
    if (!(value > 0)) return;
    const raw: Record<string, number> = {};
    let sumW = 0;
    for (const t of wanted) {
      const w = Math.max(0, target[t] ?? 0);
      raw[t] = w;
      sumW += w;
    }
    if (sumW > 1) {
      for (const t of wanted) raw[t] = (raw[t] ?? 0) / sumW;
      sumW = 1;
    }
    for (const s of used) {
      const b = byTicker.get(s.ticker)!.get(date)!;
      const p = pxNok(b, s.currency, date, fx, fxCache);
      if (!(p > 0)) continue;
      const tgtVal = (raw[s.ticker] ?? 0) * value;
      const curVal = (shares[s.ticker] ?? 0) * p;
      const deltaVal = tgtVal - curVal;
      if (Math.abs(deltaVal) < 1) continue;
      const deltaShares = deltaVal / p;
      const notional = Math.abs(deltaShares) * p;
      const fee = notional * cost;
      const side: "buy" | "sell" = deltaShares > 0 ? "buy" : "sell";
      if (side === "buy" && cash < notional + fee) {
        const afford = Math.max(0, cash - fee);
        if (afford < 1) continue;
        const sh = afford / p;
        shares[s.ticker] = (shares[s.ticker] ?? 0) + sh;
        cash -= sh * p + fee;
        trades.push({
          date,
          signalDate,
          ticker: s.ticker,
          side,
          shares: sh,
          priceNative: b.close,
          priceNok: p,
          valueNok: sh * p,
          costNok: fee,
        });
        continue;
      }
      shares[s.ticker] = (shares[s.ticker] ?? 0) + deltaShares;
      cash -= deltaShares * p + fee;
      trades.push({
        date,
        signalDate,
        ticker: s.ticker,
        side,
        shares: Math.abs(deltaShares),
        priceNative: b.close,
        priceNok: p,
        valueNok: notional,
        costNok: fee,
      });
    }
  };

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i]!;
    if (pending) {
      fill(pending.weights, pending.signalDate, i);
      pending = null;
    }
    cash *= 1 + dailyCash;
    if (!benchInit && i > 0) {
      const n = used.length;
      const slice = config.initialCash / n;
      for (const s of used) {
        const b = byTicker.get(s.ticker)!.get(date)!;
        const p = pxNok(b, s.currency, date, fx, fxCache);
        benchHold[s.ticker] = p > 0 ? slice / p : 0;
      }
      benchCash = 0;
      benchInit = true;
    }

    const { invested, value } = mtm(i);
    equity.push({ date, value, cash, invested });
    if (value > 0) {
      for (const t of wanted) {
        const b = byTicker.get(t)!.get(date)!;
        const s = used.find((x) => x.ticker === t)!;
        const w = ((shares[t] ?? 0) * pxNok(b, s.currency, date, fx, fxCache)) / value;
        weights.push({ date, ticker: t, weight: w });
      }
    }

    if (!isRebalanceBar(i, dates, program.rebalance)) continue;
    if (i < lookback) continue;
    if (config.tradeStartDate && date < config.tradeStartDate) continue;
    if (config.tradeEndDate && date > config.tradeEndDate) continue;

    const cond = signalCond(program.body);
    const signals: Record<string, boolean> = {};
    let ready = true;
    for (const t of wanted) {
      const bars = prefix(t, i);
      if (bars.length < lookback + 1) {
        ready = false;
        break;
      }
      const ctx: EvalCtx = { bars, signalCount: 0, params };
      if (cond) {
        const c = evalCond(cond, ctx);
        if (c == null) {
          ready = false;
          break;
        }
        signals[t] = c;
      } else {
        signals[t] = true;
      }
    }
    if (!ready) continue;
    if (!readyDate) readyDate = date;
    const nSig = wanted.reduce((n, t) => n + (signals[t] ? 1 : 0), 0);
    const tw: Record<string, number> = {};
    if (nSig === 0) {
      for (const t of wanted) tw[t] = 0;
    } else {
      for (const t of wanted) {
        const ctx: EvalCtx = { bars: prefix(t, i), signalCount: nSig, params };
        const w = execStmts(program.body, ctx);
        tw[t] = Number.isFinite(w) ? Math.max(0, w) : 0;
      }
    }
    pending = { weights: tw, signalDate: date };
  }

  const bench: EquityPoint[] = [];
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i]!;
    if (i === 0) {
      bench.push({ date, value: config.initialCash, cash: config.initialCash, invested: 0 });
      continue;
    }
    let invested = 0;
    for (const s of used) {
      const b = byTicker.get(s.ticker)!.get(date)!;
      invested += (benchHold[s.ticker] ?? 0) * pxNok(b, s.currency, date, fx, fxCache);
    }
    bench.push({ date, value: benchCash + invested, cash: benchCash, invested });
  }

  return {
    equity,
    benchmark: bench,
    trades,
    weights,
    stats: statsFromEquity(equity, trades, bench),
    universe: wanted,
    lookback,
    readyDate,
  };
}

export function packSeries(series: AssetSeries[]): AssetSeries[] {
  return series.map((s) => ({ ticker: s.ticker, currency: s.currency, bars: s.bars }));
}
