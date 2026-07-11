// Turtle trading analysis report (Curtis Faith, *Way of the Turtle*, original rules, dual S1/S2 systems).
// Ported from the user's turtle_report.py + turtle_all.py; the calculation logic and report copy are kept consistent.
// The data source was changed from efinance (East Money) to Yahoo Finance (directly reachable overseas, covers both US and HK stocks).
// The Turtle system is a pure price strategy: it only needs a single stock's daily bars (ATR / Donchian channel / pyramiding / position sizing), with no financials or benchmark universe.

import { normalizeSymbol, fetchDaily, type Daily } from "./finance";

// Original parameters (turtle_all.py config section)
const ATR_PERIOD = 20;
const S1_HIGH = 20, S1_LOW = 10, S2_HIGH = 55, S2_LOW = 20;
const BREAKOUT_BUFFER = 1.0;
const STOP_MULT = 2;       // 2N stop-loss
const PYRAMID_STEP = 0.5;  // add one unit for every 0.5N rise
const PYRAMID_MAX = 4;
const RISK_PER_TRADE = 0.01;
const STRENGTH_LOOKBACK = 63;
const US_ACCOUNT_DEFAULT = 510;   // USD
const HK_ACCOUNT_DEFAULT = 4000;  // HKD
const FORMULA_VERSION = "turtle-1.1.0";

// Board-lot sizes for the HK watchlist (turtle_all.py HK_WATCHLIST); names not in the list default to 100 shares
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

// ── Indicator calculation (ports calculate_indicators) ──────────────────
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
  // Channels use the extreme of "the past N closes (excluding today)"
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
  // S1 skip rule: if the previous S1 breakout did not experience a 2N adverse move (a profitable breakout), the next S1 breakout is skipped
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

// ── Position sizing (ports calculate_position) ─────────────────────────
interface Pos {
  risk_amount: number; risk_per_share: number; raw_shares: number; stop_price: number;
  suggested_shares: number; cost: number; actual_risk: number; risk_pct: number;
  recommendation: string; rec_reason: string;
  // HK two-option scheme
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
      if (price > account) { recommendation = "❌ Can't even afford 1 share"; rec_reason = `1 share costs $${fmt(price)}, exceeding the account of $${account}`; }
      else { recommendation = "❌ Risk too large"; rec_reason = "At 1% risk the suggested size is 0 shares (ATR too large)"; }
    } else if (risk_pct <= 1.5 && cost <= account) {
      recommendation = "🟢 Standard Turtle"; rec_reason = `Buy ${suggested} shares, risk ${fmt(risk_pct)}%, cost $${fmt(cost, 0)}`;
    } else if (cost <= account && risk_pct <= 5) {
      recommendation = "🟡 Elevated risk"; rec_reason = `Buy ${suggested} shares, risk ${fmt(risk_pct)}%, above 1% but manageable`;
    } else if (cost <= account) {
      recommendation = "🔴 Risk too heavy"; rec_reason = `Buy ${suggested} shares, risk ${fmt(risk_pct)}%, over-concentrated`;
    } else {
      recommendation = "🟡 Only 1 share affordable"; rec_reason = "Can't afford the suggested size, only 1 share";
      suggested = 1; actual_risk = risk_per_share; risk_pct = (actual_risk / account) * 100; cost = price;
    }
    return { risk_amount, risk_per_share, raw_shares, stop_price, suggested_shares: suggested, cost, actual_risk, risk_pct, recommendation, rec_reason };
  }

  // HK: two options, board lots + odd lots
  const lots = Math.max(1, Math.floor(raw_shares / lot));
  const lot_shares = lots * lot, lot_risk = lot_shares * risk_per_share;
  const lot_risk_pct = (lot_risk / account) * 100, lot_cost = lot_shares * price, lot_aff = lot_cost <= account;
  const odd_shares = Math.max(1, Math.round(raw_shares));
  const odd_risk = odd_shares * risk_per_share, odd_risk_pct = (odd_risk / account) * 100;
  const odd_cost = odd_shares * price, odd_pos_pct = (odd_cost / account) * 100, odd_aff = odd_cost <= account;
  let recommendation: string, rec_reason: string;
  if (lot_aff && lot_risk_pct <= 1.5) { recommendation = "🟢 Board lot"; rec_reason = `Board lot ${lot_shares} shares, risk ${fmt(lot_risk_pct)}%, standard Turtle`; }
  else if (lot_aff && lot_risk_pct <= 5) { recommendation = "🟡 Board lot (elevated risk)"; rec_reason = `Board-lot risk ${fmt(lot_risk_pct)}%, above 1% but manageable`; }
  else if (lot_aff) { recommendation = "🔴 Board lot (risk too heavy)"; rec_reason = `Board-lot risk ${fmt(lot_risk_pct)}%, over-concentrated`; }
  else if (odd_aff && odd_pos_pct >= 5) { recommendation = "🟢 Odd lot"; rec_reason = `Odd lot ${odd_shares} shares, position ${fmt(odd_pos_pct)}%, appropriate`; }
  else if (odd_aff && odd_pos_pct >= 2) { recommendation = "🟡 Odd lot (training size small)"; rec_reason = `Odd-lot position only ${fmt(odd_pos_pct)}%, reduced practice value`; }
  else if (odd_aff) { recommendation = "🔴 Odd lot (too light)"; rec_reason = `Odd-lot position only ${fmt(odd_pos_pct)}%, almost no training value`; }
  else { recommendation = "❌ Skip"; rec_reason = `Even a minimum 1-share odd lot costs ${fmt(odd_cost, 0)} HKD, exceeding the account`; }
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

