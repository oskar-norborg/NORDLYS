import { useMemo, useState } from "react";
import { Panel, Field, SelectInput } from "@/components/ui/field";
import { bsm, impliedVol, binomialPrice, mcOptionPrice, type OptionType } from "@/engine/options";
import { formatPct } from "@/engine/format";
import { cn } from "@/lib/utils";

export function OptionsPage() {
  const [S, setS] = useState(100);
  const [K, setK] = useState(100);
  const [r, setR] = useState(0.05);
  const [q, setQ] = useState(0);
  const [vol, setVol] = useState(0.2);
  const [T, setT] = useState(1);
  const [type, setType] = useState<OptionType>("call");
  const [market, setMarket] = useState(10.4506);
  const [steps, setSteps] = useState(128);
  const [paths, setPaths] = useState(20_000);

  const input = { S, K, r, vol, T, q, type };
  const inputError =
    S <= 0
      ? "Spot must be greater than zero."
      : K <= 0
        ? "Strike must be greater than zero."
        : T <= 0
          ? "Maturity must be greater than zero."
          : vol < 0
            ? "Volatility cannot be negative."
            : null;
  const euro = useMemo(() => bsm(input), [S, K, r, vol, T, q, type]);
  const iv = useMemo(
    () => impliedVol({ S, K, r, T, q, type }, market, vol),
    [S, K, r, T, q, type, market, vol],
  );
  const tree = useMemo(() => binomialPrice(input, steps, "american"), [S, K, r, vol, T, q, type, steps]);
  const mc = useMemo(() => mcOptionPrice(input, paths, 20260321), [S, K, r, vol, T, q, type, paths]);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <div className="kicker mb-2">Derivatives</div>
        <h1 className="text-2xl font-medium tracking-tight">Options</h1>
        <p className="mt-1 text-sm text-muted">
          Black–Scholes–Merton with dividend yield, implied vol, CRR American tree, and seeded Monte Carlo.
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
          <Panel kicker="Contract" title="Inputs">
            <div className="flex flex-col gap-3">
              <Field label="Type">
                <SelectInput value={type} onChange={(e) => setType(e.target.value as OptionType)}>
                  <option value="call">Call</option>
                  <option value="put">Put</option>
                </SelectInput>
              </Field>
              <Num label="Spot" value={S} onChange={setS} step={1} />
              <Num label="Strike" value={K} onChange={setK} step={1} />
              <Num label="Rate %" value={r * 100} onChange={(v) => setR(v / 100)} step={0.1} />
              <Num label="Dividend %" value={q * 100} onChange={(v) => setQ(v / 100)} step={0.1} />
              <Num label="Volatility %" value={vol * 100} onChange={(v) => setVol(v / 100)} step={0.1} />
              <Num label="Maturity years" value={T} onChange={setT} step={0.05} />
            </div>
          </Panel>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {inputError ? (
            <p className="rounded-lg border border-danger/40 px-4 py-3 text-sm text-danger">{inputError}</p>
          ) : null}
          <Panel kicker="European" title="Black–Scholes–Merton">
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <Metric label="Price" value={euro.price.toFixed(4)} />
              <Metric label="d1" value={euro.d1.toFixed(4)} />
              <Metric label="d2" value={euro.d2.toFixed(4)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-5">
              <Metric label="Delta" value={euro.greeks.delta.toFixed(4)} />
              <Metric label="Gamma" value={euro.greeks.gamma.toFixed(4)} />
              <Metric label="Vega" value={euro.greeks.vega.toFixed(4)} hint="per 1.00 vol" />
              <Metric label="Theta" value={euro.greeks.theta.toFixed(4)} hint="per year" />
              <Metric label="Rho" value={euro.greeks.rho.toFixed(4)} />
            </div>
          </Panel>

          <Panel kicker="Invert" title="Implied volatility">
            <div className="grid gap-3 sm:grid-cols-2">
              <Num label="Quoted price" value={market} onChange={setMarket} step={0.01} />
              <div className="rounded-md border border-border p-3">
                <div className="text-xs text-muted">Implied vol</div>
                {iv.ok ? (
                  <div className="mt-1 font-mono text-lg">{formatPct(iv.vol, 2)}</div>
                ) : (
                  <p className="mt-1 text-sm text-danger">{iv.error}</p>
                )}
              </div>
            </div>
            <p className="mt-3 text-xs text-muted">
              Newton on vega, bisection fallback. Errors if the quote is below discounted intrinsic or above the
              no-arbitrage cap.
            </p>
          </Panel>

          <Panel kicker="American" title="Binomial tree">
            <div className="mb-3 max-w-xs">
              <Num label="Steps" value={steps} onChange={(v) => setSteps(Math.max(2, Math.round(v)))} step={1} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label="American" value={tree.price.toFixed(4)} />
              <Metric label="European (same tree)" value={tree.european.toFixed(4)} />
            </div>
            <p className="mt-3 text-xs text-muted">
              CRR. Early exercise is optimal for puts when the rate is positive; a call with no dividends is never
              exercised, so the American price sits on the European tree (and converges to BSM as N grows).
            </p>
          </Panel>

          <Panel kicker="Simulation" title="Monte Carlo">
            <div className="mb-3 max-w-xs">
              <Num label="Paths" value={paths} onChange={(v) => setPaths(Math.max(200, Math.round(v)))} step={1000} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label="Antithetic" value={mc.price.toFixed(4)} hint={`SE ${mc.se.toFixed(4)}`} />
              <Metric
                label="Control variate"
                value={mc.priceCv.toFixed(4)}
                hint={`SE ${mc.seCv.toFixed(4)} · ${(100 * mc.seReduction).toFixed(0)}% cut`}
              />
            </div>
            <p className="mt-3 text-xs text-muted">
              Terminal GBM, antithetic Z / -Z, control discounted spot with known mean. Seeded xoshiro256**. n={mc.n}.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Num({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step: number;
}) {
  return (
    <Field label={label}>
      <input
        className="field-input h-11"
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </Field>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={cn("rounded-md border border-border p-3")}>
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 font-mono text-lg tabular-nums">{value}</div>
      {hint ? <div className="mt-1 text-[11px] text-subtle">{hint}</div> : null}
    </div>
  );
}
