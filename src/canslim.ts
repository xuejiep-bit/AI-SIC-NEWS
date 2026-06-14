// CAN SLIM 教学版分析报告（William O'Neil 选股系统，覆盖 6 个字母 C/A/N/S/L/M）。
// 移植自用户的 canslim_scan.py / canslim_scan_hk.py + canslim_report*.py，评分逻辑与报告文案保持一致；
// 数据源由 akshare（东方财富）改为 Yahoo Finance（海外可直连，覆盖美股+港股）。
// 与原版差异（已在报告中标注）：
//   1) RS 标杆池沿用原脚本同一批股票；Yahoo 取数，权重公式一致；
//   2) 港股 L 阈值用 scan 的 87（报告文案也统一为 87，避免与原 report 文案的 80 自相矛盾）；
//   3) 季报同比改用 Yahoo 季度序列按「最近一期 vs ~1 年前同期」计算，半年报公司自动适配；
//   4) 分销日/4 阶段等 scan-CLI 专有维度未纳入（原 .md 报告本就未输出）。

import { normalizeSymbol, fetchDaily, fetchFin, type Daily, type FinPoint } from "./finance";

interface Cfg {
  market: "us" | "hk";
  benchSym: string; benchName: string; curPrefix: string; rsThreshold: number; universe: string[];
}

const RS_UNIVERSE_US = [
  "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "AVGO",
  "JPM", "V", "WMT", "XOM", "UNH", "MA", "JNJ", "PG", "HD", "COST",
  "ORCL", "KO", "NFLX", "ADBE", "CRM", "AMD", "QCOM", "CSCO", "MCD", "DIS", "BA", "GE",
];
const RS_UNIVERSE_HK = [
  "00700", "09988", "03690", "01810", "09618", "00992", "00981", "02382",
  "01024", "09999", "00285", "06618", "09888", "09660", "03888",
  "00939", "01398", "00005", "02318", "02628", "03968", "00388", "02388", "01288", "03328",
  "00175", "01211", "02331", "02020", "09633", "00669", "06862", "02688", "01066", "09926",
  "01093", "01177", "06160", "02616", "06078", "03692", "01999", "02269",
  "00941", "00006", "00883", "00857", "00316", "02319", "01193", "01113",
  "01088", "00386",
];

export function cfgFor(market: "us" | "hk"): Cfg {
  return market === "hk"
    ? { market, benchSym: "^HSI", benchName: "恒生指数", curPrefix: "HK$ ", rsThreshold: 87, universe: RS_UNIVERSE_HK }
    : { market, benchSym: "SPY", benchName: "标普 500", curPrefix: "$", rsThreshold: 80, universe: RS_UNIVERSE_US };
}

const round2 = (x: number) => Math.round(x * 100) / 100;
const sig = (ok: boolean) => (ok ? "✅ 通过" : "❌ 不通过");

const ma = (a: number[], n: number, i: number) => {
  if (i + 1 < n) return NaN;
  let s = 0; for (let k = i - n + 1; k <= i; k++) s += a[k];
  return s / n;
};

// IBD 加权 4 阶段表现：40%×3月 + 20%×6月 + 20%×9月 + 20%×12月（需 ≥252 日）
export function weightedPerf(close: number[]): number | null {
  if (close.length < 252) return null;
  const c = close, n = c.length - 1;
  return 0.4 * (c[n] / c[n - 63] - 1) + 0.2 * (c[n] / c[n - 126] - 1) + 0.2 * (c[n] / c[n - 189] - 1) + 0.2 * (c[n] / c[n - 252] - 1);
}

function calcRsRating(perf: number, all: number[]): number | null {
  if (!isFinite(perf) || all.length < 2) return null;
  const rank = all.filter((s) => s < perf).length;
  return Math.round((rank / (all.length - 1)) * 99);
}

// 同比：最近一期 vs ~1 年前同期（±75 天匹配，兼容季报/半年报）
function yoyLatest(series: { date: string; v: number }[]): number | null {
  if (series.length < 2) return null;
  const lt = Date.parse(series[0].date);
  let best: { date: string; v: number } | null = null, bestDiff = Infinity;
  for (let i = 1; i < series.length; i++) {
    const diff = Math.abs((lt - Date.parse(series[i].date)) - 365 * 864e5);
    if (diff < bestDiff) { bestDiff = diff; best = series[i]; }
  }
  if (!best || bestDiff > 75 * 864e5 || best.v <= 0) return null;
  return (series[0].v / best.v - 1) * 100;
}

