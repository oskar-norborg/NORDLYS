import { CompileError } from "./errors";

export type TokKind =
  | "IDENT"
  | "NUMBER"
  | "NEWLINE"
  | "INDENT"
  | "DEDENT"
  | "EOF"
  | "LBRACK"
  | "RBRACK"
  | "LPAREN"
  | "RPAREN"
  | "COMMA"
  | "COLON"
  | "PLUS"
  | "MINUS"
  | "STAR"
  | "SLASH"
  | "GT"
  | "LT"
  | "GE"
  | "LE"
  | "EQ"
  | "NE"
  | "ASSIGN";

export interface Token {
  kind: TokKind;
  value: string;
  line: number;
  col: number;
  endCol: number;
}

const PUNCT: Record<string, TokKind> = {
  "[": "LBRACK",
  "]": "RBRACK",
  "(": "LPAREN",
  ")": "RPAREN",
  ",": "COMMA",
  ":": "COLON",
  "+": "PLUS",
  "-": "MINUS",
  "*": "STAR",
  "/": "SLASH",
};

export function tokenize(source: string): Token[] {
  const src = source.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const tokens: Token[] = [];
  const indents = [0];
  let i = 0;
  let line = 1;
  let col = 1;

  const emit = (kind: TokKind, value: string, startCol: number, endCol: number, ln = line): void => {
    tokens.push({ kind, value, line: ln, col: startCol, endCol });
  };

  const isIdentStart = (c: string) => /[A-Za-z_]/.test(c);
  const isIdent = (c: string) => /[A-Za-z0-9_]/.test(c);

  const skipComment = (): void => {
    while (i < src.length && src[i] !== "\n") {
      i += 1;
      col += 1;
    }
  };

  const atLineStart = (): boolean => {
    return i === 0 || src[i - 1] === "\n";
  };

  const restOfLineIsBlank = (from: number): boolean => {
    let j = from;
    while (j < src.length && src[j] !== "\n") {
      const c = src[j]!;
      if (c === "#") return true;
      if (c === "/" && src[j + 1] === "/") return true;
      if (c !== " " && c !== "\t") return false;
      j += 1;
    }
    return true;
  };

  while (i <= src.length) {
    if (i === src.length) {
      if (tokens.length && tokens[tokens.length - 1]!.kind !== "NEWLINE") {
        emit("NEWLINE", "\n", col, col, line);
      }
      while (indents.length > 1) {
        indents.pop();
        emit("DEDENT", "", 1, 1, line);
      }
      emit("EOF", "", col, col, line);
      break;
    }

    if (atLineStart()) {
      let spaces = 0;
      const startI = i;
      const startCol = col;
      while (i < src.length && src[i] === " ") {
        spaces += 1;
        i += 1;
        col += 1;
      }
      if (src[i] === "\t") {
        throw new CompileError("Tabs are not allowed; use spaces", line, col, col + 1, "parse");
      }
      if (restOfLineIsBlank(i)) {
        while (i < src.length && src[i] !== "\n") {
          i += 1;
          col += 1;
        }
        if (src[i] === "\n") {
          i += 1;
          line += 1;
          col = 1;
        }
        continue;
      }
      const current = indents[indents.length - 1]!;
      if (spaces > current) {
        indents.push(spaces);
        emit("INDENT", "", startCol, startCol + spaces);
      } else if (spaces < current) {
        while (indents.length > 1 && indents[indents.length - 1]! > spaces) {
          indents.pop();
          emit("DEDENT", "", startCol, startCol);
        }
        if (indents[indents.length - 1] !== spaces) {
          throw new CompileError(`Inconsistent indentation`, line, startCol, startCol + spaces, "parse");
        }
      }
      void startI;
    }

    const c = src[i]!;
    if (c === " ") {
      i += 1;
      col += 1;
      continue;
    }
    if (c === "#") {
      skipComment();
      continue;
    }
    if (c === "/" && src[i + 1] === "/") {
      skipComment();
      continue;
    }
    if (c === "\n") {
      emit("NEWLINE", "\n", col, col + 1);
      i += 1;
      line += 1;
      col = 1;
      continue;
    }
    if (c === ">" && src[i + 1] === "=") {
      emit("GE", ">=", col, col + 2);
      i += 2;
      col += 2;
      continue;
    }
    if (c === "<" && src[i + 1] === "=") {
      emit("LE", "<=", col, col + 2);
      i += 2;
      col += 2;
      continue;
    }
    if (c === "=" && src[i + 1] === "=") {
      emit("EQ", "==", col, col + 2);
      i += 2;
      col += 2;
      continue;
    }
    if (c === "!" && src[i + 1] === "=") {
      emit("NE", "!=", col, col + 2);
      i += 2;
      col += 2;
      continue;
    }
    if (c === "=") {
      emit("ASSIGN", "=", col, col + 1);
      i += 1;
      col += 1;
      continue;
    }
    if (PUNCT[c]) {
      emit(PUNCT[c]!, c, col, col + 1);
      i += 1;
      col += 1;
      continue;
    }
    if (c === ">" ) {
      emit("GT", ">", col, col + 1);
      i += 1;
      col += 1;
      continue;
    }
    if (c === "<") {
      emit("LT", "<", col, col + 1);
      i += 1;
      col += 1;
      continue;
    }
    if (/[0-9]/.test(c) || (c === "." && i + 1 < src.length && /[0-9]/.test(src[i + 1]!))) {
      const start = col;
      let v = "";
      while (i < src.length && /[0-9]/.test(src[i]!)) {
        v += src[i];
        i += 1;
        col += 1;
      }
      if (src[i] === ".") {
        v += ".";
        i += 1;
        col += 1;
        while (i < src.length && /[0-9]/.test(src[i]!)) {
          v += src[i];
          i += 1;
          col += 1;
        }
      }
      emit("NUMBER", v, start, col);
      continue;
    }
    if (isIdentStart(c)) {
      const start = col;
      let v = "";
      while (i < src.length && isIdent(src[i]!)) {
        v += src[i];
        i += 1;
        col += 1;
      }
      emit("IDENT", v, start, col);
      continue;
    }
    throw new CompileError(`Unexpected character ${JSON.stringify(c)}`, line, col, col + 1, "parse");
  }

  return tokens;
}

export const KEYWORDS = new Set([
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
  "sma",
  "ema",
  "rsi",
  "stdev",
  "momentum",
  "count",
  "close",
  "open",
  "high",
  "low",
  "volume",
  "signals",
]);
