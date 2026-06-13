// 第13章: s平面の極の位置とインパルス応答。極ペア s = σ ± jω を動かすと、
// 応答 h(t) = e^{σt}cos(ωt) の減衰/発散/持続が切り替わる。
// σ < 0（左半平面）なら減衰=安定、を目で確かめる。

import type { DemoDef } from "../types";
import { COLORS, PLOT_FONT, makeViewport, axes, plotFn } from "../plot";

// アンバーの×マーカー（短い線分2本）
function cross(g: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  g.strokeStyle = COLORS.amber;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(x - s, y - s);
  g.lineTo(x + s, y + s);
  g.moveTo(x - s, y + s);
  g.lineTo(x + s, y - s);
  g.stroke();
}

const def: DemoDef = {
  id: "s-plane-impulse",
  animated: true,
  controls: [
    {
      kind: "slider",
      id: "sigma",
      label: "実部 σ",
      min: -1.2,
      max: 0.4,
      step: 0.05,
      value: -0.3,
      format: (v) => v.toFixed(2),
    },
    {
      kind: "slider",
      id: "omega",
      label: "虚部 ω",
      min: 0,
      max: 8,
      step: 0.25,
      value: 3,
      format: (v) => v.toFixed(1),
    },
  ],
  draw({ g, width, height, params, t, playing }) {
    // 再生中は実部 σ を -1 → 0.6 へ自動掃引（ループ）。停止中はスライダー値。
    const sigma = playing ? -1 + ((t * 0.4) % 1.6) : params.sigma;
    const omega = params.omega;

    // --- 左 40%: s平面（座標変換は自前） ---
    const planeW = width * 0.4;
    const top = 18;
    const bottom = height - 22;
    const scaleX = (planeW - 24) / 2.1; // σ ∈ [-1.5, 0.6] が収まる
    const cx = 10 + 1.5 * scaleX; // jω軸（σ=0）の画面x
    const cy = (top + bottom) / 2; // σ軸（ω=0）の画面y
    const scaleY = (bottom - top) / 2 / 8.8; // ω ∈ [-8.8, 8.8] が収まる
    const sx = (s: number) => cx + s * scaleX;
    const sy = (w: number) => cy - w * scaleY;

    g.save();
    // 左半平面（σ<0）の薄緑の塗り = 安定領域
    g.fillStyle = "rgba(84,224,162,0.06)";
    g.fillRect(sx(-1.5), top, cx - sx(-1.5), bottom - top);

    // σ軸・jω軸
    g.strokeStyle = COLORS.axis;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(sx(-1.5), cy);
    g.lineTo(sx(0.6), cy);
    g.moveTo(cx, top);
    g.lineTo(cx, bottom);
    g.stroke();

    g.font = PLOT_FONT;
    g.fillStyle = COLORS.textDim;
    g.textAlign = "left";
    g.textBaseline = "alphabetic";
    g.fillText("jω", cx + 4, top + 10);
    g.fillText("σ", sx(0.6) - 10, cy - 5);
    g.fillText("安定領域", sx(-1.45), bottom - 6);

    // 極ペア s = σ ± jω
    cross(g, sx(sigma), sy(omega), 5);
    cross(g, sx(sigma), sy(-omega), 5);

    // 状態ラベル
    const stable = sigma < -1e-9;
    const unstable = sigma > 1e-9;
    const status = stable ? "減衰（安定）" : unstable ? "発散（不安定）" : "持続振動";
    const statusColor = stable ? COLORS.green : unstable ? COLORS.pink : COLORS.amber;
    g.fillStyle = COLORS.text;
    g.fillText(`σ = ${sigma.toFixed(2)}, ω = ${omega.toFixed(1)}`, 10, height - 6);
    g.fillStyle = statusColor;
    g.fillText(status, planeW + 46, 12);
    g.restore();

    // --- 右 60%: インパルス応答 h(t) = e^{σt} cos(ωt) ---
    const vp = makeViewport(width, height, { x0: 0, x1: 8, y0: -3, y1: 3 }, { l: planeW + 46, r: 12, t: 18, b: 24 });
    axes(g, vp, {
      xTicks: [0, 2, 4, 6, 8],
      yTicks: [-1, 0, 1],
      xLabel: "t",
      yLabel: "h(t)",
    });
    // 包絡線 ±e^{σt}
    plotFn(g, vp, (t) => Math.exp(sigma * t), { color: COLORS.textDim, width: 1, dash: [4, 3] });
    plotFn(g, vp, (t) => -Math.exp(sigma * t), { color: COLORS.textDim, width: 1, dash: [4, 3] });
    // 本体
    plotFn(g, vp, (t) => Math.exp(sigma * t) * Math.cos(omega * t), {
      color: COLORS.green,
      width: 2,
      glow: true,
      samples: 900,
    });
  },
};

export default def;
