// 第14章: z平面の極の位置とインパルス応答。極ペア z = re^{±jθ} を動かすと、
// 応答 h[n] = r^n cos(θn) の減衰/発散が切り替わる。
// 第13章の「左半平面=安定」が、離散では「単位円内=安定」に対応することを見る。

import type { DemoDef } from "../types";
import { COLORS, PLOT_FONT, makeViewport, axes, plotFn, plotStem } from "../plot";

const NPTS = 40;

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
  id: "z-plane-impulse",
  controls: [
    {
      kind: "slider",
      id: "r",
      label: "極の半径 r",
      min: 0,
      max: 1.2,
      step: 0.02,
      value: 0.85,
      format: (v) => v.toFixed(2),
    },
    {
      kind: "slider",
      id: "theta",
      label: "極の角度 θ",
      min: 0,
      max: 3.14,
      step: 0.05,
      value: 0.6,
      format: (v) => `${v.toFixed(2)} rad`,
    },
  ],
  draw({ g, width, height, params }) {
    const r = params.r;
    const theta = params.theta;

    // --- 左 40%: z平面（座標変換は自前） ---
    const planeW = width * 0.4;
    const top = 18;
    const bottom = height - 22;
    const cx = planeW / 2 + 6;
    const cy = (top + bottom) / 2;
    const scale = Math.min(planeW - 24, bottom - top) / 2 / 1.32; // 半径1.32まで収まる
    const px = (re: number) => cx + re * scale;
    const py = (im: number) => cy - im * scale;

    g.save();
    // 単位円の内側の薄緑の塗り = 安定領域
    g.fillStyle = "rgba(84,224,162,0.06)";
    g.beginPath();
    g.arc(cx, cy, scale, 0, Math.PI * 2);
    g.fill();

    // 実軸・虚軸
    g.strokeStyle = COLORS.grid;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(px(-1.3), cy);
    g.lineTo(px(1.3), cy);
    g.moveTo(cx, py(1.3));
    g.lineTo(cx, py(-1.3));
    g.stroke();

    // 単位円
    g.strokeStyle = COLORS.axis;
    g.beginPath();
    g.arc(cx, cy, scale, 0, Math.PI * 2);
    g.stroke();

    g.font = PLOT_FONT;
    g.fillStyle = COLORS.textDim;
    g.textAlign = "left";
    g.textBaseline = "alphabetic";
    g.fillText("Im", cx + 4, py(1.3) + 10);
    g.fillText("Re", px(1.3) - 14, cy - 5);
    g.fillText("1", px(1) + 3, cy + 12);

    // 共役極ペア z = re^{±jθ}
    cross(g, px(r * Math.cos(theta)), py(r * Math.sin(theta)), 5);
    cross(g, px(r * Math.cos(theta)), py(-r * Math.sin(theta)), 5);

    // 状態ラベル
    const stable = r < 1 - 1e-9;
    const unstable = r > 1 + 1e-9;
    const status = stable ? "単位円内: 安定" : unstable ? "単位円外: 発散" : "単位円上: 持続振動";
    const statusColor = stable ? COLORS.green : unstable ? COLORS.pink : COLORS.amber;
    g.fillStyle = COLORS.text;
    g.fillText(`r = ${r.toFixed(2)}, θ = ${theta.toFixed(2)} rad`, 10, height - 6);
    g.fillStyle = statusColor;
    g.fillText(status, planeW + 46, 12);
    g.restore();

    // --- 右 60%: インパルス応答 h[n] = r^n cos(θn) ---
    const vp = makeViewport(
      width,
      height,
      { x0: -1, x1: NPTS, y0: -2, y1: 2 },
      { l: planeW + 46, r: 12, t: 18, b: 24 },
    );
    axes(g, vp, {
      xTicks: [0, 10, 20, 30],
      yTicks: [-1, 0, 1],
      xLabel: "n",
      yLabel: "h[n]",
    });
    // 包絡線 ±r^n（連続補間。r=0 や負側に Infinity が出ないよう n を 0 以上に丸める）
    plotFn(g, vp, (n) => Math.pow(r, Math.max(n, 0)), { color: COLORS.textDim, width: 1, dash: [4, 3] });
    plotFn(g, vp, (n) => -Math.pow(r, Math.max(n, 0)), { color: COLORS.textDim, width: 1, dash: [4, 3] });
    // 本体（ステム）
    const ns = new Float64Array(NPTS);
    const hs = new Float64Array(NPTS);
    for (let n = 0; n < NPTS; n++) {
      ns[n] = n;
      hs[n] = Math.pow(r, n) * Math.cos(theta * n);
    }
    plotStem(g, vp, ns, hs, { color: COLORS.green, radius: 2.6 });
  },
};

export default def;
