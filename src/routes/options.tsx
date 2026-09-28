import { createFileRoute } from "@tanstack/react-router";
import { OptionsPage } from "@/components/options/options-page";

export const Route = createFileRoute("/options")({ component: OptionsRoute });

function OptionsRoute() {
  return <OptionsPage />;
}
