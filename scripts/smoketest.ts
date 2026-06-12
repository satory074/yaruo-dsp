// 数値計算ライブラリと manifest 整合のスモークテスト（DOM 不要）。
// 実行: npx tsx scripts/smoketest.ts
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  fft,
  ifft,
  dftNaive,
  magnitude,
  windowFn,
  convolve,
  freqz,
  sinc,
  squareWavePartialSum,
  trianglePartialSum,
  idealWave,
  fourierCoeffsNumeric,
} from "../src/lib/dsp";
import { demoMeta } from "../src/demos/manifest";
import { demoLoaders } from "../src/demos/index";

let failures = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    console.error(`❌ FAILED: ${msg}`);
    failures++;
  }
}

function assertClose(actual: number, expected: number, msg: string, tol = 1e-9): void {
  assert(Math.abs(actual - expected) <= tol, `${msg} (expected ${expected}, got ${actual})`);
}

// ---- FFT ----
{
  // インパルス → 全ビン 1
  const re = new Float64Array(16);
  const im = new Float64Array(16);
  re[0] = 1;
  fft(re, im);
  for (let i = 0; i < 16; i++) {
    assertClose(re[i], 1, `fft(impulse) re[${i}]`);
    assertClose(im[i], 0, `fft(impulse) im[${i}]`);
  }

  // 単一正弦波 cos(2π·3n/N) → ビン3とN-3だけ N/2
  const n = 64;
  const re2 = new Float64Array(n);
  const im2 = new Float64Array(n);
  for (let i = 0; i < n; i++) re2[i] = Math.cos((2 * Math.PI * 3 * i) / n);
  fft(re2, im2);
  const mag = magnitude(re2, im2);
  for (let k = 0; k < n; k++) {
    const expected = k === 3 || k === n - 3 ? n / 2 : 0;
    assertClose(mag[k], expected, `fft(cos) bin ${k}`, 1e-8);
  }

  // dftNaive と一致
  const re3 = new Float64Array(16).map(() => Math.sin(1 + Math.random() * 0)); // 決定的に
  for (let i = 0; i < 16; i++) re3[i] = Math.sin(i * 1.7) + 0.3 * Math.cos(i * 0.6);
  const im3 = new Float64Array(16);
  const naive = dftNaive(re3, im3);
  const re4 = re3.slice();
  const im4 = im3.slice();
  fft(re4, im4);
  for (let k = 0; k < 16; k++) {
    assertClose(re4[k], naive.re[k], `fft vs dftNaive re[${k}]`, 1e-9);
    assertClose(im4[k], naive.im[k], `fft vs dftNaive im[${k}]`, 1e-9);
  }

  // ifft(fft(x)) == x
  const orig = new Float64Array(32);
  for (let i = 0; i < 32; i++) orig[i] = Math.sin(i * 0.9) * Math.exp(-i / 20);
  const re5 = orig.slice();
  const im5 = new Float64Array(32);
  fft(re5, im5);
  ifft(re5, im5);
  for (let i = 0; i < 32; i++) {
    assertClose(re5[i], orig[i], `ifft(fft(x))[${i}]`, 1e-10);
    assertClose(im5[i], 0, `ifft(fft(x)) im[${i}]`, 1e-10);
  }

  // パーセバル: Σ|x|² == Σ|X|²/N
  const re6 = orig.slice();
  const im6 = new Float64Array(32);
  fft(re6, im6);
  let timeEnergy = 0;
  let freqEnergy = 0;
  for (let i = 0; i < 32; i++) {
    timeEnergy += orig[i] * orig[i];
    freqEnergy += (re6[i] * re6[i] + im6[i] * im6[i]) / 32;
  }
  assertClose(freqEnergy, timeEnergy, "Parseval", 1e-9);

  console.log("[smoke] FFT OK");
}

// ---- 窓関数 ----
{
  for (const kind of ["rect", "hann", "hamming", "blackman"] as const) {
    const w = windowFn(kind, 33);
    for (let i = 0; i < 33; i++) {
      assertClose(w[i], w[32 - i], `${kind} symmetry at ${i}`, 1e-12);
    }
  }
  const hann = windowFn("hann", 33);
  assertClose(hann[0], 0, "hann endpoint");
  assertClose(hann[16], 1, "hann center");
  const hamming = windowFn("hamming", 33);
  assertClose(hamming[0], 0.08, "hamming endpoint", 1e-12);
  console.log("[smoke] windows OK");
}

// ---- たたみこみ ----
{
  const c = convolve([1, 1], [1, 1]);
  assert(c.length === 3, "convolve length");
  assertClose(c[0], 1, "convolve [0]");
  assertClose(c[1], 2, "convolve [1]");
  assertClose(c[2], 1, "convolve [2]");

  const c2 = convolve([1, 2, 3], [0, 1, 0.5]);
  // 手計算: [0, 1, 2.5, 4, 1.5]
  const expected = [0, 1, 2.5, 4, 1.5];
  assert(c2.length === 5, "convolve length 2");
  expected.forEach((e, i) => assertClose(c2[i], e, `convolve2 [${i}]`));
  console.log("[smoke] convolve OK");
}