function annualYoYs(series: number[], n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n && i + 1 < series.length; i++) {
    if (series[i + 1] > 0) out.push((series[i] / series[i + 1] - 1) * 100);
  }
  return out;
}

interface Base { pattern: string; pivot?: number; depth?: number; breakout: boolean; stop?: number }
function detectBase(d: Daily): Base {
  const lb = 60, len = d.close.length;
  if (len < lb + 5) return { pattern: "数据不足", breakout: false };
  const s = len - (lb + 5);
  let pivot = -Infinity, pIdx = s;
  for (let i = s; i < len; i++) if (d.high[i] > pivot) { pivot = d.high[i]; pIdx = i; }
  const afterLen = len - pIdx;
  const today = d.close[len - 1];
  const stop = round2(today * 0.92);
  if (afterLen < 10) return { pattern: "刚创高点, 尚未形成基底", pivot: round2(pivot), breakout: false, stop };
  let baseLow = Infinity; for (let i = pIdx; i < len; i++) baseLow = Math.min(baseLow, d.low[i]);
  const depth = (1 - baseLow / pivot) * 100;
  const breakout = today > pivot * 0.99;
  let pattern: string;
  if (breakout) pattern = (depth >= 8 && depth <= 35) ? `🟢 基底突破 (深度 ${depth.toFixed(1)}%, 类杯柄)` : `🟢 新高突破 (基底深度 ${depth.toFixed(1)}%)`;
  else if (today > baseLow && today / pivot > 0.92) pattern = `🟡 接近 pivot ${round2(pivot)} (${((today / pivot - 1) * 100).toFixed(1)}%)`;
  else pattern = `⚪ 远离 pivot (-${((1 - today / pivot) * 100).toFixed(1)}%)`;
  return { pattern, pivot: round2(pivot), depth: round2(depth), breakout, stop };
}

interface Funda {
  C: boolean | null; A: boolean | null;
  q_eps_yoy: number | null; q_rev_yoy: number | null; annual_yoy_3y: number[]; roe: number | null;
}
function parseFundamentals(fin: { annual: FinPoint[]; quarterly: FinPoint[] }, market: "us" | "hk"): Funda {
  const out: Funda = { C: null, A: null, q_eps_yoy: null, q_rev_yoy: null, annual_yoy_3y: [], roe: null };
  const pf: keyof FinPoint = market === "hk" ? "netIncome" : "eps"; // 美股用 EPS，港股用归母净利润

  if (fin.quarterly.length) {
    const ps = fin.quarterly.filter((x) => x[pf] != null).map((x) => ({ date: x.date, v: x[pf] as number }));
    const rs = fin.quarterly.filter((x) => x.revenue != null).map((x) => ({ date: x.date, v: x.revenue as number }));
    const py = yoyLatest(ps), ry = yoyLatest(rs);
    if (py != null) { out.q_eps_yoy = round2(py); out.C = py >= 25; }
    if (ry != null) out.q_rev_yoy = round2(ry);
  }
  if (fin.annual.length) {
    const ps = fin.annual.filter((x) => x[pf] != null).map((x) => x[pf] as number);
    out.annual_yoy_3y = annualYoYs(ps, 3).map(round2);
    if (out.annual_yoy_3y.length) out.A = out.annual_yoy_3y.filter((x) => x >= 25).length >= 2;
    const a0 = fin.annual[0];
    if (a0.netIncome != null && a0.equity != null && a0.equity !== 0) out.roe = round2((a0.netIncome / a0.equity) * 100);
  }
  return out;
}

