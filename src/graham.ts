// Graham 价值投资分析报告（《聪明的投资者》第 14 章「防守型投资者 7 条铁律」）。
// 移植自用户的 graham_report.py（美股）/ graham_report_hk.py（港股），评分逻辑与报告文案保持一致；
// 数据源由 akshare/efinance（东方财富）改为 Yahoo Finance（海外可直连，覆盖美股+港股）。
// 与原版的口径差异（均在报告中如实标注）：
//   1) Yahoo 年报深度约 4 年（原 akshare 5-10 年）→ G3/G5 按实际数据评估；
//   2) 财报币种 ≠ 股价币种时（如腾讯 CNY/HKD）自动按汇率换算后再算 PE/PB（原版未处理）。

import { normalizeSymbol, fetchChart, fetchAnnuals, fetchSummaryExtra, fetchFx, type AnnualRow, type ChartData } from "./finance";

const fmtB = (v: number, cur: string) => (cur === "USD" ? `$${(v / 1e9).toFixed(2)}B` : `${(v / 1e8).toFixed(1)} 亿 ${cur}`);
const sig = (ok: boolean) => (ok ? "✅ 通过" : "❌ 不通过");

interface Check { ok: boolean; [k: string]: unknown }

// ── 7 条铁律 ────────────────────────────────────────────

// G1 规模：美股营收 ≥ $2B；港股营收 ≥ 50 亿（财报币种），与原版一致
function checkG1(annuals: AnnualRow[], market: "us" | "hk", finCur: string): Check {
  const rev = annuals[0]?.revenue;
  if (rev == null) return { ok: false, note: "数据缺失" };
  const threshold = market === "us" ? 2e9 : 5e9;
  const ok = rev >= threshold;
  const tName = market === "us" ? "≥$2B" : "≥50亿";
  return { ok, value: rev, note: `最新年度营收 ${fmtB(rev, finCur)} (${ok ? `达标 ${tName}` : "未达标 (Graham 要求大盘股)"})` };
}

// G2 财务稳健：流动比率 ≥ 2 且 资产负债率 ≤ 50%
function checkG2(annuals: AnnualRow[]): Check {
  const a = annuals[0];
  if (!a) return { ok: false, current_ratio: null, debt_ratio: null };
  const cr = a.currentAssets && a.currentLiabilities ? a.currentAssets / a.currentLiabilities : null;
  const dr = a.totalLiabilities && a.totalAssets ? (a.totalLiabilities / a.totalAssets) * 100 : null;
  const crOk = cr != null && cr >= 2;
  const drOk = dr != null && dr <= 50;
  return {
    ok: crOk && drOk,
    current_ratio: cr != null ? Math.round(cr * 100) / 100 : null,
    debt_ratio: dr != null ? Math.round(dr * 100) / 100 : null,
    cr_ok: crOk, dr_ok: drOk,
  };
}

// G3 利润稳定：现有年份全部盈利（Yahoo 深度约 4 年，原版要求至少 5 年/理想 10 年——报告中标注）
function checkG3(annuals: AnnualRow[]): Check {
  const rows = annuals.filter((a) => a.netIncome != null);
  const lossYears = rows.filter((a) => (a.netIncome as number) < 0).map((a) => a.year);
  const ok = rows.length >= 4 && lossYears.length === 0;
  return {
    ok,
    years_count: rows.length,
    loss_years: lossYears,
    earliest_year: rows.length ? rows[rows.length - 1].year : null,
    profits: rows.map((a) => ({ year: a.year, np: a.netIncome as number })),
  };
}

// G4 分红记录：连续 10+ 年不间断分红（分红史来自 Yahoo 全量数据，不受年报深度限制）
function checkG4(divs: ChartData["dividends"]): Check {
  if (!divs.length) return { ok: false, consecutive_years: 0, note: "无分红记录" };
  const years = [...new Set(divs.map((d) => d.date.getFullYear()))].sort((a, b) => a - b);
  let consecutive = 1;
  for (let i = years.length - 1; i > 0; i--) {
    if (years[i] - years[i - 1] === 1) consecutive++;
    else break;
  }
  // 分红窗口为近 16 年（见 finance.ts），连续年数到达窗口上限时标注"16+"
  const capped = consecutive >= years.length && years.length >= 15;
  return {
    ok: consecutive >= 10,
    consecutive_years: consecutive,
    capped,
    first_year: years[years.length - consecutive],
    last_year: years[years.length - 1],
    total_records: years.length,
  };
}

