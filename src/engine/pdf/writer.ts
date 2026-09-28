/** Hand-rolled PDF 1.4 writer: objects, streams, xref, trailer. */

export const PAGE_W = 595.28;
export const PAGE_H = 841.89;

function latin1(s: string): Uint8Array {
  const u = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c > 255) throw new Error(`PDF buffer requires Latin-1, got U+${c.toString(16)}`);
    u[i] = c;
  }
  return u;
}

class ByteBuf {
  private parts: Uint8Array[] = [];
  len = 0;

  push(s: string): void {
    const u = latin1(s);
    this.parts.push(u);
    this.len += u.length;
  }

  concat(): Uint8Array {
    const out = new Uint8Array(this.len);
    let o = 0;
    for (const p of this.parts) {
      out.set(p, o);
      o += p.length;
    }
    return out;
  }
}

export class PdfWriter {
  private objects: string[] = [];

  add(body: string): number {
    this.objects.push(body.trim() + "\n");
    return this.objects.length;
  }

  /** `dict` is the inner dictionary without the closing `>>`. `/Length` is appended. */
  addStream(dictInner: string, data: string): number {
    const body = `<< ${dictInner.trim()} /Length ${data.length} >>\nstream\n${data}\nendstream\n`;
    this.objects.push(body);
    return this.objects.length;
  }

  assemble(catalogId: number, infoId: number): Uint8Array {
    const buf = new ByteBuf();
    buf.push("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n");
    const offsets = [0];
    for (let i = 0; i < this.objects.length; i++) {
      offsets.push(buf.len);
      buf.push(`${i + 1} 0 obj\n`);
      buf.push(this.objects[i]!);
      buf.push("endobj\n");
    }
    const xrefAt = buf.len;
    const n = this.objects.length + 1;
    buf.push(`xref\n0 ${n}\n`);
    buf.push("0000000000 65535 f \n");
    for (let i = 1; i < n; i++) {
      buf.push(`${String(offsets[i]!).padStart(10, "0")} 00000 n \n`);
    }
    buf.push(
      `trailer\n<< /Size ${n} /Root ${catalogId} 0 R /Info ${infoId} 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`,
    );
    return buf.concat();
  }

  get count(): number {
    return this.objects.length;
  }
}

export function pdfDate(d = new Date()): string {
  return (
    `D:${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}` +
    `${String(d.getUTCDate()).padStart(2, "0")}${String(d.getUTCHours()).padStart(2, "0")}` +
    `${String(d.getUTCMinutes()).padStart(2, "0")}${String(d.getUTCSeconds()).padStart(2, "0")}Z`
  );
}
