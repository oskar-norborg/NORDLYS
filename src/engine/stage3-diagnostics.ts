import type { DiagTest } from "./diagnostics";
import { relativeError } from "./finance";
import { bsmGreeks, bsmPrice, impliedVol, binomialPrice, mcOptionPrice } from "./options";
import { ledoitWolfCovariance } from "./cov";
import { defaultCmaBooksKkt } from "./optimize";
import { isPositiveDefinite } from "./matrix";
import { createRng } from "./prng";

export function runStage3Diagnostics(): DiagTest[] {
  const tests: DiagTest[] = [];

  const spot = { S: 100, K: 100, r: 0.05, vol: 0.2, T: 1, q: 0 } as const;
  const call = bsmPrice({ ...spot, type: "call" });
  const put = bsmPrice({ ...spot, type: "put" });
  tests.push({
    id: "3a.call",
    group: "3a. Black–Scholes–Merton",
    name: "ATM call S=K=100, r=5%, σ=20%, T=1, q=0 equals 10.4506",
    pass: Math.abs(call - 10.4506) < 1e-4,
    expected: "10.4506 ± 1e-4",
    actual: call.toFixed(8),
  });
  tests.push({
    id: "3a.put",
    group: "3a. Black–Scholes–Merton",
    name: "ATM put under the same inputs equals 5.5735",
    pass: Math.abs(put - 5.5735) < 1e-4,
    expected: "5.5735 ± 1e-4",
    actual: put.toFixed(8),
  });

  const strikes = [80, 90, 100, 110, 120];
  const mats = [0.25, 0.5, 1, 2];
  let ivFail = 0;
  let ivMax = 0;
  let ivN = 0;
  for (const K of strikes) {
    for (const T of mats) {
      const vol = 0.2;
      const price = bsmPrice({ S: 100, K, r: 0.05, vol, T, q: 0, type: "call" });
      const iv = impliedVol({ S: 100, K, r: 0.05, T, q: 0, type: "call" }, price, 0.3);
      ivN += 1;
      if (!iv.ok) {
        ivFail += 1;
        continue;
      }
      const err = Math.abs(iv.vol - vol);
      ivMax = Math.max(ivMax, err);
      if (err > 1e-6) ivFail += 1;
    }
  }
  tests.push({
    id: "3b.iv",
    group: "3b. Implied volatility",
    name: "Newton/bisection recovers σ=0.20 on a 5×4 strike–maturity grid within 1e-6",
    pass: ivFail === 0,
    expected: `${ivN} points, |Δσ| < 1e-6`,
    actual: `fail ${ivFail}/${ivN}, max |Δσ|=${ivMax.toExponential(3)}`,
  });

  const g = bsmGreeks({ ...spot, type: "call" });
  const bump = (key: "S" | "vol" | "T" | "r", h: number) => {
    const up = bsmPrice({ ...spot, type: "call", [key]: spot[key] + h });
    const dn = bsmPrice({ ...spot, type: "call", [key]: spot[key] - h });
    return (up - dn) / (2 * h);
  };
  const fdDelta = bump("S", 1e-3);
  const fdVega = bump("vol", 1e-5);
  const fdRho = bump("r", 1e-6);
  const fdTheta = -bump("T", 1e-5);
  const hS = 1e-2;
  const fdGamma =
    (bsmPrice({ ...spot, type: "call", S: spot.S + hS }) -
      2 * bsmPrice({ ...spot, type: "call" }) +
      bsmPrice({ ...spot, type: "call", S: spot.S - hS })) /
    (hS * hS);
  const greeks: [string, number, number][] = [
    ["delta", g.delta, fdDelta],
    ["gamma", g.gamma, fdGamma],
    ["vega", g.vega, fdVega],
    ["theta", g.theta, fdTheta],
    ["rho", g.rho, fdRho],
  ];
  for (const [name, analytic, fd] of greeks) {
    const rel = relativeError(analytic, fd);
    tests.push({
      id: `3c.${name}`,
      group: "3c. Analytic Greeks vs finite differences",
      name: `${name} matches a central difference within 1e-4 relative`,
      pass: rel < 1e-4,
      expected: `rel < 1e-4  (fd=${fd.toPrecision(8)})`,
      actual: `analytic=${analytic.toPrecision(8)}  rel=${rel.toExponential(3)}`,
    });
  }

  const amerPut = binomialPrice({ ...spot, type: "put" }, 200, "american");
  tests.push({
    id: "3d.put",
    group: "3d. American vs European",
    name: "American put (CRR 200) is at least the European put on the same tree",
    pass: amerPut.price + 1e-12 >= amerPut.european,
    expected: "American ≥ European",
    actual: `AM ${amerPut.price.toFixed(6)}  EU ${amerPut.european.toFixed(6)}`,
  });
  const amerCall = binomialPrice({ ...spot, type: "call" }, 250, "american");
  const euroCall = bsmPrice({ ...spot, type: "call" });
  const callGap = Math.abs(amerCall.price - euroCall);
  tests.push({
    id: "3d.call",
    group: "3d. American vs European",
    name: "American call with q=0 converges to the European BSM price (never exercise)",
    pass: callGap < 0.02 && amerCall.price + 1e-10 >= amerCall.european - 1e-10,
    expected: "|AM − BSM| < 0.02 and AM ≥ tree-EU",
    actual: `AM ${amerCall.price.toFixed(6)}  BSM ${euroCall.toFixed(6)}  Δ=${callGap.toExponential(3)}`,
  });

  const mc = mcOptionPrice({ ...spot, type: "call" }, 20_000, 20260321);
  const seOk = Math.abs(mc.priceCv - euroCall) < 3 * Math.max(mc.seCv, 1e-12);
  const cut = mc.seCv <= 0.5 * mc.se + 1e-15;
  tests.push({
    id: "3e.mc",
    group: "3e. Monte Carlo option",
    name: "Antithetic+CV price is within 3 SE of BSM",
    pass: seOk,
    expected: `|Δ| < 3·SE  (BSM ${euroCall.toFixed(4)})`,
    actual: `CV ${mc.priceCv.toFixed(4)}  SE ${mc.seCv.toExponential(3)}  Δ=${(mc.priceCv - euroCall).toFixed(4)}`,
  });
  tests.push({
    id: "3e.cv",
    group: "3e. Monte Carlo option",
    name: "Control variate (discounted S_T) cuts standard error by at least 50%",
    pass: cut,
    expected: "SE_cv ≤ 0.5 · SE_antithetic",
    actual: `SE ${mc.se.toExponential(3)} → ${mc.seCv.toExponential(3)}  (${(100 * mc.seReduction).toFixed(1)}% cut)`,
  });

  const kktPack = defaultCmaBooksKkt();
  tests.push({
    id: "3f.sum",
    group: "3f. Optimizer KKT",
    name: "Min-variance weights sum to 1",
    pass: Math.abs(kktPack.sumW - 1) < 1e-10,
    expected: "1 ± 1e-10",
    actual: kktPack.sumW.toFixed(12),
  });
  tests.push({
    id: "3f.cons",
    group: "3f. Optimizer KKT",
    name: "Long-only, per-asset caps and group caps all hold",
    pass: kktPack.constraintsOk,
    expected: "all w≥0, w≤cap, group sums ≤ cap",
    actual: kktPack.constraintMsg,
  });
  tests.push({
    id: "3f.kkt",
    group: "3f. Optimizer KKT",
    name: "KKT residuals of the min-variance book below 1e-8",
    pass: kktPack.kkt.max < 1e-8,
    expected: "max residual < 1e-8",
    actual: `stat ${kktPack.kkt.stationarity.toExponential(3)}, prim ${kktPack.kkt.primalEq.toExponential(3)}, ineq ${kktPack.kkt.primalIneq.toExponential(3)}, comp ${kktPack.kkt.complementary.toExponential(3)}, dual ${kktPack.kkt.dual.toExponential(3)}`,
  });

  const rng = createRng(99);
  const T = 80;
  const n = 6;
  const R: number[][] = [];
  for (let t = 0; t < T; t++) {
    const row: number[] = [];
    for (let i = 0; i < n; i++) row.push(0.01 * rng.gaussian());
    R.push(row);
  }
  const lw = ledoitWolfCovariance(R);
  tests.push({
    id: "3g.lw",
    group: "3g. Ledoit–Wolf",
    name: "Ledoit–Wolf covariance is positive definite",
    pass: lw.pd && isPositiveDefinite(lw.cov),
    expected: "Cholesky succeeds, δ in [0,1]",
    actual: `pd=${lw.pd} δ=${lw.delta.toFixed(4)}`,
  });

  return tests;
}
