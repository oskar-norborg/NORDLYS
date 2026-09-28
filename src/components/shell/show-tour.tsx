import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useAppStore } from "@/store/app-store";

export const SHOW_EVENT = "nordlys-show";

export function requestShowTour() {
  window.dispatchEvent(new Event(SHOW_EVENT));
}

const STEPS = [
  {
    path: "/",
    title: "Start with a client",
    body: "Emilie Voss is loaded — a long horizon, an Oslo apartment, and a retirement income. The fan is ten thousand futures, not one guess. Switch James & Priya Ward or Ingrid Solberg and the plan changes with them.",
  },
  {
    path: "/portfolio",
    title: "The book behind the plan",
    body: "Holdings, cost, and the mix are built from transactions. This is the same book the planner compares with the model portfolio.",
  },
  {
    path: "/risk",
    title: "Risk, measured",
    body: "Drawdown, tails, correlation, and a frontier from these holdings. Stress is a what-if you can point at, not a line in a disclaimer.",
  },
  {
    path: "/backtest",
    title: "Replay a strategy",
    body: "The chart is price. close[1] is the previous bar. The sweep puts in-sample next to out-of-sample — a wide gap is overfitting, and the page says so.",
  },
  {
    path: "/import",
    title: "A Nordnet file, dropped in",
    body: "Export transactions and drop the file here. A name you map once is remembered. The file stays on this device.",
  },
  {
    path: "/about",
    title: "It stays in this browser",
    body: "Demo, My Data, and Privacy are switches, not accounts. The proposal PDF is built here. Diagnostics, in the sidebar, reruns the engine if someone asks for the timings — give it a moment; the checks are real.",
  },
] as const;

export function ShowTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const loadDemo = useAppStore((s) => s.loadDemo);
  const setPrivacy = useAppStore((s) => s.setPrivacy);

  useEffect(() => {
    const onStart = () => {
      loadDemo("demo-emilie");
      setPrivacy(false);
      setStep(0);
      setOpen(true);
      if (pathname !== "/") void navigate({ to: "/" });
    };
    window.addEventListener(SHOW_EVENT, onStart);
    return () => window.removeEventListener(SHOW_EVENT, onStart);
  }, [loadDemo, navigate, pathname, setPrivacy]);

  useEffect(() => {
    if (!open) return;
    const match = STEPS.findIndex((s) => s.path === pathname);
    if (match >= 0) setStep(match);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = reduce ? "auto" : "smooth";
    window.setTimeout(() => {
      const anchorId = pathname === "/" ? "results" : pathname === "/backtest" ? "candles" : null;
      const anchor = anchorId ? document.getElementById(anchorId) : null;
      if (anchor) {
        anchor.style.scrollMarginTop = "4.5rem";
        anchor.scrollIntoView({ block: pathname === "/backtest" ? "start" : "center", behavior });
      } else window.scrollTo({ top: 0, behavior });
    }, 60);
  }, [open, pathname]);

  function go(next: number) {
    if (next < 0) return;
    if (next >= STEPS.length) {
      setOpen(false);
      return;
    }
    const path = STEPS[next].path;
    if (path === pathname) setStep(next);
    else void navigate({ to: path });
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) {
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(step + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(step - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pathname, step, navigate]);

  if (!open) return null;
  const current = STEPS[step];
  if (!current) return null;
  const last = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-x-3 bottom-16 z-40 lg:inset-x-auto lg:bottom-6 lg:left-56 lg:w-96"
      role="dialog"
      aria-label="Show NORDLYS"
    >
      <div className="panel p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="kicker">
            Stop {step + 1} of {STEPS.length}
          </div>
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted"
            onClick={() => setOpen(false)}
            aria-label="Close walkthrough"
          >
            <X className="size-4" />
          </button>
        </div>
        <h2 className="text-base font-medium text-fg">{current.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{current.body}</p>
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            className="h-11 rounded-md border border-border px-3 text-sm text-fg disabled:text-subtle"
            onClick={() => go(step - 1)}
            disabled={step === 0}
          >
            Back
          </button>
          <button
            type="button"
            className="h-11 rounded-md bg-accent px-4 text-sm font-medium text-accent-fg"
            onClick={() => go(step + 1)}
          >
            {last ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
