// 第9章: パーセバルの等式の天秤。時間領域で測った部分和のパワーと、周波数領域の
// Σ|c_k|²（係数のパワー）が、どの項数 N でも一致することを2本の棒で見せる。

import type { DemoDef } from "../types";
import { COLORS, makeViewport, axes, plotFn, toPx, drawLabel, PLOT_FONT } from "../plot";
import { squareWavePartialSum, sawtoothPartialSum } from "../../lib/dsp";

// 真の全パワー（1周期平均）: 矩形波=1, のこぎり波=1/3
const TRUE_POWER = [1, 1 / 3];

// 周波数側パワー Σ_{k≤N} (1/2)|b_k|²
function freqPower(kind: number, N: number): number {
  let s = 0;
  if (kind === 0) {
    // 矩形波 b_k = 4/(πk)（k奇数）
    for (let k = 1; k <= N; k += 2) s += 0.5 * (4 / (Math.PI * k)) ** 2;
  } else {
    // のこぎり波 |b_k| = 2/(πk)
    for (let k = 1; k <= N; k++) s += 0.5 * (2 / (Math.PI * k)) ** 2;
  }
  return s;
}

// 時間側パワー: 部分和を [-π,π) で数値積分し 2π で割る
function timePower(kind: number, N: number): number {
  const M = 500;
  let s = 0;
  for (let i = 0; i < M; i++) {
    const t = -Math.PI + (2 * Math.PI * i) / M;
    const v = kind === 0 ? squareWavePartialSum(t, N) : sawtoothPartialSum(t, N);
    s += v * v;
  }
  return (s / M); // (Σ/M)·(2π) / (2π)
}

const WAVE_PARTIAL = [squareWavePartialSum, sawtoothPartialSum];

const def: DemoDef = {
  id: "parseval-balance",
  controls: [
    {
      kind: "select",
      id: "wave",
      label: "波形",
      value: 0,
      options: [
        { value: 0, label: "矩形波" },
        { value: 1, label: "のこぎり波" },
      ],
    },
    { kind: "slider", id: "N", label: "項数 N", min: 1, max: 30, step: 1, value: 3 },
  ],
  draw({ g, width, height, params }) {
    const kind = Math.round(params.wave);
    const N = Math.max(1, Math.round(params.N));
    const partial = WAVE_PARTIAL[kind] ?? WAVE_PARTIAL[0];
    const split = Math.round(width * 0.5);

    const tPow = timePower(kind, N);
    const fPow = freqPower(kind, N);
    const truth = TRUE_POWER[kind];

    // 左: 時間領域の部分和波形
    const vpL = makeViewport(split, height, { x0: -Math.PI, x1: Math.PI, y0: -1.5, y1: 1.5 }, { b: 26, t: 14 });
    axes(g, vpL, {
      xTicks: [-Math.PI, 0, Math.PI],
      xTickFormat: (v) => (v === 0 ? "0" : v > 0 ? "π" : "-π"),
      yTicks: [-1, 0, 1],
      xLabel: "t",
      yLabel: "f_N(t)",
    });
    plotFn(g, vpL, (t) => partial(t, N), { color: COLORS.green, width: 2.2, glow: true, samples: 700 });
    drawLabel(g, vpL, `N = ${N}`, -Math.PI + 0.2, 1.35, { color: COLORS.amber });

    // 右: 棒グラフ2本（時間側=緑, 周波数側=cyan）＋真の全パワー水平線
    const vpR = makeViewport(width - split, height, { x0: 0, x1: 3, y0: 0, y1: truth * 1.35 }, { l: 40, r: 14, b: 26, t: 14 });
    vpR.px += split;
    axes(g, vpR, {
      xTicks: [],
      yTicks: [0, truth / 2, truth],
      yTickFormat: (v) => v.toFixed(2),
      yLabel: "パワー",
    });

    // 棒を fillRect で直接描く
    const barW = vpR.pw * 0.26;
    function bar(centerX: number, value: number, color: string): void {
      const [cx] = toPx(vpR, centerX, 0);
      const [, top] = toPx(vpR, 0, value);
      const [, base] = toPx(vpR, 0, 0);
      g.save();
      g.fillStyle = color;
      g.shadowColor = color;
      g.shadowBlur = 6;
      g.fillRect(cx - barW / 2, top, barW, base - top);
      g.restore();
    }
    bar(1, tPow, COLORS.green);
    bar(2, fPow, COLORS.cyan);

    // 真の全パワー水平線（破線）
    const [, ty] = toPx(vpR, 0, truth);
    g.save();
    g.strokeStyle = COLORS.textDim;
    g.setLineDash([5, 4]);
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(vpR.px, ty);
    g.lineTo(vpR.px + vpR.pw, ty);
    g.stroke();
    g.restore();

    // ラベル
    g.save();
    g.font = PLOT_FONT;
    g.textAlign = "center";
    g.textBaseline = "top";
    g.fillStyle = COLORS.green;
    const [bx1] = toPx(vpR, 1, 0);
    g.fillText("時間側", bx1, vpR.py + vpR.ph + 4);
    g.fillStyle = COLORS.cyan;
    const [bx2] = toPx(vpR, 2, 0);
    g.fillText("Σ|c_k|²", bx2, vpR.py + vpR.ph + 4);
    g.restore();

    drawLabel(g, vpR, `時間 ${tPow.toFixed(3)}`, 1, tPow + truth * 0.06, { color: COLORS.green, align: "center" });
    drawLabel(g, vpR, `周波数 ${fPow.toFixed(3)}`, 2, fPow + truth * 0.06, { color: COLORS.cyan, align: "center" });
    drawLabel(g, vpR, `全パワー ${truth.toFixed(3)}`, 0.05, truth + truth * 0.06, { color: COLORS.textDim, align: "left" });
  },
};

export default def;