// G5 盈利增长：最早 vs 最近净利润对比，累计 ≥33%（原版 <6 年时退化为首尾对比，此处数据 4 年走同一退化路径）
function checkG5(annuals: AnnualRow[]): Check {
  const rows = annuals.filter((a) => a.netIncome != null);
  if (rows.length < 3) return { ok: false, note: `数据不足 (只有 ${rows.length} 年)` };
  const nps = rows.map((a) => a.netIncome as number); // 最新在前
  let early: number, recent: number;
  if (nps.length >= 6) {
    early = (nps.slice(-3).reduce((s, x) => s + x, 0)) / 3;
    recent = (nps.slice(0, 3).reduce((s, x) => s + x, 0)) / 3;
  } else {
    early = nps[nps.length - 1];
    recent = nps[0];
  }
  const growth = early > 0 ? (recent / early - 1) * 100 : null;
  return {
    ok: growth != null && growth >= 33,
    growth_pct: growth != null ? Math.round(growth * 10) / 10 : null,
    early_b: early, recent_b: recent,
    years_span: `${rows[rows.length - 1].year} → ${rows[0].year}`,
    years_count: rows.length,
  };
}

// G6 估值：PE ≤ 15（3 年平均 EPS；财报币种≠股价币种时先换算）
function checkG6(annuals: AnnualRow[], price: number, fx: number): Check {
  const eps = annuals.map((a) => a.eps).filter((x): x is number => x != null).slice(0, 3);
  if (!eps.length) return { ok: false, note: "EPS 数据缺失" };
  const avg = (eps.reduce((s, x) => s + x, 0) / eps.length) * fx; // 换算到股价币种
  const pe = avg > 0 ? price / avg : null;
  return {
    ok: pe != null && pe <= 15,
    pe: pe != null ? Math.round(pe * 100) / 100 : null,
    avg_eps_3y: Math.round(avg * 1000) / 1000,
    price,
  };
}

// G7 价格：PB ≤ 1.5（BPS = 净资产/股本，quoteSummary bookValue 兜底；币种换算同 G6）
function checkG7(annuals: AnnualRow[], price: number, fx: number, bookValueFallback: number | null): Check {
  const a = annuals[0];
  let bps: number | null = a?.equity && a?.shares ? a.equity / a.shares : null;
  if (bps == null || bps <= 0) bps = bookValueFallback;
  if (bps == null || bps <= 0) return { ok: false, pb: null, bps: null, note: "BPS 数据缺失" };
  bps = bps * fx;
  const pb = price / bps;
  return { ok: pb <= 1.5, pb: Math.round(pb * 100) / 100, bps: Math.round(bps * 100) / 100 };
}

function checkCombined(g6: Check, g7: Check): Check {
  const pe = g6.pe as number | null, pb = g7.pb as number | null;
  if (pe == null || pb == null) return { ok: false, product: null };
  const prod = pe * pb;
  return { ok: prod <= 22.5, product: Math.round(prod * 100) / 100 };
}

// ── 报告渲染（文案与原版一致，数据源相关说明已更新） ──────────

