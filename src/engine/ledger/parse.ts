/** Encoding detection, delimiter sniffing, CSV split, Nordnet 30-column parse. */

import {
  NORDNET_COL,
  NORDNET_COL_COUNT,
  NORDNET_HEADERS_NB,
  type NordnetRow,
  type ParseMeta,
} from "./types";
import { parseDate, parseNumber, parseNumberOr0 } from "./numbers";

export function decodeText(buf: ArrayBuffer | Uint8Array): { text: string; encoding: string } {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  if (u8.length >= 2 && u8[0] === 0xff && u8[1] === 0xfe) {
    return { text: new TextDecoder("utf-16le").decode(u8.subarray(2)), encoding: "utf-16le" };
  }
  if (u8.length >= 2 && u8[0] === 0xfe && u8[1] === 0xff) {
    return { text: new TextDecoder("utf-16be").decode(u8.subarray(2)), encoding: "utf-16be" };
  }
  if (u8.length >= 3 && u8[0] === 0xef && u8[1] === 0xbb && u8[2] === 0xbf) {
    return { text: new TextDecoder("utf-8").decode(u8.subarray(3)), encoding: "utf-8-bom" };
  }
  if (looksLikeUtf16(u8, "le")) {
    return { text: new TextDecoder("utf-16le").decode(u8), encoding: "utf-16le" };
  }
  if (looksLikeUtf16(u8, "be")) {
    return { text: new TextDecoder("utf-16be").decode(u8), encoding: "utf-16be" };
  }
  return { text: new TextDecoder("utf-8").decode(u8), encoding: "utf-8" };
}

function looksLikeUtf16(u8: Uint8Array, endian: "le" | "be"): boolean {
  if (u8.length < 8) return false;
  const n = Math.min(u8.length, 400);
  let zeros = 0;
  const odd = endian === "le" ? 1 : 0;
  for (let i = odd; i < n; i += 2) if (u8[i] === 0) zeros += 1;
  return zeros / (n / 2) > 0.3;
}

export function encodeUtf16Le(text: string, bom = true): Uint8Array {
  const extra = bom ? 2 : 0;
  const out = new Uint8Array(extra + text.length * 2);
  let o = 0;
  if (bom) {
    out[o++] = 0xff;
    out[o++] = 0xfe;
  }
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    out[o++] = c & 0xff;
    out[o++] = (c >> 8) & 0xff;
  }
  return out;
}

export function splitLines(text: string): { lines: string[]; lineEnding: ParseMeta["lineEnding"] } {
  let crlf = 0;
  let lf = 0;
  let cr = 0;
  const lines: string[] = [];
  let cur = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (ch === "\r") {
      if (text[i + 1] === "\n") {
        crlf += 1;
        i += 1;
      } else cr += 1;
      lines.push(cur);
      cur = "";
    } else if (ch === "\n") {
      lf += 1;
      lines.push(cur);
      cur = "";
    } else cur += ch;
  }
  if (cur.length || text.endsWith("\n") || text.endsWith("\r")) {
    if (cur.length) lines.push(cur);
  }
  const kinds = [crlf > 0, lf > 0, cr > 0].filter(Boolean).length;
  const lineEnding: ParseMeta["lineEnding"] =
    kinds > 1 ? "mixed" : crlf > 0 ? "crlf" : cr > 0 ? "cr" : "lf";
  while (lines.length && lines[lines.length - 1] === "") lines.pop();
  return { lines, lineEnding };
}

function countUnquoted(line: string, delim: string): number {
  let n = 0;
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (q && line[i + 1] === '"') i += 1;
      else q = !q;
    } else if (!q && ch === delim) n += 1;
  }
  return n;
}

export function detectDelimiter(headerLine: string): string {
  const tab = countUnquoted(headerLine, "\t");
  const semi = countUnquoted(headerLine, ";");
  const comma = countUnquoted(headerLine, ",");
  if (tab >= semi && tab >= comma && tab > 0) return "\t";
  if (semi >= comma && semi > 0) return ";";
  if (comma > 0) return ",";
  return "\t";
}

export function splitCsvLine(line: string, delimiter: string): string[] {
  if (!line.includes('"')) {
    const parts = line.split(delimiter);
    for (let i = 0; i < parts.length; i++) parts[i] = parts[i]!.trim();
    return parts;
  }
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else q = !q;
    } else if (!q && ch === delimiter) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

