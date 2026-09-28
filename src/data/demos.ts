import { DEFAULT_FEE } from "@/engine/types";
import type { ClientProfile } from "@/engine/types";

export const DEMO_CLIENTS: ClientProfile[] = [
  {
    id: "demo-emilie",
    name: "Emilie Voss",
    currency: "NOK",
    members: [
      {
        id: "demo-emilie-m1",
        name: "Emilie Voss",
        age: 31,
        retirementAge: 65,
        annualIncome: 920_000,
        savingsRate: 0.26,
      },
    ],
    currentAssets: 1_150_000,
    goals: [
      {
        id: "demo-emilie-g-ret",
        type: "retirement_income",
        name: "Retirement income",
        targetAmount: 480_000,
        year: 2060,
        priority: 1,
      },
      {
        id: "demo-emilie-g-home",
        type: "home",
        name: "Oslo apartment (equity)",
        targetAmount: 1_600_000,
        year: 2031,
        priority: 1,
      },
      {
        id: "demo-emilie-g-leg",
        type: "legacy",
        name: "Bequest",
        targetAmount: 2_500_000,
        year: 2090,
        priority: 3,
      },
    ],
    answers: [4, 5, 4, 4, 5, 4, 5, 4, 3, 3, 4, 5],
    fee: DEFAULT_FEE,
    seed: 11001,
  },
  {
    id: "demo-ward",
    name: "James & Priya Ward",
    currency: "USD",
    members: [
      {
        id: "demo-ward-m1",
        name: "James Ward",
        age: 58,
        retirementAge: 66,
        annualIncome: 185_000,
        savingsRate: 0.18,
      },
      {
        id: "demo-ward-m2",
        name: "Priya Ward",
        age: 56,
        retirementAge: 65,
        annualIncome: 120_000,
        savingsRate: 0.2,
      },
    ],
    currentAssets: 2_150_000,
    goals: [
      {
        id: "demo-ward-g-ret",
        type: "retirement_income",
        name: "Retirement income",
        targetAmount: 105_000,
        year: 2034,
        priority: 1,
      },
      {
        id: "demo-ward-g-edu",
        type: "education",
        name: "Grandchild education",
        targetAmount: 180_000,
        year: 2029,
        priority: 2,
      },
      {
        id: "demo-ward-g-home",
        type: "home",
        name: "Coastal house (equity)",
        targetAmount: 400_000,
        year: 2028,
        priority: 2,
      },
      {
        id: "demo-ward-g-leg",
        type: "legacy",
        name: "Bequest",
        targetAmount: 750_000,
        year: 2055,
        priority: 3,
      },
    ],
    answers: [3, 3, 3, 3, 3, 3, 3, 4, 4, 3, 3, 3],
    fee: 0.008,
    seed: 22002,
  },
  {
    id: "demo-ingrid",
    name: "Ingrid Solberg",
    currency: "EUR",
    members: [
      {
        id: "demo-ingrid-m1",
        name: "Ingrid Solberg",
        age: 73,
        retirementAge: 67,
        annualIncome: 0,
        savingsRate: 0,
      },
    ],
    currentAssets: 1_850_000,
    goals: [
      {
        id: "demo-ingrid-g-ret",
        type: "retirement_income",
        name: "Retirement spending",
        targetAmount: 72_000,
        year: 2026,
        priority: 1,
      },
      {
        id: "demo-ingrid-g-edu",
        type: "education",
        name: "Gift to niece",
        targetAmount: 50_000,
        year: 2028,
        priority: 2,
      },
      {
        id: "demo-ingrid-g-leg",
        type: "legacy",
        name: "Bequest",
        targetAmount: 400_000,
        year: 2048,
        priority: 2,
      },
    ],
    answers: [3, 3, 3, 3, 3, 3, 1, 2, 3, 2, 2, 2],
    fee: 0.006,
    seed: 33003,
  },
];

export const DEMO_BLURBS: Record<string, string> = {
  "demo-emilie": "Young professional · Oslo · long horizon, home purchase in five years.",
  "demo-ward": "Pre-retiree couple · mixed goals, seven to ten years to work-optional.",
  "demo-ingrid": "Retiree · drawing a real spending rate, protecting a bequest.",
};

export function blankProfile(): ClientProfile {
  return {
    id: "mydata",
    name: "My household",
    currency: "NOK",
    members: [
      {
        id: "mydata-m1",
        name: "Me",
        age: 40,
        retirementAge: 65,
        annualIncome: 0,
        savingsRate: 0.15,
      },
    ],
    currentAssets: 0,
    goals: [],
    answers: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    fee: DEFAULT_FEE,
    seed: 44004,
  };
}

export function cloneProfile(p: ClientProfile): ClientProfile {
  return structuredClone(p);
}
