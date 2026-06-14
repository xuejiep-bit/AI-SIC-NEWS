// 海龟交易分析报告（Curtis Faith《海龟交易法则》原版规则，S1/S2 双系统）。
// 移植自用户的 turtle_report.py + turtle_all.py，计算逻辑与报告文案保持一致；
// 数据源由 efinance（东方财富）改为 Yahoo Finance（海外可直连，覆盖美股+港股）。
// 海龟是纯价格策略：只需单只股票日线（ATR/唐奇安通道/加仓/仓位），无需财报或标杆池。

import { normalizeSymbol, fetchDaily, type Daily } from "./finance";

// 原版参数（turtle_all.py 配置区）
const ATR_PERIOD = 20;
const S1_HIGH = 20, S1_LOW = 10, S2_HIGH = 55, S2_LOW = 20;
const BREAKOUT_BUFFER = 1.0;
const STOP_MULT = 2;       // 2N 止损
const PYRAMID_STEP = 0.5;  // 每涨 0.5N 加一仓
const PYRAMID_MAX = 4;
const RISK_PER_TRADE = 0.01;
const STRENGTH_LOOKBACK = 63;
const US_ACCOUNT_DEFAULT = 510;   // 美元
const HK_ACCOUNT_DEFAULT = 4000;  // 港币
const FORMULA_VERSION = "turtle-1.1.0";

// 港股标的池整手手数（turtle_all.py HK_WATCHLIST）；池外默认 100 股
const HK_LOT: Record<string, number> = {
  "03088": 200, "02822": 200, "03033": 500, "03188": 100, "02832": 100,
  "01070": 2000, "00981": 500, "00999": 800, "00175": 1000, "03808": 500,
  "09863": 100, "01299": 200, "03339": 2000, "02382": 1000, "03993": 2000,
  "02388": 500, "02050": 1000, "09973": 100, "02400": 100, "00285": 500,
  "02252": 500, "09992": 100, "01651": 1000, "01133": 2000,
};

const round = (x: number, n = 2) => { const p = 10 ** n; return Math.round(x * p) / p; };
const fmt = (x: number | null | undefined, nd = 2) =>
  x == null || !isFinite(x) ? "—" : x.toLocaleString("en-US", { minimumFractionDigits: nd, maximumFractionDigits: nd });

// ── 指标计算（移植 calculate_indicators） ──────────────────
interface Ind { close: number[]; atr: number[]; high20: number[]; low10: number[]; high55: number[]; low20: number[];
  s1Break: boolean[]; s1Down: boolean[]; s2Break: boolean[]; s2Down: boolean[]; s1Skip: boolean[]; dates: number[] }