export function csvEscape(value: string, delimiter: string): string {
  if (value.includes('"') || value.includes(delimiter) || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const HEADER_ALIASES: Record<string, keyof typeof NORDNET_COL | "skip"> = {};

function alias(keys: string[], field: keyof typeof NORDNET_COL) {
  for (const k of keys) HEADER_ALIASES[normHeader(k)] = field;
}

function normHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

alias(["Id", "ID", "Transaksjons-id", "Transaction id"], "id");
alias(
  ["Bokføringsdag", "Bokforingsdag", "Bokföringsdag", "Bogføringsdag", "Kirjauspäivä", "Booking day", "Booked", "Accounting date"],
  "bookingDate",
);
alias(
  ["Handelsdag", "Affärsdag", "Kauppapäivä", "Trade date", "Trade day", "Transaction date"],
  "tradeDate",
);
alias(
  ["Oppgjørsdag", "Likviddag", "Afviklingsdag", "Selvityspäivä", "Settlement date", "Settlement day"],
  "settleDate",
);
alias(["Portefølje", "Portfölj", "Salkku", "Portfolio", "Account"], "portfolio");
alias(
  ["Transaksjonstype", "Transaktionstyp", "Tapahtumatyyppi", "Transaction type", "Type"],
  "type",
);
alias(["Verdipapir", "Värdepapper", "Værdipapir", "Arvopaperi", "Security", "Instrument", "Name"], "security");
alias(["ISIN"], "isin");
alias(["Antall", "Antal", "Määrä", "Quantity", "Qty", "Shares"], "qty");
alias(["Kurs", "Kurssi", "Price", "Rate"], "price");
alias(["Rente", "Ränta", "Ränta", "Korko", "Interest"], "interest");
alias(
  ["Totale Avgifter", "Totale avgifter", "Courtage totalt", "Total fees", "Fees", "Avgift"],
  "totalFees",
);
alias(["Beløp", "Belopp", "Amount", "Summa"], "amount");
alias(["Kjøpsverdi", "Anskaffningsvärde", "Purchase value", "Cost"], "purchaseValue");
alias(["Resultat", "Result", "Tulos", "Gain"], "result");
alias(["Totalt antall", "Totalt antal", "Total quantity", "Balance qty"], "totalQty");
alias(["Saldo", "Balance", "Cash balance"], "saldo");
alias(["Vekslingskurs", "Växelkurs", "Exchange rate", "FX rate", "Fx"], "fxRate");
alias(
  ["Transaksjonstekst", "Transaktionstext", "Text", "Description", "Memo"],
  "text",
);
alias(["Makuleringsdato", "Makuleringsdatum", "Cancellation date", "Cancelled"], "cancelDate");
alias(["Sluttseddelnummer", "Slutsedelnummer", "Note number", "Contract note"], "noteNumber");
alias(["Verifikationsnummer", "Verification number", "Verificate"], "verification");
alias(["Kurtasje", "Courtage", "Brokerage", "Commission"], "brokerage");
alias(["Valutakurs", "Valutakursi"], "valutakurs");
alias(["Innledende rente", "Ingående ränta", "Initial interest"], "initialInterest");

function isNordnetHeader(headers: string[]): boolean {
  if (headers.length >= NORDNET_COL_COUNT && normHeader(headers[0] ?? "") === "id") return true;
  const hits = headers.filter((h) => HEADER_ALIASES[normHeader(h)]).length;
  return hits >= 8 && headers.length >= 14;
}

export function parseTable(text: string): { headers: string[]; rows: string[][]; meta: ParseMeta } {
  const { lines, lineEnding } = splitLines(text.replace(/^\uFEFF/, ""));
  if (lines.length === 0) {
    return {
      headers: [],
      rows: [],
      meta: { encoding: "", delimiter: "\t", lineEnding, headerCount: 0, positional: false, headers: [] },
    };
  }
  let headerIdx = 0;
  while (headerIdx < lines.length && lines[headerIdx]!.trim() === "") headerIdx += 1;
  const headerLine = lines[headerIdx] ?? "";
  const delimiter = detectDelimiter(headerLine);
  const headers = splitCsvLine(headerLine, delimiter);
  const rows: string[][] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.trim() === "") continue;
    rows.push(splitCsvLine(line, delimiter));
  }
  const positional = headers.length >= NORDNET_COL_COUNT && isNordnetHeader(headers);
  return {
    headers,
    rows,
    meta: {
      encoding: "",
      delimiter: delimiter === "\t" ? "tab" : delimiter,
      lineEnding,
      headerCount: headers.length,
      positional,
      headers,
    },
  };
}

function cell(cells: string[], i: number): string {
  return (cells[i] ?? "").trim();
}

function numCell(cells: string[], i: number): number {
  return parseNumberOr0(cell(cells, i));
}

function numOrNull(cells: string[], i: number): number | null {
  const raw = cell(cells, i);
  if (raw === "") return null;
  return parseNumber(raw);
}

function dateCell(cells: string[], i: number): string {
  return parseDate(cell(cells, i)) ?? cell(cells, i);
}

function buildIndexMap(headers: string[]): number[] {
  const map = Array.from({ length: NORDNET_COL_COUNT }, () => -1);
  const seenValuta: number[] = [];
  for (let i = 0; i < headers.length; i++) {
    const n = normHeader(headers[i] ?? "");
    if (n === "valuta" || n === "currency" || n === "ccy") {
      seenValuta.push(i);
      continue;
    }
    const field = HEADER_ALIASES[n];
    if (field && field !== "skip" && map[NORDNET_COL[field]] === -1) {
      map[NORDNET_COL[field]] = i;
    }
  }
  const valutaTargets = [
    NORDNET_COL.feeCcy,
    NORDNET_COL.amountCcy,
    NORDNET_COL.purchaseCcy,
    NORDNET_COL.resultCcy,
    NORDNET_COL.brokerageCcy,
  ];
  for (let k = 0; k < valutaTargets.length && k < seenValuta.length; k++) {
    map[valutaTargets[k]!] = seenValuta[k]!;
  }
  return map;
}

