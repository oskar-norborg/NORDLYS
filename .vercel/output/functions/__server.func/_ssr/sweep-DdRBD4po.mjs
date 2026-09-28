import { J as historicalVarEs, Q as simpleReturns, R as isImportedQuoteSource, Vt as emptyLedgerBundle, X as ratiosFromReturns, at as createRng, mt as sampleStdev, q as drawdownFromNav } from "./router-DE00T9yP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/sweep-DdRBD4po.js
var DEFAULT_STRATEGY = `universe [MSFT, KOG, MOWI, DNB]
rebalance monthly
for each asset:
  if sma(close, 50) > sma(close, 200) and rsi(close, 14) < 70:
    target_weight 1 / count(signals)
  else:
    target_weight 0
`;
var PARAM_STRATEGY = `universe [MSFT, KOG, MOWI, DNB]
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
var CompileError = class extends Error {
	line;
	col;
	endCol;
	code;
	constructor(message, line, col, endCol, code = "parse") {
		super(message);
		this.name = "CompileError";
		this.line = line;
		this.col = col;
		this.endCol = Math.max(endCol, col + 1);
		this.code = code;
	}
};
function isCompileError(e) {
	return e instanceof CompileError;
}
var PUNCT = {
	"[": "LBRACK",
	"]": "RBRACK",
	"(": "LPAREN",
	")": "RPAREN",
	",": "COMMA",
	":": "COLON",
	"+": "PLUS",
	"-": "MINUS",
	"*": "STAR",
	"/": "SLASH"
};
function tokenize(source) {
	const src = source.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
	const tokens = [];
	const indents = [0];
	let i = 0;
	let line = 1;
	let col = 1;
	const emit = (kind, value, startCol, endCol, ln = line) => {
		tokens.push({
			kind,
			value,
			line: ln,
			col: startCol,
			endCol
		});
	};
	const isIdentStart = (c) => /[A-Za-z_]/.test(c);
	const isIdent = (c) => /[A-Za-z0-9_]/.test(c);
	const skipComment = () => {
		while (i < src.length && src[i] !== "\n") {
			i += 1;
			col += 1;
		}
	};
	const atLineStart = () => {
		return i === 0 || src[i - 1] === "\n";
	};
	const restOfLineIsBlank = (from) => {
		let j = from;
		while (j < src.length && src[j] !== "\n") {
			const c = src[j];
			if (c === "#") return true;
			if (c === "/" && src[j + 1] === "/") return true;
			if (c !== " " && c !== "	") return false;
			j += 1;
		}
		return true;
	};
	while (i <= src.length) {
		if (i === src.length) {
			if (tokens.length && tokens[tokens.length - 1].kind !== "NEWLINE") emit("NEWLINE", "\n", col, col, line);
			while (indents.length > 1) {
				indents.pop();
				emit("DEDENT", "", 1, 1, line);
			}
			emit("EOF", "", col, col, line);
			break;
		}
		if (atLineStart()) {
			let spaces = 0;
			const startCol = col;
			while (i < src.length && src[i] === " ") {
				spaces += 1;
				i += 1;
				col += 1;
			}
			if (src[i] === "	") throw new CompileError("Tabs are not allowed; use spaces", line, col, col + 1, "parse");
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
			const current = indents[indents.length - 1];
			if (spaces > current) {
				indents.push(spaces);
				emit("INDENT", "", startCol, startCol + spaces);
			} else if (spaces < current) {
				while (indents.length > 1 && indents[indents.length - 1] > spaces) {
					indents.pop();
					emit("DEDENT", "", startCol, startCol);
				}
				if (indents[indents.length - 1] !== spaces) throw new CompileError(`Inconsistent indentation`, line, startCol, startCol + spaces, "parse");
			}
		}
		const c = src[i];
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
			emit(PUNCT[c], c, col, col + 1);
			i += 1;
			col += 1;
			continue;
		}
		if (c === ">") {
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
		if (/[0-9]/.test(c) || c === "." && i + 1 < src.length && /[0-9]/.test(src[i + 1])) {
			const start = col;
			let v = "";
			while (i < src.length && /[0-9]/.test(src[i])) {
				v += src[i];
				i += 1;
				col += 1;
			}
			if (src[i] === ".") {
				v += ".";
				i += 1;
				col += 1;
				while (i < src.length && /[0-9]/.test(src[i])) {
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
			while (i < src.length && isIdent(src[i])) {
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
var Parser = class {
	tokens;
	i = 0;
	constructor(tokens) {
		this.tokens = tokens;
	}
	peek() {
		return this.tokens[this.i] ?? this.tokens[this.tokens.length - 1];
	}
	at(kind) {
		return this.peek().kind === kind;
	}
	atIdent(name) {
		const t = this.peek();
		return t.kind === "IDENT" && t.value === name;
	}
	advance() {
		const t = this.peek();
		if (t.kind !== "EOF") this.i += 1;
		return t;
	}
	expect(kind, msg) {
		const t = this.peek();
		if (t.kind !== kind) throw new CompileError(msg ?? `Expected ${kind}, got ${t.kind}${t.value ? ` '${t.value}'` : ""}`, t.line, t.col, t.endCol);
		return this.advance();
	}
	expectIdent(name) {
		const t = this.peek();
		if (t.kind !== "IDENT" || t.value !== name) throw new CompileError(`Expected '${name}'`, t.line, t.col, t.endCol);
		return this.advance();
	}
	skipNewlines() {
		while (this.at("NEWLINE")) this.advance();
	}
	spanOf(t) {
		return {
			line: t.line,
			col: t.col,
			endCol: t.endCol
		};
	}
	join(a, b) {
		return {
			line: a.line,
			col: a.col,
			endCol: b.endCol
		};
	}
	parseProgram() {
		this.skipNewlines();
		const universe = this.parseUniverse();
		this.skipNewlines();
		let rebalance = "monthly";
		if (this.atIdent("rebalance")) {
			rebalance = this.parseRebalance();
			this.skipNewlines();
		}
		const params = [];
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
		return {
			universe,
			rebalance,
			params,
			body
		};
	}
	parseUniverse() {
		this.expectIdent("universe");
		this.expect("LBRACK", "Expected '[' after universe");
		const tickers = [];
		if (this.at("RBRACK")) throw new CompileError("Universe cannot be empty", this.peek().line, this.peek().col, this.peek().endCol);
		while (true) {
			const id = this.expect("IDENT", "Expected ticker");
			tickers.push({
				ticker: id.value.toUpperCase(),
				span: this.spanOf(id)
			});
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
	parseRebalance() {
		this.expectIdent("rebalance");
		const t = this.expect("IDENT", "Expected monthly, weekly or daily");
		if (t.value !== "monthly" && t.value !== "weekly" && t.value !== "daily") throw new CompileError(`Unknown rebalance frequency '${t.value}'`, t.line, t.col, t.endCol);
		if (this.at("NEWLINE")) this.advance();
		return t.value;
	}
	parseParam() {
		this.expectIdent("param");
		const name = this.expect("IDENT", "Expected parameter name");
		if (this.at("ASSIGN")) this.advance();
		const num = this.expect("NUMBER", "Expected default value");
		if (this.at("NEWLINE")) this.advance();
		return {
			name: name.value,
			value: Number(num.value),
			span: this.spanOf(name)
		};
	}
	parseForEach() {
		this.expectIdent("for");
		this.expectIdent("each");
		this.expectIdent("asset");
		this.expect("COLON", "Expected ':' after 'for each asset'");
		this.expect("NEWLINE", "Expected a newline after ':'");
		return this.parseBlock();
	}
	parseBlock() {
		this.expect("INDENT", "Expected an indented block");
		const stmts = [];
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
	parseStmt() {
		if (this.atIdent("if")) return this.parseIf();
		if (this.atIdent("target_weight")) {
			const kw = this.advance();
			const expr = this.parseExpr();
			if (this.at("NEWLINE")) this.advance();
			return {
				kind: "target",
				expr,
				span: this.join(this.spanOf(kw), expr.span)
			};
		}
		if (this.atIdent("rebalance_to")) {
			const kw = this.advance();
			const expr = this.parseExpr();
			if (this.at("NEWLINE")) this.advance();
			return {
				kind: "rebalance_to",
				expr,
				span: this.join(this.spanOf(kw), expr.span)
			};
		}
		if (this.atIdent("exit")) {
			const kw = this.advance();
			if (this.at("NEWLINE")) this.advance();
			return {
				kind: "exit",
				span: this.spanOf(kw)
			};
		}
		const t = this.peek();
		throw new CompileError(`Unexpected statement '${t.value || t.kind}'`, t.line, t.col, t.endCol);
	}
	parseIf() {
		const kw = this.expectIdent("if");
		const cond = this.parseExpr();
		this.expect("COLON", "Expected ':' after if condition");
		this.expect("NEWLINE", "Expected a newline after ':'");
		const then = this.parseBlock();
		this.skipNewlines();
		let els = null;
		if (this.atIdent("else")) {
			this.advance();
			this.expect("COLON", "Expected ':' after else");
			this.expect("NEWLINE", "Expected a newline after ':'");
			els = this.parseBlock();
		}
		return {
			kind: "if",
			cond,
			then,
			else: els,
			span: this.spanOf(kw)
		};
	}
	parseExpr() {
		return this.parseOr();
	}
	parseOr() {
		let left = this.parseAnd();
		while (this.atIdent("or")) {
			this.advance();
			const right = this.parseAnd();
			left = {
				kind: "bin",
				op: "or",
				left,
				right,
				span: this.join(left.span, right.span)
			};
		}
		return left;
	}
	parseAnd() {
		let left = this.parseNot();
		while (this.atIdent("and")) {
			this.advance();
			const right = this.parseNot();
			left = {
				kind: "bin",
				op: "and",
				left,
				right,
				span: this.join(left.span, right.span)
			};
		}
		return left;
	}
	parseNot() {
		if (this.atIdent("not")) {
			const op = this.advance();
			const expr = this.parseNot();
			return {
				kind: "un",
				op: "not",
				expr,
				span: this.join(this.spanOf(op), expr.span)
			};
		}
		return this.parseCmp();
	}
	parseCmp() {
		const left = this.parseAdd();
		const op = {
			GT: ">",
			LT: "<",
			GE: ">=",
			LE: "<=",
			EQ: "==",
			NE: "!="
		}[this.peek().kind];
		if (!op) return left;
		this.advance();
		const right = this.parseAdd();
		return {
			kind: "bin",
			op,
			left,
			right,
			span: this.join(left.span, right.span)
		};
	}
	parseAdd() {
		let left = this.parseMul();
		while (this.at("PLUS") || this.at("MINUS")) {
			const op = this.advance().kind === "PLUS" ? "+" : "-";
			const right = this.parseMul();
			left = {
				kind: "bin",
				op,
				left,
				right,
				span: this.join(left.span, right.span)
			};
		}
		return left;
	}
	parseMul() {
		let left = this.parseUnary();
		while (this.at("STAR") || this.at("SLASH")) {
			const op = this.advance().kind === "STAR" ? "*" : "/";
			const right = this.parseUnary();
			left = {
				kind: "bin",
				op,
				left,
				right,
				span: this.join(left.span, right.span)
			};
		}
		return left;
	}
	parseUnary() {
		if (this.at("MINUS")) {
			const op = this.advance();
			const expr = this.parseUnary();
			return {
				kind: "un",
				op: "neg",
				expr,
				span: this.join(this.spanOf(op), expr.span)
			};
		}
		return this.parsePrimary();
	}
	parsePrimary() {
		const t = this.peek();
		if (t.kind === "NUMBER") {
			this.advance();
			return {
				kind: "num",
				value: Number(t.value),
				span: this.spanOf(t)
			};
		}
		if (t.kind === "IDENT") {
			this.advance();
			if (this.at("LPAREN")) {
				this.advance();
				const args = [];
				if (!this.at("RPAREN")) {
					args.push(this.parseExpr());
					while (this.at("COMMA")) {
						this.advance();
						args.push(this.parseExpr());
					}
				}
				const close = this.expect("RPAREN", "Expected ')'");
				let node = {
					kind: "call",
					name: t.value,
					args,
					span: this.join(this.spanOf(t), this.spanOf(close))
				};
				if (this.at("LBRACK")) node = this.parseIndex(node);
				return node;
			}
			let node = {
				kind: "id",
				name: t.value,
				span: this.spanOf(t)
			};
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
	parseIndex(object) {
		this.expect("LBRACK");
		if (this.at("MINUS")) {
			const t = this.peek();
			throw new CompileError("offsets look back in time; negative values are not allowed", t.line, t.col, t.endCol);
		}
		const index = this.parseExpr();
		const close = this.expect("RBRACK", "Expected ']'");
		return {
			kind: "index",
			object,
			index,
			span: this.join(object.span, this.spanOf(close))
		};
	}
};
function parse(source) {
	return new Parser(tokenize(source)).parseProgram();
}
var SERIES_FIELDS = /* @__PURE__ */ new Set([
	"close",
	"open",
	"high",
	"low",
	"volume"
]);
var INDICATORS = /* @__PURE__ */ new Set([
	"sma",
	"ema",
	"rsi",
	"stdev",
	"momentum"
]);
function tyOf(expr, params) {
	switch (expr.kind) {
		case "num": return "num";
		case "id":
			if (SERIES_FIELDS.has(expr.name)) return "series";
			if (expr.name === "signals") return "signals";
			if (expr.name === "asset") return "num";
			if (params.has(expr.name)) return "num";
			throw new CompileError(`Unknown name '${expr.name}'`, expr.span.line, expr.span.col, expr.span.endCol, "type");
		case "index":
			if (tyOf(expr.object, params) !== "series") throw new CompileError("Only a price series can be indexed", expr.span.line, expr.span.col, expr.span.endCol, "type");
			if (tyOf(expr.index, params) !== "num") throw new CompileError("Series index must be a number", expr.index.span.line, expr.index.span.col, expr.index.span.endCol, "type");
			if (isNegativeOffset(expr.index)) throw new CompileError("offsets look back in time; negative values are not allowed", expr.index.span.line, expr.index.span.col, expr.index.span.endCol);
			return "num";
		case "call":
			if (INDICATORS.has(expr.name)) {
				if (expr.args.length !== 2) throw new CompileError(`${expr.name}() takes a series and a period`, expr.span.line, expr.span.col, expr.span.endCol, "type");
				const a0 = tyOf(expr.args[0], params);
				const a1 = tyOf(expr.args[1], params);
				if (a0 !== "series") throw new CompileError(`${expr.name}() first argument must be a series such as close`, expr.args[0].span.line, expr.args[0].span.col, expr.args[0].span.endCol, "type");
				if (a1 !== "num") throw new CompileError(`${expr.name}() period must be a number`, expr.args[1].span.line, expr.args[1].span.col, expr.args[1].span.endCol, "type");
				return "num";
			}
			if (expr.name === "count") {
				if (expr.args.length !== 1) throw new CompileError("count() takes signals", expr.span.line, expr.span.col, expr.span.endCol, "type");
				if (tyOf(expr.args[0], params) !== "signals") throw new CompileError("count() expects signals", expr.args[0].span.line, expr.args[0].span.col, expr.args[0].span.endCol, "type");
				return "num";
			}
			throw new CompileError(`Unknown function '${expr.name}'`, expr.span.line, expr.span.col, expr.span.endCol, "type");
		case "un": {
			const inner = tyOf(expr.expr, params);
			if (expr.op === "not") {
				if (inner !== "bool") throw new CompileError("not expects a boolean", expr.span.line, expr.span.col, expr.span.endCol, "type");
				return "bool";
			}
			if (inner === "series") return "num";
			if (inner !== "num") throw new CompileError("Unary minus expects a number", expr.span.line, expr.span.col, expr.span.endCol, "type");
			return "num";
		}
		case "bin": {
			const l = coerceScalar(tyOf(expr.left, params), expr.left);
			const r = coerceScalar(tyOf(expr.right, params), expr.right);
			if (expr.op === "and" || expr.op === "or") {
				if (l !== "bool" || r !== "bool") throw new CompileError(`${expr.op} expects booleans`, expr.span.line, expr.span.col, expr.span.endCol, "type");
				return "bool";
			}
			if (expr.op === ">" || expr.op === "<" || expr.op === ">=" || expr.op === "<=" || expr.op === "==" || expr.op === "!=") {
				if (l !== "num" || r !== "num") throw new CompileError(`Comparison expects numbers`, expr.span.line, expr.span.col, expr.span.endCol, "type");
				return "bool";
			}
			if (l !== "num" || r !== "num") throw new CompileError(`Arithmetic expects numbers`, expr.span.line, expr.span.col, expr.span.endCol, "type");
			return "num";
		}
		default: return "num";
	}
}
function isNegativeOffset(expr) {
	if (expr.kind === "num") return expr.value < 0;
	if (expr.kind === "un" && expr.op === "neg") return true;
	return false;
}
function coerceScalar(t, expr) {
	if (t === "series") return "num";
	if (t === "signals") throw new CompileError("signals can only be used as count(signals)", expr.span.line, expr.span.col, expr.span.endCol, "type");
	return t;
}
function checkStmt(stmt, params) {
	switch (stmt.kind) {
		case "if":
			if (coerceScalar(tyOf(stmt.cond, params), stmt.cond) !== "bool") throw new CompileError("if condition must be boolean", stmt.cond.span.line, stmt.cond.span.col, stmt.cond.span.endCol, "type");
			for (const s of stmt.then) checkStmt(s, params);
			if (stmt.else) for (const s of stmt.else) checkStmt(s, params);
			return;
		case "target":
		case "rebalance_to":
			if (coerceScalar(tyOf(stmt.expr, params), stmt.expr) !== "num") throw new CompileError("Weight must be a number", stmt.expr.span.line, stmt.expr.span.col, stmt.expr.span.endCol, "type");
			return;
		case "exit": return;
	}
}
function check(program) {
	if (program.universe.length === 0) throw new CompileError("Universe cannot be empty", 1, 1, 2, "type");
	const params = new Set(program.params.map((p) => p.name));
	const seen = /* @__PURE__ */ new Set();
	for (const p of program.params) {
		if (seen.has(p.name)) throw new CompileError(`Duplicate param '${p.name}'`, p.span.line, p.span.col, p.span.endCol, "type");
		seen.add(p.name);
	}
	for (const s of program.body) checkStmt(s, params);
}
/** Greatest lookback (in bars) required by the program. */
function requiredLookback(program, paramValues) {
	const env = {};
	for (const p of program.params) env[p.name] = paramValues?.[p.name] ?? p.value;
	let max = 0;
	const walk = (e) => {
		if (e.kind === "call" && INDICATORS.has(e.name) && e.args[1]) {
			const per = evalNum(e.args[1], env);
			if (e.name === "rsi" || e.name === "momentum") max = Math.max(max, per);
			else max = Math.max(max, per - 1);
		}
		if (e.kind === "index") {
			const off = evalNum(e.index, env);
			if (off < 0) throw new CompileError("offsets look back in time; negative values are not allowed", e.index.span.line, e.index.span.col, e.index.span.endCol);
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
	const walkStmt = (s) => {
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
function evalNum(e, env) {
	if (e.kind === "num") return e.value;
	if (e.kind === "id" && env[e.name] != null) return env[e.name];
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
function compile(source) {
	const program = parse(source);
	check(program);
	requiredLookback(program);
	return program;
}
function tryCompile(source) {
	try {
		return {
			ok: true,
			program: compile(source)
		};
	} catch (e) {
		if (isCompileError(e)) return {
			ok: false,
			error: e
		};
		return {
			ok: false,
			error: new CompileError(e instanceof Error ? e.message : String(e), 1, 1, 2)
		};
	}
}
/** Technical indicators. RSI uses Wilder's smoothing. */
function sma(xs, period) {
	const n = xs.length;
	if (!(period >= 1) || n < period) return void 0;
	let s = 0;
	for (let i = n - period; i < n; i++) s += xs[i];
	return s / period;
}
function ema(xs, period) {
	const n = xs.length;
	if (!(period >= 1) || n < period) return void 0;
	const k = 2 / (period + 1);
	let e = 0;
	for (let i = 0; i < period; i++) e += xs[i];
	e /= period;
	for (let i = period; i < n; i++) e = xs[i] * k + e * (1 - k);
	return e;
}
function stdev(xs, period) {
	const n = xs.length;
	if (!(period >= 2) || n < period) return void 0;
	const slice = [];
	for (let i = n - period; i < n; i++) slice.push(xs[i]);
	return sampleStdev(slice);
}
/** Rate of change: close / close[n] − 1. Needs n+1 prices. */
function momentum(xs, period) {
	const n = xs.length;
	if (!(period >= 1) || n < period + 1) return void 0;
	const now = xs[n - 1];
	const then = xs[n - 1 - period];
	if (!(then > 0) || !Number.isFinite(now)) return void 0;
	return now / then - 1;
}
/**
* Wilder RSI. First average is the SMA of the first `period` changes
* (needs `period + 1` prices). Later values use
* avg = (prev * (period − 1) + current) / period.
*/
function rsiWilder(xs, period) {
	const n = xs.length;
	if (!(period >= 1) || n < period + 1) return void 0;
	let avgGain = 0;
	let avgLoss = 0;
	for (let i = 1; i <= period; i++) {
		const ch = xs[i] - xs[i - 1];
		if (ch >= 0) avgGain += ch;
		else avgLoss -= ch;
	}
	avgGain /= period;
	avgLoss /= period;
	for (let i = period + 1; i < n; i++) {
		const ch = xs[i] - xs[i - 1];
		const g = ch > 0 ? ch : 0;
		const l = ch < 0 ? -ch : 0;
		avgGain = (avgGain * (period - 1) + g) / period;
		avgLoss = (avgLoss * (period - 1) + l) / period;
	}
	if (avgLoss === 0) return avgGain > 0 ? 100 : 50;
	return 100 - 100 / (1 + avgGain / avgLoss);
}
var DEFAULT_BACKTEST_CONFIG = {
	costBps: 5,
	slippageBps: 5,
	cashYield: .02,
	initialCash: 1e6
};
var ZERO_COST_CONFIG = {
	costBps: 0,
	slippageBps: 0,
	cashYield: 0,
	initialCash: 1e6
};
/** Seeded OHLC series for the four example tickers, plus USDNOK. */
var DEMO_TICKERS = [
	{
		ticker: "MSFT",
		currency: "USD",
		start: 160,
		mu: .16,
		vol: .24
	},
	{
		ticker: "KOG",
		currency: "NOK",
		start: 180,
		mu: .14,
		vol: .28
	},
	{
		ticker: "MOWI",
		currency: "NOK",
		start: 185,
		mu: .08,
		vol: .22
	},
	{
		ticker: "DNB",
		currency: "NOK",
		start: 155,
		mu: .1,
		vol: .22
	}
];
var DEMO_PRICE_START = "2020-01-02";
var DEMO_PRICE_END = "2026-09-01";
function iso(ms) {
	const d = new Date(ms);
	return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
function tradingDays(start, end) {
	const out = [];
	let t = Date.parse(start + "T00:00:00Z");
	const last = Date.parse(end + "T00:00:00Z");
	while (t <= last) {
		const wd = new Date(t).getUTCDay();
		if (wd !== 0 && wd !== 6) out.push(iso(t));
		t += 864e5;
	}
	return out;
}
/** Same USDNOK path the demo ledger uses. */
function demoUsdNok(date) {
	const t = (Date.parse(date + "T00:00:00Z") - Date.parse("2021-01-01T00:00:00Z")) / 31536e6;
	return 8.55 + 2.1 * (1 - Math.exp(-t / 2)) + .15 * Math.sin(t * 4);
}
function buildDemoFx(dates) {
	return dates.map((date) => ({
		date,
		usdNok: demoUsdNok(date)
	}));
}
function buildDemoAssetSeries(seed = 20260321) {
	const dates = tradingDays(DEMO_PRICE_START, DEMO_PRICE_END);
	const rng = createRng(seed);
	return DEMO_TICKERS.map((spec) => {
		const bars = [];
		let px = spec.start;
		let prev = spec.start;
		for (let i = 0; i < dates.length; i++) {
			const z = rng.gaussian();
			const r = spec.mu / 252 + spec.vol / Math.sqrt(252) * z;
			px = Math.max(1, px * (1 + r));
			const gap = rng.gaussian() * .004;
			const open = Math.max(1, prev * (1 + gap));
			const span = Math.abs(rng.gaussian()) * .012;
			const high = Math.max(open, px) * (1 + span);
			const low = Math.min(open, px) * (1 - span);
			const volume = Math.round(4e5 + Math.abs(rng.gaussian()) * 25e4);
			bars.push({
				date: dates[i],
				open,
				high,
				low,
				close: px,
				volume
			});
			prev = px;
		}
		return {
			ticker: spec.ticker,
			currency: spec.currency,
			bars
		};
	});
}
function demoCalendar() {
	return tradingDays(DEMO_PRICE_START, DEMO_PRICE_END);
}
function fieldArr(bars, field) {
	const out = new Array(bars.length);
	for (let i = 0; i < bars.length; i++) out[i] = bars[i][field];
	return out;
}
function asNum(v, bars) {
	if (v.k === "series") {
		if (!bars.length) return { k: "undef" };
		return {
			k: "num",
			v: bars[bars.length - 1][v.field]
		};
	}
	return v;
}
function evalExpr(expr, ctx) {
	switch (expr.kind) {
		case "num": return {
			k: "num",
			v: expr.value
		};
		case "id":
			if (expr.name === "signals") return { k: "signals" };
			if (expr.name === "close" || expr.name === "open" || expr.name === "high" || expr.name === "low" || expr.name === "volume") return {
				k: "series",
				field: expr.name
			};
			if (ctx.params[expr.name] != null) return {
				k: "num",
				v: ctx.params[expr.name]
			};
			return { k: "undef" };
		case "index": {
			const obj = evalExpr(expr.object, ctx);
			const idxV = asNum(evalExpr(expr.index, ctx), ctx.bars);
			if (obj.k !== "series" || idxV.k !== "num") return { k: "undef" };
			const off = Math.trunc(idxV.v);
			if (off < 0) throw new CompileError("offsets look back in time; negative values are not allowed", expr.index.span.line, expr.index.span.col, expr.index.span.endCol);
			const arr = fieldArr(ctx.bars, obj.field);
			const i = arr.length - 1 - off;
			if (i < 0 || i >= arr.length) return { k: "undef" };
			return {
				k: "num",
				v: arr[i]
			};
		}
		case "call": {
			if (expr.name === "count") return {
				k: "num",
				v: ctx.signalCount
			};
			const a0 = evalExpr(expr.args[0], ctx);
			const a1 = asNum(evalExpr(expr.args[1], ctx), ctx.bars);
			if (a0.k !== "series" || a1.k !== "num") return { k: "undef" };
			const period = Math.trunc(a1.v);
			const xs = fieldArr(ctx.bars, a0.field);
			let v;
			if (expr.name === "sma") v = sma(xs, period);
			else if (expr.name === "ema") v = ema(xs, period);
			else if (expr.name === "rsi") v = rsiWilder(xs, period);
			else if (expr.name === "stdev") v = stdev(xs, period);
			else if (expr.name === "momentum") v = momentum(xs, period);
			if (v == null || !Number.isFinite(v)) return { k: "undef" };
			return {
				k: "num",
				v
			};
		}
		case "un": {
			const inner = asNum(evalExpr(expr.expr, ctx), ctx.bars);
			if (expr.op === "not") {
				if (inner.k === "undef") return { k: "undef" };
				if (inner.k !== "bool") return { k: "undef" };
				return {
					k: "bool",
					v: !inner.v
				};
			}
			if (inner.k === "undef") return { k: "undef" };
			if (inner.k !== "num") return { k: "undef" };
			return {
				k: "num",
				v: -inner.v
			};
		}
		case "bin": {
			if (expr.op === "and" || expr.op === "or") {
				const l = asNum(evalExpr(expr.left, ctx), ctx.bars);
				if (l.k === "undef") return { k: "undef" };
				if (l.k !== "bool") return { k: "undef" };
				if (expr.op === "and" && !l.v) return {
					k: "bool",
					v: false
				};
				if (expr.op === "or" && l.v) return {
					k: "bool",
					v: true
				};
				const r = asNum(evalExpr(expr.right, ctx), ctx.bars);
				if (r.k === "undef") return { k: "undef" };
				if (r.k !== "bool") return { k: "undef" };
				return {
					k: "bool",
					v: expr.op === "and" ? l.v && r.v : l.v || r.v
				};
			}
			const l = asNum(evalExpr(expr.left, ctx), ctx.bars);
			const r = asNum(evalExpr(expr.right, ctx), ctx.bars);
			if (l.k === "undef" || r.k === "undef") return { k: "undef" };
			if (l.k !== "num" || r.k !== "num") return { k: "undef" };
			const a = l.v;
			const b = r.v;
			switch (expr.op) {
				case "+": return {
					k: "num",
					v: a + b
				};
				case "-": return {
					k: "num",
					v: a - b
				};
				case "*": return {
					k: "num",
					v: a * b
				};
				case "/":
					if (b === 0) return {
						k: "num",
						v: 0
					};
					return {
						k: "num",
						v: a / b
					};
				case ">": return {
					k: "bool",
					v: a > b
				};
				case "<": return {
					k: "bool",
					v: a < b
				};
				case ">=": return {
					k: "bool",
					v: a >= b
				};
				case "<=": return {
					k: "bool",
					v: a <= b
				};
				case "==": return {
					k: "bool",
					v: a === b
				};
				case "!=": return {
					k: "bool",
					v: a !== b
				};
				default: return { k: "undef" };
			}
		}
		default: return { k: "undef" };
	}
}
function evalCond(expr, ctx) {
	const v = asNum(evalExpr(expr, ctx), ctx.bars);
	if (v.k === "undef") return void 0;
	if (v.k === "bool") return v.v;
}
function execStmts(stmts, ctx) {
	let w = 0;
	for (const s of stmts) if (s.kind === "if") {
		const c = evalCond(s.cond, ctx);
		if (c == null) return NaN;
		if (c) w = execStmts(s.then, ctx);
		else if (s.else) w = execStmts(s.else, ctx);
		else w = 0;
	} else if (s.kind === "target" || s.kind === "rebalance_to") {
		const v = asNum(evalExpr(s.expr, ctx), ctx.bars);
		if (v.k !== "num" || !Number.isFinite(v.v)) return NaN;
		w = v.v;
	} else if (s.kind === "exit") w = 0;
	return w;
}
function signalCond(body) {
	const first = body[0];
	if (first && first.kind === "if") return first.cond;
	return null;
}
function isRebalanceBar(i, dates, freq) {
	if (freq === "daily") return true;
	if (i >= dates.length - 1) return true;
	const a = dates[i];
	const b = dates[i + 1];
	if (freq === "monthly") return a.slice(0, 7) !== b.slice(0, 7);
	const da = (/* @__PURE__ */ new Date(a + "T00:00:00Z")).getUTCDay();
	const db = (/* @__PURE__ */ new Date(b + "T00:00:00Z")).getUTCDay();
	return db <= da || db === 1;
}
function fxOn(date, fx, cache) {
	const hit = cache.get(date);
	if (hit != null) return hit;
	let rate = 1;
	for (let i = fx.length - 1; i >= 0; i--) if (fx[i].date <= date) {
		rate = fx[i].usdNok;
		break;
	}
	cache.set(date, rate);
	return rate;
}
function pxNok(bar, ccy, date, fx, cache) {
	if (ccy === "NOK") return bar.close;
	return bar.close * fxOn(date, fx, cache);
}
function align(series) {
	const sets = series.map((s) => new Set(s.bars.map((b) => b.date)));
	const all = series[0] ? series[0].bars.map((b) => b.date).filter((d) => sets.every((st) => st.has(d))) : [];
	const byTicker = /* @__PURE__ */ new Map();
	for (const s of series) {
		const m = /* @__PURE__ */ new Map();
		for (const b of s.bars) m.set(b.date, b);
		byTicker.set(s.ticker, m);
	}
	return {
		dates: all,
		byTicker
	};
}
function statsFromEquity(equity, trades, bench) {
	const nav = equity.map((p) => ({
		date: p.date,
		value: p.value,
		cash: p.cash,
		holdings: p.invested,
		externalCf: 0
	}));
	const dd = drawdownFromNav(nav);
	const rets = simpleReturns(equity.map((p) => p.value));
	const bR = simpleReturns(bench.map((p) => p.value));
	const aligned = bR.length === rets.length ? bR : void 0;
	const ratios = rets.length > 2 ? ratiosFromReturns(rets, .02, dd.maxDd, 252, aligned) : null;
	const varEs = rets.length ? historicalVarEs(rets, .95) : {
		var: 0,
		es: 0,
		method: "historical",
		alpha: .95
	};
	const start = equity[0]?.value || 1;
	const end = equity[equity.length - 1]?.value || start;
	const first = trades[0];
	return {
		totalReturn: start > 0 ? end / start - 1 : 0,
		annReturn: ratios?.mean ?? 0,
		vol: ratios?.vol ?? 0,
		sharpe: ratios?.sharpe ?? 0,
		sortino: ratios?.sortino ?? 0,
		calmar: ratios?.calmar ?? 0,
		maxDd: dd.maxDd,
		maxDdStart: dd.maxDdStart,
		maxDdTrough: dd.maxDdTrough,
		var95: varEs.var,
		es95: varEs.es,
		nTrades: trades.length,
		nDays: equity.length,
		firstFillDate: first?.date ?? null,
		firstFillPrice: first?.priceNative ?? null,
		firstFillTicker: first?.ticker ?? null
	};
}
var EMPTY_STATS = statsFromEquity([], [], []);
function trimResult(result, fromDate) {
	const equity = result.equity.filter((p) => p.date >= fromDate);
	const benchmark = result.benchmark.filter((p) => p.date >= fromDate);
	const trades = result.trades.filter((t) => t.date >= fromDate);
	const weights = result.weights.filter((w) => w.date >= fromDate);
	return {
		...result,
		equity,
		benchmark,
		trades,
		weights,
		stats: statsFromEquity(equity, trades, benchmark)
	};
}
function runBacktest(program, series, fx, config = DEFAULT_BACKTEST_CONFIG) {
	const params = {};
	for (const p of program.params) params[p.name] = config.params?.[p.name] ?? p.value;
	if (config.params) Object.assign(params, config.params);
	const wanted = program.universe.map((u) => u.ticker);
	const used = wanted.map((t) => {
		const s = series.find((x) => x.ticker === t);
		if (!s) throw new Error(`Missing price series for ${t}`);
		return s;
	});
	const { dates, byTicker } = align(used);
	const lookback = requiredLookback(program, params);
	const empty = {
		equity: [],
		benchmark: [],
		trades: [],
		weights: [],
		stats: EMPTY_STATS,
		universe: wanted,
		lookback,
		readyDate: null
	};
	if (!dates.length) return empty;
	const cost = (config.costBps + config.slippageBps) / 1e4;
	const dailyCash = config.cashYield / 252;
	const fxCache = /* @__PURE__ */ new Map();
	const shares = {};
	for (const t of wanted) shares[t] = 0;
	let cash = config.initialCash;
	const trades = [];
	const equity = [];
	const weights = [];
	const benchHold = {};
	let benchCash = config.initialCash;
	let benchInit = false;
	let pending = null;
	let readyDate = null;
	const prefix = (ticker, i) => {
		const m = byTicker.get(ticker);
		const out = [];
		for (let k = 0; k <= i; k++) {
			const b = m.get(dates[k]);
			if (b) out.push(b);
		}
		return out;
	};
	const mtm = (i) => {
		const date = dates[i];
		let invested = 0;
		for (const s of used) {
			const b = byTicker.get(s.ticker).get(date);
			invested += (shares[s.ticker] ?? 0) * pxNok(b, s.currency, date, fx, fxCache);
		}
		return {
			invested,
			value: cash + invested
		};
	};
	const fill = (target, signalDate, i) => {
		const date = dates[i];
		const { value } = mtm(i);
		if (!(value > 0)) return;
		const raw = {};
		let sumW = 0;
		for (const t of wanted) {
			const w = Math.max(0, target[t] ?? 0);
			raw[t] = w;
			sumW += w;
		}
		if (sumW > 1) {
			for (const t of wanted) raw[t] = (raw[t] ?? 0) / sumW;
			sumW = 1;
		}
		for (const s of used) {
			const b = byTicker.get(s.ticker).get(date);
			const p = pxNok(b, s.currency, date, fx, fxCache);
			if (!(p > 0)) continue;
			const deltaVal = (raw[s.ticker] ?? 0) * value - (shares[s.ticker] ?? 0) * p;
			if (Math.abs(deltaVal) < 1) continue;
			const deltaShares = deltaVal / p;
			const notional = Math.abs(deltaShares) * p;
			const fee = notional * cost;
			const side = deltaShares > 0 ? "buy" : "sell";
			if (side === "buy" && cash < notional + fee) {
				const afford = Math.max(0, cash - fee);
				if (afford < 1) continue;
				const sh = afford / p;
				shares[s.ticker] = (shares[s.ticker] ?? 0) + sh;
				cash -= sh * p + fee;
				trades.push({
					date,
					signalDate,
					ticker: s.ticker,
					side,
					shares: sh,
					priceNative: b.close,
					priceNok: p,
					valueNok: sh * p,
					costNok: fee
				});
				continue;
			}
			shares[s.ticker] = (shares[s.ticker] ?? 0) + deltaShares;
			cash -= deltaShares * p + fee;
			trades.push({
				date,
				signalDate,
				ticker: s.ticker,
				side,
				shares: Math.abs(deltaShares),
				priceNative: b.close,
				priceNok: p,
				valueNok: notional,
				costNok: fee
			});
		}
	};
	for (let i = 0; i < dates.length; i++) {
		const date = dates[i];
		if (pending) {
			fill(pending.weights, pending.signalDate, i);
			pending = null;
		}
		cash *= 1 + dailyCash;
		if (!benchInit && i > 0) {
			const n = used.length;
			const slice = config.initialCash / n;
			for (const s of used) {
				const p = pxNok(byTicker.get(s.ticker).get(date), s.currency, date, fx, fxCache);
				benchHold[s.ticker] = p > 0 ? slice / p : 0;
			}
			benchCash = 0;
			benchInit = true;
		}
		const { invested, value } = mtm(i);
		equity.push({
			date,
			value,
			cash,
			invested
		});
		if (value > 0) for (const t of wanted) {
			const b = byTicker.get(t).get(date);
			const s = used.find((x) => x.ticker === t);
			const w = (shares[t] ?? 0) * pxNok(b, s.currency, date, fx, fxCache) / value;
			weights.push({
				date,
				ticker: t,
				weight: w
			});
		}
		if (!isRebalanceBar(i, dates, program.rebalance)) continue;
		if (i < lookback) continue;
		if (config.tradeStartDate && date < config.tradeStartDate) continue;
		if (config.tradeEndDate && date > config.tradeEndDate) continue;
		const cond = signalCond(program.body);
		const signals = {};
		let ready = true;
		for (const t of wanted) {
			const bars = prefix(t, i);
			if (bars.length < lookback + 1) {
				ready = false;
				break;
			}
			const ctx = {
				bars,
				signalCount: 0,
				params
			};
			if (cond) {
				const c = evalCond(cond, ctx);
				if (c == null) {
					ready = false;
					break;
				}
				signals[t] = c;
			} else signals[t] = true;
		}
		if (!ready) continue;
		if (!readyDate) readyDate = date;
		const nSig = wanted.reduce((n, t) => n + (signals[t] ? 1 : 0), 0);
		const tw = {};
		if (nSig === 0) for (const t of wanted) tw[t] = 0;
		else for (const t of wanted) {
			const ctx = {
				bars: prefix(t, i),
				signalCount: nSig,
				params
			};
			const w = execStmts(program.body, ctx);
			tw[t] = Number.isFinite(w) ? Math.max(0, w) : 0;
		}
		pending = {
			weights: tw,
			signalDate: date
		};
	}
	const bench = [];
	for (let i = 0; i < dates.length; i++) {
		const date = dates[i];
		if (i === 0) {
			bench.push({
				date,
				value: config.initialCash,
				cash: config.initialCash,
				invested: 0
			});
			continue;
		}
		let invested = 0;
		for (const s of used) {
			const b = byTicker.get(s.ticker).get(date);
			invested += (benchHold[s.ticker] ?? 0) * pxNok(b, s.currency, date, fx, fxCache);
		}
		bench.push({
			date,
			value: benchCash + invested,
			cash: benchCash,
			invested
		});
	}
	return {
		equity,
		benchmark: bench,
		trades,
		weights,
		stats: statsFromEquity(equity, trades, bench),
		universe: wanted,
		lookback,
		readyDate
	};
}
function seriesFromCloses(ticker, currency, dates, closes) {
	return {
		ticker,
		currency,
		bars: dates.map((date, i) => {
			const c = closes[i] ?? closes[closes.length - 1] ?? 1;
			return {
				date,
				open: c,
				high: c,
				low: c,
				close: c,
				volume: 0
			};
		})
	};
}
function sliceSeries(series, from, to) {
	return series.map((s) => ({
		...s,
		bars: s.bars.filter((b) => b.date >= from && b.date <= to)
	}));
}
function sliceFx(fx, from, to) {
	return fx.filter((p) => p.date >= from && p.date <= to);
}
function matchSecurity(ledger, ticker) {
	const t = ticker.toUpperCase();
	return ledger.securities.find((s) => s.ticker.toUpperCase() === t || s.isin.toUpperCase() === t);
}
function asCcy(raw) {
	return raw.toUpperCase() === "USD" ? "USD" : "NOK";
}
function importedBars(ledger, isin) {
	const quotes = ledger.prices.filter((p) => p.isin === isin && isImportedQuoteSource(p.source)).slice().sort((a, b) => a.date.localeCompare(b.date));
	const byDate = /* @__PURE__ */ new Map();
	for (const q of quotes) byDate.set(q.date, q.close);
	return [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, close]) => ({
		date,
		open: close,
		high: close,
		low: close,
		close,
		volume: 0
	}));
}
function importedFx(ledger) {
	const pts = [];
	for (const q of ledger.fx) {
		if (!isImportedQuoteSource(q.source)) continue;
		const pair = q.pair.replace("/", "").toUpperCase();
		if (pair === "USDNOK" || pair === "USDNOK.") pts.push({
			date: q.date,
			usdNok: q.rate
		});
		else if (pair === "NOKUSD" && q.rate > 0) pts.push({
			date: q.date,
			usdNok: 1 / q.rate
		});
	}
	pts.sort((a, b) => a.date.localeCompare(b.date));
	const byDate = /* @__PURE__ */ new Map();
	for (const p of pts) byDate.set(p.date, p.usdNok);
	return [...byDate.entries()].map(([date, usdNok]) => ({
		date,
		usdNok
	}));
}
var DEMO_SET = new Set(DEMO_TICKERS.map((t) => t.ticker));
var cachedSeries = null;
var cachedFx = null;
function demoSeriesCached() {
	if (!cachedSeries) cachedSeries = buildDemoAssetSeries();
	return cachedSeries;
}
function demoFxCached() {
	if (!cachedFx) cachedFx = buildDemoFx(demoCalendar());
	return cachedFx;
}
function resolveBacktestData(mode, tickers, ledger = emptyLedgerBundle()) {
	const wanted = tickers.map((t) => t.toUpperCase());
	if (mode === "demo") {
		const missing = wanted.filter((t) => !DEMO_SET.has(t));
		if (missing.length) return {
			ok: false,
			missing,
			message: `Demo prices are not available for ${missing.join(", ")}.`
		};
		const all = demoSeriesCached();
		return {
			ok: true,
			series: wanted.map((t) => all.find((s) => s.ticker === t)),
			fx: demoFxCached()
		};
	}
	const missing = [];
	const series = [];
	let needsFx = false;
	for (const t of wanted) {
		const sec = matchSecurity(ledger, t);
		if (!sec) {
			missing.push(t);
			continue;
		}
		const bars = importedBars(ledger, sec.isin);
		if (bars.length < 2) {
			missing.push(t);
			continue;
		}
		const ccy = asCcy(sec.currency);
		if (ccy === "USD") needsFx = true;
		series.push({
			ticker: t,
			currency: ccy,
			bars
		});
	}
	if (missing.length) return {
		ok: false,
		missing,
		message: `My Data has no imported price history for ${missing.join(", ")}. Import a price/NAV file for each ticker — demo series are never substituted.`
	};
	let fx = [];
	if (needsFx) {
		fx = importedFx(ledger);
		if (fx.length < 2) return {
			ok: false,
			missing: ["USDNOK"],
			message: "USD names need imported USDNOK rates on My Data. Demo FX is never substituted."
		};
	}
	return {
		ok: true,
		series,
		fx
	};
}
function linspace(min, max, step) {
	if (!(step > 0)) return [min];
	const out = [];
	const n = Math.round((max - min) / step);
	for (let i = 0; i <= n; i++) {
		const v = min + i * step;
		if (v > max + step * .25) break;
		out.push(Number(v.toFixed(8)));
	}
	if (!out.length) out.push(min);
	if (out[out.length - 1] !== max && max >= min) out.push(max);
	return out;
}
function cartesian(grid) {
	const keys = Object.keys(grid);
	if (!keys.length) return [{}];
	let acc = [{}];
	for (const k of keys) {
		const vals = grid[k] ?? [];
		const next = [];
		for (const row of acc) for (const v of vals) next.push({
			...row,
			[k]: v
		});
		acc = next;
	}
	return acc;
}
function withOos(params, is, oos) {
	return {
		params,
		sharpe: is.sharpe,
		totalReturn: is.totalReturn,
		maxDd: is.maxDd,
		vol: is.vol,
		nTrades: is.nTrades,
		oosSharpe: oos.sharpe,
		oosReturn: oos.totalReturn,
		oosMaxDd: oos.maxDd
	};
}
function pointFromResult(params, stats) {
	return withOos(params, stats, stats);
}
/** Calendar split: first ~70% is in-sample; the rest is out-of-sample. */
function calendarSplitDate(series, frac = .7) {
	const dates = series[0]?.bars.map((b) => b.date) ?? [];
	if (dates.length < 30) return null;
	return dates[Math.max(8, Math.min(dates.length - 8, Math.floor(dates.length * frac)))] ?? null;
}
function runSweep(program, series, fx, config, grid, onPoint) {
	const sets = cartesian(grid);
	const points = [];
	const total = Math.max(1, sets.length);
	const split = calendarSplitDate(series, .7);
	for (let i = 0; i < sets.length; i++) {
		const params = sets[i];
		const merged = {
			...config,
			params: {
				...config.params,
				...params
			}
		};
		const isResult = runBacktest(program, series, fx, split ? {
			...merged,
			tradeEndDate: split
		} : merged);
		const oosResult = split ? runBacktest(program, series, fx, {
			...merged,
			tradeStartDate: split
		}) : isResult;
		const point = withOos(params, isResult.stats, oosResult.stats);
		points.push(point);
		onPoint?.(i + 1, total, point);
	}
	let best = null;
	for (const p of points) if (!best || p.sharpe > best.sharpe) best = p;
	return {
		points,
		best
	};
}
function pickBestParams(points) {
	if (!points.length) return {};
	let best = points[0];
	for (const p of points) if (p.sharpe > best.sharpe) best = p;
	return { ...best.params };
}
//#endregion
export { trimResult as C, tradingDays as S, runSweep as _, buildDemoAssetSeries as a, sliceSeries as b, compile as c, pickBestParams as d, pointFromResult as f, runBacktest as g, rsiWilder as h, ZERO_COST_CONFIG as i, demoCalendar as l, resolveBacktestData as m, DEFAULT_STRATEGY as n, buildDemoFx as o, requiredLookback as p, PARAM_STRATEGY as r, cartesian as s, DEFAULT_BACKTEST_CONFIG as t, linspace as u, seriesFromCloses as v, tryCompile as w, sma as x, sliceFx as y };
