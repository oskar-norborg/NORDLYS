import { B as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { it as cn, st as formatMoney } from "./router-DE00T9yP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/field-CX5Y1XAQ.js
var import_jsx_runtime = require_jsx_runtime();
function Field({ label, children, hint, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex min-w-0 flex-col gap-1", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs font-medium tracking-wide text-muted uppercase",
				children: label
			}),
			children,
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs text-subtle",
				children: hint
			}) : null
		]
	});
}
function TextInput(props) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		...props,
		className: cn("field-input", props.className)
	});
}
function SelectInput(props) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
		...props,
		className: cn("field-input appearance-none pr-8", props.className),
		style: {
			backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='%238b958f' d='M1 1l5 5 5-5'/></svg>")`,
			backgroundRepeat: "no-repeat",
			backgroundPosition: "right 12px center"
		}
	});
}
function MoneyInput({ value, onChange, currency, privacy, min = 0, step = 1e3 }) {
	if (privacy) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "field-input flex items-center text-muted",
		"aria-label": "Hidden by privacy mode",
		children: formatMoney(value, currency, true)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextInput, {
		type: "number",
		min,
		step,
		value: Number.isFinite(value) ? value : 0,
		onChange: (e) => onChange(Number(e.target.value))
	});
}
function SliderRow({ label, valueLabel, min, max, step, value, onChange, onLiveStart, onLiveEnd }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-baseline justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm text-fg",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono text-sm tabular-nums text-accent",
				children: valueLabel
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "range",
			min,
			max,
			step,
			value,
			onPointerDown: () => {
				onLiveStart?.();
				const up = () => {
					onLiveEnd?.();
					window.removeEventListener("pointerup", up);
					window.removeEventListener("pointercancel", up);
				};
				window.addEventListener("pointerup", up);
				window.addEventListener("pointercancel", up);
			},
			onInput: (e) => onChange(Number(e.target.value)),
			className: "h-11 w-full accent-accent",
			"aria-label": label
		})]
	});
}
function Panel({ title, kicker, action, children, id }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id,
		className: "panel p-5 sm:p-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "mb-5 flex items-start justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [kicker ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "kicker mb-1",
				children: kicker
			}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-base font-medium tracking-tight text-fg",
				children: title
			})] }), action]
		}), children]
	});
}
//#endregion
export { SliderRow as a, SelectInput as i, MoneyInput as n, TextInput as o, Panel as r, Field as t };
