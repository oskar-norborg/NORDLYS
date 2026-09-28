/** Unicode → WinAnsi (PDF Helvetica) and AFM glyph widths. */

const TO_WIN: Record<number, number> = {
  0x20ac: 0x80, // €
  0x201a: 0x82,
  0x0192: 0x83,
  0x201e: 0x84,
  0x2026: 0x85,
  0x2020: 0x86,
  0x2021: 0x87,
  0x02c6: 0x88,
  0x2030: 0x89,
  0x0160: 0x8a,
  0x2039: 0x8b,
  0x0152: 0x8c,
  0x017d: 0x8e,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93,
  0x201d: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
  0x02dc: 0x98,
  0x2122: 0x99,
  0x0161: 0x9a,
  0x203a: 0x9b,
  0x0153: 0x9c,
  0x017e: 0x9e,
  0x0178: 0x9f,
};

/** Replace glyphs that Helvetica/WinAnsi cannot print with ASCII words or signs. */
const REPLACEMENTS: [RegExp, string][] = [
  [/\u2265/g, "at least"],
  [/\u2264/g, "at most"],
  [/\u2260/g, "!="],
  [/\u00b1/g, "+/-"],
  [/\u2212/g, "-"],
  [/\u2010/g, "-"],
  [/\u2011/g, "-"],
  [/\u221a/g, "sqrt"],
  [/\u03c3/g, "volatility"],
  [/\u03a3/g, "volatility"],
  [/\u03bc/g, "mu"],
  [/\u039c/g, "mu"],
  [/\u0394/g, "delta"],
  [/\u03b4/g, "delta"],
  [/\u03bb/g, "lambda"],
  [/\u039b/g, "lambda"],
  [/\u2713/g, "ok"],
  [/\u2714/g, "ok"],
  [/\u2074/g, "4"],
  [/\u2075/g, "5"],
  [/\u2076/g, "6"],
  [/\u2077/g, "7"],
  [/\u2078/g, "8"],
  [/\u2079/g, "9"],
  [/\u2070/g, "0"],
  [/\u00b9/g, "1"],
  [/\u2192/g, "->"],
  [/\u2190/g, "<-"],
  [/\u00d7/g, "x"],
  [/\u2026/g, "..."],
];

export function sanitizePdfText(text: string): string {
  let s = text;
  for (const [re, rep] of REPLACEMENTS) s = s.replace(re, rep);
  return s;
}

export function isWinAnsiMapped(cp: number): boolean {
  if (cp === 9 || cp === 10 || cp === 13) return true;
  if (cp < 128) return true;
  if (TO_WIN[cp] != null) return true;
  if (cp >= 0xa0 && cp <= 0xff) return true;
  return false;
}

/** Code points in `text` that are outside WinAnsi (does not apply replacements). */
export function unmappedWinAnsiChars(text: string): string[] {
  const out: string[] = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (!isWinAnsiMapped(cp)) out.push(`U+${cp.toString(16).toUpperCase().padStart(4, "0")}`);
  }
  return out;
}

export function unicodeToWinAnsiByte(cp: number): number {
  if (cp < 128) return cp;
  if (TO_WIN[cp] != null) return TO_WIN[cp]!;
  if (cp >= 0xa0 && cp <= 0xff) return cp;
  throw new Error(
    `Unmapped character U+${cp.toString(16).toUpperCase().padStart(4, "0")} is outside WinAnsi; replace it with a Latin equivalent before drawing.`,
  );
}

export function toWinAnsiBytes(text: string): Uint8Array {
  const s = sanitizePdfText(text);
  const out: number[] = [];
  for (const ch of s) {
    const cp = ch.codePointAt(0)!;
    if (cp === 10 || cp === 13 || cp === 9) {
      out.push(cp);
      continue;
    }
    out.push(unicodeToWinAnsiByte(cp));
  }
  return Uint8Array.from(out);
}

