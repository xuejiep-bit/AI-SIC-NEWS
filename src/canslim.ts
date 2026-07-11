// CAN SLIM teaching-style analysis report (William O'Neil's stock-selection system, covering the 6 letters C/A/N/S/L/M).
// Ported from the user's canslim_scan.py / canslim_scan_hk.py + canslim_report*.py; the scoring logic and report copy are kept consistent.
// The data source was changed from akshare (East Money) to Yahoo Finance (directly reachable overseas, covers both US and HK stocks).
// Differences from the original (noted in the report):
//   1) The RS benchmark universe reuses the same batch of stocks as the original scripts; data comes from Yahoo, weighting formula unchanged;
//   2) The HK L threshold uses the scan's value of 87 (the report copy is also standardized to 87, to avoid contradicting the original report's copy of 80);
//   3) Quarterly YoY is now computed from Yahoo's quarterly series as "latest period vs. ~1 year earlier", auto-adapting for companies that report semi-annually;
//   4) Distribution days / 4-stage and other scan-CLI-specific dimensions are not included (the original .md report never output them either).

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
// HK benchmark universe trimmed to 42 names (Cloudflare free tier allows ≤50 subrequests per request; keeps representatives from tech/finance/consumer/pharma/utilities)
const RS_UNIVERSE_HK = [
  "00700", "09988", "03690", "01810", "09618", "00992", "00981", "02382",
  "01024", "09999", "00285", "06618", "09888", "09660", "03888",
  "00939", "01398", "00005", "02318", "02628", "03968", "00388", "02388", "01288", "03328",
  "00175", "01211", "02331", "02020", "09633", "00669", "06862", "02688", "01066", "09926",
  "01093", "01177", "06160", "02616",
  "00941", "00006", "00883",
];

export function cfgFor(market: "us" | "hk"): Cfg {
  return market === "hk"
    ? { market, benchSym: "^HSI", benchName: "Hang Seng Index", curPrefix: "HK$ ", rsThreshold: 87, universe: RS_UNIVERSE_HK }
    : { market, benchSym: "SPY", benchName: "S&P 500", curPrefix: "$", rsThreshold: 80, universe: RS_UNIVERSE_US };
}

const round2 = (x: number) => Math.round(x * 100) / 100;
const sig = (ok: boolean) => (ok ? "✅ Pass" : "❌ Fail");

const ma = (a: number[], n: number, i: number) => {
  if (i + 1 < n) return NaN;
  let s = 0; for (let k = i - n + 1; k <= i; k++) s += a[k];
  return s / n;
};

// IBD weighted 4-stage performance: 40%×3mo + 20%×6mo + 20%×9mo + 20%×12mo (requires ≥252 days)
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

// YoY: latest period vs. ~1 year earlier (±75-day matching, compatible with quarterly / semi-annual reports)
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
  if (len < lb + 5) return { pattern: "Insufficient data", breakout: false };
  const s = len - (lb + 5);
  let pivot = -Infinity, pIdx = s;
  for (let i = s; i < len; i++) if (d.high[i] > pivot) { pivot = d.high[i]; pIdx = i; }
  const afterLen = len - pIdx;
  const today = d.close[len - 1];
  const stop = round2(today * 0.92);
  if (afterLen < 10) return { pattern: "Just made a new high, no base formed yet", pivot: round2(pivot), breakout: false, stop };
  let baseLow = Infinity; for (let i = pIdx; i < len; i++) baseLow = Math.min(baseLow, d.low[i]);
  const depth = (1 - baseLow / pivot) * 100;
  const breakout = today > pivot * 0.99;
  let pattern: string;
  if (breakout) pattern = (depth >= 8 && depth <= 35) ? `🟢 Base breakout (depth ${depth.toFixed(1)}%, cup-with-handle-like)` : `🟢 New-high breakout (base depth ${depth.toFixed(1)}%)`;
  else if (today > baseLow && today / pivot > 0.92) pattern = `🟡 Near pivot ${round2(pivot)} (${((today / pivot - 1) * 100).toFixed(1)}%)`;
  else pattern = `⚪ Far from pivot (-${((1 - today / pivot) * 100).toFixed(1)}%)`;
  return { pattern, pivot: round2(pivot), depth: round2(depth), breakout, stop };
}

