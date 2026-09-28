/** Page layout: word wrap, tables, headers, footers, colour, pagination, boxes. */

import { PAGE_H, PAGE_W, PdfWriter, pdfDate } from "./writer";
import { fitText, pdfString, wrapText, textWidth, type PdfFont } from "./winansi";

export const MARGIN_X = 54;
export const MARGIN_TOP = 58;
export const MARGIN_BOTTOM = 48;
export const CONTENT_W = PAGE_W - MARGIN_X * 2;
export const HEADER_Y = PAGE_H - 28;
export const FOOTER_Y = 24;

export const C = {
  navy: [0.102, 0.153, 0.267] as RGB,
  navyDeep: [0.063, 0.094, 0.165] as RGB,
  ink: [0.145, 0.165, 0.184] as RGB,
  muted: [0.38, 0.42, 0.45] as RGB,
  rule: [0.78, 0.8, 0.82] as RGB,
  paper: [0.965, 0.957, 0.945] as RGB,
  bronze: [0.545, 0.451, 0.333] as RGB,
  sage: [0.29, 0.42, 0.39] as RGB,
  white: [1, 1, 1] as RGB,
  band: [0.93, 0.91, 0.88] as RGB,
  danger: [0.55, 0.22, 0.22] as RGB,
  ok: [0.22, 0.42, 0.3] as RGB,
};

export type RGB = [number, number, number];

export const CHART_PALETTE: RGB[] = [
  [0.102, 0.153, 0.267],
  [0.545, 0.451, 0.333],
  [0.29, 0.42, 0.39],
  [0.45, 0.5, 0.58],
  [0.55, 0.33, 0.28],
  [0.62, 0.62, 0.58],
];

function rgb(c: RGB, op: "rg" | "RG"): string {
  const a = c[0];
  const b = c[1];
  const d = c[2];
  if (![a, b, d].every((x) => Number.isFinite(x))) throw new Error("non-finite colour");
  return `${a.toFixed(3)} ${b.toFixed(3)} ${d.toFixed(3)} ${op}`;
}

function fontName(f: PdfFont): string {
  return f === "b" ? "/F2" : f === "i" ? "/F3" : "/F1";
}

function n(x: number): string {
  if (!Number.isFinite(x)) throw new Error(`non-finite PDF number ${x}`);
  return x.toFixed(2);
}

export interface TableCol {
  header: string;
  width: number;
  align?: "left" | "right" | "center";
  font?: PdfFont;
}

export type BoxKind = "text" | "chart" | "rule" | "rect";
export type BoxRole = "header" | "footer" | "heading" | "body" | "table" | "cover" | "chart";

export interface LayoutBox {
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: BoxKind;
  role: BoxRole;
  text?: string;
}

export interface LayoutReport {
  pageCount: number;
  boxes: LayoutBox[];
  violations: string[];
  tableHeaderRepeats: number;
  emptyPages: number;
}

type PageKind = "cover" | "body";

interface PageRec {
  kind: PageKind;
  cmds: string[];
}

export class PdfDoc {
  private pages: PageRec[] = [];
  private cmds: string[] = [];
  private y = PAGE_H - MARGIN_TOP;
  private kind: PageKind = "body";
  private headerLeft: string;
  private headerRight: string;
  private footerNote: string;
  private title: string;
  readonly privacy: boolean;
  private boxes: LayoutBox[] = [];
  private pageNo = 0;
  private endedWithHeading = false;
  private tableHeaderRepeats = 0;
  private violations: string[] = [];
  layout: LayoutReport = { pageCount: 0, boxes: [], violations: [], tableHeaderRepeats: 0, emptyPages: 0 };

  constructor(opts: {
    title: string;
    headerLeft?: string;
    headerRight?: string;
    footerNote?: string;
    privacy: boolean;
  }) {
    this.title = opts.title;
    this.headerLeft = opts.headerLeft ?? "NORDLYS";
    this.headerRight = opts.headerRight ?? "";
    this.footerNote = opts.footerNote ?? "Hypothetical illustration - not a guarantee of future results";
    this.privacy = opts.privacy;
  }

  get width(): number {
    return CONTENT_W;
  }

  remaining(): number {
    return this.y - MARGIN_BOTTOM - 8;
  }

  private currentPage(): number {
    return this.pageNo;
  }

  private addBox(b: Omit<LayoutBox, "page">): void {
    this.boxes.push({ ...b, page: this.currentPage() });
  }

