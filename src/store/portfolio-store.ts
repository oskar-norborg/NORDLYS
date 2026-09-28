import { create } from "zustand";
import type {
  CostMethod,
  ImportReport,
  LedgerBundle,
  NordnetRow,
  Security,
  TxKind,
} from "@/engine/ledger/types";
import {
  emptyLedgerBundle,
  cloneLedger,
  importNordnetBuffer,
  applyReviewMapping,
} from "@/engine/ledger/pipeline";
import { parseNordnetBytes } from "@/engine/ledger/parse";
import { buildDemoLedger } from "@/engine/ledger/synthetic";
import { attachQuotes, parseFxCsv, parsePriceCsv, parseBenchmarkCsv } from "@/engine/ledger/prices";
import { loadPersisted, savePersisted } from "@/data/storage";
import { useAppStore } from "./app-store";
import { overlaySecurityMaster, withUserPatch, sanitizeLedger, sanitizeSecurityMaster } from "@/engine/ledger/securities";

interface LastFile {
  bytes: Uint8Array;
  fileName: string;
  rows: NordnetRow[];
}

interface PortfolioState {
  hydrated: boolean;
  demo: LedgerBundle;
  mydata: LedgerBundle;
  typeMappings: Record<string, TxKind>;
  costMethod: CostMethod;
  benchmarkId: string;
  lastReport: ImportReport | null;
  lastFile: LastFile | null;
  usedAsClient: { at: string; marketValue: number } | null;
  securityMaster: Record<string, Partial<Security>>;
  hydrate: () => void;
  persist: () => void;
  activeLedger: () => LedgerBundle;
  setActiveLedger: (ledger: LedgerBundle) => void;
  importBytes: (bytes: ArrayBuffer | Uint8Array, fileName: string) => ImportReport;
  loadDemoExport: () => ImportReport;
  copyDemoToMyData: () => void;
  applyMapping: (rawType: string, kind: TxKind) => void;
  setCostMethod: (m: CostMethod) => void;
  setBenchmark: (id: string) => void;
  updateSecurity: (isin: string, patch: Partial<Security>) => void;
  importPrices: (bytes: ArrayBuffer, isin: string) => number;
  importFx: (bytes: ArrayBuffer, pair: string) => number;
  importBenchmark: (bytes: ArrayBuffer, id: string) => number;
  clearMyData: () => void;
  markUsedAsClient: (marketValue: number) => void;
}

let demoCache: LedgerBundle | null = null;

