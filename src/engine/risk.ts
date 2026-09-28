import { clamp } from "./finance";
import { RISK_LABELS } from "./types";

export interface RiskQuestion {
  id: string;
  dimension: "tolerance" | "capacity";
  title: string;
  prompt: string;
  low: string;
  high: string;
  options: string[];
}

export const RISK_QUESTIONS: RiskQuestion[] = [
  {
    id: "t1",
    dimension: "tolerance",
    title: "A sharp decline",
    prompt: "If your portfolio fell 20% in a single year, you would…",
    low: "Sell everything",
    high: "Buy more",
    options: [
      "Sell all risk assets",
      "Sell a meaningful portion",
      "Hold and wait it out",
      "Rebalance by buying a little",
      "Add a substantial amount",
    ],
  },
  {
    id: "t2",
    dimension: "tolerance",
    title: "Return path",
    prompt: "Which 10-year path would you rather own?",
    low: "Steady and low",
    high: "Higher and uneven",
    options: [
      "About 3% every year, almost no dips",
      "About 5%, with a few mild down years",
      "About 7%, with occasional 15% declines",
      "About 9%, with a chance of a 25% decline",
      "About 11%, with a chance of a 40% decline",
    ],
  },
  {
    id: "t3",
    dimension: "tolerance",
    title: "Peak-to-trough",
    prompt: "Largest one-year decline you could accept without changing the plan:",
    low: "Almost none",
    high: "Very large",
    options: ["5% or less", "About 10%", "About 20%", "About 30%", "40% or more"],
  },
  {
    id: "t4",
    dimension: "tolerance",
    title: "Sleep",
    prompt: "How often would you check a volatile portfolio?",
    low: "Constantly, with anxiety",
    high: "Rarely, with ease",
    options: [
      "Daily, and it would bother me",
      "Several times a week",
      "Monthly, as a matter of course",
      "A few times a year",
      "At the annual review only",
    ],
  },
  {
    id: "t5",
    dimension: "tolerance",
    title: "Primary objective",
    prompt: "Your primary investment objective is to…",
    low: "Protect capital",
    high: "Maximise growth",
    options: [
      "Preserve capital above all",
      "Income and stability, some growth",
      "Balance growth and capital protection",
      "Grow wealth, accepting drawdowns",
      "Maximise long-term growth",
    ],
  },
  {
    id: "t6",
    dimension: "tolerance",
    title: "Experience",
    prompt: "How do you regard your experience with listed investments?",
    low: "None",
    high: "Extensive",
    options: [
      "None — this is new",
      "Limited, mostly cash and deposits",
      "Some funds or equity exposure",
      "Comfortable with a diversified portfolio",
      "Extensive, including stressed markets",
    ],
  },
  {
    id: "c1",
    dimension: "capacity",
    title: "Horizon",
    prompt: "When will you need a substantial portion of this portfolio?",
    low: "Very soon",
    high: "Decades away",
    options: [
      "Within 2 years",
      "2–5 years",
      "5–10 years",
      "10–20 years",
      "More than 20 years / not in my lifetime",
    ],
  },
  {
    id: "c2",
    dimension: "capacity",
    title: "Income stability",
    prompt: "Over the next five years, household earned income is…",
    low: "Fragile",
    high: "Very secure",
    options: [
      "Uncertain or ending soon",
      "Somewhat unstable",
      "Reasonably stable",
      "Stable with some upside",
      "Very secure (pension, tenure, or similar)",
    ],
  },
  {
    id: "c3",
    dimension: "capacity",
    title: "Reserves",
    prompt: "Emergency cash, in months of essential spending:",
    low: "None",
    high: "Two years+",
    options: ["Under 1 month", "1–3 months", "3–6 months", "6–12 months", "More than 12 months"],
  },
  {
    id: "c4",
    dimension: "capacity",
    title: "Concentration",
    prompt: "This portfolio as a share of household net worth:",
    low: "Almost all of it",
    high: "A small slice",
    options: ["More than 80%", "60–80%", "40–60%", "20–40%", "Under 20%"],
  },
  {
    id: "c5",
    dimension: "capacity",
    title: "Spending flexibility",
    prompt: "If markets are weak, could you reduce spending for a few years?",
    low: "No",
    high: "Easily",
    options: [
      "No — spending is rigid",
      "Only with difficulty",
      "Somewhat",
      "Yes, without much strain",
      "Easily — most spending is discretionary",
    ],
  },
  {
    id: "c6",
    dimension: "capacity",
    title: "Obligations",
    prompt: "Dependents and inflexible financial obligations:",
    low: "Heavy",
    high: "None",
    options: [
      "Heavy (high debt, several dependents)",
      "Material obligations",
      "Moderate, manageable",
      "Light",
      "None of note",
    ],
  },
];

export function scoreDimension(answers: number[]): number {
  if (answers.length === 0) return 3;
  const s = answers.reduce((a, b) => a + b, 0) / answers.length;
  return clamp(Math.round(s), 1, 5);
}

export function toleranceScore(answers: number[]): number {
  return scoreDimension(answers.slice(0, 6));
}

export function capacityScore(answers: number[]): number {
  return scoreDimension(answers.slice(6, 12));
}

/** Final risk profile is the lower of willingness and ability. */
export function finalRiskProfile(tolerance: number, capacity: number): number {
  return Math.min(tolerance, capacity);
}

export function profileFromAnswers(answers: number[]): {
  tolerance: number;
  capacity: number;
  profile: number;
  toleranceMean: number;
  capacityMean: number;
} {
  const tAns = answers.slice(0, 6);
  const cAns = answers.slice(6, 12);
  const tMean = tAns.length ? tAns.reduce((a, b) => a + b, 0) / tAns.length : 3;
  const cMean = cAns.length ? cAns.reduce((a, b) => a + b, 0) / cAns.length : 3;
  const tolerance = scoreDimension(tAns);
  const capacity = scoreDimension(cAns);
  return {
    tolerance,
    capacity,
    profile: finalRiskProfile(tolerance, capacity),
    toleranceMean: tMean,
    capacityMean: cMean,
  };
}

export function riskRationale(
  tolerance: number,
  capacity: number,
  profile: number,
): string {
  const tName = RISK_LABELS[tolerance] ?? String(tolerance);
  const cName = RISK_LABELS[capacity] ?? String(capacity);
  const pName = RISK_LABELS[profile] ?? String(profile);
  if (tolerance === capacity) {
    return `Willingness and ability both score ${tolerance} (${tName}). The recommended book is ${pName}.`;
  }
  if (capacity < tolerance) {
    return `You are willing to sit with ${tName} risk, but your circumstances (horizon, income security, reserves, and obligations) only support ${cName}. The book is set to the lower of the two: ${pName}.`;
  }
  return `Your finances could support ${cName} risk, but your stated comfort is ${tName}. We do not stretch past willingness, so the book is ${pName}.`;
}
