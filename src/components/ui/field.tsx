import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/engine/format";
import type { CurrencyCode } from "@/engine/types";

export function Field({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span className="text-xs font-medium tracking-wide text-muted uppercase">{label}</span>
      {children}
      {hint ? <span className="text-xs text-subtle">{hint}</span> : null}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("field-input", props.className)} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn("field-input appearance-none pr-8", props.className)}
      style={{
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='%238b958f' d='M1 1l5 5 5-5'/></svg>")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
      }}
    />
  );
}

export function MoneyInput({
  value,
  onChange,
  currency,
  privacy,
  min = 0,
  step = 1000,
}: {
  value: number;
  onChange: (n: number) => void;
  currency: CurrencyCode;
  privacy: boolean;
  min?: number;
  step?: number;
}) {
  if (privacy) {
    return (
      <div className="field-input flex items-center text-muted" aria-label="Hidden by privacy mode">
        {formatMoney(value, currency, true)}
      </div>
    );
  }
  return (
    <TextInput
      type="number"
      min={min}
      step={step}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

export function SliderRow({
  label,
  valueLabel,
  min,
  max,
  step,
  value,
  onChange,
  onLiveStart,
  onLiveEnd,
}: {
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (n: number) => void;
  onLiveStart?: () => void;
  onLiveEnd?: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-fg">{label}</span>
        <span className="font-mono text-sm tabular-nums text-accent">{valueLabel}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onPointerDown={() => {
          onLiveStart?.();
          const up = () => {
            onLiveEnd?.();
            window.removeEventListener("pointerup", up);
            window.removeEventListener("pointercancel", up);
          };
          window.addEventListener("pointerup", up);
          window.addEventListener("pointercancel", up);
        }}
        onInput={(e) => onChange(Number((e.target as HTMLInputElement).value))}
        className="h-11 w-full accent-accent"
        aria-label={label}
      />
    </div>
  );
}

export function Panel({
  title,
  kicker,
  action,
  children,
  id,
}: {
  title: string;
  kicker?: string;
  action?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="panel p-5 sm:p-6">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          {kicker ? <div className="kicker mb-1">{kicker}</div> : null}
          <h2 className="text-base font-medium tracking-tight text-fg">{title}</h2>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
