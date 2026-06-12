// デモ定義の型。数値計算は src/lib/dsp.ts に置き、ここは描画とUIの契約のみ。

export interface ControlDef {
  kind: "slider" | "select" | "checkbox";
  id: string;
  label: string;
  /** slider 用 */
  min?: number;
  max?: number;
  step?: number;
  /** 初期値。checkbox は 0/1 */
  value: number;
  /** 値の表示文字列（省略時は素の数値） */
  format?: (v: number) => string;
  /** select 用 */
  options?: { value: number; label: string }[];
}

export interface DemoFrame {
  g: CanvasRenderingContext2D;
  /** CSS px（DPR スケール済みの論理座標） */
  width: number;
  height: number;
  params: Record<string, number>;
  /** 再生経過秒（animated のみ増加） */
  t: number;
}

export interface PointerInfo {
  type: "down" | "move" | "up";
  /** CSS px 座標 */
  x: number;
  y: number;
}

export interface DemoDef {
  id: string;
  controls: ControlDef[];
  /** true なら再生/停止ボタンが付き、rAF ループで t が進む */
  animated?: boolean;
  draw(f: DemoFrame): void;
  /** ドラッグ操作等。true を返すと再描画される */
  onPointer?(ev: PointerInfo, size: { width: number; height: number }, params: Record<string, number>): boolean;
}
