// Graham value-investing analysis report (The Intelligent Investor, Chapter 14, "The 7 rules for the defensive investor").
// Ported from the user's graham_report.py (US stocks) / graham_report_hk.py (HK stocks); the scoring logic and report copy are kept consistent.
// The data source was changed from akshare/efinance (East Money) to Yahoo Finance (directly reachable overseas, covers both US and HK stocks).
// Differences in methodology from the original (all faithfully noted in the report):
//   1) Yahoo's annual-report depth is about 4 years (vs 5-10 in the original akshare) → G3/G5 are assessed on the actual data available;
//   2) When the financial-statement currency ≠ the stock-price currency (e.g. Tencent CNY/HKD), EPS/BPS are converted at the FX rate before computing P/E and P/B (the original did not handle this).

import { normalizeSymbol, fetchChart, fetchAnnuals, fetchSummaryExtra, fetchFx, type AnnualRow, type ChartData } from "./finance";

const fmtB = (v: number, cur: string) => (cur === "USD" ? `$${(v / 1e9).toFixed(2)}B` : `${(v / 1e8).toFixed(1)} hundred million ${cur}`);
const sig = (ok: boolean) => (ok ? "✅ Pass" : "❌ Fail");

interface Check { ok: boolean; [k: string]: unknown }

// ── The 7 rules ────────────────────────────────────────────

// G1 Size: US revenue ≥ $2B; HK revenue ≥ 5 billion (in financial-statement currency), matching the original
function checkG1(annuals: AnnualRow[], market: "us" | "hk", finCur: string): Check {
  const rev = annuals[0]?.revenue;
  if (rev == null) return { ok: false, note: "Data missing" };
  const threshold = market === "us" ? 2e9 : 5e9;
  const ok = rev >= threshold;
  const tName = market === "us" ? "≥$2B" : "≥5 billion";
  return { ok, value: rev, note: `Latest annual revenue ${fmtB(rev, finCur)} (${ok ? `meets ${tName}` : "below threshold (Graham requires large caps)"})` };
}

// G2 Financial soundness: current ratio ≥ 2 and debt-to-assets ratio ≤ 50%
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

// G3 Earnings stability: profitable in every available year (Yahoo depth ~4 years; the original requires at least 5 / ideally 10 — noted in the report)
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