  private push(...c: string[]): void {
    for (const s of c) {
      if (/\bNaN\b|\bInfinity\b/.test(s)) throw new Error(`non-finite token in PDF stream: ${s.slice(0, 80)}`);
    }
    this.cmds.push(...c);
  }

  newPage(kind: PageKind = "body"): void {
    if (this.endedWithHeading && this.cmds.length) {
      this.violations.push(`page ${this.pageNo} ends with a heading`);
    }
    if (this.cmds.length) {
      this.pages.push({ kind: this.kind, cmds: this.cmds });
    } else if (this.pages.length) {
      this.violations.push(`empty page before page ${this.pages.length + 1}`);
    }
    this.kind = kind;
    this.cmds = [];
    this.pageNo = this.pages.length + 1;
    this.y = PAGE_H - (kind === "cover" ? 0 : MARGIN_TOP);
    this.endedWithHeading = false;
  }

  ensure(h: number): void {
    if (this.pages.length === 0 && this.cmds.length === 0) this.newPage(this.kind);
    if (this.y - h < MARGIN_BOTTOM + 10) this.newPage("body");
  }

  rect(x: number, y: number, w: number, h: number, fill?: RGB, stroke?: RGB, lw = 0.4, role: BoxRole = "body"): void {
    const c: string[] = [];
    if (fill) c.push(rgb(fill, "rg"));
    if (stroke) c.push(`${lw} w`, rgb(stroke, "RG"));
    c.push(`${n(x)} ${n(y)} ${n(w)} ${n(h)} re`);
    if (fill && stroke) c.push("B");
    else if (fill) c.push("f");
    else c.push("S");
    this.push(c.join(" "));
    this.addBox({ x, y, w, h, kind: "rect", role });
  }

  line(x1: number, y1: number, x2: number, y2: number, color: RGB = C.rule, lw = 0.4, role: BoxRole = "body"): void {
    this.push(`${lw} w ${rgb(color, "RG")} ${n(x1)} ${n(y1)} m ${n(x2)} ${n(y2)} l S`);
    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    this.addBox({ x, y, w: Math.abs(x2 - x1) || lw, h: Math.abs(y2 - y1) || lw, kind: "rule", role });
  }

  raw(ops: string): void {
    if (/\bNaN\b|\bInfinity\b/.test(ops)) throw new Error("chart stream contains NaN/Infinity");
    this.push(ops);
  }

  text(
    str: string,
    x: number,
    y: number,
    opts: { font?: PdfFont; size: number; color?: RGB; tracking?: number; role?: BoxRole },
  ): void {
    const f = opts.font ?? "r";
    const color = opts.color ?? C.ink;
    const Tc = opts.tracking ?? 0;
    const tw = textWidth(str, f, opts.size, Tc);
    this.push(
      `BT ${fontName(f)} ${opts.size} Tf ${Tc} Tc ${rgb(color, "rg")} 1 0 0 1 ${n(x)} ${n(y)} Tm ${pdfString(str)} Tj ET`,
    );
    this.addBox({
      x,
      y: y - opts.size * 0.22,
      w: Math.max(tw, 0.5),
      h: opts.size,
      kind: "text",
      role: opts.role ?? "body",
      text: str,
    });
  }

  textRight(str: string, right: number, y: number, opts: { font?: PdfFont; size: number; color?: RGB; role?: BoxRole }): void {
    const w = textWidth(str, opts.font ?? "r", opts.size);
    this.text(str, right - w, y, opts);
  }

  paragraph(str: string, opts?: { font?: PdfFont; size?: number; leading?: number; color?: RGB; width?: number }): number {
    const font = opts?.font ?? "r";
    const size = opts?.size ?? 9;
    const leading = opts?.leading ?? size + 3;
    const width = opts?.width ?? CONTENT_W;
    const lines = wrapText(str, font, size, width);
    this.ensure(lines.length * leading + 2);
    for (const ln of lines) {
      this.ensure(leading);
      this.text(ln, MARGIN_X, this.y - size, { font, size, color: opts?.color ?? C.ink, role: "body" });
      this.y -= leading;
    }
    this.endedWithHeading = false;
    return lines.length;
  }

  spacer(h = 8): void {
    this.ensure(h);
    this.y -= h;
  }