// 拉取 RS 标杆池表现（供 index.ts 当天缓存调用，避免每次报告都重拉几十只）
export async function computeUniverseReturns(market: "us" | "hk"): Promise<Record<string, number>> {
  const cfg = cfgFor(market);
  const syms = cfg.universe.map((s) => normalizeSymbol(s, market));
  const out: Record<string, number> = {};
  const BATCH = 8;
  for (let i = 0; i < syms.length; i += BATCH) {
    const slice = syms.slice(i, i + BATCH);
    const rs = await Promise.allSettled(slice.map((s) => fetchDaily(s)));
    rs.forEach((res, j) => {
      if (res.status === "fulfilled") { const p = weightedPerf(res.value.close); if (p != null) out[slice[j]] = p; }
    });
  }
  return out;
}

interface Result {
  symbol: string; name: string; date: string; price: number;
  high_52w: number; dist_to_high: number; volume: number; vol_ma50: number; vol_ratio: number;
  rs_rating: number | null; base_pattern: string; pivot?: number; stop?: number;
  C: boolean; A: boolean; N: boolean; S: boolean; L: boolean; M: boolean;
  score_tech: number; score_fund: number; score_total: number;
  _cfg: Cfg; _market: { close: number; ma50: number; ma200: number }; _funda: Funda;
}

function conclusion(r: Result): string {
  const { score_tech: tech, score_total: total } = r;
  if (!r.M) return `🔴 **大盘环境不佳, 整体建议空仓**\n\n${r._cfg.benchName} 不在上升趋势, 这种环境下连最强的股票也涨不动. O'Neil 给散户最重要的建议: 熊市里**什么都别买**, 保护本金. → **建议: 此时不论这只股表现如何, 暂时不入场.**`;
  if (total === 6) return `🟢 **强烈关注 (${total}/6)**\n\n这只股票同时满足 CAN SLIM 全部 6 项考核 —— 基本面好 + 技术面强 + 大盘配合. 这种'天时地利人和'的组合很罕见.\n\n→ **建议: 在 pivot 点附近买入, 严格设置 -8% 止损.**`;
  if (tech === 4 && !r.A) return `🟡 **谨慎关注 — 经典'故事股' (${total}/6)**\n\n图形非常漂亮 (技术 4/4), 但公司**过去 3 年利润大起大落**, 不是一家稳健成长的公司. O'Neil 把这种'图形强基本面弱'的票叫做**故事股**, 短期可能涨得快, 但长期风险很高.\n\n→ **建议: 列入观察, 不建议立刻买. 等公司财报转好再说.**`;
  if (total === 5) {
    const missing = (["C", "A", "N", "S", "L", "M"] as const).filter((k) => !r[k])[0];
    return `🟢 **强候选 (${total}/6)** — 仅 **${missing}** 项未达标\n\n接近完美的 CAN SLIM 候选. 单项不达标不一定是致命的, 具体看下面分析.\n\n→ **建议: 重点关注. 如果 ${missing} 是短期问题, 可考虑小仓位试水.**`;
  }
  if (total === 4) return `🟡 **观察名单 (${total}/6)**\n\n有看点但还不到出手时机. 通常意味着基本面或技术面有一面不够强势, 再等等更明确的信号.\n\n→ **建议: 列入观察, 定期复扫.**`;
  return `🔴 **暂不考虑 (${total}/6)**\n\n信号不足 —— 不满足 CAN SLIM 大部分条件. 这并不意味着这只股票'坏', 只是它**当前不在 O'Neil 系统的买点上**.\n\n→ **建议: 跳过, 把时间花在更明确的机会上.**`;
}

function secM(r: Result): string {
  const c = r._cfg, m = r._market, isHk = c.market === "hk";
  const unit = isHk ? " 点" : "", pre = isHk ? "" : "$";
  return `## 第一道关：M - 大盘环境 ⭐ 最重要

**测什么**：现在是"牛市"还是"熊市"？

**为什么重要**：研究表明，**75% 的股票会跟着大盘走**. 大盘跌的时候, 就算公司业绩再好, 股票也很难涨.

**怎么算**：${c.benchName}${isHk ? " (HSI)" : " (SPY ETF)"} 同时满足: ① 现价 > 50 日均线 ② 50 日均线 > 200 日均线.

| 指标 | 数值 |
|---|---:|
| ${c.benchName} 现价 | ${pre}${m.close}${unit} |
| 50 日均线 | ${pre}${m.ma50}${unit} |
| 200 日均线 | ${pre}${m.ma200}${unit} |

### ${sig(r.M)}

${r.M ? `${c.benchName} 同时站稳两条均线, 50 日均线高于 200 日均线 —— 典型牛市格局, 是开仓买股的好时机.` : `${c.benchName} 不满足上升趋势条件, 大盘环境差. 请直接空仓, 别买任何股票.`}

💡 **小白须知**: **这是 O'Neil 给散户最重要的建议** —— 熊市里 75% 的股票会跌. **看不准时, 空仓就是最好的策略.**`;
}

