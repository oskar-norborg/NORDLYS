import { createFileRoute } from "@tanstack/react-router";
import { RiskPage } from "@/components/risk/risk-page";

export const Route = createFileRoute("/risk")({ component: RiskRoute });

function RiskRoute() {
  return <RiskPage />;
}
