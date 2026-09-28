/** Acrobat-strict structural validator for NORDLYS PDFs. */

import { textWidth, winAnsiToUnicode, type PdfFont } from "./winansi";
import { PAGE_H, PAGE_W } from "./writer";
import { MARGIN_BOTTOM, MARGIN_X } from "./layout";
import type { LayoutReport } from "./layout";

export interface PdfValidation {
  ok: boolean;
  errors: string[];
  objectCount: number;
  xrefCount: number;
  size: number;
  startxref: number;
  strings: string[];
  info: { title: string; producer: string; creationDate: string };
  pageStreams: string[];
}

export interface PlacedText {
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
}

function latin1Decode(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return s;
}

function parseXrefEntries(raw: string, start: number, count: number): { offset: number; gen: number; used: boolean; raw: string }[] {
  const out: { offset: number; gen: number; used: boolean; raw: string }[] = [];
  let p = 0;
  for (let i = 0; i < count; i++) {
    const line = raw.slice(p, p + 20);
    p += 20;
    if (line.length !== 20) throw new Error(`xref entry ${start + i} is ${line.length} bytes, need 20`);
    if (line[19] !== "\n") throw new Error(`xref entry ${start + i} does not end with LF`);
    const offset = Number(line.slice(0, 10));
    const gen = Number(line.slice(11, 16));
    const flag = line[17];
    if (line[10] !== " " || line[16] !== " " || line[18] !== " ") {
      throw new Error(`xref entry ${start + i} spacing is not the 20-byte Acrobat form`);
    }
    if (!Number.isFinite(offset) || !Number.isFinite(gen) || (flag !== "n" && flag !== "f")) {
      throw new Error(`xref entry ${start + i} malformed: ${JSON.stringify(line)}`);
    }
    out.push({ offset, gen, used: flag === "n", raw: line });
  }
  return out;
}

function extractPdfString(src: string, from: number): { text: string; end: number } {
  let i = from + 1;
  const bytes: number[] = [];
  while (i < src.length) {
    const ch = src.charCodeAt(i);
    if (ch === 0x29) return { text: winAnsiToUnicode(bytes), end: i + 1 };
    if (ch === 0x5c) {
      const n = src[i + 1];
      if (n === "(" || n === ")" || n === "\\") {
        bytes.push(n.charCodeAt(0));
        i += 2;
        continue;
      }
      if (n === "n") {
        bytes.push(10);
        i += 2;
        continue;
      }
      if (n === "r") {
        bytes.push(13);
        i += 2;
        continue;
      }
      if (n === "t") {
        bytes.push(9);
        i += 2;
        continue;
      }
      const oct = /^[0-7]{1,3}/.exec(src.slice(i + 1));
      if (oct) {
        bytes.push(parseInt(oct[0]!, 8));
        i += 1 + oct[0]!.length;
        continue;
      }
      i += 2;
      continue;
    }
    bytes.push(ch);
    i += 1;
  }
  return { text: winAnsiToUnicode(bytes), end: src.length };
}

export function extractPdfStrings(bytes: Uint8Array): string[] {
  const src = latin1Decode(bytes);
  const out: string[] = [];
  for (let i = 0; i < src.length; i++) {
    if (src[i] === "(") {
      const { text, end } = extractPdfString(src, i);
      if (text.length) out.push(text);
      i = end - 1;
    }
  }
  return out;
}

export function extractedText(bytes: Uint8Array): string {
  return extractPdfStrings(bytes).join("\n");
}

export function joinedPdfText(bytes: Uint8Array): string {
  return extractPdfStrings(bytes).join(" ");
}

