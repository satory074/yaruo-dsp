// オシロスコープ風の共通描画ヘルパ。全デモの見た目をここで統一する。

export const COLORS = {
  bg: "transparent",
  grid: "#243029",
  axis: "#4a5b52",
  text: "#93a89d",
  textDim: "#5d6f67",
  green: "#54e0a2",
  amber: "#ffb454",
  cyan: "#5ec8e5",
  pink: "#ff7d9c",
  white: "#e8efe9",
} as const;

export const PLOT_FONT = "11px 'IBM Plex Mono', Menlo, monospace";

export interface Viewport {
  /** データ座標の範囲 */
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  /** 描画先ピクセル領域（CSS px） */
  px: number;
  py: number;
  pw: number;
  ph: number;
}

export function makeViewport(
  width: number,
  height: number,
  range: { x0: number; x1: number; y0: number; y1: number },
  margin: { l?: number; r?: number; t?: number; b?: number } = {},
): Viewport {
  const l = margin.l ?? 38;
  const r = margin.r ?? 14;
  const t = margin.t ?? 14;
  const b = margin.b ?? 26;
  return { ...range, px: l, py: t, pw: Math.max(10, width - l - r), ph: Math.max(10, height - t - b) };
}

export function toPx(vp: Viewport, x: number, y: number): [number, number] {
  const sx = vp.px + ((x - vp.x0) / (vp.x1 - vp.x0)) * vp.pw;
  const sy = vp.py + (1 - (y - vp.y0) / (vp.y1 - vp.y0)) * vp.ph;
  return [sx, sy];
}

export function fromPx(vp: Viewport, sx: number, sy: number): [number, number] {
  const x = vp.x0 + ((sx - vp.px) / vp.pw) * (vp.x1 - vp.x0);
  const y = vp.y0 + (1 - (sy - vp.py) / vp.ph) * (vp.y1 - vp.y0);
  return [x, y];
}

export interface AxesOpts {
  xLabel?: string;
  yLabel?: string;
  /** グリッド線を引く x/y の値リスト（省略時は自動でほどよく刻む） */
  xTicks?: number[];
  yTicks?: number[];
  xTickFormat?: (v: number) => string;
  yTickFormat?: (v: number) => string;
  /** y=0 の軸線を強調する */
  zeroLine?: boolean;
}

function autoTicks(a: number, b: number, n = 5): number[] {
  const span = b - a;
  const rawStep = span / n;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const step = (norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10) * mag;
  const ticks: number[] = [];
  for (let v = Math.ceil(a / step) * step; v <= b + 1e-9; v += step) ticks.push(Math.abs(v) < 1e-12 ? 0 : v);
  return ticks;
}

function fmtTick(v: number): string {
  if (Math.abs(v) >= 1000) return v.toExponential(0);
  return Number(v.toFixed(3)).toString();
}

export function axes(g: CanvasRenderingContext2D, vp: Viewport, opts: AxesOpts = {}): void {
  const xTicks = opts.xTicks ?? autoTicks(vp.x0, vp.x1);
  const yTicks = opts.yTicks ?? autoTicks(vp.y0, vp.y1);
  const fx = opts.xTickFormat ?? fmtTick;
  const fy = opts.yTickFormat ?? fmtTick;

  g.save();
  g.font = PLOT_FONT;

  // グリッド
  g.strokeStyle = COLORS.grid;
  g.lineWidth = 1;
  for (const v of xTicks) {
    const [sx] = toPx(vp, v, 0);
    g.beginPath();
    g.moveTo(sx, vp.py);
    g.lineTo(sx, vp.py + vp.ph);
    g.stroke();
  }
  for (const v of yTicks) {
    const [, sy] = toPx(vp, 0, v);
    g.beginPath();
    g.moveTo(vp.px, sy);
    g.lineTo(vp.px + vp.pw, sy);
    g.stroke();
  }

  // ゼロ線
  if (opts.zeroLine !== false && vp.y0 < 0 && vp.y1 > 0) {
    const [, sy] = toPx(vp, 0, 0);
    g.strokeStyle = COLORS.axis;
    g.beginPath();
    g.moveTo(vp.px, sy);
    g.lineTo(vp.px + vp.pw, sy);
    g.stroke();
  }

  // 枠
  g.strokeStyle = COLORS.axis;
  g.strokeRect(vp.px, vp.py, vp.pw, vp.ph);

  // 目盛ラベル
  g.fillStyle = COLORS.text;
  g.textAlign = "center";
  g.textBaseline = "top";
  for (const v of xTicks) {
    const [sx] = toPx(vp, v, 0);
    g.fillText(fx(v), sx, vp.py + vp.ph + 5);
  }
  g.textAlign = "right";
  g.textBaseline = "middle";
  for (const v of yTicks) {
    const [, sy] = toPx(vp, 0, v);
    g.fillText(fy(v), vp.px - 5, sy);
  }

  // 軸ラベル
  if (opts.xLabel) {
    g.textAlign = "right";
    g.textBaseline = "bottom";
    g.fillStyle = COLORS.textDim;
    g.fillText(opts.xLabel, vp.px + vp.pw, vp.py - 3);
  }
  if (opts.yLabel) {
    g.textAlign = "left";
    g.textBaseline = "bottom";
    g.fillStyle = COLORS.textDim;
    g.fillText(opts.yLabel, vp.px + 4, vp.py - 3);
  }
  g.restore();
}

