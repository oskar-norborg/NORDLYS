export class CompileError extends Error {
  readonly line: number;
  readonly col: number;
  readonly endCol: number;
  readonly code: "parse" | "type" | "lookahead";

  constructor(
    message: string,
    line: number,
    col: number,
    endCol: number,
    code: "parse" | "type" | "lookahead" = "parse",
  ) {
    super(message);
    this.name = "CompileError";
    this.line = line;
    this.col = col;
    this.endCol = Math.max(endCol, col + 1);
    this.code = code;
  }
}

export function isCompileError(e: unknown): e is CompileError {
  return e instanceof CompileError;
}
