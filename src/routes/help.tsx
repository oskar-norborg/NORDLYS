import { createFileRoute, Link } from "@tanstack/react-router";
import { requestShowTour } from "@/components/shell/show-tour";

export const Route = createFileRoute("/help")({ component: HelpPage });

function HelpPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="kicker mb-2">Guide</div>
      <h1 className="text-2xl font-medium tracking-tight">Help</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        NORDLYS is a private wealth planner that runs in this browser. Nothing is uploaded. This page is the
        written guide for someone who does not write code.
      </p>
      <button
        type="button"
        onClick={requestShowTour}
        className="mt-4 inline-flex h-11 items-center rounded-md border border-border px-4 text-sm text-fg"
      >
        Show this
      </button>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Six stops: the plan, the book, the risk, a strategy replay, a Nordnet file, and why the figures stay
        in this browser. The same button is at the bottom of the sidebar, and in search as “Show this”.
      </p>

      <div className="mt-8 flex flex-col gap-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="mb-2 text-fg">Demo, My Data, and Privacy</h2>
          <p>
            <span className="text-fg">Demo</span> is a sample household (Emilie and the others) plus a sample
            Nordnet file. Use it to click around without touching your own figures.
          </p>
          <p className="mt-2">
            <span className="text-fg">My Data</span> is your copy. Household answers, imports, and price files
            stay in this browser only. Copy a demo plan or ledger into My Data when you want a starting point,
            then edit it.
          </p>
          <p className="mt-2">
            <span className="text-fg">Privacy</span> hides kroner amounts and shows an index that starts at 100,
            plus percentages. Turn it on before a screenshot or a shared screen.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-fg">Export transactions from Nordnet</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Sign in to Nordnet in a desktop browser.</li>
            <li>
              Open <span className="text-fg">Transaksjoner og notaer</span> (Transactions and contract notes).
            </li>
            <li>
              Choose the account and date range you want, then download / export. Nordnet usually gives a text
              file (often opened as .xls) with tab-separated columns and Norwegian headers — Id, Bokføringsdag,
              Handelsdag, and so on.
            </li>
            <li>Save the file. Do not re-save it from Excel as a new workbook if you can avoid it.</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-2 text-fg">Import that file</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Open <Link to="/import" className="text-accent">Import</Link>.
            </li>
            <li>Drop the file on the dashed box, or tap Choose file. Parsing happens here — the file is not sent away.</li>
            <li>
              Read the import report: rows created, duplicates skipped, cancelled lines (Makuleringsdato) left
              out. Demo has a sample export you can load or download if you want to see a clean run first.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-2 text-fg">The review queue</h2>
          <p>
            If Nordnet used a transaction type NORDLYS does not recognise, that line is not dropped. It waits in
            the review queue. Pick a type once (buy, dividend, fee, and so on). The mapping is remembered in this
            browser and reused on the next file. When the queue is empty, every recognised type is already in the
            ledger.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-fg">Price history, NAV, FX, benchmarks</h2>
          <p>
            Holdings need a price or fund NAV series to mark to market. A generic CSV is enough: a date column
            and a close / NAV column. US dates and dollar signs, or European decimal commas, both work. Mutual-fund
            NAV files with no open/high/low are first-class.
          </p>
          <ol className="mt-2 list-decimal space-y-2 pl-5">
            <li>On Import, pick the ISIN, then Import prices / NAV.</li>
            <li>
              USD names also need an FX series (USDNOK). Without it the holding is marked stale, never invented.
            </li>
            <li>
              In My Data, benchmark lines appear only after you import them. Demo can supply sample prices so
              Risk and Backtest have something to plot.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-2 text-fg">The planner</h2>
          <p>
            <Link to="/" className="text-accent">Planner</Link> is the client page. Members, income, savings rate, goals, and twelve risk
            questions set the book. A 10,000-path monthly simulation then reports the chance each goal is met.
            The what-if sliders (save more, retire later, fee, risk book) re-run the same seed so the comparison
            is fair.
          </p>
          <p className="mt-2">
            On Portfolio, Use as client copies the imported market value into the plan. Gap then compares the
            live book to the model book.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-fg">The proposal PDF</h2>
          <p>
            On the planner, Download proposal PDF writes a client letter in this browser (PDF 1.4, including æ ø
            å). Privacy Mode applies to the file. Projections are hypothetical and not a guarantee. A portfolio
            report is available from Portfolio once a ledger exists.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-fg">Backtest, in brief</h2>
          <p>
            Backtest replays a small strategy language on price history. close is this session; close[1] is
            yesterday. A signal uses that day’s close; the fill is the next session. Demo supplies MSFT, KOG,
            MOWI and DNB. My Data runs only on imported history — missing tickers are listed, never filled in.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-fg">If something looks empty</h2>
          <p>
            Portfolio and Risk ask for a ledger first. Backtest in My Data asks for price history. Diagnostics
            re-runs the built-in identities — including a 100,000-input fuzz of the parsers — and reports every
            result in this browser.
          </p>
        </section>
      </div>
    </div>
  );
}