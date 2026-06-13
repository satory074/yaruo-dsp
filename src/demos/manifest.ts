// デモの純データ台帳。Demo.astro（ビルド時）と scripts/smoketest.ts（整合検証）が参照する。
// ここに無い id を <Demo id=...> に書くとビルドが落ちる。

export interface DemoMeta {
  title: string;
  chapter: number;
  /** canvas の CSS 高さ px（既定 300） */
  height?: number;
}

export const demoMeta: Record<string, DemoMeta> = {
  // 第1章 フーリエ級数
  "fourier-partial-sum": { title: "FOURIER SERIES — PARTIAL SUM", chapter: 1 },
  "harmonics-stack": { title: "HARMONICS — STACK & SUM", chapter: 1, height: 360 },
  // 第2章 複素フーリエ級数
  "rotating-phasors": { title: "ROTATING PHASORS", chapter: 2, height: 320 },
  "line-spectrum": { title: "TWO-SIDED LINE SPECTRUM", chapter: 2, height: 340 },
  // 第3章 フーリエ変換
  "rect-sinc": { title: "RECT ⇄ SINC", chapter: 3, height: 340 },
  "period-to-continuum": { title: "PERIOD → CONTINUUM", chapter: 3, height: 360 },
  // 第4章 離散時間信号
  "sampling-basics": { title: "SAMPLING BASICS", chapter: 4 },
  "omega-periodicity": { title: "OMEGA PERIODICITY — ω vs ω+2π", chapter: 4 },
  // 第5章 DTFT
  "dtft-explorer": { title: "DTFT EXPLORER", chapter: 5, height: 360 },
  // 第6章 DFT
  "dft-bins-on-dtft": { title: "DFT BINS ON DTFT", chapter: 6, height: 320 },
  "dft-basis": { title: "DFT BASIS — N=16", chapter: 6, height: 340 },
  "fft-recursion-tree": { title: "FFT — DIVIDE & CONQUER", chapter: 6, height: 360 },
  // 第7章 時間シフトと変調
  "shift-phase": { title: "TIME SHIFT → LINEAR PHASE", chapter: 7, height: 400 },
  "modulation-shift": { title: "MODULATION — SPECTRUM SHIFT", chapter: 7, height: 360 },
  // 第8章 たたみこみ
  "convolution-step": { title: "CONVOLUTION — STEP BY STEP", chapter: 8, height: 420 },
  "moving-average": { title: "MOVING AVERAGE FILTER", chapter: 8, height: 360 },
  // 第9章 パーセバル
  "parseval-balance": { title: "PARSEVAL — ENERGY BALANCE", chapter: 9, height: 320 },
  // 第10章 サンプリング定理
  "spectrum-replicas": { title: "SAMPLING — SPECTRUM REPLICAS", chapter: 10, height: 320 },
  "aliasing-time": { title: "ALIASING — TIME DOMAIN", chapter: 10, height: 320 },
  "sinc-interpolation": { title: "SINC INTERPOLATION", chapter: 10, height: 340 },
  // 第11章 窓関数
  "window-explorer": { title: "WINDOW EXPLORER", chapter: 11, height: 360 },
  "two-tone-resolution": { title: "TWO-TONE RESOLUTION", chapter: 11, height: 320 },
  // 第12章 ディジタルフィルタの基礎
  "fir-taps-playground": { title: "FIR TAPS — PLAYGROUND", chapter: 12, height: 360 },
  "denoise-demo": { title: "MOVING AVERAGE — DENOISE", chapter: 12, height: 360 },
  // 第13章 ラプラス変換
  "s-plane-impulse": { title: "S-PLANE → IMPULSE RESPONSE", chapter: 13, height: 320 },
  // 第14章 z変換
  "z-plane-impulse": { title: "Z-PLANE → IMPULSE RESPONSE", chapter: 14, height: 320 },
  // 第15章 ディジタルフィルタの解析
  "pole-zero-drag": { title: "POLE-ZERO PLAYGROUND", chapter: 15, height: 340 },
  "linear-phase-delay": { title: "PHASE & GROUP DELAY", chapter: 15, height: 360 },
  // 第16章 ディジタルフィルタの設計
  "fir-window-design": { title: "FIR WINDOW DESIGN", chapter: 16, height: 360 },
  "bilinear-warping": { title: "BILINEAR FREQUENCY WARP", chapter: 16, height: 340 },
  // 付録B バタワースフィルタ
  "butterworth-order": { title: "BUTTERWORTH — ORDER N", chapter: 91, height: 340 },
};
