// 第4章: 正規化角周波数の 2π 周期性。x[n] = cos(ωn) のサンプル列は、
// ω を [-π, π] に折り返した等価周波数 ω' のものと完全に一致する。

import type { DemoDef } from "../types";
import { COLORS, makeViewport, axes, plotFn, plotStem, drawLabel } from "../plot";

const TWO_PI = 2 * Math.PI;

/** ω を [-π, π] に折り返した等価周波数 */
function fold(omega: number): number {
  let m = ((omega % TWO_PI) + TWO_PI) % TWO_PI;
  if (m > Math.PI) m -= TWO_PI;
  return m;
}

const def: DemoDef = {
  id: "omega-periodicity",
  controls: [
    {
      kind: "slider",
      id: "omega",
      label: "ω",
      min: 0,
      max: 12.57,
      step: 0.05,
      value: 1.0,
      format: (v) => `${v.toFixed(2)} rad`,
    },
  ],
  draw({ g, width, height, params }) {
    const omega = params.omega;
    const eq = fold(omega);

    const vp = makeViewport(width, height, { x0: -0.8, x1: 19.8, y0: -1.45, y1: 1.45 });
    axes(g, vp, { xTicks: [0, 5, 10, 15], yTicks: [-1, 0, 1], xLabel: "n" });

    // 等価周波数 ω' の連続波（参考・破線）
    plotFn(g, vp, (t) => Math.cos(eq * t), { color: COLORS.textDim, width: 1.3, dash: [5, 4], samples: 1000 });

    // サンプル列 x[n] = cos(ωn)
    const ns: number[] = [];
    const xs: number[] = [];
    for (let n = 0; n < 20; n++) {
      ns.push(n);
      xs.push(Math.cos(omega * n));
    }
    plotStem(g, vp, ns, xs, { color: COLORS.green, glow: true });

    drawLabel(g, vp, `ω = ${omega.toFixed(2)}（= ${(omega / Math.PI).toFixed(2)}π）`, 0, 1.28, {
      color: COLORS.amber,
    });
    drawLabel(g, vp, `[-π, π] へ折り返した等価周波数 ω' = ${eq.toFixed(2)}（= ${(eq / Math.PI).toFixed(2)}π）`, 0, -1.3, {
      color: COLORS.textDim,
    });
  },
};

export default def;
