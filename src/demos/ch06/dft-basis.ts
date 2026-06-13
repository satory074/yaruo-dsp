// 第6章: DFT の基底ベクトル e^{j2πkn/N}（N=16 固定）。
// 上段に実部 cos(2πkn/16)、下段に虚部 sin(2πkn/16)。
// k=0 は直流、k=8 が最高周波数、k>8 は負の周波数（逆回転）に見える。

import type { DemoDef } from "../types";
import { COLORS, makeViewport, axes, plotStem, drawLabel } from "../plot";

const N = 16;

const def: DemoDef = {
  id: "dft-basis",
  controls: [{ kind: "slider", id: "k", label: "k", min: 0, max: 15, step: 1, value: 1 }],
  draw({ g, width, height, params }) {
    const k = Math.max(0, Math.min(N - 1, Math.round(params.k)));
    const split = Math.round(height * 0.5);

    const ns: number[] = [];
    const re: number[] = [];
    const im: number[] = [];
    for (let n = 0; n < N; n++) {
      const ang = (2 * Math.PI * k * n) / N;
      ns.push(n);
      re.push(Math.cos(ang));
      im.push(Math.sin(ang));
    }

    // 上段: 実部 cos(2πkn/16)
    const vpTop = makeViewport(width, split, { x0: -0.8, x1: 15.8, y0: -1.5, y1: 1.5 }, { b: 6, t: 16 });
    axes(g, vpTop, { xTicks: [], yTicks: [-1, 0, 1], yLabel: "Re: cos(2πkn/16)" });
    plotStem(g, vpTop, ns, re, { color: COLORS.green, glow: true });

    // 下段: 虚部 sin(2πkn/16)
    const vpBot = makeViewport(width, height - split, { x0: -0.8, x1: 15.8, y0: -1.5, y1: 1.5 }, { b: 26, t: 12 });
    vpBot.py += split;
    axes(g, vpBot, { xTicks: [0, 5, 10, 15], yTicks: [-1, 0, 1], xLabel: "n", yLabel: "Im: sin(2πkn/16)" });
    plotStem(g, vpBot, ns, im, { color: COLORS.cyan, glow: true });

    let note: string;
    if (k === 0) note = "k=0: 直流（すべて 1）";
    else if (k === N / 2) note = "k=8: 最高周波数（±1 が交互）";
    else if (k > N / 2) note = `k=${k} は k=${N - k} の逆回転と同じ（負の周波数）`;
    else note = `16 サンプルでちょうど ${k} 回転`;
    drawLabel(g, vpTop, note, 15.5, 1.32, { color: COLORS.amber, align: "right" });
  },
};

export default def;
