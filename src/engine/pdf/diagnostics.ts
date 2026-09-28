import type { DiagTest } from "../diagnostics";
import { DEMO_CLIENTS } from "@/data/demos";
import { defaultCma } from "../portfolios";
import { defaultWhatIf } from "@/data/storage";
import { buildSimInput, effectivePortfolio } from "../schedule";
import { runMonteCarlo } from "../montecarlo";
import { buildDemoLedger, DEMO_AS_OF } from "../ledger/synthetic";
import { computeHoldings } from "../ledger/holdings";
import {
  forbiddenCertainty,
  joinedPdfText,
  placedLayoutErrors,
  extractPlacedText,
  pdfContainsPhrase,
  privacyScan,
  validatePdf,
} from "./validate";
import { buildNordicSamplePdf } from "./sample";
import { buildProposalPdf } from "./proposal";
import { buildPortfolioReportPdf } from "./portfolio-report";
import { PdfDoc, C } from "./layout";
import { formatMoney, formatPct } from "../format";
import { ASSET_IDS, ASSET_LABELS, N_PATHS, N_PATHS_PREVIEW } from "../types";
import type { ClientProfile } from "../types";
import { pdfString, sanitizePdfText, unmappedWinAnsiChars } from "./winansi";
import { historicalRiskAvailable, holdingsWithoutImportedHistory } from "../ledger/prices";
import { pieWithLegend, fanOps, barPairOps, lineOps } from "./charts";

function t(id: string, group: string, name: string, pass: boolean, expected: string, actual: string): DiagTest {
  return { id, group, name, pass, expected, actual };
}

function metaText(v: ReturnType<typeof validatePdf>): string {
  return [joinedPdfTextFromStrings(v.strings), v.info.title, v.info.producer, v.info.creationDate].join("\n");
}

function joinedPdfTextFromStrings(strings: string[]): string {
  return strings.join(" ");
}

function structureActual(v: ReturnType<typeof validatePdf>, bytes: Uint8Array): string {
  if (!v.ok) return v.errors.slice(0, 4).join(" · ");
  return `ok objects=${v.objectCount} xref=${v.xrefCount} bytes=${bytes.length} startxref=${v.startxref} info=${v.info.title ? "yes" : "no"}`;
}

