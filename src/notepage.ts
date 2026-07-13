// Single-note reading page (/note?id=xxx): full server-side render for SEO.
// Each note gets its own <title>, meta description, canonical, Open Graph tags,
// a NewsArticle JSON-LD block, and the article body rendered in HTML (crawlable
// without JS). Segment names come from taxonomy (no client fetch needed).

import type { VidNote } from "./vidnotes";
import { SEGMENTS } from "./taxonomy";

const SEG_EN: Record<string, string> = Object.fromEntries(SEGMENTS.map((s) => [s.key, s.en]));

function esc(s: string): string {
  return (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}
function escAttr(s: string): string {
  return esc(s).replace(/'/g, "&#39;");
}
// Plain-text, truncated description for <meta>/OG (~155 chars).
function metaDescription(n: VidNote): string {
  const src = (n.takeaways && n.takeaways.length ? n.takeaways.join(" ") : (n.summary || "").replace(/\n/g, " ")).trim();
  const t = src.replace(/\s+/g, " ").replace(/\*\*/g, "");
  return t.length > 155 ? t.slice(0, 152).trimEnd() + "…" : t;
}

const STYLE = /* css */ `
  :root { --bg:#0b0e14; --panel:#131826; --panel2:#1a2030; --line:#232a3d;
    --txt:#e6e9f0; --dim:#8a93a8; --acc:#4f8cff; --acc2:#36d399; --invest:#f5b301; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--txt);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif; }
  header { padding:18px 24px; border-bottom:1px solid var(--line); background:var(--panel);
    display:flex; align-items:center; gap:14px; }
  header .logo { width:34px; height:34px; border-radius:9px; background:linear-gradient(135deg,var(--acc),var(--acc2));
    color:#fff; font-weight:800; font-size:14px; display:flex; align-items:center; justify-content:center;
    text-decoration:none; cursor:pointer; }
  header .logo:hover { filter:brightness(1.12); }
  header h1 { font-size:16px; margin:0; }
  header a.back { margin-left:auto; color:var(--acc); text-decoration:none; font-size:13px; }
  .wrap { max-width:760px; margin:0 auto; padding:30px 20px 70px; }
  h1.title { font-size:24px; line-height:1.4; margin:0 0 14px; }
  .meta { color:var(--dim); font-size:13px; display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:18px; }
  .watch { display:inline-flex; align-items:center; gap:6px; background:var(--invest); color:#1a1a1a;
    font-weight:700; text-decoration:none; padding:9px 16px; border-radius:9px; font-size:13.5px; margin-bottom:22px; }
  .chips { display:flex; flex-wrap:wrap; gap:7px; margin-bottom:22px; }
  .chip { padding:3px 11px; border-radius:20px; font-size:12.5px; font-weight:600; color:#fff; background:var(--invest); }
  .seglink { padding:3px 11px; border-radius:20px; font-size:12.5px; background:var(--panel2);
    border:1px solid var(--line); color:var(--acc); text-decoration:none; }
  .seglink:hover { border-color:var(--acc); }
  h2.sec { font-size:16px; margin:26px 0 10px; }
  .pts { padding-left:0; list-style:none; }
  .pts li { background:var(--panel); border:1px solid var(--line); border-left:3px solid var(--invest);
    border-radius:0 10px 10px 0; padding:11px 15px; margin-bottom:9px; line-height:1.65; font-size:14px; }
  .full p { line-height:1.85; font-size:15px; margin:0 0 15px; color:#dfe3ec; }
  .src { color:var(--dim); font-size:12px; border-top:1px solid var(--line); padding-top:14px; margin-top:24px; }
  .notfound { color:var(--dim); padding:50px 0; text-align:center; }
`;

function shell(head: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
${head}
<style>${STYLE}</style>
</head>
<body>
<header>
  <a class="logo" href="/" title="Home" aria-label="Home">AI</a>
  <h1>🎬 Video Notes</h1>
  <a class="back" href="/?notes=1">← All notes</a>
</header>
<div class="wrap">
${body}
</div>
</body>
</html>`;
}

// Build the full HTML for /note?id=. `origin` is the https site origin (no trailing slash).
export function renderNotePage(note: VidNote | null, origin: string): string {
  if (!note) {
    const head =
      `<title>Note not found · AIChain</title>\n` +
      `<meta name="robots" content="noindex" />`;
    return shell(head, `<div class="notfound">This note could not be found. <a class="seglink" href="/?notes=1">Browse all notes →</a></div>`);
  }

  const canonical = `${origin}/note?id=${encodeURIComponent(note.id)}`;
  const desc = metaDescription(note);
  const title = `${note.title} · AIChain`;

  // JSON-LD NewsArticle (escape "<" so it can't break out of the script tag)
  const jsonld = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: note.title,
    description: desc,
    datePublished: note.date,
    dateModified: note.date,
    url: canonical,
    mainEntityOfPage: canonical,
    inLanguage: "en",
    author: { "@type": "Organization", name: note.channel },
    publisher: { "@type": "Organization", name: "AIChain" },
    isBasedOn: note.url || undefined,
    keywords: (note.tickers || []).concat((note.segs || []).map((s) => SEG_EN[s] || s)).join(", ") || undefined,
  }).replace(/</g, "\\u003c");

  const ogImage = `${origin}/og.png`;
  const breadcrumb = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
      { "@type": "ListItem", position: 2, name: "Video Notes", item: `${origin}/?notes=1` },
      { "@type": "ListItem", position: 3, name: note.title, item: canonical },
    ],
  }).replace(/</g, "\\u003c");

  const head =
    `<title>${esc(title)}</title>\n` +
    `<meta name="description" content="${escAttr(desc)}" />\n` +
    `<link rel="canonical" href="${escAttr(canonical)}" />\n` +
    `<meta property="og:type" content="article" />\n` +
    `<meta property="og:site_name" content="AIChain" />\n` +
    `<meta property="og:title" content="${escAttr(note.title)}" />\n` +
    `<meta property="og:description" content="${escAttr(desc)}" />\n` +
    `<meta property="og:url" content="${escAttr(canonical)}" />\n` +
    `<meta property="og:image" content="${escAttr(ogImage)}" />\n` +
    `<meta property="article:published_time" content="${escAttr(note.date)}" />\n` +
    `<meta name="twitter:card" content="summary_large_image" />\n` +
    `<meta name="twitter:image" content="${escAttr(ogImage)}" />\n` +
    `<script type="application/ld+json">${jsonld}</script>\n` +
    `<script type="application/ld+json">${breadcrumb}</script>`;

  const catLabel = note.category === "howto" ? "🛠️ AI How-To" : "💡 Market Views";
  const catBg = note.category === "howto" ? "#4f8cff" : "var(--invest)";
  const catFg = note.category === "howto" ? "#fff" : "#1a1a1a";
  const catChip = `<span class="chip" style="background:${catBg};color:${catFg}">${esc(catLabel)}</span>`;
  const tks = (note.tickers || []).map((t) => `<span class="chip">${esc(t)}</span>`).join("");
  const segs = (note.segs || []).map((s) => `<a class="seglink" href="/map">🔗 ${esc(SEG_EN[s] || s)}</a>`).join("");
  const pts = (note.takeaways || []).map((p) => `<li>${esc(p)}</li>`).join("");
  const paras = (note.summary || "").split("\n").filter((s) => s.trim()).map((s) => `<p>${esc(s)}</p>`).join("");

  const body =
    `<article>` +
    `<h1 class="title">${esc(note.title)}</h1>` +
    `<div class="meta"><span>${esc(note.channel)}</span><span>·</span><span>${esc(note.date)}</span>` +
    (note.videoTitle ? `<span>·</span><span>${esc(note.videoTitle)}</span>` : ``) + `</div>` +
    (note.url ? `<a class="watch" href="${escAttr(note.url)}" target="_blank" rel="noopener">▶ Watch original</a>` : ``) +
    `<div class="chips">${catChip}${tks}${segs}</div>` +
    (pts ? `<h2 class="sec">📌 Key Takeaways</h2><ul class="pts">${pts}</ul>` : ``) +
    (paras ? `<h2 class="sec">📝 Full Breakdown</h2><div class="full">${paras}</div>` : ``) +
    `<div class="src">Summary of key points from a public video. Not investment advice; rights belong to the original authors.</div>` +
    `</article>`;

  return shell(head, body);
}
