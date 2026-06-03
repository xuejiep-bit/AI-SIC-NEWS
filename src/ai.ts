import Anthropic from "@anthropic-ai/sdk";
import { LAYERS, SEGMENTS, SEGMENT_BY_KEY, type Layer } from "./taxonomy";

// 用 Claude 对一批文章做语义分类 + 中文标题翻译。
// 相比关键词匹配，语义分类更准（理解上下文而非命中词）；翻译则给英文资讯补上中文标题。
// 失败时调用方回退到关键词分类（见 index.ts），所以这里抛错是安全的。

export interface AiInput {
  title: string;
  summary: string;
  lang: "zh" | "en" | string;
}

export interface AiResult {
  layer: Layer;
  segment: string | null;
  titleZh: string | null;
}

const VALID_LAYERS = new Set<string>(LAYERS.map((l) => l.key));
const VALID_SEGMENTS = new Set<string>(SEGMENTS.map((s) => s.key));

// 系统提示词在每次批处理间保持字节级稳定，便于 prompt caching 命中（见末尾 cache_control）。
function buildSystemPrompt(): string {
  const lines: string[] = [];
  lines.push(
    "你是 AI 产业链资讯分类助手。给定若干新闻条目，把每条归入正确的产业链层级与细分环节，并为英文标题给出简洁中文翻译。",
    "",
    "产业链层级 layer 取值：",
    "- upstream（上游·基础设施层）",
    "- midstream（中游·技术与模型层）",
    "- downstream（下游·应用层）",
    "- other（其他·无法明确归类的行业动态）",
    "",
    "细分环节 segment 取值（必须属于对应层级）：",
  );
  for (const s of SEGMENTS) {
    lines.push(`- ${s.key}（${s.layer} / ${s.zh} ${s.en}）`);
  }
  lines.push(
    "",
    "规则：",
    "1. 只依据标题和摘要判断；与 AI 产业链无关的条目，layer 设为 other、segment 设为 null。",
    "2. segment 必须是上面列出的 key 之一，或 null（当 layer=other 或无法细分时）。",
    "3. title_zh：英文条目给出准确、简洁的中文标题翻译；中文条目直接返回原标题。",
    "4. 按输入顺序返回，index 与输入的 index 一一对应。",
    "",
    "只输出 JSON，不要任何额外文字或 markdown 代码块。格式：",
    '{"items":[{"index":0,"layer":"upstream","segment":"chip_design_mfg","title_zh":"……"}]}',
  );
  return lines.join("\n");
}

interface RawItem { index: number; layer: string; segment: string | null; title_zh: string | null }

function coerce(layer: string, segment: string | null): { layer: Layer; segment: string | null } {
  if (segment && VALID_SEGMENTS.has(segment)) {
    // segment 已知时以其真实层级为准，保证 layer/segment 一致
    return { layer: SEGMENT_BY_KEY[segment].layer, segment };
  }
  const L: Layer = VALID_LAYERS.has(layer) ? (layer as Layer) : "other";
  return { layer: L, segment: null };
}

// 容错解析：去掉可能的 ```json 代码块包裹，截取首尾大括号之间的内容。
function parseJson(text: string): { items: RawItem[] } {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  return JSON.parse(t) as { items: RawItem[] };
}

// 单批分类（建议每批 ≤ 20 条）。返回数组与输入等长、顺序一致。
async function classifyOneBatch(
  client: Anthropic,
  model: string,
  items: AiInput[],
): Promise<AiResult[]> {
  const numbered = items
    .map((it, i) => `[${i}] (${it.lang}) ${it.title}\n${it.summary || ""}`.trim())
    .join("\n\n");

  const resp = await client.messages.create({
    model,
    max_tokens: 8000,
    system: [
      { type: "text", text: buildSystemPrompt(), cache_control: { type: "ephemeral" } },
    ],
    messages: [
      {
        role: "user",
        content: `请对以下 ${items.length} 条资讯分类并翻译，返回 JSON：\n\n${numbered}`,
      },
    ],
  });

  const text = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const parsed = parseJson(text);

  const out: AiResult[] = items.map(() => ({ layer: "other" as Layer, segment: null, titleZh: null }));
  for (const r of parsed.items || []) {
    if (typeof r.index !== "number" || r.index < 0 || r.index >= items.length) continue;
    const { layer, segment } = coerce(r.layer, r.segment);
    const titleZh = r.title_zh && r.title_zh.trim() ? r.title_zh.trim() : null;
    out[r.index] = { layer, segment, titleZh };
  }
  return out;
}

// 对外：分批分类整批文章。任一批失败会抛出，由调用方回退关键词分类。
export async function aiClassify(apiKey: string, model: string, items: AiInput[]): Promise<AiResult[]> {
  const client = new Anthropic({ apiKey });
  const BATCH = 20;
  const results: AiResult[] = [];
  for (let i = 0; i < items.length; i += BATCH) {
    const slice = items.slice(i, i + BATCH);
    results.push(...(await classifyOneBatch(client, model, slice)));
  }
  return results;
}
