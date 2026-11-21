#!/usr/bin/env node
// seo-check.mjs — ビルド結果 (静的 HTML) が検索エンジン・AI クローラーに正しく読める形になっているかを調べる。
// 依存なし (Node 20+)。原本は basecamp/scripts/seo-check.mjs。掲載アプリへはこのファイルをそのままコピーする。
//
//   node scripts/seo-check.mjs <出力ディレクトリ> <公開URL(末尾/)> [オプション]
//   例: node scripts/seo-check.mjs dist https://satory074.github.io/hyakuichi/ --require-backlink
//
// オプション
//   --jsonld-optional   JSON-LD の無いページを許す (あれば中身は調べる)。basecamp 用
//   --require-backlink  satory074.com へ戻るバー (class="app-backlink-bar") を全ページに求める。掲載アプリ用
//   --ignore=a/,b.html  調べないパス (出力ディレクトリからの相対パスの前方一致、カンマ区切り)
//
// 調べること (破ったら exit 1)。テストの件数ではなく、壊れたら困る不変条件だけを置く:
//   1. 各ページに <title> が 1 つあり、検索に出すページどうしでタイトル・説明文が重複しない
//   2. canonical はそのページ自身の絶対 URL (ディレクトリなら末尾 /) で、og:url と同じ。og:image もある
//   3. noindex でないページ = サイトマップに載っているページ。サイトマップの <loc> は全部実在する
//   4. JSON-LD は parse でき、作者として https://satory074.com/#person を指している
//   5. 同じサイト内へのリンク (<a href>) が実在するファイルに解決する (末尾 / 漏れ = 301 も捕まえる)
// 本文の文字数は警告だけ (閾値で落とすと正当な短いページで誤検知するため)。

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const PERSON_ID = "https://satory074.com/#person";
const SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9";
const MIN_TEXT_CHARS = 200;

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith("--"));
const flags = new Set(args.filter((a) => a.startsWith("--") && !a.includes("=")));
const ignoreArg = args.find((a) => a.startsWith("--ignore="));
const ignores = ignoreArg ? ignoreArg.slice("--ignore=".length).split(",").filter(Boolean) : [];

if (positional.length !== 2) {
    console.error("使い方: node scripts/seo-check.mjs <出力ディレクトリ> <公開URL(末尾/)> [--jsonld-optional] [--require-backlink] [--ignore=...]");
    process.exit(2);
}
const [outDir, baseUrlArg] = positional;
if (!baseUrlArg.endsWith("/")) {
    console.error(`公開URLは末尾を / にしてください: ${baseUrlArg}`);
    process.exit(2);
}
const baseUrl = new URL(baseUrlArg);
const jsonldOptional = flags.has("--jsonld-optional");
const requireBacklink = flags.has("--require-backlink");

const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

// ---------- HTML の読み取り (正規表現で足りる範囲だけ) ----------

function walk(dir) {
    const out = [];
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) out.push(...walk(p));
        else if (name.endsWith(".html")) out.push(p);
    }
    return out;
}

function attr(tag, name) {
    const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
    return m ? decode(m[2] ?? m[3] ?? m[4] ?? "") : null;
}

function decode(s) {
    return s
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#x27;|&#39;/g, "'");
}

function metaContent(html, key, value) {
    for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
        if ((attr(tag, key) ?? "").toLowerCase() === value) return attr(tag, "content");
    }
    return null;
}

function linkHref(html, rel) {
    for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
        const rels = (attr(tag, "rel") ?? "").toLowerCase().split(/\s+/);
        if (rels.includes(rel)) return attr(tag, "href");
    }
    return null;
}

function headOf(html) {
    const end = html.search(/<\/head>/i);
    return end === -1 ? html : html.slice(0, end);
}

function visibleText(html) {
    return decode(
        html
            .replace(/<head\b[\s\S]*?<\/head>/gi, " ")
            .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, " ")
            .replace(/<[^>]+>/g, " "),
    )
        .replace(/\s+/g, "")
        .trim();
}

