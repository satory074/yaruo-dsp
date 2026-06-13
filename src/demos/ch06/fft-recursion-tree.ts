// 第6章: FFT の分割統治を可視化。長さ N の DFT を偶数番・奇数番の長さ N/2 の DFT 2つに割り、
// それをまた割って…とサイズ1まで log2 N 段の再帰木を描く。素朴 O(N²) と FFT O(N log N) の
// 演算回数を並べ、N を上げるほど差が開くのを見せる。draw 内は ctx 経由のみ（jsdom 対策）。

import type { DemoDef } from "../types";
import { COLORS, PLOT_FONT } from "../plot";

const def: DemoDef = {
  id: "fft-recursion-tree",
  controls: [
    { kind: "slider", id: "logN", label: "N", min: 1, max: 5, step: 1, value: 3, format: (v) => `N=${2 ** v}` },
  ],
  draw({ g, width, height, params }) {
    const logN = Math.max(1, Math.min(5, Math.round(params.logN)));
    const N = 2 ** logN;
    const levels = logN + 1; // 第0段=DFT N 〜 最下段=サイズ1（合計 logN+1 段）

    const padTop = 22;
    const padBottom = 34;
    const usableH = Math.max(40, height - padTop - padBottom);
    const rowGap = usableH / Math.max(1, levels - 1);

    // 各段の箱サイズ。下に行くほど箱が増えるので、最下段（N 個）が収まる幅に合わせる
    const slotW = width / N;
    const boxW = Math.min(slotW * 0.78, 72);
    const boxH = Math.min(rowGap * 0.42, 26);

    // level L には 2^L 個の箱（各サイズ N / 2^L の DFT）が横一列に並ぶ
    const centerX = (level: number, idx: number): number => {
      const count = 2 ** level;
      const colW = width / count;
      return colW * (idx + 0.5);
    };
    const centerY = (level: number): number => padTop + rowGap * level;

    // --- 枝（先に描いて箱の下に隠す）---
    g.save();
    g.strokeStyle = COLORS.axis;
    g.lineWidth = 1;
    for (let level = 0; level < levels - 1; level++) {
      const count = 2 ** level;
      const y0 = centerY(level) + boxH / 2;
      const y1 = centerY(level + 1) - boxH / 2;
      for (let idx = 0; idx < count; idx++) {
        const x0 = centerX(level, idx);
        // 親 idx は子 2*idx（偶数番）と 2*idx+1（奇数番）へ分岐
        for (const child of [2 * idx, 2 * idx + 1]) {
          const x1 = centerX(level + 1, child);
          g.beginPath();
          g.moveTo(x0, y0);
          g.lineTo(x1, y1);
          g.stroke();
        }
      }
    }
    g.restore();

    // --- 箱 + ラベル ---
    g.save();
    g.font = PLOT_FONT;
    g.textAlign = "center";
    g.textBaseline = "middle";
    for (let level = 0; level < levels; level++) {
      const count = 2 ** level;
      const size = N / count; // この段の各 DFT の長さ
      const cy = centerY(level);
      for (let idx = 0; idx < count; idx++) {
        const cx = centerX(level, idx);
        // 箱
        g.strokeStyle = COLORS.green;
        g.lineWidth = 1.4;
        g.strokeRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH);
        // ラベル（箱の幅が狭い段では短縮）
        let label: string;
        if (size === 1) label = "1";
        else label = count <= 4 ? `DFT ${size}` : `${size}`;
        g.fillStyle = size === N ? COLORS.amber : COLORS.text;
        g.fillText(label, cx, cy);
      }
      // 段の役割注記（左端、箱と重ならない位置）
      if (count <= 4) {
        let role: string;
        if (level === 0) role = "入力";
        else if (size === 1) role = "サイズ1=値そのもの";
        else role = "偶数番 / 奇数番に分割";
        g.fillStyle = COLORS.textDim;
        g.textAlign = "left";
        g.fillText(role, 4, cy - boxH / 2 - 8);
        g.textAlign = "center";
      }
    }
    g.restore();

    // --- 演算回数の比較（下部）---
    const naive = N * N;
    const fast = N * logN; // N log2 N
    g.save();
    g.font = PLOT_FONT;
    g.textBaseline = "alphabetic";
    const baseY = height - 16;
    g.textAlign = "left";
    g.fillStyle = COLORS.textDim;
    g.fillText(`素朴 O(N²) = ${naive} 回`, 8, baseY);
    g.textAlign = "right";
    g.fillStyle = COLORS.amber;
    g.fillText(`FFT O(N log₂N) = ${fast} 回`, width - 8, baseY);
    g.restore();
  },
};

export default def;
