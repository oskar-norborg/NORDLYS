import type { CapitalMarketAssumptions, ClientProfile, WhatIf } from "@/engine/types";
import { DEFAULT_FEE } from "@/engine/types";
import { defaultCma } from "@/engine/portfolios";
import { blankProfile } from "./demos";
import type { CostMethod, ImportReport, LedgerBundle, Security, TxKind } from "@/engine/ledger/types";
import { emptyLedgerBundle } from "@/engine/ledger/pipeline";

const KEY = "nordlys.v1";

export interface Persisted {
  mode: "demo" | "mydata";
  privacy: boolean;
  demoId: string;
  mydata: ClientProfile;
  cma: CapitalMarketAssumptions;
  whatIf: WhatIf;
  mydataLedger?: LedgerBundle;
  typeMappings?: Record<string, TxKind>;
  costMethod?: CostMethod;
  benchmarkId?: string;
  securityMaster?: Record<string, Partial<Security>>;
}

export function defaultWhatIf(fee = DEFAULT_FEE): WhatIf {
  return {
    extraSavingsPts: 0,
    retireLaterYears: 0,
    riskOverride: null,
    fee,
    rebalance: "monthly",
  };
}

export function defaultPersisted(): Persisted {
  return {
    mode: "demo",
    privacy: false,
    demoId: "demo-emilie",
    mydata: blankProfile(),
    cma: defaultCma(),
    whatIf: defaultWhatIf(),
    mydataLedger: emptyLedgerBundle(),
    typeMappings: {},
    costMethod: "fifo",
    benchmarkId: "world",
    securityMaster: {},
  };
}

export function loadPersisted(): Persisted {
  const base = defaultPersisted();
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      mode: parsed.mode === "mydata" ? "mydata" : "demo",
      privacy: Boolean(parsed.privacy),
      demoId: typeof parsed.demoId === "string" ? parsed.demoId : base.demoId,
      mydata: { ...base.mydata, ...(parsed.mydata ?? {}) },
      cma: parsed.cma ? { ...base.cma, ...parsed.cma } : base.cma,
      whatIf: { ...base.whatIf, ...(parsed.whatIf ?? {}) },
      mydataLedger: parsed.mydataLedger
        ? {
            accountCurrency: "NOK",
            transactions: parsed.mydataLedger.transactions ?? [],
            securities: parsed.mydataLedger.securities ?? [],
            prices: parsed.mydataLedger.prices ?? [],
            fx: parsed.mydataLedger.fx ?? [],
            benchmarks: parsed.mydataLedger.benchmarks ?? [],
          }
        : emptyLedgerBundle(),
      typeMappings: parsed.typeMappings ?? {},
      costMethod: parsed.costMethod === "average" ? "average" : "fifo",
      benchmarkId: parsed.benchmarkId ?? "world",
      securityMaster: parsed.securityMaster ?? {},
    };
  } catch {
    return base;
  }
}

export function savePersisted(patch: Partial<Persisted>): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadPersisted();
    const merged: Persisted = { ...current, ...patch };
    window.localStorage.setItem(KEY, JSON.stringify(merged));
  } catch {
    /* quota / private mode */
  }
}

export type { ImportReport };
