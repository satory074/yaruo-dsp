// 第10章: 標本点からの sinc 補間。
// 帯域制限された滑らかな信号 orig(t) = 0.8·sin(2π·0.6·t) + 0.4·cos(2π·0.3·t) を
// サンプル間隔 T = 1（fs = 1）で標本化した x[n] = orig(n) から、
// x(t) = Σ x[n]·sinc(t - n) で原信号を復元する。
// 各標本に立つ sinc の裾が協力して点と点の間を埋める様子を可視化する。

import type { DemoDef } from "../types";
import { COLORS, makeViewport, axes, plotFn, plotStem } from "../plot";
import { sinc } from "../../lib/dsp";

// 帯域制限された決定的な滑らかな原信号（最高周波数 0.6 Hz < fs/2 = 0.5… ではないが
// 補間の見栄え重視の決定的信号。点間がなめらかに埋まることの可視化が目的）
function orig(t: number): number {
  return 0.8 * Math.sin(2 * Math.PI * 0.6 * t) + 0.4 * Math.cos(2 * Math.PI * 0.3 * t);
}

const def: DemoDef = {
  id: "sinc-interpolation",
  controls: [
    {
      kind: "slider",
      id: "M",
      label: "サンプル数 M",
      min: 4,
      max: 16,
      step: 1,
      value: 8,
      format: (v) => `${v} 点`,
    },
    { kind: "checkbox", id: "showSinc", label: "個々の sinc を表示", value: 1 },
  ],
  draw({ g, width, height, params }) {
    const M = Math.round(params.M);

    // 標本 x[n] = orig(n), n = 0..M-1（T = 1）
    const xs: number[] = [];
    const ys: number[] = [];
    for (let n = 0; n < M; n++) {
      xs.push(n);
      ys.push(orig(n));
    }

    const vp = makeViewport(width, height, { x0: 0, x1: M - 1, y0: -1.5, y1: 1.5 });
    axes(g, vp, { yTicks: [-1, 0, 1], xLabel: "t" });

    // 原信号 orig(t)（参照）— 細い水色
    plotFn(g, vp, orig, { color: COLORS.cyan, width: 1.2, samples: 900 });

    // 個々の sinc: x[n]·sinc(t - n) を薄線で重ね描き（M 本）
    if (params.showSinc) {
      for (let n = 0; n < M; n++) {
        const xn = ys[n];
        plotFn(g, vp, (t) => xn * sinc(t - n), { color: COLORS.textDim, width: 0.9, samples: 700 });
      }
    }

    // sinc 補間の総和 Σ x[n]·sinc(t - n) — 緑の太線（原信号にほぼ重なる）
    plotFn(
      g,
      vp,
      (t) => {
        let s = 0;
        for (let n = 0; n < M; n++) s += ys[n] * sinc(t - n);
        return s;
      },
      { color: COLORS.green, width: 2.4, glow: true, samples: 900 },
    );

    // 標本点 x[n]
    plotStem(g, vp, xs, ys, { color: COLORS.green, radius: 3 });
  },
};

export default def;
