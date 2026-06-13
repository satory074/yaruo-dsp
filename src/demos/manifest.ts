// デモの純データ台帳。Demo.astro（ビルド時）と scripts/smoketest.ts（整合検証）が参照する。
// ここに無い id を <Demo id=...> に書くとビルドが落ちる。

export interface DemoMeta {
  title: string;
  chapter: number;
  /** canvas の CSS 高さ px（既定 300） */
  height?: number;
}

export const demoMeta: Record<string, DemoMeta> = {
  "fourier-partial-sum": { title: "FOURIER SERIES — PARTIAL SUM", chapter: 1 },
  "harmonics-stack": { title: "HARMONICS — STACK & SUM", chapter: 1, height: 360 },
  "rotating-phasors": { title: "ROTATING PHASORS", chapter: 2, height: 320 },
  "line-spectrum": { title: "TWO-SIDED LINE SPECTRUM", chapter: 2, height: 340 },
  "rect-sinc": { title: "RECT ⇄ SINC", chapter: 3, height: 340 },
  "period-to-continuum": { title: "PERIOD → CONTINUUM", chapter: 3, height: 360 },
};