/** 出力ディレクトリ内のファイル → 公開 URL */
function urlOf(file) {
    const rel = relative(outDir, file).split(sep).join("/");
    if (rel === "index.html") return baseUrl.href;
    if (rel.endsWith("/index.html")) return new URL(rel.slice(0, -"index.html".length), baseUrl).href;
    return new URL(rel, baseUrl).href;
}

/** 公開 URL → 出力ディレクトリ内のファイル (無ければ null)。末尾 / 漏れは "redirect" */
function fileOf(url) {
    const u = new URL(url);
    if (u.origin !== baseUrl.origin || !u.pathname.startsWith(baseUrl.pathname)) return null;
    const rel = decodeURIComponent(u.pathname.slice(baseUrl.pathname.length));
    const p = join(outDir, rel);
    if (rel === "" || rel.endsWith("/")) return existsSync(join(p, "index.html")) ? join(p, "index.html") : null;
    if (existsSync(p) && statSync(p).isFile()) return p;
    if (existsSync(join(p, "index.html"))) return "redirect";
    return null;
}

function findPersonRef(node) {
    if (Array.isArray(node)) return node.some(findPersonRef);
    if (node && typeof node === "object") {
        if (node["@id"] === PERSON_ID) return true;
        return Object.values(node).some(findPersonRef);
    }
    return false;
}

// ---------- ページを読む ----------

const isIgnored = (rel) =>
    rel === "404.html" ||
    rel.startsWith("404/") ||
    /^google[0-9a-f]+\.html$/.test(rel) ||
    ignores.some((p) => rel.startsWith(p));

const pages = [];
for (const file of walk(outDir)) {
    const rel = relative(outDir, file).split(sep).join("/");
    if (isIgnored(rel)) continue;
    const html = readFileSync(file, "utf8");
    const robots = (metaContent(html, "name", "robots") ?? "").toLowerCase();
    pages.push({
        rel,
        url: urlOf(file),
        html,
        // <head> の中だけを見る (本文の SVG にある <title> は図の説明で、ページのタイトルではない)
        titles: [...headOf(html).matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)].map((m) => decode(m[1]).trim()),
        description: metaContent(html, "name", "description"),
        canonical: linkHref(html, "canonical"),
        ogUrl: metaContent(html, "property", "og:url"),
        ogImage: metaContent(html, "property", "og:image"),
        noindex: robots.includes("noindex"),
    });
}

if (pages.length === 0) {
    console.error(`${outDir} に HTML がありません`);
    process.exit(1);
}

// ---------- 1〜2, 4. ページごとの検査 ----------

const seenTitle = new Map();
const seenDesc = new Map();

