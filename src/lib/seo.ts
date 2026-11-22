// 検索エンジン向けの共通部品（canonical の URL と構造化データ JSON-LD）。
// 画面に出ていない内容はここに書かない（評価・FAQ などを作って入れない）。

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

export const SITE_NAME = "やる夫で学ぶディジタル信号処理";

/** トップページの絶対 URL（末尾 /）。例: https://satory074.github.io/yaruo-dsp/ */
export const HOME_URL = new URL(`${base}/`, import.meta.env.SITE).href;

/** トップの WebSite を指す @id。章ページの isPartOf から参照する */
export const WEBSITE_ID = `${HOME_URL}#website`;

/** 作者。この @id は satory074.com 側で Person として定義している */
export const AUTHOR = {
  "@type": "Person",
  "@id": "https://satory074.com/#person",
  name: "satory074",
  url: "https://satory074.com/",
} as const;

/** ページのパス → 絶対 URL。ディレクトリ形式で出力しているので末尾は必ず / にそろえる */
export function absoluteUrl(pathname: string): string {
  return new URL(pathname.endsWith("/") ? pathname : `${pathname}/`, import.meta.env.SITE).href;
}

/** `<script type="application/ld+json">` に埋める文字列。本文に `</script>` があっても閉じないよう < を逃がす */
export function jsonLdString(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
