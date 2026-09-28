import { useCallback, useState } from "react";
import { Panel, Field, SelectInput } from "@/components/ui/field";
import { useAppStore } from "@/store/app-store";
import { usePortfolioStore } from "@/store/portfolio-store";
import { TX_KINDS, TX_KIND_LABELS, type TxKind } from "@/engine/ledger/types";
import { ASSET_IDS, ASSET_LABELS, type AssetId } from "@/engine/types";
import { formatMoney } from "@/engine/format";
import { downloadableDemoFile } from "@/engine/ledger/synthetic";
import { PRICE_PRESETS } from "@/engine/ledger/prices";
import { BENCHMARKS } from "@/engine/ledger/benchmarks";
import { cn } from "@/lib/utils";

export function ImportPage() {
  const mode = useAppStore((s) => s.mode);
  const privacy = useAppStore((s) => s.privacy);
  const lastReport = usePortfolioStore((s) => s.lastReport);
  const importBytes = usePortfolioStore((s) => s.importBytes);
  const loadDemoExport = usePortfolioStore((s) => s.loadDemoExport);
  const copyDemoToMyData = usePortfolioStore((s) => s.copyDemoToMyData);
  const applyMapping = usePortfolioStore((s) => s.applyMapping);
  const demo = usePortfolioStore((s) => s.demo);
  const mydata = usePortfolioStore((s) => s.mydata);
  const updateSecurity = usePortfolioStore((s) => s.updateSecurity);
  const importPrices = usePortfolioStore((s) => s.importPrices);
  const importFx = usePortfolioStore((s) => s.importFx);
  const importBenchmark = usePortfolioStore((s) => s.importBenchmark);
  const typeMappings = usePortfolioStore((s) => s.typeMappings);
  const ledger = mode === "demo" ? demo : mydata;
  const [drag, setDrag] = useState(false);
  const [notice, setNotice] = useState("");
  const [priceIsin, setPriceIsin] = useState(ledger.securities[0]?.isin ?? "");
  const [fxPair, setFxPair] = useState("USDNOK");
  const [benchId, setBenchId] = useState("world");

  const onFiles = useCallback(
    async (files: FileList | File[]) => {
      const file = files[0];
      if (!file) return;
      const buf = await file.arrayBuffer();
      const report = importBytes(buf, file.name);
      setNotice(
        `${file.name}: ${report.transactionsCreated} created, ${report.duplicatesSkipped} duplicates, ${report.cancelledExcluded} cancelled, ${report.reviewCount} to review.`,
      );
    },
    [importBytes],
  );

  const downloadDemo = () => {
    const { bytes, fileName, mime } = downloadableDemoFile();
    const copy = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(copy).set(bytes);
    const blob = new Blob([copy], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reconIssues = lastReport?.recon.issues ?? [];

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <div className="kicker mb-2">Ledger</div>
        <h1 className="text-2xl font-medium tracking-tight">Import</h1>
        <p className="mt-1 text-sm text-muted">
          Nordnet “Transaksjoner og notaer” and generic price/FX CSVs. Parsed in this browser — nothing is uploaded.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Panel kicker="Nordnet" title="Transactions">
          <div
            className={cn(
              "flex min-h-36 flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center",
              drag ? "border-accent bg-surface-2" : "border-border",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              void onFiles(e.dataTransfer.files);
            }}
          >
            <p className="text-sm text-fg">Drop a Nordnet export here</p>
            <p className="mt-1 text-xs text-muted">UTF-16 LE tab-delimited, or CSV in any Nordic language</p>
            <label className="mt-4 inline-flex h-11 cursor-pointer items-center rounded-md bg-accent px-4 text-sm text-accent-fg">
              Choose file
              <input
                type="file"
                className="sr-only"
                accept=".xls,.xlsx,.txt,.csv,.tsv,.txt"
                onChange={(e) => {
                  if (e.target.files) void onFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="h-11 rounded-md border border-border px-4 text-sm"
              onClick={() => {
                const report = loadDemoExport();
                setNotice(`Demo export imported: ${report.transactionsCreated} transactions through the same pipeline.`);
              }}
            >
              Load demo Nordnet export
            </button>
            <button type="button" className="h-11 rounded-md border border-border px-4 text-sm" onClick={downloadDemo}>
              Download demo file
            </button>
            {mode === "demo" ? (
              <button type="button" className="h-11 rounded-md border border-border px-4 text-sm" onClick={copyDemoToMyData}>
                Copy demo ledger into My Data
              </button>
            ) : null}
          </div>
          {notice ? <p className="mt-3 text-sm text-accent">{notice}</p> : null}
          <p className="mt-3 text-xs text-muted">
            Active ledger: {ledger.transactions.length} transactions · {ledger.securities.length} securities ·{" "}
            {mode === "demo" ? "Demo" : "My Data"}
          </p>
        </Panel>

        {lastReport ? (
          <Panel kicker="Result" title="Import report">
            <div className="grid gap-3 sm:grid-cols-4">
              <Stat label="Rows read" value={String(lastReport.rowsRead)} />
              <Stat label="Created" value={String(lastReport.transactionsCreated)} />
              <Stat label="Duplicates" value={String(lastReport.duplicatesSkipped)} />
              <Stat label="Cancelled" value={String(lastReport.cancelledExcluded)} />
            </div>
            <p className="mt-3 font-mono text-xs text-muted">
              {lastReport.encoding} · {lastReport.delimiter === "tab" ? "tab" : lastReport.delimiter} ·{" "}
              {lastReport.positional ? "positional 30-col Nordnet" : "header aliases"}
            </p>
            {lastReport.cancelled.length > 0 ? (
              <div className="mt-4">
                <h3 className="mb-2 text-sm font-medium">Cancelled (Makuleringsdato)</h3>
                <ul className="text-sm text-muted">
                  {lastReport.cancelled.map((c) => (
                    <li key={c.nordnetId}>
                      Row {c.rowNumber} · Id {c.nordnetId} · {c.rawType} · {c.name} · {c.date}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {lastReport.skipped.filter((s) => s.reason !== "cancelled" && s.reason !== "duplicate").length > 0 ? (
              <div className="mt-4">
                <h3 className="mb-2 text-sm font-medium">Skipped</h3>
                <ul className="max-h-40 overflow-auto text-xs text-muted">
                  {lastReport.skipped
                    .filter((s) => s.reason !== "duplicate")
                    .slice(0, 40)
                    .map((s) => (
                      <li key={`${s.rowNumber}-${s.reason}`}>
                        Row {s.rowNumber}: {s.reason} — {s.detail}
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium">Reconciliation</h3>
              <p className="text-sm text-muted">
                Saldo errors {lastReport.recon.saldoErrors} · quantity errors {lastReport.recon.qtyErrors} · rounding notes{" "}
                {lastReport.recon.qtyRounding}
              </p>
              {reconIssues.length === 0 ? (
                <p className="mt-2 text-sm text-ok">Saldo and Totalt antall recompute cleanly.</p>
              ) : (
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[32rem] text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted">
                        <th className="px-2 py-1 font-medium">Row</th>
                        <th className="px-2 py-1 font-medium">Id</th>
                        <th className="px-2 py-1 font-medium">Field</th>
                        <th className="px-2 py-1 font-medium">Level</th>
                        <th className="px-2 py-1 font-medium">Δ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reconIssues.slice(0, 50).map((i) => (
                        <tr key={`${i.rowNumber}-${i.field}`} className="border-b border-border">
                          <td className="px-2 py-1 font-mono">{i.rowNumber}</td>
                          <td className="px-2 py-1 font-mono">{i.nordnetId}</td>
                          <td className="px-2 py-1">{i.field}</td>
                          <td className={i.level === "error" ? "text-danger" : "text-warn"}>{i.level}</td>
                          <td className="px-2 py-1 font-mono">{i.delta}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Panel>
        ) : null}

        {lastReport && lastReport.review.length > 0 ? (
          <Panel kicker="Unmapped" title="Review queue">
            <p className="mb-4 text-sm text-muted">
              Unrecognized types are never dropped. Map them once; the mapping is stored in this browser and reused.
            </p>
            <ul className="flex flex-col gap-3">
              {uniqTypes(lastReport.review).map((item) => (
                <li key={item.rawType} className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-sm">{item.rawType || "(blank type)"}</div>
                    <div className="text-xs text-muted">
                      {item.name} · {item.date} · {formatMoney(item.amount, "NOK", privacy)}
                    </div>
                  </div>
                  <SelectInput
                    value={typeMappings[item.rawType] ?? ""}
                    onChange={(e) => {
                      const v = e.target.value as TxKind;
                      if (v) applyMapping(item.rawType, v);
                    }}
                  >
                    <option value="">Map to…</option>
                    {TX_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {TX_KIND_LABELS[k]}
                      </option>
                    ))}
                  </SelectInput>
                </li>
              ))}
            </ul>
          </Panel>
        ) : lastReport ? (
          <Panel kicker="Unmapped" title="Review queue">
            <p className="text-sm text-muted">
              Review queue is empty. Every recognised type is in the ledger. If Nordnet used a type this page does
              not know, it would wait here — map it once and the mapping is remembered.
            </p>
          </Panel>
        ) : null}

        <Panel kicker="Master" title="Securities">
          {ledger.securities.length === 0 ? (
            <p className="text-sm text-muted">No securities yet. Import a Nordnet file or load the demo export.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[64rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted">
                    <th className="px-2 py-2 font-medium">ISIN</th>
                    <th className="min-w-24 px-2 py-2 font-medium">Ticker</th>
                    <th className="min-w-56 px-2 py-2 font-medium">Name</th>
                    <th className="px-2 py-2 font-medium">Ccy</th>
                    <th className="px-2 py-2 font-medium">Exchange</th>
                    <th className="min-w-40 px-2 py-2 font-medium">Class</th>
                    <th className="px-2 py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {ledger.securities.map((s) => (
                    <tr key={s.isin} className="border-b border-border">
                      <td className="px-2 py-2 font-mono text-xs" title={s.isin}>
                        {s.isin}
                      </td>
                      <td className="px-2 py-1">
                        <input
                          className="field-input h-9 min-w-24!"
                          value={s.ticker}
                          placeholder="add ticker"
                          title={s.ticker || "add ticker"}
                          onChange={(e) => updateSecurity(s.isin, { ticker: e.target.value })}
                        />
                        {!s.ticker ? <div className="mt-1 text-[10px] text-warn">add ticker</div> : null}
                      </td>
                      <td className="px-2 py-1">
                        <input
                          className="field-input h-9 min-w-56!"
                          value={s.name}
                          title={s.name}
                          onChange={(e) => updateSecurity(s.isin, { name: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          className="field-input h-9 w-16"
                          value={s.currency}
                          title={s.currency}
                          onChange={(e) => updateSecurity(s.isin, { currency: e.target.value.toUpperCase() })}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          className="field-input h-9 w-20"
                          value={s.exchange}
                          placeholder={s.exchange ? undefined : "—"}
                          title={s.exchange || "—"}
                          onChange={(e) => updateSecurity(s.isin, { exchange: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <select
                          className="field-input h-9 min-w-40!"
                          value={s.assetClass}
                          title={ASSET_LABELS[s.assetClass]}
                          onChange={(e) =>
                            updateSecurity(s.isin, { assetClass: e.target.value as AssetId, assetClassConfirmed: true })
                          }
                        >
                          {ASSET_IDS.map((id) => (
                            <option key={id} value={id}>
                              {ASSET_LABELS[id]}
                            </option>
                          ))}
                        </select>
                        {!s.assetClassConfirmed ? (
                          <div className="mt-1 text-[10px] tracking-wide text-warn uppercase">suggested, please review</div>
                        ) : (
                          <div className="mt-1 text-[10px] tracking-wide text-muted uppercase">confirmed</div>
                        )}
                      </td>
                      <td className="px-2 py-1">
                        {!s.assetClassConfirmed ? (
                          <button
                            type="button"
                            className="h-9 whitespace-nowrap px-2 text-xs text-accent"
                            onClick={() => updateSecurity(s.isin, { assetClassConfirmed: true })}
                          >
                            Confirm
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel kicker="Market data" title="Prices, NAV, FX, benchmarks">
          <p className="mb-4 text-sm text-muted">
            Generic CSV. Mutual-fund NAV files (date + NAV, no OHLC) are first-class. Also: ISO + Adj Close; US
            dates with $; European decimal commas. Holdings without a price file stay on last-trade and are marked
            stale. USD without an imported FX series is marked stale. In My Data, benchmark lines appear only after
            you import them — they are never generated.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price / NAV file for ISIN" hint={PRICE_PRESETS.map((p) => p.label).join(" · ")}>
              <SelectInput value={priceIsin} onChange={(e) => setPriceIsin(e.target.value)}>
                <option value="">Select ISIN</option>
                {ledger.securities.map((s) => (
                  <option key={s.isin} value={s.isin}>
                    {s.ticker} {s.isin}
                  </option>
                ))}
              </SelectInput>
              <label className="mt-2 inline-flex h-11 items-center rounded-md border border-border px-3 text-sm">
                Import prices / NAV
                <input
                  type="file"
                  className="sr-only"
                  accept=".csv,.txt"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f || !priceIsin) return;
                    const n = importPrices(await f.arrayBuffer(), priceIsin);
                    setNotice(`${n} price/NAV points for ${priceIsin}`);
                    e.target.value = "";
                  }}
                />
              </label>
            </Field>
            <Field label="FX pair (e.g. USDNOK)">
              <input className="field-input" value={fxPair} onChange={(e) => setFxPair(e.target.value.toUpperCase())} />
              <label className="mt-2 inline-flex h-11 items-center rounded-md border border-border px-3 text-sm">
                Import FX
                <input
                  type="file"
                  className="sr-only"
                  accept=".csv,.txt"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const n = importFx(await f.arrayBuffer(), fxPair);
                    setNotice(`${n} FX points for ${fxPair}`);
                    e.target.value = "";
                  }}
                />
              </label>
            </Field>
            <Field
              label="Benchmark series"
              hint="Date + close or NAV. Required in My Data — nothing is generated."
            >
              <SelectInput value={benchId} onChange={(e) => setBenchId(e.target.value)}>
                {BENCHMARKS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </SelectInput>
              <label className="mt-2 inline-flex h-11 items-center rounded-md border border-border px-3 text-sm">
                Import benchmark
                <input
                  type="file"
                  className="sr-only"
                  accept=".csv,.txt"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const n = importBenchmark(await f.arrayBuffer(), benchId);
                    setNotice(`${n} benchmark points for ${benchId}`);
                    e.target.value = "";
                  }}
                />
              </label>
            </Field>
          </div>
          <p className="mt-3 text-xs text-muted">
            {ledger.prices.length} price points · {ledger.fx.length} FX quotes · {(ledger.benchmarks ?? []).length}{" "}
            benchmark points
            {ledger.fx.some((f) => f.stale) ? " · some FX marked stale (from Nordnet trades)" : ""}
          </p>
          {ledger.fx.length > 0 ? (
            <p className="mt-2 text-xs text-muted">{uniqueFxSummary(ledger.fx)}</p>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 font-mono text-lg tabular-nums">{value}</div>
    </div>
  );
}

function uniqTypes<T extends { rawType: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    if (seen.has(it.rawType)) continue;
    seen.add(it.rawType);
    out.push(it);
  }
  return out;
}

function uniqueFxSummary(fx: { pair: string; date: string; source: string }[]): string {
  const byPair = new Map<string, Set<string>>();
  for (const q of fx) {
    const set = byPair.get(q.pair) ?? new Set();
    set.add(q.date);
    byPair.set(q.pair, set);
  }
  return [...byPair.entries()]
    .map(([pair, dates]) => `${pair}: ${dates.size} dates (${[...dates].sort().join(", ")})`)
    .join(" · ");
}

