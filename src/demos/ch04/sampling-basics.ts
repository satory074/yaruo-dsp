// 第4章: サンプリングの基本。連続正弦波 cos(2πft) を周期 T = 1/fs で標本化し、
// 正規化角周波数 ω = 2πf/fs（1サンプルあたりに進む位相）を体感する。

import type { DemoDef } from "../types";
import { COLORS, makeViewport, axes, plotFn, plotStem, drawLabel } from "../plot";

const def: DemoDef = {
  id: "sampling-basics",
  controls: [
    {
      kind: "slider",
      id: "f",
      label: "信号周波数 f",
      min: 0.5,
      max: 5,
      step: 0.1,
      value: 1,
      format: (v) => `${v.toFixed(1)} Hz`,
    },
    {
      kind: "slider",
      id: "fs",
      label: "サンプリング周波数 fs",
      min: 2,
      max: 20,
      step: 0.5,
      value: 8,
      format: (v) => `${v.toFixed(1)} Hz`,
    },
  ],
  draw({ g, width, height, params }) {
    const f = params.f;
    const fs = params.fs;
    const T = 1 / fs;

    const vp = makeViewport(width, height, { x0: 0, x1: 2, y0: -1.45, y1: 1.45 });
    axes(g, vp, { xTicks: [0, 0.5, 1, 1.5, 2], yTicks: [-1, 0, 1], xLabel: "t [s]" });

    // 連続信号 cos(2πft)（細線）
    plotFn(g, vp, (t) => Math.cos(2 * Math.PI * f * t), { color: COLORS.cyan, width: 1.3, samples: 1200 });

    // サンプル列 x[n] = cos(2πf·nT)
    const ts: number[] = [];
    const xs: number[] = [];
    for (let n = 0; n * T <= 2 + 1e-9; n++) {
      ts.push(n * T);
      xs.push(Math.cos(2 * Math.PI * f * n * T));
    }
    plotStem(g, vp, ts, xs, { color: COLORS.green, glow: true });

    const omega = (2 * Math.PI * f) / fs;
    drawLabel(g, vp, `ω = 2πf/fs ≈ ${omega.toFixed(2)} rad/サンプル`, 0.05, 1.28, { color: COLORS.amber });
    drawLabel(g, vp, `T = 1/fs = ${T.toFixed(3)} s（${ts.length} 点）`, 0.05, -1.3, { color: COLORS.textDim });
  },
};

export default def;
