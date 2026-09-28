import type { Expr, Program, Stmt } from "./ast";
import { CompileError } from "./errors";

const SERIES_FIELDS = new Set(["close", "open", "high", "low", "volume"]);
const INDICATORS = new Set(["sma", "ema", "rsi", "stdev", "momentum"]);

export type Ty = "num" | "bool" | "series" | "signals";

function tyOf(expr: Expr, params: Set<string>): Ty {
  switch (expr.kind) {
    case "num":
      return "num";
    case "id": {
      if (SERIES_FIELDS.has(expr.name)) return "series";
      if (expr.name === "signals") return "signals";
      if (expr.name === "asset") return "num";
      if (params.has(expr.name)) return "num";
      throw new CompileError(`Unknown name '${expr.name}'`, expr.span.line, expr.span.col, expr.span.endCol, "type");
    }
    case "index": {
      const obj = tyOf(expr.object, params);
      if (obj !== "series") {
        throw new CompileError("Only a price series can be indexed", expr.span.line, expr.span.col, expr.span.endCol, "type");
      }
      const idx = tyOf(expr.index, params);
      if (idx !== "num") {
        throw new CompileError("Series index must be a number", expr.index.span.line, expr.index.span.col, expr.index.span.endCol, "type");
      }
      if (isNegativeOffset(expr.index)) {
        throw new CompileError(
          "offsets look back in time; negative values are not allowed",
          expr.index.span.line,
          expr.index.span.col,
          expr.index.span.endCol,
        );
      }
      return "num";
    }
    case "call": {
      if (INDICATORS.has(expr.name)) {
        if (expr.args.length !== 2) {
          throw new CompileError(`${expr.name}() takes a series and a period`, expr.span.line, expr.span.col, expr.span.endCol, "type");
        }
        const a0 = tyOf(expr.args[0]!, params);
        const a1 = tyOf(expr.args[1]!, params);
        if (a0 !== "series") {
          throw new CompileError(`${expr.name}() first argument must be a series such as close`, expr.args[0]!.span.line, expr.args[0]!.span.col, expr.args[0]!.span.endCol, "type");
        }
        if (a1 !== "num") {
          throw new CompileError(`${expr.name}() period must be a number`, expr.args[1]!.span.line, expr.args[1]!.span.col, expr.args[1]!.span.endCol, "type");
        }
        return "num";
      }
      if (expr.name === "count") {
        if (expr.args.length !== 1) {
          throw new CompileError("count() takes signals", expr.span.line, expr.span.col, expr.span.endCol, "type");
        }
        const a0 = tyOf(expr.args[0]!, params);
        if (a0 !== "signals") {
          throw new CompileError("count() expects signals", expr.args[0]!.span.line, expr.args[0]!.span.col, expr.args[0]!.span.endCol, "type");
        }
        return "num";
      }
      throw new CompileError(`Unknown function '${expr.name}'`, expr.span.line, expr.span.col, expr.span.endCol, "type");
    }
    case "un": {
      const inner = tyOf(expr.expr, params);
      if (expr.op === "not") {
        if (inner !== "bool") {
          throw new CompileError("not expects a boolean", expr.span.line, expr.span.col, expr.span.endCol, "type");
        }
        return "bool";
      }
      if (inner === "series") return "num";
      if (inner !== "num") {
        throw new CompileError("Unary minus expects a number", expr.span.line, expr.span.col, expr.span.endCol, "type");
      }
      return "num";
    }
    case "bin": {
      const l = coerceScalar(tyOf(expr.left, params), expr.left);
      const r = coerceScalar(tyOf(expr.right, params), expr.right);
      if (expr.op === "and" || expr.op === "or") {
        if (l !== "bool" || r !== "bool") {
          throw new CompileError(`${expr.op} expects booleans`, expr.span.line, expr.span.col, expr.span.endCol, "type");
        }
        return "bool";
      }
      if (expr.op === ">" || expr.op === "<" || expr.op === ">=" || expr.op === "<=" || expr.op === "==" || expr.op === "!=") {
        if (l !== "num" || r !== "num") {
          throw new CompileError(`Comparison expects numbers`, expr.span.line, expr.span.col, expr.span.endCol, "type");
        }
        return "bool";
      }
      if (l !== "num" || r !== "num") {
        throw new CompileError(`Arithmetic expects numbers`, expr.span.line, expr.span.col, expr.span.endCol, "type");
      }
      return "num";
    }
    default:
      return "num";
  }
}

