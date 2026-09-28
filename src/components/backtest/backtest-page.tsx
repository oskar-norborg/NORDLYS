import { useCallback, useEffect, useMemo, useState } from "react";
import { Panel, Field, TextInput } from "@/components/ui/field";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { UnderwaterChart } from "@/components/charts/underwater-chart";
import { StrategyEditor, ErrorBanner } from "./editor";
import { CandlestickChart } from "./candlestick";
import { useAppStore } from "@/store/app-store";
import { usePortfolioStore } from "@/store/portfolio-store";
import {
  DEFAULT_STRATEGY,
  PARAM_STRATEGY,
  tryCompile,
  type CompileError,
} from "@/engine/strategy";
import {
  DEFAULT_BACKTEST_CONFIG,
  linspace,
  resolveBacktestData,
  runBacktest,
  type BacktestConfig,
  type BacktestResult,
  type SweepResult,
  type WalkForwardResult,
} from "@/engine/backtest";
import { runSweepJob, runWalkForwardJob } from "@/engine/backtest/client";
import { drawdownFromNav } from "@/engine/risk-metrics";
import { formatMoney, formatPct } from "@/engine/format";
import { cn } from "@/lib/utils";

const STORE_KEY = "nordlys.backtest.v1";

interface Stored {
  source: string;
  costBps: number;
  slippageBps: number;
  cashYieldPct: number;
  ticker: string;
}

function loadStored(): Stored {
  const base: Stored = {
    source: DEFAULT_STRATEGY,
    costBps: DEFAULT_BACKTEST_CONFIG.costBps,
    slippageBps: DEFAULT_BACKTEST_CONFIG.slippageBps,
    cashYieldPct: DEFAULT_BACKTEST_CONFIG.cashYield * 100,
    ticker: "MSFT",
  };
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return base;
    const p = JSON.parse(raw) as Partial<Stored>;
    return {
      source: typeof p.source === "string" && p.source.length ? p.source : base.source,
      costBps: Number.isFinite(p.costBps) ? Number(p.costBps) : base.costBps,
      slippageBps: Number.isFinite(p.slippageBps) ? Number(p.slippageBps) : base.slippageBps,
      cashYieldPct: Number.isFinite(p.cashYieldPct) ? Number(p.cashYieldPct) : base.cashYieldPct,
      ticker: typeof p.ticker === "string" ? p.ticker : base.ticker,
    };
  } catch {
    return base;
  }
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 font-mono text-lg tabular-nums text-fg">{value}</div>
      {hint ? <div className="mt-1 text-xs text-subtle">{hint}</div> : null}
    </div>
  );
}

