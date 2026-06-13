// 第8章: 移動平均フィルタ＝たたみこみ。タップ数 M を増やすと出力が平滑化される一方、
// 周波数応答 |H(e^{jω})| が低域通過になり、波形そのものもなまる。

import type { DemoDef } from "../types";
import { COLORS, makeViewport, axes, plotLine, drawLabel } from "../plot";
import { freqz } from "../../lib/dsp";

const N = 80;
// x[n] = sin(2πn/40) + 0.4 sin(2π·0.45·n + 1.3)
function input(n: number): number {
  return Math.sin((2 * Math.PI * n) / 40) + 0.4 * Math.sin(2 * Math.PI * 0.45 * n + 1.3);
}

const def: DemoDef = {
  id: "moving-average",
  controls: [{ kind: "slider", id: "M", label: "タップ数 M", min: 1, max: 15, step: 2, value: 5 }],
  draw({ g, width, height, params }) {
    const M = Math.max(1, Math.round(params.M));
    const split = Math.round(height * 0.52);

    // 入力と移動平均出力
    const xs = new Float64Array(N);
    const yin = new Float64Array(N);
    for (let n = 0; n < N; n++) {
      xs[n] = n;
      yin[n] = input(n);
    }
    // 因果的 M タップ移動平均（端は利用可能な分で平均）
    const yout = new Float64Array(N);
    for (let n = 0; n < N; n++) {
      let s = 0;
      let cnt = 0;
      for (let k = 0; k < M; k++) {
        const m = n - k;
        if (m >= 0) {
          s += yin[m];
          cnt++;
        }
      }
      yout[n] = s / cnt;
    }

    // 上段: 入力（薄）＋移動平均出力（緑太）
    const vpTop = makeViewport(width, split, { x0: 0, x1: N - 1, y0: -1.6, y1: 1.6 }, { b: 18, t: 14 });
    axes(g, vpTop, { xTicks: [0, 20, 40, 60], yTicks: [-1, 0, 1], yLabel: "信号" });
    plotLine(g, vpTop, xs, yin, { color: COLORS.textDim, width: 1.3 });
    plotLine(g, vpTop, xs, yout, { color: COLORS.green, width: 2.4, glow: true });
    drawLabel(g, vpTop, `M = ${M}`, 2, 1.4, { color: COLORS.amber });
    drawLabel(g, vpTop, "薄: 入力 / 緑: 移動平均", 26, 1.4, { color: COLORS.textDim });

    // 下段: 周波数応答 |H(e^{jω})|
    const vpBot = makeViewport(width, height - split, { x0: 0, x1: Math.PI, y0: -0.1, y1: 1.15 }, { b: 26, t: 8 });
    vpBot.py += split;
    axes(g, vpBot, {
      xTicks: [0, Math.PI / 2, Math.PI],
      xTickFormat: (v) => (v < 0.1 ? "0" : v > 2 ? "π" : "π/2"),
      yTicks: [0, 0.5, 1],
      xLabel: "ω",
      yLabel: "|H|",
    });
    const { omega, mag } = freqz(Array(M).fill(1 / M), [1], 512);
    plotLine(g, vpBot, omega, mag, { color: COLORS.cyan, width: 2, glow: true });
    // 妨害周波数 ω = 2π·0.45 の縦線
    const wBad = 2 * Math.PI * 0.45;
    plotLine(g, vpBot, [wBad, wBad], [-0.1, 1.15], { color: COLORS.pink, width: 1.5, dash: [4, 3] });
    drawLabel(g, vpBot, "妨害 ω≈2.83", wBad - 1.35, 1.05, { color: COLORS.pink });
  },
};

export default def;
