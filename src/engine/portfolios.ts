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
    inflation: 0.024,
  };
}

/** Optimizer-derived books on the default CMA. Live CMA uses `modelBooks(cma)`. */
export const MODEL_PORTFOLIOS: ModelPortfolio[] = modelBooks(defaultCma());

export function portfolioByRiskLevel(level: number, cma?: CapitalMarketAssumptions): ModelPortfolio {
  const books = cma ? modelBooks(cma) : MODEL_PORTFOLIOS;
  const found = books.find((p) => p.riskLevel === level);
  return found ?? books[2] ?? FALLBACK_BOOKS[2]!;
}

export function assertCma(cma: CapitalMarketAssumptions): string | null {
  const n = cma.mu.length;
  if (cma.vol.length !== n || cma.corr.length !== n) return "CMA dimensions do not match.";
  for (let i = 0; i < n; i++) {
    if (!(cma.vol[i]! >= 0)) return `Volatility for asset ${i} is negative.`;
    if (cma.corr[i]!.length !== n) return "Correlation matrix is not square.";
    if (Math.abs(cma.corr[i]![i]! - 1) > 1e-6) return "Correlation diagonal must be 1.";
    for (let j = 0; j < i; j++) {
      const a = cma.corr[i]![j]!;
      const b = cma.corr[j]![i]!;
      if (Math.abs(a - b) > 1e-9) return "Correlation matrix is not symmetric.";
      if (a < -1 || a > 1) return "Correlation out of [-1, 1].";
    }
  }
  if (!(cma.inflation > -0.05 && cma.inflation < 0.2)) return "Inflation is outside a plausible range.";
  try {
    cholesky(cma.corr);
  } catch {
    return "Correlation matrix is not positive definite.";
  }
  return null;
}

export function symmetrizeCorr(corr: number[][]): number[][] {
  const n = corr.length;
  const out = corr.map((row) => row.slice());
  for (let i = 0; i < n; i++) {
    out[i]![i] = 1;
    for (let j = 0; j < i; j++) {
      const v = out[j]![i]!;
      out[i]![j] = v;
    }
  }
  return out;
}
