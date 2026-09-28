import { useMemo, useState } from "react";
import { Panel, Field, SelectInput, SliderRow } from "@/components/ui/field";
import { HeatmapChart } from "@/components/charts/heatmap-chart";
import { UnderwaterChart } from "@/components/charts/underwater-chart";
import { FrontierChart } from "@/components/charts/frontier-chart";
import { useAppStore } from "@/store/app-store";
import { usePortfolioStore } from "@/store/portfolio-store";
import { computeHoldings } from "@/engine/ledger/holdings";
import { computeReturns } from "@/engine/ledger/returns";
import { DEMO_AS_OF } from "@/engine/ledger/synthetic";
import { storedBenchmarkSeries } from "@/engine/ledger/benchmarks";
import { historicalRiskAvailable, holdingsWithoutImportedHistory } from "@/engine/ledger/prices";
import {
  classReturnFrame,
  computeVarEs,
  drawdownFromNav,
  holdingReturnFrame,
  ratiosFromReturns,
  riskContributions,
  simpleReturns,
  stressHoldings,
  type VarMethod,
} from "@/engine/risk-metrics";
import {
  corrFromCov,
  covFromVolCorr,
  estimateCovariance,
  type CovMethod,
} from "@/engine/cov";
import {
  blackLitterman,
  defaultConstraints,
  efficientFrontier,
  modelBooks,
  riskParity,
  type BlView,
} from "@/engine/optimize";
import { ASSET_IDS, ASSET_LABELS, ASSET_SHORT } from "@/engine/types";
import { formatMoney, formatPct } from "@/engine/format";
import { cn } from "@/lib/utils";

function asOf(): string {
  return new Date().toISOString().slice(0, 10);
}

const VAR_METHODS: { id: VarMethod; label: string }[] = [
  { id: "historical", label: "Historical" },
  { id: "normal", label: "Parametric normal" },
  { id: "cornish", label: "Cornish–Fisher" },
  { id: "montecarlo", label: "Monte Carlo" },
];

