/** Locale-aware number and date parsing. No external libraries. */

const SPACES = /[\s\u00A0\u202F\u2007\u2009\u200A]/g;
const CURRENCY_TOKEN = /(?:NOK|USD|EUR|SEK|DKK|GBP|CHF|JPY|AUD|CAD|\$|€|£|kr\.?)/gi;

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function round4(n: number): number {
  return Math.round((n + Number.EPSILON) * 10000) / 10000;
}

export function almostEqual(a: number, b: number, eps: number): boolean {
  return Math.abs(a - b) <= eps;
}

/**
 * Parse a numeric cell in any of the common bank/CSV conventions:
 *   "1 234,56"  "1\u00A0234,56"  "1.234,56"  "$1,234.56" → 1234.56
 *   "(1,234.56)"  "1234,56-" → -1234.56
 */
export function parseNumber(raw: string | number | null | undefined): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (raw == null) return null;
  let s = String(raw).trim();
  if (s === "" || s === "-" || s === "–") return null;

  let neg = false;
  if (s.startsWith("(") && s.endsWith(")")) {
    neg = true;
    s = s.slice(1, -1).trim();
  }
  if (s.endsWith("-") || s.endsWith("−")) {
    neg = true;
    s = s.slice(0, -1).trim();
  }
  if (s.startsWith("+")) s = s.slice(1).trim();
  if (s.startsWith("-") || s.startsWith("−")) {
    neg = true;
    s = s.slice(1).trim();
  }

  s = s.replace(CURRENCY_TOKEN, "");
  s = s.replace(SPACES, "");
  s = s.replace(/['`]/g, "");
  if (s === "") return null;

  if (/^\d+$/.test(s)) {
    const n = Number(s);
    return Number.isFinite(n) ? (neg ? -n : n) : null;
  }
  if (/^\d+\.\d+$/.test(s)) {
    const n = Number(s);
    return Number.isFinite(n) ? (neg ? -n : n) : null;
  }

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  let normalized: string;
  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      normalized = s.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = s.replace(/,/g, "");
    }
  } else if (lastComma >= 0) {
    const commas = (s.match(/,/g) ?? []).length;
    const frac = s.length - lastComma - 1;
    if (commas > 1 && frac === 3) normalized = s.replace(/,/g, "");
    else normalized = s.replace(",", ".");
  } else if (lastDot >= 0) {
    const dots = (s.match(/\./g) ?? []).length;
    const frac = s.length - lastDot - 1;
    if (dots > 1 && frac === 3) normalized = s.replace(/\./g, "");
    else normalized = s;
  } else {
    normalized = s;
  }

  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return neg ? -n : n;
}

export function parseNumberOr0(raw: string | number | null | undefined): number {
  return parseNumber(raw) ?? 0;
}

/** Return ISO YYYY-MM-DD, or null. */
export function parseDate(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = raw.trim();
  if (!s) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(s);
  if (dmy) {
    const dd = dmy[1]!.padStart(2, "0");
    const mm = dmy[2]!.padStart(2, "0");
    return `${dmy[3]}-${mm}-${dd}`;
  }
  const mdy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (mdy) {
    const mm = mdy[1]!.padStart(2, "0");
    const dd = mdy[2]!.padStart(2, "0");
    return `${mdy[3]}-${mm}-${dd}`;
  }
  const us = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(s);
  if (us) {
    const a = Number(us[1]);
    const b = Number(us[2]);
    if (a > 12) {
      return `${us[3]}-${String(b).padStart(2, "0")}-${String(a).padStart(2, "0")}`;
    }
    return `${us[3]}-${String(a).padStart(2, "0")}-${String(b).padStart(2, "0")}`;
  }
  return null;
}

export function formatIso(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d! + days));
  return formatIso(dt);
}

export function daysBetween(a: string, b: string): number {
  const ta = Date.parse(a + "T00:00:00Z");
  const tb = Date.parse(b + "T00:00:00Z");
  return Math.round((tb - ta) / 86400000);
}

export function nnNumber(n: number, decimals: number): string {
  if (!Number.isFinite(n)) return "";
  const sign = n < 0 ? "-" : "";
  return sign + Math.abs(n).toFixed(decimals).replace(".", ",");
}
