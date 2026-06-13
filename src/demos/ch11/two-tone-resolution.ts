// 第11章: 2トーンの分離で見る窓のトレードオフ。
// x[n] = cos(2π·10·n/64) + A·cos(2π·(10+Δ)·n/64) を窓掛け→512点ゼロ詰めFFT→dB表示。
// Δ を縮めるとメインローブ幅の限界で2山が融合し、振幅差を広げると弱いトーンが
// サイドローブに埋もれる（サイドローブの低い blackman なら救える）。

import type { DemoDef } from "../types";
import { COLORS, makeViewport, axes, plotLine, drawLabel } from "../plot";
import { fft, windowFn, type WindowKind } from "../../lib/dsp";

const N = 64;
const NFFT = 512;
const DB_FLOOR = -80;
const F1 = 10; // 1本目のトーン周波数（ビン）

const KINDS: { value: number; label: string; kind: WindowKind }[] = [
  { value: 0, label: "矩形（rect）", kind: "rect" },
  { value: 1, label: "ハン（hann）", kind: "hann" },
  { value: 2, label: "ハミング（hamming）", kind: "hamming" },
  { value: 3, label: "ブラックマン（blackman）", kind: "blackman" },
];

const def: DemoDef = {
  id: "two-tone-resolution",
  controls: [
    {
      kind: "select",
      id: "win",
      label: "窓関数",
      value: 0,
      options: KINDS.map((k) => ({ value: k.value, label: k.label })),
    },
    {
      kind: "slider",
      id: "delta",
      label: "周波数差 Δ（ビン）",
      min: 0.3,
      max: 6,
      step: 0.1,
      value: 3,
      format: (v) => v.toFixed(1),
    },
    {
      kind: "slider",
      id: "ratio",
      label: "振幅差（dB）",
      min: 0,
      max: 40,
      step: 1,
      value: 0,
      format: (v) => `${v} dB`,
    },
  ],
  draw({ g, width, height, params }) {
    const kind = (KINDS[params.win] ?? KINDS[0]).kind;
    const delta = params.delta;
    const amp = Math.pow(10, -params.ratio / 20);
    const f2 = F1 + delta;

    // 窓掛け2トーン信号 → ゼロ詰め FFT → dB
    const w = windowFn(kind, N);
    const re = new Float64Array(NFFT);
    const im = new Float64Array(NFFT);
    for (let n = 0; n < N; n++) {
      const x = Math.cos((2 * Math.PI * F1 * n) / N) + amp * Math.cos((2 * Math.PI * f2 * n) / N);
      re[n] = x * w[n];
    }
    fft(re, im);

    const half = NFFT / 2;
    const bins = new Float64Array(half + 1);
    const mags = new Float64Array(half + 1);
    let max = 0;
    for (let k = 0; k <= half; k++) {
      bins[k] = (k * N) / NFFT;
      mags[k] = Math.hypot(re[k], im[k]);
      if (mags[k] > max) max = mags[k];
    }
    const db = new Float64Array(half + 1);
    for (let k = 0; k <= half; k++) {
      db[k] = max > 0 ? Math.max(DB_FLOOR, 20 * Math.log10(mags[k] / max)) : DB_FLOOR;
    }

    const vp = makeViewport(width, height, { x0: 4, x1: 22, y0: -85, y1: 6 });
    axes(g, vp, {
      xTicks: [4, 8, 12, 16, 20],
      yTicks: [0, -20, -40, -60, -80],
      xLabel: "周波数（ビン）",
      yLabel: "dB",
      zeroLine: false,
    });

    // 2本のトーンの真の位置
    plotLine(g, vp, [F1, F1], [-85, 6], { color: COLORS.amber, width: 1.2, dash: [3, 3] });
    plotLine(g, vp, [f2, f2], [-85, 6], { color: COLORS.amber, width: 1.2, dash: [3, 3] });
    drawLabel(g, vp, "f1", F1, 2, { color: COLORS.amber, dx: -14 });
    drawLabel(g, vp, `f2 (-${params.ratio.toFixed(0)}dB)`, f2, 2, { color: COLORS.amber, dx: 5 });

    plotLine(g, vp, bins, db, { color: COLORS.green, width: 1.8, glow: true });
  },
};

export default def;