  kicker(label: string): void {
    this.ensure(16);
    this.text(label.toUpperCase(), MARGIN_X, this.y - 8, {
      font: "b",
      size: 7.5,
      color: C.bronze,
      tracking: 1.1,
      role: "body",
    });
    this.y -= 14;
    this.endedWithHeading = false;
  }

  heading(title: string, keep = 52): void {
    this.ensure(28 + keep);
    this.text(title, MARGIN_X, this.y - 13, { font: "b", size: 13, color: C.navy, role: "heading" });
    this.y -= 18;
    this.line(MARGIN_X, this.y, MARGIN_X + 36, this.y, C.bronze, 1.2, "heading");
    this.y -= 10;
    this.endedWithHeading = true;
  }

  addTable(cols: TableCol[], rows: string[][], opts?: { fontSize?: number }): void {
    const fs = opts?.fontSize ?? 8;
    const headerH = 16;
    const rowH = 14;
    const total = cols.reduce((s, c) => s + c.width, 0);
    const scale = CONTENT_W / total;
    const widths = cols.map((c) => c.width * scale);

    const paintHeader = (repeat: boolean) => {
      this.endedWithHeading = false;
      this.ensure(headerH + rowH);
      let x = MARGIN_X;
      this.rect(MARGIN_X, this.y - headerH, CONTENT_W, headerH, C.navy, undefined, 0.4, "table");
      for (let i = 0; i < cols.length; i++) {
        const col = cols[i]!;
        const w = widths[i]!;
        const label = fitText(col.header, "b", fs, w - 10);
        const pad = 5;
        const tw = textWidth(label, "b", fs);
        let tx = x + pad;
        if (col.align === "right") tx = x + w - pad - tw;
        if (col.align === "center") tx = x + (w - tw) / 2;
        this.text(label, tx, this.y - headerH + 4.5, { font: "b", size: fs, color: C.white, role: "table" });
        x += w;
      }
      this.y -= headerH;
      if (repeat) this.tableHeaderRepeats += 1;
    };

    paintHeader(false);
    for (let r = 0; r < rows.length; r++) {
      if (this.y - rowH < MARGIN_BOTTOM + 12) {
        this.newPage("body");
        paintHeader(true);
      }
      if (r % 2 === 1) this.rect(MARGIN_X, this.y - rowH, CONTENT_W, rowH, C.paper, undefined, 0.4, "table");
      let x = MARGIN_X;
      const row = rows[r]!;
      for (let i = 0; i < cols.length; i++) {
        const col = cols[i]!;
        const w = widths[i]!;
        const font = col.font ?? "r";
        const val = fitText(row[i] ?? "", font, fs, w - 10);
        const pad = 5;
        const tw = textWidth(val, font, fs);
        let tx = x + pad;
        if (col.align === "right") tx = x + w - pad - tw;
        if (col.align === "center") tx = x + (w - tw) / 2;
        this.text(val, tx, this.y - rowH + 4, { font, size: fs, color: C.ink, role: "table" });
        x += w;
      }
      this.line(MARGIN_X, this.y - rowH, PAGE_W - MARGIN_X, this.y - rowH, C.rule, 0.25, "table");
      this.y -= rowH;
    }
    this.y -= 6;
    this.endedWithHeading = false;
  }

  metricRow(items: { label: string; value: string; hint?: string }[]): void {
    const nItems = items.length;
    const gap = 8;
    const w = (CONTENT_W - gap * (nItems - 1)) / nItems;
    const h = 44;
    this.ensure(h + 8);
    for (let i = 0; i < nItems; i++) {
      const x = MARGIN_X + i * (w + gap);
      this.rect(x, this.y - h, w, h, C.paper, C.rule, 0.3, "body");
      const lab = fitText(items[i]!.label.toUpperCase(), "b", 6.5, w - 16);
      const val = fitText(items[i]!.value, "b", 11, w - 16);
      this.text(lab, x + 8, this.y - 14, { font: "b", size: 6.5, color: C.muted, tracking: 0.4, role: "body" });
      this.text(val, x + 8, this.y - 32, { font: "b", size: 11, color: C.navy, role: "body" });
    }
    this.y -= h + 10;
    this.endedWithHeading = false;
  }

  chartBox(h: number): { x: number; y: number; w: number; h: number } {
    this.ensure(h + 4);
    const box = { x: MARGIN_X, y: this.y - h, w: CONTENT_W, h };
    this.addBox({ ...box, kind: "chart", role: "chart" });
    this.y -= h + 6;
    this.endedWithHeading = false;
    return box;
  }

