// id → 遅延ローダ。Vite がデモごとにチャンク分割するため、
// 章ページは自分のデモ分の JS しか読み込まない。

import type { DemoDef } from "./types";

export const demoLoaders: Record<string, () => Promise<{ default: DemoDef }>> = {
  "fourier-partial-sum": () => import("./ch01/fourier-partial-sum"),
  "harmonics-stack": () => import("./ch01/harmonics-stack"),
  "rotating-phasors": () => import("./ch02/rotating-phasors"),
  "line-spectrum": () => import("./ch02/line-spectrum"),
  "rect-sinc": () => import("./ch03/rect-sinc"),
  "period-to-continuum": () => import("./ch03/period-to-continuum"),
  "sampling-basics": () => import("./ch04/sampling-basics"),
  "omega-periodicity": () => import("./ch04/omega-periodicity"),
  "dtft-explorer": () => import("./ch05/dtft-explorer"),
  "dft-bins-on-dtft": () => import("./ch06/dft-bins-on-dtft"),
  "dft-basis": () => import("./ch06/dft-basis"),
  "fft-recursion-tree": () => import("./ch06/fft-recursion-tree"),
  "shift-phase": () => import("./ch07/shift-phase"),
  "modulation-shift": () => import("./ch07/modulation-shift"),
  "convolution-step": () => import("./ch08/convolution-step"),
  "moving-average": () => import("./ch08/moving-average"),
  "parseval-balance": () => import("./ch09/parseval-balance"),
  "spectrum-replicas": () => import("./ch10/spectrum-replicas"),
  "aliasing-time": () => import("./ch10/aliasing-time"),
  "sinc-interpolation": () => import("./ch10/sinc-interpolation"),
  "window-explorer": () => import("./ch11/window-explorer"),
  "two-tone-resolution": () => import("./ch11/two-tone-resolution"),
  "fir-taps-playground": () => import("./ch12/fir-taps-playground"),
  "denoise-demo": () => import("./ch12/denoise-demo"),
  "s-plane-impulse": () => import("./ch13/s-plane-impulse"),
  "z-plane-impulse": () => import("./ch14/z-plane-impulse"),
  "pole-zero-drag": () => import("./ch15/pole-zero-drag"),
  "linear-phase-delay": () => import("./ch15/linear-phase-delay"),
  "fir-window-design": () => import("./ch16/fir-window-design"),
  "bilinear-warping": () => import("./ch16/bilinear-warping"),
  "butterworth-order": () => import("./ch91/butterworth-order"),
};
