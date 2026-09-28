export interface NavItem {
  id: string;
  label: string;
  path: string;
  enabled: boolean;
  hint: string;
}

/** Stage flags — later stages flip `enabled` without renaming routes. */
export const NAV: NavItem[] = [
  { id: "planner", label: "Planner", path: "/", enabled: true, hint: "Client planning" },
  { id: "portfolio", label: "Portfolio", path: "/portfolio", enabled: true, hint: "Holdings" },
  { id: "import", label: "Import", path: "/import", enabled: true, hint: "Account import" },
  { id: "risk", label: "Risk", path: "/risk", enabled: true, hint: "Risk analytics" },
  { id: "options", label: "Options", path: "/options", enabled: true, hint: "Options overlay" },
  { id: "backtest", label: "Backtest", path: "/backtest", enabled: true, hint: "Historical replay" },
  { id: "help", label: "Help", path: "/help", enabled: true, hint: "How to use NORDLYS" },
  { id: "diagnostics", label: "Diagnostics", path: "/diagnostics", enabled: true, hint: "Built-in tests" },
  { id: "about", label: "About", path: "/about", enabled: true, hint: "Method and privacy" },
];

/** Primary tabs on a phone-width bar. Full list lives in the drawer and sidebar. */
export const MOBILE_NAV_IDS = ["planner", "portfolio", "import", "backtest", "help"] as const;