// ── Main flow + report ───────────────────────────────────────
export async function generateTurtleReport(rawSymbol: string, market: "us" | "hk", accountOverride?: number): Promise<string> {
  const sym = normalizeSymbol(rawSymbol, market);
  const isUs = market === "us";
  const cur = isUs ? "$" : "HK$";
  const account = accountOverride && accountOverride > 0 ? accountOverride : (isUs ? US_ACCOUNT_DEFAULT : HK_ACCOUNT_DEFAULT);
  const hkDigits = rawSymbol.replace(/\.HK$/i, "").replace(/\D/g, "");
  const lot = isUs ? 1 : (HK_LOT[hkDigits] || HK_LOT[hkDigits.padStart(5, "0")] || 100);

  const d = await fetchDaily(sym);
  if (d.close.length < ATR_PERIOD + 5) throw new Error(`Insufficient history (only ${d.close.length} days; Turtle needs at least ${ATR_PERIOD + 5} days)`);
  const ind = indicators(d);
  const i = d.close.length - 1;
  const close = round(d.close[i], 2);
  const atr = ind.atr[i];
  if (!isFinite(atr) || atr <= 0) throw new Error("ATR calculation failed (abnormal data)");
  const high20 = ind.high20[i], low10 = ind.low10[i], high55 = ind.high55[i], low20 = ind.low20[i];
  const s1Break = ind.s1Break[i], s2Break = ind.s2Break[i], s1Skip = ind.s1Skip[i];
  const s1Eff = s1Break && !s1Skip;
  const effSignal = s1Eff || s2Break;
  const pos = calcPosition(account, atr, lot, close, isUs);
  const pyramid = effSignal ? pyramidLevels(close, atr) : null;
  // Strength score
  let strength: number | null = null;
  if (d.close.length >= STRENGTH_LOOKBACK + 1) strength = round((d.close[i] - d.close[i - STRENGTH_LOOKBACK]) / atr, 2);
  const distS1 = isFinite(high20) ? (high20 - close) / atr : null;
  const distS2 = isFinite(high55) ? (high55 - close) / atr : null;
  const date = new Date(ind.dates[i] * 1000).toISOString().slice(0, 10);
  const marketName = isUs ? "US" : "HK";

  // headline
  const headline = s1Eff && s2Break ? "🟢 S1+S2 Buy" : s1Eff ? "🟢 S1 Buy" : s2Break ? "🟢 S2 Buy"
    : s1Skip ? "🚫 S1 skipped (wait for S2)" : (isFinite(low10) && close < low10 ? "🔴 Exit zone" : "⚪ Wait");

  // One-line conclusion
  let concl: string;
  if (s1Eff && s2Break) concl = `🟢 **Buy signal — S1 + S2 breakout at once (strongest)**\n\nThe short-term (20-day) and long-term (55-day) breakouts appearing together is the clearest entry signal in the Turtle system. → **Recommendation: enter near the current price of ${cur}${fmt(close)} at the computed position size, set the stop at ${cur}${fmt(pos.stop_price)} (2N), and exit unconditionally the moment it breaks below.**`;
  else if (s1Eff) concl = `🟢 **Buy signal — S1 (20-day breakout)**\n\nThe price broke above the highest point of the past 20 trading days; the short-term trend has turned up. → **Recommendation: enter near the current price of ${cur}${fmt(close)}, stop ${cur}${fmt(pos.stop_price)} (2N).**`;
  else if (s2Break) concl = `🟢 **Buy signal — S2 (55-day breakout)**\n\nThe price broke above the highest point of the past 55 trading days; the long-term trend has turned up. → **Recommendation: enter near the current price of ${cur}${fmt(close)}, stop ${cur}${fmt(pos.stop_price)} (2N).**`;
  else if (s1Skip) concl = `🟡 **S1 triggered, but skipped per the rules — wait for S2**\n\nThe price did break the 20-day high, but the previous S1 breakout was a "profitable breakout", and the original Turtle rules require skipping this one (to filter out whipsaws) and instead waiting for the 55-day S2 breakout. → **Recommendation: do not enter yet; watch the 55-day high at ${cur}${fmt(high55)}.**`;
  else if (isFinite(low10) && close < low10) concl = `🔴 **In the exit zone — already broke below the 10-day low**\n\nThe price broke below the lowest point of the past 10 trading days, which is S1's exit signal. Holders should **exit** per the rules; those in cash should **not treat this as a buy point**. → **Recommendation: holders exit, those in cash wait.**`;
  else { const ds = distS1 != null ? `still about ${fmt(distS1, 1)} N (≈ ${cur}${fmt(atr * distS1)}) away from breaking the 20-day high` : ""; concl = `⚪ **No signal yet — wait**\n\nThe price is in the middle of the channel, having neither broken the upper band (buy point) nor the lower band (sell point). The Turtle system is trend-following: **no breakout, no action**. ${ds}. → **Recommendation: set an alert at the 20-day high of ${cur}${fmt(high20)} and act on the breakout.**`; }

  const atrPct = (atr / close) * 100;
  const s1Status = s1Break && s1Skip ? "🚫 Triggered but skipped (previous was a profitable breakout)" : s1Break ? "🟢 Triggered" : "— Not triggered";
  const s2Status = s2Break ? "🟢 Triggered" : "— Not triggered";
  const sigVerdict = effSignal ? "### ✅ A valid buy signal is present\n\nThe price has broken above the upper band; proceed to the next step and compute the position size."
    : s1Skip ? `### 🚫 S1 triggered but skipped\n\nPer the original rules, wait for S2 (55-day breakout). It is currently ${fmt(distS2, 1)} N away from an S2 breakout.`
    : `### ⚪ No signal yet\n\nThe price has not broken any upper band; per Turtle discipline, **do not enter**. It is about ${fmt(distS1, 1)} N away from an S1 breakout.`;

  // Position table (differs for US / HK)
  let posTable: string;
  if (isUs) {
    posTable = `| Item | Value |
|---|---:|
| Account size | ${cur}${fmt(account, 0)} |
| Max risk per trade (1%) | ${cur}${fmt(pos.risk_amount)} |
| Risk per share (2N) | ${cur}${fmt(pos.risk_per_share)} |
| Theoretical shares | ${fmt(pos.raw_shares, 1)} shares |
| **Suggested shares** | **${pos.suggested_shares} shares** |
| Cost | ${cur}${fmt(pos.cost, 0)} |
| Actual risk | ${cur}${fmt(pos.actual_risk)} (${fmt(pos.risk_pct, 1)}%) |

> **Execution advice**: ${pos.recommendation} — ${pos.rec_reason}`;
  } else {
    posTable = `| Item | Value |
|---|---:|
| Account size | ${cur}${fmt(account, 0)} |
| Max risk per trade (1%) | ${cur}${fmt(pos.risk_amount)} |
| Risk per share (2N) | ${cur}${fmt(pos.risk_per_share)} |
| Theoretical shares | ${fmt(pos.raw_shares, 1)} shares |
| Board lot (${lot} shares/lot) | ${pos.lot_shares} shares · cost ${cur}${fmt(pos.lot_cost!, 0)} · risk ${fmt(pos.lot_risk_pct!, 1)}% |
| Odd lot | ${pos.odd_shares} shares · cost ${cur}${fmt(pos.odd_cost!, 0)} · position ${fmt(pos.odd_position_pct!, 1)}% |

> **Execution advice**: ${pos.recommendation} — ${pos.rec_reason}

> ⚠️ The HK board-lot size is estimated from the watchlist config or a default of 100 shares; go by your broker's display for live trading.`;
  }

  const pyramidSec = !pyramid
    ? "**Rule**: each time the price rises another **0.5N** after entry, add 1 unit, up to a maximum of **4 units**; every time you add, move the overall stop up by 0.5N (to lock in profit).\n\n> ⚪ There is currently no valid entry signal, so there is no pyramiding ladder yet. Once a buy signal appears, this section will give the specific add prices for units 1→4."
    : `**What it tests**: the Turtle motto is "cut losses, let profits run". When the trend goes your way, **add with the trend** to amplify gains, but on a strict ladder — add 1 unit for every **0.5N** rise, up to **${PYRAMID_MAX} units**.\n\n**Why**: adding lets the right trend earn more; meanwhile every add moves the overall stop up, keeping total risk always ≈2N.\n\n| Add unit | Add price | Overall stop after adding |\n|---|---:|---:|\n` +
      pyramid.map((p) => `| Unit ${p.unit} | ${cur}${fmt(p.entry)} | ${cur}${fmt(p.stop)} |`).join("\n") +
      "\n\n> 💡 Add unit by unit along the ladder, moving the stop up to the corresponding level with each add. **Only add while in profit; never average down while losing.**";

  const strengthSec = strength == null ? "" : `## 📈 Strength score (reference)\n\n**3-month momentum ÷ N = ${fmt(strength)}** — the gain over the past ~${STRENGTH_LOOKBACK} trading days divided by N. The higher the score, the stronger the trend; it is currently ${strength > 0 ? "positive (rising over the last 3 months, on the strong side)" : "negative (falling over the last 3 months, on the weak side)"}. When several stocks give signals on the same day and capital is limited, **prioritize the one with the higher score** (as advised in Chapter 10 of the book).\n\n---\n`;

  return [
    `# 🐢 ${sym} (${marketName}) Turtle Trading Analysis Report`,
    `**Date**: ${date}  ·  **Current price**: ${cur}${fmt(close)}  ·  **Overall signal**: ${headline}\n`,
    "---\n",
    `## 🎯 One-line conclusion\n\n${concl}`,
    "\n---\n",
    "## 📚 What is this report?\n\n**The Turtle trading rules** are a **fully mechanical** trend-following system that legendary trader Richard Dennis used in 1983 to train a group of novices (codenamed \"Turtles\") — no forecasting, no guessing tops or bottoms, doing only one thing: **enter when the price makes a new high, exit once it pulls back a set amount**. Its essence is not in stock picking but in **strict position-sizing and stop-loss discipline**.\n\nThis report walks you step by step through the Turtle routine: **① measure volatility (N) → ② check the signal → ③ size the position → ④ set the stop → ⑤ pyramid**, explaining the \"why\" at each step.",
    "\n---\n",
    `## Step 1: N (ATR) — how "jumpy" is this stock?\n\n**What it tests**: use the **20-day ATR (Average True Range)** to gauge roughly how much this stock moves in dollars each day. The Turtles call it **N**, and it is the **foundation of every later calculation**.\n\n**Why it matters**: a more volatile stock means you buy fewer shares for the same money; a less volatile one means you can buy more. Measuring everything in N lets you manage risk on stocks of different prices and markets on the same ruler.\n\n| Metric | Value | Meaning |\n|---|---:|---|\n| Current price | ${cur}${fmt(close)} | Latest close |\n| **N (20-day ATR)** | **${cur}${fmt(atr)}** | Average daily move |\n| N / price | ${fmt(atrPct, 1)}% | Volatility as a share of price |\n\n> 💡 This stock moves roughly **${cur}${fmt(atr)}** up or down each day (about ${fmt(atrPct, 1)}%). Every step below uses it.`,
    "\n---\n",
    `## Step 2: Entry signal — has it broken out?\n\n**What it tests**: the Turtle system has two parallel entry systems; a signal from either one counts as a buy point.\n\n- **S1 (short-term system)**: price > past **20-day** high → buy\n- **S2 (long-term system)**: price > past **55-day** high → buy\n\n**Why two systems**: S1 reacts fast but is prone to false-breakout "whipsaws"; S2 is slower but more reliable. The original rule: **if the previous S1 breakout was profitable, skip this S1** and fall back to the steadier S2.\n\n| System | Breakout line | Current price | Status |\n|---|---:|---:|---|\n| S1 · 20-day high | ${cur}${fmt(high20)} | ${cur}${fmt(close)} | ${s1Status} |\n| S2 · 55-day high | ${cur}${fmt(high55)} | ${cur}${fmt(close)} | ${s2Status} |\n\n${sigVerdict}`,
    "\n---\n",
    `## Step 3: Position — how many shares to buy?\n\n**What it tests**: the Turtle's core discipline — **1 "unit" of risk = 1% of the account**.\n\n**How it's computed**: shares per unit = (account × 1%) ÷ (2N).\n\n${posTable}`,
    "\n---\n",
    `## Step 4: Stop-loss — how much loss before you admit defeat?\n\n**What it tests**: the Turtle iron rule is a **2N stop-loss** — exit unconditionally once the price falls 2 N from the entry price.\n\n**Why**: a stop-loss is not "you were wrong", it's "your risk budget is used up". Keeping losses within 1% of the account means 10 losses in a row only dent you 10%.\n\n| Item | Value |\n|---|---:|\n| Entry price (current) | ${cur}${fmt(close)} |\n| 2N | ${cur}${fmt(2 * atr)} |\n| **Stop price** | **${cur}${fmt(pos.stop_price)}** |\n\n> 💡 The moment you buy, place the stop order at **${cur}${fmt(pos.stop_price)}**. When it hits that price, leave — no hesitation.`,
    "\n---\n",
    `## Step 5: Pyramiding — how to add when winning?\n\n${pyramidSec}`,
    "\n---\n",
    `## Step 6: Exit — when to take profit?\n\n**What it tests**: besides the 2N stop-loss, the Turtle also has a **trend-reversal exit**:\n\n- **S1 exit**: price breaks below the past **10-day** low → exit\n- **S2 exit**: price breaks below the past **20-day** low → exit\n\n**Why**: trend-following doesn't guess the top — ride it as far as it goes; only when the price pulls back on its own and breaks the lower band do you confirm the trend is over.\n\n| Exit system | Exit line | Current price | Triggered? |\n|---|---:|---:|---|\n| S1 · 10-day low | ${cur}${fmt(low10)} | ${cur}${fmt(close)} | ${isFinite(low10) && close < low10 ? "🔴 Yes" : "— No"} |\n| S2 · 20-day low | ${cur}${fmt(low20)} | ${cur}${fmt(close)} | ${isFinite(low20) && close < low20 ? "🔴 Yes" : "— No"} |`,
    "\n---\n",
    strengthSec +
    "## ✅ Action checklist\n\n1. **Only enter on a breakout** — no breakout of the upper band, no action.\n2. **Place the stop the moment you buy** — put the stop order at 2N immediately and leave unconditionally if it breaks.\n3. **Position = 1% account risk** — never bet heavily on a single name.\n4. **Add with the trend, never average down** — only add on the 0.5N ladder while in profit.\n5. **Execute mechanically** — the Turtle's edge is entirely in discipline.",
    "\n---\n",
    "## ⚠️ Risk disclaimer\n\n- The Turtle is a **trend-following** system; in choppy markets it takes frequent small losses (getting \"whipsawed\") and earns them back on a few big trends — **consecutive losses are normal**.\n- Historical backtests show the Turtle wins about 40% of the time, with max drawdowns of 30-44% and drawdown periods lasting 8-28 months; **most people fail because they can't stand consecutive losses**.\n- This report is auto-generated from public data and is **for learning only, not investment advice**. Practice with a demo account or a tiny position before trading live.",
    `\n---\n*Report generated by the AI Chain · Analysis Tool · ${FORMULA_VERSION} · data source Yahoo Finance · ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC*\n`,
  ].join("\n");
}
