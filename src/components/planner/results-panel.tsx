import { Field, Panel, SliderRow } from "@/components/ui/field";
import { FanChart } from "@/components/charts/fan-chart";
import { useAppStore } from "@/store/app-store";
import { useSimulation } from "@/hooks/use-simulation";
import { formatMoney, formatPct, formatIndex } from "@/engine/format";
import { effectivePortfolio, effectiveRiskLevel } from "@/engine/schedule";
import { profileFromAnswers, riskRationale } from "@/engine/risk";
import { MODEL_PORTFOLIOS } from "@/engine/portfolios";
import { RISK_LABELS } from "@/engine/types";
import { cn } from "@/lib/utils";

export function ResultsPanel() {
  const profile = useAppStore((s) => s.profile);
  const privacy = useAppStore((s) => s.privacy);
  const whatIf = useAppStore((s) => s.whatIf);
  const cma = useAppStore((s) => s.cma);
  const setWhatIf = useAppStore((s) => s.setWhatIf);
  const resetWhatIf = useAppStore((s) => s.resetWhatIf);
  const beginLiveEdit = useAppStore((s) => s.beginLiveEdit);
  const endLiveEdit = useAppStore((s) => s.endLiveEdit);
  const { result, running, progress, error, nPaths } = useSimulation();
  const scored = profileFromAnswers(profile.answers);
  const level = effectiveRiskLevel(profile, whatIf);
  const book = effectivePortfolio(profile, whatIf, cma);

  return (
    <div className="flex flex-col gap-4 lg:sticky lg:top-20">
      <Panel id="whatif" kicker="Live" title="What-if">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted">Sliders re-run 10,000 paths on the same seed.</p>
          <button type="button" className="h-11 px-2 text-sm text-accent" onClick={resetWhatIf}>
            Reset
          </button>
        </div>
        <div className="flex flex-col gap-5">
          <SliderRow
            label="Save more"
            valueLabel={`+${whatIf.extraSavingsPts.toFixed(0)} pp`}
            min={0}
            max={20}
            step={1}
            value={whatIf.extraSavingsPts}
            onChange={(n) => setWhatIf({ extraSavingsPts: n })}
            onLiveStart={beginLiveEdit}
            onLiveEnd={endLiveEdit}
          />
          <SliderRow
            label="Retire later"
            valueLabel={`+${whatIf.retireLaterYears.toFixed(0)} yr`}
            min={0}
            max={10}
            step={1}
            value={whatIf.retireLaterYears}
            onChange={(n) => setWhatIf({ retireLaterYears: n })}
            onLiveStart={beginLiveEdit}
            onLiveEnd={endLiveEdit}
          />
          <div>
            <Field label="Risk profile">
              <div className="grid grid-cols-5 gap-1">
                {MODEL_PORTFOLIOS.map((p) => {
                  const on = level === p.riskLevel;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setWhatIf({ riskOverride: p.riskLevel })}
                      className={cn(
                        "flex h-11 items-center justify-center rounded-md border text-[11px]",
                        on ? "border-accent bg-accent text-accent-fg" : "border-border text-muted",
                      )}
                    >
                      {p.riskLevel}
                    </button>
                  );
                })}
              </div>
            </Field>
            <p className="mt-2 text-xs text-muted">
              {RISK_LABELS[level]} · questionnaire {RISK_LABELS[scored.profile]}
            </p>
          </div>
          <SliderRow
            label="Advisory fee"
            valueLabel={`${(whatIf.fee * 100).toFixed(2)}%`}
            min={0}
            max={1.5}
            step={0.05}
            value={whatIf.fee * 100}
            onChange={(n) => setWhatIf({ fee: n / 100 })}
            onLiveStart={beginLiveEdit}
            onLiveEnd={endLiveEdit}
          />
          <Field label="Rebalancing">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setWhatIf({ rebalance: "monthly" })}
                className={cn(
                  "flex h-11 items-center justify-center rounded-md border text-xs",
                  whatIf.rebalance !== "none"
                    ? "border-accent bg-accent text-accent-fg"
                    : "border-border text-muted",
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setWhatIf({ rebalance: "none" })}
                className={cn(
                  "flex h-11 items-center justify-center rounded-md border text-xs",
                  whatIf.rebalance === "none"
                    ? "border-accent bg-accent text-accent-fg"
                    : "border-border text-muted",
                )}
              >
                Let weights drift
              </button>
            </div>
          </Field>
        </div>
      </Panel>

      <Panel id="results" kicker="Projection" title="Goal Monte Carlo">
        <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted">
          <span className="font-mono tabular-nums">{nPaths.toLocaleString()} paths</span>
          <span>· monthly · 6-asset</span>
          <span>· {whatIf.rebalance === "none" ? "no rebalance" : "rebalanced"}</span>
          <span>· seed {profile.seed}</span>
          <span>· {book.name}{book.source === "fallback" ? " · fallback allocation" : ""}</span>
          {nPaths < 10000 ? <span className="text-warn">preview</span> : null}
          {running ? (
            <span className="text-accent">Updating {(progress * 100).toFixed(0)}%</span>
          ) : null}
        </div>
        {error ? (
          <p className="text-sm text-danger">{error}</p>
        ) : !result ? (
          <p className="text-sm text-muted">Running the first 10,000 paths…</p>
        ) : (
          <>
            {profile.goals.length === 0 ? (
              <p className="mb-4 text-sm text-muted">Add a goal to see success probabilities.</p>
            ) : (
              <div className="mb-5 flex flex-col gap-2">
                {profile.goals.map((g) => {
                  const r = result.goals.find((x) => x.goalId === g.id);
                  if (!r) return null;
                  const tone =
                    r.successRate >= 0.8 ? "text-ok" : r.successRate >= 0.5 ? "text-warn" : "text-danger";
                  return (
                    <div
                      key={g.id}
                      className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-border px-3 py-3"
                    >
                      <div>
                        <div className="text-sm text-fg">{g.name}</div>
                        <div className="text-xs text-muted">Priority {g.priority}</div>
                      </div>
                      <div className="text-right">
                        <div className={cn("font-mono text-lg tabular-nums", tone)}>
                          {formatPct(r.successRate, 1)}
                        </div>
                        <div className="text-xs text-muted">
                          {r.nFail === 0
                            ? "No shortfall"
                            : privacy
                              ? `median shortfall idx ${formatIndex(r.medianShortfall, Math.max(g.targetAmount, 1))}`
                              : `median shortfall ${formatMoney(r.medianShortfall, profile.currency, false)}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <FanChart result={result} privacy={privacy} currency={profile.currency} inflation={cma.inflation} />
            <p className="mt-2 text-xs text-muted">
              Fan amounts are in today’s {profile.currency} (real). Nominal path values sit in the proposal appendix.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-subtle">{riskRationale(scored.tolerance, scored.capacity, scored.profile)}</p>
          </>
        )}
      </Panel>

      <Panel id="fees" kicker="Cost" title="Fee impact">
        {!result ? (
          <p className="text-sm text-muted">Waiting for the simulation.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric
              label="Median ending wealth, with fee"
              value={
                privacy
                  ? `idx ${formatIndex(result.medianTerminal, result.startWealth || 1)}`
                  : formatMoney(result.medianTerminal, profile.currency, false)
              }
            />
            <Metric
              label="Without fee"
              value={
                privacy
                  ? `idx ${formatIndex(result.medianTerminalNoFee, result.startWealth || 1)}`
                  : formatMoney(result.medianTerminalNoFee, profile.currency, false)
              }
            />
            <Metric
              label="Fee drag"
              value={
                privacy
                  ? formatPct(result.feeDragPct)
                  : `${formatMoney(result.feeDrag, profile.currency, false)}  (${formatPct(result.feeDragPct)})`
              }
              warn
            />
          </div>
        )}
        <p className="mt-4 text-xs text-muted">
          Same return path, same cashflows, with and without the advisory fee of {formatPct(whatIf.fee, 2)}. Drag
          is the difference in median terminal wealth.
        </p>
      </Panel>
    </div>
  );
}

function Metric({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-md border border-border p-4">
      <div className="mb-2 text-xs text-muted">{label}</div>
      <div className={cn("font-mono text-sm tabular-nums", warn ? "text-warn" : "text-fg")}>{value}</div>
    </div>
  );
}