function sectionIntro(symbol: string, name: string, price: number, priceCur: string, finCur: string,
                      totalPass: number, market: "us" | "hk"): string {
  const title = name ? `${symbol}（${name}）` : symbol;
  const cn = 7;
  let verdict: string;
  if (totalPass === cn) {
    verdict = `🟢 **强候选 (${totalPass}/${cn})** — 满足 Graham 全部 7 条铁律\n\n这是 Graham 系统认可的「防守型投资者」可买入候选. 能同时通过 7 条非常罕见 —— 通常意味着这家公司被市场长期低估, 值得深入研究.`;
  } else if (totalPass >= 5) {
    verdict = `🟡 **接近合格 (${totalPass}/${cn})** — 仅 ${cn - totalPass} 项未达标\n\n大部分铁律通过, 但 Graham 原则上要求全部满足. 看下面哪项未过, 自己判断能否容忍.`;
  } else if (totalPass >= 3) {
    verdict = `🟠 **部分达标 (${totalPass}/${cn})** — 需谨慎\n\n只过了一半的铁律. 通常说明公司有明显短板 (估值过高, 财务杠杆, 或增长疲弱).`;
  } else {
    verdict = `🔴 **不符合 Graham 标准 (${totalPass}/${cn})**\n\n多数铁律未达标. 不是 Graham 系统的买入候选. 但**不等于公司差** —— 可能只是不适合这个体系. 比如 NVDA / TSLA 这类成长股估值高自然过不了 G6/G7, 但用 CAN SLIM 框架可能很优秀.`;
  }
  const cands = market === "us" ? "KO / JNJ / PG / WMT / XOM / PFE / VZ" : "银行 / 公用事业 / 消费龙头 (如 00939 建行、00168 青啤)";
  return `# 📚 ${title} Graham 价值投资分析报告

**日期**: ${new Date().toISOString().slice(0, 10)}  ·  **现价**: ${priceCur === "USD" ? "$" : priceCur + " "}${price}  ·  **财报币种**: ${finCur}

---

## 🎯 一句话结论

${verdict}

---

## 📚 这份报告基于什么？

**Benjamin Graham**（巴菲特的老师）在 1949 年出版的《聪明的投资者》第 14 章, 给"防守型投资者"列了 **7 条买入铁律**. 这是价值投资的奠基性框架: **以低于内在价值的价格, 买入稳健的成熟公司**, 长期持有.

跟 CAN SLIM (找强势成长股) 完全相反 —— Graham 找的是**安全、稳定、便宜**的公司. ${market === "us" ? "美股" : "港股"}的典型 Graham 候选: ${cands}.

下面逐项检查 7 条.
`;
}

function sectionG1(r: Check, market: "us" | "hk", finCur: string): string {
  const val = r.value as number | undefined;
  const valStr = val ? fmtB(val, finCur) : "—";
  const std = market === "us" ? "年营收 ≥ $2B (原书 1973 是 $100M, 通胀和经济规模调整后)" : "年营收 ≥ 50 亿 (按财报币种, 港股门槛)";
  return `## G1 规模够不够大？

**测什么**：公司年营收够不够大. Graham 不要散户碰小盘股, 因为小公司一遇风险就垮.

**为什么重要**：大公司通常有规模优势 + 抗风险能力, 适合"防守"型策略.

**通过标准**：${std}

| 指标 | 数值 |
|---|---:|
| 最新年度营收 | **${valStr}** |

### ${sig(r.ok)}

${r.note || ""}

💡 **小白须知**: 这条是"过滤小盘股"的, 不是为了找最大的. ${market === "us" ? "标普 500 成分股的中位数营收约 $80 亿, $2B 大致是\"中盘股以上\"的门槛." : "港股小盘股流动性差、信息披露弱, 这条过滤尤其重要."}
`;
}

function sectionG2(r: Check): string {
  const cr = r.current_ratio as number | null, dr = r.debt_ratio as number | null;
  return `## G2 财务稳不稳？

**测什么**：
1. **流动比率** = 流动资产 / 流动负债. ≥2 表示短期偿债能力强.
2. **资产负债率** ≤ 50%, 表示公司不过度依赖借贷.

**为什么重要**：财务杠杆高的公司一旦行业不景气, 容易资金链断裂. Graham 要的是**晚上能睡好觉的稳健公司**.

**通过标准**：流动比率 ≥ 2 **且** 资产负债率 ≤ 50%

| 指标 | 数值 | 判定 |
|---|---:|---|
| 流动比率 | **${cr ?? "—"}** | ${r.cr_ok ? "✅ ≥2" : "❌ <2"} |
| 资产负债率 | **${dr != null ? dr + "%" : "—"}** | ${r.dr_ok ? "✅ ≤50%" : "❌ >50%"} |

### ${sig(r.ok)}

${r.ok ? "两项均达标." : "至少一项不达标. 大公司很多用杠杆增厚 ROE (尤其银行/工业/能源), 流动比率 <2 普遍存在."}

💡 **小白须知**: 科技龙头通常财务超稳健 (AAPL/MSFT/GOOGL 流动比率都 >1.5, 现金堆积如山). 反过来, 看到流动比率 <1 + 负债率 >70% 要警惕 —— 经典的"高杠杆陷阱". 注意: **银行股的流动比率/资产负债率口径特殊**, 这两条对银行参考意义有限.
`;
}

