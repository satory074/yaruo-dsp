// 付録B: バタワースフィルタの振幅特性。次数 N を上げると理想LPFに近づくが、
// -3dB 点（Ω=ωc=1）は不変。リニア表示と dB 表示を切り替えられる。

import type { DemoDef } from "../types";
import { COLORS, makeViewport, axes, plotFn, plotLine, drawLabel, toPx } from "../plot";
import { butterworthMag } from "../../lib/dsp-design";

const WC = 1; // カットオフ角周波数（正規化）
const OMEGA_MAX = 3;

const def: DemoDef = {
  id: "butterworth-order",
  controls: [
    { kind: "slider", id: "order", label: "次数 N", min: 1, max: 10, step: 1, value: 2, format: (v) => `${v}` },
    { kind: "checkbox", id: "db", label: "dB表示", value: 0 },
  ],
  draw({ g, width, height, params }) {
    const N = Math.round(params.order);
    const useDb = Math.round(params.db) === 1;

    const y0 = useDb ? -60 : 0;
    const y1 = useDb ? 3 : 1.1;
    const vp = makeViewport(
      width,
      height,
      { x0: 0, x1: OMEGA_MAX, y0, y1 },
      { l: 50, r: 16, t: 16, b: 28 },
    );
    axes(g, vp, {
      xLabel: "Ω (×ωc)",
      yLabel: useDb ? "|H| [dB]" : "|H|",
      yTicks: useDb ? [0, -10, -20, -30, -40, -50, -60] : [0, 0.25, 0.5, 0.707, 1],
    });

    const toY = (mag: number) => (useDb ? Math.max(y0, 20 * Math.log10(Math.max(mag, 1e-9))) : mag);

    // 理想 LPF（Ω<1 で通過、外で阻止）
    plotFn(
      g,
      vp,
      (w) => toY(w < WC ? 1 : 1e-9),
      { color: COLORS.textDim, width: 1, dash: [4, 4], samples: 400 },
    );

    // Ω=ωc の縦線 と -3dB(=0.707) の水平線
    vLine(g, vp, WC, y0, y1, COLORS.amber);
    {
      const yv = toY(1 / Math.SQRT2);
      const xs = new Float64Array([0, OMEGA_MAX]);
      const ys = new Float64Array([yv, yv]);
      plotLine(g, vp, xs, ys, { color: COLORS.amber, width: 1, dash: [2, 3] });
      drawLabel(g, vp, "-3dB (0.707)", OMEGA_MAX, yv, { color: COLORS.amber, align: "right", dy: -4 });
    }

    // バタワース振幅特性
    plotFn(g, vp, (w) => toY(butterworthMag(N, WC, w)), {
      color: COLORS.green,
      width: 2,
      glow: true,
      samples: 500,
    });
    drawLabel(g, vp, `N=${N}: 次数を上げると理想に近づくが -3dB点は不変`, OMEGA_MAX * 0.5, useDb ? -2 : 1.05, {
      color: COLORS.green,
      align: "center",
    });
  },
};

function vLine(
  g: CanvasRenderingContext2D,
  vp: Parameters<typeof toPx>[0],
  x: number,
  y0: number,
  y1: number,
  color: string,
): void {
  const [sx, sy0] = toPx(vp, x, y0);
  const [, sy1] = toPx(vp, x, y1);
  g.save();
  g.strokeStyle = color;
  g.lineWidth = 1;
  g.setLineDash([4, 4]);
  g.beginPath();
  g.moveTo(sx, sy0);
  g.lineTo(sx, sy1);
  g.stroke();
  g.restore();
}

export default def;
