// 轻量级 RSS / Atom 解析器，零依赖，可在 Cloudflare Workers 运行时直接使用。
// 用正则提取条目，足以应对绝大多数规范的 RSS 2.0 与 Atom 1.0 源。

export interface FeedItem {
  title: string;
  link: string;
  summary: string;
  publishedAt: number | null; // unix ms
}

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function stripHtml(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function pick(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decodeEntities(m[1]).trim() : "";
}

function parseDate(s: string): number | null {
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : t;
}

// 从一个 <item>/<entry> 块中提取链接（RSS 的 <link>text</link> 或 Atom 的 <link href="..."/>）
function pickLink(block: string): string {
  const text = pick(block, "link");
  if (text && /^https?:/i.test(text)) return text;
  const href = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  if (href) return href[1];
  const guid = pick(block, "guid");
  if (guid && /^https?:/i.test(guid)) return guid;
  return "";
}

export function parseFeed(xml: string): FeedItem[] {
  if (!xml) return [];
  const items: FeedItem[] = [];

  // RSS: <item>...</item>  |  Atom: <entry>...</entry>
  const blockRe = /<(item|entry)\b[\s\S]*?<\/\1>/gi;
  const blocks = xml.match(blockRe) || [];

  for (const block of blocks) {
    const title = stripHtml(pick(block, "title"));
    const link = pickLink(block);
    if (!title || !link) continue;

    const rawSummary =
      pick(block, "description") ||
      pick(block, "summary") ||
      pick(block, "content:encoded") ||
      pick(block, "content");
    const summary = stripHtml(rawSummary).slice(0, 500);

    const publishedAt =
      parseDate(pick(block, "pubDate")) ??
      parseDate(pick(block, "published")) ??
      parseDate(pick(block, "updated")) ??
      parseDate(pick(block, "dc:date"));

    items.push({ title, link, summary, publishedAt });
  }

  return items;
}
