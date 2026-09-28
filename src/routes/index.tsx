import { createFileRoute } from "@tanstack/react-router";
import { PlannerPage } from "@/components/planner/planner-page";

export const Route = createFileRoute("/")({ component: Planner });

function Planner() {
  return <PlannerPage />;
}
