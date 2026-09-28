import { runMonteCarlo } from "./montecarlo";
import type { SimInput, SimResult } from "./types";

type WorkerOk = { id: number; ok: true; result: SimResult };
type WorkerErr = { id: number; ok: false; error: string };

let worker: Worker | null = null;
let workerFailed = false;
let seq = 1;
let busy = false;
let pending: { id: number; input: SimInput; resolve: (r: SimResult | null) => void } | null = null;
let inflight: { id: number; resolve: (r: SimResult | null) => void } | null = null;

function getWorker(): Worker | null {
  if (workerFailed || typeof window === "undefined" || typeof Worker === "undefined") return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL("./montecarlo.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<WorkerOk | WorkerErr>) => {
      const msg = e.data;
      const job = inflight;
      inflight = null;
      busy = false;
      if (job && job.id === msg.id) {
        job.resolve(msg.ok ? msg.result : null);
      }
      pump();
    };
    worker.onerror = () => {
      workerFailed = true;
      worker = null;
      if (inflight) {
        inflight.resolve(null);
        inflight = null;
      }
      busy = false;
    };
    return worker;
  } catch {
    workerFailed = true;
    return null;
  }
}

function pump(): void {
  if (busy) return;
  const next = pending;
  if (!next) return;
  pending = null;
  const w = getWorker();
  if (!w) {
    next.resolve(runMonteCarlo(next.input));
    return;
  }
  busy = true;
  inflight = next;
  w.postMessage({ id: next.id, input: next.input });
}

/** Latest-job-wins. Stale runs are dropped. Falls back to the main thread. */
export function enqueueMonteCarlo(input: SimInput): Promise<SimResult | null> {
  const id = ++seq;
  return new Promise((resolve) => {
    if (pending) pending.resolve(null);
    pending = { id, input, resolve };
    const w = getWorker();
    if (!w) {
      pending = null;
      resolve(runMonteCarlo(input));
      return;
    }
    pump();
  });
}
