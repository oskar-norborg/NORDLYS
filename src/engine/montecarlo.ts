import { cholesky } from "./matrix";
import { percentileSorted } from "./finance";
import { mcKernelBytes } from "./mc-kernel-bytes";
import type { GoalResult, SimInput, SimResult } from "./types";

function sortCopy(col: Float64Array): Float64Array {
  const a = col.slice();
  a.sort();
  return a;
}

type WasmExports = {
  memory: WebAssembly.Memory;
  init_heap: () => number;
  reset_heap: () => void;
  alloc: (n: number) => number;
  run_paths: (
    n_paths: number,
    n_months: number,
    n_assets: number,
    n_goals: number,
    n_years: number,
    start_wealth: number,
    fee_factor: number,
    inf_step: number,
    mu_p: number,
    sig_p: number,
    rebalance: number,
    engine: number,
    seed: number,
    mu_m: number,
    vol_m: number,
    w: number,
    lflat: number,
    contribution: number,
    withdrawal: number,
    lump_off: number,
    lump_count: number,
    lump_gi: number,
    lump_amt: number,
    ret_gi: number,
    n_legacy: number,
    legacy_gi: number,
    legacy_amt: number,
    yearly: number,
    terminal: number,
    terminal_nf: number,
    terminal_assets: number,
    success_count: number,
    shortfall: number,
    sum_port_out: number,
    sum_port2_out: number,
    n_ret_out: number,
    sum_asset: number,
    sum_asset2: number,
    weight_sum: number,
  ) => void;
};

let wasm: WasmExports | null = null;

function getWasm(): WasmExports {
  if (wasm) return wasm;
  const raw = mcKernelBytes();
  const buf = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer;
  const mod = new WebAssembly.Module(buf);
  const inst = new WebAssembly.Instance(mod, {});
  const ex = inst.exports as unknown as WasmExports;
  if (ex.init_heap() !== 0) throw new Error("NORDLYS kernel memory init failed");
  wasm = ex;
  return ex;
}

function copyF64(src: ArrayLike<number>, dst: Float64Array): void {
  for (let i = 0; i < src.length; i++) dst[i] = src[i]!;
}

/**
 * Production Monte Carlo. Monthly steps, six-asset correlated returns via
 * Cholesky (unless engine === "legacyShock"), holdings-level wealth, optional
 * monthly rebalance, inflation, contributions, withdrawals, and advisory fee.
 *
 * The path loop runs in the bundled WASM kernel (native i64 xoshiro256**,
 * Acklam inverse-normal). Setup, Cholesky, and fan-chart statistics stay in JS
 * so Diagnostics and the planner share this function.
 */