export function runPdfDiagnostics(): DiagTest[] {
  const tests: DiagTest[] = [];
  const cma = defaultCma();
  const asOf = "2026-09-10";

  const nordic = buildNordicSamplePdf();
  const nordicV = validatePdf(nordic);
  tests.push(
    t(
      "4a.nordic-sample",
      "4a. Strict PDF structure",
      "Encoding sample: 20-byte xref, /Size, startxref at xref, %%EOF, binary comment, Info",
      nordicV.ok &&
        nordic.length > 800 &&
        nordic[0] === 0x25 &&
        nordic[1] === 0x50 &&
        !!nordicV.info.title &&
        !!nordicV.info.producer &&
        !!nordicV.info.creationDate,
      "valid PDF 1.4, xref 20-byte, Info Title/Producer/CreationDate",
      structureActual(nordicV, nordic),
    ),
  );

  const phrase = "Ålesund, Tromsø, Bærum";
  const nordicJoined = joinedPdfText(nordic);
  tests.push(
    t(
      "4b.nordic",
      "4b. Character coverage",
      `PDF containing “${phrase}” encodes those characters correctly`,
      pdfContainsPhrase(nordic, phrase),
      phrase,
      pdfContainsPhrase(nordic, phrase) ? "decoded from WinAnsi strings" : "phrase not found",
    ),
  );
  const hasAE = pdfContainsPhrase(nordic, "ÆØÅ") && pdfContainsPhrase(nordic, "æøå");
  tests.push(
    t(
      "4b.case",
      "4b. Character coverage",
      "Upper and lower ÆØÅ / æøå round-trip through WinAnsi Helvetica",
      hasAE,
      "ÆØÅ and æøå present",
      hasAE ? "both present" : "missing",
    ),
  );
  tests.push(
    t(
      "4b.euro",
      "4b. Character coverage",
      "Euro sign € and the amount € 1,234.56 round-trip",
      pdfContainsPhrase(nordic, "€ 1,234.56") && pdfContainsPhrase(nordic, "€"),
      "€ 1,234.56",
      pdfContainsPhrase(nordic, "€ 1,234.56") ? "euro amount present" : nordicJoined.slice(0, 80),
    ),
  );

  const sanitized = sanitizePdfText("≥ ≤ σ Δ √ ✓ ⁴ \u2212");
  tests.push(
    t(
      "4b.replace",
      "4b. Character coverage",
      "≥ ≤ σ Δ √ ✓ ⁴ and U+2212 become WinAnsi words/signs (at least, at most, volatility, -)",
      sanitized.includes("at least") &&
        sanitized.includes("at most") &&
        sanitized.includes("volatility") &&
        sanitized.includes("delta") &&
        sanitized.includes("sqrt") &&
        sanitized.includes("ok") &&
        sanitized.includes("4") &&
        sanitized.includes("-") &&
        !sanitized.includes("≥") &&
        !sanitized.includes("\u2212") &&
        !sanitized.includes("σ"),
      "at least / at most / volatility / delta / sqrt / ok / 4 / -",
      sanitized,
    ),
  );
  tests.push(
    t(
      "4b.replace.drawn",
      "4b. Character coverage",
      "Replaced glyphs are what the encoding sample actually draws",
      pdfContainsPhrase(nordic, "at least") &&
        pdfContainsPhrase(nordic, "volatility") &&
        pdfContainsPhrase(nordic, "at most"),
      "at least, at most, volatility in extracted text",
      `at least=${pdfContainsPhrase(nordic, "at least")} volatility=${pdfContainsPhrase(nordic, "volatility")}`,
    ),
  );

  let threw = false;
  let throwMsg = "";
  try {
    pdfString("alpha \u03B1 snowman \u2603");
  } catch (e) {
    threw = true;
    throwMsg = e instanceof Error ? e.message : String(e);
  }
  tests.push(
    t(
      "4b.throw",
      "4b. Character coverage",
      "Writer throws on an unmapped character instead of printing ? or a box",
      threw && /Unmapped character U\+03B1/i.test(throwMsg),
      "Error Unmapped character U+03B1",
      threw ? throwMsg : "no throw",
    ),
  );

  // Edge-case charts must stay finite: zero vol, 0% success, single asset.
  const edgeProfile: ClientProfile = {
    ...DEMO_CLIENTS[0]!,
    id: "edge-case",
    name: "Edge Case",
    currentAssets: 100_000,
    goals: [
      {
        id: "edge-g0",
        type: "legacy",
        name: "Unreachable",
        targetAmount: 1e12,
        year: 2028,
        priority: 1,
      },
    ],
  };
  const edgeCma = { ...cma, vol: cma.vol.map(() => 0), mu: cma.mu.map(() => 0.04) };
  const edgeWhat = defaultWhatIf(edgeProfile.fee);
  const edgeSim = runMonteCarlo({
    ...buildSimInput(edgeProfile, edgeCma, edgeWhat, 256),
    weights: [1, 0, 0, 0, 0, 0],
    vol: [0, 0, 0, 0, 0, 0],
    nPaths: 256,
  });
  const edgePdf = buildProposalPdf({
    profile: edgeProfile,
    cma: edgeCma,
    whatIf: edgeWhat,
    privacy: false,
    result: edgeSim,
    baseline: edgeSim,
    nPaths: 256,
    asOf,
  });
  const edgeV = validatePdf(edgePdf.bytes);
  const edgeOps = [
    pieWithLegend({ x: 54, y: 400, w: 487, h: 150 }, [
      { value: 1, label: "Only" },
      { value: 0, label: "Zero" },
    ]),
    pieWithLegend({ x: 54, y: 400, w: 487, h: 150 }, [
      { value: 0, label: "A" },
      { value: 0, label: "B" },
    ]),
    fanOps(
      { x: 54, y: 400, w: 487, h: 168 },
      [2026, 2027],
      { p5: [0, 0], p25: [0, 0], p50: [0, 0], p75: [0, 0], p95: [0, 0] },
      "Index",
    ),
    fanOps(
      { x: 54, y: 400, w: 487, h: 168 },
      [2026],
      { p5: [NaN], p25: [NaN], p50: [Infinity], p75: [0], p95: [0] },
      "Index",
    ),
    barPairOps({ x: 54, y: 400, w: 487, h: 160 }, [{ label: "Only", a: 0, b: 0 }], ["Current", "Recommended"]),
    lineOps({ x: 54, y: 400, w: 487, h: 150 }, [[{ x: 0, y: 0 }, { x: 1, y: 0 }]], [C.navy], "Index"),
  ];
  const chartsFinite = edgeOps.every((o) => !/\bNaN\b|\bInfinity\b/.test(o));
  tests.push(
    t(
      "4a.edge.finite",
      "4a. Strict PDF structure",
      "Zero-vol, 0% success, single-asset chart paths stay finite (no NaN/Infinity/empty numbers)",
      edgeV.ok &&
        chartsFinite &&
        edgeSim.goals[0]!.successRate === 0 &&
        pdfContainsPhrase(edgePdf.bytes, "0.0%") &&
        !/\bNaN\b|\bInfinity\b/.test(joinedPdfText(edgePdf.bytes)),
      "valid PDF, 0.0% success, finite operators",
      `pdf=${edgeV.ok ? "ok" : edgeV.errors[0]} success=${edgeSim.goals[0]!.successRate} chartsFinite=${chartsFinite}`,
    ),
  );

  const demo = buildDemoLedger();
  const holdings = computeHoldings(demo.ledger, "fifo", DEMO_AS_OF);

  for (const client of DEMO_CLIENTS) {
    const whatIf = defaultWhatIf(client.fee);
    const sim = runMonteCarlo(buildSimInput(client, cma, whatIf, N_PATHS));
    const book = effectivePortfolio(client, whatIf, cma);
    const pdf = buildProposalPdf({
      profile: client,
      cma,
      whatIf,
      privacy: false,
      result: sim,
      baseline: sim,
      nPaths: N_PATHS,
      asOf,
      holdings: client.id === "demo-emilie" ? holdings : null,
    });
    const v = validatePdf(pdf.bytes);
    const joined = joinedPdfText(pdf.bytes);
    const placed = extractPlacedText(pdf.bytes, v.pageStreams);
    const placeErr = placedLayoutErrors(placed);
    const layoutErr = [...(pdf.layout?.violations ?? []), ...placeErr];
    const unmapped = v.strings.flatMap((s) => unmappedWinAnsiChars(s));
    const certainty = forbiddenCertainty(joined);

    tests.push(
      t(
        `4a.proposal-${client.id}`,
        "4a. Strict PDF structure",
        `${client.name}: xref 20-byte, objects exist, BT/ET q/Q, Info, no NaN`,
        v.ok &&
          pdf.bytes.length > 2000 &&
          v.info.title.includes(client.name) &&
          v.info.producer.includes("NORDLYS") &&
          !!v.info.creationDate &&
          v.pageStreams.length === (pdf.layout?.pageCount ?? 0),
        "valid PDF 1.4 with Title/Producer/CreationDate",
        structureActual(v, pdf.bytes),
      ),
    );

    tests.push(
      t(
        `4b.scan-${client.id}`,
        "4b. Character coverage",
        `${client.name}: every extracted string is WinAnsi`,
        unmapped.length === 0,
        "no unmapped code points",
        unmapped.length ? unmapped.slice(0, 6).join(", ") : "all WinAnsi",
      ),
    );

    tests.push(
      t(
        `4c.roundtrip-${client.id}`,
        "4c. Text extraction",
        `${client.name}: name and Nordic archive line round-trip`,
        joined.includes(client.name) && joined.includes(phrase),
        `${client.name} and ${phrase}`,
        `name=${joined.includes(client.name)} nordic=${joined.includes(phrase)}`,
      ),
    );

    const missingGoals: string[] = [];
    for (const g of client.goals) {
      const r = sim.goals.find((x) => x.goalId === g.id);
      const p = r ? formatPct(r.successRate, 1) : "";
      if (!r || !joined.includes(p) || !joined.includes(g.name)) missingGoals.push(`${g.name} ${p}`);
    }
    const med = formatMoney(sim.medianTerminal, client.currency, false);
    const feePct = formatPct(sim.feeDragPct);
    const feeAmt = formatMoney(sim.feeDrag, client.currency, false);
    const missingW: string[] = [];
    for (let i = 0; i < ASSET_IDS.length; i++) {
      const lab = ASSET_LABELS[ASSET_IDS[i]!];
      const w = formatPct(book.weights[i] ?? 0, 1);
      if (!joined.includes(lab) || !joined.includes(w)) missingW.push(`${lab} ${w}`);
    }
    const screenOk =
      missingGoals.length === 0 &&
      joined.includes(med) &&
      joined.includes(feePct) &&
      joined.includes(feeAmt) &&
      missingW.length === 0 &&
      sim.nPaths === N_PATHS &&
      pdfContainsPhrase(pdf.bytes, String(N_PATHS));

    tests.push(
      t(
        `4d.screen-${client.id}`,
        "4d. Screen equals PDF",
        `${client.name}: success, weights, fee drag, median ending wealth match the 10,000-path Planner`,
        screenOk,
        `10,000 paths, goals/weights/fee/median identical to screen formatters`,
        screenOk
          ? `nPaths=${sim.nPaths} median=${med} fee=${feePct}`
          : `missing goals=[${missingGoals.join("; ")}] weights=[${missingW.join("; ")}] median=${joined.includes(med)} feePct=${joined.includes(feePct)} nPaths=${sim.nPaths}`,
      ),
    );

    tests.push(
      t(
        `4g.layout-${client.id}`,
        "4g. Layout",
        `${client.name}: no overlap, nothing outside margins, no empty page, no orphan heading`,
        layoutErr.length === 0 && (pdf.layout?.emptyPages ?? 0) === 0 && placed.length > 0,
        "0 layout violations",
        layoutErr.length ? layoutErr.slice(0, 4).join(" · ") : `pages=${pdf.layout?.pageCount} glyphs=${placed.length}`,
      ),
    );

    tests.push(
      t(
        `4h.advisor-${client.id}`,
        "4h. Advisor language",
        `${client.name}: no certainty language; date, assumptions, hypothetical disclaimer present`,
        certainty.length === 0 &&
          joined.includes(asOf) &&
          /Assumptions/i.test(joined) &&
          /hypothetical illustration/i.test(joined) &&
          /not a guarantee of future results/i.test(joined),
        "date + assumptions + hypothetical disclaimer; no will reach/guaranteed/certain to",
        certainty.length
          ? `certainty: ${certainty.join(", ")}`
          : `date=${joined.includes(asOf)} assumptions=${/Assumptions/i.test(joined)} hypo=${/hypothetical/i.test(joined)}`,
      ),
    );

    const priv = buildProposalPdf({
      profile: client,
      cma,
      whatIf,
      privacy: true,
      result: sim,
      baseline: sim,
      nPaths: N_PATHS,
      asOf,
      holdings: client.id === "demo-emilie" ? holdings : null,
    });
    const pv = validatePdf(priv.bytes);
    const pAll = metaText(pv);
    const leaks = privacyScan(priv.bytes, pv);
    const pLayout = [
      ...(priv.layout?.violations ?? []),
      ...placedLayoutErrors(extractPlacedText(priv.bytes, pv.pageStreams)),
    ];
    tests.push(
      t(
        `4a.privacy-${client.id}`,
        "4a. Strict PDF structure",
        `${client.name} Privacy Mode PDF is Acrobat-valid`,
        pv.ok && !!pv.info.title && !!pv.info.producer && !!pv.info.creationDate,
        "valid PDF 1.4 with Info",
        structureActual(pv, priv.bytes),
      ),
    );
    tests.push(
      t(
        `4f.privacy-${client.id}`,
        "4f. Privacy Mode",
        `${client.name}: no kr/NOK/USD/EUR/$/€ or grouped money in body, tables, charts, or metadata`,
        leaks.length === 0 && /Privacy/i.test(pAll),
        "percentages/indexes/dates only",
        leaks.length ? leaks.join(", ") : "no currency amounts",
      ),
    );
    tests.push(
      t(
        `4g.privacy-layout-${client.id}`,
        "4g. Layout",
        `${client.name} Privacy Mode layout is clean`,
        pLayout.length === 0,
        "0 layout violations",
        pLayout.length ? pLayout.slice(0, 4).join(" · ") : `pages=${priv.layout?.pageCount}`,
      ),
    );
    tests.push(
      t(
        `4b.privacy-scan-${client.id}`,
        "4b. Character coverage",
        `${client.name} Privacy Mode strings are WinAnsi`,
        pv.strings.flatMap((s) => unmappedWinAnsiChars(s)).length === 0,
        "no unmapped code points",
        "all WinAnsi",
      ),
    );

    const openLeaks = privacyScan(pdf.bytes, v);
    tests.push(
      t(
        `4f.scanner-${client.id}`,
        "4f. Privacy Mode",
        `${client.name}: privacy scanner flags currency amounts on the non-privacy proposal`,
        openLeaks.length > 0,
        "at least one kr/NOK/USD/EUR/$/€ or grouped amount",
        openLeaks.length ? openLeaks.slice(0, 3).join(" · ") : "scanner saw nothing",
      ),
    );
  }

  // Passing the 2,000-path slider preview must still print the 10,000-path Planner numbers.
  const previewClient = DEMO_CLIENTS[0]!;
  const previewWhat = defaultWhatIf(previewClient.fee);
  const fullSim = runMonteCarlo(buildSimInput(previewClient, cma, previewWhat, N_PATHS));
  const previewSim = runMonteCarlo(buildSimInput(previewClient, cma, previewWhat, N_PATHS_PREVIEW));
  const fromPreview = buildProposalPdf({
    profile: previewClient,
    cma,
    whatIf: previewWhat,
    privacy: false,
    result: previewSim,
    asOf,
  });
  const fromPreviewText = joinedPdfText(fromPreview.bytes);
  const previewPrimary = fullSim.goals[0]!;
  tests.push(
    t(
      "4d.preview-rejected",
      "4d. Screen equals PDF",
      "A 2,000-path slider-drag result is discarded; the PDF uses the full 10,000 paths",
      fromPreviewText.includes(String(N_PATHS)) &&
        !fromPreviewText.includes(`${N_PATHS_PREVIEW} x`) &&
        fromPreviewText.includes(formatPct(previewPrimary.successRate, 1)) &&
        fromPreviewText.includes(formatMoney(fullSim.medianTerminal, previewClient.currency, false)),
      "10000 paths and 10k success/median, never 2000 x",
      `has10000=${fromPreviewText.includes(String(N_PATHS))} has2000x=${fromPreviewText.includes(`${N_PATHS_PREVIEW} x`)}`,
    ),
  );

  const noHistLedger = { ...demo.ledger, prices: [] as typeof demo.ledger.prices };
  tests.push(
    t(
      "4e.gate",
      "4e. My Data honesty",
      "historicalRiskAvailable is false for My Data without imported price/NAV history (never CMA)",
      historicalRiskAvailable("mydata", noHistLedger) === false &&
        historicalRiskAvailable("demo", demo.ledger) === true &&
        historicalRiskAvailable("mydata", demo.ledger) === false,
      "mydata+no import → false; demo → true; mydata+synthetic → false",
      `mydataEmpty=${historicalRiskAvailable("mydata", noHistLedger)} demo=${historicalRiskAvailable("demo", demo.ledger)} mydataSynthetic=${historicalRiskAvailable("mydata", demo.ledger)}`,
    ),
  );

  const myRep = buildPortfolioReportPdf({
    ledger: noHistLedger,
    profile: previewClient,
    cma,
    whatIf: previewWhat,
    costMethod: "fifo",
    privacy: false,
    asOf: DEMO_AS_OF,
    mode: "mydata",
  });
  const myText = joinedPdfText(myRep.bytes);
  const missingNames = holdingsWithoutImportedHistory(
    noHistLedger,
    holdings.holdings.map((h) => ({ isin: h.isin, name: h.security.name })),
  );
  const listed = missingNames.every((h) => myText.includes(h.name.split(" ")[0]!));
  tests.push(
    t(
      "4e.mydata-pdf",
      "4e. My Data honesty",
      "Portfolio report prints “Not available: import price history” and lists holdings without history; no Sharpe/Sortino/Calmar/VaR from CMA",
      myText.includes("Not available: import price history") &&
        listed &&
        !/Sharpe/.test(myText) &&
        !/Sortino/.test(myText) &&
        !/Calmar/.test(myText) &&
        validatePdf(myRep.bytes).ok,
      "Not available: import price history; holdings named; no CMA ratios",
      `phrase=${myText.includes("Not available: import price history")} listed=${listed} sharpe=${/Sharpe/.test(myText)}`,
    ),
  );

  const importedHist = {
    ...demo.ledger,
    prices: demo.ledger.prices.map((p) => ({ ...p, source: "import" as const })),
  };
  const histRep = buildPortfolioReportPdf({
    ledger: importedHist,
    profile: previewClient,
    cma,
    whatIf: previewWhat,
    costMethod: "fifo",
    privacy: false,
    asOf: DEMO_AS_OF,
    mode: "mydata",
  });
  const histText = joinedPdfText(histRep.bytes);
  tests.push(
    t(
      "4e.mydata-imported",
      "4e. My Data honesty",
      "With imported price history, My Data report prints volatility/Sharpe/Sortino/Calmar/drawdown/VaR from that history",
      historicalRiskAvailable("mydata", importedHist) &&
        /Volatility/.test(histText) &&
        /Sharpe/.test(histText) &&
        /Sortino/.test(histText) &&
        /Calmar/.test(histText) &&
        /drawdown/i.test(histText) &&
        /VaR/.test(histText) &&
        !histText.includes("Not available: import price history"),
      "risk table from imported NAV, not the placeholder",
      `gate=${historicalRiskAvailable("mydata", importedHist)} sharpe=${/Sharpe/.test(histText)} placeholder=${histText.includes("Not available: import price history")}`,
    ),
  );

  const report = buildPortfolioReportPdf({
    ledger: demo.ledger,
    profile: previewClient,
    cma,
    whatIf: previewWhat,
    costMethod: "fifo",
    privacy: false,
    asOf: DEMO_AS_OF,
    mode: "demo",
  });
  const rv = validatePdf(report.bytes);
  const rLayout = [...(report.layout?.violations ?? []), ...placedLayoutErrors(extractPlacedText(report.bytes, rv.pageStreams))];
  tests.push(
    t(
      "4a.portfolio-report",
      "4a. Strict PDF structure",
      "Demo portfolio report: xref, streams, Info",
      rv.ok && report.bytes.length > 2000 && pdfContainsPhrase(report.bytes, "Portfolio report"),
      "valid downloadable report",
      structureActual(rv, report.bytes),
    ),
  );
  tests.push(
    t(
      "4g.portfolio-report",
      "4g. Layout",
      "Demo portfolio report layout is clean",
      rLayout.length === 0,
      "0 layout violations",
      rLayout.length ? rLayout.slice(0, 4).join(" · ") : `pages=${report.layout?.pageCount}`,
    ),
  );

  const privRep = buildPortfolioReportPdf({
    ledger: demo.ledger,
    profile: previewClient,
    cma,
    whatIf: previewWhat,
    costMethod: "fifo",
    privacy: true,
    asOf: DEMO_AS_OF,
    mode: "demo",
  });
  const prv = validatePdf(privRep.bytes);
  const privRepLeaks = privacyScan(privRep.bytes, prv);
  tests.push(
    t(
      "4f.portfolio-privacy",
      "4f. Privacy Mode",
      "Portfolio report Privacy Mode: no currency amounts in charts, tables, or metadata",
      privRepLeaks.length === 0 && prv.ok,
      "no kr/NOK/USD/EUR/$/€",
      privRepLeaks.length ? privRepLeaks.join(", ") : "clean",
    ),
  );

  const longDoc = new PdfDoc({ title: "Table break", headerLeft: "NORDLYS", privacy: false });
  longDoc.coverBand("Table break", "Layout fixture", asOf, "CONFIDENTIAL");
  longDoc.heading("Long table");
  longDoc.addTable(
    [
      { header: "Name", width: 240 },
      { header: "Value", width: 200, align: "right" },
    ],
    Array.from({ length: 80 }, (_, i) => [`Row ${i} Ålesund`, String(i)]),
  );
  const longBytes = longDoc.finish();
  const longV = validatePdf(longBytes);
  const longLayout = [
    ...longDoc.layout.violations,
    ...placedLayoutErrors(extractPlacedText(longBytes, longV.pageStreams)),
  ];
  tests.push(
    t(
      "4g.table-break",
      "4g. Layout",
      "A table that spans pages repeats its header row and does not leave a heading as the last item",
      longDoc.layout.tableHeaderRepeats >= 1 &&
        longDoc.layout.pageCount >= 2 &&
        longDoc.layout.emptyPages === 0 &&
        !longDoc.layout.violations.some((x) => /ends with a heading/.test(x)) &&
        longV.ok &&
        longLayout.length === 0,
      "header repeated, no orphan heading, no overlap",
      `pages=${longDoc.layout.pageCount} repeats=${longDoc.layout.tableHeaderRepeats} viol=${longLayout.slice(0, 3).join(" · ") || "none"}`,
    ),
  );

  const orphan = new PdfDoc({ title: "Orphan heading", privacy: false });
  orphan.coverBand("Orphan", "Detector", asOf, "CONFIDENTIAL");
  orphan.heading("This heading is last");
  orphan.finish();
  tests.push(
    t(
      "4g.orphan-detector",
      "4g. Layout",
      "Layout auditor flags a heading left as the last item on a page",
      orphan.layout.violations.some((x) => /ends with a heading/.test(x)),
      "violation contains 'ends with a heading'",
      orphan.layout.violations.join(" · ") || "no violations",
    ),
  );

  tests.push(
    t(
      "4c.euro-nordic",
      "4c. Text extraction",
      "Source strings Ålesund, Tromsø, Bærum and € 1,234.56 extract exactly",
      pdfContainsPhrase(nordic, "Ålesund, Tromsø, Bærum") && pdfContainsPhrase(nordic, "€ 1,234.56"),
      "Ålesund, Tromsø, Bærum and € 1,234.56",
      "both present",
    ),
  );

  return tests;
}