// ---- freqz ----
{
  // 5点移動平均: ω = 2πk/5 にヌル、ω=0 で利得1
  const M = 5;
  const b = Array(M).fill(1 / M);
  const { omega, mag } = freqz(b, [1], 1001);
  assertClose(mag[0], 1, "moving average |H(0)|");
  // ω = 2π/5 ≈ 1.2566 に最も近い格子点でほぼ0
  const target = (2 * Math.PI) / 5;
  let nearest = 0;
  for (let i = 1; i < omega.length; i++) {
    if (Math.abs(omega[i] - target) < Math.abs(omega[nearest] - target)) nearest = i;
  }
  assert(mag[nearest] < 5e-3, `moving average null at 2π/5 (got ${mag[nearest]})`);

  // 1次IIR y[n] = x[n] + 0.5 y[n-1] → |H(0)| = 1/(1-0.5) = 2
  const iir = freqz([1], [1, -0.5], 101);
  assertClose(iir.mag[0], 2, "IIR |H(0)|", 1e-9);
  assertClose(iir.mag[100], 1 / 1.5, "IIR |H(π)|", 1e-9);
  console.log("[smoke] freqz OK");
}

// ---- sinc / フーリエ級数部分和 ----
{
  assertClose(sinc(0), 1, "sinc(0)");
  assertClose(sinc(1), 0, "sinc(1)", 1e-12);
  assertClose(sinc(0.5), 2 / Math.PI, "sinc(0.5)", 1e-12);

  // 矩形波部分和は項数を増やすと理想波形に近づく（t=π/2 で誤差縮小）
  const errLow = Math.abs(squareWavePartialSum(Math.PI / 2, 5) - 1);
  const errHigh = Math.abs(squareWavePartialSum(Math.PI / 2, 101) - 1);
  assert(errHigh < errLow, "square partial sum converges");
  assert(errHigh < 0.01, `square partial sum N=101 error ${errHigh}`);

  // 三角波: 項数を増やすと理想波形に近づく（t=π/2 の裾誤差は ~1/(2n) のオーダー）
  const triErr5 = Math.abs(trianglePartialSum(Math.PI / 2, 5) - idealWave("triangle", Math.PI / 2));
  const triErr41 = Math.abs(trianglePartialSum(Math.PI / 2, 41) - idealWave("triangle", Math.PI / 2));
  assert(triErr41 < triErr5 && triErr41 < 0.05, `triangle converges (err5=${triErr5}, err41=${triErr41})`);

  // 数値フーリエ係数: 矩形波の b_1 = 4/π, b_2 = 0, a_k = 0
  const N = 4096;
  const sq = new Float64Array(N);
  for (let i = 0; i < N; i++) sq[i] = idealWave("square", (2 * Math.PI * i) / N + Math.PI); // 奇関数に位相合わせ
  const c1 = fourierCoeffsNumeric(sq, 1);
  const c2 = fourierCoeffsNumeric(sq, 2);
  assertClose(Math.abs(c1.b), 4 / Math.PI, "square b1", 1e-2);
  assertClose(c2.b, 0, "square b2", 1e-2);
  assertClose(c1.a, 0, "square a1", 1e-2);
  console.log("[smoke] series OK");
}

// ---- manifest ⇄ loaders ⇄ 章 frontmatter の整合 ----
{
  const metaKeys = Object.keys(demoMeta).sort();
  const loaderKeys = Object.keys(demoLoaders).sort();
  assert(
    JSON.stringify(metaKeys) === JSON.stringify(loaderKeys),
    `manifest keys != loader keys\n  meta: ${metaKeys}\n  loaders: ${loaderKeys}`,
  );

  const chaptersDir = join(import.meta.dirname, "../src/content/chapters");
  const usedDemos = new Set<string>();
  for (const file of readdirSync(chaptersDir).filter((f) => f.endsWith(".mdx"))) {
    const src = readFileSync(join(chaptersDir, file), "utf-8");
    const fm = src.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
    const demosLine = fm.match(/^demos:\s*\[(.*)\]\s*$/m)?.[1] ?? "";
    const ids = demosLine
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
    for (const id of ids) {
      assert(id in demoMeta, `${file}: demo "${id}" が manifest に無い`);
      usedDemos.add(id);
    }
    // frontmatter の demos と本文の <Demo id=...> の整合
    const bodyIds = [...src.matchAll(/<Demo\s+id="([^"]+)"/g)].map((m) => m[1]);
    assert(
      JSON.stringify([...bodyIds].sort()) === JSON.stringify([...ids].sort()),
      `${file}: frontmatter demos と本文の <Demo> が不一致\n  fm: ${ids}\n  body: ${bodyIds}`,
    );
  }
  for (const id of metaKeys) {
    assert(usedDemos.has(id), `demo "${id}" は manifest にあるがどの章でも使われていない`);
  }
  console.log(`[smoke] manifest 整合 OK (${metaKeys.length} demos)`);
}

if (failures > 0) {
  console.error(`\n${failures} 件の失敗`);
  process.exit(1);
}
console.log("\nsmoketest: all OK");
