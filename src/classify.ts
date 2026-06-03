import { SEGMENTS, type Layer } from "./taxonomy";

export interface Classification {
  layer: Layer;
  segment: string | null;
  score: number;
}

// 对一篇文章（标题 + 摘要）按关键词打分，归入得分最高的细分环节。
// 标题命中权重更高（×2）。无任何命中则归为 "other"。
export function classify(title: string, summary: string): Classification {
  const titleText = (title || "").toLowerCase();
  const bodyText = (summary || "").toLowerCase();

  let best: { segment: string; layer: Layer; score: number } | null = null;

  for (const seg of SEGMENTS) {
    let score = 0;
    for (const kw of seg.keywords) {
      const k = kw.toLowerCase();
      if (!k) continue;
      if (titleText.includes(k)) score += 2;
      if (bodyText.includes(k)) score += 1;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { segment: seg.key, layer: seg.layer, score };
    }
  }

  if (!best) return { layer: "other", segment: null, score: 0 };
  return { layer: best.layer, segment: best.segment, score: best.score };
}
