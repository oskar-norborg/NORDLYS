/**
 * xoshiro256** PRNG, seeded via SplitMix64.
 * 64-bit state lives in a Uint32Array so the inner loop stays in the integer
 * JIT instead of BigInt. Bit-identical to the 64-bit C reference.
 * Reference: Vigna & Blackman, https://prng.di.unimi.it/xoshiro256starstar.c
 */

const INV_2_53 = 1 / 9007199254740992;
const TWO_PI = 2 * Math.PI;

function u32(n: number): number {
  return n >>> 0;
}

function add64(a0: number, a1: number, b0: number, b1: number): [number, number] {
  const lo = u32(a0 + b0);
  const hi = u32(a1 + b1 + (lo < a0 ? 1 : 0));
  return [lo, hi];
}

function shr64(a0: number, a1: number, k: number): [number, number] {
  if (k === 0) return [a0, a1];
  if (k >= 32) return [u32(a1 >>> (k - 32)), 0];
  return [u32((a0 >>> k) | (a1 << (32 - k))), u32(a1 >>> k)];
}

function xor64(a0: number, a1: number, b0: number, b1: number): [number, number] {
  return [a0 ^ b0, a1 ^ b1];
}

/** 32×32 → [lo, hi]. Each partial product stays < 2^32 so bitwise ops are safe. */
function mul32(a: number, b: number): [number, number] {
  a = u32(a);
  b = u32(b);
  const aL = a & 0xffff;
  const aH = a >>> 16;
  const bL = b & 0xffff;
  const bH = b >>> 16;
  const p0 = aL * bL;
  const p1 = aH * bL;
  const p2 = aL * bH;
  const p3 = aH * bH;
  const mid = (p0 >>> 16) + (p1 & 0xffff) + (p2 & 0xffff);
  const lo = u32((p0 & 0xffff) | (mid << 16));
  const hi = u32(p3 + (p1 >>> 16) + (p2 >>> 16) + (mid >>> 16));
  return [lo, hi];
}

/** Low 64 bits of a 64×64 product. */
function mul64(a0: number, a1: number, b0: number, b1: number): [number, number] {
  const [ll, lh] = mul32(a0, b0);
  const [c0] = mul32(a0, b1);
  const [d0] = mul32(a1, b0);
  return [ll, u32(lh + c0 + d0)];
}

export function splitmix64(state0: number, state1: number): { s0: number; s1: number; v0: number; v1: number } {
  let [s0, s1] = add64(state0, state1, 0x7f4a7c15, 0x9e3779b9);
  let z0 = s0;
  let z1 = s1;
  ;[z0, z1] = xor64(z0, z1, ...shr64(z0, z1, 30));
  ;[z0, z1] = mul64(z0, z1, 0x1ce4e5b9, 0xbf58476d);
  ;[z0, z1] = xor64(z0, z1, ...shr64(z0, z1, 27));
  ;[z0, z1] = mul64(z0, z1, 0x133111eb, 0x94d049bb);
  ;[z0, z1] = xor64(z0, z1, ...shr64(z0, z1, 31));
  return { s0, s1, v0: z0, v1: z1 };
}

export class Xoshiro256ss {
  private s = new Uint32Array(8);
  private spare: number | null = null;
  /** High 32 bits of the last `nextLo()` result. */
  private hi = 0;

  constructor(seed: number | bigint) {
    let s0: number;
    let s1: number;
    if (typeof seed === "bigint") {
      s0 = Number(seed & 0xffffffffn) >>> 0;
      s1 = Number((seed >> 32n) & 0xffffffffn) >>> 0;
    } else {
      s0 = Math.trunc(seed) >>> 0;
      s1 = 0;
    }
    const a = splitmix64(s0, s1);
    this.s[0] = a.v0;
    this.s[1] = a.v1;
    const b = splitmix64(a.s0, a.s1);
    this.s[2] = b.v0;
    this.s[3] = b.v1;
    const c = splitmix64(b.s0, b.s1);
    this.s[4] = c.v0;
    this.s[5] = c.v1;
    const d = splitmix64(c.s0, c.s1);
    this.s[6] = d.v0;
    this.s[7] = d.v1;
  }

