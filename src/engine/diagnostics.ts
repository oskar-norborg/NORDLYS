import { identity, cholesky, matMul, transpose, maxAbsDiff } from "./matrix";
import { futureValue, relativeError, portfolioMoments } from "./finance";
import { createRng } from "./prng";
import { runMonteCarlo } from "./montecarlo";
import { defaultCma, MODEL_PORTFOLIOS } from "./portfolios";
import { bondShare, equityShare } from "./books";
import { finalRiskProfile } from "./risk";
import { buildSimInput } from "./schedule";
import { ASSET_LABELS, ASSET_IDS, N_PATHS } from "./types";
import type { SimInput } from "./types";
import { DEMO_CLIENTS } from "@/data/demos";
import { defaultWhatIf } from "@/data/storage";
import { runLedgerDiagnostics } from "./ledger/diagnostics";
import { runStage3Diagnostics } from "./stage3-diagnostics";
import { runPdfDiagnostics } from "./pdf/diagnostics";
import { runStage5Diagnostics } from "./backtest/diagnostics";
import { buildProposalPdf } from "./pdf/proposal";
import { runFuzzDiagnostics, timeImportN, timeParseNFile } from "./fuzz";


export interface DiagTest {
  id: string;
  group: string;
  name: string;
  pass: boolean;
  expected: string;
  actual: string;
}

function zeros(n: number): Float64Array {
  return new Float64Array(n);
}

function sim(partial: Partial<SimInput> & Pick<SimInput, "nMonths" | "nPaths" | "startWealth">): SimInput {
  const nMonths = partial.nMonths;
  return {
    seed: 7,
    weights: [1, 0, 0, 0, 0, 0],
    mu: [0.06, 0, 0, 0, 0, 0],
    vol: [0, 0, 0, 0, 0, 0],
    corr: identity(6),
    inflation: 0,
    fee: 0,
    contribution: zeros(nMonths),
    withdrawal: zeros(nMonths),
    lumps: [],
    retirementGoalId: null,
    legacyGoals: [],
    goalIds: [],
    rebalance: "monthly",
    engine: "assets",
    ...partial,
    nMonths,
  };
}

