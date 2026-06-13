// 第16章: 双線形変換の周波数ワーピング。横軸=ディジタル角周波数 ω∈[0,π]、
// 縦軸=アナログ角周波数 Ω。Ω=(2/T)tan(ωT/2)（T=1固定）の曲線が、
// 高周波ほど圧縮される様子を示す。プリワーピングONで補正の効果を見せる。

import type { DemoDef } from "../types";
import { COLORS, makeViewport, axes, plotFn, plotLine, drawLabel, toPx } from "../plot";
import { bilinearWarp } from "../../lib/dsp-design";

const T = 1; // サンプリング周期固定
const OMEGA_MAX = 6; // 縦軸クリップ上限

const def: DemoDef = {
  id: "bilinear-warping",
  controls: [
    {
      kind: "slider",
      id: "target",
      label: "アナログ設計周波数 Ω_target",
      min: 0.2,
      max: 2.8,
      step: 0.05,
      value: 1.0,
      format: (v) => v.toFixed(2),
    },
    { kind: "checkbox", id: "prewarp", label: "プリワーピング", value: 0 },
  ],
  draw({ g, width, height, params }) {
    const target = params.target;
    const prewarp = Math.round(params.prewarp) === 1;

    const vp = makeViewport(
      width,
      height,
      { x0: 0, x1: Math.PI, y0: 0, y1: OMEGA_MAX },
      { l: 50, r: 16, t: 16, b: 28 },
    );
    axes(g, vp, {
      xTicks: [0, Math.PI / 2, Math.PI],
      xTickFormat: (v) => (v < 0.1 ? "0" : v < 2 ? "π/2" : "π"),
      xLabel: "ディジタル ω",
      yLabel: "アナログ Ω",
    });

    // 理想直線 Ω = ω（歪みなしの仮想線）
    plotFn(g, vp, (w) => w, { color: COLORS.textDim, width: 1, dash: [4, 4] });
    drawLabel(g, vp, "歪みなしなら Ω=ω", Math.PI * 0.62, Math.PI * 0.62, {
      color: COLORS.textDim,
      align: "left",
    });

    // ワーピング曲線 Ω = (2/T)tan(ωT/2)。π 近傍で発散するのでクリップ。
    plotFn(
      g,
      vp,
      (w) => {
        const v = bilinearWarp(Math.min(w, Math.PI - 1e-4), T);
        return Math.min(OMEGA_MAX + 1, Math.max(0, v));
      },
      { color: COLORS.green, width: 2, glow: true, samples: 600 },
    );
    drawLabel(g, vp, "高周波ほど圧縮される", Math.PI * 0.5, OMEGA_MAX * 0.9, {
      color: COLORS.green,
    });

    if (!prewarp) {
      // OFF: アナログで Ω_target に置きたい極を、素朴に ω=Ω_target に置いた場合。
      // 実際にその ω が写るアナログ周波数はもっと高い（ズレ）。
      const wNaive = Math.min(target, Math.PI - 1e-3);
      const actual = bilinearWarp(wNaive, T);
      // 望んだ水平線（Ω_target）
      const xs = new Float64Array([0, Math.PI]);
      const ys = new Float64Array([target, target]);
      plotLine(g, vp, xs, ys, { color: COLORS.amber, width: 1, dash: [2, 3] });
      // 素朴配置 ω=Ω_target からの縦線と、そこで実際に写る Ω
      vLine(g, vp, wNaive, 0, Math.min(actual, OMEGA_MAX));
      drawLabel(g, vp, `素朴: ω=${target.toFixed(2)} → 実際 Ω=${actual.toFixed(2)}`, wNaive, Math.min(actual, OMEGA_MAX), {
        color: COLORS.pink,
        align: "left",
        dx: 4,
      });
      drawLabel(g, vp, `望んだ Ω=${target.toFixed(2)}`, Math.PI, target, {
        color: COLORS.amber,
        align: "right",
        dy: -4,
      });
    } else {
      // ON: プリワープ Ω' = (2/T)tan(Ω_target·T/2)。
      // 設計を Ω' でやれば、双線形後に ω=Ω_target がちょうど Ω_target に対応する。
      const wDigital = Math.min(target, Math.PI - 1e-3); // 配置したいディジタル ω
      const omegaPre = bilinearWarp(wDigital, T); // プリワープ後のアナログ設計周波数
      // 正しく対応する縦線（曲線上の点を経由）
      vLine(g, vp, wDigital, 0, Math.min(omegaPre, OMEGA_MAX));
      const xs = new Float64Array([0, wDigital]);
      const ys = new Float64Array([Math.min(omegaPre, OMEGA_MAX), Math.min(omegaPre, OMEGA_MAX)]);
      plotLine(g, vp, xs, ys, { color: COLORS.amber, width: 1, dash: [2, 3] });
      drawLabel(g, vp, `プリワープ: Ω'=${omegaPre.toFixed(2)} で設計 → ω=${target.toFixed(2)} に命中`, 0.1, Math.min(omegaPre, OMEGA_MAX), {
        color: COLORS.amber,
        align: "left",
        dy: -4,
      });
    }
  },
};

// データ座標で縦線を引く
function vLine(
  g: CanvasRenderingContext2D,
  vp: Parameters<typeof toPx>[0],
  x: number,
  y0: number,
  y1: number,
): void {
  const [sx, sy0] = toPx(vp, x, y0);
  const [, sy1] = toPx(vp, x, y1);
  g.save();
  g.strokeStyle = COLORS.pink;
  g.lineWidth = 1.5;
  g.setLineDash([]);
  g.beginPath();
  g.moveTo(sx, sy0);
  g.lineTo(sx, sy1);
  g.stroke();
  g.restore();
}

export default def;
