/** Transaction-type recognition across Nordnet's Nordic + English exports. */

import type { TxKind } from "./types";

function normType(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

const EXACT: Record<string, TxKind> = {
  KJOPT: "buy",
  KØBT: "buy",
  KOBT: "buy",
  KOPT: "buy",
  "KÖPT": "buy",
  OSTO: "buy",
  BUY: "buy",
  BOUGHT: "buy",
  KJØPT: "buy",

  SALG: "sell",
  SALGT: "sell",
  SOLGT: "sell",
  SALD: "sell",
  "SÅLD": "sell",
  SOLD: "sell",
  SELL: "sell",
  MYYNTI: "sell",

  INNSKUDD: "deposit",
  INSETTING: "deposit",
  INSATTNING: "deposit",
  "INSÄTTNING": "deposit",
  INDBETALING: "deposit",
  TALLETONO: "deposit",
  DEPOSIT: "deposit",
  "CASH DEPOSIT": "deposit",

  UTTAK: "withdrawal",
  "UTTAK INTERNT": "withdrawal",
  "UTTAK EKSTERNT": "withdrawal",
  "INTERN UTTAG": "withdrawal",
  UTTAG: "withdrawal",
  "INTERN HAEVNING": "withdrawal",
  "INTERN HÆVNING": "withdrawal",
  HAEVNING: "withdrawal",
  "SISAINEN NOSTO": "withdrawal",
  NOSTO: "withdrawal",
  WITHDRAWAL: "withdrawal",
  "INTERNAL WITHDRAWAL": "withdrawal",
  "CASH WITHDRAWAL": "withdrawal",

  UTBYTTE: "dividend",
  UTDELNING: "dividend",
  UDBYTTE: "dividend",
  OSINKO: "dividend",
  DIVIDEND: "dividend",
  DIVIDENDI: "dividend",

  KUPONGSKATT: "withholding_tax",
  KUPONSKAT: "withholding_tax",
  KALLSKATT: "withholding_tax",
  "KÄLLSKATT": "withholding_tax",
  LAHDEVERO: "withholding_tax",
  "LÄHDEVERO": "withholding_tax",
  "WITHHOLDING TAX": "withholding_tax",
  "DIVIDEND WITHHOLDING TAX": "withholding_tax",
  KILDESSKATT: "withholding_tax",

  PLATTFORMAVGIFT: "fee",
  PLATTFORMGEBYR: "fee",
  PLATFORMGEBYR: "fee",
  ALUSTAMAKSU: "fee",
  "PLATFORM FEE": "fee",
  "PLATFORMFEES": "fee",
  DEPOTGEBYR: "fee",
  DEPOTAVGIFT: "fee",
  KURTAGE: "fee",
  COURTAGE: "fee",

  RENTE: "interest",
  RANTA: "interest",
  "RÄNTA": "interest",
  RENTEINNTEKT: "interest",
  INTEREST: "interest",
  KORKO: "interest",

  VALUTAVEKSLING: "currency_exchange",
  VALUTAVAXLING: "currency_exchange",
  "VALUTAVÄXLING": "currency_exchange",
  VALUTAHANDEL: "currency_exchange",
  VEKSLING: "currency_exchange",
  FX: "currency_exchange",
  "CURRENCY EXCHANGE": "currency_exchange",
  "CURRENCY CONVERSION": "currency_exchange",
  "FX TRADE": "currency_exchange",

  SPLITT: "split",
  SPLIT: "split",
  AKSJESPLITT: "split",
  AKTIESPLIT: "split",
  STOCKSPLIT: "split",
  "STOCK SPLIT": "split",

  EMISSION: "other_corporate",
  NYEMISSION: "other_corporate",
  FUSION: "other_corporate",
  MERGER: "other_corporate",
  SPINOFF: "other_corporate",
  "SPIN-OFF": "other_corporate",
  INLOSNING: "other_corporate",
  "INLÖSNING": "other_corporate",
  TILDELING: "other_corporate",
  "CORPORATE ACTION": "other_corporate",
};

export function classifyType(rawType: string, mappings: Record<string, TxKind>): TxKind | null {
  const trimmed = rawType.trim();
  if (!trimmed) return null;
  if (mappings[trimmed]) return mappings[trimmed]!;
  const key = normType(trimmed);
  if (mappings[key]) return mappings[key]!;
  if (EXACT[trimmed.toUpperCase()]) return EXACT[trimmed.toUpperCase()]!;
  if (EXACT[key]) return EXACT[key]!;
  if (EXACT[key.replace(/ /g, "")]) return EXACT[key.replace(/ /g, "")]!;
  if (/VALUTA/.test(key) && /VEKSL|VAXL|VÄXL|EXCHANGE|HANDEL|CONVERSION/.test(key)) {
    return "currency_exchange";
  }
  return null;
}

export function classifyKey(rawType: string): string {
  return normType(rawType);
}