export function winAnsiToUnicode(bytes: ArrayLike<number>): string {
  const FROM: Record<number, string> = {
    0x80: "€",
    0x82: "‚",
    0x83: "ƒ",
    0x84: "„",
    0x85: "…",
    0x86: "†",
    0x87: "‡",
    0x88: "ˆ",
    0x89: "‰",
    0x8a: "Š",
    0x8b: "‹",
    0x8c: "Œ",
    0x8e: "Ž",
    0x91: "‘",
    0x92: "’",
    0x93: "“",
    0x94: "”",
    0x95: "•",
    0x96: "–",
    0x97: "—",
    0x98: "˜",
    0x99: "™",
    0x9a: "š",
    0x9b: "›",
    0x9c: "œ",
    0x9e: "ž",
    0x9f: "Ÿ",
  };
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i]! & 0xff;
    if (FROM[b]) s += FROM[b];
    else s += String.fromCharCode(b);
  }
  return s;
}

/** Escape a Unicode string as a PDF literal `(...)` in WinAnsi. Throws on unmapped glyphs. */
export function pdfString(text: string): string {
  const bytes = toWinAnsiBytes(text);
  let out = "(";
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i]!;
    if (b === 0x28 || b === 0x29 || b === 0x5c) {
      out += `\\${String.fromCharCode(b)}`;
    } else if (b < 32 || b > 126) {
      out += `\\${b.toString(8).padStart(3, "0")}`;
    } else {
      out += String.fromCharCode(b);
    }
  }
  return out + ")";
}

const HELV = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556,
  556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667,
  556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556,
  556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722,
  500, 500, 500, 334, 260, 334, 584,
];
const HELV_B = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556,
  556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722,
  611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556,
  611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778,
  556, 556, 500, 389, 280, 389, 584,
];

const EXTRA: Record<number, [number, number]> = {
  0x80: [556, 556],
  0xc5: [667, 722],
  0xc6: [889, 1000],
  0xd8: [778, 778],
  0xe5: [556, 611],
  0xe6: [667, 722],
  0xf8: [611, 611],
  0xc4: [667, 722],
  0xd6: [778, 778],
  0xe4: [556, 611],
  0xf6: [556, 611],
  0xdc: [722, 722],
  0xfc: [556, 611],
  0xdf: [611, 611],
};

export type PdfFont = "r" | "b" | "i";

function glyphWidth(code: number, bold: boolean): number {
  if (code >= 32 && code <= 126) {
    const i = code - 32;
    return (bold ? HELV_B[i] : HELV[i]) ?? 500;
  }
  const extra = EXTRA[code];
  if (extra) return bold ? extra[1]! : extra[0]!;
  return 600;
}

export function textWidth(text: string, font: PdfFont, size: number, tracking = 0): number {
  const bold = font === "b";
  const s = sanitizePdfText(text);
  const bytes = toWinAnsiBytes(s);
  let w = 0;
  for (let i = 0; i < bytes.length; i++) w += glyphWidth(bytes[i]!, bold);
  const extra = tracking * Math.max(0, [...s].length - 1);
  return (w * size) / 1000 + extra;
}

export function fitText(text: string, font: PdfFont, size: number, maxWidth: number): string {
  const s = sanitizePdfText(text);
  if (textWidth(s, font, size) <= maxWidth) return s;
  if (maxWidth < 8) return "";
  let lo = 0;
  let hi = s.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const t = `${s.slice(0, mid)}...`;
    if (textWidth(t, font, size) <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return lo <= 0 ? "..." : `${s.slice(0, lo)}...`;
}

export function wrapText(text: string, font: PdfFont, size: number, maxWidth: number): string[] {
  const raw = sanitizePdfText(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const lines: string[] = [];
  for (const para of raw) {
    if (para === "") {
      lines.push("");
      continue;
    }
    const words = para.split(/\s+/);
    let line = "";
    for (const word of words) {
      const trial = line ? `${line} ${word}` : word;
      if (textWidth(trial, font, size) <= maxWidth) {
        line = trial;
        continue;
      }
      if (line) lines.push(line);
      if (textWidth(word, font, size) <= maxWidth) {
        line = word;
      } else {
        let chunk = "";
        for (const ch of word) {
          const t = chunk + ch;
          if (textWidth(t, font, size) <= maxWidth) chunk = t;
          else {
            if (chunk) lines.push(chunk);
            chunk = ch;
          }
        }
        line = chunk;
      }
    }
    if (line) lines.push(line);
  }
  return lines.length ? lines : [""];
}