interface Funda {
  C: boolean | null; A: boolean | null;
  q_eps_yoy: number | null; q_rev_yoy: number | null; annual_yoy_3y: number[]; roe: number | null;
}
function parseFundamentals(fin: { annual: FinPoint[]; quarterly: FinPoint[] }, market: "us" | "hk"): Funda {
  const out: Funda = { C: null, A: null, q_eps_yoy: null, q_rev_yoy: null, annual_yoy_3y: [], roe: null };
  const pf: keyof FinPoint = market === "hk" ? "netIncome" : "eps"; // US uses EPS, HK uses net income to shareholders

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

// Fetch the RS benchmark universe's performance (called by index.ts with same-day caching, to avoid re-fetching dozens of names on every report)
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
  if (!r.M) return `🔴 **Poor market environment; overall recommendation is to stay in cash**\n\n${r._cfg.benchName} is not in an uptrend, and in this environment even the strongest stocks struggle to rise. O'Neil's most important advice for retail investors: in a bear market, **buy nothing** and protect your capital. → **Recommendation: regardless of how this stock looks, do not enter for now.**`;
  if (total === 6) return `🟢 **High priority (${total}/6)**\n\nThis stock satisfies all 6 CAN SLIM tests at once — good fundamentals + strong technicals + supportive market. This "everything aligned" combination is rare.\n\n→ **Recommendation: buy near the pivot point, with a strict -8% stop-loss.**`;
  if (tech === 4 && !r.A) return `🟡 **Cautious watch — a classic "story stock" (${total}/6)**\n\nThe chart looks very attractive (technicals 4/4), but the company's **profits have swung wildly over the past 3 years** — this is not a steadily growing business. O'Neil calls this "strong chart, weak fundamentals" type a **story stock**: it may rise fast short-term but carries high long-term risk.\n\n→ **Recommendation: add to watchlist, do not buy immediately. Wait until earnings improve.**`;
  if (total === 5) {
    const missing = (["C", "A", "N", "S", "L", "M"] as const).filter((k) => !r[k])[0];
    return `🟢 **Strong candidate (${total}/6)** — only **${missing}** below threshold\n\nA near-perfect CAN SLIM candidate. A single miss is not necessarily fatal; see the analysis below for specifics.\n\n→ **Recommendation: watch closely. If ${missing} is a short-term issue, consider a small starter position.**`;
  }
  if (total === 4) return `🟡 **Watchlist (${total}/6)**\n\nWorth noting but not yet time to act. Usually this means either the fundamentals or the technicals aren't strong enough; wait for a clearer signal.\n\n→ **Recommendation: add to watchlist and rescan periodically.**`;
  return `🔴 **Skip for now (${total}/6)**\n\nInsufficient signals — most CAN SLIM conditions are not met. This does not mean the stock is "bad", only that it is **not currently at an O'Neil-system buy point**.\n\n→ **Recommendation: skip it and spend your time on clearer opportunities.**`;
}

function secM(r: Result): string {
  const c = r._cfg, m = r._market, isHk = c.market === "hk";
  const unit = isHk ? " pts" : "", pre = isHk ? "" : "$";
  return `## Test 1: M - Market environment ⭐ most important

**What it tests**: are we in a "bull market" or a "bear market"?

**Why it matters**: research shows **75% of stocks follow the broad market**. When the market falls, even a company with great results struggles to rise.

**How it's computed**: ${c.benchName}${isHk ? " (HSI)" : " (SPY ETF)"} must satisfy both: ① current price > 50-day MA ② 50-day MA > 200-day MA.

| Metric | Value |
|---|---:|
| ${c.benchName} current price | ${pre}${m.close}${unit} |
| 50-day MA | ${pre}${m.ma50}${unit} |
| 200-day MA | ${pre}${m.ma200}${unit} |

### ${sig(r.M)}

${r.M ? `${c.benchName} holds above both moving averages, with the 50-day MA above the 200-day MA — a textbook bull-market setup and a good time to open positions.` : `${c.benchName} does not meet the uptrend conditions; the market environment is poor. Stay in cash and buy nothing.`}

💡 **For beginners**: **this is O'Neil's most important advice for retail investors** — in a bear market 75% of stocks fall. **When you're unsure, cash is the best strategy.**`;
}

