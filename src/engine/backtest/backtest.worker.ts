import { compile } from "../strategy/compile";
import { runBacktest } from "./engine";
import { runSweep } from "./sweep";
import { runWalkForward, type WalkForwardSpec } from "./walkforward";
import type { AssetSeries, BacktestConfig, FxPoint } from "./types";

export type WorkerReq =
  | {
      id: number;
      kind: "backtest";
      source: string;
      series: AssetSeries[];
      fx: FxPoint[];
      config: BacktestConfig;
    }
  | {
      id: number;
      kind: "sweep";
      source: string;
      series: AssetSeries[];
      fx: FxPoint[];
      config: BacktestConfig;
      grid: Record<string, number[]>;
    }
  | {
      id: number;
      kind: "walkforward";
      source: string;
      series: AssetSeries[];
      fx: FxPoint[];
      config: BacktestConfig;
      spec: WalkForwardSpec;
    };

export type WorkerRes =
  | { id: number; ok: true; kind: "backtest"; result: ReturnType<typeof runBacktest> }
  | { id: number; ok: true; kind: "sweep"; result: ReturnType<typeof runSweep> }
  | { id: number; ok: true; kind: "walkforward"; result: ReturnType<typeof runWalkForward> }
  | { id: number; ok: true; kind: "progress"; done: number; total: number; label: string }
  | { id: number; ok: false; error: string };

self.onmessage = (e: MessageEvent<WorkerReq>) => {
  const msg = e.data;
  try {
    const program = compile(msg.source);
    if (msg.kind === "backtest") {
      const result = runBacktest(program, msg.series, msg.fx, msg.config);
      const res: WorkerRes = { id: msg.id, ok: true, kind: "backtest", result };
      self.postMessage(res);
      return;
    }
    if (msg.kind === "sweep") {
      const result = runSweep(program, msg.series, msg.fx, msg.config, msg.grid, (done, total) => {
        const res: WorkerRes = { id: msg.id, ok: true, kind: "progress", done, total, label: "sweep" };
        self.postMessage(res);
      });
      const res: WorkerRes = { id: msg.id, ok: true, kind: "sweep", result };
      self.postMessage(res);
      return;
    }
    const result = runWalkForward(program, msg.series, msg.fx, msg.config, msg.spec, (done, total) => {
      const res: WorkerRes = { id: msg.id, ok: true, kind: "progress", done, total, label: "walk-forward" };
      self.postMessage(res);
    });
    const res: WorkerRes = { id: msg.id, ok: true, kind: "walkforward", result };
    self.postMessage(res);
  } catch (err) {
    const res: WorkerRes = {
      id: msg.id,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(res);
  }
};