function indicators(d: Daily): Ind {
  const n = d.close.length;
  const tr: number[] = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    if (i === 0) { tr[i] = d.high[i] - d.low[i]; continue; }
    const pc = d.close[i - 1];
    tr[i] = Math.max(d.high[i] - d.low[i], Math.abs(d.high[i] - pc), Math.abs(pc - d.low[i]));
  }
  // Wilder ATR
  const atr: number[] = new Array(n).fill(NaN);
  if (n >= ATR_PERIOD) {
    let sum = 0; for (let i = 0; i < ATR_PERIOD; i++) sum += tr[i];
    atr[ATR_PERIOD - 1] = sum / ATR_PERIOD;
    for (let i = ATR_PERIOD; i < n; i++) atr[i] = (atr[i - 1] * (ATR_PERIOD - 1) + tr[i]) / ATR_PERIOD;
  }
  // 通道用「过去 N 个收盘（不含今日）」的极值
  const rollMaxShift = (arr: number[], w: number) => arr.map((_, i) => {
    if (i < w) return NaN;
    let m = -Infinity; for (let k = i - w; k < i; k++) m = Math.max(m, arr[k]); return m;
  });
  const rollMinShift = (arr: number[], w: number) => arr.map((_, i) => {
    if (i < w) return NaN;
    let m = Infinity; for (let k = i - w; k < i; k++) m = Math.min(m, arr[k]); return m;
  });
  const high20 = rollMaxShift(d.close, S1_HIGH), low10 = rollMinShift(d.close, S1_LOW);
  const high55 = rollMaxShift(d.close, S2_HIGH), low20 = rollMinShift(d.close, S2_LOW);

  const s1Break: boolean[] = [], s1Down: boolean[] = [], s2Break: boolean[] = [], s2Down: boolean[] = [];
  for (let i = 0; i < n; i++) {
    s1Break.push(isFinite(high20[i]) && d.close[i] > high20[i] * BREAKOUT_BUFFER);
    s1Down.push(isFinite(low10[i]) && d.close[i] < low10[i]);
    s2Break.push(isFinite(high55[i]) && d.close[i] > high55[i] * BREAKOUT_BUFFER);
    s2Down.push(isFinite(low20[i]) && d.close[i] < low20[i]);
  }
  // S1 跳过规则：上一次 S1 突破若未发生 2N 不利变动（盈利突破），则下一次 S1 突破被跳过
  const s1Skip: boolean[] = new Array(n).fill(false);
  const bidx: number[] = []; for (let i = 0; i < n; i++) if (s1Break[i]) bidx.push(i);
  for (let j = 0; j < bidx.length; j++) {
    const bi = bidx[j]; const entryClose = d.close[bi], entryAtr = atr[bi];
    if (!isFinite(entryAtr)) continue;
    const stopDrop = entryClose - 2 * entryAtr;
    let exitIdx = n; for (let k = bi + 1; k < n; k++) if (s1Down[k]) { exitIdx = k; break; }
    let had2n = false; for (let k = bi + 1; k < exitIdx; k++) if (d.close[k] < stopDrop) { had2n = true; break; }
    const profitable = !had2n;
    const next = j + 1 < bidx.length ? bidx[j + 1] : null;
    if (next != null && profitable) s1Skip[next] = true;
  }
  return { close: d.close, atr, high20, low10, high55, low20, s1Break, s1Down, s2Break, s2Down, s1Skip, dates: d.dates };
}

