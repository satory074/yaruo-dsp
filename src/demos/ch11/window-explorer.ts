// 第11章: 窓関数とスペクトル漏れの観察。
// N = 64 点の cos(2π·f_bin·n/64) に窓を掛け、512 点ゼロ詰め FFT のスペクトルを dB で表示。
// f_bin が整数（DFT ビンにぴったり）なら矩形窓でも鋭い1本。半端な値だと矩形窓は
// 盛大に漏れ、hann 等はサイドローブが下がる代わりにメインローブが太る。

import type { DemoDef } from "../types";
import { COLORS, makeViewport, axes, plotLine, drawLabel } from "../plot";
import { fft, windowFn, type WindowKind } from "../../lib/dsp";

const N = 64;
const NFFT = 512;
const DB_FLOOR = -80;

const KINDS: { value: number; label: string; kind: WindowKind }[] = [
  { value: 0, label: "矩形（rect）", kind: "rect" },
  { value: 1, label: "ハン（hann）", kind: "hann" },
  { value: 2, label: "ハミング（hamming）", kind: "hamming" },
  { value: 3, label: "ブラックマン（blackman）", kind: "blackman" },
];

/** 窓掛け信号を NFFT 点ゼロ詰め FFT し、最大値基準の dB（下限 DB_FLOOR）を k=0..NFFT/2 で返す */
function spectrumDb(x: Float64Array): Float64Array {
  const re = new Float64Array(NFFT);
  const im = new Float64Array(NFFT);
  re.set(x);
  fft(re, im);
  const half = NFFT / 2;
  const mags = new Float64Array(half + 1);
  let max = 0;
  for (let k = 0; k <= half; k++) {
    mags[k] = Math.hypot(re[k], im[k]);
    if (mags[k] > max) max = mags[k];
  }
  const db = new Float64Array(half + 1);
  for (let k = 0; k <= half; k++) {
    db[k] = max > 0 ? Math.max(DB_FLOOR, 20 * Math.log10(mags[k] / max)) : DB_FLOOR;
  }
  return db;
}

const def: DemoDef = {
  id: "window-explorer",
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
      id: "fbin",
      label: "信号周波数（ビン単位）",
      min: 4,
      max: 12,
      step: 0.05,
      value: 8.0,
      format: (v) => v.toFixed(2),
    },
  ],
  draw({ g, width, height, params }) {
    const kind = (KINDS[params.win] ?? KINDS[0]).kind;
    const fBin = params.fbin;

    const w = windowFn(kind, N);
    const x = new Float64Array(N);
    const ns = new Float64Array(N);
    for (let n = 0; n < N; n++) {
      ns[n] = n;
      x[n] = Math.cos((2 * Math.PI * fBin * n) / N) * w[n];
    }

    const split = Math.round(height * 0.42);

    // 上段: 窓を掛けた時間信号と窓の形 ±w[n]
    const vpTop = makeViewport(width, split, { x0: 0, x1: N - 1, y0: -1.25, y1: 1.25 }, { b: 18, t: 14 });
    axes(g, vpTop, { xTicks: [0, 16, 32, 48, 63], yTicks: [-1, 0, 1], xLabel: "n" });
    const wNeg = new Float64Array(N);
    for (let n = 0; n < N; n++) wNeg[n] = -w[n];
    plotLine(g, vpTop, ns, w, { color: COLORS.textDim, width: 1.2, dash: [5, 4] });
    plotLine(g, vpTop, ns, wNeg, { color: COLORS.textDim, width: 1.2, dash: [5, 4] });
    plotLine(g, vpTop, ns, x, { color: COLORS.cyan, width: 1.6 });

    // 下段: スペクトル（dB）。横軸は N=64 基準のビン番号 0..32
    const db = spectrumDb(x);
    const bins = new Float64Array(db.length);
    for (let k = 0; k < db.length; k++) bins[k] = (k * N) / NFFT;

    const vpBot = makeViewport(width, height - split, { x0: 0, x1: N / 2, y0: -85, y1: 6 }, { b: 26, t: 8 });
    vpBot.py += split;
    axes(g, vpBot, {
      xTicks: [0, 4, 8, 12, 16, 20, 24, 28, 32],
      yTicks: [0, -20, -40, -60, -80],
      xLabel: "周波数（ビン）",
      yLabel: "dB",
      zeroLine: false,
    });

    // 真の周波数位置マーカー
    plotLine(g, vpBot, [fBin, fBin], [-85, 6], { color: COLORS.amber, width: 1.2, dash: [3, 3] });
    drawLabel(g, vpBot, `f = ${fBin.toFixed(2)}`, fBin, 2, { color: COLORS.amber, dx: 5 });

    plotLine(g, vpBot, bins, db, { color: COLORS.green, width: 1.8, glow: true });
  },
};

export default def;