function sectionG3(r: Check, finCur: string): string {
  const profits = (r.profits as { year: string; np: number }[]) || [];
  const unit = finCur === "USD" ? "B$" : "亿 " + finCur;
  const div = finCur === "USD" ? 1e9 : 1e8;
  const rows = profits.map((p) => `| ${p.year} | ${(p.np / div) >= 0 ? "+" : ""}${(p.np / div).toFixed(2)} |`).join("\n");
  const loss = (r.loss_years as string[]) || [];
  return `## G3 利润稳不稳？

**测什么**：可查年份内, 公司是不是**年年盈利**, 有没有亏损过.

**为什么重要**：一家从未亏损的公司, 说明商业模式扛得住周期. **盈利能力的稳定性比单年高增长更重要**.

**通过标准**：现有数据全部无亏损 (Graham 原书要求 10 年; Yahoo 年报深度约 4 年, 按实际数据评估并如实标注).

| 财年 | 归母净利润 (${unit}) |
|---|---:|
${rows || "| — | 数据缺失 |"}

### ${sig(r.ok)}

数据覆盖 ${r.years_count} 年 (${r.earliest_year} → 最近), ${loss.length ? `⚠️ 有亏损年: ${loss.join(", ")}` : "全部盈利, 无亏损年."}

⚠️ **数据深度说明**: 本报告数据源 (Yahoo Finance) 的年报通常覆盖最近 4 年, 比 Graham 要求的 10 年短. 4 年全部盈利是**必要不充分**信号 —— 建议自己再翻一眼公司 10-K/年报确认更早年份.

💡 **小白须知**: 这条是 Graham 7 条里**最容易过**的 —— 大部分成熟蓝筹都能过. 过不了的多是周期股 (航空 / 能源 / 半导体) 或长期亏损的故事股.
`;
}

function sectionG4(r: Check): string {
  const cons = (r.consecutive_years as number) || 0;
  let body: string;
  if (r.note && cons === 0) {
    body = `### ⚠️ ${r.note}\n\n不分红的公司很多 (尤其科技股 GOOGL/AMZN/TSLA), 这不一定说明公司差, 但 Graham 系统会**直接排除**它们 —— 因为他认为分红是「对股东负责」的硬证据.`;
  } else {
    body = `| 指标 | 数值 |
|---|---:|
| 最近连续分红年数 | **${cons}${r.capped ? "+" : ""} 年**${r.capped ? " (达统计窗口上限, 实际可能更长)" : ""} |
| 起始年份 | ${r.first_year}${r.capped ? " (窗口内)" : ""} |
| 最近分红年份 | ${r.last_year} |
| 近 16 年有分红的年份数 | ${r.total_records} 年 |

### ${sig(r.ok)}

${r.ok ? "连续分红 ≥10 年, 通过." : `连续分红仅 ${cons} 年, 未达 10 年门槛.`}`;
  }
  return `## G4 分红记录稳不稳？

**测什么**：公司是否连续多年**不间断**分红.

**为什么重要**：Graham 视分红为"管理层对股东负责"的最强证据. 能持续分红 10 年以上, 说明:
- 现金流稳定
- 管理层愿意把钱分给股东 (而不是乱投资)
- 不是靠融资续命的伪成长股

**通过标准**：连续 10+ 年不间断分红 (原书 20 年, 此处放宽)

${body}

💡 **小白须知**: 美股有个特殊概念叫 **"Dividend Aristocrats" (分红贵族)** —— 连续 25 年+ 提高分红的公司, 全市场只有 60+ 只, 都是 Graham 的天然候选. 包括 KO / PG / JNJ / MCD / WMT / MMM. 分红历史数据源: Yahoo Finance (全量历史, 覆盖完整).
`;
}

