// 第7章: 時間シフトと位相。長さ5の矩形パルスを n0 だけ遅らせると、振幅スペクトルは
// 不変のまま、位相だけが周波数に比例して傾く（線形位相）ことを観察する。

import type { DemoDef } from "../types";
import { COLORS, makeViewport, axes, plotFn, plotStem, drawLabel } from "../plot";

const PULSE_LEN = 5; // n=0..4 で 1

// |X(e^{jω})| = |sin(5ω/2)/sin(ω/2)|（Dirichlet核）。ω→0 で 5。
function specMag(w: number): number {
  if (Math.abs(w) < 1e-6) return PULSE_LEN;
  const denom = Math.sin(w / 2);
  if (Math.abs(denom) < 1e-9) return PULSE_LEN;
  return Math.abs(Math.sin((PULSE_LEN * w) / 2) / denom);
}

// 主値[-π,π]に折り返す
function wrap(p: number): number {
  return ((((p + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
}

const def: DemoDef = {
  id: "shift-phase",
  controls: [{ kind: "slider", id: "n0", label: "シフト量 n0", min: 0, max: 8, step: 1, value: 0 }],
  draw({ g, width, height, params }) {
    const n0 = Math.round(params.n0);
    const h = height / 3;

    // 上段: x[n-n0]（n=0..15）
    const vpTop = makeViewport(width, h, { x0: -0.5, x1: 15.5, y0: -0.3, y1: 1.4 }, { b: 18, t: 14 });
    axes(g, vpTop, { xTicks: [0, 4, 8, 12], yTicks: [0, 1], yLabel: "x[n-n0]" });
    const ns: number[] = [];
    const xs: number[] = [];
    for (let n = 0; n <= 15; n++) {
      ns.push(n);
      xs.push(n >= n0 && n < n0 + PULSE_LEN ? 1 : 0);
    }
    plotStem(g, vpTop, ns, xs, { color: COLORS.green, glow: true });
    drawLabel(g, vpTop, `n0 = ${n0}`, 11, 1.25, { color: COLORS.amber });

    // 中段: 振幅スペクトル |X(e^{jω})|（n0によらず不変）
    const vpMid = makeViewport(width, h, { x0: -Math.PI, x1: Math.PI, y0: -0.4, y1: 6 }, { b: 18, t: 8 });
    vpMid.py += h;
    axes(g, vpMid, {
      xTicks: [-Math.PI, 0, Math.PI],
      xTickFormat: (v) => (v === 0 ? "0" : v > 0 ? "π" : "-π"),
      yTicks: [0, 5],
      yLabel: "|X|",
    });
    plotFn(g, vpMid, specMag, { color: COLORS.cyan, width: 2, glow: true, samples: 700 });
    drawLabel(g, vpMid, "振幅スペクトルは n0 によらず不変", -Math.PI + 0.2, 5.4, { color: COLORS.textDim });

    // 下段: 位相 arg X = -ω(n0 + 2)（主値折り返し）
    const vpBot = makeViewport(width, height - 2 * h, { x0: -Math.PI, x1: Math.PI, y0: -Math.PI - 0.3, y1: Math.PI + 0.3 }, { b: 26, t: 8 });
    vpBot.py += 2 * h;
    axes(g, vpBot, {
      xTicks: [-Math.PI, 0, Math.PI],
      xTickFormat: (v) => (v === 0 ? "0" : v > 0 ? "π" : "-π"),
      yTicks: [-Math.PI, 0, Math.PI],
      yTickFormat: (v) => (Math.abs(v) < 0.1 ? "0" : v > 0 ? "π" : "-π"),
      xLabel: "ω",
      yLabel: "arg X",
    });
    // パルス中心が (n0+2) なので傾き -(n0+2)
    const slope = -(n0 + (PULSE_LEN - 1) / 2);
    plotFn(g, vpBot, (w) => wrap(slope * w), { color: COLORS.amber, width: 2, samples: 1400 });
    drawLabel(g, vpBot, `傾き -(n0+2) = ${slope}`, -Math.PI + 0.2, Math.PI - 0.2, { color: COLORS.textDim });
  },
};

export default def;
