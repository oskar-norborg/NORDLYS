//! NORDLYS Monte Carlo inner loop. Compiled to wasm32-unknown-unknown.
//! Bit-identical xoshiro256** (SplitMix64 seed) and Acklam inverse-normal.
#![no_std]
#![no_main]

#[panic_handler]
fn panic(_: &core::panic::PanicInfo) -> ! {
    loop {}
}

static mut BUMP: usize = HEAP_START;
const HEAP_START: usize = 2 * 1024 * 1024; // sit above the WASM stack + data

#[no_mangle]
pub extern "C" fn init_heap() -> i32 {
    #[cfg(target_arch = "wasm32")]
    unsafe {
        let need: usize = 512; // 32 MiB
        let cur = core::arch::wasm32::memory_size(0);
        if need > cur {
            let r = core::arch::wasm32::memory_grow(0, need - cur);
            if r == usize::MAX {
                return -1;
            }
        }
        BUMP = HEAP_START;
    }
    0
}

#[no_mangle]
pub extern "C" fn reset_heap() {
    unsafe {
        BUMP = HEAP_START;
    }
}

#[no_mangle]
pub extern "C" fn alloc(n: u32) -> u32 {
    unsafe {
        let n = ((n as usize) + 7) & !7;
        let p = BUMP;
        BUMP = p + n;
        p as u32
    }
}

#[inline(always)]
fn splitmix(state: u64) -> (u64, u64) {
    let state = state.wrapping_add(0x9e3779b97f4a7c15);
    let mut z = state;
    z = (z ^ (z >> 30)).wrapping_mul(0xbf58476d1ce4e5b9);
    z = (z ^ (z >> 27)).wrapping_mul(0x94d049bb133111eb);
    (state, z ^ (z >> 31))
}

struct Rng {
    s: [u64; 4],
}

impl Rng {
    fn from_seed(seed: u32) -> Self {
        let mut st = seed as u64;
        let mut s = [0u64; 4];
        for slot in &mut s {
            let (nst, v) = splitmix(st);
            st = nst;
            *slot = v;
        }
        Self { s }
    }

    #[inline(always)]
    fn next_u64(&mut self) -> u64 {
        let s = &mut self.s;
        let result = s[1].wrapping_mul(5).rotate_left(7).wrapping_mul(9);
        let t = s[1] << 17;
        s[2] ^= s[0];
        s[3] ^= s[1];
        s[1] ^= s[2];
        s[0] ^= s[3];
        s[2] ^= t;
        s[3] = s[3].rotate_left(45);
        result
    }

    #[inline(always)]
    fn next_f64(&mut self) -> f64 {
        (self.next_u64() >> 11) as f64 * (1.0 / 9007199254740992.0)
    }
}

/// Natural log via (m,e) split and atanh series. Plenty for Acklam tails.
#[inline(always)]
fn ln(x: f64) -> f64 {
    if x <= 0.0 {
        return -1.0e300;
    }
    let bits = x.to_bits();
    let e = ((bits >> 52) & 0x7ff) as i64 - 1023;
    let m = f64::from_bits((bits & ((1u64 << 52) - 1)) | (1023u64 << 52));
    let y = (m - 1.0) / (m + 1.0);
    let y2 = y * y;
    let mut term = y;
    let mut s = 0.0;
    let mut k = 1.0;
    let mut i = 0;
    while i < 16 {
        s += term / k;
        term *= y2;
        k += 2.0;
        i += 1;
    }
    2.0 * s + (e as f64) * 0.693147180559945309417
}

#[inline(always)]
fn exp(x: f64) -> f64 {
    if x < -745.0 {
        return 0.0;
    }
    if x > 709.0 {
        return 1.0e300;
    }
    let nf = x * 1.4426950408889634;
    let n = if nf >= 0.0 { (nf + 0.5) as i32 } else { (nf - 0.5) as i32 };
    let r = x - (n as f64) * 0.6931471805599453;
    let r2 = r * r;
    let p = 1.0 + r + r2 * (0.5 + r * (1.0 / 6.0 + r * (1.0 / 24.0 + r * (1.0 / 120.0 + r * (1.0 / 720.0)))));
    p * f64::from_bits(((n + 1023) as u64) << 52)
}

include!("ziggurat_tables.rs");