function sectionG5(r: Check, finCur: string): string {
  if (r.note) return `## G5 利润有没有持续增长？\n\n### ❌ 不通过\n\n${r.note}\n`;
  const div = finCur === "USD" ? 1e9 : 1e8;
  const unit = finCur === "USD" ? "B" : "亿";
  const growth = r.growth_pct as number | null;
  const n = r.years_count as number;
  return `## G5 利润有没有持续增长？

**测什么**：拿**最早年份净利润**对比**最近年份净利润**, 看累计涨幅.

**为什么重要**：哪怕是稳健公司, 也得有点儿成长. 累计 33% 增长是 Graham 设的最低底线 (原书按 10 年跨度 ~年化 3%, 仅比通胀略高).

**通过标准**：累计增长 ≥ 33%

| 指标 | 数值 |
|---|---:|
| 最早年份净利润 | ${((r.early_b as number) / div).toFixed(2)}${unit} |
| 最近年份净利润 | ${((r.recent_b as number) / div).toFixed(2)}${unit} |
| 累计增长 | **${growth != null ? (growth >= 0 ? "+" : "") + growth + "%" : "—"}** |
| 时间跨度 | ${r.years_span} (${n} 年) |

### ${sig(r.ok)}

💡 **小白须知**: 这里用**净利润总额**而非 EPS — EPS 会受拆股/回购扰动, 净利润增长更贴近 Graham 原意 — 公司「盈利能力」是否在增长. ⚠️ 当前数据跨度仅 ${n} 年 (Yahoo 年报深度限制), 比原书 10 年窗口短, 33% 门槛对短窗口偏严格, 结果仅供参考.
`;
}

function sectionG6(r: Check, priceCur: string, fxNote: string): string {
  return `## G6 估值合理吗？(PE)

**测什么**：当前股价 / 过去 3 年平均 EPS = **PE (市盈率)**.

**为什么重要**：PE 是衡量"贵不贵"的最常用指标. **PE 15 倍**意味着按当前盈利能力, 投资 15 年回本. Graham 认为再高就是为成长付溢价了, 不属于"防守"型投资.

**通过标准**：PE ≤ 15 (用 3 年平均利润, 不用单年, 避免周期干扰)

| 指标 | 数值 |
|---|---:|
| 当前股价 | ${priceCur === "USD" ? "$" : priceCur + " "}${r.price} |
| 3 年平均 EPS${fxNote ? " (已换算)" : ""} | ${r.avg_eps_3y} ${priceCur} |
| **PE** | **${r.pe ?? "—"}** |

### ${sig(r.ok)}

${r.ok ? "PE 合理, 价格不贵." : "PE 超过 15, 估值偏贵 —— 不符合 Graham 防守型门槛."}${fxNote}

💡 **小白须知**: PE 这条 + 下面 PB 这条, 是 Graham 7 条里**最难过**的两道关. 美股长期估值偏高 (尤其科技股 PE 普遍 25-40), 能找到 PE<15 的优质公司大多在: **银行/保险, 能源, 传统消费, 制药**. **Graham 的精髓就是只在"好公司打折时"买**.
`;
}

