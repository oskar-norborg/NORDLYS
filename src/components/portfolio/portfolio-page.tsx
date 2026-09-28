import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Panel, Field, SelectInput } from "@/components/ui/field";
import { AllocationChart } from "@/components/charts/allocation-chart";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { GapPanel } from "./gap-panel";
import { useAppStore } from "@/store/app-store";
import { usePortfolioStore } from "@/store/portfolio-store";
import { computeHoldings } from "@/engine/ledger/holdings";
import { computeReturns, annualize } from "@/engine/ledger/returns";
import { BENCHMARKS, resolveBenchmarkSeries } from "@/engine/ledger/benchmarks";
import { DEMO_AS_OF } from "@/engine/ledger/synthetic";
import { formatMoney, formatPct } from "@/engine/format";
import { ASSET_LABELS, TX_KIND_LABELS } from "@/engine";
import { effectivePortfolio } from "@/engine/schedule";
import { cn } from "@/lib/utils";
import { PdfDownloadButton } from "@/components/pdf/download-button";
import { buildPortfolioReportPdf } from "@/engine/pdf/portfolio-report";

function asOf(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PortfolioPage() {
  const navigate = useNavigate();
  const mode = useAppStore((s) => s.mode);
  const privacy = useAppStore((s) => s.privacy);
  const profile = useAppStore((s) => s.profile);
  const whatIf = useAppStore((s) => s.whatIf);
  const cma = useAppStore((s) => s.cma);
  const setProfile = useAppStore((s) => s.setProfile);
  const demo = usePortfolioStore((s) => s.demo);
  const mydata = usePortfolioStore((s) => s.mydata);
  const costMethod = usePortfolioStore((s) => s.costMethod);
  const setCostMethod = usePortfolioStore((s) => s.setCostMethod);
  const benchmarkId = usePortfolioStore((s) => s.benchmarkId);
  const setBenchmark = usePortfolioStore((s) => s.setBenchmark);
  const markUsedAsClient = usePortfolioStore((s) => s.markUsedAsClient);
  const ledger = mode === "demo" ? demo : mydata;
  const date = mode === "demo" ? DEMO_AS_OF : asOf();

  const holdings = useMemo(() => computeHoldings(ledger, costMethod, date), [ledger, costMethod, date]);
  const returns = useMemo(() => computeReturns(ledger, costMethod, date), [ledger, costMethod, date]);
  const model = effectivePortfolio(profile, whatIf, cma);
  const bench = BENCHMARKS.find((b) => b.id === benchmarkId) ?? BENCHMARKS[0]!;
  const navIdx = useMemo(() => {
    const pts = returns.nav.filter((_, i) => i % 2 === 0 || i === returns.nav.length - 1);
    const src = pts.length >= 2 ? pts : returns.nav;
    const base = src[0]?.value || 1;
    return src.map((p) => ({ date: p.date, value: p.value, idx: (p.value / base) * 100 }));
  }, [returns.nav]);
  const benchSeries = useMemo(
    () => resolveBenchmarkSeries(ledger, bench.id, mode, navIdx.map((p) => p.date)),
    [ledger, bench.id, mode, navIdx],
  );
  const twrAnn = annualize(returns.twr, returns.startDate, returns.endDate);
  const priceStale = holdings.holdings.some((h) => h.priceStale);
  const fxStale = holdings.holdings.some((h) => h.fxStale);
  const showBenchmark = benchSeries.length >= 2;

  const useAsClient = () => {
    setProfile({ currentAssets: Math.round(holdings.totalMarket) });
    markUsedAsClient(holdings.totalMarket);
    void navigate({ to: "/" });
  };

  if (ledger.transactions.length === 0) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 sm:py-8">
        <div className="kicker mb-2">Holdings</div>
        <h1 className="text-2xl font-medium tracking-tight">Portfolio</h1>
        <p className="mt-4 rounded-lg border border-border bg-surface px-4 py-6 text-sm text-muted">
          No transactions in {mode === "demo" ? "Demo" : "My Data"}. Open Import and load a Nordnet file, or the demo
          export — Demo and My Data run the same parser.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="kicker mb-2">Holdings</div>
          <h1 className="text-2xl font-medium tracking-tight">Portfolio</h1>
          <p className="mt-1 text-sm text-muted">
            Base currency NOK · as of {date}
            {priceStale ? " · prices from last trade (stale)" : ""}
            {fxStale ? " · FX not imported (stale)" : ""}
            {privacy ? " · Privacy on" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PdfDownloadButton
            label="Download report PDF"
            build={() =>
              buildPortfolioReportPdf({
                ledger,
                profile,
                cma,
                whatIf,
                costMethod,
                privacy,
                asOf: date,
                mode,
              })
            }
          />
          <div className="inline-flex rounded-full border border-border p-0.5">
            {(["fifo", "average"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setCostMethod(m)}
                className={cn(
                  "h-9 rounded-full px-3 text-xs font-medium",
                  costMethod === m ? "bg-accent text-accent-fg" : "text-muted",
                )}
              >
                {m === "fifo" ? "FIFO" : "Average cost"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={useAsClient}
            className="h-11 rounded-md bg-accent px-4 text-sm text-accent-fg"
          >
            Use as client
          </button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Market value"
          value={privacy ? "••••" : formatMoney(holdings.totalMarket, "NOK", false)}
        />
        <Metric label="Cash" value={privacy ? "••••" : formatMoney(holdings.cash, "NOK", false)} />
        <Metric
          label="Unrealized P&L"
          value={
            privacy
              ? formatPct(holdings.totalUnrealized / Math.max(holdings.totalCost, 1), 1, true)
              : formatMoney(holdings.totalUnrealized, "NOK", false)
          }
        />
        <Metric
          label="Realized P&L"
          value={privacy ? "••••" : formatMoney(holdings.totalRealized, "NOK", false)}
        />
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Metric label="Time-weighted" value={formatPct(returns.twr, 1, true)} hint={`annualized ${formatPct(twrAnn, 1, true)}`} />
        <Metric
          label="Money-weighted (XIRR)"
          value={Number.isFinite(returns.xirr) ? formatPct(returns.xirr, 1, true) : "—"}
        />
        <Metric
          label="Price / currency effect"
          value={
            privacy
              ? `${formatPct(holdings.totalPriceEffect / Math.max(holdings.totalCost, 1), 1, true)} / ${formatPct(holdings.totalCurrencyEffect / Math.max(holdings.totalCost, 1), 1, true)}`
              : `${formatMoney(holdings.totalPriceEffect, "NOK", false)} / ${formatMoney(holdings.totalCurrencyEffect, "NOK", false)}`
          }
        />
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Panel kicker="Positions" title="Holdings">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[52rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted">
                    <th className="px-2 py-2 font-medium">Name</th>
                    <th className="px-2 py-2 font-medium">Qty</th>
                    <th className="px-2 py-2 font-medium">Price</th>
                    <th className="px-2 py-2 font-medium">FX</th>
                    <th className="px-2 py-2 font-medium">MV NOK</th>
                    <th className="px-2 py-2 font-medium">Wgt</th>
                    <th className="px-2 py-2 font-medium">uP&L</th>
                    <th className="px-2 py-2 font-medium">Price</th>
                    <th className="px-2 py-2 font-medium">Ccy</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.holdings.map((h) => (
                    <tr key={h.isin} className="border-b border-border">
                      <td className="px-2 py-2">
                        <div>{h.security.name}</div>
                        <div className="font-mono text-[11px] text-muted">
                          {h.security.ticker || "add ticker"} · {h.isin}
                        </div>
                      </td>
                      <td className="px-2 py-2 font-mono tabular-nums">{h.qty.toFixed(4)}</td>
                      <td className="px-2 py-2 font-mono tabular-nums">
                        {privacy ? "••••" : `${h.price.toFixed(2)} ${h.security.currency}`}
                        {h.priceStale ? <span className="ml-1 text-[10px] uppercase text-warn">stale</span> : null}
                      </td>
                      <td className="px-2 py-2 font-mono tabular-nums text-xs">
                        {h.security.currency === "NOK" ? "—" : h.fx.toFixed(4)}
                        {h.fxStale ? <span className="ml-1 text-[10px] uppercase text-warn">stale</span> : null}
                      </td>
                      <td className="px-2 py-2 font-mono tabular-nums">
                        {privacy ? "••••" : formatMoney(h.marketNok, "NOK", false)}
                      </td>
                      <td className="px-2 py-2 font-mono tabular-nums">{formatPct(h.weight, 1)}</td>
                      <td className={cn("px-2 py-2 font-mono tabular-nums", h.unrealizedNok >= 0 ? "text-ok" : "text-danger")}>
                        {privacy
                          ? formatPct(h.unrealizedNok / Math.max(h.costNok, 1), 1, true)
                          : formatMoney(h.unrealizedNok, "NOK", false)}
                      </td>
                      <td className="px-2 py-2 font-mono text-xs tabular-nums">
                        {privacy ? "—" : formatMoney(h.priceEffect, "NOK", false)}
                      </td>
                      <td className="px-2 py-2 font-mono text-xs tabular-nums">
                        {privacy ? "—" : formatMoney(h.currencyEffect, "NOK", false)}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="px-2 py-2 text-muted">Cash</td>
                    <td />
                    <td />
                    <td />
                    <td className="px-2 py-2 font-mono tabular-nums">
                      {privacy ? "••••" : formatMoney(holdings.cash, "NOK", false)}
                    </td>
                    <td className="px-2 py-2 font-mono tabular-nums">
                      {formatPct(holdings.totalMarket > 0 ? holdings.cash / holdings.totalMarket : 0, 1)}
                    </td>
                    <td />
                    <td />
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel kicker="Performance" title="Vs benchmark">
            <Field label="Benchmark">
              <SelectInput value={benchmarkId} onChange={(e) => setBenchmark(e.target.value)}>
                {BENCHMARKS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <div className="mt-4">
              <PerformanceChart
                portfolio={navIdx.map((p) => ({ date: p.date, value: p.value }))}
                benchmark={showBenchmark ? benchSeries : []}
                benchmarkLabel={bench.label}
                privacy={privacy}
                currency="NOK"
              />
            </div>
            {showBenchmark ? (
              <p className="mt-2 text-xs text-muted">
                Indexed to 100 at {returns.startDate}. Benchmark from{" "}
                {mode === "demo" ? "the demo series" : "imported prices"} for {bench.label}.
              </p>
            ) : (
              <p className="mt-2 rounded-md border border-border bg-surface-2 px-3 py-2 text-xs text-muted">
                No benchmark prices imported for {bench.label}. Import a date + close/NAV history on the Import page
                to overlay a comparison. NORDLYS never generates benchmark paths in My Data.
              </p>
            )}
          </Panel>

          {holdings.realized.length > 0 ? (
            <Panel kicker="Closed" title="Realized P&L">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[32rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted">
                      <th className="px-2 py-2 font-medium">Security</th>
                      <th className="px-2 py-2 font-medium">Qty</th>
                      <th className="px-2 py-2 font-medium">Total</th>
                      <th className="px-2 py-2 font-medium">Price</th>
                      <th className="px-2 py-2 font-medium">Currency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.realized.map((r) => (
                      <tr key={r.isin} className="border-b border-border">
                        <td className="px-2 py-2">{r.name}</td>
                        <td className="px-2 py-2 font-mono">{r.qty.toFixed(4)}</td>
                        <td className="px-2 py-2 font-mono">
                          {privacy ? "••••" : formatMoney(r.realizedNok, "NOK", false)}
                        </td>
                        <td className="px-2 py-2 font-mono text-xs">
                          {privacy ? "—" : formatMoney(r.priceEffect, "NOK", false)}
                        </td>
                        <td className="px-2 py-2 font-mono text-xs">
                          {privacy ? "—" : formatMoney(r.currencyEffect, "NOK", false)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          ) : null}

          <Panel kicker="Ledger" title="Transactions">
            <div className="max-h-80 overflow-auto">
              <table className="w-full min-w-[40rem] text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="px-2 py-1 font-medium">Id</th>
                    <th className="px-2 py-1 font-medium">Date</th>
                    <th className="px-2 py-1 font-medium">Type</th>
                    <th className="px-2 py-1 font-medium">Name</th>
                    <th className="px-2 py-1 font-medium">Qty</th>
                    <th className="px-2 py-1 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.transactions
                    .slice()
                    .reverse()
                    .map((t) => (
                      <tr key={t.id} className="border-b border-border">
                        <td className="px-2 py-1 font-mono">{t.nordnetId}</td>
                        <td className="px-2 py-1 font-mono">{t.tradeDate}</td>
                        <td className="px-2 py-1">{TX_KIND_LABELS[t.kind]}</td>
                        <td className="px-2 py-1">{t.name || t.text}</td>
                        <td className="px-2 py-1 font-mono">{t.qty ? t.qty.toFixed(4) : ""}</td>
                        <td className="px-2 py-1 font-mono">
                          {privacy ? "••••" : formatMoney(t.amount, "NOK", false)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-96">
          <Panel kicker="Mix" title="Allocation">
            <AllocationChart slices={holdings.allocation} />
            <ul className="mt-2 text-xs text-muted">
              {holdings.allocation
                .filter((a) => a.weight > 0.0005)
                .map((a) => (
                  <li key={a.assetClass} className="flex justify-between py-1">
                    <span>{ASSET_LABELS[a.assetClass]}</span>
                    <span className="font-mono">{formatPct(a.weight, 1)}</span>
                  </li>
                ))}
            </ul>
          </Panel>
          <GapPanel holdings={holdings} model={model} securities={ledger.securities} privacy={privacy} />
        </div>
      </div>
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