/** Tokenize a content stream, ignoring string and hex literals, for operator balance. */
export function streamOperators(stream: string): string[] {
  const ops: string[] = [];
  let i = 0;
  while (i < stream.length) {
    const ch = stream[i]!;
    if (ch === "(") {
      let depth = 1;
      i += 1;
      while (i < stream.length && depth) {
        if (stream[i] === "\\") {
          i += 2;
          continue;
        }
        if (stream[i] === "(") depth += 1;
        else if (stream[i] === ")") depth -= 1;
        i += 1;
      }
      continue;
    }
    if (ch === "<") {
      i += 1;
      while (i < stream.length && stream[i] !== ">") i += 1;
      i += 1;
      continue;
    }
    if (ch === "%") {
      while (i < stream.length && stream[i] !== "\n") i += 1;
      continue;
    }
    const m = /^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(stream.slice(i));
    if (m) {
      ops.push(m[0]!);
      i += m[0]!.length;
      continue;
    }
    const id = /^[A-Za-z*'"]+/.exec(stream.slice(i));
    if (id) {
      ops.push(id[0]!);
      i += id[0]!.length;
      continue;
    }
    i += 1;
  }
  return ops;
}

function balance(ops: string[], open: string, close: string): string | null {
  let d = 0;
  for (const o of ops) {
    if (o === open) d += 1;
    if (o === close) d -= 1;
    if (d < 0) return `${close} before ${open}`;
  }
  if (d !== 0) return `${open}/${close} imbalance ${d}`;
  return null;
}

function failResult(errors: string[], extra: Partial<PdfValidation> = {}): PdfValidation {
  return {
    objectCount: 0,
    xrefCount: 0,
    size: 0,
    startxref: -1,
    strings: [],
    info: { title: "", producer: "", creationDate: "" },
    pageStreams: [],
    ...extra,
    ok: false,
    errors,
  };
}

export function validatePdf(bytes: Uint8Array): PdfValidation {
  const errors: string[] = [];
  const src = latin1Decode(bytes);
  const emptyInfo = { title: "", producer: "", creationDate: "" };
  if (!src.startsWith("%PDF-1.")) errors.push("missing %PDF-1. header");
  const headerEnd = src.indexOf("\n");
  const binLine = src.slice(headerEnd + 1, src.indexOf("\n", headerEnd + 1) + 1);
  if (!binLine.startsWith("%") || ![...binLine].some((c) => c.charCodeAt(0) >= 128)) {
    errors.push("missing binary comment line after header");
  }

  const trimmedEnd = src.replace(/\s+$/, "");
  if (!trimmedEnd.endsWith("%%EOF")) errors.push("file does not end with %%EOF");

  const eof = src.lastIndexOf("%%EOF");
  const sxKey = src.lastIndexOf("startxref", eof >= 0 ? eof : src.length);
  if (sxKey < 0) {
    return failResult([...errors, "missing startxref"], { strings: extractPdfStrings(bytes) });
  }
  const after = src.slice(sxKey + "startxref".length);
  const sm = /^\s*(\d+)/.exec(after);
  const startxref = sm ? Number(sm[1]) : -1;
  if (!(startxref >= 0)) errors.push("startxref is not a number");
  if (src.slice(startxref, startxref + 4) !== "xref") {
    errors.push(`startxref ${startxref} does not point at 'xref' (got ${JSON.stringify(src.slice(startxref, startxref + 8))})`);
  }

  const xrefBody = src.slice(startxref);
  const head = /^xref\s+(\d+)\s+(\d+)\s*\n/.exec(xrefBody);
  if (!head) {
    errors.push("cannot parse xref subsection header");
    return failResult(errors, { startxref, strings: extractPdfStrings(bytes) });
  }
  const xrStart = Number(head[1]);
  const xrCount = Number(head[2]);
  const entriesRaw = xrefBody.slice(head[0].length);
  let entries: { offset: number; gen: number; used: boolean; raw: string }[] = [];
  try {
    entries = parseXrefEntries(entriesRaw, xrStart, xrCount);
  } catch (e) {
    errors.push(String(e));
  }
  if (entries[0] && entries[0].raw !== "0000000000 65535 f \n") {
    errors.push(`first xref entry must be "0000000000 65535 f\\n", got ${JSON.stringify(entries[0].raw)}`);
  }

  const trailerM = /trailer\s*<<([^>]*)>>/.exec(xrefBody);
  let size = xrCount;
  let root = "";
  let infoRef = "";
  if (trailerM) {
    const t = trailerM[1]!;
    const sz = /\/Size\s+(\d+)/.exec(t);
    if (sz) size = Number(sz[1]);
    const rt = /\/Root\s+(\d+)\s+0\s+R/.exec(t);
    if (rt) root = rt[1]!;
    else errors.push("trailer missing /Root");
    const inf = /\/Info\s+(\d+)\s+0\s+R/.exec(t);
    if (inf) infoRef = inf[1]!;
    else errors.push("trailer missing /Info");
  } else errors.push("missing trailer dictionary");

  const maxObj = xrStart + xrCount - 1;
  if (size !== maxObj + 1) errors.push(`trailer /Size ${size} != highest object ${maxObj} + 1`);
  if (size !== xrCount && xrStart === 0) errors.push(`trailer /Size ${size} != xref count ${xrCount}`);

  const seenIds = new Set<number>();
  const usedOffsets = new Map<number, number>();
  let used = 0;
  const bodies = new Map<number, string>();
  const streamById = new Map<number, string>();
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;
    const id = xrStart + i;
    if (!e.used) continue;
    if (seenIds.has(id)) errors.push(`duplicate object number ${id}`);
    seenIds.add(id);
    used += 1;
    if (usedOffsets.has(e.offset)) errors.push(`duplicate xref offset ${e.offset}`);
    usedOffsets.set(e.offset, id);
    const at = src.slice(e.offset, e.offset + 40);
    const om = /^(\d+)\s+(\d+)\s+obj/.exec(at);
    if (!om) {
      errors.push(`object ${id} xref offset ${e.offset} does not point at 'obj' (got ${JSON.stringify(at.slice(0, 24))})`);
      continue;
    }
    if (Number(om[1]) !== id) errors.push(`object at offset ${e.offset} is id ${om[1]}, xref says ${id}`);
    const objEnd = src.indexOf("endobj", e.offset);
    if (objEnd < 0) {
      errors.push(`object ${id} missing endobj`);
      continue;
    }
    const body = src.slice(e.offset, objEnd);
    bodies.set(id, body);
    if (/\bNaN\b|\bInfinity\b/.test(body)) errors.push(`object ${id} contains NaN or Infinity`);
    const lenM = /\/Length\s+(\d+)/.exec(body);
    const streamAt = body.search(/stream\r?\n/);
    if (lenM && streamAt >= 0) {
      const declared = Number(lenM[1]);
      const sm2 = /stream\r?\n/.exec(body);
      const dataStart = e.offset + streamAt + sm2![0]!.length;
      const dataEnd = dataStart + declared;
      if (dataEnd > bytes.length) {
        errors.push(`object ${id} stream length ${declared} overruns file`);
        continue;
      }
      const afterData = src.slice(dataEnd, dataEnd + 12);
      if (!/^\r?\n?endstream/.test(afterData)) {
        errors.push(`object ${id} stream length ${declared} does not land on endstream (got ${JSON.stringify(afterData)})`);
      }
      const stream = src.slice(dataStart, dataEnd);
      streamById.set(id, stream);
      const ops = streamOperators(stream);
      const bt = balance(ops, "BT", "ET");
      if (bt) errors.push(`object ${id} ${bt}`);
      const qq = balance(ops, "q", "Q");
      if (qq) errors.push(`object ${id} ${qq}`);
      for (const tok of ops) {
        if (tok === "NaN" || tok === "Infinity" || tok === "-Infinity") errors.push(`object ${id} stream token ${tok}`);
        if (/^-?\.?$/.test(tok)) errors.push(`object ${id} empty number '${tok}'`);
      }
    }
  }

  for (const body of bodies.values()) {
    const re = /(\d+)\s+0\s+R/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(body))) {
      const id = Number(m[1]);
      if (!seenIds.has(id) && id !== 0) errors.push(`dangling reference ${id} 0 R`);
    }
  }

  const info: PdfValidation["info"] = { ...emptyInfo };
  if (infoRef) {
    const id = Number(infoRef);
    const body = bodies.get(id) ?? "";
    const titleOpen = /\/Title\s*\(/.exec(body);
    if (titleOpen) {
      const p = body.indexOf("(", titleOpen.index);
      info.title = extractPdfString(body, p).text.trim();
    } else errors.push("Info missing /Title");
    const prodOpen = /\/Producer\s*\(/.exec(body);
    if (!prodOpen) errors.push("Info missing /Producer");
    else {
      const p = body.indexOf("(", prodOpen.index);
      info.producer = extractPdfString(body, p).text;
    }
    const cd = /\/CreationDate\s*\(([^)]*)\)/.exec(body);
    if (!cd) errors.push("Info missing /CreationDate");
    else info.creationDate = cd[1]!;
  }
  if (root) {
    const rootId = Number(root);
    if (!seenIds.has(rootId)) errors.push(`/Root ${rootId} is not an in-use object`);
  }

  const pagesBody = [...bodies.values()].find((b) => /\/Type\s*\/Pages\b/.test(b)) ?? "";
  const kidsM = /\/Kids\s*\[([^\]]*)\]/.exec(pagesBody);
  const pageStreams: string[] = [];
  if (kidsM) {
    for (const km of kidsM[1]!.matchAll(/(\d+)\s+0\s+R/g)) {
      const pageBody = bodies.get(Number(km[1])) ?? "";
      const c = /\/Contents\s+(\d+)\s+0\s+R/.exec(pageBody);
      pageStreams.push(c ? (streamById.get(Number(c[1])) ?? "") : "");
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    objectCount: used,
    xrefCount: xrCount,
    size,
    startxref,
    strings: extractPdfStrings(bytes),
    info,
    pageStreams,
  };
}

