// 第1章: 高調波の積み上げ。矩形波を構成する正弦波成分を個別に ON/OFF して、
// 「足すと形ができる」ことを確認する。

import type { DemoDef } from "../types";
import { COLORS, makeViewport, axes, plotFn, drawLabel } from "../plot";

// 矩形波の成分: b_k = 4/(πk)（k は奇数）
const HARMONICS = [1, 3, 5, 7, 9];
const HARMONIC_COLORS = [COLORS.cyan, COLORS.amber, COLORS.pink, "#b48ce5", "#8ee55e"];

function component(k: number, t: number): number {
  return (4 / (Math.PI * k)) * Math.sin(k * t);
}

const def: DemoDef = {
  id: "harmonics-stack",
  controls: HARMONICS.map((k, i) => ({
    kind: "checkbox" as const,
    id: `k${k}`,
    label: `k=${k}`,
    value: i === 0 ? 1 : 0,
  })),
  draw({ g, width, height, params }) {
    const split = Math.round(height * 0.46);
    const active = HARMONICS.filter((k) => params[`k${k}`]);

    // 上段: 各成分
    const vpTop = makeViewport(width, split, { x0: -Math.PI, x1: Math.PI, y0: -1.5, y1: 1.5 }, { b: 6, t: 16 });
    axes(g, vpTop, {
      xTicks: [],
      yTicks: [-1, 0, 1],
      yLabel: "成分",
    });
    HARMONICS.forEach((k, i) => {
      if (!params[`k${k}`]) return;
      plotFn(g, vpTop, (t) => component(k, t), { color: HARMONIC_COLORS[i], width: 1.4, samples: 500 });
    });
    if (active.length === 0) {
      drawLabel(g, vpTop, "下のチェックで成分を選ぶ", 0, 0, { color: COLORS.textDim, align: "center" });
    }

    // 下段: 合計
    const vpBot = makeViewport(width, height - split, { x0: -Math.PI, x1: Math.PI, y0: -1.5, y1: 1.5 }, { b: 24, t: 8 });
    vpBot.py += split;
    axes(g, vpBot, {
      xTicks: [-Math.PI, 0, Math.PI],
      xTickFormat: (v) => (v === 0 ? "0" : v > 0 ? "π" : "-π"),
      yTicks: [-1, 0, 1],
      yLabel: "合計",
      xLabel: "t",
    });
    plotFn(
      g,
      vpBot,
      (t) => active.reduce((acc, k) => acc + component(k, t), 0),
      { color: COLORS.green, width: 2.2, glow: true, samples: 700 },
    );
  },
};

export default def;
