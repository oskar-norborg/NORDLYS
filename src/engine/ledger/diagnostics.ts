import type { DiagTest } from "../diagnostics";
import { parseNumber } from "./numbers";
import { decodeText, inspectNordnetFormat, parseNordnetBytes } from "./parse";
import { emptyLedgerBundle, importNordnetBuffer, mergeFxFromRows } from "./pipeline";
import { xirr } from "./returns";
import { computeHoldings } from "./holdings";
import { buildSyntheticNordnet, expectedTransactions, DEMO_AS_OF } from "./synthetic";
import { parsePriceCsv, sniffPriceMap } from "./prices";
import { resolveBenchmarkSeries, benchmarkSeries } from "./benchmarks";
import type { LedgerBundle, NordnetRow, Transaction } from "./types";
import { NORDNET_HEADERS_NB } from "./types";
import { encodeUtf16Le } from "./parse";
import { inferExchange, inferTicker, looksLikeFund, sanitizeSecurities, withUserPatch } from "./securities";

function cmpNum(a: number, b: number, eps = 1e-9): boolean {
  return Math.abs(a - b) <= eps;
}

function canonTx(t: {
  nordnetId: string;
  kind: string;
  isin: string;
  qty: number;
  price: number;
  amount: number;
  tradeDate: string;
  rawType: string;
}): string {
  return [
    t.nordnetId,
    t.kind,
    t.rawType,
    t.isin,
    t.qty.toFixed(4),
    t.price.toFixed(6),
    t.amount.toFixed(2),
    t.tradeDate,
  ].join("|");
}

