import { runMonteCarlo } from "./montecarlo";
import type { SimInput } from "./types";

function asF64(x: ArrayLike<number> | Float64Array): Float64Array {
  return x instanceof Float64Array ? x : new Float64Array(x);
}

self.onmessage = (e: MessageEvent<{ id: number; input: SimInput }>) => {
  const { id, input } = e.data;
  try {
    const result = runMonteCarlo({
      ...input,
      contribution: asF64(input.contribution),
      withdrawal: asF64(input.withdrawal),
    });
    self.postMessage({ id, ok: true as const, result });
  } catch (err) {
    self.postMessage({
      id,
      ok: false as const,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
