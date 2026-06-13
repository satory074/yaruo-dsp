// 第5章: DTFT エクスプローラ。代表的な離散時間信号の振幅スペクトル |X(e^{jω})| を
// 閉形式で描き、スペクトルが必ず 2π 周期になることを観察する。

import type { DemoDef } from "../types";
import { COLORS, makeViewport, axes, plotFn, plotLine, plotStem, drawLabel } from "../plot";

const A = 0.8; // 指数減衰の底

/** 信号 x[n] の値 */
function signal(kind: number, n: number, L: number): number {
  switch (kind) {
    case 0: // インパルス δ[n]
      return n === 0 ? 1 : 0;
    case 1: // 矩形パルス（長さ L）
      return n >= 0 && n < L ? 1 : 0;
    default: // 指数減衰 0.8^n u[n]
      return n >= 0 ? Math.pow(A, n) : 0;
  }
}

/** |X(e^{jω})| の閉形式 */
function dtftMag(kind: number, w: number, L: number): number {
  switch (kind) {
    case 0:
      return 1;
    case 1: {
      const s = Math.sin(w / 2);
      if (Math.abs(s) < 1e-9) return L;
      return Math.abs(Math.sin((w * L) / 2) / s);
    }
    default:
      return 1 / Math.sqrt(1 - 2 * A * Math.cos(w) + A * A);
  }
}

function piTick(v: number): string {
  const k = Math.round(v / Math.PI);
  if (k === 0) return "0";
  const body = Math.abs(k) === 1 ? "π" : `${Math.abs(k)}π`;
  return k < 0 ? `-${body}` : body;
}

const def: DemoDef = {
  id: "dtft-explorer",
  controls: [
    {
      kind: "select",
      id: "kind",
      label: "信号",
      value: 0,
      options: [
        { value: 0, label: "インパルス δ[n]" },
        { value: 1, label: "矩形パルス（長さL）" },
        { value: 2, label: "指数減衰 0.8^n u[n]" },
      ],
    },
    { kind: "slider", id: "L", label: "L（矩形のとき有効）", min: 1, max: 12, step: 1, value: 4 },
  ],
  draw({ g, width, height, params }) {
    const kind = Math.round(params.kind);
    const L = Math.max(1, Math.round(params.L));
    const split = Math.round(height * 0.42);

    // 上段: 信号 x[n]
    const vpTop = makeViewport(width, split, { x0: -2.6, x1: 15.6, y0: -0.25, y1: 1.35 }, { b: 18, t: 14 });
    axes(g, vpTop, { xTicks: [0, 5, 10, 15], yTicks: [0, 1], xLabel: "n" });
    const ns: number[] = [];
    const xs: number[] = [];
    for (let n = -2; n <= 15; n++) {
      ns.push(n);
      xs.push(signal(kind, n, L));
    }
    plotStem(g, vpTop, ns, xs, { color: COLORS.cyan, radius: 2.8 });

    // 下段: |X(e^{jω})| を ω ∈ [-2π, 2π] で
    const peak = kind === 0 ? 1 : kind === 1 ? L : 1 / (1 - A);
    const vpBot = makeViewport(
      width,
      height - split,
      { x0: -2 * Math.PI, x1: 2 * Math.PI, y0: 0, y1: peak * 1.22 },
      { b: 26, t: 10 },
    );
    vpBot.py += split;
    axes(g, vpBot, {
      xTicks: [-2 * Math.PI, -Math.PI, 0, Math.PI, 2 * Math.PI],
      xTickFormat: piTick,
      yTicks: [0, peak],
      xLabel: "ω",
      yLabel: "|X(e^jω)|",
    });

    // 全区間（参考・細線）
    plotFn(g, vpBot, (w) => dtftMag(kind, w, L), { color: COLORS.textDim, width: 1.2, samples: 1400 });

    // [-π, π] の1周期分を強調
    const m = 400;
    const ws: number[] = [];
    const mags: number[] = [];
    for (let i = 0; i <= m; i++) {
      const w = -Math.PI + (2 * Math.PI * i) / m;
      ws.push(w);
      mags.push(dtftMag(kind, w, L));
    }
    plotLine(g, vpBot, ws, mags, { color: COLORS.green, width: 2.2, glow: true });

    drawLabel(g, vpBot, "[-π, π] の1周期", 0, peak * 1.13, { color: COLORS.amber, align: "center" });
    drawLabel(g, vpBot, "同じ形が 2π ごとに繰り返す", 2 * Math.PI - 0.15, peak * 1.13, {
      color: COLORS.textDim,
      align: "right",
    });
  },
};

export default def;
