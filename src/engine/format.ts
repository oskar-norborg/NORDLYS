import type { CurrencyCode } from "./types";

const LOCALES: Record<CurrencyCode, string> = {
  NOK: "nb-NO",
  USD: "en-US",
  EUR: "de-DE",
};

export function formatMoney(
  value: number,
  currency: CurrencyCode,
  privacy: boolean,
  opts?: { digits?: number },
): string {
  if (privacy) return "••••";
  const digits = opts?.digits ?? 0;
  try {
    return new Intl.NumberFormat(LOCALES[currency], {
      style: "currency",
      currency,
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    }).format(value);
  } catch {
    return `${value.toFixed(digits)} ${currency}`;
  }
}

export function formatNumber(value: number, privacy: boolean, digits = 0): string {
  if (privacy) return "••••";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function formatPct(value: number, digits = 1, signed = false): string {
  const pct = value * 100;
  const body = pct.toFixed(digits);
  if (signed && pct > 0) return `+${body}%`;
  return `${body}%`;
}

export function formatBp(fee: number): string {
  return `${Math.round(fee * 10000)} bp`;
}

export function indexValue(value: number, base: number): number {
  if (base === 0) return 100;
  return (value / base) * 100;
}

export function formatIndex(value: number, base: number, digits = 1): string {
  return indexValue(value, base).toFixed(digits);
}

export function shortMoney(value: number, currency: CurrencyCode, privacy: boolean): string {
  if (privacy) return "••••";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const unit =
    abs >= 1e9 ? `${(abs / 1e9).toFixed(2)}bn` : abs >= 1e6 ? `${(abs / 1e6).toFixed(2)}m` : abs >= 1e3 ? `${(abs / 1e3).toFixed(1)}k` : abs.toFixed(0);
  return `${sign}${unit} ${currency}`;
}