export function RiskPage() {
  const mode = useAppStore((s) => s.mode);
  const privacy = useAppStore((s) => s.privacy);
  const cma = useAppStore((s) => s.cma);
  const demo = usePortfolioStore((s) => s.demo);
  const mydata = usePortfolioStore((s) => s.mydata);
  const costMethod = usePortfolioStore((s) => s.costMethod);
  const benchmarkId = usePortfolioStore((s) => s.benchmarkId);
  const ledger = mode === "demo" ? demo : mydata;
  const date = mode === "demo" ? DEMO_AS_OF : asOf();

  const [covMethod, setCovMethod] = useState<CovMethod>("ledoit");
  const [lambda, setLambda] = useState(0.94);
  const [varMethod, setVarMethod] = useState<VarMethod>("historical");
  const [alpha, setAlpha] = useState(0.95);
  const [frontierIdx, setFrontierIdx] = useState(25);
  const [blAsset, setBlAsset] = useState(0);
  const [blMu, setBlMu] = useState(0.1);
  const [blConf, setBlConf] = useState(0.5);
  const [views, setViews] = useState<BlView[]>([]);
  const [assetShocks, setAssetShocks] = useState<Record<string, number>>(() =>
    Object.fromEntries(ASSET_IDS.map((id) => [id, 0])),
  );
  const [fxShock, setFxShock] = useState(0);

  const holdings = useMemo(() => computeHoldings(ledger, costMethod, date), [ledger, costMethod, date]);
  const returns = useMemo(() => computeReturns(ledger, costMethod, date), [ledger, costMethod, date]);
  const historyOk = historicalRiskAvailable(mode, ledger);
  const missingHist = holdingsWithoutImportedHistory(
    ledger,
    holdings.holdings.map((h) => ({ isin: h.isin, name: h.security.name })),
  );
  const frame = useMemo(() => {
    if (!historyOk) return null;
    return holdingReturnFrame(ledger, date) ?? classReturnFrame(ledger, date);
  }, [ledger, date, historyOk]);

  const cmaCov = useMemo(() => covFromVolCorr(cma.vol, cma.corr), [cma]);
  const books = useMemo(() => modelBooks(cma), [cma]);

  const estimated = useMemo(() => {
    if (!historyOk || !frame || frame.R.length < 3) {
      if (mode === "mydata") {
        return null;
      }
      return { cov: cmaCov, labels: ASSET_IDS.map((id) => ASSET_SHORT[id]), weights: books[2]!.weights, mu: cma.mu, source: "cma" as const };
    }
    const cov = estimateCovariance(frame.R, covMethod, lambda);
    return { cov, labels: frame.labels, weights: frame.weights, mu: frame.mu, source: frame.kind };
  }, [frame, covMethod, lambda, cmaCov, cma.mu, books, historyOk, mode]);

  const corr = useMemo(() => (estimated ? corrFromCov(estimated.cov) : null), [estimated]);

  const portR = useMemo(
    () => (historyOk ? simpleReturns(returns.nav.map((n) => n.value)) : []),
    [returns.nav, historyOk],
  );
  const benchSeries = storedBenchmarkSeries(ledger, benchmarkId);
  const benchR = useMemo(() => {
    if (!historyOk || benchSeries.length < 3 || portR.length < 3) return undefined;
    const aligned: number[] = [];
    const nav = returns.nav;
    for (let i = 1; i < nav.length; i++) {
      const d0 = nav[i - 1]!.date;
      const d1 = nav[i]!.date;
      const b0 = [...benchSeries].reverse().find((p) => p.date <= d0);
      const b1 = [...benchSeries].reverse().find((p) => p.date <= d1);
      if (b0 && b1 && b0.value > 0) aligned.push(b1.value / b0.value - 1);
      else aligned.push(NaN);
    }
    return aligned.every((x) => Number.isFinite(x)) ? aligned : undefined;
  }, [benchSeries, portR.length, returns.nav, historyOk]);

  const dd = useMemo(() => (historyOk ? drawdownFromNav(returns.nav) : null), [returns.nav, historyOk]);
  const rf = cma.mu[5] ?? 0.028;
  const ppy = portR.length > 1 && returns.nav.length > 1 ? Math.max(4, (portR.length / Math.max(1, (Date.parse(returns.endDate) - Date.parse(returns.startDate)) / (365 * 86400000))) ) : 12;
  const ratios = useMemo(
    () => (historyOk && portR.length > 2 && dd ? ratiosFromReturns(portR, rf, dd.maxDd, ppy, benchR) : null),
    [portR, rf, dd, ppy, benchR, historyOk],
  );

  const varEs = useMemo(() => {
    if (!historyOk || !estimated || portR.length < 2) return null;
    const w = estimated.weights;
    const n = w.length;
    const mu = estimated.mu.length === n ? estimated.mu : new Array(n).fill(0);
    return computeVarEs(portR, varMethod, alpha, {
      mu,
      cov: estimated.cov,
      weights: w,
      nPaths: 8000,
      seed: 20260321,
    });
  }, [portR, varMethod, alpha, estimated, historyOk]);

  const contrib = useMemo(
    () =>
      estimated
        ? riskContributions(
            estimated.weights,
            estimated.mu.length === estimated.weights.length ? estimated.mu : estimated.weights.map(() => 0),
            estimated.cov,
            estimated.labels,
          )
        : null,
    [estimated],
  );

  const frontier = useMemo(() => efficientFrontier(cmaCov, cma.mu, 51, defaultConstraints(6)), [cmaCov, cma.mu]);
  const selected = frontier[Math.min(frontierIdx, frontier.length - 1)] ?? frontier[0];
  const parity = useMemo(() => riskParity(cmaCov), [cmaCov]);
  const parityMom = useMemo(() => {
    let m = 0;
    let v = 0;
    for (let i = 0; i < 6; i++) m += parity[i]! * cma.mu[i]!;
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) v += parity[i]! * cmaCov[i]![j]! * parity[j]!;
    return { mu: m, vol: Math.sqrt(v) };
  }, [parity, cma.mu, cmaCov]);

  const bl = useMemo(() => {
    const wMkt = books[2]!.weights;
    return blackLitterman(cmaCov, wMkt, views, 2.5, 0.05, defaultConstraints(6));
  }, [cmaCov, books, views]);

  const stress = useMemo(
    () =>
      stressHoldings(
        holdings.holdings,
        holdings.cash,
        assetShocks as Record<(typeof ASSET_IDS)[number], number>,
        { USDNOK: fxShock, EURNOK: fxShock },
      ),
    [holdings, assetShocks, fxShock],
  );

  if (ledger.transactions.length === 0) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 sm:py-8">
        <div className="kicker mb-2">Analytics</div>
        <h1 className="text-2xl font-medium tracking-tight">Risk</h1>
        <p className="mt-4 rounded-lg border border-border bg-surface px-4 py-6 text-sm text-muted">
          No holdings in {mode === "demo" ? "Demo" : "My Data"}. Import a ledger, or stay in Demo — covariance, VaR and
          the CMA frontier still run on the planner assumptions below once a book exists.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <div className="kicker mb-2">Analytics</div>
        <h1 className="text-2xl font-medium tracking-tight">Risk</h1>
        <p className="mt-1 text-sm text-muted">
          {mode === "demo" ? "Demo" : "My Data"} ·{" "}
          {!historyOk
            ? "Not available: import price history"
            : `covariance from ${estimated?.source === "cma" ? "CMA (short history)" : estimated?.source === "holdings" ? "holding returns" : "asset-class NAV"} · ${covMethod}`}
          {privacy ? " · Privacy on" : ""}
        </p>
        {!historyOk && missingHist.length ? (
          <p className="mt-2 text-xs text-muted">
            Holdings without imported price history: {missingHist.map((h) => h.name || h.isin).join(", ")}.
          </p>
        ) : null}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label={`${(alpha * 100).toFixed(0)}% VaR`}
          value={varEs && historyOk ? formatPct(varEs.var, 2) : "Not available: import price history"}
          hint={VAR_METHODS.find((m) => m.id === varMethod)?.label}
        />
        <Metric label="Expected shortfall" value={varEs && historyOk ? formatPct(varEs.es, 2) : "Not available: import price history"} />
        <Metric
          label="Max drawdown"
          value={dd && historyOk ? formatPct(dd.maxDd, 1) : "Not available: import price history"}
          hint={dd?.maxDdTrough}
        />
        <Metric
          label="Sharpe"
          value={ratios && historyOk ? ratios.sharpe.toFixed(2) : "Not available: import price history"}
          hint={historyOk ? `rf ${formatPct(rf, 1)}` : undefined}
        />
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Panel kicker="Estimators" title="Covariance">
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              {(["sample", "ewma", "ledoit"] as CovMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCovMethod(m)}
                  className={cn(
                    "h-11 rounded-md border text-sm",
                    covMethod === m ? "border-accent bg-accent text-accent-fg" : "border-border text-muted",
                  )}
                >
                  {m === "sample" ? "Sample" : m === "ewma" ? "EWMA" : "Ledoit–Wolf"}
                </button>
              ))}
            </div>
            {covMethod === "ewma" ? (
              <SliderRow
                label="λ"
                valueLabel={lambda.toFixed(2)}
                min={0.8}
                max={0.99}
                step={0.01}
                value={lambda}
                onChange={setLambda}
              />
            ) : null}
            <p className="mt-3 text-xs text-muted">
              {!historyOk
                ? "Not available: import price history"
                : frame
                  ? `${frame.R.length} return observations x ${frame.labels.length} series.`
                  : "Using CMA covariance - import prices for a sample estimator."}
            </p>
          </Panel>

          <Panel kicker="Tails" title="VaR and expected shortfall">
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <Field label="Method">
                <SelectInput value={varMethod} onChange={(e) => setVarMethod(e.target.value as VarMethod)}>
                  {VAR_METHODS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Confidence">
                <SelectInput value={String(alpha)} onChange={(e) => setAlpha(Number(e.target.value))}>
                  {[0.9, 0.95, 0.975, 0.99].map((a) => (
                    <option key={a} value={a}>
                      {(a * 100).toFixed(1)}%
                    </option>
                  ))}
                </SelectInput>
              </Field>
            </div>
            <p className="text-sm text-muted">
              One-period loss on the book. Historical and Cornish–Fisher use the NAV return series; parametric and Monte
              Carlo use the selected covariance. Monte Carlo: 8,000 seeded paths.
            </p>
          </Panel>

          <Panel kicker="Path" title="Underwater">
            {dd && historyOk ? (
              <>
                <UnderwaterChart series={dd.underwater} />
                <div className="mt-3 grid gap-2 sm:grid-cols-3 text-xs text-muted">
                  <span>Peak {dd.maxDdStart}</span>
                  <span>Trough {dd.maxDdTrough}</span>
                  <span>Recovery {dd.recoveryDays == null ? "open" : `${dd.recoveryDays} days`}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted">Not available: import price history</p>
            )}
          </Panel>

          <Panel kicker="Co-movement" title="Correlation">
            {corr && estimated && historyOk ? (
              <HeatmapChart labels={estimated.labels} matrix={corr} />
            ) : (
              <p className="text-sm text-muted">Not available: import price history</p>
            )}
          </Panel>

          <Panel kicker="Attribution" title="Contribution to return and risk">
            {contrib && historyOk ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted">
                    <th className="px-2 py-2 font-medium">Name</th>
                    <th className="px-2 py-2 font-medium">Wgt</th>
                    <th className="px-2 py-2 font-medium">Ret contrib</th>
                    <th className="px-2 py-2 font-medium">MCR</th>
                    <th className="px-2 py-2 font-medium">% risk</th>
                  </tr>
                </thead>
                <tbody>
                  {contrib.map((r) => (
                    <tr key={r.label} className="border-b border-border">
                      <td className="px-2 py-2">{r.label}</td>
                      <td className="px-2 py-2 font-mono">{formatPct(r.weight, 1)}</td>
                      <td className="px-2 py-2 font-mono">{formatPct(r.retContrib, 2, true)}</td>
                      <td className="px-2 py-2 font-mono">{r.mcr.toFixed(3)}</td>
                      <td className="px-2 py-2 font-mono">{formatPct(r.pctr, 1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            ) : (
              <p className="text-sm text-muted">Not available: import price history</p>
            )}
          </Panel>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-[26rem]">
          <Panel kicker="Ratios" title="Risk-adjusted">
            {ratios && historyOk ? (
            <ul className="text-sm">
              <RatioRow label="Volatility" value={formatPct(ratios.vol, 1)} />
              <RatioRow label="Sortino" value={ratios.sortino.toFixed(2)} />
              <RatioRow label="Calmar" value={ratios.calmar.toFixed(2)} />
              <RatioRow
                label="Beta"
                value={ratios.beta == null ? "import a benchmark" : ratios.beta.toFixed(2)}
              />
              <RatioRow
                label="Tracking error"
                value={ratios.te == null ? "-" : formatPct(ratios.te, 1)}
              />
              <RatioRow label="Information ratio" value={ratios.ir == null ? "-" : ratios.ir.toFixed(2)} />
            </ul>
            ) : (
              <p className="text-sm text-muted">Not available: import price history</p>
            )}
          </Panel>

          <Panel kicker="What-if" title="Stress">
            <p className="mb-3 text-xs text-muted">Instantaneous shocks on current holdings. Currency shock applies to non-NOK FX.</p>
            {ASSET_IDS.map((id) => (
              <SliderRow
                key={id}
                label={ASSET_SHORT[id]}
                valueLabel={formatPct(assetShocks[id] ?? 0, 0, true)}
                min={-40}
                max={40}
                step={1}
                value={(assetShocks[id] ?? 0) * 100}
                onChange={(n) => setAssetShocks((s) => ({ ...s, [id]: n / 100 }))}
              />
            ))}
            <div className="mt-2">
              <SliderRow
                label="FX (USD/EUR)"
                valueLabel={formatPct(fxShock, 0, true)}
                min={-30}
                max={30}
                step={1}
                value={fxShock * 100}
                onChange={(n) => setFxShock(n / 100)}
              />
            </div>
            <div className="mt-3 rounded-md border border-border p-3">
              <div className="text-xs text-muted">Stressed P&L</div>
              <div className={cn("mt-1 font-mono text-lg", stress.pnl >= 0 ? "text-ok" : "text-danger")}>
                {privacy ? formatPct(stress.pnlPct, 1, true) : formatMoney(stress.pnl, "NOK", false)}
                <span className="ml-2 text-sm text-muted">{formatPct(stress.pnlPct, 1, true)}</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel kicker="Optimizer" title="Efficient frontier">
          <p className="mb-3 text-xs text-muted">
            Long-only mean-variance on the CMA, 51 points. Click a point to read the weights. Caps: 50% per asset (bonds
            70%, cash 40%), equities 90%, real estate 30%.
          </p>
          <FrontierChart
            points={frontier}
            selected={Math.min(frontierIdx, frontier.length - 1)}
            onSelect={setFrontierIdx}
            extra={[
              { label: "Risk parity", mu: parityMom.mu, vol: parityMom.vol },
              { label: "Black–Litterman", mu: bl.mu.reduce((s, v, i) => s + v * bl.weights[i]!, 0), vol: Math.sqrt(bl.weights.reduce((s, w, i) => s + w * bl.weights.reduce((t, wj, j) => t + cmaCov[i]![j]! * wj, 0), 0)) },
            ]}
          />
          {selected ? (
            <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-xs text-muted">
              {selected.weights.map((w, i) => (
                <li key={ASSET_IDS[i]} className="flex justify-between">
                  <span>{ASSET_SHORT[ASSET_IDS[i]!]}</span>
                  <span>{formatPct(w, 1)}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-2 text-xs text-muted">
            E[r] {selected ? formatPct(selected.mu) : "—"} · σ {selected ? formatPct(selected.vol) : "—"}
          </p>
        </Panel>

        <Panel kicker="Views" title="Risk parity and Black–Litterman">
          <h3 className="mb-2 text-sm font-medium">Risk parity</h3>
          <ul className="mb-4 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-xs text-muted">
            {parity.map((w, i) => (
              <li key={ASSET_IDS[i]} className="flex justify-between">
                <span>{ASSET_SHORT[ASSET_IDS[i]!]}</span>
                <span>{formatPct(w, 1)}</span>
              </li>
            ))}
          </ul>
          <h3 className="mb-2 text-sm font-medium">Black–Litterman views</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            <Field label="Asset">
              <SelectInput value={String(blAsset)} onChange={(e) => setBlAsset(Number(e.target.value))}>
                {ASSET_IDS.map((id, i) => (
                  <option key={id} value={i}>
                    {ASSET_SHORT[id]}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="E[r] %">
              <input
                className="field-input h-11"
                type="number"
                step={0.1}
                value={(blMu * 100).toFixed(1)}
                onChange={(e) => setBlMu(Number(e.target.value) / 100)}
              />
            </Field>
            <Field label="Confidence">
              <input
                className="field-input h-11"
                type="number"
                min={0.05}
                max={0.95}
                step={0.05}
                value={blConf}
                onChange={(e) => setBlConf(Number(e.target.value))}
              />
            </Field>
          </div>
          <button
            type="button"
            className="mt-3 h-11 rounded-md border border-border px-3 text-sm"
            onClick={() => setViews((v) => [...v.filter((x) => x.asset !== blAsset), { asset: blAsset, expected: blMu, confidence: blConf }])}
          >
            Add view
          </button>
          {views.length > 0 ? (
            <ul className="mt-3 text-xs text-muted">
              {views.map((v) => (
                <li key={v.asset} className="flex items-center justify-between py-1">
                  <span>
                    {ASSET_LABELS[ASSET_IDS[v.asset]!]} {formatPct(v.expected)} · c={v.confidence}
                  </span>
                  <button type="button" className="text-danger" onClick={() => setViews((xs) => xs.filter((x) => x.asset !== v.asset))}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-muted">No views — posterior equals implied equilibrium from the balanced book.</p>
          )}
          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-xs text-muted">
            {bl.weights.map((w, i) => (
              <li key={ASSET_IDS[i]} className="flex justify-between">
                <span>{ASSET_SHORT[ASSET_IDS[i]!]}</span>
                <span>{formatPct(w, 1)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel kicker="Planner" title="CMA model books (from this optimizer)">
        <div className="grid gap-3 sm:grid-cols-5">
          {books.map((b) => (
            <div key={b.id} className="rounded-md border border-border p-3">
              <div className="text-xs text-muted">{b.name}</div>
              {b.weights.map((w, i) => (
                <div key={ASSET_IDS[i]} className="flex justify-between font-mono text-[11px] text-muted">
                  <span>{ASSET_SHORT[ASSET_IDS[i]!]}</span>
                  <span>{formatPct(w, 0)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 font-mono text-lg tabular-nums">{value}</div>
      {hint ? <div className="mt-1 text-[11px] text-subtle">{hint}</div> : null}
    </div>
  );
}

function RatioRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex justify-between border-b border-border py-2">
      <span className="text-muted">{label}</span>
      <span className="font-mono">{value}</span>
    </li>
  );
}
