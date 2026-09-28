/** Time-weighted return (linked sub-periods) and money-weighted return (XIRR). */

import type { CostMethod, LedgerBundle, NavPoint, ReturnStats, Transaction } from "./types";
import { computeHoldings } from "./holdings";
import { daysBetween } from "./numbers";

const EXTERNAL = new Set(["deposit", "withdrawal"]);

export function xirr(
  flows: { date: string; amount: number }[],
  guess = 0.1,
): number {
  const xs = flows
    .filter((f) => f.amount !== 0 && f.date)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
  if (xs.length < 2) return NaN;
  const t0 = Date.parse(xs[0]!.date + "T00:00:00Z");
  const times = xs.map((f) => (Date.parse(f.date + "T00:00:00Z") - t0) / (365 * 86400000));
  const amounts = xs.map((f) => f.amount);

  const npv = (r: number): number => {
    let s = 0;
    for (let i = 0; i < amounts.length; i++) s += amounts[i]! / Math.pow(1 + r, times[i]!);
    return s;
  };
  const dnpv = (r: number): number => {
    let s = 0;
    for (let i = 0; i < amounts.length; i++) {
      s += (-times[i]! * amounts[i]!) / Math.pow(1 + r, times[i]! + 1);
    }
    return s;
  };

  let r = guess;
  for (let i = 0; i < 80; i++) {
    const f = npv(r);
    const df = dnpv(r);
    if (!Number.isFinite(f) || !Number.isFinite(df) || Math.abs(df) < 1e-18) break;
    const next = r - f / df;
    if (!Number.isFinite(next) || next <= -0.999999) {
      r = (r - 0.4) * 0.5;
      continue;
    }
    if (Math.abs(next - r) < 1e-14) return next;
    r = next;
  }

  let lo = -0.999999;
  let hi = 20;
  let flo = npv(lo);
  const fhi = npv(hi);
  if (flo * fhi > 0 && Math.abs(npv(r)) < 1e-8) return r;
  for (let i = 0; i < 220; i++) {
    const mid = (lo + hi) / 2;
    const fm = npv(mid);
    if (Math.abs(fm) < 1e-14) return mid;
    if (flo * fm <= 0) hi = mid;
    else {
      lo = mid;
      flo = fm;
    }
  }
  return (lo + hi) / 2;
}

function uniqueDates(txs: Transaction[], extra: string[]): string[] {
  const s = new Set<string>(extra);
  for (const t of txs) s.add(t.tradeDate || t.bookingDate);
  return [...s].filter(Boolean).sort();
}

function monthEnds(start: string, end: string): string[] {
  const out: string[] = [];
  const [ys, ms] = start.split("-").map(Number);
  let y = ys!;
  let m = ms!;
  const endKey = end.slice(0, 7);
  while (`${y}-${String(m).padStart(2, "0")}` <= endKey) {
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const iso = `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
    if (iso >= start && iso <= end) out.push(iso);
    m += 1;
    if (m === 13) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

export function computeReturns(
  ledger: LedgerBundle,
  method: CostMethod,
  asOf: string,
): ReturnStats {
  const txs = ledger.transactions.filter((t) => !t.cancelled && (t.tradeDate || t.bookingDate) <= asOf);
  if (txs.length === 0) {
    return {
      twr: 0,
      xirr: NaN,
      startDate: asOf,
      endDate: asOf,
      startValue: 0,
      endValue: 0,
      nav: [],
    };
  }
  const start = txs[0]!.tradeDate || txs[0]!.bookingDate;
  const dates = uniqueDates(txs, [start, asOf, ...monthEnds(start, asOf)]);
  const byDate = new Map<string, Transaction[]>();
  for (const t of txs) {
    const d = t.tradeDate || t.bookingDate;
    const list = byDate.get(d) ?? [];
    list.push(t);
    byDate.set(d, list);
  }

  const nav: NavPoint[] = [];
  for (const d of dates) {
    const snap = computeHoldings(ledger, method, d);
    const ext = (byDate.get(d) ?? [])
      .filter((t) => EXTERNAL.has(t.kind))
      .reduce((s, t) => s + t.amount, 0);
    nav.push({
      date: d,
      value: snap.totalMarket,
      cash: snap.cash,
      holdings: snap.totalMarket - snap.cash,
      externalCf: ext,
    });
  }

  let twr = 1;
  for (let i = 1; i < nav.length; i++) {
    const prev = nav[i - 1]!.value;
    const cur = nav[i]!;
    const cf = cur.externalCf;
    const begin = prev;
    if (Math.abs(begin) < 1e-8) continue;
    const r = (cur.value - cf - begin) / begin;
    if (Number.isFinite(r) && r > -0.9999 && r < 20) twr *= 1 + r;
  }
  twr -= 1;

  const firstPositive = nav.find((p) => p.value > 0) ?? nav[0]!;
  const last = nav[nav.length - 1]!;
  const flows: { date: string; amount: number }[] = [];
  flows.push({ date: firstPositive.date, amount: -(firstPositive.value - firstPositive.externalCf) });
  for (const p of nav) {
    if (p.date === firstPositive.date) {
      if (p.externalCf) flows.push({ date: p.date, amount: -p.externalCf });
    } else if (p.externalCf) {
      flows.push({ date: p.date, amount: -p.externalCf });
    }
  }
  flows.push({ date: last.date, amount: last.value });

  const cleaned: { date: string; amount: number }[] = [];
  const acc = new Map<string, number>();
  for (const f of flows) acc.set(f.date, (acc.get(f.date) ?? 0) + f.amount);
  for (const [date, amount] of [...acc.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (Math.abs(amount) > 1e-8) cleaned.push({ date, amount });
  }

  let irr = NaN;
  try {
    irr = xirr(cleaned, 0.08);
  } catch {
    irr = NaN;
  }

  return {
    twr,
    xirr: irr,
    startDate: firstPositive.date,
    endDate: last.date,
    startValue: firstPositive.value,
    endValue: last.value,
    nav,
  };
}

export function annualize(r: number, start: string, end: string): number {
  const years = daysBetween(start, end) / 365;
  if (years <= 0 || r <= -1) return r;
  return Math.pow(1 + r, 1 / years) - 1;
}
