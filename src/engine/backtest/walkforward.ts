import type { Program } from "../strategy/ast";
import { requiredLookback } from "../strategy/checker";
import { runBacktest, trimResult } from "./engine";
import { cartesian, pointFromResult, pickBestParams } from "./sweep";
import { sliceFx, sliceSeries } from "./data";
import type {
  AssetSeries,
  BacktestConfig,
  EquityPoint,
  FxPoint,
  WalkFold,
  WalkForwardResult,
} from "./types";

function addMonths(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
}

function firstOnOrAfter(dates: string[], iso: string): number {
  for (let i = 0; i < dates.length; i++) if (dates[i]! >= iso) return i;
  return dates.length;
}

function lastOnOrBefore(dates: string[], iso: string): number {
  for (let i = dates.length - 1; i >= 0; i--) if (dates[i]! <= iso) return i;
  return -1;
}

export interface WalkForwardSpec {
  trainMonths: number;
  testMonths: number;
  stepMonths: number;
  grid?: Record<string, number[]>;
}

type Planned = Pick<WalkFold, "i" | "trainStart" | "trainEnd" | "testStart" | "testEnd">;

export function planFolds(dates: string[], lookback: number, spec: WalkForwardSpec): Planned[] {
  if (dates.length < lookback + 20) return [];
  const startDate = dates[lookback]!;
  const last = dates[dates.length - 1]!;
  const out: Planned[] = [];
  let cursor = startDate;
  let i = 0;
  while (true) {
    const trainStart = cursor;
    const trainEnd = addMonths(trainStart, spec.trainMonths);
    const testStart = trainEnd;
    const testEnd = addMonths(testStart, spec.testMonths);
    const t0 = firstOnOrAfter(dates, trainStart);
    const t1 = lastOnOrBefore(dates, trainEnd);
    const o0 = firstOnOrAfter(dates, testStart);
    const o1 = lastOnOrBefore(dates, testEnd);
    if (t1 - t0 < 10 || o1 - o0 < 5) break;
    if (dates[o1]! > last) break;
    out.push({
      i,
      trainStart: dates[t0]!,
      trainEnd: dates[t1]!,
      testStart: dates[o0]!,
      testEnd: dates[o1]!,
    });
    i += 1;
    cursor = addMonths(cursor, spec.stepMonths);
    if (addMonths(cursor, spec.trainMonths + spec.testMonths) > last) break;
    if (out.length > 40) break;
  }
  return out;
}

export function runWalkForward(
  program: Program,
  series: AssetSeries[],
  fx: FxPoint[],
  config: BacktestConfig,
  spec: WalkForwardSpec,
  onFold?: (done: number, total: number, fold: WalkFold) => void,
): WalkForwardResult {
  const dates = series[0]?.bars.map((b) => b.date) ?? [];
  const lookback = requiredLookback(program, {
    ...Object.fromEntries(program.params.map((p) => [p.name, p.value])),
    ...config.params,
  });
  const planned = planFolds(dates, lookback, spec);
  const folds: WalkFold[] = [];
  const combined: EquityPoint[] = [];
  let nav = config.initialCash;
  const grid = spec.grid ?? {};
  const sets = cartesian(grid);
  const total = Math.max(1, planned.length);

  for (let i = 0; i < planned.length; i++) {
    const p = planned[i]!;
    const trainSeries = sliceSeries(series, p.trainStart, p.trainEnd);
    const trainFx = sliceFx(fx, p.trainStart, p.trainEnd);
    let fitted: Record<string, number> = { ...(config.params ?? {}) };
    let isSharpe = 0;
    if (sets.length && Object.keys(grid).length) {
      const pts = sets.map((params) => {
        const r = runBacktest(program, trainSeries, trainFx, { ...config, params: { ...fitted, ...params } });
        return pointFromResult(params, r.stats);
      });
      fitted = { ...fitted, ...pickBestParams(pts) };
      isSharpe = pts.reduce((m, x) => Math.max(m, x.sharpe), -Infinity);
    } else {
      const r = runBacktest(program, trainSeries, trainFx, { ...config, params: fitted });
      isSharpe = r.stats.sharpe;
    }

    const histStart = dates[Math.max(0, dates.indexOf(p.testStart) - lookback)] ?? p.testStart;
    const oosSeries = sliceSeries(series, histStart, p.testEnd);
    const oosFx = sliceFx(fx, histStart, p.testEnd);
    const raw = runBacktest(program, oosSeries, oosFx, {
      ...config,
      params: fitted,
      tradeStartDate: p.testStart,
      tradeEndDate: p.testEnd,
    });
    const oos = trimResult(raw, p.testStart);
    const fold: WalkFold = {
      ...p,
      params: fitted,
      isSharpe,
      oosSharpe: oos.stats.sharpe,
      oosReturn: oos.stats.totalReturn,
      oosMaxDd: oos.stats.maxDd,
      nTrades: oos.stats.nTrades,
    };
    folds.push(fold);
    if (oos.equity.length) {
      const base = oos.equity[0]!.value || 1;
      for (const pt of oos.equity) {
        combined.push({
          date: pt.date,
          value: nav * (pt.value / base),
          cash: pt.cash,
          invested: pt.invested,
        });
      }
      const last = oos.equity[oos.equity.length - 1]!;
      nav = nav * (last.value / base);
    }
    onFold?.(i + 1, total, fold);
  }

  return { folds, combined };
}
