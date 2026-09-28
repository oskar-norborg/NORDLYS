import { i as __toESM } from "../_runtime.mjs";
import { B as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { $t as matMul, B as resolveBenchmarkSeries, Ct as MODEL_PORTFOLIOS, D as winAnsiToUnicode, E as unmappedWinAnsiChars, Et as N_PATHS_PREVIEW, F as expectedTransactions, Ft as decodeText, Gt as importNordnetBuffer, Ht as encodeUtf16Le, I as historicalRiskAvailable, It as defaultCma, Jt as inferTicker, Kt as importNordnetRows, L as holdingsWithoutImportedHistory, Lt as defaultCmaBooksKkt, M as buildDemoLedger, Mt as cholesky, N as buildSyntheticNordnet, Qt as looksLikeFund, T as textWidth, Tt as N_PATHS, V as sniffPriceMap, Vt as emptyLedgerBundle, Wt as identity, Xt as isPositiveDefinite, Yt as inspectNordnetFormat, Zt as ledoitWolfCovariance, _ as fanOps, _t as ASSET_LABELS, a as runMonteCarlo, an as parseNumber, at as createRng, b as pdfString, c as C, cn as sanitizeSecurities, dn as withUserPatch, en as maxAbsDiff, et as xirr, ft as portfolioMoments, gt as ASSET_IDS, h as effectivePortfolio, i as buildProposalPdf, in as parseNordnetBytes, it as cn, j as benchmarkSeries, k as DEMO_AS_OF, l as PAGE_H, lt as formatPct, m as buildSimInput, on as parseTable, p as barPairOps, pt as relativeError, qt as inferExchange, r as buildPortfolioReportPdf, rn as parseDate, rt as computeHoldings, st as formatMoney, tn as mergeFxFromRows, u as PdfDoc, un as transpose, ut as futureValue, v as finalRiskProfile, w as sanitizePdfText, wt as NORDNET_HEADERS_NB, x as pieWithLegend, xt as DEMO_CLIENTS, y as lineOps, z as parsePriceCsv, zt as defaultWhatIf } from "./router-DE00T9yP.mjs";
import { S as tradingDays, _ as runSweep, a as buildDemoAssetSeries, c as compile, g as runBacktest, h as rsiWilder, i as ZERO_COST_CONFIG, l as demoCalendar, m as resolveBacktestData, n as DEFAULT_STRATEGY, o as buildDemoFx, v as seriesFromCloses, w as tryCompile } from "./sweep-DdRBD4po.mjs";
import { a as impliedVol, i as bsmPrice, o as mcOptionPrice, r as bsmGreeks, t as binomialPrice } from "./options-B9z_Ouho.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/diagnostics-BNEd9lsH.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cmpNum(a, b, eps = 1e-9) {
	return Math.abs(a - b) <= eps;
}
function canonTx(t) {
	return [
		t.nordnetId,
		t.kind,
		t.rawType,
		t.isin,
		t.qty.toFixed(4),
		t.price.toFixed(6),
		t.amount.toFixed(2),
		t.tradeDate
	].join("|");
}
function runLedgerDiagnostics() {
	const tests = [];
	for (const [raw, exp] of [
		["1 234,56", 1234.56],
		["1\xA0234,56", 1234.56],
		["1.234,56", 1234.56],
		["$1,234.56", 1234.56],
		["(1,234.56)", -1234.56],
		["1234,56-", -1234.56]
	]) {
		const got = parseNumber(raw);
		tests.push({
			id: `2a.${JSON.stringify(raw)}`,
			group: "2a. Number parsing",
			name: `parseNumber(${JSON.stringify(raw)})`,
			pass: got != null && cmpNum(got, exp, 1e-9),
			expected: String(exp),
			actual: got == null ? "null" : String(got)
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
		actual: encMatch ? `${bKeys.length} match` : `utf16=${aKeys.length} utf8=${bKeys.length} firstDiff=${firstDiff(aKeys, bKeys)}`
	});
	const expected = expectedTransactions(syn.rowsAsc);
	const gotTx = fromUtf16.ledger.transactions;
	const expKeys = expected.map(canonTx).sort();
	const gotKeys = gotTx.map(canonTx).sort();
	const rtMatch = expKeys.length === gotKeys.length && expKeys.every((k, i) => k === gotKeys[i]);
	const hExp = computeHoldings({
		...fromUtf16.ledger,
		transactions: expected
	}, "fifo", DEMO_AS_OF);
	const hGot = computeHoldings(fromUtf16.ledger, "fifo", DEMO_AS_OF);
	const holdMatch = cmpNum(hExp.cash, hGot.cash, .02) && hExp.holdings.length === hGot.holdings.length && hExp.holdings.every((h, i) => {
		const g = hGot.holdings[i];
		return h.isin === g.isin && cmpNum(h.qty, g.qty, 1e-4);
	});
	tests.push({
		id: "2c.roundtrip",
		group: "2c. Round trip",
		name: "Synthetic ledger → Nordnet file → import is identical (txs + holdings)",
		pass: rtMatch && holdMatch,
		expected: `${expected.length} txs, cash ${hExp.cash.toFixed(2)}, ${hExp.holdings.length} holdings`,
		actual: rtMatch && holdMatch ? "identical" : `txs ${rtMatch ? "ok" : firstDiff(expKeys, gotKeys)}; holdings ${holdMatch ? "ok" : `cash ${hGot.cash.toFixed(2)} n=${hGot.holdings.length}`}`
	});
	const twice = importNordnetBuffer(syn.bytes, "nordnet-utf16.txt", fromUtf16.ledger, {});
	tests.push({
		id: "2d.dedup",
		group: "2d. Dedup",
		name: "Importing the same file twice leaves the ledger unchanged",
		pass: twice.report.duplicatesSkipped === fromUtf16.report.transactionsCreated && twice.report.transactionsCreated === 0 && twice.ledger.transactions.length === fromUtf16.ledger.transactions.length,
		expected: `0 created, ${fromUtf16.report.transactionsCreated} duplicates, ${fromUtf16.ledger.transactions.length} txs`,
		actual: `${twice.report.transactionsCreated} created, ${twice.report.duplicatesSkipped} duplicates, ${twice.ledger.transactions.length} txs`
	});
	const known = xirr([{
		date: "2019-01-01",
		amount: -1e3
	}, {
		date: "2020-01-01",
		amount: 1080
	}], .05);
	const xirrErr = Math.abs(known - .08);
	tests.push({
		id: "2e.xirr",
		group: "2e. XIRR",
		name: "XIRR on cash flows with a known 8% rate matches within 1e-8",
		pass: xirrErr < 1e-8,
		expected: "0.08 ± 1e-8",
		actual: `${known}  (err ${xirrErr.toExponential(3)})`
	});
	const tStart = "2015-06-15";
	const tEnd = "2018-06-15";
	const tYears = (Date.parse(tEnd + "T00:00:00Z") - Date.parse(tStart + "T00:00:00Z")) / 31536e6;
	const known2 = xirr([{
		date: tStart,
		amount: -5e3
	}, {
		date: tEnd,
		amount: 5e3 * Math.pow(1.065, tYears)
	}], .06);
	const err2 = Math.abs(known2 - .065);
	tests.push({
		id: "2e.xirr.multi",
		group: "2e. XIRR",
		name: "XIRR on a 3-year 6.5% growth matches within 1e-8 relative",
		pass: err2 < 1e-8,
		expected: "0.065 ± 1e-8 rel",
		actual: `${known2}  (rel ${err2.toExponential(3)})`
	});
	const fmt = inspectNordnetFormat(syn.bytes);
	const bomOk = fmt.bomUtf16Le;
	const tabOk = fmt.tabDelimited && fmt.columnCount === 30;
	const crlfOk = fmt.crlf;
	const valutaOk = fmt.valutaColumns.length === 5 && fmt.valutaColumns[0] === 12 && fmt.valutaColumns[1] === 14 && fmt.valutaColumns[2] === 16 && fmt.valutaColumns[3] === 18 && fmt.valutaColumns[4] === 27;
	tests.push({
		id: "2f.format",
		group: "2f. Demo Nordnet format",
		name: "UTF-16 LE BOM, tabs, CRLF, 30 columns, Valuta at 12/14/16/18/27, Norwegian headers",
		pass: bomOk && tabOk && crlfOk && valutaOk && fmt.headersMatch,
		expected: "FF FE, tab, CRLF, 30 cols, 5× Valuta, NB headers",
		actual: `BOM=${bomOk} tab=${tabOk} crlf=${crlfOk} cols=${fmt.columnCount} valuta=[${fmt.valutaColumns.join(",")}] headers=${fmt.headersMatch}`
	});
	const recon = fromUtf16.report.recon;
	tests.push({
		id: "2f.saldo",
		group: "2f. Demo Nordnet format",
		name: "Saldo chain of the synthetic export reconciles with zero mismatches",
		pass: recon.saldoErrors === 0,
		expected: "0 saldo errors",
		actual: `${recon.saldoErrors} errors / ${recon.issues.filter((i) => i.field === "saldo").length} issues (opening ${recon.openingSaldo})`
	});
	tests.push({
		id: "2f.qty",
		group: "2f. Demo Nordnet format",
		name: "Totalt antall: 0 errors, exactly 1 rounding note; dividend/tax Totalt antall=0 is ignored",
		pass: recon.qtyErrors === 0 && recon.saldoErrors === 0 && recon.qtyRounding === 1,
		expected: "0 saldo errors, 0 qty errors, 1 rounding note",
		actual: `${recon.saldoErrors} saldo, ${recon.qtyErrors} qty, ${recon.qtyRounding} rounding`
	});
	const decoded = decodeText(syn.bytes);
	tests.push({
		id: "2f.enc",
		group: "2f. Demo Nordnet format",
		name: "Decoder reports utf-16le for the demo export",
		pass: decoded.encoding === "utf-16le",
		expected: "utf-16le",
		actual: decoded.encoding
	});
	const cancelled = fromUtf16.report.cancelled;
	const cancelRow = parseNordnetBytes(syn.bytes).rows.find((r) => r.cancelDate);
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
		actual: `report ${cancelled.length}, inLedger=${!notInLedger}, holdingQty=${holding?.qty ?? 0}`
	});
	const enc = (s) => new TextEncoder().encode(s);
	const navQuotes = parsePriceCsv(enc("Date,NAV\n2020-01-02,123.45\n2020-01-03,124.1\n2020-06-15,130.00\n"), "NO0000000001");
	tests.push({
		id: "2h.nav.header",
		group: "2h. Mutual-fund NAV import",
		name: "Date + NAV file (no OHLC) parses three points",
		pass: navQuotes.length === 3 && cmpNum(navQuotes[0].close, 123.45) && navQuotes[2].date === "2020-06-15",
		expected: "3 quotes, first 123.45 on 2020-01-02",
		actual: `${navQuotes.length} quotes first=${navQuotes[0]?.date}:${navQuotes[0]?.close}`
	});
	const headerless = parsePriceCsv(enc("2021-03-01,98.5\n2021-03-02,99.25\n"), "IE00B4L5Y983");
	tests.push({
		id: "2h.nav.headerless",
		group: "2h. Mutual-fund NAV import",
		name: "Headerless date,NAV rows are treated as data (first row not dropped as a header)",
		pass: headerless.length === 2 && cmpNum(headerless[0].close, 98.5) && headerless[0].date === "2021-03-01",
		expected: "2 quotes, first 98.5 on 2021-03-01",
		actual: `${headerless.length} quotes first=${headerless[0]?.date}:${headerless[0]?.close}`
	});
	const euroNav = parsePriceCsv(enc("Dato;Andelsverdi\n02.01.2020;1.234,56\n03.01.2020;1.240,00\n"), "NO0010582984");
	tests.push({
		id: "2h.nav.european",
		group: "2h. Mutual-fund NAV import",
		name: "European Date;Andelsverdi (decimal comma, no OHLC) maps NAV to close",
		pass: euroNav.length === 2 && cmpNum(euroNav[0].close, 1234.56) && euroNav[0].date === "2020-01-02",
		expected: "2 quotes, 1234.56 on 2020-01-02",
		actual: `${euroNav.length} quotes first=${euroNav[0]?.date}:${euroNav[0]?.close}`
	});
	const yahoo = parsePriceCsv(enc("Date,Open,High,Low,Close,Adj Close,Volume\n2020-01-02,10,11,9,10.5,10.25,1000\n"), "US0378331005");
	const yahooMap = sniffPriceMap([
		"Date",
		"Open",
		"High",
		"Low",
		"Close",
		"Adj Close",
		"Volume"
	]);
	tests.push({
		id: "2h.yahoo.adj",
		group: "2h. Mutual-fund NAV import",
		name: "Yahoo OHLC still prefers Adj Close over Close and over NAV",
		pass: yahooMap.price === 5 && yahoo.length === 1 && cmpNum(yahoo[0].close, 10.25),
		expected: "col 5 = Adj Close, value 10.25",
		actual: `col=${yahooMap.price} n=${yahoo.length} close=${yahoo[0]?.close}`
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
		priceCcy: "USD"
	});
	const noMkt = {
		...emptyLedgerBundle(),
		transactions: [buy],
		securities: [{
			isin: usdIsin,
			ticker: "AAPL",
			name: "Apple Inc",
			currency: "USD",
			exchange: "NASDAQ",
			assetClass: "us_eq"
		}]
	};
	const apple = computeHoldings(noMkt, "fifo", "2026-09-01").holdings.find((h) => h.isin === usdIsin);
	tests.push({
		id: "2i.price.stale",
		group: "2i. Stale marks",
		name: "Holding without imported prices is valued at last trade and marked priceStale",
		pass: !!apple && apple.priceStale && cmpNum(apple.price, 150, 1e-9) && apple.priceSource === "last_trade",
		expected: "price=150 last_trade, priceStale=true",
		actual: apple ? `price=${apple.price} source=${apple.priceSource} stale=${apple.priceStale}` : "holding missing"
	});
	tests.push({
		id: "2i.fx.stale",
		group: "2i. Stale marks",
		name: "USD position without imported FX is marked fxStale",
		pass: !!apple && apple.fxStale && apple.security.currency === "USD",
		expected: "fxStale=true",
		actual: apple ? `fx=${apple.fx} fxStale=${apple.fxStale}` : "holding missing"
	});
	const withPx = {
		...noMkt,
		prices: [{
			isin: usdIsin,
			date: "2026-09-01",
			close: 180,
			source: "import"
		}],
		fx: [{
			pair: "USDNOK",
			date: "2026-09-01",
			rate: 10.5,
			source: "import",
			stale: false
		}]
	};
	const fresh = computeHoldings(withPx, "fifo", "2026-09-01").holdings.find((h) => h.isin === usdIsin);
	tests.push({
		id: "2i.imported.fresh",
		group: "2i. Stale marks",
		name: "Imported price and FX clear both stale flags and revalue the holding",
		pass: !!fresh && !fresh.priceStale && !fresh.fxStale && cmpNum(fresh.price, 180) && cmpNum(fresh.fx, 10.5),
		expected: "price=180 fx=10.5, both stale=false",
		actual: fresh ? `price=${fresh.price} fx=${fresh.fx} priceStale=${fresh.priceStale} fxStale=${fresh.fxStale}` : "holding missing"
	});
	const nordnetFxOnly = {
		...noMkt,
		fx: [{
			pair: "USDNOK",
			date: "2024-01-15",
			rate: 11,
			source: "nordnet",
			stale: true
		}]
	};
	const nnFx = computeHoldings(nordnetFxOnly, "fifo", "2026-09-01").holdings.find((h) => h.isin === usdIsin);
	tests.push({
		id: "2i.fx.nordnet.stale",
		group: "2i. Stale marks",
		name: "Nordnet trade FX is used for valuation but still marked stale until an FX file is imported",
		pass: !!nnFx && nnFx.fxStale && cmpNum(nnFx.fx, 11),
		expected: "fx=11, fxStale=true",
		actual: nnFx ? `fx=${nnFx.fx} fxStale=${nnFx.fxStale}` : "holding missing"
	});
	const empty = emptyLedgerBundle();
	const mydataDates = [
		"2021-01-01",
		"2022-01-01",
		"2023-01-01",
		"2024-01-01"
	];
	const mydataSeries = resolveBenchmarkSeries(empty, "world", "mydata", mydataDates);
	const generated = benchmarkSeries("world", mydataDates);
	tests.push({
		id: "2j.bench.hidden",
		group: "2j. My Data benchmarks",
		name: "My Data with no imported benchmark quotes returns an empty series (never generated)",
		pass: mydataSeries.length === 0 && generated.length === mydataDates.length,
		expected: "0 stored points; generator would have produced " + generated.length,
		actual: `resolve=${mydataSeries.length} generator=${generated.length}`
	});
	const importedBench = {
		...empty,
		benchmarks: [{
			id: "world",
			date: "2021-01-01",
			value: 100,
			source: "import"
		}, {
			id: "world",
			date: "2024-01-01",
			value: 140,
			source: "import"
		}]
	};
	const shown = resolveBenchmarkSeries(importedBench, "world", "mydata", mydataDates);
	tests.push({
		id: "2j.bench.imported",
		group: "2j. My Data benchmarks",
		name: "Imported benchmark quotes are returned as-is in My Data",
		pass: shown.length === 2 && cmpNum(shown[1].value, 140) && shown[0].date === "2021-01-01",
		expected: "2 imported points, last 140",
		actual: `${shown.length} last=${shown[shown.length - 1]?.value}`
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
		actual: `${divRows.length} rows, allZero=${divTotaltZero}`
	});
	const usNames = [
		{
			name: "Microsoft",
			isin: "US5949181045",
			tickerGuess: "1045"
		},
		{
			name: "Rocket Lab",
			isin: "US77313F1060",
			tickerGuess: "1060"
		},
		{
			name: "Copa Holdings",
			isin: "PAP162399074",
			tickerGuess: "9074"
		}
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
		actual: usNames.map((n) => {
			const s = usImp.ledger.securities.find((x) => x.isin === n.isin);
			return `${n.name}=${s ? `${s.currency}/${s.ticker || "∅"}` : "missing"}`;
		}).join("; ")
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
		actual: `tickerBlank=${noIsinTicker} fundEx=${fundEx} eqEx=${eqEx}`
	});
	const classSuggested = usImp.ledger.securities.every((s) => !s.assetClassConfirmed);
	tests.push({
		id: "2l.class.suggested",
		group: "2l. Security currency",
		name: "Auto asset class is suggested, not confirmed, until the user edits it",
		pass: classSuggested && usImp.ledger.securities.length === 3,
		expected: "assetClassConfirmed=false on all 3",
		actual: usImp.ledger.securities.map((s) => `${s.name}:${s.assetClassConfirmed ? "confirmed" : "suggested"}`).join(", ")
	});
	const edited = {
		...usImp.ledger,
		securities: usImp.ledger.securities.map((s) => s.isin === "US5949181045" ? withUserPatch(s, {
			ticker: "MSFT",
			assetClass: s.assetClass,
			assetClassConfirmed: true
		}) : s)
	};
	const reimp = importNordnetBuffer(usFile, "us.txt", edited, {});
	const msft = reimp.ledger.securities.find((s) => s.isin === "US5949181045");
	tests.push({
		id: "2m.edits.survive",
		group: "2m. Security master",
		name: "Ticker and confirmed class survive re-importing the same file",
		pass: !!msft && msft.ticker === "MSFT" && msft.assetClassConfirmed === true && reimp.report.transactionsCreated === 0,
		expected: "MSFT still MSFT, class confirmed, 0 created",
		actual: msft ? `ticker=${msft.ticker} confirmed=${msft.assetClassConfirmed} created=${reimp.report.transactionsCreated}` : "missing"
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
		actual: `${fxRows.length} trades, ${fxDates.size} dates, ${fxQuotes.length} quotes`
	});
	const bareFx = bareFxSampleFile();
	const bareQuotes = importNordnetBuffer(bareFx, "fx.txt", emptyLedgerBundle(), {}).ledger.fx.filter((q) => q.pair === "USDNOK");
	const bareDates = new Set(bareQuotes.map((q) => q.date));
	tests.push({
		id: "2n.fx.no-valuta",
		group: "2n. FX quotes from trades",
		name: "VALUTAVEKSLING without a non-NOK valuta column still yields one quote per date (not dropped)",
		pass: bareDates.size === 5 && bareQuotes.length === 5,
		expected: "5 USDNOK quotes from 8 FX trades / 5 dates with empty Verdipapir and NOK amount",
		actual: `${bareQuotes.length} quotes, ${bareDates.size} dates`
	});
	const dirty = sanitizeSecurities([
		{
			isin: "US5949181045",
			ticker: "1045",
			name: "Microsoft",
			currency: "USD",
			exchange: "US",
			assetClass: "us_eq"
		},
		{
			isin: "US7731211089",
			ticker: "1089",
			name: "Rocket Lab",
			currency: "USD",
			exchange: "US",
			assetClass: "us_eq"
		},
		{
			isin: "NO0000002405",
			ticker: "2405",
			name: "Some Nordnet name",
			currency: "NOK",
			exchange: "OSE",
			assetClass: "nordic_eq"
		},
		{
			isin: "NO0000006151",
			ticker: "6151",
			name: "Other",
			currency: "NOK",
			exchange: "OSE",
			assetClass: "nordic_eq"
		},
		{
			isin: "NO0000001054",
			ticker: "1054",
			name: "Third",
			currency: "NOK",
			exchange: "OSE",
			assetClass: "nordic_eq"
		},
		{
			isin: "NO0010000001",
			ticker: "KLP",
			name: "KLP Likviditet",
			currency: "NOK",
			exchange: "OSE",
			assetClass: "cash"
		},
		withUserPatch({
			isin: "US0378331005",
			ticker: "AAPL",
			name: "Apple Inc",
			currency: "USD",
			exchange: "NASDAQ",
			assetClass: "us_eq"
		}, {
			ticker: "AAPL",
			exchange: "NASDAQ"
		})
	]);
	const klp = dirty.find((s) => s.name === "KLP Likviditet");
	const msftDirty = dirty.find((s) => s.isin === "US5949181045");
	const appleKept = dirty.find((s) => s.isin === "US0378331005");
	const allCleared = [
		msftDirty,
		dirty.find((s) => s.ticker === "1089"),
		dirty.find((s) => s.isin === "NO0000002405")
	].every((s) => !s || s.ticker === "");
	tests.push({
		id: "2o.sanitize.tickers",
		group: "2o. Generated ticker cleanup",
		name: "Load-time cleanup blanks ISIN-tail / name-prefix tickers (1045, 1089, 2405, 6151, 1054, KLP) and keeps user-entered AAPL",
		pass: allCleared && dirty.filter((s) => s.isin !== "US0378331005").every((s) => s.ticker === "") && appleKept?.ticker === "AAPL" && appleKept?.userSet?.ticker === true,
		expected: "generated blank, AAPL kept",
		actual: dirty.map((s) => `${s.name}:${s.ticker || "∅"}`).join("; ")
	});
	tests.push({
		id: "2o.sanitize.klp",
		group: "2o. Generated ticker cleanup",
		name: "KLP Likviditet exchange becomes Fund (not OSE); ticker blank; looksLikeFund",
		pass: !!klp && klp.ticker === "" && klp.exchange === "Fund" && looksLikeFund("KLP Likviditet"),
		expected: "ticker ∅, exchange Fund",
		actual: klp ? `ticker=${klp.ticker || "∅"} ex=${klp.exchange}` : "missing"
	});
	const staleSecs = [{
		isin: "US5949181045",
		ticker: "1045",
		name: "Microsoft",
		currency: "USD",
		exchange: "US",
		assetClass: "us_eq"
	}];
	const after = importNordnetBuffer(usFile, "us.txt", {
		...emptyLedgerBundle(),
		securities: staleSecs
	}, {}).ledger.securities.find((s) => s.isin === "US5949181045");
	tests.push({
		id: "2o.upsert.drops.generated",
		group: "2o. Generated ticker cleanup",
		name: "Re-import does not keep a previous auto-generated ticker (1045)",
		pass: !!after && after.ticker === "",
		expected: "ticker blank after re-import",
		actual: after ? `ticker=${after.ticker || "∅"}` : "missing"
	});
	const usdSettled = usdBuysSellsSettledInNokFile();
	const usdImp = importNordnetBuffer(usdSettled, "usd-settled-nok.txt", emptyLedgerBundle(), {});
	const usdHold = computeHoldings(usdImp.ledger, "fifo", "2026-09-01");
	const usdFxTx = usdImp.ledger.transactions.filter((t) => t.kind === "currency_exchange");
	const usdAmountCcy = new Set(usdImp.ledger.transactions.map((t) => t.amountCcy));
	const expectedCash = usdImp.ledger.transactions.filter((t) => t.kind === "buy" || t.kind === "sell" || t.kind === "deposit").reduce((s, t) => s + t.amount, 0);
	tests.push({
		id: "2p.usd.settled.nok",
		group: "2p. USD trades settled in NOK",
		name: "USD stock buys and sells settled in NOK produce no USD cash and no separate FX transactions",
		pass: usdFxTx.length === 0 && usdAmountCcy.size === 1 && usdAmountCcy.has("NOK") && Math.abs(usdHold.cash - expectedCash) < .02 && Math.abs(usdHold.cash - 2220) > 1 && usdHold.holdings.every((h) => h.security.currency === "USD"),
		expected: "NOK cash only, 0 currency_exchange, cash != USD notional",
		actual: `cash=${usdHold.cash} expected=${expectedCash} fxTx=${usdFxTx.length} amountCcy=[${[...usdAmountCcy].join(",")}] qty=${usdHold.holdings[0]?.qty ?? 0}`
	});
	return tests;
}
function usdBuysSellsSettledInNokFile() {
	const lines = [NORDNET_HEADERS_NB.join("	")];
	const blank = () => Array.from({ length: 30 }, () => "");
	const row = (id, date, type, name, isin, qty, price, amount, purchase, purchaseCcy, fx, saldo) => {
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
		return c.join("	");
	};
	lines.push(row(3, "2024-03-10", "SALG", "Apple Inc", "US0378331005", "4", "180,00", "7920,00", "", "", "11,000000", "10000,00"));
	lines.push(row(2, "2024-01-15", "KJØPT", "Apple Inc", "US0378331005", "10", "150,00", "-16500,00", "1500,00", "USD", "11,000000", "2080,00"));
	lines.push(row(1, "2024-01-02", "INNSKUDD", "", "", "", "", "18580,00", "", "", "", "18580,00"));
	return encodeUtf16Le(lines.join("\r\n") + "\r\n", true);
}
function usStockSampleFile() {
	const header = NORDNET_HEADERS_NB.join("	");
	const names = [
		[
			"Microsoft",
			"US5949181045",
			"USD"
		],
		[
			"Rocket Lab",
			"US77313F1060",
			"USD"
		],
		[
			"Copa Holdings",
			"PAP162399074",
			"USD"
		]
	];
	const lines = [header];
	let id = 10;
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
		div[20] = "12,00";
		lines.push(div.join("	"));
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
		lines.push(buy.join("	"));
	}
	const text = lines.join("\r\n") + "\r\n";
	return encodeUtf16Le(text, true);
}
function blankCells() {
	return Array.from({ length: 30 }, () => "");
}
function bareFxSampleFile() {
	const header = NORDNET_HEADERS_NB.join("	");
	const days = [
		["2022-04-01", 1500],
		["2022-04-01", 500],
		["2023-01-10", 800],
		["2023-06-20", 1200],
		["2023-06-20", 400],
		["2024-02-15", 900],
		["2025-03-03", 600],
		["2025-03-03", 300]
	];
	const lines = [header];
	let id = 0;
	let saldo = 1e5;
	for (const [date, usd] of days) {
		id += 1;
		const amount = -(usd * 10.5);
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
		lines.push(row.join("	"));
	}
	return encodeUtf16Le(lines.join("\r\n") + "\r\n", true);
}
function stubTx(p) {
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
		rowNumber: p.rowNumber ?? 1
	};
}
function firstDiff(a, b) {
	const n = Math.max(a.length, b.length);
	for (let i = 0; i < n; i++) if (a[i] !== b[i]) return `i=${i} a=${a[i] ?? "<missing>"} b=${b[i] ?? "<missing>"}`;
	return "none";
}
function runStage3Diagnostics() {
	const tests = [];
	const spot = {
		S: 100,
		K: 100,
		r: .05,
		vol: .2,
		T: 1,
		q: 0
	};
	const call = bsmPrice({
		...spot,
		type: "call"
	});
	const put = bsmPrice({
		...spot,
		type: "put"
	});
	tests.push({
		id: "3a.call",
		group: "3a. Black–Scholes–Merton",
		name: "ATM call S=K=100, r=5%, σ=20%, T=1, q=0 equals 10.4506",
		pass: Math.abs(call - 10.4506) < 1e-4,
		expected: "10.4506 ± 1e-4",
		actual: call.toFixed(8)
	});
	tests.push({
		id: "3a.put",
		group: "3a. Black–Scholes–Merton",
		name: "ATM put under the same inputs equals 5.5735",
		pass: Math.abs(put - 5.5735) < 1e-4,
		expected: "5.5735 ± 1e-4",
		actual: put.toFixed(8)
	});
	const strikes = [
		80,
		90,
		100,
		110,
		120
	];
	const mats = [
		.25,
		.5,
		1,
		2
	];
	let ivFail = 0;
	let ivMax = 0;
	let ivN = 0;
	for (const K of strikes) for (const T of mats) {
		const vol = .2;
		const price = bsmPrice({
			S: 100,
			K,
			r: .05,
			vol,
			T,
			q: 0,
			type: "call"
		});
		const iv = impliedVol({
			S: 100,
			K,
			r: .05,
			T,
			q: 0,
			type: "call"
		}, price, .3);
		ivN += 1;
		if (!iv.ok) {
			ivFail += 1;
			continue;
		}
		const err = Math.abs(iv.vol - vol);
		ivMax = Math.max(ivMax, err);
		if (err > 1e-6) ivFail += 1;
	}
	tests.push({
		id: "3b.iv",
		group: "3b. Implied volatility",
		name: "Newton/bisection recovers σ=0.20 on a 5×4 strike–maturity grid within 1e-6",
		pass: ivFail === 0,
		expected: `${ivN} points, |Δσ| < 1e-6`,
		actual: `fail ${ivFail}/${ivN}, max |Δσ|=${ivMax.toExponential(3)}`
	});
	const g = bsmGreeks({
		...spot,
		type: "call"
	});
	const bump = (key, h) => {
		return (bsmPrice({
			...spot,
			type: "call",
			[key]: spot[key] + h
		}) - bsmPrice({
			...spot,
			type: "call",
			[key]: spot[key] - h
		})) / (2 * h);
	};
	const fdDelta = bump("S", .001);
	const fdVega = bump("vol", 1e-5);
	const fdRho = bump("r", 1e-6);
	const fdTheta = -bump("T", 1e-5);
	const hS = .01;
	const fdGamma = (bsmPrice({
		...spot,
		type: "call",
		S: spot.S + hS
	}) - 2 * bsmPrice({
		...spot,
		type: "call"
	}) + bsmPrice({
		...spot,
		type: "call",
		S: spot.S - hS
	})) / (hS * hS);
	const greeks = [
		[
			"delta",
			g.delta,
			fdDelta
		],
		[
			"gamma",
			g.gamma,
			fdGamma
		],
		[
			"vega",
			g.vega,
			fdVega
		],
		[
			"theta",
			g.theta,
			fdTheta
		],
		[
			"rho",
			g.rho,
			fdRho
		]
	];
	for (const [name, analytic, fd] of greeks) {
		const rel = relativeError(analytic, fd);
		tests.push({
			id: `3c.${name}`,
			group: "3c. Analytic Greeks vs finite differences",
			name: `${name} matches a central difference within 1e-4 relative`,
			pass: rel < 1e-4,
			expected: `rel < 1e-4  (fd=${fd.toPrecision(8)})`,
			actual: `analytic=${analytic.toPrecision(8)}  rel=${rel.toExponential(3)}`
		});
	}
	const amerPut = binomialPrice({
		...spot,
		type: "put"
	}, 200, "american");
	tests.push({
		id: "3d.put",
		group: "3d. American vs European",
		name: "American put (CRR 200) is at least the European put on the same tree",
		pass: amerPut.price + 1e-12 >= amerPut.european,
		expected: "American ≥ European",
		actual: `AM ${amerPut.price.toFixed(6)}  EU ${amerPut.european.toFixed(6)}`
	});
	const amerCall = binomialPrice({
		...spot,
		type: "call"
	}, 250, "american");
	const euroCall = bsmPrice({
		...spot,
		type: "call"
	});
	const callGap = Math.abs(amerCall.price - euroCall);
	tests.push({
		id: "3d.call",
		group: "3d. American vs European",
		name: "American call with q=0 converges to the European BSM price (never exercise)",
		pass: callGap < .02 && amerCall.price + 1e-10 >= amerCall.european - 1e-10,
		expected: "|AM − BSM| < 0.02 and AM ≥ tree-EU",
		actual: `AM ${amerCall.price.toFixed(6)}  BSM ${euroCall.toFixed(6)}  Δ=${callGap.toExponential(3)}`
	});
	const mc = mcOptionPrice({
		...spot,
		type: "call"
	}, 2e4, 20260321);
	const seOk = Math.abs(mc.priceCv - euroCall) < 3 * Math.max(mc.seCv, 1e-12);
	const cut = mc.seCv <= .5 * mc.se + 1e-15;
	tests.push({
		id: "3e.mc",
		group: "3e. Monte Carlo option",
		name: "Antithetic+CV price is within 3 SE of BSM",
		pass: seOk,
		expected: `|Δ| < 3·SE  (BSM ${euroCall.toFixed(4)})`,
		actual: `CV ${mc.priceCv.toFixed(4)}  SE ${mc.seCv.toExponential(3)}  Δ=${(mc.priceCv - euroCall).toFixed(4)}`
	});
	tests.push({
		id: "3e.cv",
		group: "3e. Monte Carlo option",
		name: "Control variate (discounted S_T) cuts standard error by at least 50%",
		pass: cut,
		expected: "SE_cv ≤ 0.5 · SE_antithetic",
		actual: `SE ${mc.se.toExponential(3)} → ${mc.seCv.toExponential(3)}  (${(100 * mc.seReduction).toFixed(1)}% cut)`
	});
	const kktPack = defaultCmaBooksKkt();
	tests.push({
		id: "3f.sum",
		group: "3f. Optimizer KKT",
		name: "Min-variance weights sum to 1",
		pass: Math.abs(kktPack.sumW - 1) < 1e-10,
		expected: "1 ± 1e-10",
		actual: kktPack.sumW.toFixed(12)
	});
	tests.push({
		id: "3f.cons",
		group: "3f. Optimizer KKT",
		name: "Long-only, per-asset caps and group caps all hold",
		pass: kktPack.constraintsOk,
		expected: "all w≥0, w≤cap, group sums ≤ cap",
		actual: kktPack.constraintMsg
	});
	tests.push({
		id: "3f.kkt",
		group: "3f. Optimizer KKT",
		name: "KKT residuals of the min-variance book below 1e-8",
		pass: kktPack.kkt.max < 1e-8,
		expected: "max residual < 1e-8",
		actual: `stat ${kktPack.kkt.stationarity.toExponential(3)}, prim ${kktPack.kkt.primalEq.toExponential(3)}, ineq ${kktPack.kkt.primalIneq.toExponential(3)}, comp ${kktPack.kkt.complementary.toExponential(3)}, dual ${kktPack.kkt.dual.toExponential(3)}`
	});
	const rng = createRng(99);
	const T = 80;
	const n = 6;
	const R = [];
	for (let t = 0; t < T; t++) {
		const row = [];
		for (let i = 0; i < n; i++) row.push(.01 * rng.gaussian());
		R.push(row);
	}
	const lw = ledoitWolfCovariance(R);
	tests.push({
		id: "3g.lw",
		group: "3g. Ledoit–Wolf",
		name: "Ledoit–Wolf covariance is positive definite",
		pass: lw.pd && isPositiveDefinite(lw.cov),
		expected: "Cholesky succeeds, δ in [0,1]",
		actual: `pd=${lw.pd} δ=${lw.delta.toFixed(4)}`
	});
	return tests;
}
/** Acrobat-strict structural validator for NORDLYS PDFs. */
function latin1Decode(bytes) {
	let s = "";
	for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
	return s;
}
function parseXrefEntries(raw, start, count) {
	const out = [];
	let p = 0;
	for (let i = 0; i < count; i++) {
		const line = raw.slice(p, p + 20);
		p += 20;
		if (line.length !== 20) throw new Error(`xref entry ${start + i} is ${line.length} bytes, need 20`);
		if (line[19] !== "\n") throw new Error(`xref entry ${start + i} does not end with LF`);
		const offset = Number(line.slice(0, 10));
		const gen = Number(line.slice(11, 16));
		const flag = line[17];
		if (line[10] !== " " || line[16] !== " " || line[18] !== " ") throw new Error(`xref entry ${start + i} spacing is not the 20-byte Acrobat form`);
		if (!Number.isFinite(offset) || !Number.isFinite(gen) || flag !== "n" && flag !== "f") throw new Error(`xref entry ${start + i} malformed: ${JSON.stringify(line)}`);
		out.push({
			offset,
			gen,
			used: flag === "n",
			raw: line
		});
	}
	return out;
}
function extractPdfString(src, from) {
	let i = from + 1;
	const bytes = [];
	while (i < src.length) {
		const ch = src.charCodeAt(i);
		if (ch === 41) return {
			text: winAnsiToUnicode(bytes),
			end: i + 1
		};
		if (ch === 92) {
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
				bytes.push(parseInt(oct[0], 8));
				i += 1 + oct[0].length;
				continue;
			}
			i += 2;
			continue;
		}
		bytes.push(ch);
		i += 1;
	}
	return {
		text: winAnsiToUnicode(bytes),
		end: src.length
	};
}
function extractPdfStrings(bytes) {
	const src = latin1Decode(bytes);
	const out = [];
	for (let i = 0; i < src.length; i++) if (src[i] === "(") {
		const { text, end } = extractPdfString(src, i);
		if (text.length) out.push(text);
		i = end - 1;
	}
	return out;
}
function joinedPdfText(bytes) {
	return extractPdfStrings(bytes).join(" ");
}
/** Tokenize a content stream, ignoring string and hex literals, for operator balance. */
function streamOperators(stream) {
	const ops = [];
	let i = 0;
	while (i < stream.length) {
		const ch = stream[i];
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
			ops.push(m[0]);
			i += m[0].length;
			continue;
		}
		const id = /^[A-Za-z*'"]+/.exec(stream.slice(i));
		if (id) {
			ops.push(id[0]);
			i += id[0].length;
			continue;
		}
		i += 1;
	}
	return ops;
}
function balance(ops, open, close) {
	let d = 0;
	for (const o of ops) {
		if (o === open) d += 1;
		if (o === close) d -= 1;
		if (d < 0) return `${close} before ${open}`;
	}
	if (d !== 0) return `${open}/${close} imbalance ${d}`;
	return null;
}
function failResult(errors, extra = {}) {
	return {
		objectCount: 0,
		xrefCount: 0,
		size: 0,
		startxref: -1,
		strings: [],
		info: {
			title: "",
			producer: "",
			creationDate: ""
		},
		pageStreams: [],
		...extra,
		ok: false,
		errors
	};
}
function validatePdf(bytes) {
	const errors = [];
	const src = latin1Decode(bytes);
	const emptyInfo = {
		title: "",
		producer: "",
		creationDate: ""
	};
	if (!src.startsWith("%PDF-1.")) errors.push("missing %PDF-1. header");
	const headerEnd = src.indexOf("\n");
	const binLine = src.slice(headerEnd + 1, src.indexOf("\n", headerEnd + 1) + 1);
	if (!binLine.startsWith("%") || ![...binLine].some((c) => c.charCodeAt(0) >= 128)) errors.push("missing binary comment line after header");
	if (!src.replace(/\s+$/, "").endsWith("%%EOF")) errors.push("file does not end with %%EOF");
	const eof = src.lastIndexOf("%%EOF");
	const sxKey = src.lastIndexOf("startxref", eof >= 0 ? eof : src.length);
	if (sxKey < 0) return failResult([...errors, "missing startxref"], { strings: extractPdfStrings(bytes) });
	const after = src.slice(sxKey + 9);
	const sm = /^\s*(\d+)/.exec(after);
	const startxref = sm ? Number(sm[1]) : -1;
	if (!(startxref >= 0)) errors.push("startxref is not a number");
	if (src.slice(startxref, startxref + 4) !== "xref") errors.push(`startxref ${startxref} does not point at 'xref' (got ${JSON.stringify(src.slice(startxref, startxref + 8))})`);
	const xrefBody = src.slice(startxref);
	const head = /^xref\s+(\d+)\s+(\d+)\s*\n/.exec(xrefBody);
	if (!head) {
		errors.push("cannot parse xref subsection header");
		return failResult(errors, {
			startxref,
			strings: extractPdfStrings(bytes)
		});
	}
	const xrStart = Number(head[1]);
	const xrCount = Number(head[2]);
	const entriesRaw = xrefBody.slice(head[0].length);
	let entries = [];
	try {
		entries = parseXrefEntries(entriesRaw, xrStart, xrCount);
	} catch (e) {
		errors.push(String(e));
	}
	if (entries[0] && entries[0].raw !== "0000000000 65535 f \n") errors.push(`first xref entry must be "0000000000 65535 f\\n", got ${JSON.stringify(entries[0].raw)}`);
	const trailerM = /trailer\s*<<([^>]*)>>/.exec(xrefBody);
	let size = xrCount;
	let root = "";
	let infoRef = "";
	if (trailerM) {
		const t = trailerM[1];
		const sz = /\/Size\s+(\d+)/.exec(t);
		if (sz) size = Number(sz[1]);
		const rt = /\/Root\s+(\d+)\s+0\s+R/.exec(t);
		if (rt) root = rt[1];
		else errors.push("trailer missing /Root");
		const inf = /\/Info\s+(\d+)\s+0\s+R/.exec(t);
		if (inf) infoRef = inf[1];
		else errors.push("trailer missing /Info");
	} else errors.push("missing trailer dictionary");
	const maxObj = xrStart + xrCount - 1;
	if (size !== maxObj + 1) errors.push(`trailer /Size ${size} != highest object ${maxObj} + 1`);
	if (size !== xrCount && xrStart === 0) errors.push(`trailer /Size ${size} != xref count ${xrCount}`);
	const seenIds = /* @__PURE__ */ new Set();
	const usedOffsets = /* @__PURE__ */ new Map();
	let used = 0;
	const bodies = /* @__PURE__ */ new Map();
	const streamById = /* @__PURE__ */ new Map();
	for (let i = 0; i < entries.length; i++) {
		const e = entries[i];
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
			const dataStart = e.offset + streamAt + sm2[0].length;
			const dataEnd = dataStart + declared;
			if (dataEnd > bytes.length) {
				errors.push(`object ${id} stream length ${declared} overruns file`);
				continue;
			}
			const afterData = src.slice(dataEnd, dataEnd + 12);
			if (!/^\r?\n?endstream/.test(afterData)) errors.push(`object ${id} stream length ${declared} does not land on endstream (got ${JSON.stringify(afterData)})`);
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
		let m;
		while (m = re.exec(body)) {
			const id = Number(m[1]);
			if (!seenIds.has(id) && id !== 0) errors.push(`dangling reference ${id} 0 R`);
		}
	}
	const info = { ...emptyInfo };
	if (infoRef) {
		const id = Number(infoRef);
		const body = bodies.get(id) ?? "";
		const titleOpen = /\/Title\s*\(/.exec(body);
		if (titleOpen) info.title = extractPdfString(body, body.indexOf("(", titleOpen.index)).text.trim();
		else errors.push("Info missing /Title");
		const prodOpen = /\/Producer\s*\(/.exec(body);
		if (!prodOpen) errors.push("Info missing /Producer");
		else info.producer = extractPdfString(body, body.indexOf("(", prodOpen.index)).text;
		const cd = /\/CreationDate\s*\(([^)]*)\)/.exec(body);
		if (!cd) errors.push("Info missing /CreationDate");
		else info.creationDate = cd[1];
	}
	if (root) {
		const rootId = Number(root);
		if (!seenIds.has(rootId)) errors.push(`/Root ${rootId} is not an in-use object`);
	}
	const pagesBody = [...bodies.values()].find((b) => /\/Type\s*\/Pages\b/.test(b)) ?? "";
	const kidsM = /\/Kids\s*\[([^\]]*)\]/.exec(pagesBody);
	const pageStreams = [];
	if (kidsM) for (const km of kidsM[1].matchAll(/(\d+)\s+0\s+R/g)) {
		const pageBody = bodies.get(Number(km[1])) ?? "";
		const c = /\/Contents\s+(\d+)\s+0\s+R/.exec(pageBody);
		pageStreams.push(c ? streamById.get(Number(c[1])) ?? "" : "");
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
		pageStreams
	};
}
function parsePlacedFromStream(stream, page) {
	const out = [];
	let x = 0;
	let y = 0;
	let size = 8;
	let font = "r";
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
					y: y - size * .22,
					w: Math.max(w, .5),
					h: size,
					text
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
function extractPlacedText(bytes, pageStreams) {
	const streams = pageStreams ?? validatePdf(bytes).pageStreams;
	const out = [];
	streams.forEach((stream, i) => out.push(...parsePlacedFromStream(stream, i + 1)));
	return out;
}
function placedLayoutErrors(items) {
	const out = [];
	for (const t of items) {
		if (t.x < -.2 || t.y < -.2 || t.x + t.w > 595.48 || t.y + t.h > 842.09) out.push(`off page p${t.page}: "${(t.text ?? "").slice(0, 32)}"`);
		const headerOrFooter = t.y + t.h > 801.89 || t.y < 40;
		const coverBand = t.y + t.h > PAGE_H - 180;
		if (!headerOrFooter && !coverBand) {
			if (t.x < 52.5) out.push(`left margin p${t.page}: "${t.text.slice(0, 32)}"`);
			if (t.x + t.w > 542.78) out.push(`right margin p${t.page}: "${t.text.slice(0, 32)}"`);
			if (t.y < 46) out.push(`below content margin p${t.page}: "${t.text.slice(0, 32)}"`);
		}
	}
	for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
		const a = items[i];
		const b = items[j];
		if (a.page !== b.page) continue;
		const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
		const iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
		if (ix > .55 && iy > .55) out.push(`text overlap p${a.page}: "${a.text.slice(0, 24)}" / "${b.text.slice(0, 24)}"`);
	}
	return out;
}
function pdfContainsPhrase(bytes, phrase) {
	const strings = extractPdfStrings(bytes);
	return strings.join(" ").includes(phrase) || strings.some((s) => s.includes(phrase));
}
function privacyLeaks(text) {
	const leaks = [];
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
function privacyScan(bytes, v) {
	const val = v ?? validatePdf(bytes);
	const found = [];
	const seen = /* @__PURE__ */ new Set();
	const add = (hits, where) => {
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
	for (let i = 0; i < val.strings.length; i++) add(privacyLeaks(val.strings[i]), `string "${val.strings[i].slice(0, 40)}"`);
	const placed = extractPlacedText(bytes, val.pageStreams);
	const lines = /* @__PURE__ */ new Map();
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
function forbiddenCertainty(text) {
	const hits = [];
	for (const p of [
		/\bwill reach\b/i,
		/\bguaranteed\b/i,
		/\bcertain to\b/i
	]) {
		const m = p.exec(text);
		if (m) hits.push(m[0]);
	}
	return hits;
}
/** Tiny PDF used by diagnostics for WinAnsi Nordic letters and euro. */
function buildNordicSamplePdf() {
	const doc = new PdfDoc({
		title: "NORDLYS encoding sample",
		headerLeft: "NORDLYS",
		headerRight: "Encoding",
		footerNote: "Ålesund, Tromsø, Bærum",
		privacy: false
	});
	doc.coverBand("Ålesund, Tromsø, Bærum", "Character encoding sample", "WinAnsi Helvetica", "CONFIDENTIAL");
	doc.heading("Nordic letters");
	doc.paragraph("The Norwegian municipalities Ålesund, Tromsø, Bærum use AE OE AA in upper and lower case: ÆØÅ æøå.", {
		size: 11,
		leading: 16
	});
	doc.paragraph("Ålesund, Tromsø, Bærum", {
		size: 14,
		leading: 20
	});
	doc.paragraph("Euro amount: € 1,234.56", {
		size: 12,
		leading: 16
	});
	doc.paragraph("Comparators: ≥ ≤ σ Δ √ ✓ ⁴ and minus −.", {
		size: 11,
		leading: 16
	});
	return doc.finish();
}
function t$1(id, group, name, pass, expected, actual) {
	return {
		id,
		group,
		name,
		pass,
		expected,
		actual
	};
}
function metaText(v) {
	return [
		joinedPdfTextFromStrings(v.strings),
		v.info.title,
		v.info.producer,
		v.info.creationDate
	].join("\n");
}
function joinedPdfTextFromStrings(strings) {
	return strings.join(" ");
}
function structureActual(v, bytes) {
	if (!v.ok) return v.errors.slice(0, 4).join(" · ");
	return `ok objects=${v.objectCount} xref=${v.xrefCount} bytes=${bytes.length} startxref=${v.startxref} info=${v.info.title ? "yes" : "no"}`;
}
function runPdfDiagnostics() {
	const tests = [];
	const cma = defaultCma();
	const asOf = "2026-09-10";
	const nordic = buildNordicSamplePdf();
	const nordicV = validatePdf(nordic);
	tests.push(t$1("4a.nordic-sample", "4a. Strict PDF structure", "Encoding sample: 20-byte xref, /Size, startxref at xref, %%EOF, binary comment, Info", nordicV.ok && nordic.length > 800 && nordic[0] === 37 && nordic[1] === 80 && !!nordicV.info.title && !!nordicV.info.producer && !!nordicV.info.creationDate, "valid PDF 1.4, xref 20-byte, Info Title/Producer/CreationDate", structureActual(nordicV, nordic)));
	const phrase = "Ålesund, Tromsø, Bærum";
	const nordicJoined = joinedPdfText(nordic);
	tests.push(t$1("4b.nordic", "4b. Character coverage", `PDF containing “${phrase}” encodes those characters correctly`, pdfContainsPhrase(nordic, phrase), phrase, pdfContainsPhrase(nordic, phrase) ? "decoded from WinAnsi strings" : "phrase not found"));
	const hasAE = pdfContainsPhrase(nordic, "ÆØÅ") && pdfContainsPhrase(nordic, "æøå");
	tests.push(t$1("4b.case", "4b. Character coverage", "Upper and lower ÆØÅ / æøå round-trip through WinAnsi Helvetica", hasAE, "ÆØÅ and æøå present", hasAE ? "both present" : "missing"));
	tests.push(t$1("4b.euro", "4b. Character coverage", "Euro sign € and the amount € 1,234.56 round-trip", pdfContainsPhrase(nordic, "€ 1,234.56") && pdfContainsPhrase(nordic, "€"), "€ 1,234.56", pdfContainsPhrase(nordic, "€ 1,234.56") ? "euro amount present" : nordicJoined.slice(0, 80)));
	const sanitized = sanitizePdfText("≥ ≤ σ Δ √ ✓ ⁴ −");
	tests.push(t$1("4b.replace", "4b. Character coverage", "≥ ≤ σ Δ √ ✓ ⁴ and U+2212 become WinAnsi words/signs (at least, at most, volatility, -)", sanitized.includes("at least") && sanitized.includes("at most") && sanitized.includes("volatility") && sanitized.includes("delta") && sanitized.includes("sqrt") && sanitized.includes("ok") && sanitized.includes("4") && sanitized.includes("-") && !sanitized.includes("≥") && !sanitized.includes("−") && !sanitized.includes("σ"), "at least / at most / volatility / delta / sqrt / ok / 4 / -", sanitized));
	tests.push(t$1("4b.replace.drawn", "4b. Character coverage", "Replaced glyphs are what the encoding sample actually draws", pdfContainsPhrase(nordic, "at least") && pdfContainsPhrase(nordic, "volatility") && pdfContainsPhrase(nordic, "at most"), "at least, at most, volatility in extracted text", `at least=${pdfContainsPhrase(nordic, "at least")} volatility=${pdfContainsPhrase(nordic, "volatility")}`));
	let threw = false;
	let throwMsg = "";
	try {
		pdfString("alpha α snowman ☃");
	} catch (e) {
		threw = true;
		throwMsg = e instanceof Error ? e.message : String(e);
	}
	tests.push(t$1("4b.throw", "4b. Character coverage", "Writer throws on an unmapped character instead of printing ? or a box", threw && /Unmapped character U\+03B1/i.test(throwMsg), "Error Unmapped character U+03B1", threw ? throwMsg : "no throw"));
	const edgeProfile = {
		...DEMO_CLIENTS[0],
		id: "edge-case",
		name: "Edge Case",
		currentAssets: 1e5,
		goals: [{
			id: "edge-g0",
			type: "legacy",
			name: "Unreachable",
			targetAmount: 0xe8d4a51000,
			year: 2028,
			priority: 1
		}]
	};
	const edgeCma = {
		...cma,
		vol: cma.vol.map(() => 0),
		mu: cma.mu.map(() => .04)
	};
	const edgeWhat = defaultWhatIf(edgeProfile.fee);
	const edgeSim = runMonteCarlo({
		...buildSimInput(edgeProfile, edgeCma, edgeWhat, 256),
		weights: [
			1,
			0,
			0,
			0,
			0,
			0
		],
		vol: [
			0,
			0,
			0,
			0,
			0,
			0
		],
		nPaths: 256
	});
	const edgePdf = buildProposalPdf({
		profile: edgeProfile,
		cma: edgeCma,
		whatIf: edgeWhat,
		privacy: false,
		result: edgeSim,
		baseline: edgeSim,
		nPaths: 256,
		asOf
	});
	const edgeV = validatePdf(edgePdf.bytes);
	const chartsFinite = [
		pieWithLegend({
			x: 54,
			y: 400,
			w: 487,
			h: 150
		}, [{
			value: 1,
			label: "Only"
		}, {
			value: 0,
			label: "Zero"
		}]),
		pieWithLegend({
			x: 54,
			y: 400,
			w: 487,
			h: 150
		}, [{
			value: 0,
			label: "A"
		}, {
			value: 0,
			label: "B"
		}]),
		fanOps({
			x: 54,
			y: 400,
			w: 487,
			h: 168
		}, [2026, 2027], {
			p5: [0, 0],
			p25: [0, 0],
			p50: [0, 0],
			p75: [0, 0],
			p95: [0, 0]
		}, "Index"),
		fanOps({
			x: 54,
			y: 400,
			w: 487,
			h: 168
		}, [2026], {
			p5: [NaN],
			p25: [NaN],
			p50: [Infinity],
			p75: [0],
			p95: [0]
		}, "Index"),
		barPairOps({
			x: 54,
			y: 400,
			w: 487,
			h: 160
		}, [{
			label: "Only",
			a: 0,
			b: 0
		}], ["Current", "Recommended"]),
		lineOps({
			x: 54,
			y: 400,
			w: 487,
			h: 150
		}, [[{
			x: 0,
			y: 0
		}, {
			x: 1,
			y: 0
		}]], [C.navy], "Index")
	].every((o) => !/\bNaN\b|\bInfinity\b/.test(o));
	tests.push(t$1("4a.edge.finite", "4a. Strict PDF structure", "Zero-vol, 0% success, single-asset chart paths stay finite (no NaN/Infinity/empty numbers)", edgeV.ok && chartsFinite && edgeSim.goals[0].successRate === 0 && pdfContainsPhrase(edgePdf.bytes, "0.0%") && !/\bNaN\b|\bInfinity\b/.test(joinedPdfText(edgePdf.bytes)), "valid PDF, 0.0% success, finite operators", `pdf=${edgeV.ok ? "ok" : edgeV.errors[0]} success=${edgeSim.goals[0].successRate} chartsFinite=${chartsFinite}`));
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
			holdings: client.id === "demo-emilie" ? holdings : null
		});
		const v = validatePdf(pdf.bytes);
		const joined = joinedPdfText(pdf.bytes);
		const placed = extractPlacedText(pdf.bytes, v.pageStreams);
		const placeErr = placedLayoutErrors(placed);
		const layoutErr = [...pdf.layout?.violations ?? [], ...placeErr];
		const unmapped = v.strings.flatMap((s) => unmappedWinAnsiChars(s));
		const certainty = forbiddenCertainty(joined);
		tests.push(t$1(`4a.proposal-${client.id}`, "4a. Strict PDF structure", `${client.name}: xref 20-byte, objects exist, BT/ET q/Q, Info, no NaN`, v.ok && pdf.bytes.length > 2e3 && v.info.title.includes(client.name) && v.info.producer.includes("NORDLYS") && !!v.info.creationDate && v.pageStreams.length === (pdf.layout?.pageCount ?? 0), "valid PDF 1.4 with Title/Producer/CreationDate", structureActual(v, pdf.bytes)));
		tests.push(t$1(`4b.scan-${client.id}`, "4b. Character coverage", `${client.name}: every extracted string is WinAnsi`, unmapped.length === 0, "no unmapped code points", unmapped.length ? unmapped.slice(0, 6).join(", ") : "all WinAnsi"));
		tests.push(t$1(`4c.roundtrip-${client.id}`, "4c. Text extraction", `${client.name}: name and Nordic archive line round-trip`, joined.includes(client.name) && joined.includes(phrase), `${client.name} and ${phrase}`, `name=${joined.includes(client.name)} nordic=${joined.includes(phrase)}`));
		const missingGoals = [];
		for (const g of client.goals) {
			const r = sim.goals.find((x) => x.goalId === g.id);
			const p = r ? formatPct(r.successRate, 1) : "";
			if (!r || !joined.includes(p) || !joined.includes(g.name)) missingGoals.push(`${g.name} ${p}`);
		}
		const med = formatMoney(sim.medianTerminal, client.currency, false);
		const feePct = formatPct(sim.feeDragPct);
		const feeAmt = formatMoney(sim.feeDrag, client.currency, false);
		const missingW = [];
		for (let i = 0; i < ASSET_IDS.length; i++) {
			const lab = ASSET_LABELS[ASSET_IDS[i]];
			const w = formatPct(book.weights[i] ?? 0, 1);
			if (!joined.includes(lab) || !joined.includes(w)) missingW.push(`${lab} ${w}`);
		}
		const screenOk = missingGoals.length === 0 && joined.includes(med) && joined.includes(feePct) && joined.includes(feeAmt) && missingW.length === 0 && sim.nPaths === 1e4 && pdfContainsPhrase(pdf.bytes, String(1e4));
		tests.push(t$1(`4d.screen-${client.id}`, "4d. Screen equals PDF", `${client.name}: success, weights, fee drag, median ending wealth match the 10,000-path Planner`, screenOk, `10,000 paths, goals/weights/fee/median identical to screen formatters`, screenOk ? `nPaths=${sim.nPaths} median=${med} fee=${feePct}` : `missing goals=[${missingGoals.join("; ")}] weights=[${missingW.join("; ")}] median=${joined.includes(med)} feePct=${joined.includes(feePct)} nPaths=${sim.nPaths}`));
		tests.push(t$1(`4g.layout-${client.id}`, "4g. Layout", `${client.name}: no overlap, nothing outside margins, no empty page, no orphan heading`, layoutErr.length === 0 && (pdf.layout?.emptyPages ?? 0) === 0 && placed.length > 0, "0 layout violations", layoutErr.length ? layoutErr.slice(0, 4).join(" · ") : `pages=${pdf.layout?.pageCount} glyphs=${placed.length}`));
		tests.push(t$1(`4h.advisor-${client.id}`, "4h. Advisor language", `${client.name}: no certainty language; date, assumptions, hypothetical disclaimer present`, certainty.length === 0 && joined.includes(asOf) && /Assumptions/i.test(joined) && /hypothetical illustration/i.test(joined) && /not a guarantee of future results/i.test(joined), "date + assumptions + hypothetical disclaimer; no will reach/guaranteed/certain to", certainty.length ? `certainty: ${certainty.join(", ")}` : `date=${joined.includes(asOf)} assumptions=${/Assumptions/i.test(joined)} hypo=${/hypothetical/i.test(joined)}`));
		const priv = buildProposalPdf({
			profile: client,
			cma,
			whatIf,
			privacy: true,
			result: sim,
			baseline: sim,
			nPaths: N_PATHS,
			asOf,
			holdings: client.id === "demo-emilie" ? holdings : null
		});
		const pv = validatePdf(priv.bytes);
		const pAll = metaText(pv);
		const leaks = privacyScan(priv.bytes, pv);
		const pLayout = [...priv.layout?.violations ?? [], ...placedLayoutErrors(extractPlacedText(priv.bytes, pv.pageStreams))];
		tests.push(t$1(`4a.privacy-${client.id}`, "4a. Strict PDF structure", `${client.name} Privacy Mode PDF is Acrobat-valid`, pv.ok && !!pv.info.title && !!pv.info.producer && !!pv.info.creationDate, "valid PDF 1.4 with Info", structureActual(pv, priv.bytes)));
		tests.push(t$1(`4f.privacy-${client.id}`, "4f. Privacy Mode", `${client.name}: no kr/NOK/USD/EUR/$/€ or grouped money in body, tables, charts, or metadata`, leaks.length === 0 && /Privacy/i.test(pAll), "percentages/indexes/dates only", leaks.length ? leaks.join(", ") : "no currency amounts"));
		tests.push(t$1(`4g.privacy-layout-${client.id}`, "4g. Layout", `${client.name} Privacy Mode layout is clean`, pLayout.length === 0, "0 layout violations", pLayout.length ? pLayout.slice(0, 4).join(" · ") : `pages=${priv.layout?.pageCount}`));
		tests.push(t$1(`4b.privacy-scan-${client.id}`, "4b. Character coverage", `${client.name} Privacy Mode strings are WinAnsi`, pv.strings.flatMap((s) => unmappedWinAnsiChars(s)).length === 0, "no unmapped code points", "all WinAnsi"));
		const openLeaks = privacyScan(pdf.bytes, v);
		tests.push(t$1(`4f.scanner-${client.id}`, "4f. Privacy Mode", `${client.name}: privacy scanner flags currency amounts on the non-privacy proposal`, openLeaks.length > 0, "at least one kr/NOK/USD/EUR/$/€ or grouped amount", openLeaks.length ? openLeaks.slice(0, 3).join(" · ") : "scanner saw nothing"));
	}
	const previewClient = DEMO_CLIENTS[0];
	const previewWhat = defaultWhatIf(previewClient.fee);
	const fullSim = runMonteCarlo(buildSimInput(previewClient, cma, previewWhat, N_PATHS));
	const previewSim = runMonteCarlo(buildSimInput(previewClient, cma, previewWhat, N_PATHS_PREVIEW));
	const fromPreviewText = joinedPdfText(buildProposalPdf({
		profile: previewClient,
		cma,
		whatIf: previewWhat,
		privacy: false,
		result: previewSim,
		asOf
	}).bytes);
	const previewPrimary = fullSim.goals[0];
	tests.push(t$1("4d.preview-rejected", "4d. Screen equals PDF", "A 2,000-path slider-drag result is discarded; the PDF uses the full 10,000 paths", fromPreviewText.includes(String(1e4)) && !fromPreviewText.includes(`2000 x`) && fromPreviewText.includes(formatPct(previewPrimary.successRate, 1)) && fromPreviewText.includes(formatMoney(fullSim.medianTerminal, previewClient.currency, false)), "10000 paths and 10k success/median, never 2000 x", `has10000=${fromPreviewText.includes(String(N_PATHS))} has2000x=${fromPreviewText.includes(`${N_PATHS_PREVIEW} x`)}`));
	const noHistLedger = {
		...demo.ledger,
		prices: []
	};
	tests.push(t$1("4e.gate", "4e. My Data honesty", "historicalRiskAvailable is false for My Data without imported price/NAV history (never CMA)", historicalRiskAvailable("mydata", noHistLedger) === false && historicalRiskAvailable("demo", demo.ledger) === true && historicalRiskAvailable("mydata", demo.ledger) === false, "mydata+no import → false; demo → true; mydata+synthetic → false", `mydataEmpty=${historicalRiskAvailable("mydata", noHistLedger)} demo=${historicalRiskAvailable("demo", demo.ledger)} mydataSynthetic=${historicalRiskAvailable("mydata", demo.ledger)}`));
	const myRep = buildPortfolioReportPdf({
		ledger: noHistLedger,
		profile: previewClient,
		cma,
		whatIf: previewWhat,
		costMethod: "fifo",
		privacy: false,
		asOf: DEMO_AS_OF,
		mode: "mydata"
	});
	const myText = joinedPdfText(myRep.bytes);
	const listed = holdingsWithoutImportedHistory(noHistLedger, holdings.holdings.map((h) => ({
		isin: h.isin,
		name: h.security.name
	}))).every((h) => myText.includes(h.name.split(" ")[0]));
	tests.push(t$1("4e.mydata-pdf", "4e. My Data honesty", "Portfolio report prints “Not available: import price history” and lists holdings without history; no Sharpe/Sortino/Calmar/VaR from CMA", myText.includes("Not available: import price history") && listed && !/Sharpe/.test(myText) && !/Sortino/.test(myText) && !/Calmar/.test(myText) && validatePdf(myRep.bytes).ok, "Not available: import price history; holdings named; no CMA ratios", `phrase=${myText.includes("Not available: import price history")} listed=${listed} sharpe=${/Sharpe/.test(myText)}`));
	const importedHist = {
		...demo.ledger,
		prices: demo.ledger.prices.map((p) => ({
			...p,
			source: "import"
		}))
	};
	const histText = joinedPdfText(buildPortfolioReportPdf({
		ledger: importedHist,
		profile: previewClient,
		cma,
		whatIf: previewWhat,
		costMethod: "fifo",
		privacy: false,
		asOf: DEMO_AS_OF,
		mode: "mydata"
	}).bytes);
	tests.push(t$1("4e.mydata-imported", "4e. My Data honesty", "With imported price history, My Data report prints volatility/Sharpe/Sortino/Calmar/drawdown/VaR from that history", historicalRiskAvailable("mydata", importedHist) && /Volatility/.test(histText) && /Sharpe/.test(histText) && /Sortino/.test(histText) && /Calmar/.test(histText) && /drawdown/i.test(histText) && /VaR/.test(histText) && !histText.includes("Not available: import price history"), "risk table from imported NAV, not the placeholder", `gate=${historicalRiskAvailable("mydata", importedHist)} sharpe=${/Sharpe/.test(histText)} placeholder=${histText.includes("Not available: import price history")}`));
	const report = buildPortfolioReportPdf({
		ledger: demo.ledger,
		profile: previewClient,
		cma,
		whatIf: previewWhat,
		costMethod: "fifo",
		privacy: false,
		asOf: DEMO_AS_OF,
		mode: "demo"
	});
	const rv = validatePdf(report.bytes);
	const rLayout = [...report.layout?.violations ?? [], ...placedLayoutErrors(extractPlacedText(report.bytes, rv.pageStreams))];
	tests.push(t$1("4a.portfolio-report", "4a. Strict PDF structure", "Demo portfolio report: xref, streams, Info", rv.ok && report.bytes.length > 2e3 && pdfContainsPhrase(report.bytes, "Portfolio report"), "valid downloadable report", structureActual(rv, report.bytes)));
	tests.push(t$1("4g.portfolio-report", "4g. Layout", "Demo portfolio report layout is clean", rLayout.length === 0, "0 layout violations", rLayout.length ? rLayout.slice(0, 4).join(" · ") : `pages=${report.layout?.pageCount}`));
	const privRep = buildPortfolioReportPdf({
		ledger: demo.ledger,
		profile: previewClient,
		cma,
		whatIf: previewWhat,
		costMethod: "fifo",
		privacy: true,
		asOf: DEMO_AS_OF,
		mode: "demo"
	});
	const prv = validatePdf(privRep.bytes);
	const privRepLeaks = privacyScan(privRep.bytes, prv);
	tests.push(t$1("4f.portfolio-privacy", "4f. Privacy Mode", "Portfolio report Privacy Mode: no currency amounts in charts, tables, or metadata", privRepLeaks.length === 0 && prv.ok, "no kr/NOK/USD/EUR/$/€", privRepLeaks.length ? privRepLeaks.join(", ") : "clean"));
	const longDoc = new PdfDoc({
		title: "Table break",
		headerLeft: "NORDLYS",
		privacy: false
	});
	longDoc.coverBand("Table break", "Layout fixture", asOf, "CONFIDENTIAL");
	longDoc.heading("Long table");
	longDoc.addTable([{
		header: "Name",
		width: 240
	}, {
		header: "Value",
		width: 200,
		align: "right"
	}], Array.from({ length: 80 }, (_, i) => [`Row ${i} Ålesund`, String(i)]));
	const longBytes = longDoc.finish();
	const longV = validatePdf(longBytes);
	const longLayout = [...longDoc.layout.violations, ...placedLayoutErrors(extractPlacedText(longBytes, longV.pageStreams))];
	tests.push(t$1("4g.table-break", "4g. Layout", "A table that spans pages repeats its header row and does not leave a heading as the last item", longDoc.layout.tableHeaderRepeats >= 1 && longDoc.layout.pageCount >= 2 && longDoc.layout.emptyPages === 0 && !longDoc.layout.violations.some((x) => /ends with a heading/.test(x)) && longV.ok && longLayout.length === 0, "header repeated, no orphan heading, no overlap", `pages=${longDoc.layout.pageCount} repeats=${longDoc.layout.tableHeaderRepeats} viol=${longLayout.slice(0, 3).join(" · ") || "none"}`));
	const orphan = new PdfDoc({
		title: "Orphan heading",
		privacy: false
	});
	orphan.coverBand("Orphan", "Detector", asOf, "CONFIDENTIAL");
	orphan.heading("This heading is last");
	orphan.finish();
	tests.push(t$1("4g.orphan-detector", "4g. Layout", "Layout auditor flags a heading left as the last item on a page", orphan.layout.violations.some((x) => /ends with a heading/.test(x)), "violation contains 'ends with a heading'", orphan.layout.violations.join(" · ") || "no violations"));
	tests.push(t$1("4c.euro-nordic", "4c. Text extraction", "Source strings Ålesund, Tromsø, Bærum and € 1,234.56 extract exactly", pdfContainsPhrase(nordic, "Ålesund, Tromsø, Bærum") && pdfContainsPhrase(nordic, "€ 1,234.56"), "Ålesund, Tromsø, Bærum and € 1,234.56", "both present"));
	return tests;
}
function t(id, group, name, pass, expected, actual) {
	return {
		id,
		group,
		name,
		pass,
		expected,
		actual
	};
}
function nTrading(n, start = "2020-01-02") {
	const endMs = Date.parse(start + "T00:00:00Z") + Math.ceil(n * 1.8) * 864e5 + 1728e6;
	const end = new Date(endMs).toISOString().slice(0, 10);
	const days = tradingDays(start, end);
	if (days.length < n) throw new Error(`need ${n} trading days, got ${days.length}`);
	return days.slice(0, n);
}
function nok(ticker, dates, closes) {
	return seriesFromCloses(ticker, "NOK", dates, closes);
}
var BH = `universe [DNB]
rebalance daily
for each asset:
  target_weight 1
`;
var NEVER = `universe [DNB]
rebalance daily
for each asset:
  if sma(close, 5) < 0:
    target_weight 1 / count(signals)
  else:
    target_weight 0
`;
var SMA200 = `universe [DNB]
rebalance daily
for each asset:
  if sma(close, 200) > 0:
    target_weight 1
  else:
    target_weight 0
`;
var PREV = `universe [DNB]
rebalance daily
for each asset:
  if close[1] == 100:
    target_weight 1
  else:
    target_weight 0
`;
var NEG_OFFSET = `universe [DNB]
rebalance daily
for each asset:
  if close[-1] > 0:
    target_weight 1
  else:
    target_weight 0
`;
function runStage5Diagnostics() {
	const tests = [];
	const groupA = "5a. Strategy language";
	const groupB = "5b. Execution";
	const groupC = "5c. Indicators";
	const groupD = "5d. Data honesty";
	const def = tryCompile(DEFAULT_STRATEGY);
	tests.push(t("5a.default", groupA, "The example strategy parses, type-checks, and compiles", def.ok, "compile ok, universe MSFT KOG MOWI DNB, monthly", def.ok ? `${def.program.universe.map((u) => u.ticker).join(" ")} / ${def.program.rebalance}` : def.error.message));
	const prevCompile = tryCompile(PREV);
	tests.push(t("5a.history", groupA, "close[1] is the previous bar (Pine convention) and compiles", prevCompile.ok, "compile ok", prevCompile.ok ? "ok" : prevCompile.error.message));
	const pe = tryCompile(`universe [MSFT]\nrebalance monthly\nfor each asset:\n  @@oops\n`);
	const peOk = !pe.ok && pe.error.line === 4 && pe.error.col === 3 && pe.error.code === "parse";
	tests.push(t("5a.parse-loc", groupA, "Parse errors report the correct line and column of the offending token", peOk, "parse error at line 4 column 3", pe.ok ? "compiled (should have failed)" : `${pe.error.code} line ${pe.error.line} col ${pe.error.col} — ${pe.error.message}`));
	const neg = tryCompile(NEG_OFFSET);
	const negOk = !neg.ok && neg.error.code === "parse" && neg.error.line === 4 && neg.error.col === 12 && neg.error.message === "offsets look back in time; negative values are not allowed";
	tests.push(t("5a.neg-offset", groupA, "close[-1] is a parse error at the minus — offsets look back; negative values are not allowed", negOk, "parse error line 4 col 12: offsets look back in time; negative values are not allowed", neg.ok ? "compiled (should have failed)" : `${neg.error.code} line ${neg.error.line} col ${neg.error.col}: ${neg.error.message}`));
	const dates5 = [
		"2020-01-02",
		"2020-01-03",
		"2020-01-06",
		"2020-01-07",
		"2020-01-08"
	];
	const px5 = [
		100,
		110,
		105,
		120,
		130
	];
	const dnb5 = nok("DNB", dates5, px5);
	const bhProg = compile(BH);
	const bh = runBacktest(bhProg, [dnb5], [], ZERO_COST_CONFIG);
	const fillPx = px5[1];
	const raw = px5[px5.length - 1] / fillPx - 1;
	const bhRel = relativeError(bh.stats.totalReturn, raw);
	tests.push(t("5b.buyhold", groupB, "Buy-and-hold with zero costs matches the raw price return from the fill close", bhRel < 1e-12, `totalReturn = ${raw.toFixed(12)}  (130/110 − 1)`, `totalReturn = ${bh.stats.totalReturn.toFixed(12)}  rel=${bhRel.toExponential(3)}`));
	const first = bh.trades[0];
	const nextDay = first != null && first.date === dates5[1] && first.signalDate === dates5[0] && first.priceNative === px5[1] && first.priceNative !== px5[0];
	tests.push(t("5b.nextday", groupB, "Signals at t close fill at the next trading day's price, never the signal close", nextDay, `fill ${dates5[1]} @ ${px5[1]} (signal ${dates5[0]} @ ${px5[0]})`, first ? `fill ${first.date} @ ${first.priceNative} (signal ${first.signalDate})` : "no trades"));
	const prevRun = prevCompile.ok ? runBacktest(prevCompile.program, [dnb5], [], ZERO_COST_CONFIG) : null;
	const prevTrade = prevRun?.trades[0];
	const prevOk = prevCompile.ok && prevRun != null && prevTrade != null && prevTrade.signalDate === dates5[1] && prevTrade.date === dates5[2] && prevRun.lookback === 1;
	tests.push(t("5a.prev-bar", groupA, "close[1] equals the previous close: signal fires on the bar after 100, fill the next session", Boolean(prevOk), `lookback 1, signal ${dates5[1]} (prev close 100), fill ${dates5[2]}`, prevTrade ? `lookback ${prevRun?.lookback}, signal ${prevTrade.signalDate}, fill ${prevTrade.date}` : `lookback ${prevRun?.lookback ?? "n/a"}, no trades${prevCompile.ok ? "" : ` (${prevCompile.error.message})`}`));
	const neverProg = compile(NEVER);
	const neverSeries = nok("DNB", nTrading(40), nTrading(40).map((_, i) => 100 + i));
	const neverRes = runBacktest(neverProg, [neverSeries], [], ZERO_COST_CONFIG);
	const cashOnly = neverRes.trades.length === 0 && neverRes.equity.length > 0 && neverRes.equity.every((p) => Math.abs(p.value - ZERO_COST_CONFIG.initialCash) < 1e-6);
	tests.push(t("5b.count0", groupB, "If count(signals) is 0 the book holds cash — never divides by zero, never trades", cashOnly, "0 trades, equity stays at initial cash", `${neverRes.trades.length} trades, start ${neverRes.equity[0]?.value} end ${neverRes.equity[neverRes.equity.length - 1]?.value}`));
	const warmDates = nTrading(250);
	const warmPx = warmDates.map((_, i) => 100 + i * .25);
	const warmRes = runBacktest(compile(SMA200), [nok("DNB", warmDates, warmPx)], [], ZERO_COST_CONFIG);
	const signalIdx = 199;
	const fillIdx = 200;
	const warmOk = warmRes.stats.firstFillDate === warmDates[fillIdx] && warmRes.trades[0]?.signalDate === warmDates[signalIdx] && warmRes.trades.every((tr) => tr.date >= warmDates[fillIdx]) && warmRes.lookback === 199;
	tests.push(t("5b.warmup", groupB, "sma(close, 200) is undefined until 200 prices exist — no trades before every indicator is defined", Boolean(warmOk), `lookback 199, first signal ${warmDates[signalIdx]}, first fill ${warmDates[fillIdx]}`, `lookback ${warmRes.lookback}, signal ${warmRes.trades[0]?.signalDate ?? "none"}, fill ${warmRes.stats.firstFillDate}`));
	const usdDates = [
		"2020-01-02",
		"2020-01-03",
		"2020-01-06"
	];
	const usdBars = [
		{
			date: usdDates[0],
			open: 100,
			high: 100,
			low: 100,
			close: 100,
			volume: 0
		},
		{
			date: usdDates[1],
			open: 100,
			high: 100,
			low: 100,
			close: 100,
			volume: 0
		},
		{
			date: usdDates[2],
			open: 100,
			high: 100,
			low: 100,
			close: 100,
			volume: 0
		}
	];
	const usdFx = [
		{
			date: usdDates[0],
			usdNok: 10
		},
		{
			date: usdDates[1],
			usdNok: 10
		},
		{
			date: usdDates[2],
			usdNok: 20
		}
	];
	const usdRes = runBacktest(compile(`universe [MSFT]
rebalance daily
for each asset:
  target_weight 1
`), [{
		ticker: "MSFT",
		currency: "USD",
		bars: usdBars
	}], usdFx, ZERO_COST_CONFIG);
	const usdRet = usdRes.stats.totalReturn;
	const nokPath = 1;
	const usdPath = 0;
	const usdOk = relativeError(usdRet, nokPath) < 1e-12 && Math.abs(usdRet - usdPath) > .5;
	const usdFill = usdRes.trades[0];
	tests.push(t("5b.fx", groupB, "USD names are converted to NOK on each date — a flat USD price with doubling FX doubles NOK wealth", Boolean(usdOk && usdFill && relativeError(usdFill.priceNok, 1e3) < 1e-12), `NOK return ${nokPath} (not USD return ${usdPath}), fill priceNok 1000`, `return ${usdRet}, fill priceNok ${usdFill?.priceNok ?? "none"}`));
	const xs = [
		10,
		11,
		12,
		11,
		13
	];
	const rsiFirst = rsiWilder(xs.slice(0, 4), 3);
	const rsiLast = rsiWilder(xs, 3);
	const handFirst = 100 - 100 / 3;
	const handLast = 100 - 100 / 6;
	tests.push(t("5c.rsi", groupC, "Wilder RSI on [10,11,12,11,13], period 3 matches the hand-computed series (66.666… then 83.333…)", rsiFirst != null && rsiLast != null && relativeError(rsiFirst, handFirst) < 1e-12 && relativeError(rsiLast, handLast) < 1e-12, `first ${handFirst.toFixed(10)}, last ${handLast.toFixed(10)}`, `first ${rsiFirst?.toFixed(10)}, last ${rsiLast?.toFixed(10)}`));
	let demoRun = false;
	let demoMsg = "";
	try {
		if (!def.ok) throw new Error(def.error.message);
		const series = buildDemoAssetSeries();
		const fx = buildDemoFx(demoCalendar());
		const r = runBacktest(def.program, series, fx, ZERO_COST_CONFIG);
		demoRun = r.equity.length > 400 && r.lookback === 199 && r.readyDate != null && r.stats.firstFillDate != null;
		demoMsg = `days ${r.equity.length}, lookback ${r.lookback}, ready ${r.readyDate}, fills ${r.stats.nTrades}`;
	} catch (e) {
		demoMsg = e instanceof Error ? e.message : String(e);
	}
	tests.push(t("5b.demo", groupB, "The example strategy runs in Demo mode on seeded OHLC for MSFT, KOG, MOWI, DNB", demoRun, "equity length > 400, lookback 199, a first fill after SMA 200 is defined", demoMsg));
	const miss = resolveBacktestData("mydata", [
		"MSFT",
		"KOG",
		"MOWI",
		"DNB"
	], emptyLedgerBundle());
	const missOk = !miss.ok && miss.missing.slice().sort().join(",") === "DNB,KOG,MOWI,MSFT";
	tests.push(t("5d.missing", groupD, "My Data backtests refuse missing imported prices and list every absent ticker — never falling back to Demo", missOk, "missing DNB, KOG, MOWI, MSFT", miss.ok ? "resolved (should have failed)" : miss.missing.join(", ")));
	const demoResolve = resolveBacktestData("demo", [
		"MSFT",
		"KOG",
		"MOWI",
		"DNB"
	]);
	tests.push(t("5d.demo-resolve", groupD, "Demo mode supplies OHLC for the four example tickers without using the ledger", demoResolve.ok && demoResolve.series.length === 4 && demoResolve.series.every((s) => s.bars.length > 1e3), "4 series, >1000 bars each", demoResolve.ok ? demoResolve.series.map((s) => `${s.ticker}:${s.bars.length}`).join(" ") : demoResolve.message));
	return tests;
}
/** Stage 6 fuzz harness. Every reject returns a non-empty error; nothing may throw. */
var N_FUZZ = 1e5;
function clip(s, n = 72) {
	const t = s.replace(/\s+/g, " ").trim();
	if (t.length <= n) return t;
	return `${t.slice(0, n)}…`;
}
function failMsg(prefix, raw) {
	const shown = clip(raw, 48);
	return shown ? `${prefix}: ${JSON.stringify(shown)}` : prefix;
}
function parseNumberChecked(raw) {
	try {
		if (raw == null || typeof raw === "string" && raw.trim() === "") return {
			ok: false,
			error: "empty number cell"
		};
		const n = parseNumber(raw);
		if (n == null) return {
			ok: false,
			error: failMsg("not a number", String(raw))
		};
		return {
			ok: true,
			value: n
		};
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : String(e)
		};
	}
}
function parseDateChecked(raw) {
	try {
		if (raw == null || raw.trim() === "") return {
			ok: false,
			error: "empty date cell"
		};
		const d = parseDate(raw);
		if (d == null) return {
			ok: false,
			error: failMsg("not a date (expected YYYY-MM-DD, DD.MM.YYYY or MM/DD/YYYY)", raw)
		};
		return {
			ok: true,
			value: d
		};
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : String(e)
		};
	}
}
function parseCsvChecked(text) {
	try {
		if (text.trim() === "") return {
			ok: false,
			error: "empty table; no header row"
		};
		if (unclosedQuotes(text)) return {
			ok: false,
			error: "unclosed quote in CSV"
		};
		if (!hasTableDelimiter(text)) return {
			ok: false,
			error: "not a table; no comma, semicolon or tab delimiter"
		};
		const table = parseTable(text);
		if (!table.headers.length) return {
			ok: false,
			error: "empty table; no header row"
		};
		if (table.headers.every((h) => h.trim() === "")) return {
			ok: false,
			error: "empty table; no header row"
		};
		return {
			ok: true,
			value: {
				headers: table.headers,
				rows: table.rows
			}
		};
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return {
			ok: false,
			error: msg.trim() ? msg : "CSV parse failed"
		};
	}
}
function hasTableDelimiter(text) {
	return text.includes("	") || text.includes(";") || text.includes(",");
}
function unclosedQuotes(text) {
	let q = false;
	for (let i = 0; i < text.length; i++) if (text[i] === "\"") {
		if (q && text[i + 1] === "\"") i += 1;
		else q = !q;
	}
	return q;
}
function parseEncodingChecked(buf) {
	try {
		if (buf.length === 0) return {
			ok: false,
			error: "empty buffer; nothing to decode"
		};
		const out = decodeText(buf);
		if (out.text.includes("�")) return {
			ok: false,
			error: "invalid encoding; replacement characters in decoded text"
		};
		return {
			ok: true,
			value: out
		};
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return {
			ok: false,
			error: msg.trim() ? msg : "encoding decode failed"
		};
	}
}
function parseStrategyChecked(source) {
	try {
		if (source.trim() === "") return {
			ok: false,
			error: "empty strategy; nothing to compile"
		};
		const r = tryCompile(source);
		if (r.ok) return {
			ok: true,
			value: r.program
		};
		const msg = r.error.message.trim();
		return {
			ok: false,
			error: msg ? msg : "strategy compile failed"
		};
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return {
			ok: false,
			error: msg.trim() ? msg : "strategy compile failed"
		};
	}
}
var ALPHA = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,;:-_+/\\()[]{}'\" 	\n#*=<>!?@æøåÆØÅ$%";
function randInt(rng, n) {
	if (n <= 0) return 0;
	return Math.floor(rng.nextFloat() * n) % n;
}
function randStr(rng, min, max) {
	const len = min + randInt(rng, max - min + 1);
	let s = "";
	for (let i = 0; i < len; i++) if (rng.nextFloat() < .04) s += String.fromCharCode(randInt(rng, 90) + 32);
	else s += ALPHA[randInt(rng, 98)];
	return s;
}
function nowMs() {
	return typeof performance !== "undefined" ? performance.now() : Date.now();
}
function emptyStat() {
	return {
		n: 0,
		crashes: 0,
		silent: 0,
		ok: 0,
		rejected: 0,
		sampleCrash: "",
		sampleSilent: ""
	};
}
function record(stat, run) {
	stat.n += 1;
	try {
		const r = run();
		if (r.ok) {
			stat.ok += 1;
			return;
		}
		stat.rejected += 1;
		if (!r.error || !String(r.error).trim()) {
			stat.silent += 1;
			if (!stat.sampleSilent) stat.sampleSilent = "(empty error)";
		}
	} catch (e) {
		stat.crashes += 1;
		if (!stat.sampleCrash) stat.sampleCrash = e instanceof Error ? e.message : String(e);
	}
}
function runFuzzDiagnostics(n = N_FUZZ) {
	const rng = createRng(20260910);
	const num = emptyStat();
	const date = emptyStat();
	const csv = emptyStat();
	const enc = emptyStat();
	const strat = emptyStat();
	const goodNums = [
		"1234,56",
		"1 234.56",
		"$1,234.56",
		"(12.5)",
		"0",
		"1.234,56",
		"1234,56-"
	];
	const goodDates = [
		"2020-01-02",
		"02.01.2020",
		"1/2/2020",
		"31.12.1999",
		"2026-09-10"
	];
	const goodCsv = [
		"a,b\n1,2",
		"Id	Bokføringsdag\n1	2020-01-02",
		"x;y;z\n1;2;3",
		`"a,b",c\n1,2`
	];
	const goodStrat = [
		DEFAULT_STRATEGY,
		"universe [MSFT]\nrebalance daily\nfor each asset:\n  target_weight 1\n",
		"universe [DNB]\nrebalance monthly\nparam n = 10\nfor each asset:\n  if close > close[1]:\n    target_weight 1\n  else:\n    target_weight 0\n"
	];
	for (let i = 0; i < n; i++) {
		if (i % 17 === 0) record(num, () => parseNumberChecked(goodNums[i % goodNums.length]));
		else record(num, () => parseNumberChecked(randStr(rng, 0, 24)));
		if (i % 19 === 0) record(date, () => parseDateChecked(goodDates[i % goodDates.length]));
		else record(date, () => parseDateChecked(randStr(rng, 0, 20)));
		if (i % 23 === 0) record(csv, () => parseCsvChecked(goodCsv[i % goodCsv.length]));
		else {
			const lines = 1 + randInt(rng, 3);
			let t = "";
			for (let k = 0; k < lines; k++) {
				if (k) t += k % 2 ? "\n" : "\r\n";
				t += randStr(rng, 0, 28);
			}
			record(csv, () => parseCsvChecked(t));
		}
		if (i % 29 === 0) {
			const text = i % 2 === 0 ? "Id	Bokføringsdag\n1	2020-01-02" : "hello æøå";
			const u8 = i % 3 === 0 ? utf16le(text) : new TextEncoder().encode(text);
			record(enc, () => parseEncodingChecked(u8));
		} else {
			const len = randInt(rng, 33);
			const buf = new Uint8Array(len);
			for (let k = 0; k < len; k++) buf[k] = randInt(rng, 256);
			record(enc, () => parseEncodingChecked(buf));
		}
		if (i % 31 === 0) record(strat, () => parseStrategyChecked(goodStrat[i % goodStrat.length]));
		else record(strat, () => parseStrategyChecked(randStr(rng, 0, 40)));
	}
	const tests = [
		fuzzTest("6a.number", "number parser", num),
		fuzzTest("6a.date", "date parser", date),
		fuzzTest("6a.csv", "CSV parser", csv),
		fuzzTest("6a.encoding", "encoding decoder", enc),
		fuzzTest("6a.strategy", "strategy-language parser", strat)
	];
	tests.push(sweepOosTest());
	return tests;
}
function fuzzTest(id, label, s) {
	const pass = s.crashes === 0 && s.silent === 0 && s.n === 1e5;
	const extra = s.crashes ? ` crash=${clip(s.sampleCrash)}` : s.silent ? ` silent=${clip(s.sampleSilent)}` : "";
	return {
		id,
		group: "6a. Fuzz (100,000 inputs each)",
		name: `${label}: 100,000 random inputs, zero crashes, every reject has a message`,
		pass,
		expected: `n=${N_FUZZ} crashes=0 silent=0`,
		actual: `n=${s.n} crashes=${s.crashes} silent=${s.silent} ok=${s.ok} reject=${s.rejected}${extra}`
	};
}
function utf16le(text) {
	const out = new Uint8Array(2 + text.length * 2);
	out[0] = 255;
	out[1] = 254;
	for (let i = 0; i < text.length; i++) {
		const c = text.charCodeAt(i);
		out[2 + i * 2] = c & 255;
		out[3 + i * 2] = c >> 8 & 255;
	}
	return out;
}
function sweepOosTest() {
	try {
		const dates = tradingDays("2020-01-02", "2020-08-31").slice(0, 80);
		const closes = dates.map((_, i) => 100 + i * .15);
		const series = [seriesFromCloses("DNB", "NOK", dates, closes)];
		const fx = dates.map((d) => ({
			date: d,
			usdNok: 10
		}));
		const program = compile("universe [DNB]\nrebalance daily\nparam p = 1\nfor each asset:\n  target_weight 1\n");
		const sweep = runSweep(program, series, fx, ZERO_COST_CONFIG, { p: [1, 2] });
		const ok = sweep.points.length === 2 && sweep.points.every((p) => Number.isFinite(p.sharpe) && Number.isFinite(p.oosSharpe) && Number.isFinite(p.totalReturn) && Number.isFinite(p.oosReturn));
		return {
			id: "6b.sweep-oos",
			group: "6b. Sweep in-sample vs out-of-sample",
			name: "Parameter sweep reports in-sample and out-of-sample Sharpe side by side",
			pass: ok,
			expected: "2 points, finite IS and OOS Sharpe",
			actual: ok ? sweep.points.map((p) => `p=${p.params.p} IS=${p.sharpe.toFixed(3)} OOS=${p.oosSharpe.toFixed(3)}`).join(" · ") : `points=${sweep.points.length}`
		};
	} catch (e) {
		return {
			id: "6b.sweep-oos",
			group: "6b. Sweep in-sample vs out-of-sample",
			name: "Parameter sweep reports in-sample and out-of-sample Sharpe side by side",
			pass: false,
			expected: "2 points, finite IS and OOS Sharpe",
			actual: e instanceof Error ? e.message : String(e)
		};
	}
}
var EMPTY_CELLS = [];
function compactRow(i) {
	const id = String(i);
	return {
		rowNumber: i + 1,
		cells: EMPTY_CELLS,
		id,
		bookingDate: "2020-01-02",
		tradeDate: "2020-01-02",
		settleDate: "2020-01-02",
		portfolio: "A",
		rawType: "KJØPT",
		name: "F",
		isin: "NO0000000001",
		qty: 1,
		price: 10,
		interest: 0,
		totalFees: 0,
		feeCcy: "NOK",
		amount: -10,
		amountCcy: "NOK",
		purchaseValue: 10,
		purchaseCcy: "NOK",
		result: 0,
		resultCcy: "NOK",
		totalQty: i,
		saldo: -10 * i,
		fxRate: 1,
		text: "",
		cancelDate: "",
		noteNumber: "",
		verification: "",
		brokerage: 0,
		brokerageCcy: "NOK",
		valutakurs: 1,
		initialInterest: 0
	};
}
function tsvMeta() {
	return {
		encoding: "utf-8",
		delimiter: "tab",
		lineEnding: "lf",
		headerCount: NORDNET_HEADERS_NB.length,
		positional: true,
		headers: [...NORDNET_HEADERS_NB]
	};
}
/** Build 100k compact Nordnet rows and import them. Does not persist. */
function timeImport100k() {
	const N = 1e5;
	const rows = new Array(N);
	for (let i = 0; i < N; i++) rows[i] = compactRow(i + 1);
	const t0 = nowMs();
	const r = importNordnetRows(rows, tsvMeta(), "perf-100k.txt", emptyLedgerBundle(), {});
	return {
		ms: nowMs() - t0,
		created: r.report.transactionsCreated,
		rowsRead: r.report.rowsRead,
		bytes: N
	};
}
/** Parse a 100,000-row Nordnet TSV (the file path). Does not persist. */
function timeParse100kFile() {
	const N = 1e5;
	const header = NORDNET_HEADERS_NB.join("	");
	const lines = new Array(100001);
	lines[0] = header;
	for (let i = 1; i <= N; i++) lines[i] = `${i}\t2020-01-02\t2020-01-02\t2020-01-02\tA\tKJØPT\tF\tNO1\t1\t10\t0\t0\tNOK\t-10\tNOK\t10\tNOK\t0\tNOK\t${i}\t0\t1\t\t\t\t\t0\tNOK\t1\t0`;
	const text = lines.join("\n");
	const bytes = new TextEncoder().encode(text);
	const t0 = nowMs();
	const parsed = parseNordnetBytes(bytes);
	return {
		ms: nowMs() - t0,
		rowsRead: parsed.rows.length,
		bytes: bytes.byteLength
	};
}
function zeros(n) {
	return new Float64Array(n);
}
function sim(partial) {
	const nMonths = partial.nMonths;
	return {
		seed: 7,
		weights: [
			1,
			0,
			0,
			0,
			0,
			0
		],
		mu: [
			.06,
			0,
			0,
			0,
			0,
			0
		],
		vol: [
			0,
			0,
			0,
			0,
			0,
			0
		],
		corr: identity(6),
		inflation: 0,
		fee: 0,
		contribution: zeros(nMonths),
		withdrawal: zeros(nMonths),
		lumps: [],
		retirementGoalId: null,
		legacyGoals: [],
		goalIds: [],
		rebalance: "monthly",
		engine: "assets",
		...partial,
		nMonths
	};
}
function runDiagnostics() {
	const tests = [];
	const r = .06 / 12;
	const n = 240;
	const pv = 1e5;
	const pmt = 1500;
	const fv = futureValue(pv, r, n, pmt);
	const contrib = new Float64Array(n);
	contrib.fill(pmt);
	const simFv = runMonteCarlo(sim({
		nPaths: 12,
		nMonths: n,
		startWealth: pv,
		contribution: contrib,
		legacyGoals: [{
			goalId: "L",
			amount: 0
		}],
		goalIds: ["L"]
	}));
	const rel = relativeError(simFv.medianTerminal, fv);
	tests.push({
		id: "a.fv",
		group: "a. Future value identity",
		name: "Zero-vol, zero-inflation terminal wealth matches FV = PV(1+r)^n + PMT((1+r)^n − 1)/r",
		pass: rel < 1e-6,
		expected: `rel err < 1e-6  (FV=${fv.toFixed(10)})`,
		actual: `rel err = ${rel.toExponential(4)}  (sim=${simFv.medianTerminal.toFixed(10)})`
	});
	const below = runMonteCarlo(sim({
		nPaths: 20,
		nMonths: n,
		startWealth: pv,
		contribution: contrib,
		legacyGoals: [{
			goalId: "L",
			amount: fv * .999
		}],
		goalIds: ["L"]
	}));
	tests.push({
		id: "a.success1",
		group: "a. Future value identity",
		name: "Success probability is exactly 1 when the legacy target is below the certain FV",
		pass: below.goals[0].successRate === 1,
		expected: "1",
		actual: String(below.goals[0].successRate)
	});
	const above = runMonteCarlo(sim({
		nPaths: 20,
		nMonths: n,
		startWealth: pv,
		contribution: contrib,
		legacyGoals: [{
			goalId: "L",
			amount: fv * 1.001
		}],
		goalIds: ["L"]
	}));
	tests.push({
		id: "a.success0",
		group: "a. Future value identity",
		name: "Success probability is exactly 0 when the legacy target is above the certain FV",
		pass: above.goals[0].successRate === 0,
		expected: "0",
		actual: String(above.goals[0].successRate)
	});
	for (let t = 1; t <= 5; t++) for (let c = 1; c <= 5; c++) {
		const got = finalRiskProfile(t, c);
		const exp = Math.min(t, c);
		tests.push({
			id: `b.${t}.${c}`,
			group: "b. Risk profile = min(tolerance, capacity)",
			name: `tolerance=${t}, capacity=${c}`,
			pass: got === exp,
			expected: String(exp),
			actual: String(got)
		});
	}
	const cma = defaultCma();
	let cholErr = 0;
	let cholOk = true;
	let cholMsg = "";
	try {
		const L = cholesky(cma.corr);
		const recon = matMul(L, transpose(L));
		cholErr = maxAbsDiff(recon, cma.corr);
		cholOk = cholErr < 1e-10;
		cholMsg = `max |L Lᵀ − C| = ${cholErr.toExponential(4)}`;
	} catch (e) {
		cholOk = false;
		cholMsg = e instanceof Error ? e.message : String(e);
	}
	tests.push({
		id: "c.chol",
		group: "c. Cholesky reconstruction",
		name: "L Lᵀ equals the CMA correlation matrix",
		pass: cholOk,
		expected: "max abs error < 1e-10",
		actual: cholMsg
	});
	const rngA = createRng(42);
	const rngB = createRng(42);
	const rngC = createRng(43);
	const seqA = [];
	const seqB = [];
	const seqC = [];
	for (let i = 0; i < 48; i++) {
		seqA.push(rngA.nextU64().toString());
		seqB.push(rngB.nextU64().toString());
		seqC.push(rngC.nextU64().toString());
	}
	const same = seqA.every((v, i) => v === seqB[i]);
	tests.push({
		id: "d.same",
		group: "d. Seeded PRNG",
		name: "Identical seed ⇒ identical xoshiro256** stream",
		pass: same,
		expected: "48/48 values match",
		actual: same ? "48/48 match" : `${seqA.filter((v, i) => v === seqB[i]).length}/48 match`
	});
	const diff = seqA.some((v, i) => v !== seqC[i]);
	tests.push({
		id: "d.diff",
		group: "d. Seeded PRNG",
		name: "Different seeds ⇒ different streams",
		pass: diff,
		expected: "at least one mismatch in 48 values",
		actual: diff ? "streams differ" : "streams identical (fail)"
	});
	const vec = createRng(42).nextU64();
	const vecOk = vec === 1546998764402558742n;
	tests.push({
		id: "d.vector",
		group: "d. Seeded PRNG",
		name: "Seed 42 matches the SplitMix64 + xoshiro256** C reference",
		pass: vecOk,
		expected: "0x15780b2e0c2ec716",
		actual: `0x${vec.toString(16)}`
	});
	const book = MODEL_PORTFOLIOS[2];
	const moments = runMonteCarlo(sim({
		seed: 20260321,
		nPaths: 800,
		nMonths: 120,
		startWealth: 1e6,
		weights: book.weights.slice(),
		mu: cma.mu.slice(),
		vol: cma.vol.slice(),
		corr: cma.corr.map((row) => row.slice()),
		rebalance: "monthly",
		engine: "assets"
	}));
	const Nobs = moments.nReturnObs;
	const zCrit = 4;
	for (let i = 0; i < cma.mu.length; i++) {
		const muM = cma.mu[i] / 12;
		const sigM = cma.vol[i] / Math.sqrt(12);
		const seMean = sigM / Math.sqrt(Nobs);
		const seStd = sigM / Math.sqrt(2 * (Nobs - 1));
		const label = ASSET_LABELS[ASSET_IDS[i]];
		tests.push({
			id: `e.mean.${i}`,
			group: "e. Engine per-asset returns vs CMA",
			name: `${label} monthly mean (N=${Nobs}, tol=4·σ/√N)`,
			pass: Math.abs(moments.assetReturnMean[i] - muM) < zCrit * seMean,
			expected: `${muM.toFixed(6)} ± ${(zCrit * seMean).toExponential(3)}`,
			actual: moments.assetReturnMean[i].toFixed(6)
		});
		tests.push({
			id: `e.vol.${i}`,
			group: "e. Engine per-asset returns vs CMA",
			name: `${label} monthly vol (N=${Nobs}, tol=4·σ/√(2N))`,
			pass: Math.abs(moments.assetReturnVol[i] - sigM) < zCrit * seStd,
			expected: `${sigM.toFixed(6)} ± ${(zCrit * seStd).toExponential(3)}`,
			actual: moments.assetReturnVol[i].toFixed(6)
		});
	}
	const port = portfolioMoments(book.weights, cma.mu, cma.vol, cma.corr);
	const muPortM = port.mu / 12;
	const sigPortM = port.vol / Math.sqrt(12);
	const seMeanP = sigPortM / Math.sqrt(Nobs);
	const seStdP = sigPortM / Math.sqrt(2 * (Nobs - 1));
	tests.push({
		id: "f.port.mean",
		group: "f. Rebalanced book vs w′μ, √(w′Σw)",
		name: "Monthly portfolio return mean, monthly rebalance",
		pass: Math.abs(moments.portReturnMean - muPortM) < zCrit * seMeanP,
		expected: `${muPortM.toFixed(6)} ± ${(zCrit * seMeanP).toExponential(3)}`,
		actual: moments.portReturnMean.toFixed(6)
	});
	tests.push({
		id: "f.port.vol",
		group: "f. Rebalanced book vs w′μ, √(w′Σw)",
		name: "Monthly portfolio return volatility, monthly rebalance",
		pass: Math.abs(moments.portReturnVol - sigPortM) < zCrit * seStdP,
		expected: `${sigPortM.toFixed(6)} ± ${(zCrit * seStdP).toExponential(3)}`,
		actual: moments.portReturnVol.toFixed(6)
	});
	const drift = runMonteCarlo(sim({
		seed: 1,
		nPaths: 8,
		nMonths: 36,
		startWealth: 6e5,
		weights: [
			1 / 6,
			1 / 6,
			1 / 6,
			1 / 6,
			1 / 6,
			1 / 6
		],
		mu: [
			.3,
			0,
			0,
			0,
			0,
			0
		],
		vol: [
			0,
			0,
			0,
			0,
			0,
			0
		],
		rebalance: "none",
		engine: "assets"
	}));
	const w0 = drift.meanWeightsByYear[0][0];
	const wEnd = drift.meanWeightsByYear[drift.meanWeightsByYear.length - 1][0];
	tests.push({
		id: "g.drift",
		group: "g. Weight drift without rebalancing",
		name: "Higher-return asset’s weight rises when holdings are left to drift",
		pass: wEnd > w0 + .05,
		expected: `w_end > w_0 + 0.05  (w_0=${w0.toFixed(4)})`,
		actual: `w_end=${wEnd.toFixed(4)}`
	});
	const household = DEMO_CLIENTS[0];
	const whatIf = {
		...defaultWhatIf(household.fee),
		rebalance: "monthly"
	};
	const demoInput = buildSimInput(household, cma, whatIf, N_PATHS);
	runMonteCarlo({
		...demoInput,
		nPaths: 32,
		engine: "assets",
		rebalance: "monthly"
	});
	const demoAssets = runMonteCarlo({
		...demoInput,
		engine: "assets",
		rebalance: "monthly"
	});
	const runtimeMs = demoAssets.runtimeMs;
	const demoShock = runMonteCarlo({
		...demoInput,
		engine: "legacyShock",
		rebalance: "monthly"
	});
	const retId = household.goals[0]?.id;
	const pNew = demoAssets.goals.find((g) => g.goalId === retId)?.successRate ?? demoAssets.goals[0]?.successRate ?? 0;
	const pOld = demoShock.goals.find((g) => g.goalId === retId)?.successRate ?? demoShock.goals[0]?.successRate ?? 0;
	const nP = N_PATHS;
	const seDiff = Math.sqrt((pNew * (1 - pNew) + pOld * (1 - pOld)) / nP);
	const tol = 4 * Math.max(seDiff, 1 / nP);
	tests.push({
		id: "h.agree",
		group: "h. Assets engine vs legacy single-shock",
		name: `${household.name} retirement success, monthly rebalance, ${nP} paths`,
		pass: Math.abs(pNew - pOld) < tol,
		expected: `|Δ| < ${tol.toExponential(3)}  (legacy ${pOld.toFixed(4)})`,
		actual: `assets ${pNew.toFixed(4)}  (Δ=${(pNew - pOld).toFixed(4)})`
	});
	tests.push({
		id: "i.runtime",
		group: "i. Runtime",
		name: `10,000-path household simulation (monthly, six-asset Cholesky) finishes in < 1 s`,
		pass: runtimeMs < 1e3,
		expected: "< 1000 ms",
		actual: `${runtimeMs.toFixed(1)} ms`
	});
	const tPdf = typeof performance !== "undefined" ? performance.now() : Date.now();
	const pdfBuilt = buildProposalPdf({
		profile: household,
		cma,
		whatIf,
		privacy: false,
		result: demoAssets,
		baseline: demoAssets,
		nPaths: N_PATHS,
		asOf: "2026-09-10"
	});
	const pdfMs = (typeof performance !== "undefined" ? performance.now() : Date.now()) - tPdf;
	tests.push({
		id: "j.pdf",
		group: "j. Performance",
		name: "Proposal PDF from a precomputed 10,000-path result finishes in < 500 ms",
		pass: pdfMs < 500 && pdfBuilt.bytes.length > 800,
		expected: "< 500 ms",
		actual: `${pdfMs.toFixed(1)} ms · ${pdfBuilt.bytes.length} bytes`
	});
	const imp = timeImport100k();
	tests.push({
		id: "j.import100k",
		group: "j. Performance",
		name: "Importing 100,000 Nordnet rows finishes in < 2 s",
		pass: imp.ms < 2e3 && imp.created === 1e5,
		expected: "< 2000 ms, 100000 created",
		actual: `${imp.ms.toFixed(1)} ms · created ${imp.created} · read ${imp.rowsRead}`
	});
	const parsed = timeParse100kFile();
	tests.push({
		id: "j.parse100k",
		group: "j. Performance",
		name: "Parsing a 100,000-row Nordnet file finishes in < 2 s",
		pass: parsed.ms < 2e3 && parsed.rowsRead === 1e5,
		expected: "< 2000 ms, 100000 rows",
		actual: `${parsed.ms.toFixed(1)} ms · rows ${parsed.rowsRead} · ${parsed.bytes} bytes`
	});
	tests.push(...runLedgerDiagnostics());
	tests.push(...runStage3Diagnostics());
	tests.push(...runPdfDiagnostics());
	tests.push(...runStage5Diagnostics());
	tests.push(...runFuzzDiagnostics());
	return tests;
}
var PERF_IDS = [
	"i.runtime",
	"j.pdf",
	"j.import100k",
	"j.parse100k"
];
var PERF_META = {
	"i.runtime": {
		title: "10,000-path planning simulation",
		target: "< 1 s"
	},
	"j.pdf": {
		title: "Proposal PDF",
		target: "< 500 ms"
	},
	"j.import100k": {
		title: "100,000-row import",
		target: "< 2 s"
	},
	"j.parse100k": {
		title: "100,000-row Nordnet file parse",
		target: "< 2 s"
	}
};
function DiagnosticsPage() {
	const [nonce, setNonce] = (0, import_react.useState)(0);
	const [tests, setTests] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		setTests(null);
		const handle = window.setTimeout(() => setTests(runDiagnostics()), 0);
		return () => window.clearTimeout(handle);
	}, [nonce]);
	const groups = tests ? group(tests) : [];
	const pass = tests ? tests.filter((t) => t.pass).length : 0;
	const perf = tests ? PERF_IDS.map((id) => tests.find((t) => t.id === id)).filter(Boolean) : [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "kicker mb-2",
				children: "Verification"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-6 flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-medium tracking-tight",
					children: "Diagnostics"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "Built-in suite. Every number below is computed in this browser from the same engine the planner uses."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-11 rounded-md border border-border px-4 text-sm",
					onClick: () => setNonce((n) => n + 1),
					children: "Re-run"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("mb-6 rounded-lg border px-4 py-4 font-mono text-sm tabular-nums", !tests ? "border-border text-muted" : pass === tests.length ? "border-ok/40 text-ok" : "border-danger/40 text-danger"),
				children: tests ? `${pass} / ${tests.length} passed` : "Running the engine suite — 100,000-input fuzz, a 100,000-row import and file parse, and the planner identities…"
			}),
			tests && perf.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mb-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-3 text-sm font-medium text-fg",
						children: "Performance"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-3 text-sm text-muted",
						children: "Measured in this run. Targets are budgets, not promises — the Actual column is the honest number."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
						children: perf.map((t) => {
							const meta = PERF_META[t.id];
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: cn("rounded-lg border px-4 py-3", t.pass ? "border-ok/40" : "border-danger/40"),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs text-muted",
										children: meta?.title ?? t.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: cn("mt-1 font-mono text-lg tabular-nums", t.pass ? "text-ok" : "text-danger"),
										children: t.actual.split("·")[0].trim()
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-1 text-xs text-muted",
										children: [
											"target ",
											meta?.target ?? t.expected,
											t.actual.includes("·") ? ` · ${t.actual.split("·").slice(1).join("·").trim()}` : ""
										]
									})
								]
							}, t.id);
						})
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col gap-8",
				children: groups.map(([name, rows]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-3 text-sm font-medium text-fg",
					children: name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto rounded-lg border border-border",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-[40rem] text-left text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border text-xs text-muted",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 font-medium",
									children: "Test"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 font-medium",
									children: "Result"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 font-medium",
									children: "Expected"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 font-medium",
									children: "Actual"
								})
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border last:border-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 align-top text-fg",
									children: t.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: cn("px-3 py-2 align-top font-mono text-xs", t.pass ? "text-ok" : "text-danger"),
									children: t.pass ? "PASS" : "FAIL"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 align-top font-mono text-xs text-muted",
									children: t.expected
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 align-top font-mono text-xs text-fg",
									children: t.actual
								})
							]
						}, t.id)) })]
					})
				})] }, name))
			})
		]
	});
}
function group(tests) {
	const map = /* @__PURE__ */ new Map();
	for (const t of tests) {
		const list = map.get(t.group) ?? [];
		list.push(t);
		map.set(t.group, list);
	}
	return [...map.entries()];
}
//#endregion
export { DiagnosticsPage as component };