function secC(r: Result): string {
  const isHk = r._cfg.market === "hk";
  const word = isHk ? "归母净利润" : "每股利润 (EPS)", period = isHk ? "报告期" : "季度";
  const f = r._funda;
  if (f.q_eps_yoy == null) {
    return `## 第二道关：C - 最近这一${period}赚的钱有没有暴涨？

**测什么**：公司最新一个${period}的${word}, 比去年同期增长多少.
**通过标准**：同比增长 ≥ +25%

### ⚠️ 数据缺失

Yahoo 未提供该股可比的${period}盈利数据 (可能是新股, 或财报频率特殊). → **建议**: 去雪球手动查最新盈利同比.`;
  }
  const eps = f.q_eps_yoy;
  const warn = eps >= 100 ? `\n⚠️ **小白注意**: ${eps.toFixed(0)}% 看似夸张, 警惕**'基数效应'** —— 去年同期利润若极低, 百分比会被放大. 请去雪球查盈利**绝对值**确认.\n` : "";
  const rev = f.q_rev_yoy != null ? `\n**额外参考 — 营收同比 ${f.q_rev_yoy >= 0 ? "+" : ""}${f.q_rev_yoy.toFixed(1)}%** (${f.q_rev_yoy >= 25 ? "好" : "一般"}). O'Neil 希望营收也加速, 利润才扎实.` : "";
  return `## 第二道关：C - 最近这一${period}${word}有没有暴涨？

**测什么**：公司**最新一个${period}**的${word}, 比去年同期增长多少.

**为什么重要**：业绩突然加速增长, 往往是一波大行情的开端.

**通过标准**：同比增长 ≥ **+25%** (O'Neil 推荐: 最好 ≥40%).

| 指标 | 数值 |
|---|---:|
| 最新${period} 盈利同比 | **${eps >= 0 ? "+" : ""}${eps.toFixed(1)}%** |
${f.q_rev_yoy != null ? `| 最新${period} 营收同比 | ${f.q_rev_yoy >= 0 ? "+" : ""}${f.q_rev_yoy.toFixed(1)}% |` : ""}

### ${sig(r.C)}

**盈利同比 ${eps >= 0 ? "+" : ""}${eps.toFixed(1)}%**, ${r.C ? "达标 (≥25%)" : "未达标 (要求 ≥25%)"}
${warn}${rev}`;
}

