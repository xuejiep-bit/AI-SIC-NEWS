// 模块2：英文资讯自动翻译管线（Cloudflare Workers AI）。
// 对每条英文资讯生成「地道中文标题 + 两句内中文摘要 + 产业链分类」，结果与英文原文一起入库。
// 由 Cron 每小时批量处理，不在用户访问时实时翻译；失败的条目下一轮自动重试（最多 3 次）。

import { SEGMENTS, SEGMENT_BY_KEY, type Layer } from "./taxonomy";

// runTranslate 只需要 DB + AI 绑定 + 两个可选配置，这里单独声明所需形状，避免与 index.ts 的 Env 循环引用。
interface TranslateEnv {
  DB: D1Database;
  AI: Ai;
  AI_TRANSLATE_MODEL?: string; // Workers AI 模型，默认 @cf/meta/llama-3.1-8b-instruct-fast
  TRANSLATE_PER_RUN?: string;  // 每轮处理条数上限，默认 20（控制 Workers AI 免费额度消耗）
}

const VALID_SEGMENTS = new Set<string>(SEGMENTS.map((s) => s.key));

// 把站内分类列表（key = 中文名）拼进提示词，让模型从中选一个，保证产出的分类是合法 key。
const SEGMENT_MENU = SEGMENTS.map((s) => `${s.key} = ${s.zh}`).join("\n");

// 系统提示词：要求地道中文（非直译）+ 只输出 JSON。
const SYSTEM_PROMPT = [
  "你是中文财经科技媒体的资深编辑。我给你一条英文的 AI 产业链相关资讯，请你输出地道、专业的中文。",
  "要求：",
  "1. title_zh：中文标题，符合中文财经媒体的标题习惯，简洁有力，不要生硬直译。",
  '   例如 "Nvidia beats estimates" 要译为「英伟达业绩超预期」，而不是「英伟达击败了估计」。',
  "2. summary_zh：两句话以内的中文摘要，客观陈述核心信息。",
  "3. category：从下面的分类清单里选最贴切的一个，只填它的 key；与 AI 产业链无关就填 other。",
  "",
  "分类清单（key = 含义）：",
  SEGMENT_MENU,
  "other = 其他 / 无法归类",
  "",
  '只输出一个 JSON 对象，不要任何解释、前后缀或 markdown 代码块。格式：',
  '{"title_zh":"……","summary_zh":"……","category":"……"}',
].join("\n");

// 容错解析：去掉推理模型的 <think> 块、去掉 ```json 代码块包裹，截取首尾大括号之间的内容再 JSON.parse。
function parseResult(text: string): { titleZh: string; summaryZh: string; category: string } {
  let t = (text || "").trim();
  t = t.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const s = t.indexOf("{");
  const e = t.lastIndexOf("}");
  if (s >= 0 && e > s) t = t.slice(s, e + 1);
  const o = JSON.parse(t) as { title_zh?: string; summary_zh?: string; category?: string };
  return {
    titleZh: String(o.title_zh || "").trim(),
    summaryZh: String(o.summary_zh || "").trim(),
    category: String(o.category || "").trim(),
  };
}

interface Translated { titleZh: string; summaryZh: string | null; layer: Layer; segment: string | null }

// 单条翻译。失败（模型报错 / JSON 解析失败 / 无标题）时抛出，由 runTranslate 记为 failed 并重试。
async function translateOne(env: TranslateEnv, model: string, item: { title: string; summary: string }): Promise<Translated> {
  const user = `标题：${item.title}\n摘要：${item.summary || "（无）"}`;
  // env.AI.run 的类型按具体模型名做了重载，这里用字符串模型名，故把方法转成宽松签名调用。
  const run = env.AI.run as unknown as (m: string, i: unknown) => Promise<{ response?: string }>;
  const resp = await run(model, {
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: user },
    ],
    max_tokens: 512,
  });
  const text = typeof resp === "string" ? resp : resp?.response ?? "";
  const { titleZh, summaryZh, category } = parseResult(text);
  if (!titleZh) throw new Error("missing title_zh");
  let layer: Layer = "other";
  let segment: string | null = null;
  if (category && VALID_SEGMENTS.has(category)) {
    segment = category;
    layer = SEGMENT_BY_KEY[category].layer;
  }
  return { titleZh, summaryZh: summaryZh || null, layer, segment };
}

// 对外：批量处理一轮待翻译条目。返回处理统计，便于 Cron 日志与 /api/translate 排查。
export async function runTranslate(
  env: TranslateEnv,
): Promise<{ scanned: number; done: number; failed: number; model: string; errors: string[] }> {
  const model = env.AI_TRANSLATE_MODEL || "@cf/meta/llama-3.1-8b-instruct-fast";
  const limit = Math.min(parseInt(env.TRANSLATE_PER_RUN || "20", 10) || 20, 100);

  // 待翻译：英文、非视频、尚未完成（pending/未标记）或失败但重试次数 < 3；按发布时间从新到旧优先处理。
  const { results } = await env.DB.prepare(
    `SELECT id, title, summary FROM articles
       WHERE lang != 'zh' AND layer NOT IN ('video','video_invest')
         AND (translate_status IS NULL OR translate_status = 'pending'
              OR (translate_status = 'failed' AND COALESCE(translate_attempts, 0) < 3))
       ORDER BY published_at DESC LIMIT ?`,
  ).bind(limit).all<{ id: string; title: string; summary: string }>();

  const okStmt = env.DB.prepare(
    `UPDATE articles SET title_zh = ?, summary_zh = ?, layer = ?, segment = ?,
       translate_status = 'done', translated_at = ?, translate_attempts = COALESCE(translate_attempts, 0) + 1
     WHERE id = ?`,
  );
  const failStmt = env.DB.prepare(
    `UPDATE articles SET translate_status = 'failed', translate_attempts = COALESCE(translate_attempts, 0) + 1 WHERE id = ?`,
  );

  const now = Date.now();
  let done = 0;
  let failed = 0;
  const errors: string[] = [];
  // 串行处理，避免对 Workers AI 的突发并发与单次请求的子请求上限问题。
  for (const r of results) {
    try {
      const t = await translateOne(env, model, { title: r.title, summary: r.summary });
      await okStmt.bind(t.titleZh, t.summaryZh, t.layer, t.segment, now, r.id).run();
      done++;
    } catch (err) {
      await failStmt.bind(r.id).run();
      failed++;
      if (errors.length < 5) errors.push(String(err).slice(0, 150));
    }
  }
  return { scanned: results.length, done, failed, model, errors };
}