function isNegativeOffset(expr: Expr): boolean {
  if (expr.kind === "num") return expr.value < 0;
  if (expr.kind === "un" && expr.op === "neg") return true;
  return false;
}

function coerceScalar(t: Ty, expr: Expr): Ty {
  if (t === "series") return "num";
  if (t === "signals") {
    throw new CompileError("signals can only be used as count(signals)", expr.span.line, expr.span.col, expr.span.endCol, "type");
  }
  return t;
}

function checkStmt(stmt: Stmt, params: Set<string>): void {
  switch (stmt.kind) {
    case "if": {
      const c = coerceScalar(tyOf(stmt.cond, params), stmt.cond);
      if (c !== "bool") {
        throw new CompileError("if condition must be boolean", stmt.cond.span.line, stmt.cond.span.col, stmt.cond.span.endCol, "type");
      }
      for (const s of stmt.then) checkStmt(s, params);
      if (stmt.else) for (const s of stmt.else) checkStmt(s, params);
      return;
    }
    case "target":
    case "rebalance_to": {
      const t = coerceScalar(tyOf(stmt.expr, params), stmt.expr);
      if (t !== "num") {
        throw new CompileError("Weight must be a number", stmt.expr.span.line, stmt.expr.span.col, stmt.expr.span.endCol, "type");
      }
      return;
    }
    case "exit":
      return;
  }
}

export function check(program: Program): void {
  if (program.universe.length === 0) {
    throw new CompileError("Universe cannot be empty", 1, 1, 2, "type");
  }
  const params = new Set(program.params.map((p) => p.name));
  const seen = new Set<string>();
  for (const p of program.params) {
    if (seen.has(p.name)) {
      throw new CompileError(`Duplicate param '${p.name}'`, p.span.line, p.span.col, p.span.endCol, "type");
    }
    seen.add(p.name);
  }
  for (const s of program.body) checkStmt(s, params);
}

/** Greatest lookback (in bars) required by the program. */
export function requiredLookback(program: Program, paramValues?: Record<string, number>): number {
  const env: Record<string, number> = {};
  for (const p of program.params) env[p.name] = paramValues?.[p.name] ?? p.value;
  let max = 0;
  const walk = (e: Expr): void => {
    if (e.kind === "call" && INDICATORS.has(e.name) && e.args[1]) {
      const per = evalNum(e.args[1], env);
      if (e.name === "rsi" || e.name === "momentum") max = Math.max(max, per);
      else max = Math.max(max, per - 1);
    }
    if (e.kind === "index") {
      const off = evalNum(e.index, env);
      if (off < 0) {
        throw new CompileError(
          "offsets look back in time; negative values are not allowed",
          e.index.span.line,
          e.index.span.col,
          e.index.span.endCol,
        );
      }
      max = Math.max(max, off);
    }
    if (e.kind === "bin") {
      walk(e.left);
      walk(e.right);
    }
    if (e.kind === "un") walk(e.expr);
    if (e.kind === "call") for (const a of e.args) walk(a);
    if (e.kind === "index") {
      walk(e.object);
      walk(e.index);
    }
  };
  const walkStmt = (s: Stmt): void => {
    if (s.kind === "if") {
      walk(s.cond);
      s.then.forEach(walkStmt);
      s.else?.forEach(walkStmt);
    }
    if (s.kind === "target" || s.kind === "rebalance_to") walk(s.expr);
  };
  program.body.forEach(walkStmt);
  return max;
}

function evalNum(e: Expr, env: Record<string, number>): number {
  if (e.kind === "num") return e.value;
  if (e.kind === "id" && env[e.name] != null) return env[e.name]!;
  if (e.kind === "un" && e.op === "neg") return -evalNum(e.expr, env);
  if (e.kind === "bin" && (e.op === "+" || e.op === "-" || e.op === "*" || e.op === "/")) {
    const l = evalNum(e.left, env);
    const r = evalNum(e.right, env);
    if (e.op === "+") return l + r;
    if (e.op === "-") return l - r;
    if (e.op === "*") return l * r;
    return r === 0 ? 0 : l / r;
  }
  return 0;
}
