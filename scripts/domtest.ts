// デモランタイムの DOM レベルスモークテスト（jsdom）。
// - mountDemo のコントロール配線（スライダー生成 → input → 再描画）
// - 全実デモが fake 2D context で 1 フレーム例外なく描画できること
// - animated デモの再生/停止
// - onPointer（ドラッグ系）の配線
// 実行: npx tsx scripts/domtest.ts
import { JSDOM } from "jsdom";
import type { DemoDef } from "../src/demos/types";

let failures = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    console.error(`❌ FAILED: ${msg}`);
    failures++;
  }
}

const dom = new JSDOM(`<!DOCTYPE html><body></body>`, {
  url: "https://example.com/yaruo-dsp/",
  pretendToBeVisual: true,
});
const g = globalThis as unknown as Record<string, unknown>;
g.window = dom.window;
g.document = dom.window.document;
g.HTMLElement = dom.window.HTMLElement;
g.HTMLCanvasElement = dom.window.HTMLCanvasElement;
g.devicePixelRatio = 1;

// rAF: 同期実行のスタブ（呼び出し回数を記録）
let rafCalls = 0;
const raf = (cb: FrameRequestCallback): number => {
  rafCalls++;
  cb(rafCalls * 16);
  return rafCalls;
};
const rafOnce = (cb: FrameRequestCallback): number => {
  // アニメループ用: 再帰爆発しないよう1回だけ実行
  rafCalls++;
  if (rafCalls < 5) cb(rafCalls * 16);
  return rafCalls;
};

// fake 2D context: 全メソッド no-op、全プロパティ書き込み可の Proxy
function fakeContext(): CanvasRenderingContext2D {
  const target: Record<string | symbol, unknown> = {};
  return new Proxy(target, {
    get(t, prop) {
      if (prop === "canvas") return null;
      if (!(prop in t)) t[prop] = (() => undefined) as unknown;
      return t[prop];
    },
    set(t, prop, value) {
      t[prop] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

function makeDemoElement(id: string): HTMLElement {
  const el = dom.window.document.createElement("div");
  el.className = "demo";
  el.setAttribute("data-demo", id);
  el.innerHTML = `<canvas></canvas><div class="demo-controls"></div>`;
  dom.window.document.body.appendChild(el);
  return el as unknown as HTMLElement;
}

const { mountDemo } = await import("../src/demos/runtime");
const { demoLoaders } = await import("../src/demos/index");
const { demoMeta } = await import("../src/demos/manifest");

// ---- 1) コントロール配線（スタブデモ） ----
{
  rafCalls = 0;
  let drawn = 0;
  let lastParams: Record<string, number> = {};
  const stub: DemoDef = {
    id: "stub",
    controls: [
      { kind: "slider", id: "n", label: "N", min: 1, max: 10, step: 1, value: 3, format: (v) => `N=${v}` },
      { kind: "select", id: "mode", label: "mode", value: 0, options: [{ value: 0, label: "a" }, { value: 1, label: "b" }] },
      { kind: "checkbox", id: "show", label: "show", value: 1 },
    ],
    draw(f) {
      drawn++;
      lastParams = { ...f.params };
    },
  };
  const el = makeDemoElement("stub");
  const handle = mountDemo(el, stub, { getContext: () => fakeContext(), raf, caf: () => {} });

  assert(drawn === 1, `初回描画が走る (drawn=${drawn})`);
  assert(lastParams.n === 3 && lastParams.mode === 0 && lastParams.show === 1, "初期パラメータ");

  const slider = el.querySelector<HTMLInputElement>('input[type="range"]');
  const output = el.querySelector("output");
  assert(!!slider, "スライダーが生成される");
  assert(output?.textContent === "N=3", `format 表示 (got ${output?.textContent})`);

  slider!.value = "7";
  slider!.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  assert(drawn === 2, `input で再描画 (drawn=${drawn})`);
  assert(lastParams.n === 7, "params 更新");
  assert(output?.textContent === "N=7", "output 更新");

  const select = el.querySelector("select");
  select!.value = "1";
  select!.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  assert(lastParams.mode === 1, "select 更新");

  handle.destroy();
  console.log("[dom] コントロール配線 OK");
}

// ---- 2) animated デモの再生/停止 ----
{
  rafCalls = 0;
  let maxT = 0;
  const anim: DemoDef = {
    id: "anim-stub",
    controls: [],
    animated: true,
    draw(f) {
      maxT = Math.max(maxT, f.t);
    },
  };
  const el = makeDemoElement("anim-stub");
  const handle = mountDemo(el, anim, { getContext: () => fakeContext(), raf: rafOnce, caf: () => {} });

  const btn = el.querySelector("button");
  assert(!!btn, "再生ボタンが生成される");
  assert(btn!.textContent?.includes("再生") ?? false, "初期表示は再生");

  btn!.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  assert(handle.playing(), "クリックで再生開始");
  assert(maxT > 0, `t が進む (maxT=${maxT})`);

  handle.setPlaying(false);
  assert(!handle.playing(), "停止できる");
  handle.destroy();
  console.log("[dom] アニメーション OK");
}

// ---- 3) 全実デモ: fake context で 1 フレーム描画して例外が出ない ----
{
  const ids = Object.keys(demoLoaders);
  for (const id of ids) {
    const def = (await demoLoaders[id]()).default;
    assert(def.id === id, `${id}: DemoDef.id が一致 (got ${def.id})`);
    assert(id in demoMeta, `${id}: manifest に存在`);
    const el = makeDemoElement(id);
    // 同期rafスタブはアニメループで無限再帰するため、デモごとに回数上限を設ける
    let budget = 50;
    const boundedRaf = (cb: FrameRequestCallback): number => {
      if (budget-- <= 0) return 0;
      cb((50 - budget) * 16);
      return 50 - budget;
    };
    try {
      const handle = mountDemo(el, def, { getContext: () => fakeContext(), raf: boundedRaf, caf: () => {} });
      assert(handle.drawCount() >= 1, `${id}: 初回描画`);
      // 全スライダーを最小・最大に振って描画が例外を出さないこと
      const sliders = el.querySelectorAll<HTMLInputElement>('input[type="range"]');
      for (const s of sliders) {
        s.value = s.min;
        s.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
        s.value = s.max;
        s.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
      }
      // animated は数フレーム回す
      if (def.animated) {
        rafCalls = 0;
        handle.setPlaying(true);
        handle.setPlaying(false);
      }
      // onPointer があればドラッグを模擬
      if (def.onPointer) {
        def.onPointer({ type: "down", x: 100, y: 100 }, { width: 640, height: 300 }, handle.params);
        def.onPointer({ type: "move", x: 120, y: 110 }, { width: 640, height: 300 }, handle.params);
        def.onPointer({ type: "up", x: 120, y: 110 }, { width: 640, height: 300 }, handle.params);
        handle.redraw();
      }
      handle.destroy();
    } catch (e) {
      assert(false, `${id}: 例外 ${e}`);
    }
  }
  console.log(`[dom] 全デモ描画スモーク OK (${ids.length} demos)`);
}

if (failures > 0) {
  console.error(`\n${failures} 件の失敗`);
  process.exit(1);
}
console.log("\ndomtest: all OK");