function secC(r: Result): string {
  const isHk = r._cfg.market === "hk";
  const word = isHk ? "net income to shareholders" : "earnings per share (EPS)", period = isHk ? "reporting period" : "quarter";
  const f = r._funda;
  if (f.q_eps_yoy == null) {
    return `## Test 2: C - Did earnings in the latest ${period} surge?

**What it tests**: how much the company's ${word} in its latest ${period} grew versus the same period a year ago.
**Pass criteria**: YoY growth ≥ +25%

### ⚠️ Data missing

Yahoo does not provide comparable ${period} earnings data for this stock (it may be newly listed, or have an unusual reporting frequency). → **Recommendation**: check the latest YoY earnings manually on a service like Xueqiu.`;
  }
  const eps = f.q_eps_yoy;
  const warn = eps >= 100 ? `\n⚠️ **Beginner note**: ${eps.toFixed(0)}% looks dramatic — beware the **"base effect"**: if last year's earnings were extremely low, the percentage gets exaggerated. Check the **absolute** earnings figure to confirm.\n` : "";
  const rev = f.q_rev_yoy != null ? `\n**Extra reference — revenue YoY ${f.q_rev_yoy >= 0 ? "+" : ""}${f.q_rev_yoy.toFixed(1)}%** (${f.q_rev_yoy >= 25 ? "good" : "moderate"}). O'Neil wants revenue accelerating too, so that earnings are solid.` : "";
  return `## Test 2: C - Did ${word} in the latest ${period} surge?

**What it tests**: how much the company's ${word} in its **latest ${period}** grew versus the same period a year ago.

**Why it matters**: a sudden acceleration in results is often the start of a big move.

**Pass criteria**: YoY growth ≥ **+25%** (O'Neil recommends ideally ≥40%).

| Metric | Value |
|---|---:|
| Latest ${period} earnings YoY | **${eps >= 0 ? "+" : ""}${eps.toFixed(1)}%** |
${f.q_rev_yoy != null ? `| Latest ${period} revenue YoY | ${f.q_rev_yoy >= 0 ? "+" : ""}${f.q_rev_yoy.toFixed(1)}% |` : ""}

### ${sig(r.C)}

**Earnings YoY ${eps >= 0 ? "+" : ""}${eps.toFixed(1)}%**, ${r.C ? "meets the threshold (≥25%)" : "below threshold (requires ≥25%)"}
${warn}${rev}`;
}

function secA(r: Result): string {
  const word = r._cfg.market === "hk" ? "net income" : "EPS";
  const f = r._funda, yoys = f.annual_yoy_3y;
  if (!yoys.length) {
    return `## Test 3: A - The company's growth over the past 3 years

**What it tests**: whether the company's ${word} grew steadily each year over the past 3 years.
**Pass criteria**: ${word} YoY ≥25% in at least 2 of 3 years

### ⚠️ Data missing

Yahoo does not provide enough annual-report data; please check manually.`;
  }
  const nowY = new Date().getFullYear();
  const rows = yoys.map((y, i) => `| ${nowY - i - 1} | ${y >= 0 ? "+" : ""}${y.toFixed(1)}% | ${y >= 25 ? "✅ Pass" : "❌ Fail"} |`).join("\n");
  const okc = yoys.filter((x) => x >= 25).length;
  const volatile = Math.max(...yoys) - Math.min(...yoys) > 100
    ? `\n⚠️ **Important observation**: this company's annual profits **swing sharply** (high ${Math.max(...yoys) >= 0 ? "+" : ""}${Math.max(...yoys).toFixed(1)}%, low ${Math.min(...yoys).toFixed(1)}%). O'Neil favors **companies with "steady acceleration"**, not wild swings.\n` : "";
  const roe = f.roe != null
    ? `\n### Bonus item — ROE\n\n**ROE = ${f.roe.toFixed(2)}%**  (${f.roe >= 17 ? "✅ Pass (≥17%)" : "❌ Fail (O'Neil requires ≥17%)"})\n\n💡 ROE measures how efficiently the company turns shareholders' money into profit; 17% is the bar for an excellent company.` : "";
  return `## Test 3: A - Has the company grown steadily over the past 3 years?

**What it tests**: whether the company's profits rose steadily every year over the past 3 years.

**Why it matters**: one good year isn't enough; **year after year** is what shows real competitive strength.

**Pass criteria**: ${word} YoY ≥25% in at least **2** of 3 years.

| Year | ${word} YoY | Pass? |
|---|---:|---|
${rows}

### ${sig(r.A)}

${okc}/3 years meet the threshold — ${r.A ? "pass" : "fail"}.
${volatile}${roe}

⚠️ **Core reminder**: **if A fails, be cautious even when the technicals look great.** This "strong chart, weak fundamentals" type is a **story stock**, the most common reason retail investors lose money.

⚠️ **Note on data depth**: Yahoo's annual reports typically cover the last 4 years, so we take the 3 most recent YoY changes; this is shorter than the longer history O'Neil would want, so the strength of the conclusion is discounted accordingly.`;
}

