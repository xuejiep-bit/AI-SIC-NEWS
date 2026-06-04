import { ALL_FEEDS } from "./feeds";
import { parseFeed } from "./rss";
import { classify } from "./classify";
import { aiClassify, type AiInput } from "./ai";
import { investClause } from "./invest";
import { LAYERS, SEGMENTS } from "./taxonomy";
import { PAGE_HTML } from "./page";

export interface Env {
  DB: D1Database;
  REFRESH_TOKEN?: string;
  ANTHROPIC_API_KEY?: string;
  USE_AI?: string;          // "1" / "true" 开启 Claude 语义分类+翻译
  AI_MODEL?: string;        // 默认 claude-opus-4-8
  RETENTION_DAYS?: string;  // 保留天数，默认 30；<=0 表示不清理
}

// 基于链接的稳定 id（FNV-1a 32bit），用于去重
function hashId(link: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < link.length; i++) {
    h ^= link.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

// 标题归一化：小写、去除空白与标点，仅保留字母数字与 CJK。用于跨源相似标题去重。
function titleKey(title: string): string {
  return (title || "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "")
    .slice(0, 200);
}

const aiEnabled = (env: Env) =>
  !!env.ANTHROPIC_API_KEY && (env.USE_AI === "1" || env.USE_AI === "true");

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

interface Row {
  id: string; title: string; titleZh: string | null; titleKey: string; link: string;
  summary: string; source: string; lang: string; layer: string; segment: string | null;
  score: number; publishedAt: number; isVideo: boolean;
}

// ── 抓取 + 分类 + 入库 ────────────────────────────────
async function ingest(env: Env): Promise<{ feeds: number; fetched: number; newItems: number; upserted: number; aiUsed: boolean; deleted: number; errors: string[] }> {
  const errors: string[] = [];
  const now = Date.now();

  const results = await Promise.allSettled(
    ALL_FEEDS.map(async (feed) => {
      const res = await fetch(feed.url, {
        headers: { "user-agent": "AI-SIC-News/0.1 (+https://github.com/xuejiep-bit/ai-sic-news)" },
        cf: { cacheTtl: 300 },
      });
      if (!res.ok) throw new Error(`${feed.name}: HTTP ${res.status}`);
      const xml = await res.text();
      return { feed, items: parseFeed(xml) };
    }),
  );

  // 收集并按 id 去重（同一次抓取内）
  const candidates = new Map<string, Row>();
  let fetched = 0;
  for (const r of results) {
    if (r.status === "rejected") { errors.push(String(r.reason).slice(0, 200)); continue; }
    const { feed, items } = r.value;
    for (const it of items) {
      fetched++;
      const id = hashId(it.link);
      if (candidates.has(id)) continue;
      candidates.set(id, {
        id, title: it.title, titleZh: feed.lang === "zh" ? it.title : null,
        titleKey: titleKey(it.title), link: it.link, summary: it.summary,
        source: feed.name, lang: feed.lang, layer: "other", segment: null,
        score: 0, publishedAt: it.publishedAt ?? now, isVideo: feed.kind === "video",
      });
    }
  }

  // 只处理库中尚不存在的条目（按 id），避免重复分类与浪费 AI 调用
  const allIds = [...candidates.keys()];
  const existing = new Set<string>();
  for (let i = 0; i < allIds.length; i += 100) {
    const chunk = allIds.slice(i, i + 100);
    const ph = chunk.map(() => "?").join(",");
    const { results: rows } = await env.DB.prepare(`SELECT id FROM articles WHERE id IN (${ph})`).bind(...chunk).all<{ id: string }>();
    for (const row of rows) existing.add(row.id);
  }
  const newItems = [...candidates.values()].filter((r) => !existing.has(r.id));

  // 视频归入 video 分类，不进产业链；其余走关键词分类（基线 + AI 失败时的回退）
  for (const r of newItems) {
    if (r.isVideo) { r.layer = "video"; r.segment = null; continue; }
    const c = classify(r.title, r.summary);
    r.layer = c.layer; r.segment = c.segment; r.score = c.score;
  }

  // 可选：Claude 语义分类 + 中文标题翻译，覆盖关键词结果（仅资讯，不含视频）
  let aiUsed = false;
  const aiItems = newItems.filter((r) => !r.isVideo);
  if (aiEnabled(env) && aiItems.length > 0) {
    try {
      const inputs: AiInput[] = aiItems.map((r) => ({ title: r.title, summary: r.summary, lang: r.lang }));
      const ai = await aiClassify(env.ANTHROPIC_API_KEY!, env.AI_MODEL || "claude-opus-4-8", inputs);
      for (let i = 0; i < aiItems.length; i++) {
        const a = ai[i];
        if (!a) continue;
        aiItems[i].layer = a.layer;
        aiItems[i].segment = a.segment;
        if (a.titleZh) aiItems[i].titleZh = a.titleZh;
      }
      aiUsed = true;
    } catch (err) {
      errors.push("ai: " + String(err).slice(0, 200));
    }
  }

  // 入库：id 主键 + title_key 唯一，OR IGNORE 同时实现链接去重与跨源标题去重
  const stmt = env.DB.prepare(
    `INSERT OR IGNORE INTO articles
       (id, title, title_zh, title_key, link, summary, source, lang, layer, segment, score, published_at, fetched_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const batch = newItems.map((a) =>
    stmt.bind(a.id, a.title, a.titleZh, a.titleKey, a.link, a.summary, a.source, a.lang, a.layer, a.segment, a.score, a.publishedAt, now),
  );
  let upserted = 0;
  for (let i = 0; i < batch.length; i += 50) {
    const slice = batch.slice(i, i + 50);
    if (slice.length === 0) continue;
    const res = await env.DB.batch(slice);
    upserted += res.reduce((n, r) => n + (r.meta?.changes ?? 0), 0);
  }

  // 数据保留：清理过期文章
  let deleted = 0;
  const retentionDays = parseInt(env.RETENTION_DAYS || "30", 10);
  if (retentionDays > 0) {
    const cutoff = now - retentionDays * 86400000;
    const res = await env.DB.prepare(`DELETE FROM articles WHERE published_at < ?`).bind(cutoff).run();
    deleted = res.meta?.changes ?? 0;
  }

  return { feeds: ALL_FEEDS.length, fetched, newItems: newItems.length, upserted, aiUsed, deleted, errors };
}

// ── 查询 ──────────────────────────────────────────────
async function queryNews(env: Env, url: URL) {
  const layer = url.searchParams.get("layer");
  const segment = url.searchParams.get("segment");
  const lang = url.searchParams.get("lang");
  const q = url.searchParams.get("q");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "60", 10) || 60, 200);

  // 「AI 视频」视图：只看 YouTube 视频，忽略语言/环节过滤（视频自成一类）
  if (layer === "video") {
    const { results } = await env.DB.prepare(
      `SELECT id, title, title_zh, link, summary, source, lang, layer, segment, published_at
       FROM articles WHERE layer = 'video' ORDER BY published_at DESC LIMIT ?`,
    ).bind(limit).all();
    return results;
  }

  const where: string[] = ["layer != 'video'"]; // 资讯视图一律排除视频
  const binds: unknown[] = [];
  if (layer && layer !== "all") { where.push("layer = ?"); binds.push(layer); }
  if (segment && segment !== "all") { where.push("segment = ?"); binds.push(segment); }
  if (lang && lang !== "all") { where.push("lang = ?"); binds.push(lang); }
  if (q) { where.push("(title LIKE ? OR title_zh LIKE ? OR summary LIKE ?)"); binds.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  if (url.searchParams.get("invest") === "1") {
    where.push(investClause());
  }

  const sql =
    `SELECT id, title, title_zh, link, summary, source, lang, layer, segment, published_at
     FROM articles ${where.length ? "WHERE " + where.join(" AND ") : ""}
     ORDER BY published_at DESC LIMIT ?`;
  binds.push(limit);

  const { results } = await env.DB.prepare(sql).bind(...binds).all();
  return results;
}

async function queryStats(env: Env, url: URL) {
  const lang = url.searchParams.get("lang");
  const binds = lang && lang !== "all" ? [lang] : [];
  // 资讯统计：排除视频，叠加语言过滤
  const conds = ["layer != 'video'"];
  if (lang && lang !== "all") conds.push("lang = ?");
  const cond = "WHERE " + conds.join(" AND ");

  const { results } = await env.DB.prepare(
    `SELECT layer, segment, COUNT(*) AS n FROM articles ${cond} GROUP BY layer, segment`,
  ).bind(...binds).all();
  const total = await env.DB.prepare(`SELECT COUNT(*) AS n FROM articles ${cond}`).bind(...binds).first<{ n: number }>();

  // 「投资/融资」跨层级计数（叠加语言过滤）
  const investRow = await env.DB.prepare(`SELECT COUNT(*) AS n FROM articles ${cond} AND ${investClause()}`)
    .bind(...binds).first<{ n: number }>();

  // 「AI 视频」计数（不分语言）
  const videoRow = await env.DB.prepare(`SELECT COUNT(*) AS n FROM articles WHERE layer = 'video'`)
    .first<{ n: number }>();

  return { total: total?.n ?? 0, invest: investRow?.n ?? 0, video: videoRow?.n ?? 0, breakdown: results };
}

// 用关键词分类重新归类全部资讯（视频除外）。分类体系调整后跑一次，把存量文章重分到新板块。
async function reclassifyAll(env: Env): Promise<{ scanned: number; updated: number }> {
  const { results } = await env.DB.prepare(
    `SELECT id, title, summary FROM articles WHERE layer != 'video'`,
  ).all<{ id: string; title: string; summary: string }>();
  const stmt = env.DB.prepare(`UPDATE articles SET layer = ?, segment = ?, score = ? WHERE id = ?`);
  const batch = results.map((r) => {
    const c = classify(r.title || "", r.summary || "");
    return stmt.bind(c.layer, c.segment, c.score, r.id);
  });
  let updated = 0;
  for (let i = 0; i < batch.length; i += 50) {
    const slice = batch.slice(i, i + 50);
    if (slice.length === 0) continue;
    const res = await env.DB.batch(slice);
    updated += res.reduce((n, x) => n + (x.meta?.changes ?? 0), 0);
  }
  return { scanned: results.length, updated };
}

// ── SEO: sitemap & robots ─────────────────────────────
function sitemapXml(origin: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const urls: string[] = [origin + "/"];
  for (const L of LAYERS) if (L.key !== "other") urls.push(`${origin}/?layer=${L.key}`);
  urls.push(`${origin}/?invest=1`);
  urls.push(`${origin}/?layer=video`);
  for (const s of SEGMENTS) urls.push(`${origin}/?segment=${s.key}`);
  const body = urls
    .map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod><changefreq>hourly</changefreq></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
}

function robotsTxt(origin: string): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`;
}

// 站点 Logo（favicon）：蓝→绿渐变圆角方块 + 白色 "AI"
const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#4f8cff"/><stop offset="1" stop-color="#36d399"/>
</linearGradient></defs>
<rect width="64" height="64" rx="14" fill="url(#g)"/>
<text x="32" y="45" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="700" fill="#fff" text-anchor="middle">AI</text>
</svg>`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === "/" || path === "/index.html") {
        return new Response(PAGE_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
      }
      if (path === "/favicon.svg" || path === "/favicon.ico") {
        return new Response(FAVICON_SVG, {
          headers: { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "public, max-age=86400" },
        });
      }
      if (path === "/sitemap.xml") {
        return new Response(sitemapXml(url.origin), { headers: { "content-type": "application/xml; charset=utf-8" } });
      }
      if (path === "/robots.txt") {
        return new Response(robotsTxt(url.origin), { headers: { "content-type": "text/plain; charset=utf-8" } });
      }
      if (path === "/api/news") return json(await queryNews(env, url));
      if (path === "/api/stats") return json(await queryStats(env, url));
      if (path === "/api/refresh") {
        const token = env.REFRESH_TOKEN || "";
        if (token) {
          const provided = url.searchParams.get("token") || request.headers.get("x-refresh-token") || "";
          if (provided !== token) return json({ error: "unauthorized" }, 401);
        }
        return json({ ok: true, ...(await ingest(env)) });
      }
      if (path === "/api/reclassify") {
        const token = env.REFRESH_TOKEN || "";
        if (token) {
          const provided = url.searchParams.get("token") || request.headers.get("x-refresh-token") || "";
          if (provided !== token) return json({ error: "unauthorized" }, 401);
        }
        return json({ ok: true, ...(await reclassifyAll(env)) });
      }
      return json({ error: "not found" }, 404);
    } catch (err) {
      return json({ error: String(err) }, 500);
    }
  },

  // Cron 定时触发：抓取并入库
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(ingest(env).then((s) => console.log("ingest", JSON.stringify(s))));
  },
};