function parsePlacedFromStream(stream: string, page: number): PlacedText[] {
  const out: PlacedText[] = [];
  let x = 0;
  let y = 0;
  let size = 8;
  let font: PdfFont = "r";
  let tc = 0;
  let i = 0;
  while (i < stream.length) {
    const rest = stream.slice(i);
    const tf = /^\/F([123])\s+([\d.]+)\s+Tf/.exec(rest);
    if (tf) {
      font = tf[1] === "2" ? "b" : tf[1] === "3" ? "i" : "r";
      size = Number(tf[2]);
      i += tf[0].length;
      continue;
    }
    const tcM = /^(-?[\d.]+)\s+Tc/.exec(rest);
    if (tcM) {
      tc = Number(tcM[1]);
      i += tcM[0].length;
      continue;
    }
    const tm = /^1\s+0\s+0\s+1\s+(-?[\d.]+)\s+(-?[\d.]+)\s+Tm/.exec(rest);
    if (tm) {
      x = Number(tm[1]);
      y = Number(tm[2]);
      i += tm[0].length;
      continue;
    }
    if (stream[i] === "(") {
      const { text, end } = extractPdfString(stream, i);
      const after = /^\s*Tj/.exec(stream.slice(end));
      if (after) {
        const w = textWidth(text, font, size, tc);
        out.push({
          page,
          x,
          y: y - size * 0.22,
          w: Math.max(w, 0.5),
          h: size,
          text,
        });
        i = end + after[0].length;
        continue;
      }
      i = end;
      continue;
    }
    i += 1;
  }
  return out;
}

