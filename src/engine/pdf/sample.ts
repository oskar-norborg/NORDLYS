/** Tiny PDF used by diagnostics for WinAnsi Nordic letters and euro. */

import { PdfDoc } from "./layout";

export function buildNordicSamplePdf(): Uint8Array {
  const doc = new PdfDoc({
    title: "NORDLYS encoding sample",
    headerLeft: "NORDLYS",
    headerRight: "Encoding",
    footerNote: "Ålesund, Tromsø, Bærum",
    privacy: false,
  });
  doc.coverBand("Ålesund, Tromsø, Bærum", "Character encoding sample", "WinAnsi Helvetica", "CONFIDENTIAL");
  doc.heading("Nordic letters");
  doc.paragraph(
    "The Norwegian municipalities Ålesund, Tromsø, Bærum use AE OE AA in upper and lower case: ÆØÅ æøå.",
    { size: 11, leading: 16 },
  );
  doc.paragraph("Ålesund, Tromsø, Bærum", { size: 14, leading: 20 });
  doc.paragraph("Euro amount: € 1,234.56", { size: 12, leading: 16 });
  doc.paragraph("Comparators: ≥ ≤ σ Δ √ ✓ ⁴ and minus \u2212.", { size: 11, leading: 16 });
  return doc.finish();
}