function sectionG7(r: Check, gc: Check, priceCur: string, fxNote: string): string {
  return `## G7 价格不离谱吗？(PB / Graham 公式)

**测什么**：股价 / 每股净资产 = **PB (市净率)**. 衡量"以多少倍账面价值在买这家公司".

**为什么重要**：PE 看的是利润, PB 看的是**资产**. 两者结合才能避免被"虚高利润"骗 (利润可粉饰, 净资产较难).

**通过标准**：
- **严格版**: PB ≤ 1.5
- **Graham 公式** (兜底): PE × PB ≤ 22.5 — 允许某一项超标, 只要另一项足够低

| 指标 | 数值 |
|---|---:|
| 每股净资产 BPS${fxNote ? " (已换算)" : ""} | ${r.bps ?? "—"} ${priceCur} |
| **PB** | **${r.pb ?? "—"}** |
| **Graham 公式 PE × PB** | **${gc.product ?? "—"}** (${gc.ok ? "≤22.5 ✅" : ">22.5 ❌"}) |

### ${sig(r.ok)} (严格 PB ≤ 1.5)

${r.ok ? "PB 严格达标." : `PB 超过 1.5${gc.ok ? "，但 Graham 综合公式 PE × PB ≤ 22.5 还能过 — 算放宽达标." : "，且综合公式也未达标."}`}

💡 **小白须知**: PB < 1 称为"破净", 意味着市场认为公司还不如清算掉值钱. **破净 + 稳定盈利**就是 Graham 最爱的"烟蒂股". 港股的破净股比美股多得多 (银行/地产/公用一大片), 但注意区分"便宜"和"价值陷阱".
`;
}

function sectionLearning(checks: Record<string, Check>): string {
  const lessons: string[] = [];
  if (!checks.G1.ok) lessons.push("**小盘股有更高风险** — Graham 让散户避开. 你能承受多大波动, 决定了能否触碰小盘股.");
  if (!checks.G2.ok) lessons.push("**大公司财务杠杆很常见** — 银行 / 公用 / 工业普遍 <2 流动比率. 看 <1 警惕, >2 加分.");
  if (checks.G3.ok) lessons.push("**多年不亏 = 抗周期能力强** — 这是公司质量的硬指标, 比单年利润更重要.");
  else if ((checks.G3.loss_years as string[])?.length) lessons.push(`**注意亏损年份 ${(checks.G3.loss_years as string[]).join(", ")}** — 这些年份发生了什么? 是行业危机, 还是公司自身问题?`);
  if (checks.G4.ok) lessons.push("**连续 10 年+ 分红** — 这是管理层质量的最强信号.");
  else if (!(checks.G4.consecutive_years as number)) lessons.push("**不分红很常见** — 科技股 (GOOGL / AMZN / TSLA) 长期不分红, Graham 系统会直接排除它们, 但不等于公司差, 只是不适合这个体系.");
  if (!checks.G6.ok && !checks.G7.ok) lessons.push("**估值过高的好公司, Graham 也不买** — 这是价值投资和成长投资最大的区别. 价值派宁可空仓等便宜机会.");
  lessons.push("**Graham 7 条是'最低门槛', 不是'买点'** — 都过了不等于明天就涨, 但意味着你买在了一个**安全的价格**.");
  lessons.push("**Graham 和 CAN SLIM 是两套完全不同的逻辑** — 同一只票在两个系统里得分会差距很大. 关键是**先选系统, 再选股**.");
  return `## 🎓 这次分析教你的几件事\n\n${lessons.map((x, i) => `${i + 1}. ${x}`).join("\n")}\n`;
}

function sectionChecklist(): string {
  return `## ✅ 你下次自己分析价值股时的检查清单

把下面这个清单存起来, 看到任何成熟公司都按这个顺序检查:

### 第一步: 公司基础面 (G1-G4)
- [ ] 营收够大 (避开小盘股)
- [ ] 流动比率 ≥ 2 (短期偿债能力)
- [ ] 资产负债率 ≤ 50%
- [ ] 近 10 年没亏过钱
- [ ] 连续 10+ 年不间断分红

### 第二步: 成长底线 (G5)
- [ ] 近 10 年盈利累计增长 ≥ 33% (年化 ~3%, 比通胀略高)

### 第三步: 估值合理 (G6 + G7) ⭐ 关键
- [ ] PE ≤ 15 (用 3 年平均利润)
- [ ] PB ≤ 1.5 **或** PE × PB ≤ 22.5 (Graham 公式)

### 第四步: 安全边际
- [ ] 估算公司**内在价值**, 买价 ≤ 内在价值 × 0.7 (留 30% 折扣作安全垫)
- [ ] 这是 Graham 最核心的概念 —— "margin of safety"

### 第五步: 持有策略
- [ ] **长期持有 3-10 年**, 等市场重新发现价值
- [ ] **分散持仓**: 单股不超 10%, 至少 10-30 只
- [ ] **不止损** (跟 CAN SLIM 相反): 价格越跌越便宜, 但前提是公司基本面没变
`;
}

