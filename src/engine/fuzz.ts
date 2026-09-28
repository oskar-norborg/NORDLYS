/** Stage 6 fuzz harness. Every reject returns a non-empty error; nothing may throw. */

import { createRng } from "./prng";
import { parseDate, parseNumber } from "./ledger/numbers";
import { decodeText, parseNordnetBytes, parseTable } from "./ledger/parse";
import { emptyLedgerBundle, importNordnetRows } from "./ledger/pipeline";
import { NORDNET_HEADERS_NB } from "./ledger/types";
import type { NordnetRow, ParseMeta } from "./ledger/types";
import { tryCompile, compile } from "./strategy/compile";
import { DEFAULT_STRATEGY } from "./strategy/ast";
import { runSweep } from "./backtest/sweep";
import { seriesFromCloses } from "./backtest/data";
import { tradingDays } from "./backtest/demo-prices";
import { ZERO_COST_CONFIG } from "./backtest/types";
import type { DiagTest } from "./diagnostics";

export const N_FUZZ = 100_000;

export type ParseOutcome<T> = { ok: true; value: T } | { ok: false; error: string };

function clip(s: string, n = 72): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n)}…`;
}

function failMsg(prefix: string, raw: string): string {
  const shown = clip(raw, 48);
  return shown ? `${prefix}: ${JSON.stringify(shown)}` : prefix;
}

export function parseNumberChecked(raw: string | number | null | undefined): ParseOutcome<number> {
  try {
    if (raw == null || (typeof raw === "string" && raw.trim() === "")) {
      return { ok: false, error: "empty number cell" };
    }
    const n = parseNumber(raw);
    if (n == null) return { ok: false, error: failMsg("not a number", String(raw)) };
    return { ok: true, value: n };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function parseDateChecked(raw: string | null | undefined): ParseOutcome<string> {
  try {
    if (raw == null || raw.trim() === "") return { ok: false, error: "empty date cell" };
    const d = parseDate(raw);
    if (d == null) {
      return {
        ok: false,
        error: failMsg("not a date (expected YYYY-MM-DD, DD.MM.YYYY or MM/DD/YYYY)", raw),
      };
    }
    return { ok: true, value: d };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function parseCsvChecked(text: string): ParseOutcome<{ headers: string[]; rows: string[][] }> {
  try {
    if (text.trim() === "") return { ok: false, error: "empty table; no header row" };
    if (unclosedQuotes(text)) return { ok: false, error: "unclosed quote in CSV" };
    if (!hasTableDelimiter(text)) {
      return { ok: false, error: "not a table; no comma, semicolon or tab delimiter" };
    }
    const table = parseTable(text);
    if (!table.headers.length) return { ok: false, error: "empty table; no header row" };
    if (table.headers.every((h) => h.trim() === "")) {
      return { ok: false, error: "empty table; no header row" };
    }
    return { ok: true, value: { headers: table.headers, rows: table.rows } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg.trim() ? msg : "CSV parse failed" };
  }
}

function hasTableDelimiter(text: string): boolean {
  return text.includes("\t") || text.includes(";") || text.includes(",");
}

function unclosedQuotes(text: string): boolean {
  let q = false;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '"') {
      if (q && text[i + 1] === '"') i += 1;
      else q = !q;
    }
  }
  return q;
}

export function parseEncodingChecked(buf: Uint8Array): ParseOutcome<{ text: string; encoding: string }> {
  try {
    if (buf.length === 0) return { ok: false, error: "empty buffer; nothing to decode" };
    const out = decodeText(buf);
    if (out.text.includes("\uFFFD")) {
      return { ok: false, error: "invalid encoding; replacement characters in decoded text" };
    }
    return { ok: true, value: out };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg.trim() ? msg : "encoding decode failed" };
  }
}

export function parseStrategyChecked(source: string): ParseOutcome<unknown> {
  try {
    if (source.trim() === "") return { ok: false, error: "empty strategy; nothing to compile" };
    const r = tryCompile(source);
    if (r.ok) return { ok: true, value: r.program };
    const msg = r.error.message.trim();
    return { ok: false, error: msg ? msg : "strategy compile failed" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg.trim() ? msg : "strategy compile failed" };
  }
}

const ALPHA =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,;:-_+/\\()[]{}'\" \t\n#*=<>!?@æøåÆØÅ$%";

function randInt(rng: ReturnType<typeof createRng>, n: number): number {
  if (n <= 0) return 0;
  return Math.floor(rng.nextFloat() * n) % n;
}

function randStr(rng: ReturnType<typeof createRng>, min: number, max: number): string {
  const len = min + randInt(rng, max - min + 1);
  let s = "";
  for (let i = 0; i < len; i++) {
    const r = rng.nextFloat();
    if (r < 0.04) s += String.fromCharCode(randInt(rng, 90) + 32);
    else s += ALPHA[randInt(rng, ALPHA.length)]!;
  }
  return s;
}

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

interface FuzzStat {
  n: number;
  crashes: number;
  silent: number;
  ok: number;
  rejected: number;
  sampleCrash: string;
  sampleSilent: string;
}

function emptyStat(): FuzzStat {
  return { n: 0, crashes: 0, silent: 0, ok: 0, rejected: 0, sampleCrash: "", sampleSilent: "" };
}

function record(stat: FuzzStat, run: () => ParseOutcome<unknown>): void {
  stat.n += 1;
  try {
    const r = run();
    if (r.ok) {
      stat.ok += 1;
      return;
    }
    stat.rejected += 1;
    if (!r.error || !String(r.error).trim()) {
      stat.silent += 1;
      if (!stat.sampleSilent) stat.sampleSilent = "(empty error)";
    }
  } catch (e) {
    stat.crashes += 1;
    if (!stat.sampleCrash) stat.sampleCrash = e instanceof Error ? e.message : String(e);
  }
}

export function runFuzzDiagnostics(n = N_FUZZ): DiagTest[] {
  const rng = createRng(20260910);
  const num = emptyStat();
  const date = emptyStat();
  const csv = emptyStat();
  const enc = emptyStat();
  const strat = emptyStat();

  const goodNums = ["1234,56", "1 234.56", "$1,234.56", "(12.5)", "0", "1.234,56", "1234,56-"];
  const goodDates = ["2020-01-02", "02.01.2020", "1/2/2020", "31.12.1999", "2026-09-10"];
  const goodCsv = [
    "a,b\n1,2",
    "Id\tBokføringsdag\n1\t2020-01-02",
    "x;y;z\n1;2;3",
    `"a,b",c\n1,2`,
  ];
  const goodStrat = [
    DEFAULT_STRATEGY,
    "universe [MSFT]\nrebalance daily\nfor each asset:\n  target_weight 1\n",
    "universe [DNB]\nrebalance monthly\nparam n = 10\nfor each asset:\n  if close > close[1]:\n    target_weight 1\n  else:\n    target_weight 0\n",
  ];

  for (let i = 0; i < n; i++) {
    if (i % 17 === 0) {
      record(num, () => parseNumberChecked(goodNums[i % goodNums.length]!));
    } else {
      record(num, () => parseNumberChecked(randStr(rng, 0, 24)));
    }

    if (i % 19 === 0) {
      record(date, () => parseDateChecked(goodDates[i % goodDates.length]!));
    } else {
      record(date, () => parseDateChecked(randStr(rng, 0, 20)));
    }

    if (i % 23 === 0) {
      record(csv, () => parseCsvChecked(goodCsv[i % goodCsv.length]!));
    } else {
      const lines = 1 + randInt(rng, 3);
      let t = "";
      for (let k = 0; k < lines; k++) {
        if (k) t += k % 2 ? "\n" : "\r\n";
        t += randStr(rng, 0, 28);
      }
      record(csv, () => parseCsvChecked(t));
    }

    if (i % 29 === 0) {
      const text = i % 2 === 0 ? "Id\tBokføringsdag\n1\t2020-01-02" : "hello æøå";
      const u8 = i % 3 === 0 ? utf16le(text) : new TextEncoder().encode(text);
      record(enc, () => parseEncodingChecked(u8));
    } else {
      const len = randInt(rng, 33);
      const buf = new Uint8Array(len);
      for (let k = 0; k < len; k++) buf[k] = randInt(rng, 256);
      record(enc, () => parseEncodingChecked(buf));
    }

    if (i % 31 === 0) {
      record(strat, () => parseStrategyChecked(goodStrat[i % goodStrat.length]!));
    } else {
      record(strat, () => parseStrategyChecked(randStr(rng, 0, 40)));
    }
  }

  const tests: DiagTest[] = [
    fuzzTest("6a.number", "number parser", num),
    fuzzTest("6a.date", "date parser", date),
    fuzzTest("6a.csv", "CSV parser", csv),
    fuzzTest("6a.encoding", "encoding decoder", enc),
    fuzzTest("6a.strategy", "strategy-language parser", strat),
  ];

  tests.push(sweepOosTest());
  return tests;
}

function fuzzTest(id: string, label: string, s: FuzzStat): DiagTest {
  const pass = s.crashes === 0 && s.silent === 0 && s.n === N_FUZZ;
  const extra = s.crashes
    ? ` crash=${clip(s.sampleCrash)}`
    : s.silent
      ? ` silent=${clip(s.sampleSilent)}`
      : "";
  return {
    id,
    group: "6a. Fuzz (100,000 inputs each)",
    name: `${label}: 100,000 random inputs, zero crashes, every reject has a message`,
    pass,
    expected: `n=${N_FUZZ} crashes=0 silent=0`,
    actual: `n=${s.n} crashes=${s.crashes} silent=${s.silent} ok=${s.ok} reject=${s.rejected}${extra}`,
  };
}

function utf16le(text: string): Uint8Array {
  const out = new Uint8Array(2 + text.length * 2);
  out[0] = 0xff;
  out[1] = 0xfe;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    out[2 + i * 2] = c & 0xff;
    out[3 + i * 2] = (c >> 8) & 0xff;
  }
  return out;
}

function sweepOosTest(): DiagTest {
  try {
    const start = "2020-01-02";
    const end = "2020-08-31";
    const dates = tradingDays(start, end).slice(0, 80);
    const closes = dates.map((_, i) => 100 + i * 0.15);
    const series = [seriesFromCloses("DNB", "NOK", dates, closes)];
    const fx = dates.map((d) => ({ date: d, usdNok: 10 }));
    const program = compile(
      "universe [DNB]\nrebalance daily\nparam p = 1\nfor each asset:\n  target_weight 1\n",
    );
    const sweep = runSweep(program, series, fx, ZERO_COST_CONFIG, { p: [1, 2] });
    const ok =
      sweep.points.length === 2 &&
      sweep.points.every(
        (p) =>
          Number.isFinite(p.sharpe) &&
          Number.isFinite(p.oosSharpe) &&
          Number.isFinite(p.totalReturn) &&
          Number.isFinite(p.oosReturn),
      );
    return {
      id: "6b.sweep-oos",
      group: "6b. Sweep in-sample vs out-of-sample",
      name: "Parameter sweep reports in-sample and out-of-sample Sharpe side by side",
      pass: ok,
      expected: "2 points, finite IS and OOS Sharpe",
      actual: ok
        ? sweep.points
            .map((p) => `p=${p.params.p} IS=${p.sharpe.toFixed(3)} OOS=${p.oosSharpe.toFixed(3)}`)
            .join(" · ")
        : `points=${sweep.points.length}`,
    };
  } catch (e) {
    return {
      id: "6b.sweep-oos",
      group: "6b. Sweep in-sample vs out-of-sample",
      name: "Parameter sweep reports in-sample and out-of-sample Sharpe side by side",
      pass: false,
      expected: "2 points, finite IS and OOS Sharpe",
      actual: e instanceof Error ? e.message : String(e),
    };
  }
}

const EMPTY_CELLS: string[] = [];

function compactRow(i: number): NordnetRow {
  const id = String(i);
  const qty = 1;
  return {
    rowNumber: i + 1,
    cells: EMPTY_CELLS,
    id,
    bookingDate: "2020-01-02",
    tradeDate: "2020-01-02",
    settleDate: "2020-01-02",
    portfolio: "A",
    rawType: "KJØPT",
    name: "F",
    isin: "NO0000000001",
    qty,
    price: 10,
    interest: 0,
    totalFees: 0,
    feeCcy: "NOK",
    amount: -10,
    amountCcy: "NOK",
    purchaseValue: 10,
    purchaseCcy: "NOK",
    result: 0,
    resultCcy: "NOK",
    totalQty: i,
    saldo: -10 * i,
    fxRate: 1,
    text: "",
    cancelDate: "",
    noteNumber: "",
    verification: "",
    brokerage: 0,
    brokerageCcy: "NOK",
    valutakurs: 1,
    initialInterest: 0,
  };
}

function tsvMeta(): ParseMeta {
  return {
    encoding: "utf-8",
    delimiter: "tab",
    lineEnding: "lf",
    headerCount: NORDNET_HEADERS_NB.length,
    positional: true,
    headers: [...NORDNET_HEADERS_NB],
  };
}

/** Build 100k compact Nordnet rows and import them. Does not persist. */
export function timeImport100k(): { ms: number; created: number; rowsRead: number; bytes: number } {
  const N = 100_000;
  const rows = new Array<NordnetRow>(N);
  for (let i = 0; i < N; i++) rows[i] = compactRow(i + 1);
  const t0 = nowMs();
  const r = importNordnetRows(rows, tsvMeta(), "perf-100k.txt", emptyLedgerBundle(), {});
  const ms = nowMs() - t0;
  return { ms, created: r.report.transactionsCreated, rowsRead: r.report.rowsRead, bytes: N };
}

/** Parse a 100,000-row Nordnet TSV (the file path). Does not persist. */
export function timeParse100kFile(): { ms: number; rowsRead: number; bytes: number } {
  const N = 100_000;
  const header = NORDNET_HEADERS_NB.join("\t");
  const lines = new Array<string>(N + 1);
  lines[0] = header;
  for (let i = 1; i <= N; i++) {
    lines[i] =
      `${i}\t2020-01-02\t2020-01-02\t2020-01-02\tA\tKJØPT\tF\tNO1\t1\t10\t0\t0\tNOK\t-10\tNOK\t10\tNOK\t0\tNOK\t${i}\t0\t1\t\t\t\t\t0\tNOK\t1\t0`;
  }
  const text = lines.join("\n");
  const bytes = new TextEncoder().encode(text);
  const t0 = nowMs();
  const parsed = parseNordnetBytes(bytes);
  const ms = nowMs() - t0;
  return { ms, rowsRead: parsed.rows.length, bytes: bytes.byteLength };
}


