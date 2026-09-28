import type { BinOp, Expr, ParamDecl, Program, RebalanceFreq, Span, Stmt, TickerDecl } from "./ast";
import { CompileError } from "./errors";
import { tokenize, type Token, type TokKind } from "./lexer";

class Parser {
  private i = 0;
  constructor(private tokens: Token[]) {}

  private peek(): Token {
    return this.tokens[this.i] ?? this.tokens[this.tokens.length - 1]!;
  }

  private at(kind: TokKind): boolean {
    return this.peek().kind === kind;
  }

  private atIdent(name: string): boolean {
    const t = this.peek();
    return t.kind === "IDENT" && t.value === name;
  }

  private advance(): Token {
    const t = this.peek();
    if (t.kind !== "EOF") this.i += 1;
    return t;
  }

  private expect(kind: TokKind, msg?: string): Token {
    const t = this.peek();
    if (t.kind !== kind) {
      throw new CompileError(msg ?? `Expected ${kind}, got ${t.kind}${t.value ? ` '${t.value}'` : ""}`, t.line, t.col, t.endCol);
    }
    return this.advance();
  }

  private expectIdent(name: string): Token {
    const t = this.peek();
    if (t.kind !== "IDENT" || t.value !== name) {
      throw new CompileError(`Expected '${name}'`, t.line, t.col, t.endCol);
    }
    return this.advance();
  }

  private skipNewlines(): void {
    while (this.at("NEWLINE")) this.advance();
  }

  private spanOf(t: Token): Span {
    return { line: t.line, col: t.col, endCol: t.endCol };
  }

  private join(a: Span, b: Span): Span {
    return { line: a.line, col: a.col, endCol: b.endCol };
  }

  parseProgram(): Program {
    this.skipNewlines();
    const universe = this.parseUniverse();
    this.skipNewlines();
    let rebalance: RebalanceFreq = "monthly";
    if (this.atIdent("rebalance")) {
      rebalance = this.parseRebalance();
      this.skipNewlines();
    }
    const params: ParamDecl[] = [];
    while (this.atIdent("param")) {
      params.push(this.parseParam());
      this.skipNewlines();
    }
    const body = this.parseForEach();
    this.skipNewlines();
    if (!this.at("EOF")) {
      const t = this.peek();
      throw new CompileError(`Unexpected '${t.value || t.kind}' after strategy body`, t.line, t.col, t.endCol);
    }
    return { universe, rebalance, params, body };
  }

  private parseUniverse(): TickerDecl[] {
    this.expectIdent("universe");
    this.expect("LBRACK", "Expected '[' after universe");
    const tickers: TickerDecl[] = [];
    if (this.at("RBRACK")) {
      throw new CompileError("Universe cannot be empty", this.peek().line, this.peek().col, this.peek().endCol);
    }
    while (true) {
      const id = this.expect("IDENT", "Expected ticker");
      tickers.push({ ticker: id.value.toUpperCase(), span: this.spanOf(id) });
      if (this.at("COMMA")) {
        this.advance();
        continue;
      }
      break;
    }
    this.expect("RBRACK", "Expected ']' to close universe");
    if (this.at("NEWLINE")) this.advance();
    return tickers;
  }

  private parseRebalance(): RebalanceFreq {
    this.expectIdent("rebalance");
    const t = this.expect("IDENT", "Expected monthly, weekly or daily");
    if (t.value !== "monthly" && t.value !== "weekly" && t.value !== "daily") {
      throw new CompileError(`Unknown rebalance frequency '${t.value}'`, t.line, t.col, t.endCol);
    }
    if (this.at("NEWLINE")) this.advance();
    return t.value;
  }

  private parseParam(): ParamDecl {
    const kw = this.expectIdent("param");
    const name = this.expect("IDENT", "Expected parameter name");
    if (this.at("ASSIGN")) this.advance();
    const num = this.expect("NUMBER", "Expected default value");
    if (this.at("NEWLINE")) this.advance();
    void kw;
    return { name: name.value, value: Number(num.value), span: this.spanOf(name) };
  }

  private parseForEach(): Stmt[] {
    this.expectIdent("for");
    this.expectIdent("each");
    this.expectIdent("asset");
    this.expect("COLON", "Expected ':' after 'for each asset'");
    this.expect("NEWLINE", "Expected a newline after ':'");
    return this.parseBlock();
  }

  private parseBlock(): Stmt[] {
    this.expect("INDENT", "Expected an indented block");
    const stmts: Stmt[] = [];
    this.skipNewlines();
    while (!this.at("DEDENT") && !this.at("EOF")) {
      stmts.push(this.parseStmt());
      this.skipNewlines();
    }
    this.expect("DEDENT", "Expected end of indented block");
    if (stmts.length === 0) {
      const t = this.peek();
      throw new CompileError("Empty block", t.line, t.col, t.endCol);
    }
    return stmts;
  }

  private parseStmt(): Stmt {
    if (this.atIdent("if")) return this.parseIf();
    if (this.atIdent("target_weight")) {
      const kw = this.advance();
      const expr = this.parseExpr();
      if (this.at("NEWLINE")) this.advance();
      return { kind: "target", expr, span: this.join(this.spanOf(kw), expr.span) };
    }
    if (this.atIdent("rebalance_to")) {
      const kw = this.advance();
      const expr = this.parseExpr();
      if (this.at("NEWLINE")) this.advance();
      return { kind: "rebalance_to", expr, span: this.join(this.spanOf(kw), expr.span) };
    }
    if (this.atIdent("exit")) {
      const kw = this.advance();
      if (this.at("NEWLINE")) this.advance();
      return { kind: "exit", span: this.spanOf(kw) };
    }
    const t = this.peek();
    throw new CompileError(`Unexpected statement '${t.value || t.kind}'`, t.line, t.col, t.endCol);
  }

