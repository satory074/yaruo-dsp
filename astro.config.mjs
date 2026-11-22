// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// GitHub Pages のプロジェクトページ運用前提。
// カスタムドメインにする場合は base を空文字に変更すること。
const repoName = "yaruo-dsp";
const ghUser = process.env.GH_USER ?? "satory074";

export default defineConfig({
  site: `https://${ghUser}.github.io`,
  base: `/${repoName}`,
  trailingSlash: "ignore",
  // sitemap: dist/sitemap-index.xml + sitemap-0.xml。404 ページは自動で除外される
  integrations: [mdx(), sitemap()],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [[rehypeKatex, { strict: false }]],
  },
  vite: {
    // Tailwind v4 Vite plugin: cast to any to bridge Vite version typing mismatch
    plugins: [/** @type {any} */ (tailwindcss())],
  },
});
