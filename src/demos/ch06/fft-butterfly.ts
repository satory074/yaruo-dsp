// 第6章: FFTのバタフライ信号流れ図（時間間引き DIT）。
// 再帰木が「分割」を見せるのに対し、こちらは「結合」を見せる。
// 各バタフライは入力 a（上）・b（下）から、掛け算 W·b を1回だけ行い
// 上出力 a+W·b と下出力 a−W·b の2つを同時に作る。

import type { DemoDef } from "../types";
import { COLORS, PLOT_FONT } from "../plot";

function bitReverse(x: number, bits: number): number {
  let r = 0;
  for (let i = 0; i < bits; i++) {
    r = (r << 1) | ((x >> i) & 1);
  }
  return r;
}

// 回転因子の指数 e を W_N^e の上付き表記にする（N は基底の長さ）
function twiddleLabel(base: number, e: number): string {
  return e === 0 ? "1" : `W${sub(base)}${sup(e)}`;
}
function sub(n: number): string {
  return String(n)
    .split("")
    .map((d) => "₀₁₂₃₄₅₆₇₈₉"[Number(d)])
    .join("");
}
function sup(n: number): string {
  return String(n)
    .split("")
    .map((d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(d)])
    .join("");
}

const def: DemoDef = {
  id: "fft-butterfly",
  controls: [
    { kind: "select", id: "n", label: "N", value: 8, options: [{ value: 4, label: "4" }, { value: 8, label: "8" }] },
    { kind: "slider", id: "stage", label: "強調ステージ", min: 1, max: 3, step: 1, value: 1, format: (v) => `第${v}段` },
  ],
  draw({ g, width, height, params }) {
    const N = Math.round(params.n);
    const bits = Math.round(Math.log2(N));
    const hs = Math.min(Math.round(params.stage), bits); // 強調するステージ（1..bits）

    const cols = bits + 1; // 入力列 + 各段
    const left = 52;
    const right = width - 52;
    const top = 30;
    const bottom = height - 22;
    const colX = (c: number) => left + ((right - left) * c) / (cols - 1);
    const rowY = (r: number) => top + ((bottom - top) * r) / (N - 1);

    g.save();
    g.font = PLOT_FONT;
    g.textBaseline = "middle";

    // ステージ見出し
    g.fillStyle = COLORS.textDim;
    g.textAlign = "center";
    for (let s = 1; s <= bits; s++) {
      const span = 1 << s;
      g.fillStyle = s === hs ? COLORS.amber : COLORS.textDim;
      g.fillText(`第${s}段 (W${sub(span)})`, (colX(s - 1) + colX(s)) / 2, 12);
    }

    // 各段のバタフライ描画
    for (let s = 1; s <= bits; s++) {
      const span = 1 << s; // このバタフライがまたぐ行数
      const half = span >> 1;
      const c0 = s - 1;
      const c1 = s;
      const highlight = s === hs;
      for (let group = 0; group < N; group += span) {
        for (let j = 0; j < half; j++) {
          const tRow = group + j; // a（上）
          const bRow = group + j + half; // b（下）
          const e = j * (N / span); // 回転因子の指数 W_N^e
          const ax = colX(c0);
          const bx = colX(c1);
          const tyIn = rowY(tRow);
          const byIn = rowY(bRow);
          // 4本のエッジ: a→上, b→上, a→下, b→下
          const edges: [number, number, number, number, string][] = [
            [ax, tyIn, bx, tyIn, "plus"], // a → 上出力
            [ax, byIn, bx, byIn, "plus"], // b → 下出力（直線）
            [ax, tyIn, bx, byIn, "cross"], // a → 下出力（交差）
            [ax, byIn, bx, tyIn, "cross"], // b → 上出力（交差・W倍）
          ];
          for (const [x0, y0, x1, y1, kind] of edges) {
            g.beginPath();
            g.moveTo(x0, y0);
            g.lineTo(x1, y1);
            if (highlight) {
              g.strokeStyle = kind === "cross" ? COLORS.amber : COLORS.green;
              g.lineWidth = 1.6;
            } else {
              g.strokeStyle = COLORS.grid;
              g.lineWidth = 1;
            }
            g.stroke();
          }
          // 回転因子ラベル（b の入口側に）
          if (highlight) {
            g.fillStyle = COLORS.amber;
            g.textAlign = "left";
            g.fillText(twiddleLabel(N, e), ax + (bx - ax) * 0.12, byIn - 9);
          }
        }
      }
    }

    // ノード（各列×各行の点）
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < N; r++) {
        g.beginPath();
        g.fillStyle = COLORS.white;
        g.arc(colX(c), rowY(r), 2.6, 0, Math.PI * 2);
        g.fill();
      }
    }

    // 入力ラベル（ビット反転順）・出力ラベル（自然順）
    g.fillStyle = COLORS.cyan;
    g.textAlign = "right";
    for (let r = 0; r < N; r++) {
      g.fillText(`x[${bitReverse(r, bits)}]`, left - 6, rowY(r));
    }
    g.fillStyle = COLORS.green;
    g.textAlign = "left";
    for (let r = 0; r < N; r++) {
      g.fillText(`X[${r}]`, right + 6, rowY(r));
    }

    // 1つのバタフライの公式（下部の凡例）
    g.fillStyle = COLORS.text;
    g.textAlign = "left";
    g.fillText("各バタフライ: 上 = a + W·b,  下 = a − W·b  （掛け算 W·b は1回、2出力を同時に生む）", left - 40, height - 7);

    g.restore();
  },
};

export default def;