export function runLedgerDiagnostics(): DiagTest[] {
  const tests: DiagTest[] = [];

  const numberCases: [string, number][] = [
    ["1 234,56", 1234.56],
    ["1\u00A0234,56", 1234.56],
    ["1.234,56", 1234.56],
    ["$1,234.56", 1234.56],
    ["(1,234.56)", -1234.56],
    ["1234,56-", -1234.56],
  ];
  for (const [raw, exp] of numberCases) {
    const got = parseNumber(raw);
    tests.push({
      id: `2a.${JSON.stringify(raw)}`,
      group: "2a. Number parsing",
      name: `parseNumber(${JSON.stringify(raw)})`,
      pass: got != null && cmpNum(got, exp, 1e-9),
      expected: String(exp),
      actual: got == null ? "null" : String(got),
    });
  }

  const syn = buildSyntheticNordnet();
  const fromUtf16 = importNordnetBuffer(syn.bytes, "nordnet-utf16.txt", emptyLedgerBundle(), {});
  const fromUtf8 = importNordnetBuffer(syn.utf8Csv, "nordnet-utf8.csv", emptyLedgerBundle(), {});
  const aKeys = fromUtf16.ledger.transactions.map(canonTx).sort();
  const bKeys = fromUtf8.ledger.transactions.map(canonTx).sort();
  const encMatch = aKeys.length === bKeys.length && aKeys.every((k, i) => k === bKeys[i]);
  tests.push({
    id: "2b.encoding",
    group: "2b. UTF-16 LE vs UTF-8 CSV",
    name: "UTF-16 LE tab file parses identically to UTF-8 comma-delimited",
    pass: encMatch,
    expected: `${aKeys.length} canonical rows`,
    actual: encMatch ? `${bKeys.length} match` : `utf16=${aKeys.length} utf8=${bKeys.length} firstDiff=${firstDiff(aKeys, bKeys)}`,
  });

  const expected = expectedTransactions(syn.rowsAsc);
  const gotTx = fromUtf16.ledger.transactions;
  const expKeys = expected.map(canonTx).sort();
  const gotKeys = gotTx.map(canonTx).sort();
  const rtMatch = expKeys.length === gotKeys.length && expKeys.every((k, i) => k === gotKeys[i]);
  const hExp = computeHoldings({ ...fromUtf16.ledger, transactions: expected }, "fifo", DEMO_AS_OF);
  const hGot = computeHoldings(fromUtf16.ledger, "fifo", DEMO_AS_OF);
  const holdMatch =
    cmpNum(hExp.cash, hGot.cash, 0.02) &&
    hExp.holdings.length === hGot.holdings.length &&
    hExp.holdings.every((h, i) => {
      const g = hGot.holdings[i]!;
      return h.isin === g.isin && cmpNum(h.qty, g.qty, 1e-4);
    });
  tests.push({
    id: "2c.roundtrip",
    group: "2c. Round trip",
    name: "Synthetic ledger → Nordnet file → import is identical (txs + holdings)",
    pass: rtMatch && holdMatch,
    expected: `${expected.length} txs, cash ${hExp.cash.toFixed(2)}, ${hExp.holdings.length} holdings`,
    actual: rtMatch && holdMatch
      ? "identical"
      : `txs ${rtMatch ? "ok" : firstDiff(expKeys, gotKeys)}; holdings ${holdMatch ? "ok" : `cash ${hGot.cash.toFixed(2)} n=${hGot.holdings.length}`}`,
  });

  const twice = importNordnetBuffer(syn.bytes, "nordnet-utf16.txt", fromUtf16.ledger, {});
  tests.push({
    id: "2d.dedup",
    group: "2d. Dedup",
    name: "Importing the same file twice leaves the ledger unchanged",
    pass:
      twice.report.duplicatesSkipped === fromUtf16.report.transactionsCreated &&
      twice.report.transactionsCreated === 0 &&
      twice.ledger.transactions.length === fromUtf16.ledger.transactions.length,
    expected: `0 created, ${fromUtf16.report.transactionsCreated} duplicates, ${fromUtf16.ledger.transactions.length} txs`,
    actual: `${twice.report.transactionsCreated} created, ${twice.report.duplicatesSkipped} duplicates, ${twice.ledger.transactions.length} txs`,
  });

  const known = xirr(
    [
      { date: "2019-01-01", amount: -1000 },
      { date: "2020-01-01", amount: 1080 },
    ],
    0.05,
  );
  const xirrErr = Math.abs(known - 0.08);
  tests.push({
    id: "2e.xirr",
    group: "2e. XIRR",
    name: "XIRR on cash flows with a known 8% rate matches within 1e-8",
    pass: xirrErr < 1e-8,
    expected: "0.08 ± 1e-8",
    actual: `${known}  (err ${xirrErr.toExponential(3)})`,
  });

  const tStart = "2015-06-15";
  const tEnd = "2018-06-15";
  const tYears = (Date.parse(tEnd + "T00:00:00Z") - Date.parse(tStart + "T00:00:00Z")) / (365 * 86400000);
  const known2 = xirr(
    [
      { date: tStart, amount: -5000 },
      { date: tEnd, amount: 5000 * Math.pow(1.065, tYears) },
    ],
    0.06,
  );
  const err2 = Math.abs(known2 - 0.065);
  tests.push({
    id: "2e.xirr.multi",
    group: "2e. XIRR",
    name: "XIRR on a 3-year 6.5% growth matches within 1e-8 relative",
    pass: err2 < 1e-8,
    expected: "0.065 ± 1e-8 rel",
    actual: `${known2}  (rel ${err2.toExponential(3)})`,
  });

  const fmt = inspectNordnetFormat(syn.bytes);
  const bomOk = fmt.bomUtf16Le;
  const tabOk = fmt.tabDelimited && fmt.columnCount === 30;
  const crlfOk = fmt.crlf;
  const valutaOk =
    fmt.valutaColumns.length === 5 &&
    fmt.valutaColumns[0] === 12 &&
    fmt.valutaColumns[1] === 14 &&
    fmt.valutaColumns[2] === 16 &&
    fmt.valutaColumns[3] === 18 &&
    fmt.valutaColumns[4] === 27;
  tests.push({
    id: "2f.format",
    group: "2f. Demo Nordnet format",
    name: "UTF-16 LE BOM, tabs, CRLF, 30 columns, Valuta at 12/14/16/18/27, Norwegian headers",
    pass: bomOk && tabOk && crlfOk && valutaOk && fmt.headersMatch,
    expected: "FF FE, tab, CRLF, 30 cols, 5× Valuta, NB headers",
    actual: `BOM=${bomOk} tab=${tabOk} crlf=${crlfOk} cols=${fmt.columnCount} valuta=[${fmt.valutaColumns.join(",")}] headers=${fmt.headersMatch}`,
  });

  const recon = fromUtf16.report.recon;
  tests.push({
    id: "2f.saldo",
    group: "2f. Demo Nordnet format",
    name: "Saldo chain of the synthetic export reconciles with zero mismatches",
    pass: recon.saldoErrors === 0,
    expected: "0 saldo errors",
    actual: `${recon.saldoErrors} errors / ${recon.issues.filter((i) => i.field === "saldo").length} issues (opening ${recon.openingSaldo})`,
  });
  tests.push({
    id: "2f.qty",
    group: "2f. Demo Nordnet format",
    name: "Totalt antall: 0 errors, exactly 1 rounding note; dividend/tax Totalt antall=0 is ignored",
    pass: recon.qtyErrors === 0 && recon.saldoErrors === 0 && recon.qtyRounding === 1,
    expected: "0 saldo errors, 0 qty errors, 1 rounding note",
    actual: `${recon.saldoErrors} saldo, ${recon.qtyErrors} qty, ${recon.qtyRounding} rounding`,
  });

  const decoded = decodeText(syn.bytes);
  tests.push({
    id: "2f.enc",
    group: "2f. Demo Nordnet format",
    name: "Decoder reports utf-16le for the demo export",
    pass: decoded.encoding === "utf-16le",
    expected: "utf-16le",
    actual: decoded.encoding,
  });

  const cancelled = fromUtf16.report.cancelled;
  const parsed = parseNordnetBytes(syn.bytes);
  const cancelRow = parsed.rows.find((r) => r.cancelDate);
  const cancelIsin = cancelRow?.isin ?? "";
  const cancelQty = Math.abs(cancelRow?.qty ?? 0);
  const holding = hGot.holdings.find((h) => h.isin === cancelIsin);
  const qtyIfIncluded = (holding?.qty ?? 0) + cancelQty;
  const excluded = cancelled.length === 1 && fromUtf16.report.cancelledExcluded === 1;
  const notInLedger = !gotTx.some((t) => t.nordnetId === cancelRow?.id);
  tests.push({
    id: "2g.cancel",
    group: "2g. Cancelled rows",
    name: "Makuleringsdato row is excluded from holdings and listed in the import report",
    pass: excluded && notInLedger && cancelled[0]?.nordnetId === cancelRow?.id,
    expected: `1 cancelled Id ${cancelRow?.id}, not in ledger (qty would be ${qtyIfIncluded} if kept)`,
    actual: `report ${cancelled.length}, inLedger=${!notInLedger}, holdingQty=${holding?.qty ?? 0}`,
  });

  const enc = (s: string) => new TextEncoder().encode(s);
  const navCsv = "Date,NAV\n2020-01-02,123.45\n2020-01-03,124.1\n2020-06-15,130.00\n";
  const navQuotes = parsePriceCsv(enc(navCsv), "NO0000000001");
  tests.push({
    id: "2h.nav.header",
    group: "2h. Mutual-fund NAV import",
    name: "Date + NAV file (no OHLC) parses three points",
    pass: navQuotes.length === 3 && cmpNum(navQuotes[0]!.close, 123.45) && navQuotes[2]!.date === "2020-06-15",
    expected: "3 quotes, first 123.45 on 2020-01-02",
    actual: `${navQuotes.length} quotes first=${navQuotes[0]?.date}:${navQuotes[0]?.close}`,
  });

  const headerless = parsePriceCsv(enc("2021-03-01,98.5\n2021-03-02,99.25\n"), "IE00B4L5Y983");
  tests.push({
    id: "2h.nav.headerless",
    group: "2h. Mutual-fund NAV import",
    name: "Headerless date,NAV rows are treated as data (first row not dropped as a header)",
    pass: headerless.length === 2 && cmpNum(headerless[0]!.close, 98.5) && headerless[0]!.date === "2021-03-01",
    expected: "2 quotes, first 98.5 on 2021-03-01",
    actual: `${headerless.length} quotes first=${headerless[0]?.date}:${headerless[0]?.close}`,
  });

  const euroNav = parsePriceCsv(enc("Dato;Andelsverdi\n02.01.2020;1.234,56\n03.01.2020;1.240,00\n"), "NO0010582984");
  tests.push({
    id: "2h.nav.european",
    group: "2h. Mutual-fund NAV import",
    name: "European Date;Andelsverdi (decimal comma, no OHLC) maps NAV to close",
    pass: euroNav.length === 2 && cmpNum(euroNav[0]!.close, 1234.56) && euroNav[0]!.date === "2020-01-02",
    expected: "2 quotes, 1234.56 on 2020-01-02",
    actual: `${euroNav.length} quotes first=${euroNav[0]?.date}:${euroNav[0]?.close}`,
  });

  const yahoo = parsePriceCsv(
    enc("Date,Open,High,Low,Close,Adj Close,Volume\n2020-01-02,10,11,9,10.5,10.25,1000\n"),
    "US0378331005",
  );
  const yahooMap = sniffPriceMap(["Date", "Open", "High", "Low", "Close", "Adj Close", "Volume"]);
  tests.push({
    id: "2h.yahoo.adj",
    group: "2h. Mutual-fund NAV import",
    name: "Yahoo OHLC still prefers Adj Close over Close and over NAV",
    pass: yahooMap.price === 5 && yahoo.length === 1 && cmpNum(yahoo[0]!.close, 10.25),
    expected: "col 5 = Adj Close, value 10.25",
    actual: `col=${yahooMap.price} n=${yahoo.length} close=${yahoo[0]?.close}`,
  });

  const usdIsin = "US0378331005";
  const buy = stubTx({
    kind: "buy",
    tradeDate: "2024-01-15",
    isin: usdIsin,
    name: "Apple Inc",
    qty: 10,
    price: 150,
    amount: -16500,
    fxRate: 11,
    purchaseCcy: "USD",
    priceCcy: "USD",
  });
  const noMkt: LedgerBundle = {
    ...emptyLedgerBundle(),
    transactions: [buy],
    securities: [
      {
        isin: usdIsin,
        ticker: "AAPL",
        name: "Apple Inc",
        currency: "USD",
        exchange: "NASDAQ",
        assetClass: "us_eq",
      },
    ],
  };
  const staleHold = computeHoldings(noMkt, "fifo", "2026-09-01");
  const apple = staleHold.holdings.find((h) => h.isin === usdIsin);
  tests.push({
    id: "2i.price.stale",
    group: "2i. Stale marks",
    name: "Holding without imported prices is valued at last trade and marked priceStale",
    pass: !!apple && apple.priceStale && cmpNum(apple.price, 150, 1e-9) && apple.priceSource === "last_trade",
    expected: "price=150 last_trade, priceStale=true",
    actual: apple
      ? `price=${apple.price} source=${apple.priceSource} stale=${apple.priceStale}`
      : "holding missing",
  });
  tests.push({
    id: "2i.fx.stale",
    group: "2i. Stale marks",
    name: "USD position without imported FX is marked fxStale",
    pass: !!apple && apple.fxStale && apple.security.currency === "USD",
    expected: "fxStale=true",
    actual: apple ? `fx=${apple.fx} fxStale=${apple.fxStale}` : "holding missing",
  });

  const withPx: LedgerBundle = {
    ...noMkt,
    prices: [{ isin: usdIsin, date: "2026-09-01", close: 180, source: "import" }],
    fx: [{ pair: "USDNOK", date: "2026-09-01", rate: 10.5, source: "import", stale: false }],
  };
  const fresh = computeHoldings(withPx, "fifo", "2026-09-01").holdings.find((h) => h.isin === usdIsin);
  tests.push({
    id: "2i.imported.fresh",
    group: "2i. Stale marks",
    name: "Imported price and FX clear both stale flags and revalue the holding",
    pass: !!fresh && !fresh.priceStale && !fresh.fxStale && cmpNum(fresh.price, 180) && cmpNum(fresh.fx, 10.5),
    expected: "price=180 fx=10.5, both stale=false",
    actual: fresh
      ? `price=${fresh.price} fx=${fresh.fx} priceStale=${fresh.priceStale} fxStale=${fresh.fxStale}`
      : "holding missing",
  });

  const nordnetFxOnly: LedgerBundle = {
    ...noMkt,
    fx: [{ pair: "USDNOK", date: "2024-01-15", rate: 11, source: "nordnet", stale: true }],
  };
  const nnFx = computeHoldings(nordnetFxOnly, "fifo", "2026-09-01").holdings.find((h) => h.isin === usdIsin);
  tests.push({
    id: "2i.fx.nordnet.stale",
    group: "2i. Stale marks",
    name: "Nordnet trade FX is used for valuation but still marked stale until an FX file is imported",
    pass: !!nnFx && nnFx.fxStale && cmpNum(nnFx.fx, 11),
    expected: "fx=11, fxStale=true",
    actual: nnFx ? `fx=${nnFx.fx} fxStale=${nnFx.fxStale}` : "holding missing",
  });

  const empty = emptyLedgerBundle();
  const mydataDates = ["2021-01-01", "2022-01-01", "2023-01-01", "2024-01-01"];
  const mydataSeries = resolveBenchmarkSeries(empty, "world", "mydata", mydataDates);
  const generated = benchmarkSeries("world", mydataDates);
  tests.push({
    id: "2j.bench.hidden",
    group: "2j. My Data benchmarks",
    name: "My Data with no imported benchmark quotes returns an empty series (never generated)",
    pass: mydataSeries.length === 0 && generated.length === mydataDates.length,
    expected: "0 stored points; generator would have produced " + generated.length,
    actual: `resolve=${mydataSeries.length} generator=${generated.length}`,
  });

  const importedBench: LedgerBundle = {
    ...empty,
    benchmarks: [
      { id: "world", date: "2021-01-01", value: 100, source: "import" },
      { id: "world", date: "2024-01-01", value: 140, source: "import" },
    ],
  };
  const shown = resolveBenchmarkSeries(importedBench, "world", "mydata", mydataDates);
  tests.push({
    id: "2j.bench.imported",
    group: "2j. My Data benchmarks",
    name: "Imported benchmark quotes are returned as-is in My Data",
    pass: shown.length === 2 && cmpNum(shown[1]!.value, 140) && shown[0]!.date === "2021-01-01",
    expected: "2 imported points, last 140",
    actual: `${shown.length} last=${shown[shown.length - 1]?.value}`,
  });

  const parsedSyn = parseNordnetBytes(syn.bytes);
  const divRows = parsedSyn.rows.filter((r) => r.rawType === "UTBYTTE" || r.rawType === "KUPONGSKATT");
  const divTotaltZero = divRows.length > 0 && divRows.every((r) => r.totalQty === 0);
  tests.push({
    id: "2k.div.totalt",
    group: "2k. Totalt antall quirk",
    name: "Demo export writes Totalt antall = 0 on UTBYTTE and KUPONGSKATT",
    pass: divTotaltZero && divRows.length >= 2,
    expected: "every dividend/tax row has Totalt antall 0",
    actual: `${divRows.length} rows, allZero=${divTotaltZero}`,
  });

  const usNames = [
    { name: "Microsoft", isin: "US5949181045", tickerGuess: "1045" },
    { name: "Rocket Lab", isin: "US77313F1060", tickerGuess: "1060" },
    { name: "Copa Holdings", isin: "PAP162399074", tickerGuess: "9074" },
  ];
  const usFile = usStockSampleFile();
  const usImp = importNordnetBuffer(usFile, "us.txt", emptyLedgerBundle(), {});
  const usOk = usNames.every((n) => {
    const s = usImp.ledger.securities.find((x) => x.isin === n.isin);
    return s && s.currency === "USD" && s.ticker === "" && s.ticker !== n.tickerGuess;
  });
  tests.push({
    id: "2l.currency.usd",
    group: "2l. Security currency",
    name: "Vekslingskurs / non-NOK Kjøpsverdi·Resultat → USD (Microsoft, Rocket Lab, Copa); ticker not from ISIN",
    pass: usOk,
    expected: "USD, blank ticker for MSFT/RKLB/CPA",
    actual: usNames
      .map((n) => {
        const s = usImp.ledger.securities.find((x) => x.isin === n.isin);
        return `${n.name}=${s ? `${s.currency}/${s.ticker || "∅"}` : "missing"}`;
      })
      .join("; "),
  });

  const fundEx = inferExchange("iShares Core MSCI World", "IE00B4L5Y983");
  const eqEx = inferExchange("Equinor ASA", "NO0010096985");
  const noIsinTicker = inferTicker("Equinor ASA", "NO0010096985") === "" && inferTicker("Microsoft", "US5949181045") === "";
  tests.push({
    id: "2l.ticker.exchange",
    group: "2l. Security currency",
    name: "Tickers stay blank (never from ISIN); funds get exchange Fund; equities get blank exchange",
    pass: noIsinTicker && fundEx === "Fund" && eqEx === "" && looksLikeFund("iShares Core MSCI World"),
    expected: "ticker='', fund=Fund, equity=''",
    actual: `tickerBlank=${noIsinTicker} fundEx=${fundEx} eqEx=${eqEx}`,
  });

  const classSuggested = usImp.ledger.securities.every((s) => !s.assetClassConfirmed);
  tests.push({
    id: "2l.class.suggested",
    group: "2l. Security currency",
    name: "Auto asset class is suggested, not confirmed, until the user edits it",
    pass: classSuggested && usImp.ledger.securities.length === 3,
    expected: "assetClassConfirmed=false on all 3",
    actual: usImp.ledger.securities.map((s) => `${s.name}:${s.assetClassConfirmed ? "confirmed" : "suggested"}`).join(", "),
  });

  const edited = {
    ...usImp.ledger,
    securities: usImp.ledger.securities.map((s) =>
      s.isin === "US5949181045" ? withUserPatch(s, { ticker: "MSFT", assetClass: s.assetClass, assetClassConfirmed: true }) : s,
    ),
  };
  const reimp = importNordnetBuffer(usFile, "us.txt", edited, {});
  const msft = reimp.ledger.securities.find((s) => s.isin === "US5949181045");
  tests.push({
    id: "2m.edits.survive",
    group: "2m. Security master",
    name: "Ticker and confirmed class survive re-importing the same file",
    pass: !!msft && msft.ticker === "MSFT" && msft.assetClassConfirmed === true && reimp.report.transactionsCreated === 0,
    expected: "MSFT still MSFT, class confirmed, 0 created",
    actual: msft
      ? `ticker=${msft.ticker} confirmed=${msft.assetClassConfirmed} created=${reimp.report.transactionsCreated}`
      : "missing",
  });

  const fxRows = parsedSyn.rows.filter((r) => r.rawType === "VALUTAVEKSLING");
  const fxDates = new Set(fxRows.map((r) => r.tradeDate || r.bookingDate));
  const fxQuotes = mergeFxFromRows([], fxRows);
  tests.push({
    id: "2n.fx.quotes",
    group: "2n. FX quotes from trades",
    name: "8 FX trades on 5 dates yield 5 USDNOK quotes (one per date), not one per trade and not dropping FX rows",
    pass: fxRows.length === 8 && fxDates.size === 5 && fxQuotes.length === 5 && fxQuotes.every((q) => q.pair === "USDNOK"),
    expected: "8 trades, 5 dates, 5 quotes",
    actual: `${fxRows.length} trades, ${fxDates.size} dates, ${fxQuotes.length} quotes`,
  });

  const bareFx = bareFxSampleFile();
  const bareImp = importNordnetBuffer(bareFx, "fx.txt", emptyLedgerBundle(), {});
  const bareQuotes = bareImp.ledger.fx.filter((q) => q.pair === "USDNOK");
  const bareDates = new Set(bareQuotes.map((q) => q.date));
  tests.push({
    id: "2n.fx.no-valuta",
    group: "2n. FX quotes from trades",
    name: "VALUTAVEKSLING without a non-NOK valuta column still yields one quote per date (not dropped)",
    pass: bareDates.size === 5 && bareQuotes.length === 5,
    expected: "5 USDNOK quotes from 8 FX trades / 5 dates with empty Verdipapir and NOK amount",
    actual: `${bareQuotes.length} quotes, ${bareDates.size} dates`,
  });

  const dirty = sanitizeSecurities([
    {
      isin: "US5949181045",
      ticker: "1045",
      name: "Microsoft",
      currency: "USD",
      exchange: "US",
      assetClass: "us_eq",
    },
    {
      isin: "US7731211089",
      ticker: "1089",
      name: "Rocket Lab",
      currency: "USD",
      exchange: "US",
      assetClass: "us_eq",
    },
    {
      isin: "NO0000002405",
      ticker: "2405",
      name: "Some Nordnet name",
      currency: "NOK",
      exchange: "OSE",
      assetClass: "nordic_eq",
    },
    {
      isin: "NO0000006151",
      ticker: "6151",
      name: "Other",
      currency: "NOK",
      exchange: "OSE",
      assetClass: "nordic_eq",
    },
    {
      isin: "NO0000001054",
      ticker: "1054",
      name: "Third",
      currency: "NOK",
      exchange: "OSE",
      assetClass: "nordic_eq",
    },
    {
      isin: "NO0010000001",
      ticker: "KLP",
      name: "KLP Likviditet",
      currency: "NOK",
      exchange: "OSE",
      assetClass: "cash",
    },
    withUserPatch(
      {
        isin: "US0378331005",
        ticker: "AAPL",
        name: "Apple Inc",
        currency: "USD",
        exchange: "NASDAQ",
        assetClass: "us_eq",
      },
      { ticker: "AAPL", exchange: "NASDAQ" },
    ),
  ]);
  const klp = dirty.find((s) => s.name === "KLP Likviditet");
  const msftDirty = dirty.find((s) => s.isin === "US5949181045");
  const appleKept = dirty.find((s) => s.isin === "US0378331005");
  const allCleared = [msftDirty, dirty.find((s) => s.ticker === "1089"), dirty.find((s) => s.isin === "NO0000002405")].every(
    (s) => !s || s.ticker === "",
  );
  tests.push({
    id: "2o.sanitize.tickers",
    group: "2o. Generated ticker cleanup",
    name: "Load-time cleanup blanks ISIN-tail / name-prefix tickers (1045, 1089, 2405, 6151, 1054, KLP) and keeps user-entered AAPL",
    pass:
      allCleared &&
      dirty.filter((s) => s.isin !== "US0378331005").every((s) => s.ticker === "") &&
      appleKept?.ticker === "AAPL" &&
      appleKept?.userSet?.ticker === true,
    expected: "generated blank, AAPL kept",
    actual: dirty.map((s) => `${s.name}:${s.ticker || "∅"}`).join("; "),
  });
  tests.push({
    id: "2o.sanitize.klp",
    group: "2o. Generated ticker cleanup",
    name: "KLP Likviditet exchange becomes Fund (not OSE); ticker blank; looksLikeFund",
    pass: !!klp && klp.ticker === "" && klp.exchange === "Fund" && looksLikeFund("KLP Likviditet"),
    expected: "ticker ∅, exchange Fund",
    actual: klp ? `ticker=${klp.ticker || "∅"} ex=${klp.exchange}` : "missing",
  });

  const staleSecs = [
    {
      isin: "US5949181045",
      ticker: "1045",
      name: "Microsoft",
      currency: "USD",
      exchange: "US",
      assetClass: "us_eq" as const,
    },
  ];
  const reimportClears = importNordnetBuffer(usFile, "us.txt", { ...emptyLedgerBundle(), securities: staleSecs }, {});
  const after = reimportClears.ledger.securities.find((s) => s.isin === "US5949181045");
  tests.push({
    id: "2o.upsert.drops.generated",
    group: "2o. Generated ticker cleanup",
    name: "Re-import does not keep a previous auto-generated ticker (1045)",
    pass: !!after && after.ticker === "",
    expected: "ticker blank after re-import",
    actual: after ? `ticker=${after.ticker || "∅"}` : "missing",
  });


  const usdSettled = usdBuysSellsSettledInNokFile();
  const usdImp = importNordnetBuffer(usdSettled, "usd-settled-nok.txt", emptyLedgerBundle(), {});
  const usdHold = computeHoldings(usdImp.ledger, "fifo", "2026-09-01");
  const usdFxTx = usdImp.ledger.transactions.filter((t) => t.kind === "currency_exchange");
  const usdAmountCcy = new Set(usdImp.ledger.transactions.map((t) => t.amountCcy));
  const usdCashKinds = usdImp.ledger.transactions.filter(
    (t) => t.kind === "buy" || t.kind === "sell" || t.kind === "deposit",
  );
  const expectedCash = usdCashKinds.reduce((s, t) => s + t.amount, 0);
  const usdNotional = 10 * 150 + 4 * 180;
  tests.push({
    id: "2p.usd.settled.nok",
    group: "2p. USD trades settled in NOK",
    name: "USD stock buys and sells settled in NOK produce no USD cash and no separate FX transactions",
    pass:
      usdFxTx.length === 0 &&
      usdAmountCcy.size === 1 &&
      usdAmountCcy.has("NOK") &&
      Math.abs(usdHold.cash - expectedCash) < 0.02 &&
      Math.abs(usdHold.cash - usdNotional) > 1 &&
      usdHold.holdings.every((h) => h.security.currency === "USD"),
    expected: "NOK cash only, 0 currency_exchange, cash != USD notional",
    actual: `cash=${usdHold.cash} expected=${expectedCash} fxTx=${usdFxTx.length} amountCcy=[${[...usdAmountCcy].join(",")}] qty=${usdHold.holdings[0]?.qty ?? 0}`,
  });

  const demoHold = computeHoldings(fromUtf16.ledger, "fifo", DEMO_AS_OF);
  const identityRows = demoHold.holdings.map((h) => {
    const sum = h.priceEffect + h.currencyEffect + h.feeEffect;
    return Math.abs(sum - h.unrealizedNok) < 0.05;
  });
  const totalsMatch =
    Math.abs(demoHold.totalPriceEffect + demoHold.totalCurrencyEffect + demoHold.totalFeeEffect - demoHold.totalUnrealized) < 0.08;
  tests.push({
    id: "2q.unrealized.fee.identity",
    group: "2q. Unrealized P&L identity",
    name: "Price effect + FX effect + fee effect = unrealized P&L on every holding",
    pass: identityRows.length > 0 && identityRows.every(Boolean) && totalsMatch,
    expected: "price + FX + fees = uP&L",
    actual: demoHold.holdings
      .map((h) => {
        const sum = h.priceEffect + h.currencyEffect + h.feeEffect;
        return `${h.security.ticker || h.isin}:${sum.toFixed(2)} vs ${h.unrealizedNok.toFixed(2)}`;
      })
      .slice(0, 4)
      .join(" · "),
  });

  return tests;
}