#[inline(always)]
fn gaussian_hz(rng: &mut Rng, mut hz: i32) -> f64 {
    loop {
        let iz = (hz as u32) & 127;
        if ((hz as i64).unsigned_abs() as u32) < Z_KN[iz as usize] {
            return (hz as f64) * Z_WN[iz as usize];
        }
        if let Some(x) = nfix(rng, hz, iz) {
            return x;
        }
        hz = rng.next_u64() as i32;
    }
}

#[inline(always)]
fn gaussian(rng: &mut Rng) -> f64 {
    let hz = rng.next_u64() as i32;
    gaussian_hz(rng, hz)
}

#[inline(always)]
fn nfix(rng: &mut Rng, hz: i32, iz: u32) -> Option<f64> {
    let izu = iz as usize;
    let x = (hz as f64) * Z_WN[izu];
    if iz == 0 {
        loop {
            let mut u = rng.next_f64();
            if u < 1.0e-16 {
                u = 1.0e-16;
            }
            let mut v = rng.next_f64();
            if v < 1.0e-16 {
                v = 1.0e-16;
            }
            let xx = -ln(u) / Z_R;
            let y = -ln(v);
            if y + y >= xx * xx {
                return Some(if hz > 0 { Z_R + xx } else { -Z_R - xx });
            }
        }
    }
    let u = rng.next_f64();
    if Z_FN[izu] + u * (Z_FN[izu - 1] - Z_FN[izu]) < exp(-0.5 * x * x) {
        Some(x)
    } else {
        None
    }
}

#[inline(always)]
fn fill_gaussians(rng: &mut Rng, z: &mut [f64], n: usize) {
    let mut i = 0;
    while i + 1 < n {
        let bits = rng.next_u64();
        let hi = (bits >> 32) as i32;
        let lo = bits as i32;
        z[i] = gaussian_hz(rng, hi);
        z[i + 1] = gaussian_hz(rng, lo);
        i += 2;
    }
    if i < n {
        z[i] = gaussian(rng);
    }
}

