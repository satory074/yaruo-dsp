// 第6章: DFT は DTFT のサンプリング。長さ8の矩形パルスの DTFT 曲線の上に、
// N 点 DFT のビン |X[k]|（ω_k = 2πk/N）を立てる。N は「目盛りの細かさ」であり、
// 増やしても曲線そのもの（情報）は変わらない。

import type { DemoDef } from "../types";
import { COLORS, makeViewport, axes, plotFn, plotStem, drawLabel } from "../plot";

const L = 8; // 固定信号: 長さ8の矩形パルス

/** 長さLの矩形パルスの DTFT 振幅（ゼロ詰めDFTと数学的に同値） */
function dtftMag(w: number): number {
  const s = Math.sin(w / 2);
  if (Math.abs(s) < 1e-9) return L;
  return Math.abs(Math.sin((w * L) / 2) / s);
}

function piTick(v: number): string {
  const r = v / Math.PI;
  if (Math.abs(r) < 1e-9) return "0";
  if (Math.abs(r - 0.5) < 1e-9) return "π/2";
  if (Math.abs(r - 1) < 1e-9) return "π";
  if (Math.abs(r - 1.5) < 1e-9) return "3π/2";
  return "2π";
}

const def: DemoDef = {
  id: "dft-bins-on-dtft",
  controls: [{ kind: "slider", id: "N", label: "DFT点数 N", min: 8, max: 64, step: 4, value: 16 }],
  draw({ g, width, height, params }) {
    const N = Math.max(8, Math.round(params.N));

    const vp = makeViewport(width, height, { x0: 0, x1: 2 * Math.PI, y0: 0, y1: 9.4 });
    axes(g, vp, {
      xTicks: [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2, 2 * Math.PI],
      xTickFormat: piTick,
      yTicks: [0, 4, 8],
      xLabel: "ω",
      yLabel: "|X|",
    });

    // DTFT 曲線（参考・破線）
    plotFn(g, vp, dtftMag, { color: COLORS.textDim, width: 1.3, dash: [5, 4], samples: 1400 });

    // N 点 DFT のビン: ω_k = 2πk/N で DTFT を評価
    const wks: number[] = [];
    const mags: number[] = [];
    for (let k = 0; k < N; k++) {
      const wk = (2 * Math.PI * k) / N;
      wks.push(wk);
      mags.push(dtftMag(wk));
    }
    plotStem(g, vp, wks, mags, { color: COLORS.green, glow: true, radius: 2.8 });

    drawLabel(g, vp, `N = ${N}（ビンの間隔 2π/N ≈ ${((2 * Math.PI) / N).toFixed(2)}）`, 0.15, 8.9, {
      color: COLORS.amber,
    });
    drawLabel(g, vp, "破線: DTFT |X(e^jω)|（信号は長さ8の矩形で固定）", 2 * Math.PI - 0.1, 8.0, {
      color: COLORS.textDim,
      align: "right",
    });
  },
};

export default def;