export function BacktestPage() {
  const mode = useAppStore((s) => s.mode);
  const privacy = useAppStore((s) => s.privacy);
  const demo = usePortfolioStore((s) => s.demo);
  const mydata = usePortfolioStore((s) => s.mydata);
  const ledger = mode === "demo" ? demo : mydata;

  const [source, setSource] = useState(DEFAULT_STRATEGY);
  const [costBps, setCostBps] = useState(DEFAULT_BACKTEST_CONFIG.costBps);
  const [slippageBps, setSlippageBps] = useState(DEFAULT_BACKTEST_CONFIG.slippageBps);
  const [cashYieldPct, setCashYieldPct] = useState(DEFAULT_BACKTEST_CONFIG.cashYield * 100);
  const [ticker, setTicker] = useState("MSFT");
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [busy, setBusy] = useState<"run" | "sweep" | "walk" | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number; label: string } | null>(null);
  const [sweep, setSweep] = useState<SweepResult | null>(null);
  const [walk, setWalk] = useState<WalkForwardResult | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [trainMonths, setTrainMonths] = useState(24);
  const [testMonths, setTestMonths] = useState(12);
  const [stepMonths, setStepMonths] = useState(12);

  useEffect(() => {
    const s = loadStored();
    setSource(s.source);
    setCostBps(s.costBps);
    setSlippageBps(s.slippageBps);
    setCashYieldPct(s.cashYieldPct);
    setTicker(s.ticker);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    const payload: Stored = { source, costBps, slippageBps, cashYieldPct, ticker };
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(payload));
    } catch {
      /* quota */
    }
  }, [hydrated, source, costBps, slippageBps, cashYieldPct, ticker]);

  const compiled = useMemo(() => tryCompile(source), [source]);
  const compileError: CompileError | null = compiled.ok ? null : compiled.error;

  const config: BacktestConfig = useMemo(
    () => ({
      costBps,
      slippageBps,
      cashYield: cashYieldPct / 100,
      initialCash: DEFAULT_BACKTEST_CONFIG.initialCash,
    }),
    [costBps, slippageBps, cashYieldPct],
  );

  const resolved = useMemo(() => {
    if (!compiled.ok) return null;
    return resolveBacktestData(
      mode,
      compiled.program.universe.map((u) => u.ticker),
      ledger,
    );
  }, [compiled, mode, ledger]);

  const run = useCallback(() => {
    if (!compiled.ok) {
      return;
    }
    const data = resolveBacktestData(
      mode,
      compiled.program.universe.map((u) => u.ticker),
      ledger,
    );
    if (!data.ok) {
      setResult(null);
      setMissing(data.missing);
      setRunError(data.message);
      return;
    }
    setMissing([]);
    setRunError(null);
    setBusy("run");
    try {
      const r = runBacktest(compiled.program, data.series, data.fx, config);
      setResult(r);
      if (!data.series.some((s) => s.ticker === ticker)) {
        setTicker(data.series[0]?.ticker ?? ticker);
      }
    } catch (e) {
      setRunError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }, [compiled, mode, ledger, config, ticker]);

  useEffect(() => {
    if (!hydrated) return;
    const handle = window.setTimeout(() => run(), 350);
    return () => window.clearTimeout(handle);
  }, [hydrated, run]);

  const paramGrid = useMemo(() => {
    if (!compiled.ok || !compiled.program.params.length) return {};
    const g: Record<string, number[]> = {};
    for (const p of compiled.program.params) {
      const v = p.value;
      if (/rsi/i.test(p.name)) g[p.name] = linspace(Math.max(10, v - 10), Math.min(90, v + 10), 10);
      else if (v >= 80) g[p.name] = linspace(Math.max(20, v - 50), v + 50, 50);
      else g[p.name] = linspace(Math.max(5, v - 20), v + 20, 20);
    }
    return g;
  }, [compiled]);

  const onSweep = async () => {
    if (!compiled.ok) return;
    if (!Object.keys(paramGrid).length) {
      setRunError("Declare param name = value in the strategy to sweep, or load the parameterized example.");
      return;
    }
    const data = resolveBacktestData(
      mode,
      compiled.program.universe.map((u) => u.ticker),
      ledger,
    );
    if (!data.ok) {
      setMissing(data.missing);
      setRunError(data.message);
      return;
    }
    setBusy("sweep");
    setProgress({ done: 0, total: 1, label: "sweep" });
    setRunError(null);
    try {
      const r = await runSweepJob(source, data.series, data.fx, config, paramGrid, (done, total) =>
        setProgress({ done, total, label: "sweep" }),
      );
      setSweep(r);
    } catch (e) {
      setRunError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
      setProgress(null);
    }
  };

  const onWalk = async () => {
    if (!compiled.ok) return;
    const data = resolveBacktestData(
      mode,
      compiled.program.universe.map((u) => u.ticker),
      ledger,
    );
    if (!data.ok) {
      setMissing(data.missing);
      setRunError(data.message);
      return;
    }
    setBusy("walk");
    setProgress({ done: 0, total: 1, label: "walk-forward" });
    setRunError(null);
    try {
      const r = await runWalkForwardJob(
        source,
        data.series,
        data.fx,
        config,
        {
          trainMonths,
          testMonths,
          stepMonths,
          grid: Object.keys(paramGrid).length ? paramGrid : undefined,
        },
        (done, total) => setProgress({ done, total, label: "walk-forward" }),
      );
      setWalk(r);
    } catch (e) {
      setRunError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
      setProgress(null);
    }
  };

  const dd = useMemo(
    () =>
      result
        ? drawdownFromNav(
            result.equity.map((p) => ({
              date: p.date,
              value: p.value,
              cash: p.cash,
              holdings: p.invested,
              externalCf: 0,
            })),
          )
        : null,
    [result],
  );
  const candleSeries = resolved?.ok ? (resolved.series.find((s) => s.ticker === ticker) ?? resolved.series[0] ?? null) : null;
  const universe = compiled.ok ? compiled.program.universe.map((u) => u.ticker) : [];

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <div className="kicker mb-2">Historical replay</div>
        <h1 className="text-2xl font-medium tracking-tight">Backtest</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Write a strategy. close is this bar; close[1] is the previous close. Signals use that day's close;
          orders fill at the next session. Demo prices are seeded OHLC for MSFT, KOG, MOWI and DNB. My Data uses
          only imported history.
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Panel
            kicker="Language"
            title="Strategy"
            action={
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="h-11 rounded-md border border-border px-3 text-xs"
                  onClick={() => setSource(DEFAULT_STRATEGY)}
                >
                  Example
                </button>
                <button
                  type="button"
                  className="h-11 rounded-md border border-border px-3 text-xs"
                  onClick={() => setSource(PARAM_STRATEGY)}
                >
                  With params
                </button>
              </div>
            }
          >
            <StrategyEditor value={source} onChange={setSource} error={compileError} />
            <div className="mt-3">
              <ErrorBanner error={compileError} />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              History: <span className="font-mono text-fg">close</span> is this bar,{" "}
              <span className="font-mono text-fg">close[1]</span> the previous close,{" "}
              <span className="font-mono text-fg">close[2]</span> two bars ago. Negative offsets are a parse
              error — the series cannot read the future.
            </p>
            {compiled.ok ? (
              <p className="mt-3 text-xs text-muted">
                Universe {compiled.program.universe.map((u) => u.ticker).join(", ")} · rebalance{" "}
                {compiled.program.rebalance}
                {compiled.program.params.length
                  ? ` · params ${compiled.program.params.map((p) => `${p.name}=${p.value}`).join(", ")}`
                  : ""}
              </p>
            ) : null}
          </Panel>

          <Panel kicker="Book" title="Equity vs equal-weight buy-and-hold">
            {result && result.equity.length > 1 ? (
              <PerformanceChart
                portfolio={result.equity}
                benchmark={result.benchmark}
                benchmarkLabel="Buy & hold"
                privacy={privacy}
                currency="NOK"
              />
            ) : (
              <p className="text-sm text-muted">{busy ? "Running…" : "No equity yet."}</p>
            )}
          </Panel>

          <Panel kicker="Risk" title="Drawdown">
            {dd && dd.underwater.length > 1 ? (
              <UnderwaterChart series={dd.underwater} />
            ) : (
              <p className="text-sm text-muted">Drawdown appears after a run.</p>
            )}
          </Panel>

          <Panel id="candles" kicker="Price" title="Candles with SMA 50 / 200">
            <CandlestickChart
              series={candleSeries}
              ticker={candleSeries?.ticker ?? ticker}
              onTicker={setTicker}
              tickers={universe}
            />
          </Panel>

          <Panel kicker="Fills" title="Trade list">
            {result && result.trades.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[40rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted">
                      <th className="px-2 py-2 font-medium">Fill</th>
                      <th className="px-2 py-2 font-medium">Signal</th>
                      <th className="px-2 py-2 font-medium">Ticker</th>
                      <th className="px-2 py-2 font-medium">Side</th>
                      <th className="px-2 py-2 font-medium">Native</th>
                      <th className="px-2 py-2 font-medium">NOK</th>
                      <th className="px-2 py-2 font-medium">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.trades.slice(0, 80).map((tr, i) => (
                      <tr key={`${tr.date}-${tr.ticker}-${i}`} className="border-b border-border last:border-0">
                        <td className="px-2 py-2 font-mono text-xs">{tr.date}</td>
                        <td className="px-2 py-2 font-mono text-xs text-muted">{tr.signalDate}</td>
                        <td className="px-2 py-2">{tr.ticker}</td>
                        <td className={cn("px-2 py-2", tr.side === "buy" ? "text-ok" : "text-danger")}>{tr.side}</td>
                        <td className="px-2 py-2 font-mono text-xs">{privacy ? "••••" : tr.priceNative.toFixed(2)}</td>
                        <td className="px-2 py-2 font-mono text-xs">{formatMoney(tr.valueNok, "NOK", privacy)}</td>
                        <td className="px-2 py-2 font-mono text-xs">{formatMoney(tr.costNok, "NOK", privacy)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.trades.length > 80 ? (
                  <p className="mt-2 text-xs text-subtle">{result.trades.length} fills — first 80 shown.</p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted">No fills. A cold SMA 200 needs 200 sessions before the first order.</p>
            )}
          </Panel>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
          <Panel kicker="Costs" title="Market frictions">
            <div className="flex flex-col gap-3">
              <Field label="Commission bp" hint="Round-trip is charged on each fill">
                <TextInput
                  type="number"
                  min={0}
                  step={1}
                  value={costBps}
                  onChange={(e) => setCostBps(Number(e.target.value))}
                />
              </Field>
              <Field label="Slippage bp">
                <TextInput
                  type="number"
                  min={0}
                  step={1}
                  value={slippageBps}
                  onChange={(e) => setSlippageBps(Number(e.target.value))}
                />
              </Field>
              <Field label="Cash yield %" hint="Annual, applied daily on uninvested cash">
                <TextInput
                  type="number"
                  min={0}
                  step={0.1}
                  value={cashYieldPct}
                  onChange={(e) => setCashYieldPct(Number(e.target.value))}
                />
              </Field>
            </div>
          </Panel>

          <Panel kicker="Run" title="Engine">
            {mode === "mydata" && missing.length ? (
              <p className="mb-3 text-sm text-danger">
                Missing imported prices: {missing.join(", ")}. Import a price/NAV file for each ticker. Demo series
                are never used here.
              </p>
            ) : null}
            {runError && !missing.length ? <p className="mb-3 text-sm text-danger">{runError}</p> : null}
            <button
              type="button"
              className="h-11 w-full rounded-md bg-accent text-sm font-medium text-accent-fg disabled:opacity-50"
              disabled={Boolean(compileError) || busy !== null}
              onClick={run}
            >
              {busy === "run" ? "Running…" : "Run backtest"}
            </button>
            {progress ? (
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-muted">
                  <span>{progress.label}</span>
                  <span className="font-mono">
                    {progress.done} / {progress.total}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${progress.total ? (100 * progress.done) / progress.total : 0}%` }}
                  />
                </div>
              </div>
            ) : null}
          </Panel>

          {result ? (
            <Panel kicker="Stage 3" title="Risk metrics">
              <div className="grid grid-cols-2 gap-2">
                <Metric label="Return" value={formatPct(result.stats.totalReturn, 1, true)} />
                <Metric label="Ann. return" value={formatPct(result.stats.annReturn, 1, true)} />
                <Metric label="Vol" value={formatPct(result.stats.vol, 1)} />
                <Metric label="Sharpe" value={result.stats.sharpe.toFixed(2)} />
                <Metric label="Sortino" value={result.stats.sortino.toFixed(2)} />
                <Metric label="Calmar" value={result.stats.calmar.toFixed(2)} />
                <Metric label="Max DD" value={formatPct(result.stats.maxDd, 1)} />
                <Metric label="VaR 95" value={formatPct(result.stats.var95, 2)} />
                <Metric label="ES 95" value={formatPct(result.stats.es95, 2)} />
                <Metric label="Trades" value={String(result.stats.nTrades)} />
              </div>
              {result.readyDate ? (
                <p className="mt-3 text-xs text-muted">
                  Indicators ready {result.readyDate}. First fill {result.stats.firstFillDate ?? "—"} at{" "}
                  {privacy ? "••••" : (result.stats.firstFillPrice?.toFixed(2) ?? "—")}{" "}
                  {result.stats.firstFillTicker ?? ""}.
                </p>
              ) : null}
            </Panel>
          ) : null}

          <Panel kicker="Workers" title="Parameter sweep">
            <p className="mb-3 text-xs text-muted">
              Runs the declared params on a small grid in Web Workers. Load “With params” if the example has none.
              Ranked on in-sample Sharpe (first 70% of the calendar). Out-of-sample is the later 30% with the same
              lookback so indicators are warm.
            </p>
            <button
              type="button"
              className="h-11 w-full rounded-md border border-border text-sm disabled:opacity-50"
              disabled={Boolean(compileError) || busy !== null}
              onClick={() => void onSweep()}
            >
              {busy === "sweep" ? "Sweeping…" : "Sweep parameters"}
            </button>
            {sweep?.best ? (
              <p className="mt-3 text-xs text-muted">
                Best in-sample Sharpe {sweep.best.sharpe.toFixed(2)} (out-of-sample{" "}
                {sweep.best.oosSharpe.toFixed(2)}) at{" "}
                {Object.entries(sweep.best.params)
                  .map(([k, v]) => `${k}=${v}`)
                  .join(", ") || "defaults"}
                .
              </p>
            ) : null}
            {sweep && sweep.points.length ? (
              <>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  A wide gap between in-sample and out-of-sample is a sign of overfitting — do not pick a parameter
                  set from in-sample alone.
                </p>
                <div className="mt-3 max-h-56 overflow-auto">
                  <table className="w-full min-w-[28rem] text-left text-xs">
                    <thead>
                      <tr className="text-muted">
                        <th className="py-1 font-medium">Params</th>
                        <th className="py-1 font-medium">IS Sh</th>
                        <th className="py-1 font-medium">OOS Sh</th>
                        <th className="py-1 font-medium">IS Ret</th>
                        <th className="py-1 font-medium">OOS Ret</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sweep.points.map((p, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="py-1 font-mono">
                            {Object.entries(p.params)
                              .map(([k, v]) => `${k}=${v}`)
                              .join(" ")}
                          </td>
                          <td className="py-1 font-mono">{p.sharpe.toFixed(2)}</td>
                          <td className="py-1 font-mono">{p.oosSharpe.toFixed(2)}</td>
                          <td className="py-1 font-mono">{formatPct(p.totalReturn, 0)}</td>
                          <td className="py-1 font-mono">{formatPct(p.oosReturn, 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : busy === "sweep" ? (
              <p className="mt-3 text-sm text-muted">Sweeping the grid…</p>
            ) : (
              <p className="mt-3 text-sm text-muted">No sweep yet. Run one to compare in-sample and out-of-sample.</p>
            )}
          </Panel>

          <Panel kicker="Workers" title="Walk-forward">
            <div className="mb-3 grid grid-cols-3 gap-2">
              <Field label="Train mo">
                <TextInput
                  type="number"
                  min={6}
                  value={trainMonths}
                  onChange={(e) => setTrainMonths(Number(e.target.value))}
                />
              </Field>
              <Field label="Test mo">
                <TextInput
                  type="number"
                  min={3}
                  value={testMonths}
                  onChange={(e) => setTestMonths(Number(e.target.value))}
                />
              </Field>
              <Field label="Step mo">
                <TextInput
                  type="number"
                  min={1}
                  value={stepMonths}
                  onChange={(e) => setStepMonths(Number(e.target.value))}
                />
              </Field>
            </div>
            <button
              type="button"
              className="h-11 w-full rounded-md border border-border text-sm disabled:opacity-50"
              disabled={Boolean(compileError) || busy !== null}
              onClick={() => void onWalk()}
            >
              {busy === "walk" ? "Walking…" : "Walk-forward"}
            </button>
            {walk && walk.folds.length ? (
              <div className="mt-3 max-h-56 overflow-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-muted">
                      <th className="py-1 font-medium">OOS</th>
                      <th className="py-1 font-medium">IS Sh</th>
                      <th className="py-1 font-medium">OOS Sh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {walk.folds.map((f) => (
                      <tr key={f.i} className="border-t border-border">
                        <td className="py-1 font-mono">
                          {f.testStart.slice(0, 7)}–{f.testEnd.slice(0, 7)}
                        </td>
                        <td className="py-1 font-mono">{f.isSharpe.toFixed(2)}</td>
                        <td className="py-1 font-mono">{f.oosSharpe.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : busy === "walk" ? (
              <p className="mt-3 text-sm text-muted">Walking the windows…</p>
            ) : (
              <p className="mt-3 text-sm text-muted">No walk-forward yet. Train, test and step set the window sizes.</p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
