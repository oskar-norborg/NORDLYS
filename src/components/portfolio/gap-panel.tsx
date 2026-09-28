import { Panel } from "@/components/ui/field";
import { analyzeGap } from "@/engine/ledger/gap";
import type { HoldingsResult } from "@/engine/ledger/types";
import type { ModelPortfolio } from "@/engine/types";
import { ASSET_LABELS } from "@/engine/types";
import { formatMoney, formatPct } from "@/engine/format";
import { cn } from "@/lib/utils";

export function GapPanel({
  holdings,
  model,
  securities,
  privacy,
}: {
  holdings: HoldingsResult;
  model: ModelPortfolio;
  securities: HoldingsResult["holdings"][number]["security"][] | { isin: string; name: string; ticker: string; currency: string; exchange: string; assetClass: HoldingsResult["allocation"][number]["assetClass"] }[];
  privacy: boolean;
}) {
  const gap = analyzeGap(holdings, model, securities);
  return (
    <Panel kicker="Alignment" title={`Gap vs ${model.name}`}>
      <p className="mb-4 text-sm text-muted">
        Current holdings against the recommended book. Trades are whole shares at last price.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="px-2 py-2 font-medium">Class</th>
              <th className="px-2 py-2 font-medium">Now</th>
              <th className="px-2 py-2 font-medium">Target</th>
              <th className="px-2 py-2 font-medium">Gap</th>
            </tr>
          </thead>
          <tbody>
            {gap.rows.map((r) => (
              <tr key={r.assetClass} className="border-b border-border last:border-0">
                <td className="px-2 py-2">{ASSET_LABELS[r.assetClass]}</td>
                <td className="px-2 py-2 font-mono tabular-nums">{formatPct(r.currentWeight, 1)}</td>
                <td className="px-2 py-2 font-mono tabular-nums">{formatPct(r.targetWeight, 1)}</td>
                <td
                  className={cn(
                    "px-2 py-2 font-mono tabular-nums",
                    r.gap > 50 ? "text-ok" : r.gap < -50 ? "text-danger" : "text-muted",
                  )}
                >
                  {privacy ? formatPct(r.targetWeight - r.currentWeight, 1, true) : formatMoney(r.gap, "NOK", false)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 className="mt-5 mb-2 text-sm font-medium">Rebalancing trades</h3>
      {gap.trades.length === 0 ? (
        <p className="text-sm text-muted">No whole-share trade larger than the residual. Book is close enough.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {gap.trades.map((t) => (
            <li
              key={`${t.side}-${t.isin}`}
              className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
            >
              <span>
                <span className={t.side === "buy" ? "text-ok" : "text-danger"}>{t.side === "buy" ? "Buy" : "Sell"}</span>{" "}
                {t.shares} {t.ticker}
                <span className="text-muted"> · {t.name}</span>
              </span>
              <span className="font-mono text-xs tabular-nums text-muted">
                {privacy ? formatPct(t.valueNok / Math.max(gap.total, 1), 2) : formatMoney(t.valueNok, "NOK", false)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