  coverBand(client: string, subtitle: string, dateLabel: string, confidential: string): void {
    this.newPage("cover");
    this.rect(0, PAGE_H - 168, PAGE_W, 168, C.navyDeep, undefined, 0.4, "cover");
    this.rect(0, PAGE_H - 171, PAGE_W, 3, C.bronze, undefined, 0.4, "cover");
    this.text("NORDLYS", MARGIN_X, PAGE_H - 48, { font: "b", size: 11, color: C.bronze, tracking: 2.2, role: "cover" });
    this.text("PRIVATE WEALTH", MARGIN_X, PAGE_H - 62, { font: "r", size: 8, color: C.white, tracking: 1.4, role: "cover" });
    this.text(fitText(subtitle, "r", 11, CONTENT_W), MARGIN_X, PAGE_H - 108, { font: "r", size: 11, color: C.white, role: "cover" });
    this.text(fitText(client, "b", 22, CONTENT_W), MARGIN_X, PAGE_H - 138, { font: "b", size: 22, color: C.white, role: "cover" });
    this.y = PAGE_H - 196;
    this.text(dateLabel, MARGIN_X, this.y, { font: "r", size: 9, color: C.muted, role: "cover" });
    this.textRight(confidential, PAGE_W - MARGIN_X, this.y, { font: "b", size: 8, color: C.bronze, role: "cover" });
    this.y -= 22;
    this.endedWithHeading = false;
  }

