import type { Program } from "./ast";
import { CompileError, isCompileError } from "./errors";
import { check, requiredLookback } from "./checker";
import { parse } from "./parser";

export function compile(source: string): Program {
  const program = parse(source);
  check(program);
  requiredLookback(program);
  return program;
}

export function tryCompile(source: string): { ok: true; program: Program } | { ok: false; error: CompileError } {
  try {
    return { ok: true, program: compile(source) };
  } catch (e) {
    if (isCompileError(e)) return { ok: false, error: e };
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: new CompileError(msg, 1, 1, 2) };
  }
}
