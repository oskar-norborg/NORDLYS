import { useEffect, useMemo, useRef, type KeyboardEvent } from "react";
import { tryCompile, type CompileError } from "@/engine/strategy";
import { cn } from "@/lib/utils";

const FNS = new Set(["sma", "ema", "rsi", "stdev", "momentum", "count"]);
const KWS = new Set([
  "universe",
  "rebalance",
  "monthly",
  "weekly",
  "daily",
  "for",
  "each",
  "asset",
  "if",
  "else",
  "and",
  "or",
  "not",
  "target_weight",
  "rebalance_to",
  "exit",
  "param",
]);
const SERIES = new Set(["close", "open", "high", "low", "volume", "signals"]);

type Seg = { text: string; cls: string };

function classifyIdent(name: string): string {
  if (KWS.has(name)) return "tok-kw";
  if (FNS.has(name) || SERIES.has(name)) return "tok-fn";
  return "tok-id";
}

function highlight(source: string, err: CompileError | null): Seg[][] {
  const lines = source.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  return lines.map((line, idx) => {
    const segs: Seg[] = [];
    let i = 0;
    const ln = idx + 1;
    const push = (text: string, cls: string, startCol: number) => {
      if (!text) return;
      const endCol = startCol + text.length;
      const hit =
        err &&
        err.line === ln &&
        err.col <= endCol &&
        err.endCol > startCol &&
        text.trim().length > 0;
      segs.push({ text, cls: hit ? `${cls} tok-err`.trim() : cls });
    };
    while (i < line.length) {
      const col = i + 1;
      const c = line[i]!;
      if (c === "#" || (c === "/" && line[i + 1] === "/")) {
        push(line.slice(i), "tok-cmt", col);
        break;
      }
      if (c === " " || c === "\t") {
        let j = i;
        while (j < line.length && (line[j] === " " || line[j] === "\t")) j += 1;
        push(line.slice(i, j), "", col);
        i = j;
        continue;
      }
      if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(line[i + 1] ?? ""))) {
        let j = i;
        while (j < line.length && /[0-9]/.test(line[j]!)) j += 1;
        if (line[j] === ".") {
          j += 1;
          while (j < line.length && /[0-9]/.test(line[j]!)) j += 1;
        }
        push(line.slice(i, j), "tok-num", col);
        i = j;
        continue;
      }
      if (/[A-Za-z_]/.test(c)) {
        let j = i;
        while (j < line.length && /[A-Za-z0-9_]/.test(line[j]!)) j += 1;
        const id = line.slice(i, j);
        push(id, classifyIdent(id), col);
        i = j;
        continue;
      }
      if ((c === ">" || c === "<" || c === "=" || c === "!") && line[i + 1] === "=") {
        push(line.slice(i, i + 2), "tok-op", col);
        i += 2;
        continue;
      }
      push(c, "tok-op", col);
      i += 1;
    }
    if (!segs.length) segs.push({ text: " ", cls: "" });
    return segs;
  });
}

export function StrategyEditor({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error: CompileError | null;
}) {
  const compiled = useMemo(() => tryCompile(value), [value]);
  const err = error ?? (compiled.ok ? null : compiled.error);
  const lines = highlight(value, err);
  const preRef = useRef<HTMLPreElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ta = taRef.current;
    const pre = preRef.current;
    const gutter = gutterRef.current;
    if (!ta || !pre) return;
    const sync = () => {
      pre.scrollTop = ta.scrollTop;
      pre.scrollLeft = ta.scrollLeft;
      if (gutter) gutter.scrollTop = ta.scrollTop;
    };
    ta.addEventListener("scroll", sync);
    return () => ta.removeEventListener("scroll", sync);
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const el = e.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = value.slice(0, start) + "  " + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + 2;
    });
  };

  const nLines = Math.max(1, value.split("\n").length);

  return (
    <div className="strategy-editor rounded-lg border border-border bg-surface-2">
      <div ref={gutterRef} className="strategy-gutter" aria-hidden>
        {Array.from({ length: nLines }, (_, i) => (
          <div key={i} className={cn("strategy-ln", err && err.line === i + 1 && "text-danger")}>
            {i + 1}
          </div>
        ))}
      </div>
      <div className="strategy-code">
        <pre ref={preRef} className="strategy-pre" aria-hidden>
          {lines.map((segs, i) => (
            <div key={i} className="strategy-line">
              {segs.map((s, j) => (
                <span key={j} className={s.cls}>
                  {s.text}
                </span>
              ))}
              {"\n"}
            </div>
          ))}
        </pre>
        <textarea
          ref={taRef}
          className="strategy-textarea"
          value={value}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label="Strategy source"
        />
      </div>
    </div>
  );
}

export function ErrorBanner({ error }: { error: CompileError | null }) {
  if (!error) return null;
  return (
    <div className="rounded-md border border-danger/40 bg-surface px-3 py-2 font-mono text-xs text-danger">
      line {error.line}, col {error.col}: {error.message}
    </div>
  );
}
