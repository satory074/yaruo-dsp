// 第7章: 変調＝スペクトルの平行移動。ガウシアンのスペクトル X(ω) を ω0 だけずらす。
// cos 変調（実信号）にすると、X(ω-ω0) と X(ω+ω0) の半分ずつのペアに割れる。

import type { DemoDef } from "../types";
import { COLORS, makeViewport, axes, plotFn, drawLabel } from "../plot";

// X(ω) = √(2π) e^{-ω²/2}（ガウシアンのフーリエ変換）。ピークは √(2π) ≈ 2.5066
const PEAK = Math.sqrt(2 * Math.PI);
function gauss(w: number): number {
  return PEAK * Math.exp(-(w * w) / 2);
}

const def: DemoDef = {
  id: "modulation-shift",
  controls: [
    { kind: "slider", id: "w0", label: "変調周波数 ω0", min: 0, max: 12, step: 0.5, value: 0, format: (v) => v.toFixed(1) },
    { kind: "checkbox", id: "cos", label: "cos変調（実信号）", value: 0 },
  ],
  draw({ g, width, height, params }) {
    const w0 = params.w0;
    const isCos = params.cos >= 0.5;

    const vp = makeViewport(width, height, { x0: -16, x1: 16, y0: -0.4, y1: 3 }, { b: 28, t: 16 });
    axes(g, vp, {
      xTicks: [-15, -10, -5, 0, 5, 10, 15],
      yTicks: [0, 1, 2],
      xLabel: "ω",
      yLabel: "|X(ω)|",
    });

    // 元の X(ω) を常に参照線（破線）で
    plotFn(g, vp, gauss, { color: COLORS.textDim, width: 1.4, dash: [5, 4], samples: 900 });

    if (!isCos) {
      // 複素変調: スペクトルがまるごと +ω0 へ引っ越し
      plotFn(g, vp, (w) => gauss(w - w0), { color: COLORS.green, width: 2.2, glow: true, samples: 900 });
      drawLabel(g, vp, `X(ω-ω0)`, w0 + 0.5, 2.7, { color: COLORS.amber });
    } else {
      // cos 変調: ±ω0 に半分ずつ
      plotFn(g, vp, (w) => (gauss(w - w0) + gauss(w + w0)) / 2, { color: COLORS.green, width: 2.2, glow: true, samples: 900 });
      drawLabel(g, vp, `½X(ω-ω0)`, w0 + 0.5, 1.6, { color: COLORS.amber });
      drawLabel(g, vp, `½X(ω+ω0)`, -w0 - 8.5, 1.6, { color: COLORS.amber });
    }
    drawLabel(g, vp, "破線: 元の X(ω)", -15.4, 2.7, { color: COLORS.textDim });
  },
};

export default def;
