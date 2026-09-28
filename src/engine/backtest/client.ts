import { compile } from "../strategy/compile";
import { runBacktest } from "./engine";
import { runSweep } from "./sweep";
import { runWalkForward, type WalkForwardSpec } from "./walkforward";
import type { AssetSeries, BacktestConfig, BacktestResult, FxPoint, SweepResult, WalkForwardResult } from "./types";
import type { WorkerReq, WorkerRes } from "./backtest.worker";

type Pending = {
  id: number;
  resolve: (v: WorkerRes) => void;
  onProgress?: (done: number, total: number, label: string) => void;
};

let seq = 1;
let workerFailed = false;
const pool: Worker[] = [];
const pending = new Map<number, Pending>();

function poolSize(): number {
  if (typeof navigator === "undefined") return 1;
  return Math.max(1, Math.min(4, navigator.hardwareConcurrency || 2));
}

function spawn(): Worker | null {
  if (workerFailed || typeof window === "undefined" || typeof Worker === "undefined") return null;
  try {
    const w = new Worker(new URL("./backtest.worker.ts", import.meta.url), { type: "module" });
    w.onmessage = (e: MessageEvent<WorkerRes>) => {
      const msg = e.data;
      const job = pending.get(msg.id);
      if (!job) return;
      if (msg.ok && msg.kind === "progress") {
        job.onProgress?.(msg.done, msg.total, msg.label);
        return;
      }
      pending.delete(msg.id);
      job.resolve(msg);
    };
    w.onerror = () => {
      workerFailed = true;
    };
    return w;
  } catch {
    workerFailed = true;
    return null;
  }
}

function getPool(): Worker[] {
  if (workerFailed) return [];
  while (pool.length < poolSize()) {
    const w = spawn();
    if (!w) break;
    pool.push(w);
  }
  return pool;
}

function post(req: WorkerReq, onProgress?: Pending["onProgress"]): Promise<WorkerRes> {
  const workers = getPool();
  if (!workers.length) {
    return Promise.resolve(runLocal(req, onProgress));
  }
  const w = workers[req.id % workers.length]!;
  return new Promise((resolve) => {
    pending.set(req.id, { id: req.id, resolve, onProgress });
    w.postMessage(req);
  });
}

function runLocal(req: WorkerReq, onProgress?: Pending["onProgress"]): WorkerRes {
  try {
    const program = compile(req.source);
    if (req.kind === "backtest") {
      return { id: req.id, ok: true, kind: "backtest", result: runBacktest(program, req.series, req.fx, req.config) };
    }
    if (req.kind === "sweep") {
      const result = runSweep(program, req.series, req.fx, req.config, req.grid, (done, total) =>
        onProgress?.(done, total, "sweep"),
      );
      return { id: req.id, ok: true, kind: "sweep", result };
    }
    const result = runWalkForward(program, req.series, req.fx, req.config, req.spec, (done, total) =>
      onProgress?.(done, total, "walk-forward"),
    );
    return { id: req.id, ok: true, kind: "walkforward", result };
  } catch (err) {
    return { id: req.id, ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function runBacktestJob(
  source: string,
  series: AssetSeries[],
  fx: FxPoint[],
  config: BacktestConfig,
): Promise<BacktestResult> {
  const id = ++seq;
  const res = await post({ id, kind: "backtest", source, series, fx, config });
  if (!res.ok) throw new Error(res.error);
  if (res.kind !== "backtest") throw new Error("Unexpected worker result");
  return res.result;
}

export async function runSweepJob(
  source: string,
  series: AssetSeries[],
  fx: FxPoint[],
  config: BacktestConfig,
  grid: Record<string, number[]>,
  onProgress?: (done: number, total: number) => void,
): Promise<SweepResult> {
  const id = ++seq;
  const res = await post({ id, kind: "sweep", source, series, fx, config, grid }, (d, t) => onProgress?.(d, t));
  if (!res.ok) throw new Error(res.error);
  if (res.kind !== "sweep") throw new Error("Unexpected worker result");
  return res.result;
}

export async function runWalkForwardJob(
  source: string,
  series: AssetSeries[],
  fx: FxPoint[],
  config: BacktestConfig,
  spec: WalkForwardSpec,
  onProgress?: (done: number, total: number) => void,
): Promise<WalkForwardResult> {
  const id = ++seq;
  const res = await post({ id, kind: "walkforward", source, series, fx, config, spec }, (d, t) => onProgress?.(d, t));
  if (!res.ok) throw new Error(res.error);
  if (res.kind !== "walkforward") throw new Error("Unexpected worker result");
  return res.result;
}