function mappedCell(cells: string[], map: number[] | null, pos: number): string {
  if (!map) return cell(cells, pos);
  const i = map[pos]!;
  if (i < 0) return "";
  return cell(cells, i);
}

export function rowsToNordnet(
  headers: string[],
  rows: string[][],
  positional: boolean,
): NordnetRow[] {
  const map = positional ? null : buildIndexMap(headers);
  const out: NordnetRow[] = [];
  for (let r = 0; r < rows.length; r++) {
    const cells = rows[r]!;
    const get = (pos: number) => mappedCell(cells, map, pos);
    const getNum = (pos: number) => parseNumberOr0(get(pos));
    const getNumNull = (pos: number) => {
      const raw = get(pos);
      if (raw === "") return null;
      return parseNumber(raw);
    };
    if (cells.every((c) => c.trim() === "")) continue;
    out.push({
      rowNumber: r + 2,
      cells,
      id: get(NORDNET_COL.id),
      bookingDate: parseDate(get(NORDNET_COL.bookingDate)) ?? get(NORDNET_COL.bookingDate),
      tradeDate: parseDate(get(NORDNET_COL.tradeDate)) ?? get(NORDNET_COL.tradeDate),
      settleDate: parseDate(get(NORDNET_COL.settleDate)) ?? get(NORDNET_COL.settleDate),
      portfolio: get(NORDNET_COL.portfolio),
      rawType: get(NORDNET_COL.type),
      name: get(NORDNET_COL.security),
      isin: get(NORDNET_COL.isin),
      qty: getNum(NORDNET_COL.qty),
      price: getNum(NORDNET_COL.price),
      interest: getNum(NORDNET_COL.interest),
      totalFees: getNum(NORDNET_COL.totalFees),
      feeCcy: get(NORDNET_COL.feeCcy),
      amount: getNum(NORDNET_COL.amount),
      amountCcy: get(NORDNET_COL.amountCcy),
      purchaseValue: getNum(NORDNET_COL.purchaseValue),
      purchaseCcy: get(NORDNET_COL.purchaseCcy),
      result: getNum(NORDNET_COL.result),
      resultCcy: get(NORDNET_COL.resultCcy),
      totalQty: getNumNull(NORDNET_COL.totalQty),
      saldo: getNumNull(NORDNET_COL.saldo),
      fxRate: getNum(NORDNET_COL.fxRate),
      text: get(NORDNET_COL.text),
      cancelDate: parseDate(get(NORDNET_COL.cancelDate)) ?? get(NORDNET_COL.cancelDate),
      noteNumber: get(NORDNET_COL.noteNumber),
      verification: get(NORDNET_COL.verification),
      brokerage: getNum(NORDNET_COL.brokerage),
      brokerageCcy: get(NORDNET_COL.brokerageCcy),
      valutakurs: getNum(NORDNET_COL.valutakurs),
      initialInterest: getNum(NORDNET_COL.initialInterest),
    });
  }
  return out;
}

export function parseNordnetBytes(buf: ArrayBuffer | Uint8Array): {
  rows: NordnetRow[];
  meta: ParseMeta;
  text: string;
} {
  const { text, encoding } = decodeText(buf);
  const table = parseTable(text);
  table.meta.encoding = encoding;
  const rows = rowsToNordnet(table.headers, table.rows, table.meta.positional);
  return { rows, meta: table.meta, text };
}

export function inspectNordnetFormat(buf: Uint8Array): {
  bomUtf16Le: boolean;
  tabDelimited: boolean;
  crlf: boolean;
  columnCount: number;
  valutaColumns: number[];
  headersMatch: boolean;
  headers: string[];
} {
  const bomUtf16Le = buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe;
  const { text } = decodeText(buf);
  const { lines, lineEnding } = splitLines(text.replace(/^\uFEFF/, ""));
  const header = lines[0] ?? "";
  const tabDelimited = header.includes("\t") && !header.includes(",") || (header.split("\t").length === NORDNET_COL_COUNT);
  const headers = header.split("\t");
  const valutaColumns: number[] = [];
  headers.forEach((h, i) => {
    if (h === "Valuta") valutaColumns.push(i);
  });
  const headersMatch =
    headers.length === NORDNET_COL_COUNT &&
    NORDNET_HEADERS_NB.every((h, i) => headers[i] === h);
  return {
    bomUtf16Le,
    tabDelimited: headers.length === NORDNET_COL_COUNT && header.split("\t").length === NORDNET_COL_COUNT,
    crlf: lineEnding === "crlf",
    columnCount: headers.length,
    valutaColumns,
    headersMatch,
    headers,
  };
}

export { numCell, dateCell };
