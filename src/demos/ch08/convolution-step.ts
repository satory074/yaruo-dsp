// 第8章: たたみこみを1ステップずつ。h を反転してスライドさせ、x との重なりの積和を取ると
// 出力 y[n] の各点ができる様子を、位置 n を動かして目で追う。

import type { DemoDef } from "../types";
import { COLORS, makeViewport, axes, plotStem, drawLabel } from "../plot";
import { convolve } from "../../lib/dsp";

const X = [1, 1, 1, 1, 1, 1]; // 矩形 k=0..5
const H = [1.0, 0.7, 0.4]; // k=0..2
const Y = convolve(X, H); // 長さ 8（n=0..7）

const def: DemoDef = {
  id: "convolution-step",
  animated: true,
  controls: [{ kind: "slider", id: "n", label: "位置 n", min: 0, max: 11, step: 1, value: 0 }],
  draw({ g, width, height, params, t, playing }) {
    // 再生中は位置 n を 0→11 自動掃引（h が滑って y[n] が左から埋まる）、停止中はスライダー値。
    const n = playing ? Math.floor(t / 0.6) % 12 : Math.round(params.n);
    const h = height / 3;
    const kMin = -3;
    const kMax = 12;
    const xticks = [0, 4, 8, 12];

    // 上段: x[k]（緑）と反転スライドした h[n-k]（アンバー）
    const vpTop = makeViewport(width, h, { x0: kMin - 0.5, x1: kMax + 0.5, y0: -0.3, y1: 1.4 }, { b: 16, t: 14 });
    axes(g, vpTop, { xTicks: xticks, yTicks: [0, 1], yLabel: "x[k], h[n-k]" });
    const xk: number[] = [];
    const xv: number[] = [];
    const hk: number[] = [];
    const hv: number[] = [];
    for (let k = kMin; k <= kMax; k++) {
      // x[k]
      if (k >= 0 && k < X.length) {
        xk.push(k);
        xv.push(X[k]);
      }
      // h[n-k]: 引数 n-k が 0..2 のとき値あり
      const idx = n - k;
      if (idx >= 0 && idx < H.length) {
        hk.push(k);
        hv.push(H[idx]);
      }
    }
    plotStem(g, vpTop, xk, xv, { color: COLORS.green });
    plotStem(g, vpTop, hk, hv, { color: COLORS.amber, radius: 4 });
    drawLabel(g, vpTop, "x[k]", kMin + 0.2, 1.25, { color: COLORS.green });
    drawLabel(g, vpTop, "h[n-k] →反転スライド", 4.5, 1.25, { color: COLORS.amber });

    // 中段: 積 x[k]·h[n-k]（ピンク）と総和
    const vpMid = makeViewport(width, h, { x0: kMin - 0.5, x1: kMax + 0.5, y0: -0.3, y1: 1.4 }, { b: 16, t: 8 });
    vpMid.py += h;
    axes(g, vpMid, { xTicks: xticks, yTicks: [0, 1], yLabel: "積" });
    const pk: number[] = [];
    const pv: number[] = [];
    let sum = 0;
    for (let k = kMin; k <= kMax; k++) {
      const idx = n - k;
      const xkv = k >= 0 && k < X.length ? X[k] : 0;
      const hkv = idx >= 0 && idx < H.length ? H[idx] : 0;
      const prod = xkv * hkv;
      if (prod !== 0) {
        pk.push(k);
        pv.push(prod);
      }
      sum += prod;
    }
    plotStem(g, vpMid, pk, pv, { color: COLORS.pink, glow: true });
    drawLabel(g, vpMid, `総和 = y[${n}] = ${sum.toFixed(1)}`, kMin + 0.2, 1.25, { color: COLORS.pink });

    // 下段: 出力 y[n]（n以下確定分=緑、現在のnを大きめアンバーで重ね描き）
    const vpBot = makeViewport(width, height - 2 * h, { x0: -0.5, x1: 11.5, y0: -0.3, y1: 3.4 }, { b: 26, t: 8 });
    vpBot.py += 2 * h;
    axes(g, vpBot, { xTicks: [0, 4, 8], yTicks: [0, 1, 2, 3], xLabel: "n", yLabel: "y[n]" });
    const yn: number[] = [];
    const yv: number[] = [];
    for (let m = 0; m <= n && m < Y.length; m++) {
      yn.push(m);
      yv.push(Y[m]);
    }
    plotStem(g, vpBot, yn, yv, { color: COLORS.green, glow: true });
    if (n < Y.length) {
      plotStem(g, vpBot, [n], [Y[n]], { color: COLORS.amber, radius: 5 });
    }
  },
};

export default def;
