import { Field, Panel } from "@/components/ui/field";
import { useAppStore } from "@/store/app-store";
import { RISK_QUESTIONS, profileFromAnswers, riskRationale } from "@/engine/risk";
import { RISK_LABELS } from "@/engine/types";
import { cn } from "@/lib/utils";

export function RiskPanel() {
  const answers = useAppStore((s) => s.profile.answers);
  const setAnswers = useAppStore((s) => s.setAnswers);
  const scored = profileFromAnswers(answers);

  return (
    <Panel id="risk" kicker="Questionnaire" title="Risk tolerance and capacity">
      <p className="mb-5 text-sm text-muted">
        Twelve questions. Six measure willingness (tolerance), six measure ability (capacity). The book is the
        lower of the two.
      </p>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <ScoreCard label="Willingness" value={scored.tolerance} mean={scored.toleranceMean} />
        <ScoreCard label="Ability" value={scored.capacity} mean={scored.capacityMean} />
        <ScoreCard label="Profile" value={scored.profile} mean={scored.profile} accent />
      </div>
      <p className="mb-6 text-sm leading-relaxed text-fg">{riskRationale(scored.tolerance, scored.capacity, scored.profile)}</p>
      <ol className="flex flex-col gap-6">
        {RISK_QUESTIONS.map((q, i) => (
          <li key={q.id}>
            <div className="mb-1 text-[10px] tracking-[0.14em] text-subtle uppercase">
              {q.dimension === "tolerance" ? "Willingness" : "Ability"} · {q.title}
            </div>
            <p className="mb-3 text-sm text-fg">{q.prompt}</p>
            <Field label={`${q.low} → ${q.high}`}>
              <div className="grid grid-cols-5 gap-1">
                {q.options.map((opt, k) => {
                  const val = k + 1;
                  const on = answers[i] === val;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        const next = answers.slice();
                        next[i] = val;
                        setAnswers(next);
                      }}
                      className={cn(
                        "flex min-h-11 items-center justify-center rounded-md border px-1 py-2 text-center text-[11px] leading-tight sm:text-xs",
                        on
                          ? "border-accent bg-accent text-accent-fg"
                          : "border-border bg-surface-2 text-muted",
                      )}
                      aria-pressed={on}
                    >
                      <span className="hidden sm:inline">{opt}</span>
                      <span className="sm:hidden">{val}</span>
                    </button>
                  );
                })}
              </div>
            </Field>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

function ScoreCard({
  label,
  value,
  mean,
  accent,
}: {
  label: string;
  value: number;
  mean: number;
  accent?: boolean;
}) {
  return (
    <div className={cn("rounded-md border p-4", accent ? "border-accent/40 bg-surface-2" : "border-border")}>
      <div className="kicker mb-2">{label}</div>
      <div className="font-mono text-lg tabular-nums text-fg">{value}</div>
      <div className="text-xs text-muted">{RISK_LABELS[value]}</div>
      <div className="mt-1 font-mono text-[11px] text-subtle">mean {mean.toFixed(2)}</div>
    </div>
  );
}
