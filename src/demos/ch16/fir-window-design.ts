// 第16章: 窓関数法による FIR ローパス設計。上段にインパルス応答 h[n]（ステム）、
// 下段に振幅特性 |H| を dB で表示。カットオフ・タップ数・窓を動かすと、
// 遷移帯の急峻さと阻止域の深さ／リップルが変わる。

import type { DemoDef } from "../types";
import { COLORS, makeViewport, axes, plotLine, plotStem } from "../plot";
import { firLowpassWindow } from "../../lib/dsp-design";
import { freqz, type WindowKind } from "../../lib/dsp";

const WINS: WindowKind[] = ["rect", "hann", "hamming", "blackman"];

const def: DemoDef = {
  id: "fir-window-design",
  controls: [
    {
      kind: "slider",
      id: "fc",
      label: "カットオフ ωc/π",
      min: 0.1,
      max: 0.9,
      step: 0.02,
      value: 0.5,
      format: (v) => v.toFixed(2),
    },
    {
      kind: "slider",
      id: "taps",
      label: "タップ数",
      min: 9,
      max: 63,
      step: 2,
      value: 21,
      format: (v) => `${v}`,
    },
    {
      kind: "select",
      id: "win",
      label: "窓",
      value: 2,
      options: [
        { value: 0, label: "矩形 (rect)" },
        { value: 1, label: "ハン (hann)" },
        { value: 2, label: "ハミング (hamming)" },
        { value: 3, label: "ブラックマン (blackman)" },
      ],
    },
  ],
  draw({ g, width, height, params }) {
    const fc = params.fc; // ωc/π
    const cutoff = fc * Math.PI;
    const taps = Math.round(params.taps);
    const win = WINS[Math.round(params.win)] ?? "hamming";

    const h = firLowpassWindow(taps, cutoff, win);
    const half = height / 2;

    // ===== 上段: インパルス応答 h[n] =====
    const xs = new Float64Array(taps);
    let hMax = 1e-9;
    for (let n = 0; n < taps; n++) {
      xs[n] = n;
      hMax = Math.max(hMax, Math.abs(h[n]));
    }
    const yPad = hMax * 1.2;
    const vp1 = makeViewport(
      width,
      half,
      { x0: -0.5, x1: taps - 0.5, y0: -yPad, y1: yPad },
      { l: 48, r: 14, t: 14, b: 22 },
    );
    axes(g, vp1, { xLabel: "n", yLabel: "h[n]" });
    plotStem(g, vp1, xs, h, { color: COLORS.green });

    // ===== 下段: 振幅特性 |H| [dB] =====
    const { omega, mag } = freqz(Array.from(h), [1], 512);
    const db = new Float64Array(mag.length);
    const floor = -100;
    for (let i = 0; i < mag.length; i++) {
      db[i] = Math.max(floor, 20 * Math.log10(Math.max(mag[i], 1e-12)));
    }
    const vp2 = makeViewport(
      width,
      half,
      { x0: 0, x1: Math.PI, y0: floor, y1: 6 },
      { l: 48, r: 14, t: 14, b: 24 },
    );
    vp2.py += half;
    axes(g, vp2, {
      xTicks: [0, Math.PI / 2, Math.PI],
      xTickFormat: (v) => (v < 0.1 ? "0" : v < 2 ? "π/2" : "π"),
      yTicks: [0, -20, -40, -60, -80, -100],
      xLabel: "ω",
      yLabel: "|H| [dB]",
    });
    // カットオフ位置の縦線
    const cutLineX = new Float64Array(2).fill(cutoff);
    const cutLineY = new Float64Array([floor, 6]);
    plotLine(g, vp2, cutLineX, cutLineY, { color: COLORS.amber, width: 1, dash: [4, 4] });
    plotLine(g, vp2, omega, db, { color: COLORS.cyan, width: 2, glow: true });
  },
};

export default def;