  private parseIf(): Stmt {
    const kw = this.expectIdent("if");
    const cond = this.parseExpr();
    this.expect("COLON", "Expected ':' after if condition");
    this.expect("NEWLINE", "Expected a newline after ':'");
    const then = this.parseBlock();
    this.skipNewlines();
    let els: Stmt[] | null = null;
    if (this.atIdent("else")) {
      this.advance();
      this.expect("COLON", "Expected ':' after else");
      this.expect("NEWLINE", "Expected a newline after ':'");
      els = this.parseBlock();
    }
    return { kind: "if", cond, then, else: els, span: this.spanOf(kw) };
  }

  parseExpr(): Expr {
    return this.parseOr();
  }

  private parseOr(): Expr {
    let left = this.parseAnd();
    while (this.atIdent("or")) {
      const op = this.advance();
      const right = this.parseAnd();
      left = { kind: "bin", op: "or", left, right, span: this.join(left.span, right.span) };
      void op;
    }
    return left;
  }

  private parseAnd(): Expr {
    let left = this.parseNot();
    while (this.atIdent("and")) {
      this.advance();
      const right = this.parseNot();
      left = { kind: "bin", op: "and", left, right, span: this.join(left.span, right.span) };
    }
    return left;
  }

  private parseNot(): Expr {
    if (this.atIdent("not")) {
      const op = this.advance();
      const expr = this.parseNot();
      return { kind: "un", op: "not", expr, span: this.join(this.spanOf(op), expr.span) };
    }
    return this.parseCmp();
  }

  private parseCmp(): Expr {
    const left = this.parseAdd();
    const t = this.peek();
    const map: Partial<Record<TokKind, BinOp>> = {
      GT: ">",
      LT: "<",
      GE: ">=",
      LE: "<=",
      EQ: "==",
      NE: "!=",
    };
    const op = map[t.kind];
    if (!op) return left;
    this.advance();
    const right = this.parseAdd();
    return { kind: "bin", op, left, right, span: this.join(left.span, right.span) };
  }

  private parseAdd(): Expr {
    let left = this.parseMul();
    while (this.at("PLUS") || this.at("MINUS")) {
      const op = this.advance().kind === "PLUS" ? "+" : "-";
      const right = this.parseMul();
      left = { kind: "bin", op, left, right, span: this.join(left.span, right.span) };
    }
    return left;
  }

  private parseMul(): Expr {
    let left = this.parseUnary();
    while (this.at("STAR") || this.at("SLASH")) {
      const op = this.advance().kind === "STAR" ? "*" : "/";
      const right = this.parseUnary();
      left = { kind: "bin", op, left, right, span: this.join(left.span, right.span) };
    }
    return left;
  }

  private parseUnary(): Expr {
    if (this.at("MINUS")) {
      const op = this.advance();
      const expr = this.parseUnary();
      return { kind: "un", op: "neg", expr, span: this.join(this.spanOf(op), expr.span) };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): Expr {
    const t = this.peek();
    if (t.kind === "NUMBER") {
      this.advance();
      return { kind: "num", value: Number(t.value), span: this.spanOf(t) };
    }
    if (t.kind === "IDENT") {
      this.advance();
      if (this.at("LPAREN")) {
        this.advance();
        const args: Expr[] = [];
        if (!this.at("RPAREN")) {
          args.push(this.parseExpr());
          while (this.at("COMMA")) {
            this.advance();
            args.push(this.parseExpr());
          }
        }
        const close = this.expect("RPAREN", "Expected ')'");
        let node: Expr = { kind: "call", name: t.value, args, span: this.join(this.spanOf(t), this.spanOf(close)) };
        if (this.at("LBRACK")) node = this.parseIndex(node);
        return node;
      }
      let node: Expr = { kind: "id", name: t.value, span: this.spanOf(t) };
      if (this.at("LBRACK")) node = this.parseIndex(node);
      return node;
    }
    if (t.kind === "LPAREN") {
      this.advance();
      const e = this.parseExpr();
      this.expect("RPAREN", "Expected ')'");
      if (this.at("LBRACK")) return this.parseIndex(e);
      return e;
    }
    throw new CompileError(`Unexpected '${t.value || t.kind}' in expression`, t.line, t.col, t.endCol);
  }

  private parseIndex(object: Expr): Expr {
    this.expect("LBRACK");
    if (this.at("MINUS")) {
      const t = this.peek();
      throw new CompileError(
        "offsets look back in time; negative values are not allowed",
        t.line,
        t.col,
        t.endCol,
      );
    }
    const index = this.parseExpr();
    const close = this.expect("RBRACK", "Expected ']'");
    return { kind: "index", object, index, span: this.join(object.span, this.spanOf(close)) };
  }
}

export function parse(source: string): Program {
  const tokens = tokenize(source);
  return new Parser(tokens).parseProgram();
}

export function parseTokens(tokens: Token[]): Program {
  return new Parser(tokens).parseProgram();
}