// ── 仓位（移植 calculate_position） ─────────────────────────
interface Pos {
  risk_amount: number; risk_per_share: number; raw_shares: number; stop_price: number;
  suggested_shares: number; cost: number; actual_risk: number; risk_pct: number;
  recommendation: string; rec_reason: string;
  // 港股两套方案
  lot_shares?: number; lot_cost?: number; lot_risk_pct?: number;
  odd_shares?: number; odd_cost?: number; odd_position_pct?: number; odd_risk_pct?: number;
}
function calcPosition(account: number, atr: number, lot: number, price: number, isUs: boolean): Pos {
  const risk_amount = account * RISK_PER_TRADE;
  const risk_per_share = STOP_MULT * atr;
  const raw_shares = risk_per_share > 0 ? risk_amount / risk_per_share : 0;
  const stop_price = price - STOP_MULT * atr;

  if (isUs) {
    let suggested = Math.max(0, Math.floor(raw_shares));
    let actual_risk = suggested * risk_per_share;
    let risk_pct = account > 0 ? (actual_risk / account) * 100 : 0;
    let cost = suggested * price;
    let recommendation: string, rec_reason: string;
    if (suggested === 0) {
      if (price > account) { recommendation = "❌ 1 股都买不起"; rec_reason = `1 股需 $${fmt(price)}，超账户 $${account}`; }
      else { recommendation = "❌ 风险过大"; rec_reason = "按 1% 风险算建议 0 股（ATR 太大）"; }
    } else if (risk_pct <= 1.5 && cost <= account) {
      recommendation = "🟢 标准海龟"; rec_reason = `买 ${suggested} 股，风险 ${fmt(risk_pct)}%，成本 $${fmt(cost, 0)}`;
    } else if (cost <= account && risk_pct <= 5) {
      recommendation = "🟡 风险偏高"; rec_reason = `买 ${suggested} 股，风险 ${fmt(risk_pct)}%，超 1% 但可控`;
    } else if (cost <= account) {
      recommendation = "🔴 风险过重"; rec_reason = `买 ${suggested} 股，风险 ${fmt(risk_pct)}%，过度集中`;
    } else {
      recommendation = "🟡 仅能 1 股"; rec_reason = "建议股数买不起，只能 1 股";
      suggested = 1; actual_risk = risk_per_share; risk_pct = (actual_risk / account) * 100; cost = price;
    }
    return { risk_amount, risk_per_share, raw_shares, stop_price, suggested_shares: suggested, cost, actual_risk, risk_pct, recommendation, rec_reason };
  }

  // 港股：整手 + 碎股两套
  const lots = Math.max(1, Math.floor(raw_shares / lot));
  const lot_shares = lots * lot, lot_risk = lot_shares * risk_per_share;
  const lot_risk_pct = (lot_risk / account) * 100, lot_cost = lot_shares * price, lot_aff = lot_cost <= account;
  const odd_shares = Math.max(1, Math.round(raw_shares));
  const odd_risk = odd_shares * risk_per_share, odd_risk_pct = (odd_risk / account) * 100;
  const odd_cost = odd_shares * price, odd_pos_pct = (odd_cost / account) * 100, odd_aff = odd_cost <= account;
  let recommendation: string, rec_reason: string;
  if (lot_aff && lot_risk_pct <= 1.5) { recommendation = "🟢 整手"; rec_reason = `整手 ${lot_shares} 股，风险 ${fmt(lot_risk_pct)}%，标准海龟`; }
  else if (lot_aff && lot_risk_pct <= 5) { recommendation = "🟡 整手（风险偏高）"; rec_reason = `整手风险 ${fmt(lot_risk_pct)}%，超 1% 但可控`; }
  else if (lot_aff) { recommendation = "🔴 整手（风险过重）"; rec_reason = `整手风险 ${fmt(lot_risk_pct)}%，过度集中`; }
  else if (odd_aff && odd_pos_pct >= 5) { recommendation = "🟢 碎股"; rec_reason = `碎股 ${odd_shares} 股，仓位 ${fmt(odd_pos_pct)}%，合适`; }
  else if (odd_aff && odd_pos_pct >= 2) { recommendation = "🟡 碎股（训练量偏小）"; rec_reason = `碎股仓位仅 ${fmt(odd_pos_pct)}%，练习效果打折`; }
  else if (odd_aff) { recommendation = "🔴 碎股（过轻）"; rec_reason = `碎股仓位仅 ${fmt(odd_pos_pct)}%，几乎没训练意义`; }
  else { recommendation = "❌ 跳过"; rec_reason = `碎股最少 1 股都需 ${fmt(odd_cost, 0)} 港币，超账户`; }
  return {
    risk_amount, risk_per_share, raw_shares, stop_price,
    suggested_shares: lot_aff ? lot_shares : odd_shares, cost: lot_aff ? lot_cost : odd_cost,
    actual_risk: lot_aff ? lot_risk : odd_risk, risk_pct: lot_aff ? lot_risk_pct : odd_risk_pct,
    recommendation, rec_reason,
    lot_shares, lot_cost, lot_risk_pct, odd_shares, odd_cost, odd_position_pct: odd_pos_pct, odd_risk_pct,
  };
}

function pyramidLevels(entry: number, atr: number) {
  const levels = [];
  for (let i = 0; i < PYRAMID_MAX; i++) {
    const e = entry + i * PYRAMID_STEP * atr;
    levels.push({ unit: i + 1, entry: round(e, 4), stop: round(e - STOP_MULT * atr, 4) });
  }
  return levels;
}