function secA(r: Result): string {
  const word = r._cfg.market === "hk" ? "净利润" : "EPS";
  const f = r._funda, yoys = f.annual_yoy_3y;
  if (!yoys.length) {
    return `## 第三道关：A - 公司过去 3 年的成长性

**测什么**：过去 3 年, 公司每年的${word}是不是稳定增长.
**通过标准**：3 年中至少 2 年 ${word}同比 ≥25%

### ⚠️ 数据缺失

Yahoo 未提供足够的年报数据, 请手动查询.`;
  }
  const nowY = new Date().getFullYear();
  const rows = yoys.map((y, i) => `| ${nowY - i - 1} | ${y >= 0 ? "+" : ""}${y.toFixed(1)}% | ${y >= 25 ? "✅ 达标" : "❌ 未达标"} |`).join("\n");
  const okc = yoys.filter((x) => x >= 25).length;
  const volatile = Math.max(...yoys) - Math.min(...yoys) > 100
    ? `\n⚠️ **重要观察**: 这家公司的年利润**剧烈波动** (最高 ${Math.max(...yoys) >= 0 ? "+" : ""}${Math.max(...yoys).toFixed(1)}%, 最低 ${Math.min(...yoys).toFixed(1)}%). O'Neil 喜欢**'稳定加速'的公司**, 而非大起大落.\n` : "";
  const roe = f.roe != null
    ? `\n### 额外加分项 — ROE\n\n**ROE = ${f.roe.toFixed(2)}%**  (${f.roe >= 17 ? "✅ 达标 (≥17%)" : "❌ 未达标 (O'Neil 要求 ≥17%)"})\n\n💡 ROE 测公司用股东的钱赚钱的效率, 17% 是优秀公司的门槛.` : "";
  return `## 第三道关：A - 公司过去 3 年是不是稳定成长？

**测什么**：过去 3 年, 公司每年的利润是不是都在稳定上涨.

**为什么重要**：一年好不算好, **年年好**才说明真有竞争力.

**通过标准**：3 年中至少 **2 年** ${word}同比 ≥25%.

| 年份 | ${word}同比 | 是否达标 |
|---|---:|---|
${rows}

### ${sig(r.A)}

${okc}/3 年达标 — ${r.A ? "通过" : "不通过"}.
${volatile}${roe}

⚠️ **核心提醒**: **A 不过关, 即使技术面再漂亮也要谨慎.** 这种"图形强、基本面弱"的票叫**故事股**, 是散户亏钱最常见的原因.

⚠️ **数据深度说明**: Yahoo 年报通常覆盖最近 4 年, 故取最近 3 个同比; 比 O'Neil 期望的更长历史短, 结论强度相应打折.`;
}

function secN(r: Result): string {
  const pre = r._cfg.curPrefix;
  return `## 第四道关：N - 股价是不是接近 1 年新高？

**测什么**：当前股价离过去 52 周最高点有多远.

**为什么重要**：CAN SLIM **追强不追弱**. 大涨之前的股票往往先创新高 —— 说明聪明钱已在买、没有套牢盘.

**通过标准**：当前价距 52 周高点 ≤ 5%（或正在突破基底）

| 指标 | 数值 |
|---|---:|
| 52 周最高价 | ${pre}${r.high_52w} |
| 当前价距高点 | **${r.dist_to_high >= 0 ? "+" : ""}${r.dist_to_high.toFixed(2)}%** |

### ${sig(r.N)}

${r.N ? `非常接近新高 (差 ${Math.abs(r.dist_to_high).toFixed(2)}%) 或正在突破, 通过.` : `距高点 ${Math.abs(r.dist_to_high).toFixed(2)}%, 离新高还远, 仍在弱势整理阶段.`}

💡 **小白须知**: **真正的大牛股都是从新高一路涨上去, 而不是从底部反弹**. 反直觉但重要.`;
}

function secS(r: Result): string {
  return `## 第五道关：S - 大资金有没有进场？

**测什么**：今天成交量比过去 50 天平均量大多少倍.

**为什么重要**：股价上涨**必须有成交量配合**. 大资金买入时单笔金额巨大, 会显著放量.

**通过标准**：当日量 / 50 日均量 ≥ **1.5 倍**

| 指标 | 数值 |
|---|---:|
| 当日成交量 | ${r.volume.toLocaleString()} |
| 50 日均量 | ${r.vol_ma50.toLocaleString()} |
| **量比** | **${r.vol_ratio.toFixed(2)}x** |

### ${sig(r.S)}

${r.S ? `量比 ${r.vol_ratio.toFixed(2)}x, 显著放量, 大资金确实在进场.` : `量比 ${r.vol_ratio.toFixed(2)}x, 成交量平常, 没有放量信号.`}

💡 **小白须知**: **"量价齐升才是真涨, 缩量上涨是假涨".**`;
}