function usdBuysSellsSettledInNokFile(): Uint8Array {
  const header = NORDNET_HEADERS_NB.join("\t");
  const lines = [header];
  const blank = () => Array.from({ length: 30 }, () => "");
  const row = (
    id: number,
    date: string,
    type: string,
    name: string,
    isin: string,
    qty: string,
    price: string,
    amount: string,
    purchase: string,
    purchaseCcy: string,
    fx: string,
    saldo: string,
  ): string => {
    const c = blank();
    c[0] = String(id);
    c[1] = date;
    c[2] = date;
    c[3] = date;
    c[4] = "Default";
    c[5] = type;
    c[6] = name;
    c[7] = isin;
    c[8] = qty;
    c[9] = price;
    c[13] = amount;
    c[14] = "NOK";
    c[15] = purchase;
    c[16] = purchaseCcy;
    c[19] = qty;
    c[20] = saldo;
    c[21] = fx;
    c[28] = fx;
    return c.join("\t");
  };
  // Newest first. Buy 10 AAPL @ 150 USD settled -16500 NOK; sell 4 @ 180 USD settled +7920 NOK.
  lines.push(row(3, "2024-03-10", "SALG", "Apple Inc", "US0378331005", "4", "180,00", "7920,00", "", "", "11,000000", "10000,00"));
  lines.push(row(2, "2024-01-15", "KJØPT", "Apple Inc", "US0378331005", "10", "150,00", "-16500,00", "1500,00", "USD", "11,000000", "2080,00"));
  lines.push(row(1, "2024-01-02", "INNSKUDD", "", "", "", "", "18580,00", "", "", "", "18580,00"));
  return encodeUtf16Le(lines.join("\r\n") + "\r\n", true);
}

