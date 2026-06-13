// 第2章: 回転フェーザの連結。複素指数関数 e^{jkω0t} のベクトルを鎖状につなぎ、
// 鎖の先端の虚部が波形を描き出す様子をアニメーションで見る。

import type { DemoDef } from "../types";
import { COLORS, PLOT_FONT, makeViewport, axes, plotLine, toPx } from "../plot";

// 矩形波: f(t) = Σ_{k odd} (4/πk) sin(kω0t)。
// sin(kθ) = Im(e^{jkθ}) なので、振幅 4/(πk) のベクトルを角速度 k で回して連結する。
const OMEGA0 = 1; // rad/s（見やすい速度に倍率をかける）
const SPEED = 1.2;

const def: DemoDef = {
  id: "rotating-phasors",
  animated: true,
  controls: [
    { kind: "slider", id: "pairs", label: "項数", min: 1, max: 6, step: 1, value: 2, format: (v) => `${v}` },
  ],
  draw({ g, width, height, params, t }) {
    const nTerms = Math.round(params.pairs);
    const theta = OMEGA0 * t * SPEED;

    // 左 40% が複素平面、右 60% が時間波形
    const planeW = Math.min(width * 0.42, height);
    const cx = planeW / 2 + 8;
    const cy = height / 2;
    const unit = (planeW / 2 - 18) / 1.35; // 振幅1.35くらいまで収まるスケール

    // --- 複素平面 ---
    g.save();
    g.strokeStyle = COLORS.grid;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(cx - planeW / 2, cy);
    g.lineTo(cx + planeW / 2, cy);
    g.moveTo(cx, cy - planeW / 2);
    g.lineTo(cx, cy + planeW / 2);
    g.stroke();
    g.font = PLOT_FONT;
    g.fillStyle = COLORS.textDim;
    g.textAlign = "left";
    g.fillText("Im", cx + 4, cy - planeW / 2 + 10);
    g.fillText("Re", cx + planeW / 2 - 18, cy - 5);

    // フェーザ鎖: k = 1, 3, 5, ... のベクトルを順に連結
    let px = cx;
    let py = cy;
    let sumIm = 0;
    const chainColors = [COLORS.green, COLORS.cyan, COLORS.amber, COLORS.pink, "#b48ce5", "#8ee55e"];
    for (let i = 0; i < nTerms; i++) {
      const k = 2 * i + 1;
      const amp = 4 / (Math.PI * k);
      const dx = amp * Math.cos(k * theta) * unit;
      const dy = -amp * Math.sin(k * theta) * unit; // 画面は y 下向き
      // 軌道円
      g.strokeStyle = "#2c3b35";
      g.beginPath();
      g.arc(px, py, amp * unit, 0, Math.PI * 2);
      g.stroke();
      // ベクトル
      g.strokeStyle = chainColors[i % chainColors.length];
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(px, py);
      g.lineTo(px + dx, py + dy);
      g.stroke();
      px += dx;
      py += dy;
      sumIm += amp * Math.sin(k * theta);
    }
    // 鎖の先端
    g.fillStyle = COLORS.white;
    g.beginPath();
    g.arc(px, py, 3.5, 0, Math.PI * 2);
    g.fill();
    g.restore();

    // --- 時間波形（先端の虚部の履歴） ---
    const vp = makeViewport(width, height, { x0: 0, x1: 4 * Math.PI, y0: -1.6, y1: 1.6 }, { l: planeW + 42, r: 12 });
    axes(g, vp, {
      xTicks: [0, 2 * Math.PI, 4 * Math.PI],
      xTickFormat: (v) => (v === 0 ? "0" : v > 6.5 ? "4π" : "2π"),
      yTicks: [-1, 0, 1],
      xLabel: "θ (進行)",
    });
    // 過去2周期ぶんの波形
    const N = 300;
    const xs = new Float64Array(N);
    const ys = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      const back = (4 * Math.PI * i) / (N - 1);
      xs[i] = 4 * Math.PI - back;
      let s = 0;
      for (let j = 0; j < nTerms; j++) {
        const k = 2 * j + 1;
        s += (4 / (Math.PI * k)) * Math.sin(k * (theta - back));
      }
      ys[i] = s;
    }
    plotLine(g, vp, xs, ys, { color: COLORS.green, width: 2, glow: true });

    // 先端と波形の接続線
    const [hx, hy] = toPx(vp, 4 * Math.PI, sumIm);
    g.save();
    g.strokeStyle = COLORS.textDim;
    g.setLineDash([3, 3]);
    g.beginPath();
    g.moveTo(px, py);
    g.lineTo(hx, hy);
    g.stroke();
    g.setLineDash([]);
    g.fillStyle = COLORS.amber;
    g.beginPath();
    g.arc(hx, hy, 3.5, 0, Math.PI * 2);
    g.fill();
    g.restore();
  },
};

export default def;