function secN(r: Result): string {
  const pre = r._cfg.curPrefix;
  return `## Test 4: N - Is the price near a 1-year high?

**What it tests**: how far the current price is from its highest point over the past 52 weeks.

**Why it matters**: CAN SLIM **chases strength, not weakness**. Stocks poised for a big move often make new highs first — a sign smart money is already buying and there's no trapped supply overhead.

**Pass criteria**: current price within ≤5% of the 52-week high (or breaking out of a base)

| Metric | Value |
|---|---:|
| 52-week high | ${pre}${r.high_52w} |
| Distance from high | **${r.dist_to_high >= 0 ? "+" : ""}${r.dist_to_high.toFixed(2)}%** |

### ${sig(r.N)}

${r.N ? `Very close to a new high (within ${Math.abs(r.dist_to_high).toFixed(2)}%) or breaking out — pass.` : `${Math.abs(r.dist_to_high).toFixed(2)}% below the high, still far from a new high and in a weak consolidation phase.`}

💡 **For beginners**: **the truly great winners climb all the way up from new highs, not bounce off the bottom**. Counterintuitive but important.`;
}

function secS(r: Result): string {
  return `## Test 5: S - Is big money moving in?

**What it tests**: how many times today's volume exceeds the average of the past 50 days.

**Why it matters**: a price rise **must be confirmed by volume**. When big money buys, the size of each order is huge and drives a clear volume surge.

**Pass criteria**: today's volume / 50-day average volume ≥ **1.5×**

| Metric | Value |
|---|---:|
| Today's volume | ${r.volume.toLocaleString()} |
| 50-day average volume | ${r.vol_ma50.toLocaleString()} |
| **Volume ratio** | **${r.vol_ratio.toFixed(2)}x** |

### ${sig(r.S)}

${r.S ? `Volume ratio ${r.vol_ratio.toFixed(2)}x — a clear volume surge; big money is indeed moving in.` : `Volume ratio ${r.vol_ratio.toFixed(2)}x — volume is ordinary, with no surge signal.`}

💡 **For beginners**: **"a rise on rising volume is real; a rise on shrinking volume is fake".**`;
}

function secL(r: Result): string {
  const th = r._cfg.rsThreshold, rs = r.rs_rating;
  return `## Test 6: L - Is this stock an industry leader?

**What it tests**: where this stock's gain over the past year ranks within the benchmark universe (0-99).

**Why it matters**: one of CAN SLIM's core ideas is **"buy the leaders"**.

**How it's computed**: O'Neil's weighted formula \`40%×last 3mo + 20%×6mo + 20%×9mo + 20%×12mo\`, then ranked 0-99 within the ${r._cfg.universe.length}-name benchmark universe.

**Pass criteria**: RS Rating ≥ **${th}**

| Metric | Value |
|---|---:|
| **RS Rating** | **${rs == null ? "N/A" : rs} / 99** |

### ${sig(r.L)}

${r.L ? `A leader-grade strong stock (≥${th}).` : `RS Rating ${rs == null ? "cannot be computed" : "is only " + rs}, weaker than the market leaders (needs ≥${th}) — a negative.`}

💡 **For beginners**: don't be misled by "it's already risen too much". **80% of the biggest winners already had a high RS Rating before their big move.** Strength begets strength.`;
}

function secChart(r: Result): string {
  const pre = r._cfg.curPrefix;
  const buy = r.pivot == null ? "" : `
### Buy/sell reference points

| Key level | Price |
|---|---:|
| Current price | ${pre}${r.price} |
| Pivot (breakout benchmark) | ${pre}${r.pivot} |
| Auto stop-loss (-8%) | ${pre}${r.stop} |

💡 **For beginners**:
- **Pivot** = the high of the prior consolidation; a breakout above it is the "buy signal".
- **-8% stop-loss** is O'Neil's **iron rule** — sell unconditionally once it breaks below after you buy.
`;
  return `## 📈 Chart analysis and buy/sell points\n\n**Current pattern**: ${r.base_pattern}\n${buy}`;
}

