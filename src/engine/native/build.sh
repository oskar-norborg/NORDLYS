#!/bin/sh
set -eu
cd "$(dirname "$0")/../../.."
rustc --target wasm32-unknown-unknown -O -C panic=abort -C lto=fat -C opt-level=3 \
  --crate-type cdylib src/engine/native/kernel.rs -o src/engine/native/mc_kernel.wasm
node --input-type=module -e '
import fs from "fs";
const b = fs.readFileSync("src/engine/native/mc_kernel.wasm");
const b64 = b.toString("base64");
const src = `/* Auto-generated from native/mc_kernel.wasm. Do not edit. */\nexport const MC_KERNEL_WASM_B64 = "${b64}";\nexport function mcKernelBytes(): Uint8Array {\n  const bin = atob(MC_KERNEL_WASM_B64);\n  const out = new Uint8Array(bin.length);\n  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);\n  return out;\n}\n`;
fs.writeFileSync("src/engine/mc-kernel-bytes.ts", src);
console.log("wrote", b.length, "wasm bytes");
'