export interface StrokeOpts {
  color?: string;
  width?: number;
  dash?: number[];
  glow?: boolean;
}

function applyStroke(g: CanvasRenderingContext2D, o: StrokeOpts): void {
  g.strokeStyle = o.color ?? COLORS.green;
  g.lineWidth = o.width ?? 2;
  g.setLineDash(o.dash ?? []);
  if (o.glow) {
    g.shadowColor = o.color ?? COLORS.green;
    g.shadowBlur = 6;
  }
}

/** 連続関数の波形を描く */
export function plotFn(
  g: CanvasRenderingContext2D,
  vp: Viewport,
  fn: (x: number) => number,
  opts: StrokeOpts & { samples?: number } = {},
): void {
  const n = opts.samples ?? Math.max(100, Math.floor(vp.pw));
  g.save();
  g.beginPath();
  g.rect(vp.px, vp.py, vp.pw, vp.ph);
  g.clip();
  applyStroke(g, opts);
  g.beginPath();
  for (let i = 0; i <= n; i++) {
    const x = vp.x0 + ((vp.x1 - vp.x0) * i) / n;
    const [sx, sy] = toPx(vp, x, fn(x));
    if (i === 0) g.moveTo(sx, sy);
    else g.lineTo(sx, sy);
  }
  g.stroke();
  g.restore();
}

/** 折れ線（点列） */
export function plotLine(
  g: CanvasRenderingContext2D,
  vp: Viewport,
  xs: ArrayLike<number>,
  ys: ArrayLike<number>,
  opts: StrokeOpts = {},
): void {
  g.save();
  g.beginPath();
  g.rect(vp.px, vp.py, vp.pw, vp.ph);
  g.clip();
  applyStroke(g, opts);
  g.beginPath();
  for (let i = 0; i < xs.length; i++) {
    const [sx, sy] = toPx(vp, xs[i], ys[i]);
    if (i === 0) g.moveTo(sx, sy);
    else g.lineTo(sx, sy);
  }
  g.stroke();
  g.restore();
}

/** 離散信号のステム（茎+丸）表示 */
export function plotStem(
  g: CanvasRenderingContext2D,
  vp: Viewport,
  xs: ArrayLike<number>,
  ys: ArrayLike<number>,
  opts: StrokeOpts & { radius?: number } = {},
): void {
  const r = opts.radius ?? 3.2;
  const [, sy0] = toPx(vp, 0, Math.max(vp.y0, Math.min(vp.y1, 0)));
  g.save();
  g.beginPath();
  g.rect(vp.px - r, vp.py - r, vp.pw + r * 2, vp.ph + r * 2);
  g.clip();
  applyStroke(g, { ...opts, width: opts.width ?? 1.6 });
  const color = opts.color ?? COLORS.green;
  for (let i = 0; i < xs.length; i++) {
    const [sx, sy] = toPx(vp, xs[i], ys[i]);
    g.beginPath();
    g.moveTo(sx, sy0);
    g.lineTo(sx, sy);
    g.stroke();
    g.beginPath();
    g.fillStyle = color;
    g.arc(sx, sy, r, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

/** データ座標へのテキスト描画 */
export function drawLabel(
  g: CanvasRenderingContext2D,
  vp: Viewport,
  text: string,
  x: number,
  y: number,
  opts: { color?: string; align?: CanvasTextAlign; baseline?: CanvasTextBaseline; dx?: number; dy?: number } = {},
): void {
  const [sx, sy] = toPx(vp, x, y);
  g.save();
  g.font = PLOT_FONT;
  g.fillStyle = opts.color ?? COLORS.text;
  g.textAlign = opts.align ?? "left";
  g.textBaseline = opts.baseline ?? "alphabetic";
  g.fillText(text, sx + (opts.dx ?? 0), sy + (opts.dy ?? 0));
  g.restore();
}