#[no_mangle]
pub unsafe extern "C" fn run_paths(
    n_paths: i32,
    n_months: i32,
    n_assets: i32,
    n_goals: i32,
    n_years: i32,
    start_wealth: f64,
    fee_factor: f64,
    inf_step: f64,
    mu_p: f64,
    sig_p: f64,
    rebalance: i32,
    engine: i32,
    seed: u32,
    mu_m: *const f64,
    vol_m: *const f64,
    w: *const f64,
    lflat: *const f64,
    contribution: *const f64,
    withdrawal: *const f64,
    lump_off: *const i32,
    lump_count: *const i32,
    lump_gi: *const i32,
    lump_amt: *const f64,
    ret_gi: i32,
    n_legacy: i32,
    legacy_gi: *const i32,
    legacy_amt: *const f64,
    yearly: *mut f64,
    terminal: *mut f64,
    terminal_nf: *mut f64,
    terminal_assets: *mut f64,
    success_count: *mut i32,
    shortfall: *mut f64,
    sum_port_out: *mut f64,
    sum_port2_out: *mut f64,
    n_ret_out: *mut i32,
    sum_asset: *mut f64,
    sum_asset2: *mut f64,
    weight_sum: *mut f64,
) {
    let n_paths = n_paths as usize;
    let n_months = n_months as usize;
    let n_a = n_assets as usize;
    let n_goals = n_goals as usize;
    let n_years = n_years as usize;
    let monthly = rebalance == 1;
    let legacy = engine == 1;
    let n_legacy = n_legacy as usize;

    let mut rng = Rng::from_seed(seed);
    let mut z = [0.0f64; 8];
    let mut r = [0.0f64; 8];
    let mut h = [0.0f64; 8];
    let mut h_nf = [0.0f64; 8];
    let mut fail = [-1.0f64; 16];

    let mut sum_port = 0.0;
    let mut sum_port2 = 0.0;
    let mut n_ret = 0i32;

    let mut g = 0;
    while g < n_goals {
        *success_count.add(g) = 0;
        g += 1;
    }
    let mut i = 0;
    while i < n_a {
        *sum_asset.add(i) = 0.0;
        *sum_asset2.add(i) = 0.0;
        i += 1;
    }
    i = 0;
    let wlen = (n_years + 1) * n_a;
    while i < wlen {
        *weight_sum.add(i) = 0.0;
        i += 1;
    }

    let mut p = 0usize;
    while p < n_paths {
        let mut i = 0;
        while i < n_a {
            let hi = start_wealth * *w.add(i);
            h[i] = hi;
            h_nf[i] = hi;
            i += 1;
        }
        *yearly.add(p * (n_years + 1)) = start_wealth;
        {
            let mut tot = 0.0;
            i = 0;
            while i < n_a {
                tot += h[i];
                i += 1;
            }
            if tot > 0.0 {
                i = 0;
                while i < n_a {
                    *weight_sum.add(i) += h[i] / tot;
                    i += 1;
                }
            }
        }

        let mut inf = 1.0;
        let mut ret_failed = false;
        let mut ret_short = 0.0;
        let mut year_cursor = 1usize;
        i = 0;
        while i < n_goals && i < 16 {
            fail[i] = -1.0;
            i += 1;
        }

        let mut m = 0usize;
        while m < n_months {
            if legacy {
                let z1 = gaussian(&mut rng);
                let port = mu_p + sig_p * z1;
                i = 0;
                while i < n_a {
                    r[i] = port;
                    i += 1;
                }
            } else {
                fill_gaussians(&mut rng, &mut z, n_a);
                i = 0;
                while i < n_a {
                    let mut s = 0.0;
                    let row = i * n_a;
                    let mut j = 0;
                    while j <= i {
                        s += *lflat.add(row + j) * z[j];
                        j += 1;
                    }
                    r[i] = *mu_m.add(i) + *vol_m.add(i) * s;
                    i += 1;
                }
            }

            let mut total = 0.0;
            i = 0;
            while i < n_a {
                total += h[i];
                i += 1;
            }
            let mut port = 0.0;
            if total > 0.0 {
                i = 0;
                while i < n_a {
                    port += (h[i] / total) * r[i];
                    i += 1;
                }
            }
            sum_port += port;
            sum_port2 += port * port;
            n_ret += 1;
            i = 0;
            while i < n_a {
                let ri = r[i];
                *sum_asset.add(i) += ri;
                *sum_asset2.add(i) += ri * ri;
                let g = 1.0 + ri;
                h[i] *= g * fee_factor;
                h_nf[i] *= g;
                i += 1;
            }

            let c = *contribution.add(m) * inf;
            if c != 0.0 {
                total = 0.0;
                i = 0;
                while i < n_a {
                    total += h[i];
                    i += 1;
                }
                let mut total_nf = 0.0;
                i = 0;
                while i < n_a {
                    total_nf += h_nf[i];
                    i += 1;
                }
                if monthly || !(total > 0.0) {
                    i = 0;
                    while i < n_a {
                        h[i] += c * *w.add(i);
                        h_nf[i] += c * *w.add(i);
                        i += 1;
                    }
                } else {
                    i = 0;
                    while i < n_a {
                        h[i] += c * (h[i] / total);
                        h_nf[i] += if total_nf > 0.0 {
                            c * (h_nf[i] / total_nf)
                        } else {
                            c * *w.add(i)
                        };
                        i += 1;
                    }
                }
            }

            let wd = *withdrawal.add(m) * inf;
            if wd > 0.0 {
                total = 0.0;
                i = 0;
                while i < n_a {
                    total += h[i];
                    i += 1;
                }
                if total + 1.0e-12 >= wd {
                    let scale = 1.0 - wd / total;
                    i = 0;
                    while i < n_a {
                        h[i] *= scale;
                        i += 1;
                    }
                } else {
                    ret_failed = true;
                    ret_short += wd - if total > 0.0 { total } else { 0.0 };
                    i = 0;
                    while i < n_a {
                        h[i] = 0.0;
                        i += 1;
                    }
                }
                let mut total_nf = 0.0;
                i = 0;
                while i < n_a {
                    total_nf += h_nf[i];
                    i += 1;
                }
                if total_nf > 0.0 {
                    let take = if wd < total_nf { wd } else { total_nf };
                    let scale_nf = 1.0 - take / total_nf;
                    i = 0;
                    while i < n_a {
                        h_nf[i] *= scale_nf;
                        i += 1;
                    }
                }
            }

            let cnt = *lump_count.add(m) as usize;
            if cnt > 0 {
                let off = *lump_off.add(m) as usize;
                let mut k = 0;
                while k < cnt {
                    let gi = *lump_gi.add(off + k) as usize;
                    let need = *lump_amt.add(off + k) * inf;
                    total = 0.0;
                    i = 0;
                    while i < n_a {
                        total += h[i];
                        i += 1;
                    }
                    if total + 1.0e-12 >= need {
                        let scale = 1.0 - need / total;
                        i = 0;
                        while i < n_a {
                            h[i] *= scale;
                            i += 1;
                        }
                        let mut total_nf = 0.0;
                        i = 0;
                        while i < n_a {
                            total_nf += h_nf[i];
                            i += 1;
                        }
                        if total_nf > 0.0 {
                            let take = if need < total_nf { need } else { total_nf };
                            let scale_nf = 1.0 - take / total_nf;
                            i = 0;
                            while i < n_a {
                                h_nf[i] *= scale_nf;
                                i += 1;
                            }
                        }
                        if gi < 16 && fail[gi] < 0.0 {
                            fail[gi] = 0.0;
                        }
                    } else if gi < 16 && fail[gi] < 0.0 {
                        fail[gi] = need - if total > 0.0 { total } else { 0.0 };
                    }
                    k += 1;
                }
            }

            if monthly {
                total = 0.0;
                i = 0;
                while i < n_a {
                    total += h[i];
                    i += 1;
                }
                let mut total_nf = 0.0;
                i = 0;
                while i < n_a {
                    total_nf += h_nf[i];
                    i += 1;
                }
                i = 0;
                while i < n_a {
                    h[i] = *w.add(i) * total;
                    h_nf[i] = *w.add(i) * total_nf;
                    i += 1;
                }
            }

            inf *= inf_step;

            if (m + 1) % 12 == 0 && year_cursor <= n_years {
                let mut wealth = 0.0;
                i = 0;
                while i < n_a {
                    wealth += h[i];
                    i += 1;
                }
                *yearly.add(p * (n_years + 1) + year_cursor) = wealth;
                if wealth > 0.0 {
                    i = 0;
                    while i < n_a {
                        *weight_sum.add(year_cursor * n_a + i) += h[i] / wealth;
                        i += 1;
                    }
                }
                year_cursor += 1;
            }

            m += 1;
        }

        let mut wealth = 0.0;
        let mut wealth_nf = 0.0;
        i = 0;
        while i < n_a {
            wealth += h[i];
            wealth_nf += h_nf[i];
            i += 1;
        }
        if year_cursor <= n_years {
            *yearly.add(p * (n_years + 1) + n_years) = wealth;
            if wealth > 0.0 {
                i = 0;
                while i < n_a {
                    *weight_sum.add(n_years * n_a + i) += h[i] / wealth;
                    i += 1;
                }
            }
        }

        *terminal.add(p) = wealth;
        *terminal_nf.add(p) = wealth_nf;
        i = 0;
        while i < n_a {
            *terminal_assets.add(p * n_a + i) = h[i];
            i += 1;
        }

        if ret_gi >= 0 {
            let rg = ret_gi as usize;
            if rg < 16 {
                if ret_failed {
                    fail[rg] = ret_short;
                } else if fail[rg] < 0.0 {
                    fail[rg] = 0.0;
                }
            }
        }

        let mut li = 0;
        while li < n_legacy {
            let gi = *legacy_gi.add(li) as usize;
            let need = *legacy_amt.add(li) * inf;
            if gi < 16 {
                if wealth + 1.0e-12 >= need {
                    if fail[gi] < 0.0 {
                        fail[gi] = 0.0;
                    }
                } else if fail[gi] < 0.0 {
                    fail[gi] = need - wealth;
                }
            }
            li += 1;
        }

        i = 0;
        while i < n_goals {
            let s = if i < 16 { fail[i] } else { -1.0 };
            *shortfall.add(p * n_goals + i) = s;
            if s <= 0.0 {
                *success_count.add(i) += 1;
            }
            i += 1;
        }

        p += 1;
    }

    *sum_port_out = sum_port;
    *sum_port2_out = sum_port2;
    *n_ret_out = n_ret;
}

#[no_mangle]
pub extern "C" fn kernel_version() -> i32 {
    2
}