export function extractPlacedText(bytes: Uint8Array, pageStreams?: string[]): PlacedText[] {
  const streams = pageStreams ?? validatePdf(bytes).pageStreams;
  const out: PlacedText[] = [];
  streams.forEach((stream, i) => out.push(...parsePlacedFromStream(stream, i + 1)));
  return out;
}

export function placedLayoutErrors(items: PlacedText[]): string[] {
  const out: string[] = [];
  for (const t of items) {
    if (t.x < -0.2 || t.y < -0.2 || t.x + t.w > PAGE_W + 0.2 || t.y + t.h > PAGE_H + 0.2) {
      out.push(`off page p${t.page}: "${(t.text ?? "").slice(0, 32)}"`);
    }
    const headerOrFooter = t.y + t.h > PAGE_H - 40 || t.y < 40;
    const coverBand = t.y + t.h > PAGE_H - 180;
    if (!headerOrFooter && !coverBand) {
      if (t.x < MARGIN_X - 1.5) out.push(`left margin p${t.page}: "${t.text.slice(0, 32)}"`);
      if (t.x + t.w > PAGE_W - MARGIN_X + 1.5) out.push(`right margin p${t.page}: "${t.text.slice(0, 32)}"`);
      if (t.y < MARGIN_BOTTOM - 2) out.push(`below content margin p${t.page}: "${t.text.slice(0, 32)}"`);
    }
  }
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]!;
      const b = items[j]!;
      if (a.page !== b.page) continue;
      const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ix > 0.55 && iy > 0.55) {
        out.push(`text overlap p${a.page}: "${a.text.slice(0, 24)}" / "${b.text.slice(0, 24)}"`);
      }
    }
  }
  return out;
}

