export interface Span {
  line: number;
  col: number;
  endCol: number;
}

export type RebalanceFreq = "monthly" | "weekly" | "daily";

export type BinOp = "+" | "-" | "*" | "/" | ">" | "<" | ">=" | "<=" | "==" | "!=" | "and" | "or";
export type UnOp = "not" | "neg";

export type Expr =
  | { kind: "num"; value: number; span: Span }
  | { kind: "id"; name: string; span: Span }
  | { kind: "index"; object: Expr; index: Expr; span: Span }
  | { kind: "call"; name: string; args: Expr[]; span: Span }
  | { kind: "bin"; op: BinOp; left: Expr; right: Expr; span: Span }
  | { kind: "un"; op: UnOp; expr: Expr; span: Span };

export type Stmt =
  | { kind: "if"; cond: Expr; then: Stmt[]; else: Stmt[] | null; span: Span }
  | { kind: "target"; expr: Expr; span: Span }
  | { kind: "rebalance_to"; expr: Expr; span: Span }
  | { kind: "exit"; span: Span };

export interface ParamDecl {
  name: string;
  value: number;
  span: Span;
}

export interface TickerDecl {
  ticker: string;
  span: Span;
}

export interface Program {
  universe: TickerDecl[];
  rebalance: RebalanceFreq;
  params: ParamDecl[];
  body: Stmt[];
}

export const DEFAULT_STRATEGY = `universe [MSFT, KOG, MOWI, DNB]
rebalance monthly
for each asset:
  if sma(close, 50) > sma(close, 200) and rsi(close, 14) < 70:
    target_weight 1 / count(signals)
  else:
    target_weight 0
`;

export const PARAM_STRATEGY = `universe [MSFT, KOG, MOWI, DNB]
rebalance monthly
param fast = 50
param slow = 200
param rsi_max = 70
for each asset:
  if sma(close, fast) > sma(close, slow) and rsi(close, 14) < rsi_max:
    target_weight 1 / count(signals)
  else:
    target_weight 0
`;
