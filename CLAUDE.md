# CLAUDE.md — yaruo-dsp

「やる夫で学ぶディジタル信号処理」— 鏡慎吾先生（東北大）の同名教材の**章構成だけを参考**に、本文・図・デモをすべて新規執筆した非公式教材サイト。Astro 5 + Tailwind v4 + MDX + KaTeX、GitHub Pages（https://satory074.github.io/yaruo-dsp/）。

```bash
npm run dev        # http://localhost:4321/yaruo-dsp/
npm run build      # dist/ 生成（型エラーもここで検出）
npm run typecheck  # astro check
npm test           # smoketest（dsp数値+manifest整合）+ domtest（jsdom配線）
npm run test:dist  # build 後の dist/ HTML 検査
```

## 著作権の原則（必須）

元サイトの本文・AA・図の**転載は一切しない**。章構成・教える順序のみ参考。キャラクターは `Avatar.astro` のオリジナル簡易SVG＝本家の「顔の象徴」だけを自前ベクターで再構成（やる夫=丸顔＋山型の目＋ωの口 ^ω^／やらない夫=角顔＋黒スーツ＋ジト目＋への字。**AAは転載しない**）。クレジットはフッタ（Layout.astro）に常設。2023年に一時消えた本家が復活したため、出典リンクは魚拓ではなくライブURL（`www.ic.is.tohoku.ac.jp/~swk/lecture/yaruodsp/main.html`）を指す（`disttest.ts` が文字列 `ic.is.tohoku.ac.jp` を検査）。

## アーキテクチャ

- `src/content/chapters/*.mdx` — 全19章。`order` でソート（0=前置き、1〜16=本編、90/91=付録）
- `src/pages/[slug].astro` — `<Content components={{ Y, N, Demo, Note, KeyPoint }} />` で注入するため**章MDXにimport文は書かない**。`sidebar`/`crumb` を `Layout` に渡す
- `src/components/Layout.astro` + `src/components/Sidebar.astro` — 章ページは `.page-shell`（grid: 260px サイド目次 + 本文）。`sidebar` prop 真のときだけ `Sidebar`＋ヘッダのハンバーガー＋暗幕を出す（indexは目次そのものなので非表示）。サイド目次の**現在章の節リンクとスクロール追従はLayoutのインラインscriptがクライアントで生成**（MDXがh2/h3にidを自動付与するのを利用、rehype-slug不要）。ヘッダは sticky、モバイル≤960pxはドロワー化（`body.toc-open`）
- `src/lib/dsp.ts` — 数値計算（DOM非依存・純TS）。FFT/窓/たたみこみ/freqz/部分和
- `src/demos/` — `manifest.ts`（純データ台帳）+ `index.ts`（遅延ローダ）+ `chNN/*.ts`（DemoDef）+ `runtime.ts`（マウント/rAF/コントロール生成）+ `plot.ts`（オシロ風描画ヘルパ）
- デザイン: 「和紙の教科書×計測器」。地は紙色、デモパネルだけダーク+蛍光トレース。`globals.css` にトークン集約

## MDX 執筆規約（破るとビルドが落ちる/テストが落ちる）

1. `<Y>`/`<N>`/`<Note>`/`<KeyPoint>` タグと本文の間に**空行必須**（MDXがchildrenをmarkdown解釈する条件）
2. **閉じタグの対応に注意**。`<Note>` を `</N>` で閉じる事故が実際に起きた
3. 数式: インライン `$...$`、ブロックは空行で囲んだ `$$...$$`。式番号は `\tag{1.1}`
4. frontmatter `demos: ["id1", "id2"]` は本文の `<Demo id=...>` と**完全一致**（smoketestが検証）
5. 各章末に `<KeyPoint>`（箇条書きでまとめ）
6. 吹き出しの mood: `normal/smile/surprised/cry/angry/smug/think`（例: `<Y mood="cry">`）
7. 口調: やる夫=「〜だお」、知ってる単語には食いつく、計算はたまに自力で正解する。やらない夫=「〜だろ」「常識的に考えて」、容赦なく数式を出すが直観的な説明を必ず添える

## デモ追加手順（3点セット、欠けると smoketest が落ちる）

1. `src/demos/chNN/<demo-id>.ts` — `DemoDef` を default export。`id` はファイル名と一致
2. `src/demos/manifest.ts` — `demoMeta` にエントリ追加（title は英大文字のパネル銘板風、chapter 番号、height 省略時300）
3. `src/demos/index.ts` — `demoLoaders` に遅延 import 追加
4. 章MDXの frontmatter `demos` と本文 `<Demo id="..." caption="操作→気づきを1文で" />`

DemoDef の規約:
- 描画は `draw(f)` で毎回全描画（`f.params` が現在値）。`plot.ts` の `makeViewport/axes/plotFn/plotLine/plotStem` を使い見た目を統一
- 色は `COLORS`（green=主信号, amber=強調値, cyan/pink=副系列, textDim=参考線）
- アニメは `animated: true` + `f.t`（秒）。再生ボタンは runtime が自動付与
- 再生ボタン＋手動スライダーを両立させたい時は `f.playing` で分岐（再生中は `f.t` から掃引パラメータを算出、停止中は `f.params` のスライダー値を使う）。例: `const n = f.playing ? Math.floor(f.t / 0.6) % 12 : f.params.n;`
- 各 `<Demo caption>` は「操作→観察→意味」の順で1〜2文（初学者は静止＋観察プロンプトが最も学習効率が高いという研究に基づく）
- ドラッグは `onPointer`（true を返すと再描画）
- **jsdom に canvas は無い**。draw 内で DOM API を直接触らない（ctx 経由のみ）

## Gotcha

- **Astro は 5 系固定**（latest は 6）。`astro@^5.18.2` `@astrojs/mdx@^4.3.14`。素の `npm install astro` 禁止
- 強制ダークモード（Dark Reader 等）対策で `color-scheme: only light` + `<meta name="darkreader-lock">` 済み。地の色は紙色が正
- KaTeX CSS は Layout.astro で import（フォントは Vite が dist へ自動コピー、CDN不使用）
- スライダーの `step: 2` で奇数刻みにする場合 `min` も奇数に
- CI: push で test → build → test:dist → Pages デプロイ（.github/workflows/deploy.yml）