function demoLedger(): LedgerBundle {
  if (!demoCache || demoCache.transactions.length === 0) {
    demoCache = buildDemoLedger().ledger;
  }
  return cloneLedger(demoCache);
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  hydrated: false,
  demo: demoLedger(),
  mydata: emptyLedgerBundle(),
  typeMappings: {},
  costMethod: "fifo",
  benchmarkId: "world",
  lastReport: null,
  lastFile: null,
  usedAsClient: null,
  securityMaster: {},

  hydrate: () => {
    const saved = loadPersisted();
    if (get().hydrated && get().demo.transactions.length > 0) return;
    const master = sanitizeSecurityMaster(saved.securityMaster ?? {});
    const raw = saved.mydataLedger ?? emptyLedgerBundle();
    const cleaned = sanitizeLedger({
      ...raw,
      securities: overlaySecurityMaster(raw.securities, master),
    });
    set({
      hydrated: true,
      demo: demoLedger(),
      mydata: cleaned,
      typeMappings: saved.typeMappings ?? {},
      costMethod: saved.costMethod ?? "fifo",
      benchmarkId: saved.benchmarkId ?? "world",
      securityMaster: master,
    });
    get().persist();
  },

  persist: () => {
    const s = get();
    savePersisted({
      mydataLedger: s.mydata,
      typeMappings: s.typeMappings,
      costMethod: s.costMethod,
      benchmarkId: s.benchmarkId,
      securityMaster: s.securityMaster,
    });
  },

  activeLedger: () => {
    const mode = useAppStore.getState().mode;
    return mode === "demo" ? get().demo : get().mydata;
  },

  setActiveLedger: (ledger) => {
    const mode = useAppStore.getState().mode;
    if (mode === "demo") set({ demo: ledger });
    else {
      set({ mydata: ledger });
      get().persist();
    }
  },

  importBytes: (bytes, fileName) => {
    const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const s = get();
    const { rows } = parseNordnetBytes(u8);
    const result = importNordnetBuffer(u8, fileName, s.activeLedger(), s.typeMappings);
    result.ledger.securities = overlaySecurityMaster(result.ledger.securities, get().securityMaster);
    const ledger = sanitizeLedger(result.ledger, false);
    get().setActiveLedger(ledger);
    set({
      lastReport: result.report,
      lastFile: { bytes: u8, fileName, rows },
    });
    return result.report;
  },

  loadDemoExport: () => {
    const built = buildDemoLedger();
    const mode = useAppStore.getState().mode;
    if (mode === "demo") {
      const ledger = cloneLedger(built.ledger);
      ledger.securities = overlaySecurityMaster(ledger.securities, get().securityMaster);
      demoCache = ledger;
      set({ demo: cloneLedger(ledger) });
    } else {
      // Same pipeline as a user file: transactions only. Prices, FX, and
      // benchmarks stay empty until the user imports them — never generated.
      const result = importNordnetBuffer(built.bytes, "nordnet-demo.txt", get().mydata, get().typeMappings);
      result.ledger.securities = overlaySecurityMaster(
        mergeSecs(result.ledger.securities, built.ledger.securities),
        get().securityMaster,
      );
      set({
        mydata: result.ledger,
      });
      get().persist();
    }
    const report = importNordnetBuffer(built.bytes, "nordnet-demo.txt", emptyLedgerBundle(), get().typeMappings)
      .report;
    const { rows } = parseNordnetBytes(built.bytes);
    set({ lastReport: report, lastFile: { bytes: built.bytes, fileName: "nordnet-demo.txt", rows } });
    return report;
  },

  copyDemoToMyData: () => {
    const demo = get().demo.transactions.length ? get().demo : demoLedger();
    set({ mydata: cloneLedger(demo) });
    get().persist();
    useAppStore.getState().setMode("mydata");
  },

  applyMapping: (rawType, kind) => {
    const s = get();
    const file = s.lastFile;
    if (!file || !s.lastReport) {
      set({ typeMappings: { ...s.typeMappings, [rawType]: kind } });
      get().persist();
      return;
    }
    const applied = applyReviewMapping(
      s.activeLedger(),
      s.lastReport,
      rawType,
      kind,
      file.rows,
      file.fileName,
      s.typeMappings,
    );
    get().setActiveLedger(applied.ledger);
    set({ lastReport: applied.report, typeMappings: applied.mappings });
    get().persist();
  },

  setCostMethod: (costMethod) => {
    set({ costMethod });
    get().persist();
  },

  setBenchmark: (benchmarkId) => {
    set({ benchmarkId });
    get().persist();
  },

  updateSecurity: (isin, patch) => {
    const ledger = cloneLedger(get().activeLedger());
    ledger.securities = ledger.securities.map((sec) => (sec.isin === isin ? withUserPatch(sec, patch) : sec));
    const updated = ledger.securities.find((s) => s.isin === isin);
    const master = { ...get().securityMaster };
    if (updated) {
      master[isin] = {
        ticker: updated.ticker,
        name: updated.name,
        currency: updated.currency,
        exchange: updated.exchange,
        assetClass: updated.assetClass,
        assetClassConfirmed: updated.assetClassConfirmed,
        userSet: updated.userSet,
      };
    }
    set({ securityMaster: master });
    get().setActiveLedger(ledger);
    get().persist();
  },

  importPrices: (bytes, isin) => {
    const quotes = parsePriceCsv(bytes, isin);
    get().setActiveLedger(attachQuotes(get().activeLedger(), quotes, []));
    return quotes.length;
  },

  importFx: (bytes, pair) => {
    const quotes = parseFxCsv(bytes, pair);
    get().setActiveLedger(attachQuotes(get().activeLedger(), [], quotes));
    return quotes.length;
  },

  importBenchmark: (bytes, id) => {
    const quotes = parseBenchmarkCsv(bytes, id);
    get().setActiveLedger(attachQuotes(get().activeLedger(), [], [], quotes));
    return quotes.length;
  },

  clearMyData: () => {
    set({ mydata: emptyLedgerBundle(), lastReport: null });
    get().persist();
  },

  markUsedAsClient: (marketValue) => {
    set({ usedAsClient: { at: new Date().toISOString().slice(0, 10), marketValue } });
  },
}));

function mergeSecs(a: Security[], b: Security[]): Security[] {
  const m = new Map(a.map((s) => [s.isin, s]));
  for (const s of b) {
    const prev = m.get(s.isin);
    m.set(s.isin, prev ? { ...s, ...prev, ticker: prev.ticker || s.ticker } : s);
  }
  return [...m.values()];
}
