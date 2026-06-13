// 第10章: 時間領域で見るエイリアシング。
// fs = 8 Hz 固定で cos(2πft) をサンプリングし、sinc 補間（理想ローパス）で復元する。
// f < fs/2 = 4 Hz なら復元波形は原信号に一致。f > 4 Hz では別の低い周波数の波
// （見かけの周波数 |f - fs·round(f/fs)|）が現れる。

import type { DemoDef } from "../types";
import { COLORS, makeViewport, axes, plotFn, plotStem, drawLabel } from "../plot";
import { sinc } from "../../lib/dsp";

const FS = 8; // サンプリング周波数 [Hz]（固定）
const T = 1 / FS;

const def: DemoDef = {
  id: "aliasing-time",
  controls: [
    {
      kind: "slider",
      id: "f",
      label: "信号周波数 f [Hz]（fs = 8 Hz 固定）",
      min: 0.5,
      max: 9.5,
      step: 0.1,
      value: 1,
      format: (v) => `${v.toFixed(1)} Hz`,
    },
    { kind: "checkbox", id: "recon", label: "sinc補間で復元", value: 1 },
  ],
  draw({ g, width, height, params }) {
    const f = params.f;
    const vp = makeViewport(width, height, { x0: 0, x1: 2, y0: -1.6, y1: 1.6 });
    axes(g, vp, { xTicks: [0, 0.5, 1, 1.5, 2], yTicks: [-1, 0, 1], xLabel: "t [s]" });

    // 原信号 cos(2πft)
    plotFn(g, vp, (t) => Math.cos(2 * Math.PI * f * t), { color: COLORS.textDim, width: 1.2, samples: 1400 });

    // サンプル点（画面内 n = 0..16）
    const xs: number[] = [];
    const ys: number[] = [];
    for (let n = 0; n <= 16; n++) {
      xs.push(n * T);
      ys.push(Math.cos(2 * Math.PI * f * n * T));
    }
    plotStem(g, vp, xs, ys, { color: COLORS.green, radius: 3 });

    // sinc 補間による復元 x(t) = Σ x[n]·sinc(fs·t - n)（端の歪みを避けて n = -8..24）
    if (params.recon) {
      plotFn(
        g,
        vp,
        (t) => {
          let s = 0;
          for (let n = -8; n <= 24; n++) {
            s += Math.cos(2 * Math.PI * f * n * T) * sinc(FS * t - n);
          }
          return s;
        },
        { color: COLORS.amber, width: 2.2, glow: true, samples: 800 },
      );
    }

    // 見かけの周波数（基本帯域への折り返し）
    const apparent = Math.abs(f - FS * Math.round(f / FS));
    drawLabel(g, vp, `見かけの周波数 ≈ ${apparent.toFixed(1)} Hz`, 0.05, 1.42, { color: COLORS.amber });
    if (f > FS / 2) {
      drawLabel(g, vp, "f > fs/2 : 折り返し!", 1.95, 1.42, { color: COLORS.pink, align: "right" });
    }
  },
};

export default def;
