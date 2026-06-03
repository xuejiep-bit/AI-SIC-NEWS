import { FEEDS } from "./feeds";
import { parseFeed } from "./rss";
import { classify } from "./classify";
import { PAGE_HTML } from "./page";

export interface Env {
  DB: D1Database;
  REFRESH_TOKEN?: string;
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

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

// ── 抓取 + 分类 + 入库 ────────────────────────────────
async function ingest(env: Env): Promise<{ feeds: number; fetched: number; upserted: number; errors: string[] }> {
  const errors: string[] = [];
  const now = Date.now();

  const results = await Promise.allSettled(
    FEEDS.map(async (feed) => {
      const res = await fetch(feed.url, {
        headers: { "user-agent": "AI-SIC-News/0.1 (+https://github.com/xuejiep-bit/ai-sic-news)" },
        cf: { cacheTtl: 300 },
      });
      if (!res.ok) throw new Error(`${feed.name}: HTTP ${res.status}`);
      const xml = await res.text();
      const items = parseFeed(xml);
      return { feed, items };
    }),
  );

  // 收集所有条目并去重（同一次抓取内）
  const rows = new Map<string, {
    id: string; title: string; link: string; summary: string; source: string;
    lang: string; layer: string; segment: string | null; score: number; publishedAt: number;
  }>();

  let fetched = 0;
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === "rejected") {
      errors.push(String(r.reason).slice(0, 200));
      continue;
    }
    const { feed, items } = r.value;
    for (const it of items) {
      fetched++;
      const c = classify(it.title, it.summary);
      const id = hashId(it.link);
      rows.set(id, {
        id,
        title: it.title,
        link: it.link,
        summary: it.summary,
        source: feed.name,
        lang: feed.lang,
        layer: c.layer,
        segment: c.segment,
        score: c.score,
        publishedAt: it.publishedAt ?? now,
      });
    }
  }

  // 批量 upsert：已存在的链接忽略（保留首次入库时间）
  const stmt = env.DB.prepare(
    `INSERT INTO articles (id, title, link, summary, source, lang, layer, segment, score, published_at, fetched_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO NOTHING`,
  );
  const batch = [...rows.values()].map((a) =>
    stmt.bind(a.id, a.title, a.link, a.summary, a.source, a.lang, a.layer, a.segment, a.score, a.publishedAt, now),
  );

  let upserted = 0;
  // D1 batch 一次最多约 100 条，分片提交
  for (let i = 0; i < batch.length; i += 50) {
    const slice = batch.slice(i, i + 50);
    if (slice.length === 0) continue;
    const res = await env.DB.batch(slice);
    upserted += res.reduce((n, r) => n + (r.meta?.changes ?? 0), 0);
  }

  return { feeds: FEEDS.length, fetched, upserted, errors };
}

// ── 查询 ──────────────────────────────────────────────
async function queryNews(env: Env, url: URL) {
  const layer = url.searchParams.get("layer");
  const segment = url.searchParams.get("segment");
  const lang = url.searchParams.get("lang");
  const q = url.searchParams.get("q");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "60", 10) || 60, 200);

  const where: string[] = [];
  const binds: unknown[] = [];
  if (layer && layer !== "all") { where.push("layer = ?"); binds.push(layer); }
  if (segment && segment !== "all") { where.push("segment = ?"); binds.push(segment); }
  if (lang && lang !== "all") { where.push("lang = ?"); binds.push(lang); }
  if (q) { where.push("(title LIKE ? OR summary LIKE ?)"); binds.push(`%${q}%`, `%${q}%`); }

  const sql =
    `SELECT id, title, link, summary, source, lang, layer, segment, published_at
     FROM articles ${where.length ? "WHERE " + where.join(" AND ") : ""}
     ORDER BY published_at DESC LIMIT ?`;
  binds.push(limit);

  const { results } = await env.DB.prepare(sql).bind(...binds).all();
  return results;
}

async function queryStats(env: Env) {
  const { results } = await env.DB.prepare(
    `SELECT layer, segment, COUNT(*) AS n FROM articles GROUP BY layer, segment`,
  ).all();
  const total = await env.DB.prepare(`SELECT COUNT(*) AS n FROM articles`).first<{ n: number }>();
  return { total: total?.n ?? 0, breakdown: results };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === "/" || path === "/index.html") {
        return new Response(PAGE_HTML, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }

      if (path === "/api/news") {
        return json(await queryNews(env, url));
      }

      if (path === "/api/stats") {
        return json(await queryStats(env));
      }

      if (path === "/api/refresh") {
        const token = env.REFRESH_TOKEN || "";
        if (token) {
          const provided = url.searchParams.get("token") || request.headers.get("x-refresh-token") || "";
          if (provided !== token) return json({ error: "unauthorized" }, 401);
        }
        const summary = await ingest(env);
        return json({ ok: true, ...summary });
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
