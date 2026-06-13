// 第15章: 極・零点をドラッグして周波数特性が変わる様子を体感する目玉デモ。
// 左に z 平面（単位円・極×・零点○）、右に |H(e^{jω})|。共役対は自動で対称描画。
// 上半面のマーカーがドラッグ対象。極が単位円の外に出ると「不安定!」を表示する。

import type { DemoDef } from "../types";
import { COLORS, makeViewport, axes, plotLine, drawLabel } from "../plot";
import { evalRationalZ, cabs } from "../../lib/dsp-design";

// 状態（極座標）。共役対の上半面のみ保持し、描画時に共役を足す。
let rp = 0.8; // 極の半径
let thp = Math.PI / 4; // 極の角度
let rz = 1.0; // 零点の半径
let thz = (3 * Math.PI) / 4; // 零点の角度

// ドラッグ対象と、座標変換に使う z 平面の中心・スケールを描画時に保存。
let dragging: "pole" | "zero" | null = null;
let planeCx = 0;
let planeCy = 0;
let planeScale = 1; // データ単位 1（半径1）あたりのピクセル数

function zPlaneGeom(width: number, height: number): void {
  const planeW = Math.min(width * 0.45, height);
  planeScale = (planeW / 2 - 22) / 1.5; // 半径 1.5 まで収まる
  planeCx = planeW / 2 + 10;
  planeCy = height / 2;
}

const def: DemoDef = {
  id: "pole-zero-drag",
  controls: [],
  draw({ g, width, height, params }) {
    void params;
    zPlaneGeom(width, height);

    // ===== 左: z 平面 =====
    const cx = planeCx;
    const cy = planeCy;
    const s = planeScale;

    // 軸
    g.save();
    g.strokeStyle = COLORS.grid;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(cx - 1.5 * s, cy);
    g.lineTo(cx + 1.5 * s, cy);
    g.moveTo(cx, cy + 1.5 * s);
    g.lineTo(cx, cy - 1.5 * s);
    g.stroke();
    // 単位円
    g.strokeStyle = COLORS.axis;
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(cx, cy, s, 0, Math.PI * 2);
    g.stroke();
    g.restore();

    // 極・零点（共役対）。データ → 画面（虚軸は上向き）
    const px = (re: number) => cx + re * s;
    const py = (im: number) => cy - im * s;
    const poleRe = rp * Math.cos(thp);
    const poleIm = rp * Math.sin(thp);
    const zeroRe = rz * Math.cos(thz);
    const zeroIm = rz * Math.sin(thz);

    // 零点 ○（cyan）
    g.save();
    g.strokeStyle = COLORS.cyan;
    g.lineWidth = 2;
    for (const im of [zeroIm, -zeroIm]) {
      g.beginPath();
      g.arc(px(zeroRe), py(im), 6, 0, Math.PI * 2);
      g.stroke();
    }
    // 極 ×（amber）
    g.strokeStyle = COLORS.amber;
    for (const im of [poleIm, -poleIm]) {
      const x = px(poleRe);
      const y = py(im);
      g.beginPath();
      g.moveTo(x - 5, y - 5);
      g.lineTo(x + 5, y + 5);
      g.moveTo(x + 5, y - 5);
      g.lineTo(x - 5, y + 5);
      g.stroke();
    }
    g.restore();

    // 操作ヒント・ラベル
    drawLabelPx(g, cx - 1.5 * s + 4, cy - 1.5 * s + 12, "× や ○ をドラッグ", COLORS.textDim);
    if (rp >= 1) {
      drawLabelPx(g, cx, cy + 1.5 * s + 2, "不安定! 極が単位円の外", COLORS.pink, "center");
    }

    // ===== 右: |H(e^{jω})| =====
    const left = Math.min(width * 0.45, height) + 24;
    const N = 256;
    const omega = new Float64Array(N);
    const magArr = new Float64Array(N);
    const zeros = [
      { re: zeroRe, im: zeroIm },
      { re: zeroRe, im: -zeroIm },
    ];
    const poles = [
      { re: poleRe, im: poleIm },
      { re: poleRe, im: -poleIm },
    ];
    let maxMag = 1e-9;
    for (let i = 0; i < N; i++) {
      const w = (Math.PI * i) / (N - 1);
      omega[i] = w;
      const m = cabs(evalRationalZ(zeros, poles, 1, w));
      magArr[i] = m;
      if (m > maxMag) maxMag = m;
    }
    for (let i = 0; i < N; i++) magArr[i] /= maxMag;

    const vp = makeViewport(
      width,
      height,
      { x0: 0, x1: Math.PI, y0: 0, y1: 1.08 },
      { l: left, r: 14, t: 16, b: 26 },
    );
    axes(g, vp, {
      xTicks: [0, Math.PI / 2, Math.PI],
      xTickFormat: (v) => (v < 0.1 ? "0" : v < 2 ? "π/2" : "π"),
      yTicks: [0, 0.5, 1],
      xLabel: "ω",
      yLabel: "|H| (正規化)",
    });
    plotLine(g, vp, omega, magArr, { color: COLORS.green, width: 2, glow: true });

    // 山/谷の直観コメント
    drawLabel(g, vp, "極の近く→山 / 零点の近く→谷", Math.PI, 1.06, {
      color: COLORS.textDim,
      align: "right",
    });
  },
  onPointer(ev, size, params) {
    void params;
    zPlaneGeom(size.width, size.height);
    const cx = planeCx;
    const cy = planeCy;
    const s = planeScale;

    // 上半面マーカーの画面座標
    const poleScreen = { x: cx + rp * Math.cos(thp) * s, y: cy - rp * Math.sin(thp) * s };
    const zeroScreen = { x: cx + rz * Math.cos(thz) * s, y: cy - rz * Math.sin(thz) * s };

    if (ev.type === "down") {
      const dp = Math.hypot(ev.x - poleScreen.x, ev.y - poleScreen.y);
      const dz = Math.hypot(ev.x - zeroScreen.x, ev.y - zeroScreen.y);
      if (dp <= 20 && dp <= dz) {
        dragging = "pole";
        return true;
      }
      if (dz <= 20) {
        dragging = "zero";
        return true;
      }
      return false;
    }

    if (ev.type === "move" && dragging) {
      // 画面座標 → z 平面複素座標（虚軸は上向き）
      const re = (ev.x - cx) / s;
      const im = (cy - ev.y) / s;
      let r = Math.hypot(re, im);
      let th = Math.atan2(im, re);
      r = Math.min(1.45, Math.max(0.05, r));
      th = Math.min(Math.PI - 0.05, Math.max(0.05, th));
      if (dragging === "pole") {
        rp = r;
        thp = th;
      } else {
        rz = r;
        thz = th;
      }
      return true;
    }

    if (ev.type === "up") {
      if (!dragging) return false;
      dragging = null;
      return true;
    }
    return false;
  },
};

// 画面座標へ直接テキストを置く小ヘルパ（z 平面側はビューポート外なので素の ctx を使う）
function drawLabelPx(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string,
  align: CanvasTextAlign = "left",
): void {
  g.save();
  g.font = "11px 'IBM Plex Mono', Menlo, monospace";
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = "alphabetic";
  g.fillText(text, x, y);
  g.restore();
}

export default def;