function sectionRisk(): string {
  return `## ⚠️ 风险提示

1. **本报告不构成投资建议**. Graham 框架是 1949 年的产物, 部分条款 (如 20 年分红史) 在今天的科技股几乎无法严格满足.
2. **数据源**: 行情/财报/分红均来自 Yahoo Finance. 财报数据可能有 1-2 个季度延迟.
3. **数据深度**: Yahoo 年报通常覆盖最近 4 年, 短于 Graham 要求的 10 年窗口. G3/G5 按实际数据评估, 结论强度相应打折.
4. **Graham 框架 ≠ 万能**: 它擅长找"便宜的稳健公司", 但会错过所有真正的高速成长股 (亚马逊/英伟达早年都不符合). 知道工具的边界.
5. **价值投资的核心是耐心**: Graham 说过"市场短期是投票机, 长期是称重机". 散户最大的失败不是选错股, 而是没有耐心持有.
`;
}

// ── 主流程 ───────────────────────────────────────────────

export async function generateGrahamReport(rawSymbol: string, market: "us" | "hk"): Promise<string> {
  const sym = normalizeSymbol(rawSymbol, market);
  const [chart, annuals, extra] = await Promise.all([
    fetchChart(sym),
    fetchAnnuals(sym),
    fetchSummaryExtra(sym),
  ]);
  if (!annuals.length) throw new Error("无法获取年度财报数据（代码不存在或无财报覆盖）");

  // 币种处理：财报币种 ≠ 股价币种时（如腾讯 CNY→HKD）拉汇率换算 EPS/BPS
  const finCur = extra.financialCurrency || chart.currency;
  let fx = 1;
  let fxNote = "";
  if (finCur !== chart.currency) {
    const rate = await fetchFx(finCur, chart.currency);
    if (rate) {
      fx = rate;
      fxNote = `\n\n> 💱 注: 该公司财报以 ${finCur} 计价、股价以 ${chart.currency} 计价, EPS/BPS 已按汇率 ${rate.toFixed(4)} 换算后再计算 PE/PB.`;
    } else {
      fxNote = `\n\n> ⚠️ 注: 财报币种 (${finCur}) 与股价币种 (${chart.currency}) 不同且汇率获取失败, PE/PB 可能存在币种偏差.`;
    }
  }

  const price = Math.round(chart.price * 100) / 100;
  const checks: Record<string, Check> = {
    G1: checkG1(annuals, market, finCur),
    G2: checkG2(annuals),
    G3: checkG3(annuals),
    G4: checkG4(chart.dividends),
    G5: checkG5(annuals),
    G6: checkG6(annuals, price, fx),
    G7: checkG7(annuals, price, fx, extra.bookValue),
  };
  const combined = checkCombined(checks.G6, checks.G7);
  const totalPass = Object.values(checks).filter((c) => c.ok).length;

  return [
    sectionIntro(sym, chart.name, price, chart.currency, finCur, totalPass, market),
    "\n---\n",
    sectionG1(checks.G1, market, finCur), "\n---\n",
    sectionG2(checks.G2), "\n---\n",
    sectionG3(checks.G3, finCur), "\n---\n",
    sectionG4(checks.G4), "\n---\n",
    sectionG5(checks.G5, finCur), "\n---\n",
    sectionG6(checks.G6, chart.currency, fxNote), "\n---\n",
    sectionG7(checks.G7, combined, chart.currency, fxNote), "\n---\n",
    sectionLearning(checks), "\n---\n",
    sectionChecklist(), "\n---\n",
    sectionRisk(),
    `\n---\n*报告由 AI 链 · 分析工具生成 · 数据源 Yahoo Finance · ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC*\n`,
  ].join("\n");
}
