// 第12章: FIRフィルタの係数遊び場。5本のタップ h[0]〜h[4] を手で動かして、
// インパルス応答（=係数そのもの）と振幅応答 |H(e^{jω})| の対応を体感する。
// 全部同符号なら LPF、交互符号なら HPF になることを自分の手で発見できる。

import type { DemoDef } from "../types";
import { COLORS, makeViewport, axes, plotLine, plotStem, drawLabel } from "../plot";
import { freqz } from "../../lib/dsp";

const TAPS = [0, 1, 2, 3, 4];

const def: DemoDef = {
  id: "fir-taps-playground",
  controls: TAPS.map((k) => ({
    kind: "slider" as const,
    id: `h${k}`,
    label: `h[${k}]`,
    min: -1,
    max: 1,
    step: 0.05,
    value: 0.2,
    format: (v) => v.toFixed(2),
  })),
  draw({ g, width, height, params }) {
    const h = TAPS.map((k) => params[`h${k}`]);
    const split = Math.round(height * 0.46);

    // 上段: インパルス応答（タップ係数そのもの）
    const vpTop = makeViewport(width, split, { x0: -0.6, x1: 4.6, y0: -1.15, y1: 1.15 }, { b: 18, t: 16 });
    axes(g, vpTop, {
      xTicks: [0, 1, 2, 3, 4],
      yTicks: [-1, 0, 1],
      xLabel: "k",
      yLabel: "h[k]",
    });
    plotStem(g, vpTop, TAPS, h, { color: COLORS.green });

    // 下段: 振幅応答 |H(e^{jω})|（ω ∈ [0, π]）
    const { omega, mag } = freqz(h, [1], 256);
    let peak = 0;
    for (let i = 0; i < mag.length; i++) peak = Math.max(peak, mag[i]);
    const yMax = Math.max(1.2, peak * 1.1);
    const vpBot = makeViewport(width, height - split, { x0: 0, x1: Math.PI, y0: 0, y1: yMax }, { b: 26, t: 10 });
    vpBot.py += split;
    axes(g, vpBot, {
      xTicks: [0, Math.PI / 2, Math.PI],
      xTickFormat: (v) => (v === 0 ? "0" : v > 2 ? "π" : "π/2"),
      xLabel: "ω",
      yLabel: "|H(e^jω)|",
    });
    plotLine(g, vpBot, omega, mag, { color: COLORS.cyan, width: 2, glow: true });
    drawLabel(
      g,
      vpBot,
      `|H(0)| = ${mag[0].toFixed(2)}   |H(π)| = ${mag[mag.length - 1].toFixed(2)}`,
      Math.PI * 0.97,
      yMax * 0.9,
      { color: COLORS.amber, align: "right" },
    );
  },
};

export default def;