function usStockSampleFile(): Uint8Array {
  const header = NORDNET_HEADERS_NB.join("\t");
  const names: [string, string, string][] = [
    ["Microsoft", "US5949181045", "USD"],
    ["Rocket Lab", "US77313F1060", "USD"],
    ["Copa Holdings", "PAP162399074", "USD"],
  ];
  const lines = [header];
  let id = 10;
  let saldo = 0;
  // Newest first: a dividend (Totalt antall 0, no purchase ccy) then the buy with Vekslingskurs.
  for (const [name, isin, ccy] of names) {
    id += 1;
    const div = blankCells();
    div[0] = String(id);
    div[1] = "2025-06-15";
    div[2] = "2025-06-15";
    div[3] = "2025-06-17";
    div[4] = "Default";
    div[5] = "UTBYTTE";
    div[6] = name;
    div[7] = isin;
    div[8] = "0";
    div[13] = "12,00";
    div[14] = "NOK";
    div[19] = "0";
    saldo = 12;
    div[20] = "12,00";
    lines.push(div.join("\t"));
    id += 1;
    const buy = blankCells();
    buy[0] = String(id);
    buy[1] = "2024-03-01";
    buy[2] = "2024-03-01";
    buy[3] = "2024-03-05";
    buy[4] = "Default";
    buy[5] = "KJØPT";
    buy[6] = name;
    buy[7] = isin;
    buy[8] = "5";
    buy[9] = "400,00";
    buy[13] = "-21000,00";
    buy[14] = "NOK";
    buy[15] = name === "Rocket Lab" ? "" : "2000,00";
    buy[16] = name === "Rocket Lab" ? "" : ccy;
    buy[17] = name === "Rocket Lab" ? "0" : "0";
    buy[18] = ccy;
    buy[19] = "5";
    buy[20] = "-20988,00";
    buy[21] = "10,500000";
    buy[22] = `Kjøp ${name}`;
    buy[28] = "10,500000";
    lines.push(buy.join("\t"));
  }
  void saldo;
  const text = lines.join("\r\n") + "\r\n";
  return encodeUtf16Le(text, true);
}

