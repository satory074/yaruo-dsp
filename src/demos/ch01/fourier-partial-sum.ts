// 第1章: フーリエ級数の部分和。項数 N を増やすと目標波形に近づく様子と
// 不連続点近傍のギブス現象を観察する。

import type { DemoDef } from "../types";
import { COLORS, makeViewport, axes, plotFn, drawLabel } from "../plot";
import { squareWavePartialSum, sawtoothPartialSum, trianglePartialSum, idealWave } from "../../lib/dsp";

const WAVES = [
  { label: "矩形波", kind: "square", partial: squareWavePartialSum },
  { label: "のこぎり波", kind: "sawtooth", partial: sawtoothPartialSum },
  { label: "三角波", kind: "triangle", partial: trianglePartialSum },
] as const;

const def: DemoDef = {
  id: "fourier-partial-sum",
  controls: [
    {
      kind: "select",
      id: "wave",
      label: "波形",
      value: 0,
      options: WAVES.map((w, i) => ({ value: i, label: w.label })),
    },
    { kind: "slider", id: "n", label: "項数 N", min: 1, max: 99, step: 2, value: 3 },
    { kind: "checkbox", id: "ideal", label: "目標波形を重ねる", value: 1 },
  ],
  draw({ g, width, height, params }) {
    const wave = WAVES[params.wave] ?? WAVES[0];
    const vp = makeViewport(width, height, {
      x0: -1.6 * Math.PI,
      x1: 1.6 * Math.PI,
      y0: -1.7,
      y1: 1.7,
    });
    axes(g, vp, {
      xTicks: [-Math.PI, 0, Math.PI],
      xTickFormat: (v) => (v === 0 ? "0" : v > 0 ? "π" : "-π"),
      yTicks: [-1, 0, 1],
      xLabel: "t",
    });

    if (params.ideal) {
      plotFn(g, vp, (t) => idealWave(wave.kind, t), {
        color: COLORS.textDim,
        width: 1.4,
        dash: [5, 4],
        samples: 600,
      });
    }

    const n = Math.max(1, Math.round(params.n));
    plotFn(g, vp, (t) => wave.partial(t, n), { color: COLORS.green, width: 2.2, glow: true, samples: 900 });

    drawLabel(g, vp, `N = ${n}`, vp.x0 + 0.25, 1.45, { color: COLORS.amber });
  },
};

export default def;
