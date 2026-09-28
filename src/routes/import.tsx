import { createFileRoute } from "@tanstack/react-router";
import { ImportPage } from "@/components/import/import-page";

export const Route = createFileRoute("/import")({ component: ImportRoute });

function ImportRoute() {
  return <ImportPage />;
}
