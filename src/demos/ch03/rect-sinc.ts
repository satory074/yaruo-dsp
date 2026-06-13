// 第3章: 矩形パルスと sinc 関数。パルス幅 T を変えると、スペクトルの広がりが
// 反比例して変わる（時間と周波数のトレードオフ）。

import type { DemoDef } from "../types";
import { COLORS, makeViewport, axes, plotFn, drawLabel } from "../plot";

const def: DemoDef = {
  id: "rect-sinc",
  controls: [
    {
      kind: "slider",
      id: "T",
      label: "パルス幅 T",
      min: 0.4,
      max: 4,
      step: 0.1,
      value: 1,
      format: (v) => v.toFixed(1),
    },
  ],
  draw({ g, width, height, params }) {
    const T = params.T;
    const split = Math.round(height * 0.46);

    // 上段: 時間領域の矩形パルス（幅T・高さ1）
    const vpTop = makeViewport(width, split, { x0: -5, x1: 5, y0: -0.25, y1: 1.3 }, { b: 22, t: 14 });
    axes(g, vpTop, { xTicks: [-4, -2, 0, 2, 4], yTicks: [0, 1], xLabel: "t", yLabel: "f(t)" });
    plotFn(g, vpTop, (t) => (Math.abs(t) <= T / 2 ? 1 : 0), { color: COLORS.cyan, width: 2, samples: 1200 });
    drawLabel(g, vpTop, `幅 T = ${T.toFixed(1)}`, 2.1, 1.15, { color: COLORS.amber });

    // 下段: 周波数領域 F(ω) = T·sinc(ωT/2π) = 2sin(ωT/2)/ω
    const vpBot = makeViewport(width, height - split, { x0: -25, x1: 25, y0: -1.2, y1: 4.4 }, { b: 26, t: 8 });
    vpBot.py += split;
    axes(g, vpBot, {
      xTicks: [-20, -10, 0, 10, 20],
      yTicks: [0, 2, 4],
      xLabel: "ω",
      yLabel: "F(ω)",
    });
    plotFn(
      g,
      vpBot,
      (w) => (Math.abs(w) < 1e-9 ? T : (2 * Math.sin((w * T) / 2)) / w),
      { color: COLORS.green, width: 2, glow: true, samples: 1400 },
    );
    // 最初のヌル位置 ω = 2π/T を示す
    const nullW = (2 * Math.PI) / T;
    if (nullW < 25) {
      drawLabel(g, vpBot, `最初のゼロ点 ω = 2π/T ≈ ${nullW.toFixed(1)}`, nullW + 0.6, 3.6, { color: COLORS.amber });
    }
  },
};

export default def;
