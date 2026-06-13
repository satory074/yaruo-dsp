// 第12章: 移動平均によるノイズ除去。タップ数 M を増やすとギザギザが消えて
// 滑らかになるが、信号本体の振幅も削れて波形が遅れることを観察する。

import type { DemoDef } from "../types";
import { COLORS, makeViewport, axes, plotLine, drawLabel } from "../plot";
import { freqz } from "../../lib/dsp";

const N = 100;

// ゆっくりした本体 + 速い揺らぎ2成分（決定的。Math.random は使わない）
function signal(n: number): number {
  return (
    Math.sin((2 * Math.PI * n) / 50) +
    0.35 * Math.cos(2 * Math.PI * n * 0.42) +
    0.15 * Math.sin(2 * Math.PI * n * 0.31 + 0.7)
  );
}

const def: DemoDef = {
  id: "denoise-demo",
  controls: [
    {
      kind: "slider",
      id: "M",
      label: "タップ数 M",
      min: 1,
      max: 15,
      step: 2,
      value: 5,
      format: (v) => `${Math.round(v)}`,
    },
  ],
  draw({ g, width, height, params }) {
    const M = Math.round(params.M);
    const split = Math.round(height * 0.52);

    const xs = new Float64Array(N);
    const input = new Float64Array(N);
    for (let n = 0; n < N; n++) {
      xs[n] = n;
      input[n] = signal(n);
    }

    // 移動平均出力（過去 M 点が揃う有効区間 n = M-1 .. N-1 のみ）
    const outXs = new Float64Array(N - M + 1);
    const outYs = new Float64Array(N - M + 1);
    for (let n = M - 1; n < N; n++) {
      let acc = 0;
      for (let k = 0; k < M; k++) acc += input[n - k];
      outXs[n - M + 1] = n;
      outYs[n - M + 1] = acc / M;
    }

    // 上段: 入力（細い参考線）と移動平均出力（緑の主信号）
    const vpTop = makeViewport(width, split, { x0: 0, x1: N - 1, y0: -1.8, y1: 1.8 }, { b: 20, t: 16 });
    axes(g, vpTop, {
      xTicks: [0, 25, 50, 75],
      yTicks: [-1, 0, 1],
      xLabel: "n",
      yLabel: "x[n], y[n]",
    });
    plotLine(g, vpTop, xs, input, { color: COLORS.textDim, width: 1.2 });
    plotLine(g, vpTop, outXs, outYs, { color: COLORS.green, width: 2.4, glow: true });
    drawLabel(g, vpTop, `M = ${M}`, N - 3, 1.5, { color: COLORS.amber, align: "right" });

    // 下段: 移動平均フィルタの振幅応答 |H(e^{jω})|
    const { omega, mag } = freqz(Array(M).fill(1 / M), [1], 256);
    const vpBot = makeViewport(width, height - split, { x0: 0, x1: Math.PI, y0: 0, y1: 1.1 }, { b: 26, t: 8 });
    vpBot.py += split;
    axes(g, vpBot, {
      xTicks: [0, Math.PI / 2, Math.PI],
      xTickFormat: (v) => (v === 0 ? "0" : v > 2 ? "π" : "π/2"),
      yTicks: [0, 0.5, 1],
      xLabel: "ω",
      yLabel: "|H|",
    });
    plotLine(g, vpBot, omega, mag, { color: COLORS.cyan, width: 2, glow: true });
  },
};

export default def;
