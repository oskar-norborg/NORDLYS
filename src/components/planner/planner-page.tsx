import { DEMO_CLIENTS, DEMO_BLURBS } from "@/data/demos";
import { useAppStore } from "@/store/app-store";
import { HouseholdForm } from "./household-form";
import { GoalsForm } from "./goals-form";
import { RiskPanel } from "./risk-panel";
import { MarketsPanel } from "./markets-panel";
import { ResultsPanel } from "./results-panel";
import { GapPanel } from "@/components/portfolio/gap-panel";
import { PdfDownloadButton } from "@/components/pdf/download-button";
import { requestShowTour } from "@/components/shell/show-tour";
import { usePortfolioStore } from "@/store/portfolio-store";
import { computeHoldings } from "@/engine/ledger/holdings";
import { effectivePortfolio } from "@/engine/schedule";
import { DEMO_AS_OF } from "@/engine/ledger/synthetic";
import { cn } from "@/lib/utils";
import { AS_OF_YEAR, N_PATHS } from "@/engine/types";
import { buildProposalPdf } from "@/engine/pdf/proposal";
import { useSimulation } from "@/hooks/use-simulation";

export function PlannerPage() {
  const mode = useAppStore((s) => s.mode);
  const demoId = useAppStore((s) => s.demoId);
  const loadDemo = useAppStore((s) => s.loadDemo);
  const copyDemoToMyData = useAppStore((s) => s.copyDemoToMyData);
  const profile = useAppStore((s) => s.profile);
  const privacy = useAppStore((s) => s.privacy);
  const whatIf = useAppStore((s) => s.whatIf);
  const cma = useAppStore((s) => s.cma);
  const usedAsClient = usePortfolioStore((s) => s.usedAsClient);
  const demoLedger = usePortfolioStore((s) => s.demo);
  const mydataLedger = usePortfolioStore((s) => s.mydata);
  const costMethod = usePortfolioStore((s) => s.costMethod);
  const ledger = mode === "demo" ? demoLedger : mydataLedger;
  const holdings = usedAsClient && ledger.transactions.length
    ? computeHoldings(ledger, costMethod, mode === "demo" ? DEMO_AS_OF : new Date().toISOString().slice(0, 10))
    : null;
  const book = effectivePortfolio(profile, whatIf, cma);
  const { result } = useSimulation();
  const asOf = mode === "demo" ? `${AS_OF_YEAR}-09-01` : new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="kicker mb-2">Client planning</div>
          <h1 className="text-2xl font-medium tracking-tight text-fg sm:text-3xl">{profile.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {mode === "demo" ? "Demo household" : "My Data · stored only in this browser"} · as of {AS_OF_YEAR}
            {privacy ? " · Privacy on" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={requestShowTour}
            className="inline-flex h-11 items-center rounded-md border border-border px-4 text-sm text-fg"
          >
            Show this
          </button>
          <PdfDownloadButton
            label="Download proposal PDF"
            build={() =>
              buildProposalPdf({
                profile,
                cma,
                whatIf,
                privacy,
                result: result && result.nPaths === N_PATHS ? result : undefined,
                nPaths: N_PATHS,
                holdings,
                asOf,
              })
            }
          />
          <button
            type="button"
            onClick={copyDemoToMyData}
            className="inline-flex h-11 items-center rounded-md border border-border px-4 text-sm text-fg"
          >
            Copy into My Data
          </button>
        </div>
      </div>

      {mode === "demo" ? (
        <div className="mb-6 grid gap-2 sm:grid-cols-3">
          {DEMO_CLIENTS.map((c) => {
            const on = demoId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => loadDemo(c.id)}
                className={cn(
                  "rounded-lg border p-4 text-left",
                  on ? "border-accent bg-surface" : "border-border bg-surface-2",
                )}
              >
                <div className="text-sm font-medium text-fg">{c.name}</div>
                <div className="mt-1 text-xs text-muted">{DEMO_BLURBS[c.id]}</div>
                <div className="mt-2 font-mono text-[11px] text-subtle">{c.currency}</div>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="mb-6 rounded-md border border-border bg-surface px-4 py-3 text-sm text-muted">
          Figures stay in localStorage on this device. Nothing is sent to a server.
        </p>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="order-2 flex min-w-0 flex-1 flex-col gap-4 lg:order-1">
          <HouseholdForm />
          <GoalsForm />
          <RiskPanel />
          <MarketsPanel />
        </div>
        <div className="order-1 w-full shrink-0 lg:order-2 lg:w-96">
          <ResultsPanel />
          {holdings ? (
            <div className="mt-4">
              <GapPanel holdings={holdings} model={book} securities={ledger.securities} privacy={privacy} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
