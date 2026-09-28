import { AS_OF_YEAR, N_PATHS, PLAN_END_AGE } from "./types";
import type { ClientProfile, CapitalMarketAssumptions, ModelPortfolio, SimInput, WhatIf } from "./types";
import { portfolioByRiskLevel } from "./portfolios";
import { profileFromAnswers } from "./risk";
import { clamp } from "./finance";

export function effectiveRiskLevel(profile: ClientProfile, whatIf: WhatIf): number {
  if (whatIf.riskOverride != null) return clamp(whatIf.riskOverride, 1, 5);
  return profileFromAnswers(profile.answers).profile;
}

export function effectivePortfolio(
  profile: ClientProfile,
  whatIf: WhatIf,
  cma?: CapitalMarketAssumptions,
): ModelPortfolio {
  return portfolioByRiskLevel(effectiveRiskLevel(profile, whatIf), cma);
}

export function horizonMonths(profile: ClientProfile): number {
  let maxYears = 1;
  for (const m of profile.members) {
    maxYears = Math.max(maxYears, PLAN_END_AGE - m.age);
  }
  return Math.max(12, Math.round(maxYears * 12));
}

export function buildSimInput(
  profile: ClientProfile,
  cma: CapitalMarketAssumptions,
  whatIf: WhatIf,
  nPaths = N_PATHS,
): SimInput {
  const nMonths = horizonMonths(profile);
  const extra = whatIf.extraSavingsPts / 100;
  const later = whatIf.retireLaterYears;
  const contribution = new Float64Array(nMonths);
  const withdrawal = new Float64Array(nMonths);

  const retireMonths: number[] = profile.members.map((m) => {
    const retireAge = Math.min(80, m.retirementAge + later);
    return Math.max(0, Math.round((retireAge - m.age) * 12));
  });

  for (let t = 0; t < nMonths; t++) {
    let c = 0;
    for (let i = 0; i < profile.members.length; i++) {
      const member = profile.members[i]!;
      if (t < retireMonths[i]!) {
        const rate = clamp(member.savingsRate + extra, 0, 0.9);
        c += (member.annualIncome * rate) / 12;
      }
    }
    contribution[t] = c;
  }

  const lastRetire = retireMonths.length === 0 ? 0 : Math.max(0, ...retireMonths);

  const retGoal = profile.goals.find((g) => g.type === "retirement_income");
  if (retGoal && retGoal.targetAmount > 0) {
    const monthly = retGoal.targetAmount / 12;
    for (let t = lastRetire; t < nMonths; t++) withdrawal[t] = monthly;
  }

  const lumps: SimInput["lumps"] = [];
  for (const g of profile.goals) {
    if (g.type !== "home" && g.type !== "education") continue;
    const raw = Math.round((g.year - AS_OF_YEAR) * 12);
    const month = Math.min(nMonths - 1, Math.max(0, raw));
    lumps.push({
      month,
      goalId: g.id,
      amount: g.targetAmount,
      priority: g.priority,
    });
  }

  const legacyGoals = profile.goals
    .filter((g) => g.type === "legacy")
    .map((g) => ({ goalId: g.id, amount: g.targetAmount }));

  const port = effectivePortfolio(profile, whatIf, cma);

  return {
    seed: profile.seed,
    nPaths,
    nMonths,
    startWealth: profile.currentAssets,
    weights: port.weights.slice(),
    mu: cma.mu.slice(),
    vol: cma.vol.slice(),
    corr: cma.corr.map((row) => row.slice()),
    inflation: cma.inflation,
    fee: whatIf.fee,
    contribution,
    withdrawal,
    lumps,
    retirementGoalId: retGoal?.id ?? null,
    legacyGoals,
    goalIds: profile.goals.map((g) => g.id),
    rebalance: whatIf.rebalance ?? "monthly",
    engine: "assets",
  };
}
