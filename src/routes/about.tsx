import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({ component: AboutPage });

function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="kicker mb-2">Method</div>
      <h1 className="text-2xl font-medium tracking-tight">About NORDLYS</h1>
      <p className="mt-4 text-sm leading-relaxed text-fg">
        I designed and directed NORDLYS. Oskar Norborg. Grok wrote most of the code in Grok Build Mode, under that direction.
      </p>
      <div className="mt-6 flex flex-col gap-5 text-sm leading-relaxed text-muted">
        <p>
          A private wealth planner. Client planning, Nordnet import, holdings, risk analytics (covariance, VaR,
          drawdowns, an in-house mean-variance solver), a Black–Scholes options book, and a historical backtester
          all run in this browser.
        </p>
        <section>
          <h2 className="mb-2 text-fg">What it does</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>10,000-path monthly Monte Carlo on five model books</li>
            <li>Nordnet import (UTF-16 LE, 30 columns) with a review queue</li>
            <li>Holdings, FIFO or average cost, TWR and XIRR</li>
            <li>Risk: covariance, VaR/ES, drawdowns, frontier, Black–Litterman</li>
            <li>Options: Black–Scholes, implied vol, American tree, seeded Monte Carlo</li>
            <li>Historical backtester with Pine-style history, sweeps and walk-forward</li>
            <li>Client proposal and portfolio report as PDF 1.4</li>
          </ul>
        </section>
        <section>
          <h2 className="mb-2 text-fg">Data stays here</h2>
          <p>
            All client data is stored in this browser’s localStorage. The application does not send household
            figures, answers, imports, or simulation results anywhere. Demo mode is the default. Privacy Mode
            replaces every currency amount with a mask and shows indexed values (start = 100) and percentages —
            intended for screenshots.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-fg">Risk profile</h2>
          <p>
            Twelve questions, scored 1–5. The first six average to willingness (tolerance); the last six to
            ability (capacity). Each average is rounded to an integer in 1–5. The book is the minimum of the two,
            with a plain-language rationale. A what-if control can override the book without rewriting the
            questionnaire.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-fg">Capital markets</h2>
          <p>
            Five model portfolios are solved from the capital-market assumptions with a long-only active-set
            quadratic programme (per-asset and group caps). Expected returns, volatilities, the correlation
            matrix, and inflation remain editable. Monthly steps use μ/12 and σ/√12. Correlated normals are
            formed from the Cholesky factor L of the correlation matrix: r = μ + σ ⊙ Lz, z ~ N(0, I).
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-fg">Monte Carlo</h2>
          <p>
            10,000 paths, monthly, seeded with xoshiro256** (SplitMix64 seed). Contributions run until each
            member's retirement; retirement income (today's currency, inflated) starts when the last
            member has retired. Home and education goals are lump sums in priority order; a bequest is tested at
            the plan horizon (age 95). The same return draws are applied with and without the advisory fee so the
            fee panel is a pure cost comparison. Randomness is never taken from Math.random.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-fg">Portfolio import</h2>
          <p>
            Nordnet “Transaksjoner og notaer” files are decoded in this browser (UTF-16 LE with BOM, tabs, 30
            columns, duplicate Valuta fields). Unrecognized types go to a review queue; mappings persist.
            Duplicate Ids are skipped. Saldo and Totalt antall are recomputed. Holdings use FIFO or average
            cost, with P&L split into price and currency. Time-weighted return is linked sub-period;
            money-weighted return is XIRR. Demo mode writes a synthetic Nordnet file and imports it through
            the same pipeline.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-fg">Risk</h2>
          <p>
            Covariance is sample, EWMA, or Ledoit–Wolf shrinkage toward constant correlation. VaR and expected
            shortfall are historical, parametric normal, Cornish–Fisher, or Monte Carlo. Drawdowns, Sharpe,
            Sortino, Calmar, beta, tracking error and information ratio are computed from the book’s NAV.
            Stresses are instantaneous asset and FX shocks on current holdings. The efficient frontier, risk
            parity and Black–Litterman views share the same quadratic solver as the planner’s model books.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-fg">Options</h2>
          <p>
            Black–Scholes–Merton with a continuous dividend yield, live Greeks, and an implied-volatility
            Newton solver with bisection fallback. American exercise uses a CRR binomial tree. The Monte Carlo
            pricer uses antithetic variates and a discounted-spot control variate, seeded with xoshiro256**.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-fg">Backtest</h2>
          <p>
            Strategies are written in a small language (indicators, comparisons, and/or/not, if/else,
            target_weight). Series history follows Pine Script: close is this bar, close[1] the previous close,
            close[2] two bars ago. Negative offsets are a parse error, so the series cannot read the future.
            Signals use that session’s close; fills occur at the next trading day’s price. Costs, slippage and cash yield
            apply in NOK; USD names are converted on each date with imported FX. Demo mode supplies seeded OHLC
            for MSFT, KOG, MOWI and DNB. My Data runs only on imported price history — missing tickers are listed,
            never filled in. Parameter sweeps and walk-forward windows run in Web Workers.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-fg">Documents</h2>
          <p>
            Client proposals and portfolio reports are written as PDF 1.4 in this browser — objects, a cross-reference
            table, Helvetica with WinAnsi (including æ ø å), and vector charts. Privacy Mode applies to the file.
            Projections in a proposal are hypothetical and not guaranteed.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-fg">Reproducibility</h2>
          <p>
            Each household carries an integer seed. The same seed, cashflows, and assumptions produce the same
            paths. The Diagnostics page re-runs identities: the zero-volatility future-value formula, the 25
            risk-profile combinations, Cholesky reconstruction, PRNG streams, simulated means and volatilities
            against sample-size tolerances, a 100,000-input fuzz of the parsers, and timed 10,000-path, PDF and
            100,000-row import runs.
          </p>
        </section>
      </div>
    </div>
  );
}
