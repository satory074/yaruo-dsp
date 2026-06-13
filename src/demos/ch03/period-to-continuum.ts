// 第3章: 周期を伸ばすとスペクトルが連続に近づく。
// 幅1の矩形パルスを周期 T0 で繰り返したときの線スペクトル T0·c_k は、
// 間隔 ω0 = 2π/T0 で sinc 包絡線をサンプリングしたもの。T0 → ∞ で連続スペクトルへ。

import type { DemoDef } from "../types";
import { COLORS, makeViewport, axes, plotFn, plotStem, drawLabel } from "../plot";

const TAU = 1; // パルス幅（固定）

// 包絡線: F(ω) = 2 sin(ωτ/2)/ω（幅τの矩形パルスのフーリエ変換）
function envelope(w: number): number {
  return Math.abs(w) < 1e-9 ? TAU : (2 * Math.sin((w * TAU) / 2)) / w;
}

const def: DemoDef = {
  id: "period-to-continuum",
  controls: [
    { kind: "slider", id: "T0", label: "周期 T0", min: 2, max: 16, step: 0.5, value: 2, format: (v) => v.toFixed(1) },
    { kind: "checkbox", id: "env", label: "包絡線（フーリエ変換）", value: 1 },
  ],
  draw({ g, width, height, params }) {
    const T0 = params.T0;
    const w0 = (2 * Math.PI) / T0;
    const split = Math.round(height * 0.42);

    // 上段: 時間領域（周期T0で繰り返す幅1のパルス）
    const vpTop = makeViewport(width, split, { x0: -18, x1: 18, y0: -0.25, y1: 1.3 }, { b: 20, t: 14 });
    axes(g, vpTop, { xTicks: [-15, -10, -5, 0, 5, 10, 15], yTicks: [0, 1], xLabel: "t" });
    plotFn(
      g,
      vpTop,
      (t) => {
        const m = ((t % T0) + T0) % T0;
        const local = m > T0 / 2 ? m - T0 : m;
        return Math.abs(local) <= TAU / 2 ? 1 : 0;
      },
      { color: COLORS.cyan, width: 1.8, samples: 1600 },
    );
    drawLabel(g, vpTop, `T0 = ${T0.toFixed(1)}`, 13, 1.15, { color: COLORS.amber });

    // 下段: 線スペクトル T0·c_k = F(kω0)
    const vpBot = makeViewport(width, height - split, { x0: -20, x1: 20, y0: -0.55, y1: 1.25 }, { b: 26, t: 8 });
    vpBot.py += split;
    axes(g, vpBot, {
      xTicks: [-20, -10, 0, 10, 20],
      yTicks: [0, 1],
      xLabel: "ω",
      yLabel: "T0·c_k",
    });
    if (params.env) {
      plotFn(g, vpBot, envelope, { color: COLORS.textDim, width: 1.4, dash: [5, 4], samples: 1200 });
    }
    const ks: number[] = [];
    const vals: number[] = [];
    for (let k = Math.ceil(-20 / w0); k * w0 <= 20; k++) {
      ks.push(k * w0);
      vals.push(envelope(k * w0));
    }
    plotStem(g, vpBot, ks, vals, { color: COLORS.green, radius: 2.6 });
    drawLabel(g, vpBot, `線の間隔 ω0 = 2π/T0 ≈ ${w0.toFixed(2)}`, -19, -0.4, { color: COLORS.amber });
  },
};

export default def;
