import { Plus, Trash2 } from "lucide-react";
import { Field, MoneyInput, SelectInput, TextInput, Panel } from "@/components/ui/field";
import { useAppStore } from "@/store/app-store";
import { newMember } from "@/engine/ids";
import type { CurrencyCode } from "@/engine/types";

export function HouseholdForm() {
  const profile = useAppStore((s) => s.profile);
  const privacy = useAppStore((s) => s.privacy);
  const setProfile = useAppStore((s) => s.setProfile);
  const setMembers = useAppStore((s) => s.setMembers);

  return (
    <Panel id="profile" kicker="Household" title="Client profile">
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Field label="Household name">
          <TextInput
            value={profile.name}
            onChange={(e) => setProfile({ name: e.target.value })}
          />
        </Field>
        <Field label="Planning currency">
          <SelectInput
            value={profile.currency}
            onChange={(e) => setProfile({ currency: e.target.value as CurrencyCode })}
          >
            <option value="NOK">NOK — Norwegian krone</option>
            <option value="USD">USD — US dollar</option>
            <option value="EUR">EUR — Euro</option>
          </SelectInput>
        </Field>
        <Field label="Current investable assets">
          <MoneyInput
            value={profile.currentAssets}
            onChange={(n) => setProfile({ currentAssets: Math.max(0, n) })}
            currency={profile.currency}
            privacy={privacy}
          />
        </Field>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-fg">Members</h3>
        <button
          type="button"
          className="inline-flex h-11 items-center gap-1.5 rounded-md px-3 text-sm text-accent"
          onClick={() => setMembers([...profile.members, newMember({ name: `Member ${profile.members.length + 1}` })])}
        >
          <Plus className="size-4" /> Add member
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {profile.members.map((m, i) => (
          <div key={m.id} className="rounded-md border border-border bg-surface-2 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-muted">Member {i + 1}</span>
              {profile.members.length > 1 ? (
                <button
                  type="button"
                  className="inline-flex h-11 items-center gap-1 px-2 text-sm text-danger"
                  onClick={() => setMembers(profile.members.filter((x) => x.id !== m.id))}
                >
                  <Trash2 className="size-4" /> Remove
                </button>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Field label="Name">
                <TextInput
                  value={m.name}
                  onChange={(e) =>
                    setMembers(profile.members.map((x) => (x.id === m.id ? { ...x, name: e.target.value } : x)))
                  }
                />
              </Field>
              <Field label="Age">
                <TextInput
                  type="number"
                  min={18}
                  max={100}
                  value={m.age}
                  onChange={(e) =>
                    setMembers(
                      profile.members.map((x) => (x.id === m.id ? { ...x, age: Number(e.target.value) } : x)),
                    )
                  }
                />
              </Field>
              <Field label="Retirement age">
                <TextInput
                  type="number"
                  min={40}
                  max={80}
                  value={m.retirementAge}
                  onChange={(e) =>
                    setMembers(
                      profile.members.map((x) =>
                        x.id === m.id ? { ...x, retirementAge: Number(e.target.value) } : x,
                      ),
                    )
                  }
                />
              </Field>
              <Field label="Annual income">
                <MoneyInput
                  value={m.annualIncome}
                  onChange={(n) =>
                    setMembers(profile.members.map((x) => (x.id === m.id ? { ...x, annualIncome: n } : x)))
                  }
                  currency={profile.currency}
                  privacy={privacy}
                />
              </Field>
              <Field label="Savings rate (%)">
                <TextInput
                  type="number"
                  min={0}
                  max={90}
                  step={1}
                  value={Math.round(m.savingsRate * 100)}
                  onChange={(e) =>
                    setMembers(
                      profile.members.map((x) =>
                        x.id === m.id ? { ...x, savingsRate: Number(e.target.value) / 100 } : x,
                      ),
                    )
                  }
                />
              </Field>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
