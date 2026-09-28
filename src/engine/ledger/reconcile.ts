/** Recompute Saldo and Totalt antall; list mismatches. */

import type { NordnetRow, ReconIssue, ReconResult, TxKind } from "./types";
import { MONEY_EPS, QTY_ROUND_EPS } from "./types";
import { round2, round4 } from "./numbers";
import { classifyType } from "./classify";

function idNum(id: string): number {
  const n = Number(id);
  return Number.isFinite(n) ? n : NaN;
}

function byIdAsc(a: NordnetRow, b: NordnetRow): number {
  const ai = idNum(a.id);
  const bi = idNum(b.id);
  if (Number.isFinite(ai) && Number.isFinite(bi) && ai !== bi) return ai - bi;
  return a.id.localeCompare(b.id, undefined, { numeric: true });
}

/** Rows that actually change a position. UTBYTTE / KUPONGSKATT do not. */
export function isQtyChangingKind(kind: TxKind | null): boolean {
  return kind === "buy" || kind === "sell" || kind === "split" || kind === "other_corporate";
}

export function signedQty(row: NordnetRow, kind: TxKind | null): number {
  if (kind === "sell") return -Math.abs(row.qty);
  if (kind === "buy") return Math.abs(row.qty);
  if (kind === "split" || kind === "other_corporate") return row.qty;
  return 0;
}

export function reconcileRows(rows: NordnetRow[]): ReconResult {
  const active = rows.filter((r) => !r.cancelDate).slice().sort(byIdAsc);
  const issues: ReconIssue[] = [];
  let saldo = 0;
  let opening = 0;
  const qty = new Map<string, number>();

  if (active.length && active[0]!.saldo != null) {
    opening = round2(active[0]!.saldo - active[0]!.amount);
    saldo = opening;
  }

  for (const row of active) {
    saldo = round2(saldo + row.amount);
    if (row.saldo != null && !Number.isNaN(row.saldo)) {
      const delta = round2(saldo - row.saldo);
      if (Math.abs(delta) > MONEY_EPS) {
        issues.push({
          rowNumber: row.rowNumber,
          nordnetId: row.id,
          field: "saldo",
          expected: saldo,
          reported: row.saldo,
          delta,
          level: "error",
        });
        saldo = row.saldo;
      }
    }

    const kind = classifyType(row.rawType, {});
    if (!row.isin || !isQtyChangingKind(kind)) continue;

    const signed = signedQty(row, kind);
    if (kind === "other_corporate" && signed === 0) continue;
    const next = round4((qty.get(row.isin) ?? 0) + signed);
    qty.set(row.isin, next);

    if (row.totalQty != null) {
      const qDelta = round4(next - row.totalQty);
      if (Math.abs(qDelta) > 0) {
        issues.push({
          rowNumber: row.rowNumber,
          nordnetId: row.id,
          field: "qty",
          expected: next,
          reported: row.totalQty,
          delta: qDelta,
          level: Math.abs(qDelta) <= QTY_ROUND_EPS ? "info" : "error",
        });
        // Never reset the running count to the file's value after a mismatch.
      }
    }
  }

  const closing = active.length ? (active[active.length - 1]!.saldo ?? saldo) : opening;
  return {
    issues,
    saldoErrors: issues.filter((i) => i.field === "saldo" && i.level === "error").length,
    qtyErrors: issues.filter((i) => i.field === "qty" && i.level === "error").length,
    qtyRounding: issues.filter((i) => i.field === "qty" && i.level === "info").length,
    openingSaldo: opening,
    closingSaldo: closing,
  };
}