function blankCells(): string[] {
  return Array.from({ length: 30 }, () => "");
}

function bareFxSampleFile(): Uint8Array {
  const header = NORDNET_HEADERS_NB.join("\t");
  const days: [string, number][] = [
    ["2022-04-01", 1500],
    ["2022-04-01", 500],
    ["2023-01-10", 800],
    ["2023-06-20", 1200],
    ["2023-06-20", 400],
    ["2024-02-15", 900],
    ["2025-03-03", 600],
    ["2025-03-03", 300],
  ];
  const lines = [header];
  let id = 0;
  let saldo = 100000;
  for (const [date, usd] of days) {
    id += 1;
    const rate = 10.5;
    const amount = -(usd * rate);
    saldo += amount;
    const row = blankCells();
    row[0] = String(id);
    row[1] = date;
    row[2] = date;
    row[3] = date;
    row[4] = "Default";
    row[5] = "VALUTAVEKSLING";
    row[8] = String(usd);
    row[9] = "10,500000";
    row[13] = String(amount).replace(".", ",");
    row[14] = "NOK";
    row[20] = String(saldo).replace(".", ",");
    row[21] = "10,500000";
    row[22] = "Valutaveksling";
    row[28] = "10,500000";
    lines.push(row.join("\t"));
  }
  return encodeUtf16Le(lines.join("\r\n") + "\r\n", true);
}

