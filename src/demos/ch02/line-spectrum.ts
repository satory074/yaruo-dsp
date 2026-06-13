// 第2章: 複素フーリエ係数の線スペクトル。負の周波数を含む両側スペクトル |c_k| を
// 波形を切り替えながら眺める。

import type { DemoDef } from "../types";
import { COLORS, makeViewport, axes, plotFn, plotStem, drawLabel } from "../plot";
import { idealWave } from "../../lib/dsp";

// |c_k|（周期2π・振幅±1の各波形、c_0 = 0）
function coeffMag(kind: number, k: number): number {
  const a = Math.abs(k);
  if (a === 0) return 0;
  switch (kind) {
    case 0: // 矩形波: |c_k| = 2/(πk)（奇数のみ）
      return a % 2 === 1 ? 2 / (Math.PI * a) : 0;
    case 1: // のこぎり波: |c_k| = 1/(πk)
      return 1 / (Math.PI * a);
    default: // 三角波: |c_k| = 4/(π²k²)（奇数のみ）
      return a % 2 === 1 ? 4 / (Math.PI * Math.PI * a * a) : 0;
  }
}

const KIND_NAMES = ["square", "sawtooth", "triangle"] as const;

const def: DemoDef = {
  id: "line-spectrum",
  controls: [
    {
      kind: "select",
      id: "wave",
      label: "波形",
      value: 0,
      options: [
        { value: 0, label: "矩形波" },
        { value: 1, label: "のこぎり波" },
        { value: 2, label: "三角波" },
      ],
    },
  ],
  draw({ g, width, height, params }) {
    const kind = Math.round(params.wave);
    const split = Math.round(height * 0.42);

    // 上段: 時間波形
    const vpTop = makeViewport(width, split, { x0: -Math.PI, x1: Math.PI, y0: -1.4, y1: 1.4 }, { b: 6, t: 14 });
    axes(g, vpTop, { xTicks: [], yTicks: [-1, 0, 1], yLabel: "f(t)" });
    plotFn(g, vpTop, (t) => idealWave(KIND_NAMES[kind] ?? "square", t), {
      color: COLORS.cyan,
      width: 1.8,
      samples: 600,
    });

    // 下段: 両側線スペクトル
    const K = 11;
    const vpBot = makeViewport(
      width,
      height - split,
      { x0: -K - 0.8, x1: K + 0.8, y0: 0, y1: 0.75 },
      { b: 26, t: 10 },
    );
    vpBot.py += split;
    const ks: number[] = [];
    const mags: number[] = [];
    for (let k = -K; k <= K; k++) {
      ks.push(k);
      mags.push(coeffMag(kind, k));
    }
    axes(g, vpBot, {
      xTicks: [-10, -5, -1, 0, 1, 5, 10],
      yTicks: [0, 0.3, 0.6],
      xLabel: "k（×ω0）",
      yLabel: "|c_k|",
    });
    plotStem(g, vpBot, ks, mags, { color: COLORS.green, glow: true });
    drawLabel(g, vpBot, "負の周波数", -10.5, 0.68, { color: COLORS.amber });
    drawLabel(g, vpBot, "正の周波数", 5.5, 0.68, { color: COLORS.amber });
  },
};

export default def;
