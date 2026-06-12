// デモのマウント・コントロール生成・rAF・リサイズ管理。
// jsdom では getContext("2d") が null を返すため、ctx が無くても
// コントロール配線までは動く（描画のみスキップ）設計にしている。

import type { ControlDef, DemoDef, DemoFrame } from "./types";
import { demoLoaders } from "./index";

export interface MountHooks {
  /** テスト用: fake 2D context の注入 */
  getContext?: (canvas: HTMLCanvasElement) => CanvasRenderingContext2D | null;
  raf?: (cb: FrameRequestCallback) => number;
  caf?: (handle: number) => void;
  /** false で IntersectionObserver を使わず即マウント */
  lazy?: boolean;
}

export interface DemoHandle {
  def: DemoDef;
  params: Record<string, number>;
  redraw: () => void;
  /** 描画が実際に呼ばれた回数（テスト用） */
  drawCount: () => number;
  playing: () => boolean;
  setPlaying: (on: boolean) => void;
  destroy: () => void;
}

export function bootDemos(root: Document | HTMLElement, hooks: MountHooks = {}): void {
  const figures = Array.from(root.querySelectorAll<HTMLElement>("[data-demo]"));
  if (figures.length === 0) return;

  const mount = async (el: HTMLElement) => {
    const id = el.getAttribute("data-demo");
    if (!id || el.dataset.mounted) return;
    el.dataset.mounted = "1";
    const loader = demoLoaders[id];
    if (!loader) {
      console.warn(`[yaruo-dsp] unknown demo id: ${id}`);
      return;
    }
    const def = (await loader()).default;
    mountDemo(el, def, hooks);
  };

  const lazy = hooks.lazy !== false && typeof IntersectionObserver !== "undefined";
  if (!lazy) {
    figures.forEach((el) => void mount(el));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          io.unobserve(e.target);
          void mount(e.target as HTMLElement);
        }
      }
    },
    { rootMargin: "300px" },
  );
  figures.forEach((el) => io.observe(el));
}

