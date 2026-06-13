# やる夫で学ぶディジタル信号処理（yaruo-dsp）

フーリエ級数からディジタルフィルタの設計まで、**やる夫とやらない夫の対話**と
**29個のインタラクティブなデモ**で学ぶディジタル信号処理の入門教材です。

🔗 **https://satory074.github.io/yaruo-dsp/**

数式を恐れる生徒（やる夫）と、容赦なく数式を出すが直観的な説明を必ず添える先生（やらない夫）の
やりとりに、スライダーで動かせる計測器風のデモを添えて、「式が何をしているのか」を
目で確かめながら進みます。全16章＋付録2章。

## このサイトについて（クレジット・著作権）

本サイトは、**鏡 慎吾先生（東北大学）**が公開されていた教材
[やる夫で学ぶディジタル信号処理](https://web.archive.org/web/20230307055724/http://www.ic.is.tohoku.ac.jp/~swk/lecture/yaruodsp/main.html)
の**章構成（教える順序）のみを参考**にして、**本文・図・デモをすべて新規に書き起こした
独立の非公式教材**です。

- 原作教材の本文・アスキーアート・図版は一切含みません
- キャラクターは本サイトオリジナルの簡易ベクター画像（`src/components/dialog/Avatar.astro`）です
- 本サイトは鏡先生および東北大学とは無関係の非公式なファン教材です

DSP をしっかり学びたい方には、ぜひ原作教材もあわせてご覧になることをおすすめします。

## 技術スタック

Astro 5 + Tailwind v4 + MDX + KaTeX、GitHub Pages（GitHub Actions で自動デプロイ）。

```bash
npm install
npm run dev        # http://localhost:4321/yaruo-dsp/
npm run build      # dist/ 生成
npm run typecheck  # astro check
npm test           # 数値計算テスト + デモ配線テスト
npm run test:dist  # build 後の dist/ HTML 検査
```

## 構成

- `src/content/chapters/*.mdx` — 全19章（0=前置き、1〜16=本編、90/91=付録）
- `src/components/dialog/` — 対話UI（吹き出し・オリジナルアバター）
- `src/lib/dsp.ts` / `src/lib/dsp-design.ts` — DOM非依存の数値計算ライブラリ
- `src/demos/` — Canvas インタラクティブデモ（計29個）

開発の詳細は [`CLAUDE.md`](./CLAUDE.md) を参照してください。

## ライセンス

コード（`src/`, `scripts/` 等）は MIT ライセンスとします。
教材本文・デモの内容は本サイトのオリジナル制作物です。
