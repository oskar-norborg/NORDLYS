import { useState } from "react";
import { downloadPdf } from "@/engine/pdf/download";
import type { BuiltPdf } from "@/engine/pdf";
import { cn } from "@/lib/utils";

export function PdfDownloadButton({
  label,
  build,
  disabled,
}: {
  label: string;
  build: () => BuiltPdf;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={disabled || busy}
        className={cn(
          "inline-flex h-11 items-center rounded-md border px-4 text-sm",
          disabled ? "border-border text-subtle" : "border-accent text-accent",
        )}
        onClick={() => {
          setErr(null);
          setBusy(true);
          window.setTimeout(() => {
            try {
              const pdf = build();
              downloadPdf(pdf.bytes, pdf.fileName);
            } catch (e) {
              setErr(e instanceof Error ? e.message : String(e));
            } finally {
              setBusy(false);
            }
          }, 20);
        }}
      >
        {busy ? "Building PDF…" : label}
      </button>
      {err ? <span className="text-xs text-danger">{err}</span> : null}
    </div>
  );
}
