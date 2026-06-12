// 数値計算ライブラリ。DOM・canvas を一切 import しない純 TS。
// tsx で直接ユニットテストできる（scripts/smoketest.ts）。

/** in-place radix-2 FFT。長さは 2 の冪であること */
export function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  if (n !== im.length) throw new Error("fft: re/im length mismatch");
  if ((n & (n - 1)) !== 0 || n === 0) throw new Error(`fft: length must be a power of 2, got ${n}`);

  // ビット反転並べ替え
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wRe = Math.cos(ang);
    const wIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1;
      let curIm = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k;
        const b = i + k + len / 2;
        const tRe = re[b] * curRe - im[b] * curIm;
        const tIm = re[b] * curIm + im[b] * curRe;
        re[b] = re[a] - tRe;
        im[b] = im[a] - tIm;
        re[a] += tRe;
        im[a] += tIm;
        const nextRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = nextRe;
      }
    }
  }
}

/** in-place 逆FFT（1/N 正規化込み） */
export function ifft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  for (let i = 0; i < n; i++) im[i] = -im[i];
  fft(re, im);
  for (let i = 0; i < n; i++) {
    re[i] /= n;
    im[i] /= -n;
  }
}

/** O(N^2) の素朴な DFT。FFT の検証用 */
export function dftNaive(
  re: ArrayLike<number>,
  im: ArrayLike<number>,
): { re: Float64Array; im: Float64Array } {
  const n = re.length;
  const outRe = new Float64Array(n);
  const outIm = new Float64Array(n);
  for (let k = 0; k < n; k++) {
    let sumRe = 0;
    let sumIm = 0;
    for (let m = 0; m < n; m++) {
      const ang = (-2 * Math.PI * k * m) / n;
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      sumRe += re[m] * c - im[m] * s;
      sumIm += re[m] * s + im[m] * c;
    }
    outRe[k] = sumRe;
    outIm[k] = sumIm;
  }
  return { re: outRe, im: outIm };
}

export function magnitude(re: ArrayLike<number>, im: ArrayLike<number>): Float64Array {
  const out = new Float64Array(re.length);
  for (let i = 0; i < re.length; i++) out[i] = Math.hypot(re[i], im[i]);
  return out;
}

export type WindowKind = "rect" | "hann" | "hamming" | "blackman";

export function windowFn(kind: WindowKind, n: number): Float64Array {
  const w = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const x = (2 * Math.PI * i) / (n - 1);
    switch (kind) {
      case "rect":
        w[i] = 1;
        break;
      case "hann":
        w[i] = 0.5 - 0.5 * Math.cos(x);
        break;
      case "hamming":
        w[i] = 0.54 - 0.46 * Math.cos(x);
        break;
      case "blackman":
        w[i] = 0.42 - 0.5 * Math.cos(x) + 0.08 * Math.cos(2 * x);
        break;
    }
  }
  return w;
}

/** 線形たたみこみ。長さは a.length + b.length - 1 */
export function convolve(a: ArrayLike<number>, b: ArrayLike<number>): Float64Array {
  const out = new Float64Array(a.length + b.length - 1);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      out[i + j] += a[i] * b[j];
    }
  }
  return out;
}

/**
 * 離散時間システム H(z) = B(z)/A(z) の周波数応答を ω ∈ [0, π] で評価。
 * b, a は z^-1 の多項式係数（a[0] = 1 が通例）。
 */
