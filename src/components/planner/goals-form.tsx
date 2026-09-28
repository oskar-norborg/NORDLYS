import { Plus, Trash2 } from "lucide-react";
import { Field, MoneyInput, SelectInput, TextInput, Panel } from "@/components/ui/field";
import { useAppStore } from "@/store/app-store";
import { newGoal } from "@/engine/ids";
import { AS_OF_YEAR, GOAL_TYPE_LABELS } from "@/engine/types";
import type { GoalType } from "@/engine/types";

export function GoalsForm() {
  const profile = useAppStore((s) => s.profile);
  const privacy = useAppStore((s) => s.privacy);
  const setGoals = useAppStore((s) => s.setGoals);

  return (
    <Panel id="goals" kicker="Objectives" title="Goals">
      <p className="mb-4 text-sm text-muted">
        Amounts are in today's {profile.currency}. The engine inflates them to the goal date. Retirement
        income is an annual real spending need from the last retirement.
      </p>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          className="inline-flex h-11 items-center gap-1.5 rounded-md px-3 text-sm text-accent"
          onClick={() => setGoals([...profile.goals, newGoal({ year: AS_OF_YEAR + 5 })])}
        >
          <Plus className="size-4" /> Add goal
        </button>
      </div>
      {profile.goals.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
          No goals yet. Add retirement income, a home, education, or a bequest.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {profile.goals.map((g) => (
            <div key={g.id} className="rounded-md border border-border bg-surface-2 p-4">
              <div className="mb-3 flex justify-end">
                <button
                  type="button"
                  className="inline-flex h-11 items-center gap-1 text-sm text-danger"
                  onClick={() => setGoals(profile.goals.filter((x) => x.id !== g.id))}
                >
                  <Trash2 className="size-4" /> Remove
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Type">
                  <SelectInput
                    value={g.type}
                    onChange={(e) => {
                      const type = e.target.value as GoalType;
                      setGoals(
                        profile.goals.map((x) =>
                          x.id === g.id ? { ...x, type, name: GOAL_TYPE_LABELS[type] } : x,
                        ),
                      );
                    }}
                  >
                    {(Object.keys(GOAL_TYPE_LABELS) as GoalType[]).map((t) => (
                      <option key={t} value={t}>
                        {GOAL_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Label">
                  <TextInput
                    value={g.name}
                    onChange={(e) =>
                      setGoals(profile.goals.map((x) => (x.id === g.id ? { ...x, name: e.target.value } : x)))
                    }
                  />
                </Field>
                <Field
                  label={g.type === "retirement_income" ? "Annual income (today)" : "Target amount (today)"}
                >
                  <MoneyInput
                    value={g.targetAmount}
                    onChange={(n) =>
                      setGoals(profile.goals.map((x) => (x.id === g.id ? { ...x, targetAmount: n } : x)))
                    }
                    currency={profile.currency}
                    privacy={privacy}
                  />
                </Field>
                <Field
                  label={g.type === "legacy" ? "Horizon year" : g.type === "retirement_income" ? "Ref. year" : "Target year"}
                >
                  <TextInput
                    type="number"
                    min={AS_OF_YEAR}
                    max={AS_OF_YEAR + 80}
                    value={g.year}
                    onChange={(e) =>
                      setGoals(
                        profile.goals.map((x) => (x.id === g.id ? { ...x, year: Number(e.target.value) } : x)),
                      )
                    }
                  />
                </Field>
                <Field label="Priority (1 = first)">
                  <SelectInput
                    value={g.priority}
                    onChange={(e) =>
                      setGoals(
                        profile.goals.map((x) =>
                          x.id === g.id ? { ...x, priority: Number(e.target.value) } : x,
                        ),
                      )
                    }
                  >
                    <option value={1}>1 — highest</option>
                    <option value={2}>2 — medium</option>
                    <option value={3}>3 — lower</option>
                  </SelectInput>
                </Field>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
