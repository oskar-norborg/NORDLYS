/** Shared domain types for NORDLYS. Later stages (portfolio, risk, options, backtest) extend these. */

export const ASSET_IDS = [
  "global_eq",
  "us_eq",
  "nordic_eq",
  "bonds",
  "real_estate",
  "cash",
] as const;

export type AssetId = (typeof ASSET_IDS)[number];

export const ASSET_LABELS: Record<AssetId, string> = {
  global_eq: "Global equities",
  us_eq: "US equities",
  nordic_eq: "Nordic equities",
  bonds: "Bonds",
  real_estate: "Real estate",
  cash: "Cash",
};

export const ASSET_SHORT: Record<AssetId, string> = {
  global_eq: "Glbl",
  us_eq: "US",
  nordic_eq: "Nord",
  bonds: "Bond",
  real_estate: "RE",
  cash: "Cash",
};

export type CurrencyCode = "NOK" | "USD" | "EUR";

export type GoalType = "retirement_income" | "home" | "education" | "legacy";

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  retirement_income: "Retirement income",
  home: "Home purchase",
  education: "Education",
  legacy: "Legacy",
};

export type RebalancePolicy = "monthly" | "none";
export type EngineMode = "assets" | "legacyShock";

export interface HouseholdMember {
  id: string;
  name: string;
  age: number;
  retirementAge: number;
  annualIncome: number;
  savingsRate: number;
}

export interface Goal {
  id: string;
  type: GoalType;
  name: string;
  targetAmount: number;
  year: number;
  priority: number;
}

export interface ClientProfile {
  id: string;
  name: string;
  currency: CurrencyCode;
  members: HouseholdMember[];
  currentAssets: number;
  goals: Goal[];
  answers: number[];
  fee: number;
  seed: number;
}

export interface CapitalMarketAssumptions {
  mu: number[];
  vol: number[];
  corr: number[][];
  inflation: number;
}

export interface ModelPortfolio {
  id: string;
  name: string;
  riskLevel: number;
  blurb: string;
  weights: number[];
  source?: "optimizer" | "fallback";
}

export interface WhatIf {
  extraSavingsPts: number;
  retireLaterYears: number;
  riskOverride: number | null;
  fee: number;
  rebalance: RebalancePolicy;
}

export interface LumpEvent {
  month: number;
  goalId: string;
  amount: number;
  priority: number;
}

export interface SimInput {
  seed: number;
  nPaths: number;
  nMonths: number;
  startWealth: number;
  weights: number[];
  mu: number[];
  vol: number[];
  corr: number[][];
  inflation: number;
  fee: number;
  contribution: Float64Array;
  withdrawal: Float64Array;
  lumps: LumpEvent[];
  retirementGoalId: string | null;
  legacyGoals: { goalId: string; amount: number }[];
  goalIds: string[];
  rebalance: RebalancePolicy;
  engine: EngineMode;
}

export interface GoalResult {
  goalId: string;
  successRate: number;
  medianShortfall: number;
  nFail: number;
}

export interface SimResult {
  nPaths: number;
  nMonths: number;
  nYears: number;
  startWealth: number;
  years: number[];
  p5: number[];
  p25: number[];
  p50: number[];
  p75: number[];
  p95: number[];
  medianTerminal: number;
  medianTerminalNoFee: number;
  feeDrag: number;
  feeDragPct: number;
  goals: GoalResult[];
  meanTerminal: number;
  portReturnMean: number;
  portReturnVol: number;
  assetReturnMean: number[];
  assetReturnVol: number[];
  nReturnObs: number;
  meanWeightsByYear: number[][];
  terminalAssets: Float64Array;
  nAssets: number;
  runtimeMs: number;
}

export const AS_OF_YEAR = 2026;
export const PLAN_END_AGE = 95;
export const N_PATHS = 10_000;
export const N_PATHS_PREVIEW = 2_000;
export const DEFAULT_FEE = 0.0075;
export const DEFAULT_SEED = 20260321;

export const RISK_LABELS: Record<number, string> = {
  1: "Conservative",
  2: "Moderately Conservative",
  3: "Balanced",
  4: "Growth",
  5: "Aggressive",
};
