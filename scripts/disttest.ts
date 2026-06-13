// ビルド成果物 dist/ の検査。npm run build の後に実行する。
// 実行: npx tsx scripts/disttest.ts
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

let failures = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    console.error(`❌ FAILED: ${msg}`);
    failures++;
  }
}

const root = join(import.meta.dirname, "..");
const dist = join(root, "dist");
const chaptersDir = join(root, "src/content/chapters");

assert(existsSync(dist), "dist/ が存在する（npm run build を先に実行）");
if (!existsSync(dist)) process.exit(1);

const chapterFiles = readdirSync(chaptersDir).filter((f) => f.endsWith(".mdx"));

// ---- 章ページ ----
for (const file of chapterFiles) {
  const slug = file.replace(/\.mdx$/, "");
  const htmlPath = join(dist, slug, "index.html");
  assert(existsSync(htmlPath), `${slug}/index.html が存在`);
  if (!existsSync(htmlPath)) continue;

  const html = readFileSync(htmlPath, "utf-8");
  const src = readFileSync(join(chaptersDir, file), "utf-8");

  // frontmatter の demos と data-demo の個数一致
  const fmDemos = (src.match(/^demos:\s*\[(.*)\]\s*$/m)?.[1] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const dataDemoCount = (html.match(/data-demo="/g) ?? []).length;
  assert(
    dataDemoCount === fmDemos.length,
    `${slug}: data-demo 個数 ${dataDemoCount} != frontmatter demos ${fmDemos.length}`,
  );

  // 数式がある章は KaTeX がレンダリングされている
  if (/\$\$|\\omega|\\sum|\\int/.test(src)) {
    assert(html.includes('class="katex'), `${slug}: KaTeX 出力がある`);
  }
  // 生の $...$ が残っていない（KaTeX 処理漏れの検出、雑だが効く）
  assert(!/\$\$/.test(html.replace(/<script[\s\S]*?<\/script>/g, "")), `${slug}: 未処理の $$ が残っていない`);

  // 対話が含まれる
  assert(html.includes("speech-bubble"), `${slug}: 吹き出しがある`);

  // base パス
  assert(html.includes('href="/yaruo-dsp/'), `${slug}: base パス付きリンク`);
}
console.log(`[dist] 章ページ OK (${chapterFiles.length} chapters)`);

// ---- index ----
{
  const html = readFileSync(join(dist, "index.html"), "utf-8");
  const cardCount = (html.match(/class="chapter-card"/g) ?? []).length;
  assert(cardCount === chapterFiles.length, `index: 章カード ${cardCount} == 章数 ${chapterFiles.length}`);
  assert(html.includes("ic.is.tohoku.ac.jp/~swk/lecture/yaruodsp"), "index: 元サイトへのクレジットリンク");
  console.log("[dist] index OK");
}

// ---- KaTeX フォント ----
{
  const astroDir = join(dist, "_astro");
  const hasWoff2 = existsSync(astroDir) && readdirSync(astroDir).some((f) => f.endsWith(".woff2"));
  assert(hasWoff2, "KaTeX フォント (woff2) が dist 内にある");
  console.log("[dist] KaTeX フォント OK");
}

if (failures > 0) {
  console.error(`\n${failures} 件の失敗`);
  process.exit(1);
}
console.log("\ndisttest: all OK");
