// 第15章: 線形位相 ↔ 群遅延。対称 FIR は位相が直線・群遅延が一定（波形が崩れない）、
// IIR は位相が曲がり群遅延が周波数で変わる様子を上下2段で比べる。

import type { DemoDef } from "../types";
import { COLORS, makeViewport, axes, plotLine, drawLabel } from "../plot";
import { firLowpassWindow, groupDelay, unwrapPhase } from "../../lib/dsp-design";
import { freqz } from "../../lib/dsp";

// 係数を一度だけ用意（ファイルスコープ・純データ）
const firB = Array.from(firLowpassWindow(21, Math.PI / 2, "hamming"));
const firA = [1];
// 2次 IIR ローパス（バタワース風）。a に遅延項があるので非線形位相になる。
const iirB = [0.2929, 0.5858, 0.2929];
const iirA = [1, 0, 0.1716];

const N = 256;

const def: DemoDef = {
  id: "linear-phase-delay",
  controls: [
    {
      kind: "select",
      id: "filt",
      label: "フィルタ",
      value: 0,
      options: [
        { value: 0, label: "対称FIR（21タップ）" },
        { value: 1, label: "IIR 2次LPF" },
      ],
    },
  ],
  draw({ g, width, height, params }) {
    const isFir = Math.round(params.filt) === 0;
    const b = isFir ? firB : iirB;
    const a = isFir ? firA : iirA;

    const { omega, phase } = freqz(b, a, N);
    const ph = unwrapPhase(phase);
    const { gd } = groupDelay(b, a, N);

    const half = height / 2;

    // ===== 上段: 位相特性（アンラップ済み） =====
    let pMin = Infinity;
    let pMax = -Infinity;
    for (let i = 0; i < N; i++) {
      if (ph[i] < pMin) pMin = ph[i];
      if (ph[i] > pMax) pMax = ph[i];
    }
    const pad = Math.max(0.5, (pMax - pMin) * 0.1);
    const vp1 = makeViewport(
      width,
      half,
      { x0: 0, x1: Math.PI, y0: pMin - pad, y1: pMax + pad },
      { l: 46, r: 14, t: 14, b: 22 },
    );
    axes(g, vp1, {
      xTicks: [0, Math.PI / 2, Math.PI],
      xTickFormat: (v) => (v < 0.1 ? "0" : v < 2 ? "π/2" : "π"),
      xLabel: "ω",
      yLabel: "位相 ∠H [rad]",
    });
    plotLine(g, vp1, omega, ph, { color: COLORS.cyan, width: 2, glow: true });
    drawLabel(g, vp1, isFir ? "直線（線形位相）" : "曲線（非線形位相）", 0.05, pMax, {
      color: COLORS.textDim,
    });

    // ===== 下段: 群遅延 =====
    let gMax = 0;
    for (let i = 1; i < N - 1; i++) gMax = Math.max(gMax, gd[i]);
    const yTop = Math.max(14, gMax * 1.2);
    const vp2 = makeViewport(
      width,
      half,
      { x0: 0, x1: Math.PI, y0: 0, y1: yTop },
      { l: 46, r: 14, t: 14, b: 24 },
    );
    // 下段を縦にずらして配置
    shiftViewport(vp2, half);
    axes(g, vp2, {
      xTicks: [0, Math.PI / 2, Math.PI],
      xTickFormat: (v) => (v < 0.1 ? "0" : v < 2 ? "π/2" : "π"),
      xLabel: "ω",
      yLabel: "群遅延 τ(ω) [サンプル]",
    });
    // 端の数値微分は不安定なので内側のみ描く
    const ox = omega.slice(1, N - 1);
    const og = gd.slice(1, N - 1);
    plotLine(g, vp2, ox, og, { color: COLORS.green, width: 2, glow: true });

    if (isFir) {
      // τ=10 の基準線
      const ten = new Float64Array(N).fill(10);
      plotLine(g, vp2, omega, ten, { color: COLORS.amber, width: 1, dash: [4, 4] });
      drawLabel(g, vp2, "全周波数が等しく10サンプル遅れ → 波形が崩れない", 0.05, yTop * 0.9, {
        color: COLORS.amber,
      });
    } else {
      drawLabel(g, vp2, "周波数ごとに遅れが違う → 波形が歪む", 0.05, yTop * 0.9, {
        color: COLORS.textDim,
      });
    }
  },
};

// ビューポートの描画先ピクセル領域を下にずらす
function shiftViewport(vp: { py: number }, dy: number): void {
  vp.py += dy;
}

export default def;
