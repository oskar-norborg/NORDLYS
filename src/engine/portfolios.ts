import { cholesky } from "./matrix.ts";
import type { CapitalMarketAssumptions, ModelPortfolio } from "./types.ts";
import { FALLBACK_BOOKS, modelBooks } from "./books";
export { modelBooks, FALLBACK_BOOKS };

/**
 * Default capital-market assumptions (nominal, annual, arithmetic).
 * Correlation is constructed to be well-conditioned SPD so Cholesky is stable.
 */
export function defaultCma(): CapitalMarketAssumptions {
  return {
    mu: [0.078, 0.082, 0.085, 0.038, 0.062, 0.028],
    vol: [0.15, 0.165, 0.185, 0.055, 0.125, 0.008],
    corr: [
      [1.0, 0.82, 0.78, 0.12, 0.52, 0.05],
      [0.82, 1.0, 0.68, 0.08, 0.46, 0.03],
      [0.78, 0.68, 1.0, 0.1, 0.4, 0.04],
      [0.12, 0.08, 0.1, 1.0, 0.22, 0.18],
      [0.52, 0.46, 0.4, 0.22, 1.0, 0.06],
      [0.05, 0.03, 0.04, 0.18, 0.06, 1.0],
    ],
    inflation: 0.025,
  };
}

export function bookForAnswers(answers: number[], cma?: CapitalMarketAssumptions): ModelPortfolio {
  const books = cma ? modelBooks(cma) : MODEL_PORTFOLIOS;
  const avg = answers.reduce((a, b) => a + b, 0) / Math.max(answers.length, 1);
  const level = Math.max(1, Math.min(5, Math.round(avg)));
  const found = books.find((b) => b.riskLevel === level);
  return found ?? books[2] ?? FALLBACK_BOOKS[2]!;
}

/** Optimizer-derived books on the default CMA. Live CMA uses `modelBooks(cma)`. */
export const MODEL_PORTFOLIOS: ModelPortfolio[] = modelBooks(defaultCma());

export function defaultWhatIf(fee = 0.0075) {
  return {
    extraSavingsPts: 0,
    retireLaterYears: 0,
    riskOverride: null as number | null,
    fee,
    rebalance: "monthly" as const,
  };
}

export function symmetrizeCorr(corr: number[][]): number[][] {
  const n = corr.length;
  const out = corr.map((row) => row.slice());
  for (let i = 0; i < n; i++) {
    out[i]![i] = 1;
    for (let j = i + 1; j < n; j++) {
      const v = 0.5 * ((out[i]![j] ?? 0) + (out[j]![i] ?? 0));
      out[i]![j] = v;
      out[j]![i] = v;
    }
  }
  void cholesky;
  return out;
}