function stubTx(p: Partial<Transaction> & Pick<Transaction, "kind" | "tradeDate">): Transaction {
  const d = p.tradeDate;
  return {
    id: p.id ?? "t1",
    nordnetId: p.nordnetId ?? "1",
    fingerprint: p.fingerprint ?? "fp1",
    bookingDate: p.bookingDate ?? d,
    tradeDate: d,
    settleDate: p.settleDate ?? d,
    portfolio: p.portfolio ?? "Default",
    kind: p.kind,
    rawType: p.rawType ?? p.kind,
    name: p.name ?? "",
    isin: p.isin ?? "",
    qty: p.qty ?? 0,
    price: p.price ?? 0,
    priceCcy: p.priceCcy ?? "NOK",
    interest: p.interest ?? 0,
    fees: p.fees ?? 0,
    feeCcy: p.feeCcy ?? "NOK",
    amount: p.amount ?? 0,
    amountCcy: p.amountCcy ?? "NOK",
    purchaseValue: p.purchaseValue ?? 0,
    purchaseCcy: p.purchaseCcy ?? p.priceCcy ?? "NOK",
    result: p.result ?? 0,
    resultCcy: p.resultCcy ?? "NOK",
    fileQty: p.fileQty ?? null,
    fileSaldo: p.fileSaldo ?? null,
    fxRate: p.fxRate ?? 0,
    text: p.text ?? "",
    cancelDate: p.cancelDate ?? "",
    cancelled: p.cancelled ?? false,
    noteNumber: p.noteNumber ?? "",
    verification: p.verification ?? "",
    brokerage: p.brokerage ?? 0,
    valutakurs: p.valutakurs ?? p.fxRate ?? 0,
    sourceFile: p.sourceFile ?? "test",
    rowNumber: p.rowNumber ?? 1,
  };
}

function firstDiff(a: string[], b: string[]): string {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (a[i] !== b[i]) return `i=${i} a=${a[i] ?? "<missing>"} b=${b[i] ?? "<missing>"}`;
  }
  return "none";
}
