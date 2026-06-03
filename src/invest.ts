// 「投资 / 融资」是跨层级维度：一条资讯既可能属于某个产业链环节，又涉及资本动态。
// 这里用关键词在查询时即时匹配（不额外建表字段），对历史数据也立即生效。
// 想增删触发词，直接改这个列表即可。

export const INVEST_KEYWORDS = [
  // 中文
  "融资", "投资", "估值", "IPO", "上市", "并购", "收购", "募资", "增资", "注资",
  "风投", "创投", "领投", "跟投", "入股", "市值", "投资机构", "天使轮", "种子轮",
  "A轮", "B轮", "C轮", "轮融资",
  // 英文
  "funding", "fundraise", "valuation", "venture capital", "Series A", "Series B",
  "Series C", "seed round", "acquisition", "acquires", "IPO", "raises $", "raised $",
  "billion in funding", "stake",
];

// 构造 SQL 片段：标题/中文标题/摘要任一命中任一关键词即算「投资」。
// 关键词是代码常量（非用户输入），直接内联为字面量 —— D1 单条语句的绑定参数上限约 100，
// 关键词较多时用绑定会超限，故内联。单引号做转义以防万一。
export function investClause(): string {
  const esc = (s: string) => s.replace(/'/g, "''");
  const parts = INVEST_KEYWORDS.map((k) => {
    const p = `%${esc(k)}%`;
    return `(title LIKE '${p}' OR title_zh LIKE '${p}' OR summary LIKE '${p}')`;
  });
  return "(" + parts.join(" OR ") + ")";
}