function secL(r: Result): string {
  const th = r._cfg.rsThreshold, rs = r.rs_rating;
  return `## 第六道关：L - 这只股是行业领头吗？

**测什么**：这只股过去 1 年的涨幅, 在标杆股池里排第几 (0-99).

**为什么重要**：CAN SLIM 核心理念之一是 **"买领头羊"**.

**怎么算**：O'Neil 加权公式 \`40%×近3月 + 20%×6月 + 20%×9月 + 20%×12月\`, 在 ${r._cfg.universe.length} 只标杆股池里排名转 0-99.

**通过标准**：RS Rating ≥ **${th}**

| 指标 | 数值 |
|---|---:|
| **RS Rating** | **${rs == null ? "N/A" : rs} / 99** |

### ${sig(r.L)}

${r.L ? `属于领头羊级别的强势股 (≥${th}).` : `RS Rating ${rs == null ? "无法计算" : "只有 " + rs}, 弱于市场领头 (需 ≥${th}), 是减分项.`}

💡 **小白须知**: 别被"已经涨太多"误导. **80% 的最大涨幅股, 大涨前 RS Rating 就已很高**. 强者恒强.`;
}

function secChart(r: Result): string {
  const pre = r._cfg.curPrefix;
  const buy = r.pivot == null ? "" : `
### 买卖点参考

| 关键价位 | 价格 |
|---|---:|
| 当前价 | ${pre}${r.price} |
| Pivot (突破基准) | ${pre}${r.pivot} |
| 自动止损位 (-8%) | ${pre}${r.stop} |

💡 **小白须知**:
- **Pivot** = 之前盘整的高点, 突破即"买入信号".
- **止损 -8%** 是 O'Neil 的**铁律** —— 买入后跌破无条件卖出.
`;
  return `## 📈 图形分析与买卖点\n\n**当前形态**: ${r.base_pattern}\n${buy}`;
}

function secLearning(r: Result): string {
  const L: string[] = [];
  if (!r.M) L.push("**大盘环境是第一过滤器** — M 不过关, 其他都不用看, 直接空仓.");
  else L.push("**大盘 M 通过** 是开仓的前提. 牛市才入场, 熊市空仓.");
  if (r.score_tech >= 3 && r.score_fund === 0) L.push("**'故事股'的识别** — 图形漂亮但基本面差, 暴涨暴跌, 不适合长期持有.");
  if (r.C && (r._funda.q_eps_yoy ?? 0) >= 100) L.push("**警惕'基数效应'** — 几倍同比可能只是去年基数极低, 看绝对值.");
  if (!r.A && r._funda.annual_yoy_3y.length && Math.max(...r._funda.annual_yoy_3y) - Math.min(...r._funda.annual_yoy_3y) > 100)
    L.push("**利润稳定性比单年高增长更重要** — 这家公司利润大起大落, 不是优质成长股.");
  if (r.L && r.rs_rating != null && r.rs_rating >= 90) L.push(`**RS Rating ${r.rs_rating} 极强** — 强者恒强, 领头羊往往还能继续涨.`);
  else if (!r.L) L.push("**弱势股不要碰** — RS Rating 低意味着市场不青睐.");
  if (r.S && r.vol_ratio >= 2) L.push(`**放量突破很重要** — 今天成交量是平时的 ${r.vol_ratio.toFixed(1)} 倍.`);
  L.push("**8% 止损是铁律** — 任何买入位 -8% 必须无条件卖出.");
  return `## 🎓 这次分析教你的几件事\n\n${L.map((x, i) => `${i + 1}. ${x}`).join("\n")}`;
}

function secChecklist(benchName: string): string {
  return `## ✅ 你下次自己分析股票时的检查清单

### 第一步：先看大盘 (M)
- [ ] ${benchName} 现价 > 50 日均线？
- [ ] 50 日均线 > 200 日均线？
- [ ] **两条都满足 → 可买. 任一不满足 → 空仓.**

### 第二步：看基本面 (C + A)
- [ ] 最新一期盈利同比 ≥ 25%？
- [ ] 过去 3 年至少 2 年盈利同比 ≥ 25%？
- [ ] ROE ≥ 17%？

### 第三步：看技术面 (N + S + L)
- [ ] 股价距 52 周新高 ≤ 5%？
- [ ] 当日量 / 50 日均量 ≥ 1.5？
- [ ] 1 年涨幅跑赢${benchName}？

### 第四步：定买卖点
- [ ] 找出 pivot；-8% 止损价（×0.92），**跌破必卖**；涨 20-25% 考虑获利.

### 第五步：仓位控制
- [ ] 单只股 ≤ 总仓位 25%；同时持有 ≤ 5-8 只.`;
}

