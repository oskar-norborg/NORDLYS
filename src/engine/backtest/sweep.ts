import type { Program } from "../strategy/ast";
import { runBacktest } from "./engine";
import type { AssetSeries, BacktestConfig, BacktestStats, FxPoint, SweepPoint, SweepResult } from "./types";

export function linspace(min: number, max: number, step: number): number[] {
  if (!(step > 0)) return [min];
  const out: number[] = [];
  const n = Math.round((max - min) / step);
  for (let i = 0; i <= n; i++) {
    const v = min + i * step;
    if (v > max + step * 0.25) break;
    out.push(Number(v.toFixed(8)));
  }
  if (!out.length) out.push(min);
  if (out[out.length - 1] !== max && max >= min) out.push(max);
  return out;
}

export function cartesian(grid: Record<string, number[]>): Record<string, number>[] {
  const keys = Object.keys(grid);
  if (!keys.length) return [{}];
  let acc: Record<string, number>[] = [{}];
  for (const k of keys) {
    const vals = grid[k] ?? [];
    const next: Record<string, number>[] = [];
    for (const row of acc) {
      for (const v of vals) next.push({ ...row, [k]: v });
    }
    acc = next;
  }
  return acc;
}

function withOos(params: Record<string, number>, is: BacktestStats, oos: BacktestStats): SweepPoint {
  return {
    params,
    sharpe: is.sharpe,
    totalReturn: is.totalReturn,
    maxDd: is.maxDd,
    vol: is.vol,
    nTrades: is.nTrades,
    oosSharpe: oos.sharpe,
    oosReturn: oos.totalReturn,
    oosMaxDd: oos.maxDd,
  };
}

export function pointFromResult(params: Record<string, number>, stats: BacktestStats): SweepPoint {
  return withOos(params, stats, stats);
}

/** Calendar split: first ~70% is in-sample; the rest is out-of-sample. */
export function calendarSplitDate(series: AssetSeries[], frac = 0.7): string | null {
  const dates = series[0]?.bars.map((b) => b.date) ?? [];
  if (dates.length < 30) return null;
  const i = Math.max(8, Math.min(dates.length - 8, Math.floor(dates.length * frac)));
  return dates[i] ?? null;
}

export function runSweep(
  program: Program,
  series: AssetSeries[],
  fx: FxPoint[],
  config: BacktestConfig,
  grid: Record<string, number[]>,
  onPoint?: (done: number, total: number, point: SweepPoint) => void,
): SweepResult {
  const sets = cartesian(grid);
  const points: SweepPoint[] = [];
  const total = Math.max(1, sets.length);
  const split = calendarSplitDate(series, 0.7);
  for (let i = 0; i < sets.length; i++) {
    const params = sets[i]!;
    const merged = { ...config, params: { ...config.params, ...params } };
    const isResult = runBacktest(program, series, fx, split ? { ...merged, tradeEndDate: split } : merged);
    const oosResult = split
      ? runBacktest(program, series, fx, { ...merged, tradeStartDate: split })
      : isResult;
    const point = withOos(params, isResult.stats, oosResult.stats);
    points.push(point);
    onPoint?.(i + 1, total, point);
  }
  let best: SweepPoint | null = null;
  for (const p of points) {
    if (!best || p.sharpe > best.sharpe) best = p;
  }
  return { points, best };
}

export function pickBestParams(points: SweepPoint[]): Record<string, number> {
  if (!points.length) return {};
  let best = points[0]!;
  for (const p of points) if (p.sharpe > best.sharpe) best = p;
  return { ...best.params };
}