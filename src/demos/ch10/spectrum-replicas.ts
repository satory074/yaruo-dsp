// 第10章: サンプリングによるスペクトルの複製。
// 帯域 ωmax = 4 の三角形スペクトル X(ω) を持つ信号をサンプリングすると、
// スペクトルが間隔 ωs で無限に複製される（ここでは k = ±1..±3 を表示）。
// ωs < 2ωmax = 8 になると複製が重なり、和が元のスペクトルと変わる＝エイリアシング。
// 縦軸は複製1枚の高さを 1 に正規化した T·Xs(ω) 相当。

import type { DemoDef } from "../types";
import { COLORS, makeViewport, axes, plotFn, plotLine, drawLabel } from "../plot";

const WMAX = 4; // 元スペクトルの帯域

// 元のスペクトル: 三角形 X(ω) = max(0, 1 - |ω|/4)
function X(w: number): number {
  return Math.max(0, 1 - Math.abs(w) / WMAX);
}

const REPLICA_KS = [-3, -2, -1, 1, 2, 3];

const def: DemoDef = {
  id: "spectrum-replicas",
  controls: [
    {
      kind: "slider",
      id: "ws",
      label: "サンプリング周波数 ωs",
      min: 4,
      max: 20,
      step: 0.5,
      value: 12,
      format: (v) => v.toFixed(1),
    },
    { kind: "checkbox", id: "reps", label: "複製を表示", value: 1 },
  ],
  draw({ g, width, height, params }) {
    const ws = params.ws;
    const overlap = ws < 2 * WMAX; // 複製が重なる条件

    const vp = makeViewport(width, height, { x0: -24, x1: 24, y0: -0.18, y1: 1.5 });
    axes(g, vp, { xTicks: [-20, -10, 0, 10, 20], yTicks: [0, 1], xLabel: "ω" });

    // 複製 X(ω - kωs)
    if (params.reps) {
      for (const k of REPLICA_KS) {
        plotFn(g, vp, (w) => X(w - k * ws), { color: COLORS.cyan, width: 1.3, samples: 900 });
      }
    }

    // 元のスペクトル X(ω)
    plotFn(g, vp, X, { color: COLORS.green, width: 2.4, glow: true, samples: 900 });

    // 重なりがあれば合計 ΣX(ω-kωs) を破線で重ねる（観測されるスペクトル）
    if (params.reps && overlap) {
      plotFn(
        g,
        vp,
        (w) => {
          let s = 0;
          for (let k = -3; k <= 3; k++) s += X(w - k * ws);
          return s;
        },
        { color: COLORS.pink, width: 1.7, dash: [6, 4], samples: 1400 },
      );
      drawLabel(g, vp, "エイリアシング発生!", 0, 1.38, { color: COLORS.pink, align: "center" });
    }

    // 基本帯域の境界 ±ωs/2
    for (const s of [-1, 1]) {
      const wHalf = (s * ws) / 2;
      plotLine(g, vp, [wHalf, wHalf], [vp.y0, vp.y1], { color: COLORS.amber, width: 1.2, dash: [3, 3] });
      drawLabel(g, vp, s > 0 ? "ωs/2" : "-ωs/2", wHalf, 1.22, {
        color: COLORS.amber,
        align: "center",
        dy: -2,
      });
    }

    drawLabel(g, vp, `ωs = ${ws.toFixed(1)} / ωmax = 4`, -23, 1.38, { color: COLORS.amber });
    if (!overlap) {
      drawLabel(g, vp, "複製は重ならない（ωs ≥ 2ωmax）", 23, 1.38, { color: COLORS.textDim, align: "right" });
    }
  },
};

export default def;
