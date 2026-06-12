// デモの純データ台帳。Demo.astro（ビルド時）と scripts/smoketest.ts（整合検証）が参照する。
// ここに無い id を <Demo id=...> に書くとビルドが落ちる。

export interface DemoMeta {
  title: string;
  chapter: number;
  /** canvas の CSS 高さ px（既定 300） */
  height?: number;
}

export const demoMeta: Record<string, DemoMeta> = {};
