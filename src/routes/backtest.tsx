import { createFileRoute } from "@tanstack/react-router";
import { BacktestPage } from "@/components/backtest/backtest-page";

export const Route = createFileRoute("/backtest")({ component: BacktestRoute });

function BacktestRoute() {
  return <BacktestPage />;
}
