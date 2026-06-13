// フィルタ解析・設計用の数値計算ライブラリ。DOM・canvas を一切 import しない純 TS。
// dsp.ts の windowFn / freqz を再利用する。tsx で直接ユニットテストできる
// （scripts/smoketest-design.ts）。

import { windowFn, freqz, type WindowKind } from "./dsp";

export interface Complex {
  re: number;
  im: number;
}

/** 複素数の積 */
export function cmul(a: Complex, b: Complex): Complex {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}

/** 複素数の商 a/b */
export function cdiv(a: Complex, b: Complex): Complex {
  const den = b.re * b.re + b.im * b.im;
  return { re: (a.re * b.re + a.im * b.im) / den, im: (a.im * b.re - a.re * b.im) / den };
}

/** 複素数の絶対値 */
export function cabs(a: Complex): number {
  return Math.hypot(a.re, a.im);
}

/**
 * 極・零点表現の伝達関数を単位円上 z = e^{jω} で直接評価する。
 * H(e^{jω}) = gain · Π(e^{jω} - z_i) / Π(e^{jω} - p_i)
 */
export function evalRationalZ(zeros: Complex[], poles: Complex[], gain: number, omega: number): Complex {
  const z: Complex = { re: Math.cos(omega), im: Math.sin(omega) };
  let num: Complex = { re: gain, im: 0 };
  for (const zi of zeros) {
    num = cmul(num, { re: z.re - zi.re, im: z.im - zi.im });
  }
  let den: Complex = { re: 1, im: 0 };
  for (const pi of poles) {
    den = cmul(den, { re: z.re - pi.re, im: z.im - pi.im });
  }
  return cdiv(num, den);
}

/**
 * 窓関数法による FIR ローパスフィルタ設計。
 * 理想 LPF のインパルス応答 h_d[n] = sin(ωc(n-M)) / (π(n-M))（n = M では ωc/π、
 * M = (numTaps-1)/2）に窓を掛けて有限長化する。cutoff は rad（0 < ωc < π）。
 */
export function firLowpassWindow(numTaps: number, cutoff: number, win: WindowKind): Float64Array {
  const M = (numTaps - 1) / 2;
  const w = windowFn(win, numTaps);
  const h = new Float64Array(numTaps);
  for (let n = 0; n < numTaps; n++) {
    const k = n - M;
    const ideal = Math.abs(k) < 1e-12 ? cutoff / Math.PI : Math.sin(cutoff * k) / (Math.PI * k);
    h[n] = ideal * w[n];
  }
  return h;
}

/** 位相列のアンラップ。隣接サンプル間の飛びが ±π に収まるよう 2π の整数倍を補正する */
export function unwrapPhase(phase: ArrayLike<number>): Float64Array {
  const out = new Float64Array(phase.length);
  if (phase.length === 0) return out;
  out[0] = phase[0];
  for (let i = 1; i < phase.length; i++) {
    let d = phase[i] - phase[i - 1];
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    out[i] = out[i - 1] + d;
  }
  return out;
}

/**
 * 群遅延 τ(ω) = -dφ/dω を数値微分で求める。
 * freqz の位相を unwrap してから中心差分（端は片側差分）で -Δφ/Δω を計算する。
 */
export function groupDelay(
  b: ArrayLike<number>,
  a: ArrayLike<number>,
  nPoints: number,
): { omega: Float64Array; gd: Float64Array } {
  const { omega, phase } = freqz(b, a, nPoints);
  const ph = unwrapPhase(phase);
  const gd = new Float64Array(nPoints);
  for (let i = 0; i < nPoints; i++) {
    const i0 = Math.max(0, i - 1);
    const i1 = Math.min(nPoints - 1, i + 1);
    gd[i] = -(ph[i1] - ph[i0]) / (omega[i1] - omega[i0]);
  }
  return { omega, gd };
}

/** バタワースフィルタの振幅特性 |H(jw)| = 1 / sqrt(1 + (w/wc)^{2N}) */
export function butterworthMag(order: number, wc: number, w: number): number {
  return 1 / Math.sqrt(1 + Math.pow(w / wc, 2 * order));
}

/**
 * バタワースフィルタの極（左半平面のみ）。
 * s_k = wc · exp(j·π(2k+N+1)/(2N)), k = 0..N-1
 */
export function butterworthPoles(order: number, wc: number): Complex[] {
  const poles: Complex[] = [];
  for (let k = 0; k < order; k++) {
    const theta = (Math.PI * (2 * k + order + 1)) / (2 * order);
    poles.push({ re: wc * Math.cos(theta), im: wc * Math.sin(theta) });
  }
  return poles;
}

/** 双線形変換の周波数ワーピング Ω = (2/T) tan(ωT/2) */
export function bilinearWarp(omegaDigital: number, T: number): number {
  return (2 / T) * Math.tan((omegaDigital * T) / 2);
}