export function mountDemo(el: HTMLElement, def: DemoDef, hooks: MountHooks = {}): DemoHandle {
  const canvas = el.querySelector("canvas");
  const controlsEl = el.querySelector<HTMLElement>(".demo-controls");
  if (!canvas || !controlsEl) throw new Error(`demo ${def.id}: missing canvas or .demo-controls`);

  const params: Record<string, number> = {};
  for (const c of def.controls) params[c.id] = c.value;

  const getContext = hooks.getContext ?? ((c: HTMLCanvasElement) => c.getContext("2d"));
  const raf =
    hooks.raf ?? (typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame.bind(globalThis) : () => 0);
  const caf =
    hooks.caf ?? (typeof cancelAnimationFrame !== "undefined" ? cancelAnimationFrame.bind(globalThis) : () => {});

  const g = getContext(canvas);
  let drawCount = 0;
  let t = 0;
  let playing = false;
  let rafHandle = 0;
  let lastNow = 0;
  let visible = true;
  let destroyed = false;

  const cssSize = () => {
    const w = canvas.clientWidth || el.clientWidth || 640;
    const h = canvas.clientHeight || 300;
    return { w, h };
  };

  const drawOnce = () => {
    if (!g || destroyed) return;
    const { w, h } = cssSize();
    const dpr = (typeof devicePixelRatio === "number" ? devicePixelRatio : 1) || 1;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    const frame: DemoFrame = { g, width: w, height: h, params, t };
    def.draw(frame);
    drawCount++;
  };

  let queued = false;
  const requestDraw = () => {
    if (queued || playing) return;
    queued = true;
    raf(() => {
      queued = false;
      drawOnce();
    });
  };

  // ---- コントロール生成 ----
  for (const c of def.controls) {
    controlsEl.appendChild(buildControl(c, params, requestDraw));
  }

  // ---- アニメーション ----
  const tick = (now: number) => {
    if (!playing || destroyed) return;
    // バックグラウンドタブで rAF が絞られても時間がワープしないよう clamp
    const dt = Math.min(Math.max((now - lastNow) / 1000, 0), 0.1);
    lastNow = now;
    t += dt;
    drawOnce();
    rafHandle = raf(tick);
  };

  const setPlaying = (on: boolean) => {
    if (playing === on) return;
    playing = on;
    if (playBtn) playBtn.textContent = on ? "❚❚ 停止" : "▶ 再生";
    if (on) {
      lastNow = typeof performance !== "undefined" ? performance.now() : 0;
      rafHandle = raf(tick);
    } else {
      caf(rafHandle);
      requestDraw();
    }
  };

  let playBtn: HTMLButtonElement | null = null;
  if (def.animated) {
    const wrap = doc(el).createElement("div");
    wrap.className = "demo-control";
    playBtn = doc(el).createElement("button");
    playBtn.type = "button";
    playBtn.textContent = "▶ 再生";
    playBtn.addEventListener("click", () => setPlaying(!playing));
    wrap.appendChild(playBtn);
    controlsEl.insertBefore(wrap, controlsEl.firstChild);
  }

  // ---- ポインタ操作（ドラッグ） ----
  if (def.onPointer) {
    const handler = (type: "down" | "move" | "up") => (ev: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const { w, h } = cssSize();
      if (def.onPointer!({ type, x, y }, { width: w, height: h }, params)) {
        if (type === "down") canvas.setPointerCapture?.(ev.pointerId);
        ev.preventDefault();
        requestDraw();
      }
    };
    canvas.addEventListener("pointerdown", handler("down"));
    canvas.addEventListener("pointermove", handler("move"));
    canvas.addEventListener("pointerup", handler("up"));
    canvas.addEventListener("pointercancel", handler("up"));
  }

  // ---- 可視性・リサイズ ----
  const onVisibility = () => {
    if (typeof document !== "undefined" && document.hidden) {
      wasPlayingBeforeHidden = playing;
      setPlaying(false);
    } else if (wasPlayingBeforeHidden) {
      wasPlayingBeforeHidden = false;
      setPlaying(true);
    }
  };
  let wasPlayingBeforeHidden = false;
  if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVisibility);

  let io: IntersectionObserver | null = null;
  if (typeof IntersectionObserver !== "undefined") {
    io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        visible = e.isIntersecting;
        if (!visible && playing) {
          wasPlayingBeforeHidden = true;
          setPlaying(false);
        } else if (visible && wasPlayingBeforeHidden) {
          wasPlayingBeforeHidden = false;
          setPlaying(true);
        }
      }
    });
    io.observe(el);
  }

  let ro: ResizeObserver | null = null;
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(() => requestDraw());
    ro.observe(canvas);
  }

  drawOnce();

  return {
    def,
    params,
    redraw: drawOnce,
    drawCount: () => drawCount,
    playing: () => playing,
    setPlaying,
    destroy: () => {
      destroyed = true;
      setPlaying(false);
      io?.disconnect();
      ro?.disconnect();
      if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}

function doc(el: HTMLElement): Document {
  return el.ownerDocument;
}

function buildControl(c: ControlDef, params: Record<string, number>, onChange: () => void): HTMLElement {
  const d = typeof document !== "undefined" ? document : null;
  if (!d) throw new Error("buildControl requires a DOM");
  const wrap = d.createElement("div");
  wrap.className = "demo-control";

  const label = d.createElement("label");
  label.textContent = c.label;
  const inputId = `demo-${c.id}-${Math.floor(Math.random() * 1e9)}`;
  label.htmlFor = inputId;
  wrap.appendChild(label);

  const fmt = c.format ?? ((v: number) => String(v));

  if (c.kind === "slider") {
    const input = d.createElement("input");
    input.type = "range";
    input.id = inputId;
    input.min = String(c.min ?? 0);
    input.max = String(c.max ?? 100);
    input.step = String(c.step ?? 1);
    input.value = String(c.value);
    const out = d.createElement("output");
    out.textContent = fmt(c.value);
    input.addEventListener("input", () => {
      params[c.id] = Number(input.value);
      out.textContent = fmt(params[c.id]);
      onChange();
    });
    wrap.appendChild(input);
    wrap.appendChild(out);
  } else if (c.kind === "select") {
    const select = d.createElement("select");
    select.id = inputId;
    for (const o of c.options ?? []) {
      const opt = d.createElement("option");
      opt.value = String(o.value);
      opt.textContent = o.label;
      if (o.value === c.value) opt.selected = true;
      select.appendChild(opt);
    }
    select.addEventListener("input", () => {
      params[c.id] = Number(select.value);
      onChange();
    });
    wrap.appendChild(select);
  } else {
    const input = d.createElement("input");
    input.type = "checkbox";
    input.id = inputId;
    input.checked = c.value !== 0;
    input.addEventListener("input", () => {
      params[c.id] = input.checked ? 1 : 0;
      onChange();
    });
    wrap.appendChild(input);
  }
  return wrap;
}