export function freqz(
  b: ArrayLike<number>,
  a: ArrayLike<number>,
  nPoints = 512,
): { omega: Float64Array; re: Float64Array; im: Float64Array; mag: Float64Array; phase: Float64Array } {
  const omega = new Float64Array(nPoints);
  const re = new Float64Array(nPoints);
  const im = new Float64Array(nPoints);
  const mag = new Float64Array(nPoints);
  const phase = new Float64Array(nPoints);
  for (let i = 0; i < nPoints; i++) {
    const w = (Math.PI * i) / (nPoints - 1);
    omega[i] = w;
    // e^{-jωk} の級数で評価
    let bRe = 0;
    let bIm = 0;
    for (let k = 0; k < b.length; k++) {
      bRe += b[k] * Math.cos(-w * k);
      bIm += b[k] * Math.sin(-w * k);
    }
    let aRe = 0;
    let aIm = 0;
    for (let k = 0; k < a.length; k++) {
      aRe += a[k] * Math.cos(-w * k);
      aIm += a[k] * Math.sin(-w * k);
    }
    const den = aRe * aRe + aIm * aIm;
    re[i] = (bRe * aRe + bIm * aIm) / den;
    im[i] = (bIm * aRe - bRe * aIm) / den;
    mag[i] = Math.hypot(re[i], im[i]);
    phase[i] = Math.atan2(im[i], re[i]);
  }
  return { omega, re, im, mag, phase };
}

/** 正規化 sinc: sin(πx)/(πx) */
export function sinc(x: number): number {
  if (Math.abs(x) < 1e-12) return 1;
  const px = Math.PI * x;
  return Math.sin(px) / px;
}

/**
 * 矩形波（振幅±1、周期2π）のフーリエ級数部分和。
 * f(t) = (4/π) Σ_{k odd} sin(kt)/k を第 n 高調波まで。
 */
export function squareWavePartialSum(t: number, n: number): number {
  let sum = 0;
  for (let k = 1; k <= n; k += 2) {
    sum += Math.sin(k * t) / k;
  }
  return (4 / Math.PI) * sum;
}

/**
 * のこぎり波（振幅±1、周期2π）のフーリエ級数部分和。
 * f(t) = (2/π) Σ_{k≥1} (-1)^{k+1} sin(kt)/k
 */
export function sawtoothPartialSum(t: number, n: number): number {
  let sum = 0;
  for (let k = 1; k <= n; k++) {
    sum += ((k % 2 === 1 ? 1 : -1) * Math.sin(k * t)) / k;
  }
  return (2 / Math.PI) * sum;
}

/**
 * 三角波（振幅±1、周期2π）のフーリエ級数部分和。
 * f(t) = (8/π²) Σ_{k odd} (-1)^{(k-1)/2} sin(kt)/k²
 */
export function trianglePartialSum(t: number, n: number): number {
  let sum = 0;
  for (let k = 1; k <= n; k += 2) {
    const sign = ((k - 1) / 2) % 2 === 0 ? 1 : -1;
    sum += (sign * Math.sin(k * t)) / (k * k);
  }
  return (8 / (Math.PI * Math.PI)) * sum;
}

/** 周期2πの理想波形（部分和の収束先） */
export function idealWave(kind: "square" | "sawtooth" | "triangle", t: number): number {
  // t を [-π, π) に折り畳む
  let x = ((((t + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
  switch (kind) {
    case "square":
      return x >= 0 ? 1 : -1;
    case "sawtooth":
      return x / Math.PI;
    case "triangle":
      return x >= 0 ? 1 - (2 * Math.abs(x - Math.PI / 2)) / Math.PI : -(1 - (2 * Math.abs(x + Math.PI / 2)) / Math.PI);
  }
}

/**
 * サンプル列からフーリエ係数 a_k, b_k を数値積分（台形則相当）で求める。
 * samples は 1 周期分とみなす。
 */
export function fourierCoeffsNumeric(samples: ArrayLike<number>, k: number): { a: number; b: number } {
  const n = samples.length;
  let a = 0;
  let b = 0;
  for (let i = 0; i < n; i++) {
    const t = (2 * Math.PI * i) / n;
    a += samples[i] * Math.cos(k * t);
    b += samples[i] * Math.sin(k * t);
  }
  const scale = k === 0 ? 1 / n : 2 / n;
  return { a: a * scale, b: b * scale };
}