function secRisk(): string {
  return `## ⚠️ 风险提示

1. **本报告不构成投资建议**. CAN SLIM 是历史方法总结, 不保证未来收益.
2. **数据来自 Yahoo Finance, 可能有延迟或错误**. 重要决策前请用雪球二次确认.
3. **过去表现不代表未来**. 即使 6 项全过也可能亏钱, 永远做好止损准备.
4. **散户最大的敌人是自己**: 贪婪 + 恐惧 + 不止损.`;
}

export async function generateCanslimReport(
  rawSymbol: string, market: "us" | "hk", universeReturns: Record<string, number>,
): Promise<string> {
  const cfg = cfgFor(market);
  const sym = normalizeSymbol(rawSymbol, market);

  const [stock, bench, fin] = await Promise.all([fetchDaily(sym), fetchDaily(cfg.benchSym), fetchFin(sym)]);
  if (stock.close.length < 252) throw new Error(`历史数据不足 252 个交易日（仅 ${stock.close.length} 日，可能是新股）`);

  const bn = bench.close.length - 1;
  const mkt = { close: round2(bench.close[bn]), ma50: round2(ma(bench.close, 50, bn)), ma200: round2(ma(bench.close, 200, bn)) };
  const m_ok = bench.close[bn] > ma(bench.close, 50, bn) && ma(bench.close, 50, bn) > ma(bench.close, 200, bn);

  const i = stock.close.length - 1;
  const price = round2(stock.price || stock.close[i]);
  const high52 = Math.max(...stock.high.slice(-252));
  const dist = (price / high52 - 1) * 100;
  const volMa50 = ma(stock.volume, 50, i);
  const volRatio = stock.volume[i] / volMa50;
  const base = detectBase(stock);

  const myPerf = weightedPerf(stock.close);
  const allReturns = { ...universeReturns };
  if (myPerf != null) allReturns[sym] = myPerf;
  const rs = myPerf != null ? calcRsRating(myPerf, Object.values(allReturns)) : null;

  const funda = parseFundamentals(fin, market);
  const N = dist >= -5 || base.breakout;
  const S = volRatio >= 1.5;
  const L = rs != null && rs >= cfg.rsThreshold;
  const C = funda.C === true, A = funda.A === true;
  const score_tech = [N, S, L, m_ok].filter(Boolean).length;
  const score_fund = [C, A].filter(Boolean).length;

  const r: Result = {
    symbol: sym, name: stock.name, date: new Date(stock.dates[i] * 1000).toISOString().slice(0, 10), price,
    high_52w: round2(high52), dist_to_high: round2(dist), volume: stock.volume[i], vol_ma50: Math.round(volMa50),
    vol_ratio: round2(volRatio), rs_rating: rs, base_pattern: base.pattern, pivot: base.pivot, stop: base.stop,
    C, A, N, S, L, M: m_ok, score_tech, score_fund, score_total: score_tech + score_fund,
    _cfg: cfg, _market: mkt, _funda: funda,
  };

  const title = r.name ? `${sym}（${r.name}）` : sym;
  return [
    `# 📊 ${title} CAN SLIM 投资分析报告`,
    `**日期**: ${r.date}  ·  **现价**: ${cfg.curPrefix}${price}  ·  **总分**: ${r.score_total}/6\n`,
    "---\n",
    "## 🎯 一句话结论\n\n" + conclusion(r),
    "\n---\n",
    "## 📚 这份报告是什么？\n\n**CAN SLIM** 是美国传奇投资人 William O'Neil 总结的选股系统, 用 7 个字母代表 7 道考核 (我们覆盖其中 6 项). **过了所有考核的股票, 才是 O'Neil 系统认可的买点**.\n",
    "---\n",
    secM(r), "\n---\n", secC(r), "\n---\n", secA(r), "\n---\n",
    secN(r), "\n---\n", secS(r), "\n---\n", secL(r), "\n---\n",
    secChart(r), "\n---\n", secLearning(r), "\n---\n",
    secChecklist(cfg.benchName), "\n---\n", secRisk(),
    `\n---\n*报告由 AI 链 · 分析工具生成 · 数据源 Yahoo Finance · ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC*\n`,
  ].join("\n");
}