function secLearning(r: Result): string {
  const L: string[] = [];
  if (!r.M) L.push("**The market environment is the first filter** — if M fails, nothing else matters; just stay in cash.");
  else L.push("**M passing** is the prerequisite for opening a position. Enter in bull markets, hold cash in bear markets.");
  if (r.score_tech >= 3 && r.score_fund === 0) L.push("**Spotting the 'story stock'** — pretty chart but weak fundamentals, surging and crashing, unsuitable for long-term holding.");
  if (r.C && (r._funda.q_eps_yoy ?? 0) >= 100) L.push("**Beware the 'base effect'** — a multi-fold YoY may just reflect an extremely low base last year; look at the absolute value.");
  if (!r.A && r._funda.annual_yoy_3y.length && Math.max(...r._funda.annual_yoy_3y) - Math.min(...r._funda.annual_yoy_3y) > 100)
    L.push("**Stability of profits matters more than a single year of high growth** — this company's profits swing wildly, so it is not a quality growth stock.");
  if (r.L && r.rs_rating != null && r.rs_rating >= 90) L.push(`**RS Rating ${r.rs_rating} is extremely strong** — strength begets strength; leaders often keep rising.`);
  else if (!r.L) L.push("**Don't touch weak stocks** — a low RS Rating means the market doesn't favor it.");
  if (r.S && r.vol_ratio >= 2) L.push(`**Breakouts on volume matter** — today's volume is ${r.vol_ratio.toFixed(1)}× the usual.`);
  L.push("**The 8% stop-loss is an iron rule** — sell unconditionally at -8% from any buy point.");
  return `## 🎓 A few things this analysis teaches you\n\n${L.map((x, i) => `${i + 1}. ${x}`).join("\n")}`;
}

function secChecklist(benchName: string): string {
  return `## ✅ Your checklist for analyzing stocks next time

### Step 1: check the market first (M)
- [ ] Is ${benchName}'s current price > 50-day MA?
- [ ] Is the 50-day MA > 200-day MA?
- [ ] **Both satisfied → can buy. Either one not → stay in cash.**

### Step 2: check the fundamentals (C + A)
- [ ] Latest-period earnings YoY ≥ 25%?
- [ ] At least 2 of the past 3 years with earnings YoY ≥ 25%?
- [ ] ROE ≥ 17%?

### Step 3: check the technicals (N + S + L)
- [ ] Price within ≤5% of its 52-week high?
- [ ] Today's volume / 50-day average volume ≥ 1.5?
- [ ] One-year gain outperforming ${benchName}?

### Step 4: set buy/sell points
- [ ] Identify the pivot; -8% stop-loss price (×0.92), **sell if it breaks below**; consider taking profit at +20-25%.

### Step 5: position sizing
- [ ] Single stock ≤ 25% of total position; hold ≤ 5-8 names at once.`;
}

function secRisk(): string {
  return `## ⚠️ Risk disclaimer

1. **This report is not investment advice.** CAN SLIM is a summary of historical methods and does not guarantee future returns.
2. **Data comes from Yahoo Finance and may be delayed or wrong.** Double-check on a service like Xueqiu before important decisions.
3. **Past performance does not predict the future.** Even a 6/6 pass can lose money; always be ready to stop out.
4. **A retail investor's biggest enemy is themselves**: greed + fear + not cutting losses.`;
}

export async function generateCanslimReport(
  rawSymbol: string, market: "us" | "hk", universeReturns: Record<string, number>,
): Promise<string> {
  const cfg = cfgFor(market);
  const sym = normalizeSymbol(rawSymbol, market);

  const [stock, bench, fin] = await Promise.all([fetchDaily(sym), fetchDaily(cfg.benchSym), fetchFin(sym)]);
  if (stock.close.length < 252) throw new Error(`Insufficient history: fewer than 252 trading days (only ${stock.close.length} days; may be newly listed)`);

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

  const title = r.name ? `${sym} (${r.name})` : sym;
  return [
    `# 📊 ${title} CAN SLIM Investment Analysis Report`,
    `**Date**: ${r.date}  ·  **Current price**: ${cfg.curPrefix}${price}  ·  **Total score**: ${r.score_total}/6\n`,
    "---\n",
    "## 🎯 One-line conclusion\n\n" + conclusion(r),
    "\n---\n",
    "## 📚 What is this report?\n\n**CAN SLIM** is a stock-selection system distilled by legendary US investor William O'Neil, using 7 letters to represent 7 tests (we cover 6 of them). **Only a stock that passes every test is an O'Neil-system buy point.**\n",
    "---\n",
    secM(r), "\n---\n", secC(r), "\n---\n", secA(r), "\n---\n",
    secN(r), "\n---\n", secS(r), "\n---\n", secL(r), "\n---\n",
    secChart(r), "\n---\n", secLearning(r), "\n---\n",
    secChecklist(cfg.benchName), "\n---\n", secRisk(),
    `\n---\n*Report generated by the AI Chain · Analysis Tool · data source Yahoo Finance · ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC*\n`,
  ].join("\n");
}