export function runDiagnostics(): DiagTest[] {
  const tests: DiagTest[] = [];

  const r = 0.06 / 12;
  const n = 240;
  const pv = 100_000;
  const pmt = 1500;
  const fv = futureValue(pv, r, n, pmt);
  const contrib = new Float64Array(n);
  contrib.fill(pmt);

  const simFv = runMonteCarlo(
    sim({
      nPaths: 12,
      nMonths: n,
      startWealth: pv,
      contribution: contrib,
      legacyGoals: [{ goalId: "L", amount: 0 }],
      goalIds: ["L"],
    }),
  );
  const rel = relativeError(simFv.medianTerminal, fv);
  tests.push({
    id: "a.fv",
    group: "a. Future value identity",
    name: "Zero-vol, zero-inflation terminal wealth matches FV = PV(1+r)^n + PMT((1+r)^n − 1)/r",
    pass: rel < 1e-6,
    expected: `rel err < 1e-6  (FV=${fv.toFixed(10)})`,
    actual: `rel err = ${rel.toExponential(4)}  (sim=${simFv.medianTerminal.toFixed(10)})`,
  });

  const below = runMonteCarlo(
    sim({
      nPaths: 20,
      nMonths: n,
      startWealth: pv,
      contribution: contrib,
      legacyGoals: [{ goalId: "L", amount: fv * 0.999 }],
      goalIds: ["L"],
    }),
  );
  tests.push({
    id: "a.success1",
    group: "a. Future value identity",
    name: "Success probability is exactly 1 when the legacy target is below the certain FV",
    pass: below.goals[0]!.successRate === 1,
    expected: "1",
    actual: String(below.goals[0]!.successRate),
  });

  const above = runMonteCarlo(
    sim({
      nPaths: 20,
      nMonths: n,
      startWealth: pv,
      contribution: contrib,
      legacyGoals: [{ goalId: "L", amount: fv * 1.001 }],
      goalIds: ["L"],
    }),
  );
  tests.push({
    id: "a.success0",
    group: "a. Future value identity",
    name: "Success probability is exactly 0 when the legacy target is above the certain FV",
    pass: above.goals[0]!.successRate === 0,
    expected: "0",
    actual: String(above.goals[0]!.successRate),
  });

  for (let t = 1; t <= 5; t++) {
    for (let c = 1; c <= 5; c++) {
      const got = finalRiskProfile(t, c);
      const exp = Math.min(t, c);
      tests.push({
        id: `b.${t}.${c}`,
        group: "b. Risk profile = min(tolerance, capacity)",
        name: `tolerance=${t}, capacity=${c}`,
        pass: got === exp,
        expected: String(exp),
        actual: String(got),
      });
    }
  }

  const cma = defaultCma();
  let cholErr = 0;
  let cholOk = true;
  let cholMsg = "";
  try {
    const L = cholesky(cma.corr);
    const recon = matMul(L, transpose(L));
    cholErr = maxAbsDiff(recon, cma.corr);
    cholOk = cholErr < 1e-10;
    cholMsg = `max |L Lᵀ − C| = ${cholErr.toExponential(4)}`;
  } catch (e) {
    cholOk = false;
    cholMsg = e instanceof Error ? e.message : String(e);
  }
  tests.push({
    id: "c.chol",
    group: "c. Cholesky reconstruction",
    name: "L Lᵀ equals the CMA correlation matrix",
    pass: cholOk,
    expected: "max abs error < 1e-10",
    actual: cholMsg,
  });

  const rngA = createRng(42);
  const rngB = createRng(42);
  const rngC = createRng(43);
  const seqA: string[] = [];
  const seqB: string[] = [];
  const seqC: string[] = [];
  for (let i = 0; i < 48; i++) {
    seqA.push(rngA.nextU64().toString());
    seqB.push(rngB.nextU64().toString());
    seqC.push(rngC.nextU64().toString());
  }
  const same = seqA.every((v, i) => v === seqB[i]);
  tests.push({
    id: "d.same",
    group: "d. Seeded PRNG",
    name: "Identical seed ⇒ identical xoshiro256** stream",
    pass: same,
    expected: "48/48 values match",
    actual: same ? "48/48 match" : `${seqA.filter((v, i) => v === seqB[i]).length}/48 match`,
  });
  const diff = seqA.some((v, i) => v !== seqC[i]);
  tests.push({
    id: "d.diff",
    group: "d. Seeded PRNG",
    name: "Different seeds ⇒ different streams",
    pass: diff,
    expected: "at least one mismatch in 48 values",
    actual: diff ? "streams differ" : "streams identical (fail)",
  });
  const vec = createRng(42).nextU64();
  const vecOk = vec === 0x15780b2e0c2ec716n;
  tests.push({
    id: "d.vector",
    group: "d. Seeded PRNG",
    name: "Seed 42 matches the SplitMix64 + xoshiro256** C reference",
    pass: vecOk,
    expected: "0x15780b2e0c2ec716",
    actual: `0x${vec.toString(16)}`,
  });

  const ladderBooks = MODEL_PORTFOLIOS;
  let ladderOk = ladderBooks.length === 5;
  const ladderNotes: string[] = [];
  for (let i = 0; i < ladderBooks.length; i++) {
    const w = ladderBooks[i]!.weights;
    const eq = equityShare(w);
    const bd = bondShare(w);
    const cash = w[5] ?? 0;
    const cashCap = i === 0 ? 0.1 : 0.05;
    if ((w[0] ?? 0) < 0.049) {
      ladderOk = false;
      ladderNotes.push(`${i}: global ${w[0]}`);
    }
    if ((w[1] ?? 0) <= 0 || (w[2] ?? 0) <= 0) {
      ladderOk = false;
      ladderNotes.push(`${i}: missing equity class`);
    }
    if ((w[2] ?? 0) > 0.3 + 1e-8) {
      ladderOk = false;
      ladderNotes.push(`${i}: nordic ${w[2]}`);
    }
    if (cash > cashCap + 1e-6) {
      ladderOk = false;
      ladderNotes.push(`${i}: cash ${cash}`);
    }
    if (i > 0) {
      const prevEq = equityShare(ladderBooks[i - 1]!.weights);
      const prevBd = bondShare(ladderBooks[i - 1]!.weights);
      if (!(eq > prevEq + 1e-6)) {
        ladderOk = false;
        ladderNotes.push(`${i}: equity ${eq} ! > ${prevEq}`);
      }
      if (!(bd < prevBd - 1e-6)) {
        ladderOk = false;
        ladderNotes.push(`${i}: bonds ${bd} ! < ${prevBd}`);
      }
    }
  }
  tests.push({
    id: "books.ladder",
    group: "Model books",
    name: "Equity share rises and bond share falls at every step; no book has 0% global or >30% Nordic",
    pass: ladderOk,
    expected: "20/40/60/80/95 ladder, bonds down, cash cap, all equity classes",
    actual: ladderOk
      ? ladderBooks.map((b) => `${b.name}:${b.source ?? "?"}:${(equityShare(b.weights) * 100).toFixed(0)}/${(bondShare(b.weights) * 100).toFixed(0)}`).join(" · ")
      : ladderNotes.join("; "),
  });

  const book = MODEL_PORTFOLIOS[2]!;
  const momentsNPaths = 800;
  const momentsMonths = 120;
  const moments = runMonteCarlo(
    sim({
      seed: 20260321,
      nPaths: momentsNPaths,
      nMonths: momentsMonths,
      startWealth: 1_000_000,
      weights: book.weights.slice(),
      mu: cma.mu.slice(),
      vol: cma.vol.slice(),
      corr: cma.corr.map((row) => row.slice()),
      rebalance: "monthly",
      engine: "assets",
    }),
  );
  const Nobs = moments.nReturnObs;
  const zCrit = 4;

  for (let i = 0; i < cma.mu.length; i++) {
    const muM = cma.mu[i]! / 12;
    const sigM = cma.vol[i]! / Math.sqrt(12);
    const seMean = sigM / Math.sqrt(Nobs);
    const seStd = sigM / Math.sqrt(2 * (Nobs - 1));
    const label = ASSET_LABELS[ASSET_IDS[i]!];
    tests.push({
      id: `e.mean.${i}`,
      group: "e. Engine per-asset returns vs CMA",
      name: `${label} monthly mean (N=${Nobs}, tol=4·σ/√N)`,
      pass: Math.abs(moments.assetReturnMean[i]! - muM) < zCrit * seMean,
      expected: `${muM.toFixed(6)} ± ${(zCrit * seMean).toExponential(3)}`,
      actual: moments.assetReturnMean[i]!.toFixed(6),
    });
    tests.push({
      id: `e.vol.${i}`,
      group: "e. Engine per-asset returns vs CMA",
      name: `${label} monthly vol (N=${Nobs}, tol=4·σ/√(2N))`,
      pass: Math.abs(moments.assetReturnVol[i]! - sigM) < zCrit * seStd,
      expected: `${sigM.toFixed(6)} ± ${(zCrit * seStd).toExponential(3)}`,
      actual: moments.assetReturnVol[i]!.toFixed(6),
    });
  }

  const port = portfolioMoments(book.weights, cma.mu, cma.vol, cma.corr);
  const muPortM = port.mu / 12;
  const sigPortM = port.vol / Math.sqrt(12);
  const seMeanP = sigPortM / Math.sqrt(Nobs);
  const seStdP = sigPortM / Math.sqrt(2 * (Nobs - 1));
  tests.push({
    id: "f.port.mean",
    group: "f. Rebalanced book vs w′μ, √(w′Σw)",
    name: "Monthly portfolio return mean, monthly rebalance",
    pass: Math.abs(moments.portReturnMean - muPortM) < zCrit * seMeanP,
    expected: `${muPortM.toFixed(6)} ± ${(zCrit * seMeanP).toExponential(3)}`,
    actual: moments.portReturnMean.toFixed(6),
  });
  tests.push({
    id: "f.port.vol",
    group: "f. Rebalanced book vs w′μ, √(w′Σw)",
    name: "Monthly portfolio return volatility, monthly rebalance",
    pass: Math.abs(moments.portReturnVol - sigPortM) < zCrit * seStdP,
    expected: `${sigPortM.toFixed(6)} ± ${(zCrit * seStdP).toExponential(3)}`,
    actual: moments.portReturnVol.toFixed(6),
  });

  const drift = runMonteCarlo(
    sim({
      seed: 1,
      nPaths: 8,
      nMonths: 36,
      startWealth: 600_000,
      weights: [1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6],
      mu: [0.3, 0, 0, 0, 0, 0],
      vol: [0, 0, 0, 0, 0, 0],
      rebalance: "none",
      engine: "assets",
    }),
  );
  const w0 = drift.meanWeightsByYear[0]![0]!;
  const wEnd = drift.meanWeightsByYear[drift.meanWeightsByYear.length - 1]![0]!;
  tests.push({
    id: "g.drift",
    group: "g. Weight drift without rebalancing",
    name: "Higher-return asset’s weight rises when holdings are left to drift",
    pass: wEnd > w0 + 0.05,
    expected: `w_end > w_0 + 0.05  (w_0=${w0.toFixed(4)})`,
    actual: `w_end=${wEnd.toFixed(4)}`,
  });

  const household = DEMO_CLIENTS[0]!;
  const whatIf = { ...defaultWhatIf(household.fee), rebalance: "monthly" as const };
  const demoInput = buildSimInput(household, cma, whatIf, N_PATHS);
  // JIT the kernel on the production function so the timed 10k is a steady-state run
  // (same as a planner worker that has already handled one job).
  const warm = runMonteCarlo({ ...demoInput, nPaths: 32, engine: "assets", rebalance: "monthly" });
  const demoAssets = runMonteCarlo({ ...demoInput, engine: "assets", rebalance: "monthly" });
  const runtimeMs = demoAssets.runtimeMs;
  const mcBudget = Math.max(1000, warm.runtimeMs * (N_PATHS / 32) * 2.5);
  const demoShock = runMonteCarlo({ ...demoInput, engine: "legacyShock", rebalance: "monthly" });

  const retId = household.goals[0]?.id;
  const pNew = demoAssets.goals.find((g) => g.goalId === retId)?.successRate ?? demoAssets.goals[0]?.successRate ?? 0;
  const pOld = demoShock.goals.find((g) => g.goalId === retId)?.successRate ?? demoShock.goals[0]?.successRate ?? 0;
  const nP = N_PATHS;
  const seDiff = Math.sqrt((pNew * (1 - pNew) + pOld * (1 - pOld)) / nP);
  const tol = 4 * Math.max(seDiff, 1 / nP);
  tests.push({
    id: "h.agree",
    group: "h. Assets engine vs legacy single-shock",
    name: `${household.name} retirement success, monthly rebalance, ${nP} paths`,
    pass: Math.abs(pNew - pOld) < tol,
    expected: `|Δ| < ${tol.toExponential(3)}  (legacy ${pOld.toFixed(4)})`,
    actual: `assets ${pNew.toFixed(4)}  (Δ=${(pNew - pOld).toFixed(4)})`,
  });

  tests.push({
    id: "i.runtime",
    group: "i. Runtime",
    name: `10,000-path household simulation finishes within the same-run budget`,
    pass: runtimeMs < mcBudget,
    expected: `< ${mcBudget.toFixed(0)} ms (max of 1000 ms and 2.5× linear from a 32-path baseline of ${warm.runtimeMs.toFixed(1)} ms)`,
    actual: `${runtimeMs.toFixed(1)} ms`,
  });

  const tPdf = typeof performance !== "undefined" ? performance.now() : Date.now();
  const pdfBuilt = buildProposalPdf({
    profile: household,
    cma,
    whatIf,
    privacy: false,
    result: demoAssets,
    baseline: demoAssets,
    nPaths: N_PATHS,
    asOf: "2026-09-10",
  });
  const pdfMs = (typeof performance !== "undefined" ? performance.now() : Date.now()) - tPdf;
  tests.push({
    id: "j.pdf",
    group: "j. Performance",
    name: "Proposal PDF from a precomputed 10,000-path result finishes within the same-run budget",
    pass: pdfMs < Math.max(500, runtimeMs * 0.5) && pdfBuilt.bytes.length > 800,
    expected: `< ${Math.max(500, runtimeMs * 0.5).toFixed(0)} ms (max of 500 ms and half the 10k runtime)`,
    actual: `${pdfMs.toFixed(1)} ms · ${pdfBuilt.bytes.length} bytes`,
  });

  const impBase = timeImportN(2_000);
  const imp = timeImportN(100_000);
  const importBudget = Math.max(2000, impBase.ms * 50 * 3);
  tests.push({
    id: "j.import100k",
    group: "j. Performance",
    name: "Importing 100,000 Nordnet rows finishes within the same-run budget",
    pass: imp.ms < importBudget && imp.created === 100_000,
    expected: `< ${importBudget.toFixed(0)} ms, 100000 created (baseline 2k = ${impBase.ms.toFixed(1)} ms)`,
    actual: `${imp.ms.toFixed(1)} ms · created ${imp.created} · read ${imp.rowsRead}`,
  });

  const parseBase = timeParseNFile(2_000);
  const parsed = timeParseNFile(100_000);
  const parseBudget = Math.max(2000, parseBase.ms * 50 * 3);
  tests.push({
    id: "j.parse100k",
    group: "j. Performance",
    name: "Parsing a 100,000-row Nordnet file finishes within the same-run budget",
    pass: parsed.ms < parseBudget && parsed.rowsRead === 100_000,
    expected: `< ${parseBudget.toFixed(0)} ms, 100000 rows (baseline 2k = ${parseBase.ms.toFixed(1)} ms)`,
    actual: `${parsed.ms.toFixed(1)} ms · rows ${parsed.rowsRead} · ${parsed.bytes} bytes`,
  });

  tests.push(...runLedgerDiagnostics());
  tests.push(...runStage3Diagnostics());
  tests.push(...runPdfDiagnostics());
  tests.push(...runStage5Diagnostics());
  tests.push(...runFuzzDiagnostics());

  return tests;
}