// ── 主流程 + 报告 ───────────────────────────────────────
export async function generateTurtleReport(rawSymbol: string, market: "us" | "hk", accountOverride?: number): Promise<string> {
  const sym = normalizeSymbol(rawSymbol, market);
  const isUs = market === "us";
  const cur = isUs ? "$" : "HK$";
  const account = accountOverride && accountOverride > 0 ? accountOverride : (isUs ? US_ACCOUNT_DEFAULT : HK_ACCOUNT_DEFAULT);
  const hkDigits = rawSymbol.replace(/\.HK$/i, "").replace(/\D/g, "");
  const lot = isUs ? 1 : (HK_LOT[hkDigits] || HK_LOT[hkDigits.padStart(5, "0")] || 100);

  const d = await fetchDaily(sym);
  if (d.close.length < ATR_PERIOD + 5) throw new Error(`历史数据不足（仅 ${d.close.length} 日，海龟至少需 ${ATR_PERIOD + 5} 日）`);
  const ind = indicators(d);
  const i = d.close.length - 1;
  const close = round(d.close[i], 2);
  const atr = ind.atr[i];
  if (!isFinite(atr) || atr <= 0) throw new Error("ATR 计算失败（数据异常）");
  const high20 = ind.high20[i], low10 = ind.low10[i], high55 = ind.high55[i], low20 = ind.low20[i];
  const s1Break = ind.s1Break[i], s2Break = ind.s2Break[i], s1Skip = ind.s1Skip[i];
  const s1Eff = s1Break && !s1Skip;
  const effSignal = s1Eff || s2Break;
  const pos = calcPosition(account, atr, lot, close, isUs);
  const pyramid = effSignal ? pyramidLevels(close, atr) : null;
  // 强势打分
  let strength: number | null = null;
  if (d.close.length >= STRENGTH_LOOKBACK + 1) strength = round((d.close[i] - d.close[i - STRENGTH_LOOKBACK]) / atr, 2);
  const distS1 = isFinite(high20) ? (high20 - close) / atr : null;
  const distS2 = isFinite(high55) ? (high55 - close) / atr : null;
  const date = new Date(ind.dates[i] * 1000).toISOString().slice(0, 10);
  const marketName = isUs ? "美股" : "港股";

  // headline
  const headline = s1Eff && s2Break ? "🟢 S1+S2 买入" : s1Eff ? "🟢 S1 买入" : s2Break ? "🟢 S2 买入"
    : s1Skip ? "🚫 S1 跳过（等 S2）" : (isFinite(low10) && close < low10 ? "🔴 退出区" : "⚪ 观望");

  // 一句话结论
  let concl: string;
  if (s1Eff && s2Break) concl = `🟢 **买入信号 — S1 + S2 同时突破（最强）**\n\n短期(20 日)和长期(55 日)突破同时出现，是海龟系统里最明确的入场信号. → **建议: 在现价 ${cur}${fmt(close)} 附近按计算仓位入场，止损设在 ${cur}${fmt(pos.stop_price)} (2N)，跌破立即无条件离场.**`;
  else if (s1Eff) concl = `🟢 **买入信号 — S1 (20 日突破)**\n\n价格突破过去 20 个交易日的最高点，短期趋势转强. → **建议: 在现价 ${cur}${fmt(close)} 附近入场，止损 ${cur}${fmt(pos.stop_price)} (2N).**`;
  else if (s2Break) concl = `🟢 **买入信号 — S2 (55 日突破)**\n\n价格突破过去 55 个交易日的最高点，长期趋势转强. → **建议: 在现价 ${cur}${fmt(close)} 附近入场，止损 ${cur}${fmt(pos.stop_price)} (2N).**`;
  else if (s1Skip) concl = `🟡 **触发了 S1，但按规则跳过 — 等 S2**\n\n价格虽突破 20 日高点，但上一次 S1 突破是「盈利突破」，原版海龟规则要求跳过这一次(过滤鞭打)，改等 55 日的 S2 突破. → **建议: 暂不入场，盯住 55 日高点 ${cur}${fmt(high55)}.**`;
  else if (isFinite(low10) && close < low10) concl = `🔴 **处于退出区 — 已跌破 10 日低点**\n\n价格跌破过去 10 个交易日最低点，这是 S1 的离场信号. 持有者按规则**离场**；空仓者此时**不是买点**. → **建议: 持仓者离场，空仓者观望.**`;
  else { const ds = distS1 != null ? `还差约 ${fmt(distS1, 1)} 个 N (≈ ${cur}${fmt(atr * distS1)}) 才突破 20 日高点` : ""; concl = `⚪ **暂无信号 — 观望**\n\n价格在通道中间，既没突破上轨(买点)，也没跌破下轨(卖点). 海龟是趋势跟随系统，**没有突破就不动手**. ${ds}. → **建议: 把 20 日高点 ${cur}${fmt(high20)} 设为提醒，突破再说.**`; }

  const atrPct = (atr / close) * 100;
  const s1Status = s1Break && s1Skip ? "🚫 触发但跳过（前次盈利突破）" : s1Break ? "🟢 已触发" : "— 未触发";
  const s2Status = s2Break ? "🟢 已触发" : "— 未触发";
  const sigVerdict = effSignal ? "### ✅ 有有效买入信号\n\n价格已突破上轨，进入下一步算仓位。"
    : s1Skip ? `### 🚫 S1 触发但被跳过\n\n按原版规则等 S2 (55 日突破)。现在离 S2 突破还差 ${fmt(distS2, 1)} 个 N。`
    : `### ⚪ 暂无信号\n\n价格还没突破任何上轨，按海龟纪律**不入场**。离 S1 突破约 ${fmt(distS1, 1)} 个 N。`;

  // 仓位表（美股/港股不同）
  let posTable: string;
  if (isUs) {
    posTable = `| 项目 | 数值 |
|---|---:|
| 账户规模 | ${cur}${fmt(account, 0)} |
| 单笔最大风险 (1%) | ${cur}${fmt(pos.risk_amount)} |
| 每股风险 (2N) | ${cur}${fmt(pos.risk_per_share)} |
| 理论股数 | ${fmt(pos.raw_shares, 1)} 股 |
| **建议股数** | **${pos.suggested_shares} 股** |
| 成本 | ${cur}${fmt(pos.cost, 0)} |
| 实际风险 | ${cur}${fmt(pos.actual_risk)} (${fmt(pos.risk_pct, 1)}%) |

> **执行建议**：${pos.recommendation} — ${pos.rec_reason}`;
  } else {
    posTable = `| 项目 | 数值 |
|---|---:|
| 账户规模 | ${cur}${fmt(account, 0)} |
| 单笔最大风险 (1%) | ${cur}${fmt(pos.risk_amount)} |
| 每股风险 (2N) | ${cur}${fmt(pos.risk_per_share)} |
| 理论股数 | ${fmt(pos.raw_shares, 1)} 股 |
| 整手 (每手 ${lot} 股) | ${pos.lot_shares} 股 · 成本 ${cur}${fmt(pos.lot_cost!, 0)} · 风险 ${fmt(pos.lot_risk_pct!, 1)}% |
| 碎股 | ${pos.odd_shares} 股 · 成本 ${cur}${fmt(pos.odd_cost!, 0)} · 仓位 ${fmt(pos.odd_position_pct!, 1)}% |

> **执行建议**：${pos.recommendation} — ${pos.rec_reason}

> ⚠️ 港股整手手数按标的池配置或默认 100 股估算，实盘以券商显示为准。`;
  }

  const pyramidSec = !pyramid
    ? "**规则**：每当价格在入场后再涨 **0.5N**，就加 1 个单位，最多加到 **4 个单位**；每加一次，整体止损同步上移 0.5N(锁住利润)。\n\n> ⚪ 当前没有有效入场信号，暂无加仓阶梯。等出现买入信号后，本节会给出 1→4 单位的具体加仓价。"
    : `**测什么**：海龟是「截断亏损、让利润奔跑」。趋势走对了就**顺势加仓**放大盈利，但有严格阶梯 —— 每涨 **0.5N** 加 1 单位，最多 **${PYRAMID_MAX} 个单位**。\n\n**为什么**：加仓让对的趋势赚更多；同时每次加仓都把整体止损上移，保证总风险始终≈2N。\n\n| 加仓单位 | 加仓价 | 加仓后整体止损 |\n|---|---:|---:|\n` +
      pyramid.map((p) => `| 第 ${p.unit} 单位 | ${cur}${fmt(p.entry)} | ${cur}${fmt(p.stop)} |`).join("\n") +
      "\n\n> 💡 按阶梯逐级加仓，每加一笔就把止损上移到对应价位。**只在浮盈时加，绝不在亏损时摊低成本。**";

  const strengthSec = strength == null ? "" : `## 📈 强势打分 (参考)\n\n**3 个月动量 ÷ N = ${fmt(strength)}** —— 用过去约 ${STRENGTH_LOOKBACK} 个交易日的涨幅除以 N。分数越大趋势越强；当前为${strength > 0 ? "正(近 3 月在涨，偏强势)" : "负(近 3 月在跌，偏弱势)"}。多只股票同日给出信号、资金有限时，**优先选分数高的**(原书第十章建议)。\n\n---\n`;

  return [
    `# 🐢 ${sym}（${marketName}） 海龟交易分析报告`,
    `**日期**: ${date}  ·  **现价**: ${cur}${fmt(close)}  ·  **综合信号**: ${headline}\n`,
    "---\n",
    `## 🎯 一句话结论\n\n${concl}`,
    "\n---\n",
    "## 📚 这份报告是什么？\n\n**海龟交易法则**是 1983 年传奇交易员 Richard Dennis 训练一群素人(代号「海龟」)用的一套**完全机械化**的趋势跟随系统 —— 不预测、不猜顶底，只做一件事: **价格创新高就跟进，回落到一定程度就离场**. 它的精髓不在选股，而在**严格的仓位和止损纪律**.\n\n这份报告会带你逐步走完海龟的动作: **① 量波动 (N) → ② 看信号 → ③ 算仓位 → ④ 设止损 → ⑤ 加仓金字塔**，每一步都讲清「为什么」。",
    "\n---\n",
    `## 第一步：N (ATR) — 这只股有多「晃」？\n\n**测什么**：用 **20 日 ATR (平均真实波幅)** 衡量这只股票每天大约波动多少钱。海龟把它叫 **N**，是后面**所有计算的地基**。\n\n**为什么重要**：波动大的股票同样的钱要少买点；波动小的可以多买点。用 N 统一衡量，不同价格、不同市场的股票才能放在同一把尺子下管理风险。\n\n| 指标 | 数值 | 含义 |\n|---|---:|---|\n| 现价 | ${cur}${fmt(close)} | 最新收盘 |\n| **N (20 日 ATR)** | **${cur}${fmt(atr)}** | 每天平均波动幅度 |\n| N / 现价 | ${fmt(atrPct, 1)}% | 波动占股价比例 |\n\n> 💡 这只股每天大约上下波动 **${cur}${fmt(atr)}** (约 ${fmt(atrPct, 1)}%)。下面每一步都会用到它。`,
    "\n---\n",
    `## 第二步：入场信号 — 突破了没有？\n\n**测什么**：海龟有两套并行的入场系统，任意一套发出信号就算买点。\n\n- **S1 (短期系统)**：价格 > 过去 **20 日**最高 → 买入\n- **S2 (长期系统)**：价格 > 过去 **55 日**最高 → 买入\n\n**为什么有两套**：S1 反应快但容易被假突破「鞭打」；S2 慢但更可靠。原版规则: **如果上一次 S1 突破是赚钱的，这次 S1 就跳过**，改用更稳的 S2 兜底。\n\n| 系统 | 突破线 | 现价 | 状态 |\n|---|---:|---:|---|\n| S1 · 20 日高 | ${cur}${fmt(high20)} | ${cur}${fmt(close)} | ${s1Status} |\n| S2 · 55 日高 | ${cur}${fmt(high55)} | ${cur}${fmt(close)} | ${s2Status} |\n\n${sigVerdict}`,
    "\n---\n",
    `## 第三步：仓位 — 该买多少股？\n\n**测什么**：海龟的核心纪律 —— **1 个「单位」的风险 = 账户的 1%**。\n\n**怎么算**：单位股数 = (账户 × 1%) ÷ (2N)。\n\n${posTable}`,
    "\n---\n",
    `## 第四步：止损 — 亏多少就认输？\n\n**测什么**：海龟的铁律是 **2N 止损** —— 价格从入场价回落 2 个 N，无条件离场。\n\n**为什么**：止损不是「看错了」，而是「风险预算用完了」。亏损控制在账户 1% 以内，连错 10 次也只伤 10%。\n\n| 项目 | 数值 |\n|---|---:|\n| 入场价 (现价) | ${cur}${fmt(close)} |\n| 2N | ${cur}${fmt(2 * atr)} |\n| **止损价** | **${cur}${fmt(pos.stop_price)}** |\n\n> 💡 一旦买入，立刻把止损单挂在 **${cur}${fmt(pos.stop_price)}**。跌到这个价就走，不要犹豫。`,
    "\n---\n",
    `## 第五步：加仓金字塔 — 赚了怎么加？\n\n${pyramidSec}`,
    "\n---\n",
    `## 第六步：退出 — 什么时候获利了结？\n\n**测什么**：除了 2N 止损，海龟还有**趋势反转退出**:\n\n- **S1 退出**：价格跌破过去 **10 日**最低 → 离场\n- **S2 退出**：价格跌破过去 **20 日**最低 → 离场\n\n**为什么**：趋势跟随不猜顶，涨到哪算哪；等价格自己回落跌破下轨，才确认趋势结束。\n\n| 退出系统 | 退出线 | 现价 | 触发? |\n|---|---:|---:|---|\n| S1 · 10 日低 | ${cur}${fmt(low10)} | ${cur}${fmt(close)} | ${isFinite(low10) && close < low10 ? "🔴 是" : "— 否"} |\n| S2 · 20 日低 | ${cur}${fmt(low20)} | ${cur}${fmt(close)} | ${isFinite(low20) && close < low20 ? "🔴 是" : "— 否"} |`,
    "\n---\n",
    strengthSec +
    "## ✅ 行动清单\n\n1. **只在突破时入场** —— 没突破上轨，一律不动手。\n2. **买入即挂止损** —— 止损单立刻挂在 2N 处，跌破无条件走。\n3. **仓位 = 账户 1% 风险** —— 永远不重仓单押。\n4. **顺势加仓、绝不摊平** —— 只在浮盈时按 0.5N 阶梯加。\n5. **机械执行** —— 海龟的优势全在纪律。",
    "\n---\n",
    "## ⚠️ 风险提示\n\n- 海龟是**趋势跟随**系统，在震荡市里会频繁小亏(被「鞭打」)，靠少数大趋势赚回来 —— **连续亏损是正常的**。\n- 历史回测显示海龟胜率约 40%、最大回撤 30-44%、衰落期可达 8-28 个月，**绝大多数人败在受不了连续亏损**。\n- 本报告由公开数据自动生成，**仅供学习，不构成投资建议**。实盘前请用模拟盘或极小仓位练习。",
    `\n---\n*报告由 AI 链 · 分析工具生成 · ${FORMULA_VERSION} · 数据源 Yahoo Finance · ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC*\n`,
  ].join("\n");
}
