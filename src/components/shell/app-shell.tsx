import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Briefcase,
  CircleHelp,
  FlaskConical,
  Info,
  LineChart,
  Menu,
  Search,
  Shield,
  Upload,
  Eye,
  EyeOff,
  History,
  X,
} from "lucide-react";
import { MOBILE_NAV_IDS, NAV } from "@/nav";
import { useAppStore } from "@/store/app-store";
import { usePortfolioStore } from "@/store/portfolio-store";
import { CommandPalette } from "./command-palette";
import { ShowTour, requestShowTour } from "./show-tour";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof LineChart> = {
  planner: LineChart,
  portfolio: Briefcase,
  import: Upload,
  risk: Shield,
  options: Activity,
  backtest: History,
  help: CircleHelp,
  diagnostics: FlaskConical,
  about: Info,
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const privacy = useAppStore((s) => s.privacy);
  const setPrivacy = useAppStore((s) => s.setPrivacy);
  const hydrate = useAppStore((s) => s.hydrate);
  const hydratePort = usePortfolioStore((s) => s.hydrate);
  const profile = useAppStore((s) => s.profile);
  const [palette, setPalette] = useState(false);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    hydrate();
    hydratePort();
  }, [hydrate, hydratePort]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  const modeLabel = `${mode === "demo" ? "Demo" : "My Data"} · ${profile.name}`;
  const mobileNav = NAV.filter((n) => n.enabled && (MOBILE_NAV_IDS as readonly string[]).includes(n.id));

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur-sm">
        <div className="flex h-14 items-center gap-3 px-3 sm:px-4">
          <button
            type="button"
            className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border text-fg max-lg:flex"
            onClick={() => setDrawer(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>
          <Link to="/" className="flex shrink-0 items-baseline gap-2 no-underline">
            <span className="text-sm font-semibold tracking-[0.22em] text-fg">NORDLYS</span>
            <span className="hidden text-[10px] tracking-[0.16em] text-muted uppercase sm:inline">
              Private wealth
            </span>
          </Link>
          <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-3">
            <div
              className="inline-flex rounded-full border border-border p-0.5"
              role="group"
              aria-label="Data source"
            >
              <button
                type="button"
                onClick={() => setMode("demo")}
                className={cn(
                  "h-9 rounded-full px-2.5 text-xs font-medium sm:px-4",
                  mode === "demo" ? "bg-accent text-accent-fg" : "text-muted",
                )}
              >
                Demo
              </button>
              <button
                type="button"
                onClick={() => setMode("mydata")}
                className={cn(
                  "h-9 rounded-full px-2.5 text-xs font-medium sm:px-4",
                  mode === "mydata" ? "bg-accent text-accent-fg" : "text-muted",
                )}
              >
                My Data
              </button>
            </div>
            <button
              type="button"
              onClick={() => setPrivacy(!privacy)}
              className={cn(
                "inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-2.5 text-xs font-medium sm:px-3",
                privacy ? "border-accent text-accent" : "border-border text-muted",
              )}
              aria-pressed={privacy}
              title="Privacy Mode hides currency amounts"
            >
              {privacy ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              <span className="hidden sm:inline">Privacy</span>
            </button>
            <button
              type="button"
              onClick={() => setPalette(true)}
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md border border-border px-2.5 text-xs text-muted sm:px-3"
              aria-label="Open command palette"
            >
              <Search className="size-4" />
              <span className="hidden font-mono sm:inline">⌘K</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-52 shrink-0 border-r border-border lg:flex lg:flex-col">
          <NavList pathname={pathname} />
          <SideFooter modeLabel={modeLabel} />
        </aside>

        {drawer ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-bg/70"
              aria-label="Close navigation"
              onClick={() => setDrawer(false)}
            />
            <aside className="relative flex h-full w-64 flex-col border-r border-border bg-surface">
              <div className="flex h-14 items-center justify-between px-3">
                <span className="text-sm tracking-[0.22em]">NORDLYS</span>
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center"
                  onClick={() => setDrawer(false)}
                  aria-label="Close"
                >
                  <X className="size-5" />
                </button>
              </div>
              <NavList pathname={pathname} />
              <SideFooter modeLabel={modeLabel} />
            </aside>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 pb-20 lg:pb-0">{children}</main>
      </div>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-bg max-lg:flex hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Mobile"
      >
        {mobileNav.map((item) => {
          const Icon = ICONS[item.id] ?? LineChart;
          const active = pathname === item.path;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                "flex h-14 min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] no-underline",
                active ? "text-accent" : "text-muted",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
      <ShowTour />
    </div>
  );
}

function SideFooter({ modeLabel }: { modeLabel: string }) {
  return (
    <div className="mt-auto border-t border-border p-3">
      <button
        type="button"
        onClick={requestShowTour}
        className="flex h-11 w-full items-center justify-center rounded-md border border-border text-sm text-fg"
      >
        Show this
      </button>
      <div className="px-1 pt-3 font-mono text-[11px] text-subtle">{modeLabel}</div>
    </div>
  );
}

function NavList({ pathname }: { pathname: string }) {
  return (
    <nav className="flex flex-col gap-0.5 p-3" aria-label="Primary">
      {NAV.map((item) => {
        const Icon = ICONS[item.id] ?? LineChart;
        const active = item.enabled && pathname === item.path;
        if (!item.enabled) {
          return (
            <span
              key={item.id}
              className="flex h-11 items-center gap-3 rounded-md px-3 text-sm text-subtle"
              title="Not in this release"
            >
              <Icon className="size-4" />
              {item.label}
            </span>
          );
        }
        return (
          <Link
            key={item.id}
            to={item.path}
            className={cn(
              "flex h-11 items-center gap-3 rounded-md px-3 text-sm no-underline",
              active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}