import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { NAV } from "@/nav";
import { DEMO_CLIENTS } from "@/data/demos";
import { useAppStore } from "@/store/app-store";
import { usePortfolioStore } from "@/store/portfolio-store";
import { downloadPdf } from "@/engine/pdf/download";
import { buildProposalPdf } from "@/engine/pdf/proposal";
import { buildPortfolioReportPdf } from "@/engine/pdf/portfolio-report";
import { computeHoldings } from "@/engine/ledger/holdings";
import { DEMO_AS_OF } from "@/engine/ledger/synthetic";
import { AS_OF_YEAR } from "@/engine/types";
import { requestShowTour } from "./show-tour";

interface Cmd {
  id: string;
  group: string;
  label: string;
  hint?: string;
  run: () => void;
  disabled?: boolean;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const loadDemo = useAppStore((s) => s.loadDemo);
  const setMode = useAppStore((s) => s.setMode);
  const setPrivacy = useAppStore((s) => s.setPrivacy);
  const privacy = useAppStore((s) => s.privacy);
  const copyDemoToMyData = useAppStore((s) => s.copyDemoToMyData);
  const resetCma = useAppStore((s) => s.resetCma);
  const resetWhatIf = useAppStore((s) => s.resetWhatIf);
  const loadDemoExport = usePortfolioStore((s) => s.loadDemoExport);
  const copyLedger = usePortfolioStore((s) => s.copyDemoToMyData);
  const profile = useAppStore((s) => s.profile);
  const cma = useAppStore((s) => s.cma);
  const whatIf = useAppStore((s) => s.whatIf);
  const mode = useAppStore((s) => s.mode);
  const costMethod = usePortfolioStore((s) => s.costMethod);
  const demo = usePortfolioStore((s) => s.demo);
  const mydata = usePortfolioStore((s) => s.mydata);
  const usedAsClient = usePortfolioStore((s) => s.usedAsClient);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);

  const commands = useMemo<Cmd[]>(() => {
    const nav = NAV.map((n) => ({
      id: `nav-${n.id}`,
      group: "Go to",
      label: n.label,
      hint: n.hint,
      disabled: !n.enabled,
      run: () => {
        if (!n.enabled) return;
        void navigate({ to: n.path });
      },
    }));
    const demos = DEMO_CLIENTS.map((c) => ({
      id: `demo-${c.id}`,
      group: "Demo clients",
      label: `Load ${c.name}`,
      hint: c.currency,
      run: () => loadDemo(c.id),
    }));
    const actions: Cmd[] = [
      {
        id: "show",
        group: "Session",
        label: "Show this — walk someone through NORDLYS",
        hint: "Six stops",
        run: () => requestShowTour(),
      },
      {
        id: "mode-demo",
        group: "Session",
        label: "Switch to Demo",
        run: () => setMode("demo"),
      },
      {
        id: "mode-my",
        group: "Session",
        label: "Switch to My Data",
        run: () => setMode("mydata"),
      },
      {
        id: "privacy",
        group: "Session",
        label: privacy ? "Turn Privacy Mode off" : "Turn Privacy Mode on",
        run: () => setPrivacy(!privacy),
      },
      {
        id: "copy",
        group: "Session",
        label: "Copy current plan into My Data",
        run: () => copyDemoToMyData(),
      },
      {
        id: "reset-cma",
        group: "Session",
        label: "Reset capital market assumptions",
        run: () => resetCma(),
      },
      {
        id: "reset-whatif",
        group: "Session",
        label: "Reset what-if sliders",
        run: () => resetWhatIf(),
      },
      {
        id: "demo-nordnet",
        group: "Portfolio",
        label: "Load demo Nordnet export",
        run: () => loadDemoExport(),
      },
      {
        id: "copy-ledger",
        group: "Portfolio",
        label: "Copy demo ledger into My Data",
        run: () => copyLedger(),
      },
      {
        id: "pdf-proposal",
        group: "Documents",
        label: "Download client proposal PDF",
        run: () => {
          const ledger = mode === "demo" ? demo : mydata;
          const holdings =
            usedAsClient && ledger.transactions.length
              ? computeHoldings(ledger, costMethod, mode === "demo" ? DEMO_AS_OF : new Date().toISOString().slice(0, 10))
              : null;
          const pdf = buildProposalPdf({
            profile,
            cma,
            whatIf,
            privacy,
            holdings,
            asOf: mode === "demo" ? `${AS_OF_YEAR}-09-01` : new Date().toISOString().slice(0, 10),
          });
          downloadPdf(pdf.bytes, pdf.fileName);
        },
      },
      {
        id: "pdf-report",
        group: "Documents",
        label: "Download portfolio report PDF",
        run: () => {
          const ledger = mode === "demo" ? demo : mydata;
          if (!ledger.transactions.length) return;
          const pdf = buildPortfolioReportPdf({
            ledger,
            profile,
            cma,
            whatIf,
            costMethod,
            privacy,
            asOf: mode === "demo" ? DEMO_AS_OF : new Date().toISOString().slice(0, 10),
            mode,
          });
          downloadPdf(pdf.bytes, pdf.fileName);
        },
      },
    ];
    return [...nav, ...demos, ...actions];
  }, [
    navigate,
    loadDemo,
    setMode,
    setPrivacy,
    privacy,
    copyDemoToMyData,
    resetCma,
    resetWhatIf,
    loadDemoExport,
    copyLedger,
    profile,
    cma,
    whatIf,
    mode,
    costMethod,
    demo,
    mydata,
    usedAsClient,
  ]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return commands.filter((c) => !c.disabled);
    return commands.filter(
      (c) =>
        !c.disabled &&
        (c.label.toLowerCase().includes(s) ||
          c.group.toLowerCase().includes(s) ||
          (c.hint ?? "").toLowerCase().includes(s)),
    );
  }, [commands, q]);

  useEffect(() => {
    setIdx(0);
  }, [q, open]);

  useEffect(() => {
    if (!open) {
      setQ("");
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setIdx((i) => Math.min(filtered.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filtered[idx];
        if (cmd) {
          cmd.run();
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, idx, onClose]);

  if (!open) return null;

  let lastGroup = "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-bg/70 px-3 pt-[12vh]"
      onClick={onClose}
    >
      <div
        className="panel w-full max-w-lg overflow-hidden rounded-xl shadow-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Command palette"
      >
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Jump, load a client, toggle privacy…"
          className="h-14 w-full border-b border-border bg-transparent px-4 text-base text-fg outline-none"
        />
        <ul className="max-h-80 overflow-auto py-2">
          {filtered.length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted">No matching commands.</li>
          ) : (
            filtered.map((cmd, i) => {
              const head = cmd.group !== lastGroup;
              lastGroup = cmd.group;
              return (
                <li key={cmd.id}>
                  {head ? (
                    <div className="px-4 pb-1 pt-2 text-[10px] font-medium tracking-[0.14em] text-subtle uppercase">
                      {cmd.group}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onMouseEnter={() => setIdx(i)}
                    onClick={() => {
                      cmd.run();
                      onClose();
                    }}
                    className={`flex h-11 w-full items-center justify-between px-4 text-left text-sm ${
                      i === idx ? "bg-surface-2 text-fg" : "text-fg"
                    }`}
                  >
                    <span>{cmd.label}</span>
                    {cmd.hint ? <span className="text-xs text-muted">{cmd.hint}</span> : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
