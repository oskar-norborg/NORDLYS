import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { runDiagnostics, type DiagTest } from "@/engine/diagnostics";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/diagnostics")({ component: DiagnosticsPage });

const PERF_IDS = ["i.runtime", "j.pdf", "j.import100k", "j.parse100k"] as const;

const PERF_META: Record<(typeof PERF_IDS)[number], { title: string; target: string }> = {
  "i.runtime": { title: "10,000-path planning simulation", target: "< 1 s" },
  "j.pdf": { title: "Proposal PDF", target: "< 500 ms" },
  "j.import100k": { title: "100,000-row import", target: "< 2 s" },
  "j.parse100k": { title: "100,000-row Nordnet file parse", target: "< 2 s" },
};

function DiagnosticsPage() {
  const [nonce, setNonce] = useState(0);
  const [tests, setTests] = useState<DiagTest[] | null>(null);

  useEffect(() => {
    setTests(null);
    const handle = window.setTimeout(() => setTests(runDiagnostics()), 0);
    return () => window.clearTimeout(handle);
  }, [nonce]);

  const groups = tests ? group(tests) : [];
  const pass = tests ? tests.filter((t) => t.pass).length : 0;
  const perf = tests ? PERF_IDS.map((id) => tests.find((t) => t.id === id)).filter(Boolean) as DiagTest[] : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="kicker mb-2">Verification</div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Diagnostics</h1>
          <p className="mt-1 text-sm text-muted">
            Built-in suite. Every number below is computed in this browser from the same engine the planner uses.
          </p>
        </div>
        <button
          type="button"
          className="h-11 rounded-md border border-border px-4 text-sm"
          onClick={() => setNonce((n) => n + 1)}
        >
          Re-run
        </button>
      </div>

      <div
        className={cn(
          "mb-6 rounded-lg border px-4 py-4 font-mono text-sm tabular-nums",
          !tests
            ? "border-border text-muted"
            : pass === tests.length
              ? "border-ok/40 text-ok"
              : "border-danger/40 text-danger",
        )}
      >
        {tests
          ? `${pass} / ${tests.length} passed`
          : "Running the engine suite — 100,000-input fuzz, a 100,000-row import and file parse, and the planner identities…"}
      </div>

      {tests && perf.length ? (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium text-fg">Performance</h2>
          <p className="mb-3 text-sm text-muted">
            Measured in this run. Targets are budgets, not promises — the Actual column is the honest number.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {perf.map((t) => {
              const meta = PERF_META[t.id as (typeof PERF_IDS)[number]];
              return (
                <div
                  key={t.id}
                  className={cn(
                    "rounded-lg border px-4 py-3",
                    t.pass ? "border-ok/40" : "border-danger/40",
                  )}
                >
                  <div className="text-xs text-muted">{meta?.title ?? t.name}</div>
                  <div className={cn("mt-1 font-mono text-lg tabular-nums", t.pass ? "text-ok" : "text-danger")}>
                    {t.actual.split("·")[0]!.trim()}
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    target {meta?.target ?? t.expected}
                    {t.actual.includes("·") ? ` · ${t.actual.split("·").slice(1).join("·").trim()}` : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-8">
        {groups.map(([name, rows]) => (
          <section key={name}>
            <h2 className="mb-3 text-sm font-medium text-fg">{name}</h2>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted">
                    <th className="px-3 py-2 font-medium">Test</th>
                    <th className="px-3 py-2 font-medium">Result</th>
                    <th className="px-3 py-2 font-medium">Expected</th>
                    <th className="px-3 py-2 font-medium">Actual</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 align-top text-fg">{t.name}</td>
                      <td
                        className={cn(
                          "px-3 py-2 align-top font-mono text-xs",
                          t.pass ? "text-ok" : "text-danger",
                        )}
                      >
                        {t.pass ? "PASS" : "FAIL"}
                      </td>
                      <td className="px-3 py-2 align-top font-mono text-xs text-muted">{t.expected}</td>
                      <td className="px-3 py-2 align-top font-mono text-xs text-fg">{t.actual}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function group(tests: DiagTest[]): [string, DiagTest[]][] {
  const map = new Map<string, DiagTest[]>();
  for (const t of tests) {
    const list = map.get(t.group) ?? [];
    list.push(t);
    map.set(t.group, list);
  }
  return [...map.entries()];
}