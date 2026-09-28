import { useEffect, useMemo, useRef, useState } from "react";
import { assertCma } from "@/engine/portfolios";
import { buildSimInput } from "@/engine/schedule";
import { enqueueMonteCarlo } from "@/engine/mc-client";
import { N_PATHS, N_PATHS_PREVIEW } from "@/engine/types";
import type { SimResult } from "@/engine/types";
import { useAppStore } from "@/store/app-store";

export function useSimulation() {
  const profile = useAppStore((s) => s.profile);
  const cma = useAppStore((s) => s.cma);
  const whatIf = useAppStore((s) => s.whatIf);
  const simQuality = useAppStore((s) => s.simQuality);
  const [result, setResult] = useState<SimResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const gen = useRef(0);

  const cmaError = useMemo(() => assertCma(cma), [cma]);
  const nPaths = simQuality === "preview" ? N_PATHS_PREVIEW : N_PATHS;

  const input = useMemo(() => {
    if (cmaError) return null;
    return buildSimInput(profile, cma, whatIf, nPaths);
  }, [profile, cma, whatIf, cmaError, nPaths]);

  useEffect(() => {
    if (!input) {
      setError(cmaError);
      setRunning(false);
      return;
    }
    setError(null);
    const id = ++gen.current;
    setRunning(true);
    setProgress(0);
    const delay = simQuality === "preview" ? 40 : 80;
    const handle = window.setTimeout(() => {
      setProgress(0.15);
      void enqueueMonteCarlo(input).then((res) => {
        if (gen.current !== id) return;
        if (res) setResult(res);
        setRunning(false);
        setProgress(1);
      });
    }, delay);
    return () => {
      window.clearTimeout(handle);
      gen.current++;
    };
  }, [input, cmaError, simQuality]);

  return { result, running, progress, error, input, nPaths };
}