// G4 Dividend record: 10+ years of uninterrupted dividends (dividend history from Yahoo's full dataset, not limited by annual-report depth)
function checkG4(divs: ChartData["dividends"]): Check {
  if (!divs.length) return { ok: false, consecutive_years: 0, note: "No dividend record" };
  const years = [...new Set(divs.map((d) => d.date.getFullYear()))].sort((a, b) => a - b);
  let consecutive = 1;
  for (let i = years.length - 1; i > 0; i--) {
    if (years[i] - years[i - 1] === 1) consecutive++;
    else break;
  }
  // The dividend window is the last 16 years (see finance.ts); when the consecutive count reaches the window cap, mark it "16+"
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

// G5 Earnings growth: earliest vs most recent net income, cumulative ≥33% (the original degrades to a first-vs-last comparison when <6 years; with 4 years here we take that same degraded path)
function checkG5(annuals: AnnualRow[]): Check {
  const rows = annuals.filter((a) => a.netIncome != null);
  if (rows.length < 3) return { ok: false, note: `Insufficient data (only ${rows.length} years)` };
  const nps = rows.map((a) => a.netIncome as number); // latest first
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

// G6 Valuation: P/E ≤ 15 (3-year average EPS; converts first when the financial-statement currency ≠ the stock-price currency)
function checkG6(annuals: AnnualRow[], price: number, fx: number): Check {
  const eps = annuals.map((a) => a.eps).filter((x): x is number => x != null).slice(0, 3);
  if (!eps.length) return { ok: false, note: "EPS data missing" };
  const avg = (eps.reduce((s, x) => s + x, 0) / eps.length) * fx; // convert to the stock-price currency
  const pe = avg > 0 ? price / avg : null;
  return {
    ok: pe != null && pe <= 15,
    pe: pe != null ? Math.round(pe * 100) / 100 : null,
    avg_eps_3y: Math.round(avg * 1000) / 1000,
    price,
  };
}

// G7 Price: P/B ≤ 1.5 (BPS = equity / shares, falling back to quoteSummary bookValue; same currency conversion as G6)
function checkG7(annuals: AnnualRow[], price: number, fx: number, bookValueFallback: number | null): Check {
  const a = annuals[0];
  let bps: number | null = a?.equity && a?.shares ? a.equity / a.shares : null;
  if (bps == null || bps <= 0) bps = bookValueFallback;
  if (bps == null || bps <= 0) return { ok: false, pb: null, bps: null, note: "BPS data missing" };
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

// ── Report rendering (copy matches the original; data-source-related notes updated) ──────────

function sectionIntro(symbol: string, name: string, price: number, priceCur: string, finCur: string,
                      totalPass: number, market: "us" | "hk"): string {
  const title = name ? `${symbol} (${name})` : symbol;
  const cn = 7;
  let verdict: string;
  if (totalPass === cn) {
    verdict = `🟢 **Strong candidate (${totalPass}/${cn})** — satisfies all 7 of Graham's rules\n\nThis is a buy candidate that the Graham system endorses for the "defensive investor". Passing all 7 at once is very rare — it usually means the market has undervalued this company over the long run, and it is worth deeper research.`;
  } else if (totalPass >= 5) {
    verdict = `🟡 **Nearly qualified (${totalPass}/${cn})** — only ${cn - totalPass} item(s) below threshold\n\nMost rules pass, but Graham in principle requires all of them. Look below at which ones failed and judge for yourself whether you can tolerate them.`;
  } else if (totalPass >= 3) {
    verdict = `🟠 **Partially qualified (${totalPass}/${cn})** — proceed with caution\n\nOnly about half the rules pass. This usually indicates an obvious weakness (overvaluation, financial leverage, or weak growth).`;
  } else {
    verdict = `🔴 **Does not meet Graham's standards (${totalPass}/${cn})**\n\nMost rules fail. This is not a Graham-system buy candidate. But this **does not mean the company is bad** — it may simply not fit this framework. For example, growth stocks like NVDA / TSLA naturally fail G6/G7 due to high valuations, yet may look excellent under the CAN SLIM framework.`;
  }
  const cands = market === "us" ? "KO / JNJ / PG / WMT / XOM / PFE / VZ" : "banks / utilities / consumer leaders (e.g. 00939 CCB, 00168 Tsingtao)";
  return `# 📚 ${title} Graham Value-Investing Analysis Report

**Date**: ${new Date().toISOString().slice(0, 10)}  ·  **Current price**: ${priceCur === "USD" ? "$" : priceCur + " "}${price}  ·  **Financial-statement currency**: ${finCur}

---

## 🎯 One-line conclusion

${verdict}

---

## 📚 What is this report based on?

**Benjamin Graham** (Warren Buffett's mentor), in Chapter 14 of *The Intelligent Investor* published in 1949, laid out **7 buy rules** for the "defensive investor". This is the foundational framework of value investing: **buy sound, mature companies at a price below their intrinsic value**, and hold for the long term.

It is the exact opposite of CAN SLIM (which hunts for strong growth stocks) — Graham looks for companies that are **safe, stable, and cheap**. Typical Graham candidates in ${market === "us" ? "US" : "HK"} equities: ${cands}.

Below we check all 7 rules one by one.
`;
}

function sectionG1(r: Check, market: "us" | "hk", finCur: string): string {
  const val = r.value as number | undefined;
  const valStr = val ? fmtB(val, finCur) : "—";
  const std = market === "us" ? "Annual revenue ≥ $2B (the 1973 book said $100M; adjusted for inflation and the size of the economy)" : "Annual revenue ≥ 5 billion (in financial-statement currency, HK threshold)";
  return `## G1 Is the company large enough?

**What it tests**: whether the company's annual revenue is large enough. Graham did not want retail investors touching small caps, because small companies collapse at the first sign of trouble.

**Why it matters**: large companies usually enjoy economies of scale plus resilience to risk, which suits a "defensive" strategy.

**Pass criteria**: ${std}

| Metric | Value |
|---|---:|
| Latest annual revenue | **${valStr}** |

### ${sig(r.ok)}

${r.note || ""}

💡 **For beginners**: this rule "filters out small caps"; it is not about finding the biggest. ${market === "us" ? "The median revenue of S&P 500 constituents is about $8 billion, so $2B is roughly the \"mid-cap and above\" threshold." : "HK small caps have poor liquidity and weak disclosure, so this filter is especially important."}
`;
}

function sectionG2(r: Check): string {
  const cr = r.current_ratio as number | null, dr = r.debt_ratio as number | null;
  return `## G2 Is the balance sheet solid?

**What it tests**:
1. **Current ratio** = current assets / current liabilities. ≥2 signals strong short-term solvency.
2. **Debt-to-assets ratio** ≤ 50%, indicating the company does not over-rely on borrowing.

**Why it matters**: a highly leveraged company can hit a liquidity crunch once its industry turns down. Graham wanted **sound companies that let you sleep at night**.

**Pass criteria**: current ratio ≥ 2 **and** debt-to-assets ratio ≤ 50%

| Metric | Value | Verdict |
|---|---:|---|
| Current ratio | **${cr ?? "—"}** | ${r.cr_ok ? "✅ ≥2" : "❌ <2"} |
| Debt-to-assets ratio | **${dr != null ? dr + "%" : "—"}** | ${r.dr_ok ? "✅ ≤50%" : "❌ >50%"} |

### ${sig(r.ok)}

${r.ok ? "Both metrics meet the threshold." : "At least one metric falls short. Many large companies use leverage to boost ROE (banks/industrials/energy in particular), so a current ratio <2 is common."}

💡 **For beginners**: tech leaders usually have extremely solid finances (AAPL/MSFT/GOOGL all have current ratios >1.5 and piles of cash). Conversely, a current ratio <1 plus a debt ratio >70% is a warning sign — the classic "high-leverage trap". Note: **banks have a special methodology for the current ratio / debt-to-assets ratio**, so these two rules are of limited relevance to banks.
`;
}

function sectionG3(r: Check, finCur: string): string {
  const profits = (r.profits as { year: string; np: number }[]) || [];
  const unit = finCur === "USD" ? "B$" : "hundred million " + finCur;
  const div = finCur === "USD" ? 1e9 : 1e8;
  const rows = profits.map((p) => `| ${p.year} | ${(p.np / div) >= 0 ? "+" : ""}${(p.np / div).toFixed(2)} |`).join("\n");
  const loss = (r.loss_years as string[]) || [];
  return `## G3 Are earnings stable?

**What it tests**: over the available years, whether the company has been **profitable every single year**, with no losses.

**Why it matters**: a company that has never lost money shows its business model can withstand cycles. **Consistency of profitability matters more than a single year of high growth.**

**Pass criteria**: no losses across all available data (Graham's book requires 10 years; Yahoo's annual-report depth is ~4 years, so we assess on the actual data and note this honestly).

| Fiscal year | Net income to shareholders (${unit}) |
|---|---:|
${rows || "| — | Data missing |"}

### ${sig(r.ok)}

Data covers ${r.years_count} years (${r.earliest_year} → latest), ${loss.length ? `⚠️ loss years present: ${loss.join(", ")}` : "profitable throughout, no loss years."}

⚠️ **Note on data depth**: this report's data source (Yahoo Finance) typically covers the last 4 years of annual reports, shorter than Graham's required 10 years. Four years of unbroken profitability is a **necessary but not sufficient** signal — we suggest checking the company's 10-K / annual reports yourself to confirm the earlier years.

💡 **For beginners**: this is the **easiest** of Graham's 7 rules to pass — most mature blue chips clear it. Those that fail are mostly cyclicals (airlines / energy / semiconductors) or perennially loss-making story stocks.
`;
}

function sectionG4(r: Check): string {
  const cons = (r.consecutive_years as number) || 0;
  let body: string;
  if (r.note && cons === 0) {
    body = `### ⚠️ ${r.note}\n\nPlenty of companies pay no dividends (tech stocks especially, e.g. GOOGL/AMZN/TSLA); this does not necessarily mean the company is bad, but the Graham system **excludes them outright** — because he regarded dividends as hard evidence of "accountability to shareholders".`;
  } else {
    body = `| Metric | Value |
|---|---:|
| Most recent consecutive dividend years | **${cons}${r.capped ? "+" : ""} years**${r.capped ? " (reached the statistical-window cap; the true figure may be longer)" : ""} |
| Start year | ${r.first_year}${r.capped ? " (within the window)" : ""} |
| Most recent dividend year | ${r.last_year} |
| Years with dividends in the last 16 years | ${r.total_records} years |

### ${sig(r.ok)}

${r.ok ? "Dividends paid for ≥10 consecutive years — pass." : `Only ${cons} consecutive dividend years, below the 10-year threshold.`}`;
  }
  return `## G4 Is the dividend record consistent?

**What it tests**: whether the company has paid dividends **without interruption** for many years.

**Why it matters**: Graham viewed dividends as the strongest evidence that "management is accountable to shareholders". Sustaining dividends for 10+ years indicates:
- stable cash flow
- management willing to return money to shareholders (rather than investing recklessly)
- not a pseudo-growth story kept alive by financing

**Pass criteria**: 10+ years of uninterrupted dividends (the book says 20 years; relaxed here)

${body}

💡 **For beginners**: US markets have a special concept called **"Dividend Aristocrats"** — companies that have raised their dividend for 25+ consecutive years. There are only 60+ in the whole market, and they are natural Graham candidates, including KO / PG / JNJ / MCD / WMT / MMM. Dividend-history data source: Yahoo Finance (full history, complete coverage).
`;
}

function sectionG5(r: Check, finCur: string): string {
  if (r.note) return `## G5 Have earnings grown consistently?\n\n### ❌ Fail\n\n${r.note}\n`;
  const div = finCur === "USD" ? 1e9 : 1e8;
  const unit = finCur === "USD" ? "B" : " hundred million";
  const growth = r.growth_pct as number | null;
  const n = r.years_count as number;
  return `## G5 Have earnings grown consistently?

**What it tests**: compare **the earliest year's net income** with **the most recent year's net income** to see the cumulative gain.

**Why it matters**: even a sound company needs some growth. A cumulative 33% gain is the minimum floor Graham set (his book uses a 10-year span at ~3% annualized, only slightly above inflation).

**Pass criteria**: cumulative growth ≥ 33%

| Metric | Value |
|---|---:|
| Earliest-year net income | ${((r.early_b as number) / div).toFixed(2)}${unit} |
| Most recent net income | ${((r.recent_b as number) / div).toFixed(2)}${unit} |
| Cumulative growth | **${growth != null ? (growth >= 0 ? "+" : "") + growth + "%" : "—"}** |
| Time span | ${r.years_span} (${n} years) |

### ${sig(r.ok)}

💡 **For beginners**: this uses **total net income** rather than EPS — EPS is distorted by splits/buybacks, while net income growth stays closer to Graham's intent — whether the company's "earning power" is growing. ⚠️ The current data spans only ${n} years (limited by Yahoo's annual-report depth), shorter than the book's 10-year window; the 33% threshold is somewhat strict for a short window, so treat the result as indicative only.
`;
}

function sectionG6(r: Check, priceCur: string, fxNote: string): string {
  return `## G6 Is the valuation reasonable? (P/E)

**What it tests**: current price / average EPS over the past 3 years = **P/E ratio**.

**Why it matters**: P/E is the most common gauge of "cheap vs. expensive". A **P/E of 15** means it takes 15 years to recoup your investment at current earning power. Graham considered anything higher to be paying a premium for growth, which is not "defensive" investing.

**Pass criteria**: P/E ≤ 15 (using 3-year average earnings, not a single year, to avoid cyclical noise)

| Metric | Value |
|---|---:|
| Current price | ${priceCur === "USD" ? "$" : priceCur + " "}${r.price} |
| 3-year average EPS${fxNote ? " (converted)" : ""} | ${r.avg_eps_3y} ${priceCur} |
| **P/E** | **${r.pe ?? "—"}** |

### ${sig(r.ok)}

${r.ok ? "P/E is reasonable; the price is not expensive." : "P/E exceeds 15; the valuation is on the expensive side — it does not meet Graham's defensive threshold."}${fxNote}

💡 **For beginners**: this P/E rule plus the P/B rule below are the **two hardest** of Graham's 7 to pass. US valuations have been high for a long time (tech stocks especially run at P/E 25-40), and the quality companies you can find with P/E<15 are mostly in: **banks/insurance, energy, traditional consumer, pharma**. **The essence of Graham is to buy only "good companies on sale".**
`;
}

function sectionG7(r: Check, gc: Check, priceCur: string, fxNote: string): string {
  return `## G7 Is the price sane? (P/B / Graham's formula)

**What it tests**: price / book value per share = **P/B ratio**. It measures "how many times book value you are paying for this company".

**Why it matters**: P/E looks at earnings; P/B looks at **assets**. Combining the two avoids being fooled by "inflated earnings" (earnings can be dressed up; net assets are harder to fake).

**Pass criteria**:
- **Strict version**: P/B ≤ 1.5
- **Graham's formula** (fallback): P/E × P/B ≤ 22.5 — allows one metric to exceed its limit as long as the other is low enough

| Metric | Value |
|---|---:|
| Book value per share (BPS)${fxNote ? " (converted)" : ""} | ${r.bps ?? "—"} ${priceCur} |
| **P/B** | **${r.pb ?? "—"}** |
| **Graham's formula P/E × P/B** | **${gc.product ?? "—"}** (${gc.ok ? "≤22.5 ✅" : ">22.5 ❌"}) |

### ${sig(r.ok)} (strict P/B ≤ 1.5)

${r.ok ? "P/B meets the strict threshold." : `P/B exceeds 1.5${gc.ok ? ", but Graham's combined formula P/E × P/B ≤ 22.5 still passes — counts as a relaxed pass." : ", and the combined formula also falls short."}`}

💡 **For beginners**: P/B < 1 is called "trading below book", meaning the market thinks the company is worth less than its liquidation value. **Below book + stable profitability** is Graham's favorite "cigar-butt stock". HK markets have far more below-book stocks than US markets (banks/property/utilities in droves), but be careful to distinguish "cheap" from a "value trap".
`;
}

function sectionLearning(checks: Record<string, Check>): string {
  const lessons: string[] = [];
  if (!checks.G1.ok) lessons.push("**Small caps carry higher risk** — Graham told retail investors to avoid them. How much volatility you can bear determines whether you should touch small caps at all.");
  if (!checks.G2.ok) lessons.push("**Financial leverage is common among large companies** — banks / utilities / industrials routinely run current ratios <2. Be wary at <1, add points at >2.");
  if (checks.G3.ok) lessons.push("**Years without a loss = strong resilience to cycles** — this is a hard indicator of company quality, more important than a single year's profit.");
  else if ((checks.G3.loss_years as string[])?.length) lessons.push(`**Note the loss years ${(checks.G3.loss_years as string[]).join(", ")}** — what happened in those years? An industry crisis, or a company-specific problem?`);
  if (checks.G4.ok) lessons.push("**10+ consecutive years of dividends** — this is the strongest signal of management quality.");
  else if (!(checks.G4.consecutive_years as number)) lessons.push("**Paying no dividends is common** — tech stocks (GOOGL / AMZN / TSLA) go without dividends for years, and the Graham system excludes them outright; that does not mean the company is bad, only that it does not fit this framework.");
  if (!checks.G6.ok && !checks.G7.ok) lessons.push("**Graham won't buy even a great company if it's overvalued** — this is the biggest difference between value and growth investing. Value investors would rather hold cash and wait for a cheap opportunity.");
  lessons.push("**Graham's 7 rules are a 'minimum bar', not a 'buy point'** — passing them all doesn't mean the stock rises tomorrow, but it means you bought at a **safe price**.");
  lessons.push("**Graham and CAN SLIM are two entirely different logics** — the same stock can score very differently in each system. The key is to **pick the system first, then the stock**.");
  return `## 🎓 A few things this analysis teaches you\n\n${lessons.map((x, i) => `${i + 1}. ${x}`).join("\n")}\n`;
}

function sectionChecklist(): string {
  return `## ✅ Your checklist for analyzing value stocks next time

Save the checklist below and run through it in this order for any mature company you look at:

### Step 1: company fundamentals (G1-G4)
- [ ] Revenue large enough (avoid small caps)
- [ ] Current ratio ≥ 2 (short-term solvency)
- [ ] Debt-to-assets ratio ≤ 50%
- [ ] No losses in the last 10 years
- [ ] 10+ years of uninterrupted dividends

### Step 2: growth floor (G5)
- [ ] Cumulative earnings growth ≥ 33% over the last 10 years (~3% annualized, slightly above inflation)

### Step 3: reasonable valuation (G6 + G7) ⭐ key
- [ ] P/E ≤ 15 (using 3-year average earnings)
- [ ] P/B ≤ 1.5 **or** P/E × P/B ≤ 22.5 (Graham's formula)

### Step 4: margin of safety
- [ ] Estimate the company's **intrinsic value**; buy price ≤ intrinsic value × 0.7 (leave a 30% discount as a cushion)
- [ ] This is Graham's core concept — "margin of safety"

### Step 5: holding strategy
- [ ] **Hold for the long term, 3-10 years**, waiting for the market to rediscover the value
- [ ] **Diversify**: no single stock over 10%, at least 10-30 names
- [ ] **No stop-loss** (opposite of CAN SLIM): the lower the price falls the cheaper it gets — provided the company's fundamentals have not changed
`;
}

function sectionRisk(): string {
  return `## ⚠️ Risk disclaimer

1. **This report is not investment advice.** The Graham framework is a product of 1949, and some of its clauses (e.g. a 20-year dividend history) are nearly impossible for today's tech stocks to satisfy strictly.
2. **Data source**: quotes/financials/dividends all come from Yahoo Finance. Financial data may lag by 1-2 quarters.
3. **Data depth**: Yahoo's annual reports typically cover the last 4 years, shorter than Graham's required 10-year window. G3/G5 are assessed on the actual data, so the strength of the conclusion is discounted accordingly.
4. **The Graham framework is not a cure-all**: it excels at finding "cheap, sound companies" but misses every genuinely high-growth stock (Amazon and Nvidia both failed to qualify in their early years). Know the limits of your tool.
5. **The core of value investing is patience**: Graham said "in the short run the market is a voting machine, in the long run it is a weighing machine". A retail investor's biggest failure is not picking the wrong stock, but lacking the patience to hold.
`;
}

// ── Main flow ───────────────────────────────────────────────

export async function generateGrahamReport(rawSymbol: string, market: "us" | "hk"): Promise<string> {
  const sym = normalizeSymbol(rawSymbol, market);
  const [chart, annuals, extra] = await Promise.all([
    fetchChart(sym),
    fetchAnnuals(sym),
    fetchSummaryExtra(sym),
  ]);
  if (!annuals.length) throw new Error("Unable to fetch annual financial data (symbol does not exist or has no financial coverage)");

  // Currency handling: when the financial-statement currency ≠ the stock-price currency (e.g. Tencent CNY→HKD), fetch the FX rate to convert EPS/BPS
  const finCur = extra.financialCurrency || chart.currency;
  let fx = 1;
  let fxNote = "";
  if (finCur !== chart.currency) {
    const rate = await fetchFx(finCur, chart.currency);
    if (rate) {
      fx = rate;
      fxNote = `\n\n> 💱 Note: this company reports in ${finCur} while the stock is priced in ${chart.currency}; EPS/BPS have been converted at an FX rate of ${rate.toFixed(4)} before computing P/E and P/B.`;
    } else {
      fxNote = `\n\n> ⚠️ Note: the financial-statement currency (${finCur}) differs from the stock-price currency (${chart.currency}) and the FX rate could not be fetched, so P/E and P/B may have a currency bias.`;
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
    `\n---\n*Report generated by the AI Chain · Analysis Tool · data source Yahoo Finance · ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC*\n`,
  ].join("\n");
}
