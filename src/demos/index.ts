// id → 遅延ローダ。Vite がデモごとにチャンク分割するため、
// 章ページは自分のデモ分の JS しか読み込まない。

import type { DemoDef } from "./types";

export const demoLoaders: Record<string, () => Promise<{ default: DemoDef }>> = {
  "fourier-partial-sum": () => import("./ch01/fourier-partial-sum"),
  "harmonics-stack": () => import("./ch01/harmonics-stack"),
};