export function pdfContainsPhrase(bytes: Uint8Array, phrase: string): boolean {
  const strings = extractPdfStrings(bytes);
  const joined = strings.join(" ");
  return joined.includes(phrase) || strings.some((s) => s.includes(phrase));
}

export function privacyLeaks(text: string): string[] {
  const leaks: string[] = [];
  if (/\bNOK\b/.test(text)) leaks.push("NOK");
  if (/\bUSD\b/.test(text)) leaks.push("USD");
  if (/\bEUR\b/.test(text)) leaks.push("EUR");
  if (/\bGBP\b/.test(text)) leaks.push("GBP");
  if (/[€$]/.test(text)) leaks.push("currency symbol");
  if (/\bkr\b/i.test(text)) leaks.push("kr");
  if (/\d[\d.\s\u00a0\u202f]*\s*kr\b/i.test(text) || /\bkr\s*\d/i.test(text)) {
    if (!leaks.includes("kr")) leaks.push("kr amount");
  }
  if (/\d{1,3}(?:[ \u00a0\u202f,]\d{3}){2,}(?:[.,]\d+)?/.test(text)) leaks.push("grouped thousands");
  return leaks;
}

/**
 * Scan Info, every PDF string, and every horizontal text line.
 * Vertically stacked index ticks are not a money amount; a single formatMoney
 * string or two fragments on the same baseline still fail.
 */
export function privacyScan(bytes: Uint8Array, v?: PdfValidation): string[] {
  const val = v ?? validatePdf(bytes);
  const found: string[] = [];
  const seen = new Set<string>();
  const add = (hits: string[], where: string) => {
    for (const h of hits) {
      const key = `${h}|${where}`;
      if (seen.has(key)) continue;
      seen.add(key);
      found.push(`${h} (${where})`);
    }
  };
  add(privacyLeaks(val.info.title), "Title");
  add(privacyLeaks(val.info.producer), "Producer");
  add(privacyLeaks(val.info.creationDate), "CreationDate");
  for (let i = 0; i < val.strings.length; i++) {
    add(privacyLeaks(val.strings[i]!), `string "${val.strings[i]!.slice(0, 40)}"`);
  }
  const placed = extractPlacedText(bytes, val.pageStreams);
  const lines = new Map<string, PlacedText[]>();
  for (const p of placed) {
    const key = `${p.page}:${Math.round(p.y)}`;
    const list = lines.get(key) ?? [];
    list.push(p);
    lines.set(key, list);
  }
  for (const [key, items] of lines) {
    items.sort((a, b) => a.x - b.x);
    const line = items.map((it) => it.text).join(" ");
    add(privacyLeaks(line), `line ${key} "${line.slice(0, 48)}"`);
  }
  return found;
}

export function forbiddenCertainty(text: string): string[] {
  const hits: string[] = [];
  for (const p of [/\bwill reach\b/i, /\bguaranteed\b/i, /\bcertain to\b/i]) {
    const m = p.exec(text);
    if (m) hits.push(m[0]!);
  }
  return hits;
}

export function layoutErrors(layout: LayoutReport): string[] {
  return [...layout.violations];
}
