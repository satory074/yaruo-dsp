// フィルタ解析・設計ライブラリ（src/lib/dsp-design.ts）の数値スモークテスト。
// DOM 不要。実行: npx tsx scripts/smoketest-design.ts
// 既存 scripts/smoketest.ts と同じ流儀（失敗カウント → 最後に process.exit(1)）。
import {
  firLowpassWindow,
  groupDelay,
  butterworthMag,
  butterworthPoles,
  evalRationalZ,
  bilinearWarp,
  unwrapPhase,
  cabs,
  cmul,
  cdiv,
} from "../src/lib/dsp-design";
import { freqz } from "../src/lib/dsp";

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

// ---- 複素数の基本演算 ----
{
  const a = { re: 1, im: 2 };
  const b = { re: 3, im: -1 };
  const p = cmul(a, b); // (1+2j)(3-j) = 3 - j + 6j - 2j² = 5 + 5j
  assertClose(p.re, 5, "cmul re");
  assertClose(p.im, 5, "cmul im");
  const q = cdiv({ re: 1, im: 0 }, { re: 0, im: 1 }); // 1/j = -j
  assertClose(q.re, 0, "cdiv re");
  assertClose(q.im, -1, "cdiv im");
  assertClose(cabs({ re: 3, im: 4 }), 5, "cabs");
  console.log("[smoke-design] complex OK");
}

// ---- firLowpassWindow ----
{
  // 対称性 h[n] = h[N-1-n]
  const h = firLowpassWindow(21, Math.PI / 2, "hamming");
  assert(h.length === 21, "firLowpassWindow length");
  for (let n = 0; n < 21; n++) {
    assertClose(h[n], h[20 - n], `FIR symmetry at ${n}`, 1e-12);
  }
  // freqz で直流利得 ≈ 1（窓による微小な逸脱は許容）
  const { omega, mag } = freqz(Array.from(h), [1], 512);
  assert(mag[0] > 0.95 && mag[0] < 1.05, `FIR |H(0)| in [0.95,1.05] (got ${mag[0]})`);
  // 阻止域 |H(0.9π)| < 0.05
  let idx = 0;
  for (let i = 0; i < omega.length; i++) {
    if (Math.abs(omega[i] - 0.9 * Math.PI) < Math.abs(omega[idx] - 0.9 * Math.PI)) idx = i;
  }
  assert(mag[idx] < 0.05, `FIR |H(0.9π)| < 0.05 (got ${mag[idx]})`);

  // 矩形窓はリップルが大きく、阻止域がハミングより浅い（窓の効果の確認）
  const hRect = firLowpassWindow(21, Math.PI / 2, "rect");
  const fr = freqz(Array.from(hRect), [1], 512);
  assert(fr.mag[idx] > mag[idx], "rect 窓は hamming より阻止域が浅い");
  console.log("[smoke-design] firLowpassWindow OK");
}

// ---- butterworthMag ----
{
  // |H(jωc)| = 1/√2（カットオフで -3dB）を N = 1..8 で確認
  for (let N = 1; N <= 8; N++) {
    assertClose(butterworthMag(N, 1, 1), 1 / Math.SQRT2, `butterworth |H(ωc)| N=${N}`, 1e-12);
  }
  // 高次ほど阻止域が深い: N=8 の |H(1.5ωc)| < N=2 の |H(1.5ωc)|
  assert(
    butterworthMag(8, 1, 1.5) < butterworthMag(2, 1, 1.5),
    "butterworth: 高次ほど 1.5ωc で減衰が大きい",
  );
  // 直流で利得 1
  assertClose(butterworthMag(4, 1, 0), 1, "butterworth |H(0)|=1");
  console.log("[smoke-design] butterworthMag OK");
}

