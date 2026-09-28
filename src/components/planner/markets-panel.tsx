import { ASSET_IDS, ASSET_LABELS, ASSET_SHORT, RISK_LABELS } from "@/engine/types";
import { modelBooks, symmetrizeCorr } from "@/engine/portfolios";
import { portfolioMoments, formatPct } from "@/engine";
import { Field, Panel, TextInput } from "@/components/ui/field";
import { useAppStore } from "@/store/app-store";
import { profileFromAnswers } from "@/engine/risk";
import { cn } from "@/lib/utils";

export function MarketsPanel() {
  const cma = useAppStore((s) => s.cma);
  const setCma = useAppStore((s) => s.setCma);
  const resetCma = useAppStore((s) => s.resetCma);
  const answers = useAppStore((s) => s.profile.answers);
  const whatIf = useAppStore((s) => s.whatIf);
  const recommended = profileFromAnswers(answers).profile;
  const active = whatIf.riskOverride ?? recommended;
  const books = modelBooks(cma);

  function setMu(i: number, pct: number) {
    const mu = cma.mu.slice();
    mu[i] = pct / 100;
    setCma({ ...cma, mu });
  }
  function setVol(i: number, pct: number) {
    const vol = cma.vol.slice();
    vol[i] = Math.max(0, pct / 100);
    setCma({ ...cma, vol });
  }
  function setCorr(i: number, j: number, v: number) {
    const corr = cma.corr.map((row) => row.slice());
    corr[i]![j] = v;
    corr[j]![i] = v;
    setCma({ ...cma, corr: symmetrizeCorr(corr) });
  }

  return (
    <>
      <Panel id="portfolios" kicker="Books" title="Model portfolios">
        <div className="flex flex-col gap-3">
          {books.map((p) => {
            const stats = portfolioMoments(p.weights, cma.mu, cma.vol, cma.corr);
            const on = p.riskLevel === active;
            const rec = p.riskLevel === recommended;
            return (
              <div
                key={p.id}
                className={cn("rounded-md border p-4", on ? "border-accent" : "border-border")}
              >
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <span className="text-sm font-medium text-fg">{p.name}</span>
                    {rec ? (
                      <span className="ml-2 text-[10px] tracking-wider text-accent uppercase">Recommended</span>
                    ) : null}
                    {on && !rec ? (
                      <span className="ml-2 text-[10px] tracking-wider text-warn uppercase">What-if</span>
                    ) : null}
                  </div>
                  <div className="font-mono text-xs tabular-nums text-muted">
                    E[r] {formatPct(stats.mu)} · σ {formatPct(stats.vol)}
                  </div>
                </div>
                <p className="mb-3 text-xs text-muted">{p.blurb}</p>
                <div className="flex h-3 overflow-hidden rounded-full">
                  {p.weights.map((w, i) => (
                    <div
                      key={ASSET_IDS[i]}
                      style={{
                        width: `${w * 100}%`,
                        background: barColor(i),
                      }}
                      title={`${ASSET_LABELS[ASSET_IDS[i]!]} ${formatPct(w, 0)}`}
                    />
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-subtle">
                  {p.weights.map((w, i) => (
                    <span key={ASSET_IDS[i]}>
                      {ASSET_SHORT[ASSET_IDS[i]!]} {formatPct(w, 0)}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-subtle">
          Active book: {RISK_LABELS[active]}. Weights are the CMA mean-variance frontier (long-only, caps). Change the book with the risk-profile control in What-if.
        </p>
      </Panel>

      <Panel
        id="cma"
        kicker="Assumptions"
        title="Capital market assumptions"
        action={
          <button type="button" className="h-11 px-3 text-sm text-accent" onClick={resetCma}>
            Reset
          </button>
        }
      >
        <p className="mb-4 text-sm text-muted">
          Annual arithmetic expected returns and volatilities, pairwise correlations, and inflation. Used as-is
          in the monthly engine (μ/12, σ/√12) with a Cholesky factor of the correlation matrix.
        </p>
        <div className="mb-4 max-w-xs">
          <Field label="Inflation">
            <TextInput
              type="number"
              step={0.1}
              value={(cma.inflation * 100).toFixed(1)}
              onChange={(e) => setCma({ ...cma, inflation: Number(e.target.value) / 100 })}
            />
          </Field>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-xs">
            <thead>
              <tr className="text-muted">
                <th className="pb-2 font-medium">Asset</th>
                <th className="pb-2 font-medium">E[r] %</th>
                <th className="pb-2 font-medium">Vol %</th>
              </tr>
            </thead>
            <tbody>
              {ASSET_IDS.map((id, i) => (
                <tr key={id} className="border-t border-border">
                  <td className="py-2 pr-3 text-fg">{ASSET_LABELS[id]}</td>
                  <td className="py-2 pr-3">
                    <TextInput
                      type="number"
                      step={0.1}
                      value={(cma.mu[i]! * 100).toFixed(1)}
                      onChange={(e) => setMu(i, Number(e.target.value))}
                      className="h-11 w-24"
                    />
                  </td>
                  <td className="py-2">
                    <TextInput
                      type="number"
                      step={0.1}
                      min={0}
                      value={(cma.vol[i]! * 100).toFixed(1)}
                      onChange={(e) => setVol(i, Number(e.target.value))}
                      className="h-11 w-24"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 className="mt-6 mb-2 text-sm font-medium">Correlation</h3>
        <div className="overflow-x-auto">
          <table className="text-left font-mono text-[11px]">
            <thead>
              <tr>
                <th className="pr-2 pb-2" />
                {ASSET_IDS.map((id) => (
                  <th key={id} className="px-1 pb-2 font-medium text-muted">
                    {ASSET_SHORT[id]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ASSET_IDS.map((id, i) => (
                <tr key={id}>
                  <td className="pr-2 text-muted">{ASSET_SHORT[id]}</td>
                  {ASSET_IDS.map((jd, j) => (
                    <td key={jd} className="p-1">
                      {j < i ? (
                        <span className="block w-16 text-center text-subtle">
                          {cma.corr[i]![j]!.toFixed(2)}
                        </span>
                      ) : j === i ? (
                        <span className="block w-16 text-center text-subtle">1.00</span>
                      ) : (
                        <TextInput
                          type="number"
                          step={0.01}
                          min={-0.99}
                          max={0.99}
                          value={cma.corr[i]![j]!}
                          onChange={(e) => setCorr(i, j, Number(e.target.value))}
                          className="h-11 w-16 px-1 text-center"
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function barColor(i: number): string {
  const tones = [
    "var(--color-accent)",
    "color-mix(in oklab, var(--color-accent) 80%, var(--color-fg))",
    "color-mix(in oklab, var(--color-accent) 60%, var(--color-fg))",
    "var(--color-muted)",
    "color-mix(in oklab, var(--color-muted) 70%, var(--color-bg))",
    "var(--color-subtle)",
  ];
  return tones[i] ?? "var(--color-subtle)";
}