  finish(): Uint8Array {
    if (this.endedWithHeading) this.violations.push(`page ${this.pageNo} ends with a heading`);
    if (this.cmds.length) this.pages.push({ kind: this.kind, cmds: this.cmds });
    const w = new PdfWriter();
    const fontR = w.add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
    const fontB = w.add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
    const fontI = w.add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>");
    const nPages = this.pages.length;
    const pageIds: number[] = [];
    const contentIds: number[] = [];
    let emptyPages = 0;

    for (let i = 0; i < nPages; i++) {
      const rec = this.pages[i]!;
      if (rec.cmds.length === 0) emptyPages += 1;
      const header: string[] = [];
      const pageIndex = i + 1;
      if (rec.kind !== "cover") {
        header.push(`${0.35} w ${rgb(C.rule, "RG")} ${n(MARGIN_X)} ${n(PAGE_H - 32)} m ${n(PAGE_W - MARGIN_X)} ${n(PAGE_H - 32)} l S`);
        header.push(
          `BT /F2 8 Tf 0.8 Tc ${rgb(C.navy, "rg")} 1 0 0 1 ${n(MARGIN_X)} ${n(HEADER_Y)} Tm ${pdfString(this.headerLeft)} Tj ET`,
        );
        const right = this.headerRight;
        const rw = textWidth(right, "r", 8);
        header.push(
          `BT /F1 8 Tf 0 Tc ${rgb(C.muted, "rg")} 1 0 0 1 ${n(PAGE_W - MARGIN_X - rw)} ${n(HEADER_Y)} Tm ${pdfString(right)} Tj ET`,
        );
        this.boxes.push({
          page: pageIndex,
          x: MARGIN_X,
          y: HEADER_Y - 2,
          w: textWidth(this.headerLeft, "b", 8, 0.8),
          h: 8,
          kind: "text",
          role: "header",
          text: this.headerLeft,
        });
        this.boxes.push({
          page: pageIndex,
          x: PAGE_W - MARGIN_X - rw,
          y: HEADER_Y - 2,
          w: rw,
          h: 8,
          kind: "text",
          role: "header",
          text: right,
        });
      }
      const pageLabel = `${i + 1}  /  ${nPages}`;
      const lw = textWidth(pageLabel, "r", 8);
      const footer: string[] = [
        `${0.35} w ${rgb(C.rule, "RG")} ${n(MARGIN_X)} 36 m ${n(PAGE_W - MARGIN_X)} 36 l S`,
        `BT /F1 7.5 Tf ${rgb(C.muted, "rg")} 1 0 0 1 ${n(MARGIN_X)} ${n(FOOTER_Y)} Tm ${pdfString(this.footerNote)} Tj ET`,
        `BT /F1 8 Tf ${rgb(C.navy, "rg")} 1 0 0 1 ${n(PAGE_W - MARGIN_X - lw)} ${n(FOOTER_Y)} Tm ${pdfString(pageLabel)} Tj ET`,
      ];
      this.boxes.push({
        page: pageIndex,
        x: MARGIN_X,
        y: FOOTER_Y - 2,
        w: textWidth(this.footerNote, "r", 7.5),
        h: 8,
        kind: "text",
        role: "footer",
        text: this.footerNote,
      });
      this.boxes.push({
        page: pageIndex,
        x: PAGE_W - MARGIN_X - lw,
        y: FOOTER_Y - 2,
        w: lw,
        h: 8,
        kind: "text",
        role: "footer",
        text: pageLabel,
      });
      const stream = [...header, ...rec.cmds, ...footer].join("\n");
      contentIds.push(w.addStream("", stream));
    }

    const pagesId = 3 + nPages + nPages + 1;
    for (let i = 0; i < nPages; i++) {
      pageIds.push(
        w.add(
          `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
            `/Resources << /Font << /F1 ${fontR} 0 R /F2 ${fontB} 0 R /F3 ${fontI} 0 R >> >> ` +
            `/Contents ${contentIds[i]!} 0 R >>`,
        ),
      );
    }
    const kids = pageIds.map((id) => `${id} 0 R`).join(" ");
    const actualPagesId = w.add(`<< /Type /Pages /Kids [ ${kids} ] /Count ${nPages} >>`);
    if (actualPagesId !== pagesId) throw new Error(`Pages object id mismatch: expected ${pagesId}, got ${actualPagesId}`);
    const catalogId = w.add(`<< /Type /Catalog /Pages ${actualPagesId} 0 R >>`);
    const infoId = w.add(
      `<< /Title ${pdfString(this.title)} /Author ${pdfString("NORDLYS")} /Creator ${pdfString("NORDLYS")} ` +
        `/Producer ${pdfString("NORDLYS PDF 1.4")} /CreationDate (${pdfDate()}) >>`,
    );
    this.layout = {
      pageCount: nPages,
      boxes: this.boxes,
      violations: [...this.violations, ...layoutViolations(this.boxes, nPages, emptyPages)],
      tableHeaderRepeats: this.tableHeaderRepeats,
      emptyPages,
    };
    return w.assemble(catalogId, infoId);
  }
}

function boxesOverlap(a: LayoutBox, b: LayoutBox, pad = 0.55): boolean {
  const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return ix > pad && iy > pad;
}

export function layoutViolations(boxes: LayoutBox[], pageCount: number, emptyPages: number): string[] {
  const out: string[] = [];
  if (emptyPages) out.push(`${emptyPages} empty page(s)`);
  for (const b of boxes) {
    if (b.x < -0.2 || b.y < -0.2 || b.x + b.w > PAGE_W + 0.2 || b.y + b.h > PAGE_H + 0.2) {
      out.push(`box off page p${b.page} ${b.kind} ${b.text ?? ""}`);
    }
    const inHeaderZone = b.role === "header" || b.role === "footer" || b.role === "cover";
    if (!inHeaderZone) {
      if (b.x < MARGIN_X - 1 || b.x + b.w > PAGE_W - MARGIN_X + 1) {
        out.push(`box outside side margins p${b.page} ${b.kind} ${b.text ?? ""}`);
      }
      if (b.y < MARGIN_BOTTOM - 2) out.push(`box below content margin p${b.page} ${b.kind}`);
      if (b.y + b.h > PAGE_H - MARGIN_TOP + 14 && b.role !== "heading") {
        /* body may sit just under the header rule */
      }
    }
  }
  const texts = boxes.filter((b) => b.kind === "text");
  const charts = boxes.filter((b) => b.kind === "chart");
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i]!;
      const b = texts[j]!;
      if (a.page !== b.page) continue;
      if (boxesOverlap(a, b)) out.push(`text overlap p${a.page}: "${(a.text ?? "").slice(0, 24)}" / "${(b.text ?? "").slice(0, 24)}"`);
    }
    for (const c of charts) {
      if (c.page !== texts[i]!.page) continue;
      if (texts[i]!.role === "header" || texts[i]!.role === "footer") continue;
      if (boxesOverlap(texts[i]!, c, 1.2)) out.push(`text overlaps chart p${c.page}: "${(texts[i]!.text ?? "").slice(0, 24)}"`);
    }
  }
  void pageCount;
  return out;
}
