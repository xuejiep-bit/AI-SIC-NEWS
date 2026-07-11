// 「今日精选」价值打分 —— 纯关键词/规则启发式，零成本、在 Worker 内运行，不调用任何付费 API。
// 对每条资讯按「对 AI 产业投资者的价值」打 1-10 分，重点识别三类高价值信号：
//   供需拐点 / 技术拐点 / 重大事件；命中具体公司/标的加分；泛评论/科普/盘点类扣分。
// 产出 { score, reason }，score 写入 articles.value_score，reason 写入 value_reason。
// 想调整灵敏度：改下面各信号组的 terms / weight，或调 index.ts 里的阈值。

export interface ValueResult {
  score: number;   // 1-10
  reason: string;  // 一句话：命中了哪类信号
}

interface SignalGroup {
  key: string;
  label: string;        // 中文标签，用于理由
  terms: string[];      // 命中词（统一小写匹配）
}

// 三类高价值信号
const SIGNALS: SignalGroup[] = [
  {
    key: "supply", label: "Supply/Demand",
    terms: [
      "产能", "扩产", "满产", "稼动率", "供不应求", "供应紧张", "供给紧张", "紧缺", "短缺", "缺货",
      "断供", "停产", "减产", "去库存", "补库存", "交期", "排产", "涨价", "提价", "调价", "价格上涨",
      "价格大涨", "涨幅", "涨价函", "降价", "跌价", "价格战", "供应链", "断链", "卡脖子", "囤货", "抢产能",
      "shortage", "capacity", "sold out", "undersupply", "supply chain", "price hike", "price increase",
      "ramp", "ramping", "constrained", "backlog", "lead time", "allocation", "tight supply",
    ],
  },
  {
    key: "tech", label: "Tech inflection",
    terms: [
      "突破", "良率", "流片", "新架构", "新工艺", "新制程", "制程", "纳米", "试产", "小批量", "量产",
      "性能提升", "成本下降", "降本", "能效", "功耗", "数量级", "跨代", "首发", "全球首", "业界首",
      "路线图", "新一代", "下一代", "颠覆", "革命性",
      "breakthrough", "yield", "tape-out", "tapeout", "architecture", "node", "efficiency",
      "benchmark", "record", "milestone", "next-gen", "next generation", "order of magnitude",
    ],
  },
  {
    key: "event", label: "Major event",
    terms: [
      "融资", "估值", "ipo", "上市", "并购", "收购", "合并", "入股", "战略投资", "定增", "募资", "增发",
      "出口管制", "禁令", "禁售", "制裁", "管制", "限制出口", "补贴", "政策", "监管", "反垄断", "国产替代",
      "大单", "巨额订单", "签约", "建厂", "扩建", "重组", "分拆", "裁员", "停摆",
      "亿美元", "亿元", "千亿", "百亿", "billion", "funding", "raised", "valuation", "acquire",
      "acquisition", "merger", "stake", "ipo", "export control", "ban", "sanction", "subsidy", "antitrust",
    ],
  },
];

// 可关联到具体投资标的（命中加分）：代表性公司/标的
const TICKERS = [
  "英伟达", "nvidia", "amd", "台积电", "tsmc", "博通", "broadcom", "intel", "英特尔", "micron", "美光",
  "sk海力士", "海力士", "hynix", "三星", "samsung", "asml", "supermicro", "超微", "arm", "高通", "qualcomm",
  "中际旭创", "新易盛", "寒武纪", "海光", "中芯国际", "smic", "工业富联", "vertiv", "维谛", "coreweave",
  "openai", "anthropic", "谷歌", "google", "微软", "microsoft", "meta", "特斯拉", "tesla", "甲骨文", "oracle",
  "palantir", "constellation", "星座能源", "deepseek", "深度求索",
];

// 低价值标记（命中扣分）：泛评论 / 科普 / 盘点 / 榜单 / 行情综述 / 公关稿
const LOW_VALUE = [
  "盘点", "榜单", "排行", "排行榜", "解读", "观点", "评论", "专访", "对话", "访谈", "科普", "入门",
  "教程", "指南", "是什么", "怎么看", "如何看", "为何", "盘前", "盘后", "收评", "早报", "午评", "晚报",
  "综述", "一文看懂", "一文读懂", "回顾", "展望", "畅想", "杂谈", "随笔",
  "recap", "opinion", "explainer", "guide", "how to", "what is", "weekly wrap", "roundup", "op-ed",
];

function countHits(text: string, terms: string[]): string[] {
  const hit: string[] = [];
  for (const t of terms) {
    if (text.includes(t)) hit.push(t);
  }
  return hit;
}

// 对一条资讯打分。score=3 为中性基线；命中高价值信号加分，命中低价值标记扣分。
export function scoreValue(title: string, summary: string): ValueResult {
  const text = ((title || "") + " " + (summary || "")).toLowerCase();

  let points = 0;
  const firedLabels: string[] = [];
  const sampleTerms: string[] = [];

  for (const g of SIGNALS) {
    const hits = countHits(text, g.terms);
    if (hits.length === 0) continue;
    // 单组：命中即 +2，命中≥2个不同词再 +1（最多 +3/组）
    points += hits.length >= 2 ? 3 : 2;
    firedLabels.push(g.label);
    // 取该组命中的、出现在标题里的词优先做样例（更贴切）
    for (const h of hits) {
      if (sampleTerms.length < 3 && !sampleTerms.includes(h)) sampleTerms.push(h);
    }
  }

  // 可关联标的：+1（只加一次）
  const tickerHits = countHits(text, TICKERS);
  if (tickerHits.length > 0) points += 1;

  // 低价值标记：每个 -2，最多 -3
  const lowHits = countHits(text, LOW_VALUE);
  const penalty = Math.min(lowHits.length * 2, 3);

  let score = 3 + points - penalty;
  if (score < 1) score = 1;
  if (score > 10) score = 10;

  // Build a one-line reason
  let reason: string;
  if (firedLabels.length > 0) {
    reason = "Signals: " + firedLabels.join(" · ");
    if (sampleTerms.length) reason += " — " + sampleTerms.join(", ");
    if (tickerHits.length) reason += " (mentions " + tickerHits.slice(0, 2).join(", ") + ")";
  } else if (penalty > 0) {
    reason = "Commentary/explainer — no clear supply-chain signal";
  } else {
    reason = "Routine industry news — no standout supply/tech/event signal";
  }

  return { score, reason };
}