// ---- butterworthPoles ----
{
  for (let N = 1; N <= 6; N++) {
    const poles = butterworthPoles(N, 1.3);
    assert(poles.length === N, `butterworth pole count N=${N} (got ${poles.length})`);
    for (const p of poles) {
      assert(p.re < 0, `butterworth pole re<0 (got ${p.re})`);
      assertClose(cabs(p), 1.3, `butterworth |s_k|=ωc`, 1e-9);
    }
  }
  console.log("[smoke-design] butterworthPoles OK");
}

// ---- groupDelay ----
{
  // 対称 FIR（21タップ）は群遅延 M = (21-1)/2 = 10 で平坦
  const h = firLowpassWindow(21, Math.PI / 2, "hamming");
  const { omega, gd } = groupDelay(Array.from(h), [1], 512);
  let sum = 0;
  let cnt = 0;
  for (let i = 0; i < omega.length; i++) {
    if (omega[i] >= 0.2 * Math.PI && omega[i] <= 0.4 * Math.PI) {
      sum += gd[i];
      cnt++;
    }
  }
  const avg = sum / cnt;
  assertClose(avg, 10, "FIR group delay ≈ 10 (mid band)", 0.5);
  console.log("[smoke-design] groupDelay OK");
}

// ---- evalRationalZ ----
{
  // zeros=[], poles=[0.5], gain=1, ω=0 → H = 1/(1-0.5) = 2
  const H = evalRationalZ([], [{ re: 0.5, im: 0 }], 1, 0);
  assertClose(cabs(H), 2, "evalRationalZ |H(0)|=2", 1e-9);
  // 零点が単位円上（z=1）にあれば ω=0 で利得 0
  const Hz = evalRationalZ([{ re: 1, im: 0 }], [], 1, 0);
  assertClose(cabs(Hz), 0, "evalRationalZ zero at z=1 → |H(0)|=0", 1e-12);
  console.log("[smoke-design] evalRationalZ OK");
}

// ---- bilinearWarp ----
{
  // 標準形 Ω = (2/T) tan(ωT/2)。T=2 では Ω = tan(ω)。
  // 小さな ω では Ω ≈ ω（ほぼ歪まない）
  assertClose(bilinearWarp(0.1, 2), Math.tan(0.1), "bilinearWarp T=2 ω=0.1", 1e-12);
  assert(Math.abs(bilinearWarp(0.1, 2) - 0.1) < 0.01, "bilinearWarp 低域はほぼ線形");
  // ω が π/2 に近づくと（T=2）急増する（高周波ほど圧縮 → 逆写像で発散）
  const near = bilinearWarp(0.5 * Math.PI - 0.02, 2);
  const mid = bilinearWarp(0.5 * Math.PI - 0.5, 2);
  assert(near > mid && near > 40, `bilinearWarp は端で急増 (near=${near}, mid=${mid})`);
  // ω=0 で Ω=0
  assertClose(bilinearWarp(0, 1.7), 0, "bilinearWarp(0)=0", 1e-15);
  console.log("[smoke-design] bilinearWarp OK");
}

// ---- unwrapPhase ----
{
  // -π を跨ぐ位相をアンラップすると連続な減少列になる
  const wrapped = [3.0, -3.0, 2.5, -2.8];
  const u = unwrapPhase(wrapped);
  for (let i = 1; i < u.length; i++) {
    assert(Math.abs(u[i] - u[i - 1]) <= Math.PI + 1e-9, `unwrap 隣接差 ≤ π at ${i}`);
  }
  // 元の位相と 2π の整数倍だけ違う
  for (let i = 0; i < u.length; i++) {
    const diff = (u[i] - wrapped[i]) / (2 * Math.PI);
    assertClose(diff, Math.round(diff), `unwrap は 2π 整数倍だけずれる at ${i}`, 1e-9);
  }
  console.log("[smoke-design] unwrapPhase OK");
}

if (failures > 0) {
  console.error(`\n${failures} 件の失敗`);
  process.exit(1);
}
console.log("\nsmoketest-design: all OK");