for (const p of pages) {
    if (p.titles.length !== 1 || !p.titles[0]) err(p.rel, `<title> がちょうど 1 つではない (${p.titles.length} 個)`);
    if (requireBacklink && !/class\s*=\s*["'][^"']*\bapp-backlink-bar\b/.test(p.html)) {
        err(p.rel, "satory074.com へ戻るバー (app-backlink-bar) が静的 HTML に無い");
    }

    // JSON-LD はどのページでも parse できること
    const blocks = [...p.html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    let hasPerson = false;
    for (const b of blocks) {
        try {
            if (findPersonRef(JSON.parse(b[1]))) hasPerson = true;
        } catch (e) {
            err(p.rel, `JSON-LD が parse できない: ${e.message}`);
        }
    }

    if (p.noindex) continue; // 以下は検索に出すページだけ

    if (blocks.length === 0) {
        if (!jsonldOptional) err(p.rel, "JSON-LD が無い");
    } else if (!hasPerson) {
        err(p.rel, `JSON-LD が作者 ${PERSON_ID} を指していない`);
    }

    if (!p.description) err(p.rel, "meta description が無い");
    if (!p.canonical) err(p.rel, "canonical が無い");
    else if (p.canonical !== p.url) err(p.rel, `canonical がこのページの URL と違う: ${p.canonical} (期待: ${p.url})`);
    if (!p.ogUrl) err(p.rel, "og:url が無い");
    else if (p.ogUrl !== p.canonical) err(p.rel, `og:url (${p.ogUrl}) が canonical と違う`);
    if (!p.ogImage || !/^https:\/\//.test(p.ogImage)) err(p.rel, `og:image が無いか絶対 URL でない: ${p.ogImage}`);

    const title = p.titles[0];
    if (title) {
        if (seenTitle.has(title)) err(p.rel, `タイトルが ${seenTitle.get(title)} と重複: 「${title}」`);
        else seenTitle.set(title, p.rel);
    }
    if (p.description) {
        if (seenDesc.has(p.description)) err(p.rel, `説明文が ${seenDesc.get(p.description)} と重複`);
        else seenDesc.set(p.description, p.rel);
    }

    const chars = [...visibleText(p.html)].length;
    if (chars < MIN_TEXT_CHARS) warn(p.rel, `JS なしで読める本文が ${chars} 文字しかない`);
}

// ---------- 3. サイトマップ ----------

function readSitemapUrls() {
    const candidates = ["sitemap-index.xml", "sitemap.xml"].map((n) => join(outDir, n)).filter(existsSync);
    if (candidates.length === 0) {
        err("(sitemap)", "sitemap-index.xml も sitemap.xml も無い");
        return null;
    }
    const urls = new Set();
    const visit = (file) => {
        const xml = readFileSync(file, "utf8");
        const label = relative(outDir, file);
        if (!xml.includes(SITEMAP_NS)) err(label, `名前空間が ${SITEMAP_NS} ではない`);
        const locs = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => decode(m[1]));
        if (/<sitemapindex\b/.test(xml)) {
            for (const loc of locs) {
                const child = fileOf(loc);
                if (!child || child === "redirect") err(label, `子サイトマップが見つからない: ${loc}`);
                else visit(child);
            }
        } else {
            for (const loc of locs) {
                if (urls.has(loc)) err(label, `同じ URL が 2 回ある: ${loc}`);
                urls.add(loc);
            }
        }
    };
    visit(candidates[0]);
    return urls;
}

const sitemapUrls = readSitemapUrls();
if (sitemapUrls) {
    const byUrl = new Map(pages.map((p) => [p.url, p]));
    for (const loc of sitemapUrls) {
        const page = byUrl.get(loc);
        if (!page) {
            const f = fileOf(loc);
            err("(sitemap)", f === "redirect" ? `末尾 / が無い URL: ${loc}` : `実在しない URL: ${loc}`);
        } else if (page.noindex) {
            err("(sitemap)", `noindex のページが載っている: ${loc}`);
        }
    }
    for (const p of pages) {
        if (!p.noindex && !sitemapUrls.has(p.url)) err(p.rel, `検索に出すページなのにサイトマップに無い: ${p.url}`);
    }
}

// ---------- 5. サイト内リンク ----------

const brokenLinks = new Map();
for (const p of pages) {
    for (const m of p.html.matchAll(/<a\b[^>]*>/gi)) {
        const href = attr(m[0], "href");
        if (!href || href.startsWith("#") || /^(mailto|tel|javascript|data):/i.test(href)) continue;
        let u;
        try {
            u = new URL(href, p.url);
        } catch {
            continue;
        }
        if (u.origin !== baseUrl.origin || !u.pathname.startsWith(baseUrl.pathname)) continue;
        const f = fileOf(u.origin + u.pathname);
        if (f === null || f === "redirect") {
            const key = `${p.rel}: ${f === "redirect" ? "末尾 / が無いリンク (301 になる)" : "リンク先が無い"}: ${href}`;
            brokenLinks.set(key, true);
        }
    }
}
for (const key of brokenLinks.keys()) errors.push(key);

// ---------- 報告 ----------

const indexable = pages.filter((p) => !p.noindex).length;
console.log(`seo-check: ${pages.length} ページ (検索に出す ${indexable} / noindex ${pages.length - indexable})、基準 URL ${baseUrl.href}`);
for (const w of warnings) console.log(`  注意 ${w}`);
if (errors.length > 0) {
    for (const e of errors) console.error(`  NG ${e}`);
    console.error(`seo-check: ${errors.length} 件の問題`);
    process.exit(1);
}
console.log("seo-check: 問題なし");