  nextU64(): bigint {
    const lo = this.nextLo();
    return (BigInt(this.hi) << 32n) | BigInt(lo);
  }

  /** Uniform in [0, 1). Uses the top 53 bits. */
  nextFloat(): number {
    const lo = this.nextLo();
    return (this.hi * 2097152 + (lo >>> 11)) * INV_2_53;
  }

  /**
   * Fill `out` with standard normals via Box–Muller. Even lengths avoid a spare.
   */
  fillGaussians(out: Float64Array): void {
    const n = out.length;
    let i = 0;
    if (this.spare !== null && n > 0) {
      out[0] = this.spare;
      this.spare = null;
      i = 1;
    }
    for (; i + 1 < n; i += 2) {
      let u = this.nextFloat();
      if (u < 1e-16) u = 1e-16;
      const v = this.nextFloat();
      const mag = Math.sqrt(-2 * Math.log(u));
      const tau = TWO_PI * v;
      out[i] = mag * Math.cos(tau);
      out[i + 1] = mag * Math.sin(tau);
    }
    if (i < n) out[i] = this.gaussian();
  }

  gaussian(): number {
    if (this.spare !== null) {
      const v = this.spare;
      this.spare = null;
      return v;
    }
    let u = this.nextFloat();
    if (u < 1e-16) u = 1e-16;
    const v = this.nextFloat();
    const mag = Math.sqrt(-2 * Math.log(u));
    const tau = TWO_PI * v;
    this.spare = mag * Math.sin(tau);
    return mag * Math.cos(tau);
  }

  /**
   * One xoshiro256** step. Returns the low 32 bits; high 32 bits in `this.hi`.
   * Fully inlined — no tuple allocations on the hot path.
   */
  private nextLo(): number {
    const s = this.s;
    const s0 = s[0]!;
    const s1 = s[1]!;
    const s2 = s[2]!;
    const s3 = s[3]!;
    const s4 = s[4]!;
    const s5 = s[5]!;
    const s6 = s[6]!;
    const s7 = s[7]!;

    // s1 * 5 = s1 + (s1 << 2)
    let t0 = (s2 << 2) >>> 0;
    let t1 = ((s3 << 2) | (s2 >>> 30)) >>> 0;
    let m0 = (t0 + s2) >>> 0;
    let m1 = (t1 + s3 + (m0 < t0 ? 1 : 0)) >>> 0;

    // rotl(s1*5, 7)
    t0 = ((m0 << 7) | (m1 >>> 25)) >>> 0;
    t1 = ((m1 << 7) | (m0 >>> 25)) >>> 0;

    // * 9 = x + (x << 3)
    m0 = (t0 << 3) >>> 0;
    m1 = ((t1 << 3) | (t0 >>> 29)) >>> 0;
    const r0 = (m0 + t0) >>> 0;
    this.hi = (m1 + t1 + (r0 < m0 ? 1 : 0)) >>> 0;

    // t = s1 << 17
    t0 = (s2 << 17) >>> 0;
    t1 = ((s3 << 17) | (s2 >>> 15)) >>> 0;

    // s2 ^= s0; s3 ^= s1; s1 ^= s2; s0 ^= s3; s2 ^= t; s3 = rotl(s3, 45)
    const n4 = s4 ^ s0;
    const n5 = s5 ^ s1;
    const n6 = s6 ^ s2;
    const n7 = s7 ^ s3;
    s[2] = s2 ^ n4;
    s[3] = s3 ^ n5;
    s[0] = s0 ^ n6;
    s[1] = s1 ^ n7;
    s[4] = n4 ^ t0;
    s[5] = n5 ^ t1;
    // rotl64(new s3, 45) = (x << 45) | (x >> 19)
    s[6] = ((n6 >>> 19) | (n7 << 13)) >>> 0;
    s[7] = ((n6 << 13) | (n7 >>> 19)) >>> 0;

    return r0;
  }
}

export function createRng(seed: number | bigint): Xoshiro256ss {
  return new Xoshiro256ss(seed);
}