export function runMonteCarlo(input: SimInput): SimResult {
  const k = getWasm();
  k.reset_heap();
  const buf = () => k.memory.buffer;

  const { nPaths, nMonths, mu, vol, corr, weights, fee, inflation, lumps, goalIds, retirementGoalId, legacyGoals } =
    input;
  const nA = mu.length;
  if (nA > 8) throw new Error("engine supports at most 8 assets");
  const nGoals = goalIds.length;
  if (nGoals > 16) throw new Error("engine supports at most 16 goals");
  const L = cholesky(corr);
  const nYears = Math.ceil(nMonths / 12);

  const goalIndex = new Map<string, number>();
  goalIds.forEach((id, i) => goalIndex.set(id, i));

  const lumpsByMonth: { gi: number; amount: number; priority: number }[][] = Array.from({ length: nMonths }, () => []);
  for (const lump of lumps) {
    if (lump.month < 0 || lump.month >= nMonths) continue;
    const gi = goalIndex.get(lump.goalId);
    if (gi === undefined) continue;
    lumpsByMonth[lump.month]!.push({ gi, amount: lump.amount, priority: lump.priority });
  }
  for (const list of lumpsByMonth) list.sort((a, b) => a.priority - b.priority);
  let nLumpEvents = 0;
  for (const list of lumpsByMonth) nLumpEvents += list.length;

  const retGi = retirementGoalId != null ? goalIndex.get(retirementGoalId) : undefined;
  const legacyIdx = legacyGoals
    .map((g) => {
      const gi = goalIndex.get(g.goalId);
      return gi === undefined ? null : { gi, amount: g.amount };
    })
    .filter((x): x is { gi: number; amount: number } => x !== null);

  function f64(n: number): { ptr: number; view: Float64Array } {
    const ptr = k.alloc(n * 8);
    return { ptr, view: new Float64Array(buf(), ptr, n) };
  }
  function i32(n: number): { ptr: number; view: Int32Array } {
    const ptr = k.alloc(n * 4);
    return { ptr, view: new Int32Array(buf(), ptr, n) };
  }

  const muM = f64(nA);
  const volM = f64(nA);
  const w = f64(nA);
  const Lflat = f64(nA * nA);
  for (let i = 0; i < nA; i++) {
    muM.view[i] = mu[i]! / 12;
    volM.view[i] = vol[i]! / Math.sqrt(12);
    w.view[i] = weights[i]!;
    for (let j = 0; j < nA; j++) Lflat.view[i * nA + j] = L[i]![j]!;
  }

  let muP = 0;
  const v = new Float64Array(nA);
  for (let i = 0; i < nA; i++) {
    muP += w.view[i]! * muM.view[i]!;
    v[i] = w.view[i]! * volM.view[i]!;
  }
  let sigP2 = 0;
  for (let j = 0; j < nA; j++) {
    let s = 0;
    for (let i = j; i < nA; i++) s += Lflat.view[i * nA + j]! * v[i]!;
    sigP2 += s * s;
  }

  const contribution = f64(nMonths);
  const withdrawal = f64(nMonths);
  copyF64(input.contribution, contribution.view);
  copyF64(input.withdrawal, withdrawal.view);

  const lumpOff = i32(nMonths);
  const lumpCount = i32(nMonths);
  const lumpGi = i32(Math.max(nLumpEvents, 1));
  const lumpAmt = f64(Math.max(nLumpEvents, 1));
  let cursor = 0;
  for (let m = 0; m < nMonths; m++) {
    const list = lumpsByMonth[m]!;
    lumpOff.view[m] = cursor;
    lumpCount.view[m] = list.length;
    for (const ev of list) {
      lumpGi.view[cursor] = ev.gi;
      lumpAmt.view[cursor] = ev.amount;
      cursor += 1;
    }
  }

  const nLegacy = legacyIdx.length;
  const legacyGi = i32(Math.max(nLegacy, 1));
  const legacyAmt = f64(Math.max(nLegacy, 1));
  for (let i = 0; i < nLegacy; i++) {
    legacyGi.view[i] = legacyIdx[i]!.gi;
    legacyAmt.view[i] = legacyIdx[i]!.amount;
  }

  const yearly = f64(nPaths * (nYears + 1));
  const terminal = f64(nPaths);
  const terminalNF = f64(nPaths);
  const terminalAssets = f64(nPaths * nA);
  const successCount = i32(Math.max(nGoals, 1));
  const shortfall = f64(Math.max(nPaths * nGoals, 1));
  const sumPort = f64(1);
  const sumPort2 = f64(1);
  const nRet = i32(1);
  const sumAsset = f64(nA);
  const sumAsset2 = f64(nA);
  const weightSum = f64((nYears + 1) * nA);

  const tKernel = performance.now();
  k.run_paths(
    nPaths,
    nMonths,
    nA,
    nGoals,
    nYears,
    input.startWealth,
    Math.pow(1 - fee, 1 / 12),
    Math.pow(1 + inflation, 1 / 12),
    muP,
    Math.sqrt(Math.max(sigP2, 0)),
    (input.rebalance ?? "monthly") === "monthly" ? 1 : 0,
    (input.engine ?? "assets") === "legacyShock" ? 1 : 0,
    input.seed >>> 0,
    muM.ptr,
    volM.ptr,
    w.ptr,
    Lflat.ptr,
    contribution.ptr,
    withdrawal.ptr,
    lumpOff.ptr,
    lumpCount.ptr,
    lumpGi.ptr,
    lumpAmt.ptr,
    retGi === undefined ? -1 : retGi,
    nLegacy,
    legacyGi.ptr,
    legacyAmt.ptr,
    yearly.ptr,
    terminal.ptr,
    terminalNF.ptr,
    terminalAssets.ptr,
    successCount.ptr,
    shortfall.ptr,
    sumPort.ptr,
    sumPort2.ptr,
    nRet.ptr,
    sumAsset.ptr,
    sumAsset2.ptr,
    weightSum.ptr,
  );
  const kernelMs = performance.now() - tKernel;

  const years: number[] = [];
  const p5: number[] = [];
  const p25: number[] = [];
  const p50: number[] = [];
  const p75: number[] = [];
  const p95: number[] = [];
  const col = new Float64Array(nPaths);
  const yearlyView = new Float64Array(buf(), yearly.ptr, nPaths * (nYears + 1));
  for (let yIdx = 0; yIdx <= nYears; yIdx++) {
    for (let p = 0; p < nPaths; p++) col[p] = yearlyView[p * (nYears + 1) + yIdx]!;
    const sorted = sortCopy(col);
    years.push(yIdx);
    p5.push(percentileSorted(sorted, 0.05));
    p25.push(percentileSorted(sorted, 0.25));
    p50.push(percentileSorted(sorted, 0.5));
    p75.push(percentileSorted(sorted, 0.75));
    p95.push(percentileSorted(sorted, 0.95));
  }

  const terminalView = new Float64Array(buf(), terminal.ptr, nPaths);
  const terminalNFView = new Float64Array(buf(), terminalNF.ptr, nPaths);
  const medianTerminal = percentileSorted(sortCopy(terminalView), 0.5);
  const medianTerminalNoFee = percentileSorted(sortCopy(terminalNFView), 0.5);
  const feeDrag = medianTerminalNoFee - medianTerminal;
  const feeDragPct = medianTerminalNoFee === 0 ? 0 : feeDrag / medianTerminalNoFee;

  const successView = new Int32Array(buf(), successCount.ptr, Math.max(nGoals, 1));
  const shortView = new Float64Array(buf(), shortfall.ptr, Math.max(nPaths * nGoals, 1));
  const failShortfalls: number[][] = Array.from({ length: nGoals }, () => []);
  for (let p = 0; p < nPaths; p++) {
    for (let g = 0; g < nGoals; g++) {
      const s = shortView[p * nGoals + g]!;
      if (s > 0) failShortfalls[g]!.push(s);
    }
  }

  const goals: GoalResult[] = input.goalIds.map((goalId, g) => {
    const fails = failShortfalls[g]!;
    return {
      goalId,
      successRate: nPaths === 0 ? 0 : successView[g]! / nPaths,
      medianShortfall: fails.length === 0 ? 0 : percentileSorted(fails.slice().sort((a, b) => a - b), 0.5),
      nFail: fails.length,
    };
  });

  let meanTerminal = 0;
  for (let i = 0; i < nPaths; i++) meanTerminal += terminalView[i]!;
  meanTerminal /= Math.max(nPaths, 1);

  const nRetVal = new Int32Array(buf(), nRet.ptr, 1)[0]!;
  const sumPortVal = new Float64Array(buf(), sumPort.ptr, 1)[0]!;
  const sumPort2Val = new Float64Array(buf(), sumPort2.ptr, 1)[0]!;
  const portReturnMean = nRetVal ? sumPortVal / nRetVal : 0;
  const portReturnVol =
    nRetVal > 1 ? Math.sqrt(Math.max(0, (sumPort2Val - nRetVal * portReturnMean * portReturnMean) / (nRetVal - 1))) : 0;

  const sumAssetView = new Float64Array(buf(), sumAsset.ptr, nA);
  const sumAsset2View = new Float64Array(buf(), sumAsset2.ptr, nA);
  const assetReturnMean: number[] = [];
  const assetReturnVol: number[] = [];
  for (let i = 0; i < nA; i++) {
    const m = nRetVal ? sumAssetView[i]! / nRetVal : 0;
    const vA = nRetVal > 1 ? Math.sqrt(Math.max(0, (sumAsset2View[i]! - nRetVal * m * m) / (nRetVal - 1))) : 0;
    assetReturnMean.push(m);
    assetReturnVol.push(vA);
  }

  const weightView = new Float64Array(buf(), weightSum.ptr, (nYears + 1) * nA);
  const meanWeightsByYear: number[][] = [];
  const denom = Math.max(nPaths, 1);
  for (let y = 0; y <= nYears; y++) {
    const row: number[] = [];
    for (let i = 0; i < nA; i++) row.push(weightView[y * nA + i]! / denom);
    meanWeightsByYear.push(row);
  }

  return {
    nPaths,
    nMonths,
    nYears,
    startWealth: input.startWealth,
    years,
    p5,
    p25,
    p50,
    p75,
    p95,
    medianTerminal,
    medianTerminalNoFee,
    feeDrag,
    feeDragPct,
    goals,
    meanTerminal,
    portReturnMean,
    portReturnVol,
    assetReturnMean,
    assetReturnVol,
    nReturnObs: nRetVal,
    meanWeightsByYear,
    terminalAssets: new Float64Array(new Float64Array(buf(), terminalAssets.ptr, nPaths * nA)),
    nAssets: nA,
    runtimeMs: kernelMs,
  };
}

export async function runMonteCarloAsync(
  input: SimInput,
  onProgress?: (done: number, total: number) => void,
  isCancelled?: () => boolean,
): Promise<SimResult | null> {
  if (isCancelled?.()) return null;
  onProgress?.(0, input.nPaths);
  const result = runMonteCarlo(input);
  if (isCancelled?.()) return null;
  onProgress?.(input.nPaths, input.nPaths);
  return result;
}

// Compile the kernel at module load so the first 10k-path run is not paying
// for WASM instantiation inside the timed window.
try {
  getWasm();
} catch {
  wasm = null;
}
