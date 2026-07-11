// Data layer for the analysis tools: Yahoo Finance free endpoints (CI-verified to work for US/HK stocks, see 2026-06-12 probe).
// - chart endpoint (no auth): current price, currency, company name, full dividend history
// - fundamentals-timeseries endpoint (no auth): last ~4 years of annual reports (revenue/net income/EPS/balance sheet/equity/shares)
// - quoteSummary endpoint (requires cookie+crumb, full auth flow implemented): financial-statement currency, BPS fallback; degrades gracefully on failure
// - FX: automatically converts when the financial-statement currency differs from the stock-price currency (e.g. Tencent reports in CNY but trades in HKD)

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36";

async function yfetch(url: string, headers: Record<string, string> = {}): Promise<Response> {
  return fetch(url, { headers: { "user-agent": UA, ...headers } });
}

// Symbol normalization: US tickers pass through in uppercase; HK codes are padded to 4 digits + ".HK" (00700 / 700 / 0700 → 0700.HK)
export function normalizeSymbol(raw: string, market: "us" | "hk"): string {
  const s = raw.trim().toUpperCase().replace(/\.HK$/i, "");
  if (market === "hk" || /^\d+$/.test(s)) {
    const digits = s.replace(/\D/g, "").replace(/^0+(?=\d{4})/, "");
    return digits.padStart(4, "0") + ".HK";
  }
  return s;
}

export interface ChartData {
  price: number;
  currency: string;          // stock-price currency (USD / HKD)
  name: string;
  dividends: { date: Date; amount: number }[]; // full dividend history (ascending by date)
}

// Current price + currency + company name + last 16 years of dividends.
// Note (CI-verified): with monthly interval + range=max, Yahoo truncates dividend events (KO only goes back to 2003);
// switching to a "last 16 years + daily" window returns complete events — G4 only needs to assess continuity over the last 10 years, so a 16-year window is enough.
const DIV_WINDOW_YEARS = 16;
export async function fetchChart(sym: string): Promise<ChartData> {
  const p2 = Math.floor(Date.now() / 1000);
  const p1 = p2 - 86400 * 365 * DIV_WINDOW_YEARS;
  const r = await yfetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?period1=${p1}&period2=${p2}&interval=1d&events=div`);
  if (!r.ok) throw new Error(`Quote endpoint HTTP ${r.status} (symbol may not exist)`);
  const d = await r.json() as any;
  const res = d?.chart?.result?.[0];
  if (!res) throw new Error(d?.chart?.error?.description || "Quote data is empty (please check the symbol)");
  const meta = res.meta || {};
  const divsRaw = res.events?.dividends || {};
  const dividends = Object.values(divsRaw as Record<string, { amount: number; date: number }>)
    .map((x) => ({ date: new Date(x.date * 1000), amount: x.amount }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  return {
    price: Number(meta.regularMarketPrice),
    currency: String(meta.currency || "USD"),
    name: String(meta.longName || meta.shortName || ""),
    dividends,
  };
}

export interface AnnualRow {
  year: string;              // "2025"
  revenue?: number; netIncome?: number; eps?: number;
  currentAssets?: number; currentLiabilities?: number;
  totalAssets?: number; totalLiabilities?: number;
  equity?: number; shares?: number;
}

const TS_TYPES = [
  "annualTotalRevenue", "annualNetIncomeCommonStockholders", "annualNetIncome",
  "annualCurrentAssets", "annualCurrentLiabilities",
  "annualTotalAssets", "annualTotalLiabilitiesNetMinorityInterest",
  "annualBasicEPS", "annualStockholdersEquity", "annualBasicAverageShares",
];

// Annual-report time series (Yahoo typically provides the last 4 fiscal years). Returned in descending year order (latest first), matching the original Python script.
export async function fetchAnnuals(sym: string): Promise<AnnualRow[]> {
  const now = Math.floor(Date.now() / 1000);
  const url = `https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${encodeURIComponent(sym)}` +
    `?symbol=${encodeURIComponent(sym)}&type=${TS_TYPES.join(",")}&period1=${now - 86400 * 365 * 15}&period2=${now}`;
  const r = await yfetch(url);
  if (!r.ok) throw new Error(`Annual-report endpoint HTTP ${r.status}`);
  const d = await r.json() as any;
  const results = d?.timeseries?.result;
  if (!Array.isArray(results)) throw new Error("Annual-report data is empty");

  const byYear: Record<string, AnnualRow> = {};
  const put = (date: string, key: keyof AnnualRow, v: number) => {
    const y = date.slice(0, 4);
    byYear[y] = byYear[y] || { year: y };
    (byYear[y] as any)[key] = v;
  };
  const fieldMap: Record<string, keyof AnnualRow> = {
    annualTotalRevenue: "revenue",
    annualNetIncomeCommonStockholders: "netIncome",
    annualNetIncome: "netIncome",          // fallback (used when net income to common shareholders is missing)
    annualCurrentAssets: "currentAssets",
    annualCurrentLiabilities: "currentLiabilities",
    annualTotalAssets: "totalAssets",
    annualTotalLiabilitiesNetMinorityInterest: "totalLiabilities",
    annualBasicEPS: "eps",
    annualStockholdersEquity: "equity",
    annualBasicAverageShares: "shares",
  };
  // Write the fallback field first, then let the preferred field override it (net income to common shareholders overrides net income)
  const order = ["annualNetIncome", ...TS_TYPES.filter((t) => t !== "annualNetIncome")];
  for (const t of order) {
    const item = results.find((x: any) => x?.meta?.type?.[0] === t);
    if (!item) continue;
    for (const v of item[t] || []) {
      if (v && v.asOfDate && v.reportedValue?.raw != null) put(v.asOfDate, fieldMap[t], Number(v.reportedValue.raw));
    }
  }
  return Object.values(byYear).sort((a, b) => b.year.localeCompare(a.year));
}

export interface SummaryExtra {
  financialCurrency: string | null; // financial-statement currency (e.g. Tencent's CNY)
  bookValue: number | null;         // book value per share fallback (in financial-statement currency)
  trailingEps: number | null;
}

// quoteSummary requires cookie+crumb (flow CI-verified to work). On failure it degrades to empty values without blocking the report.
export async function fetchSummaryExtra(sym: string): Promise<SummaryExtra> {
  const empty: SummaryExtra = { financialCurrency: null, bookValue: null, trailingEps: null };
  try {
    const r1 = await yfetch("https://fc.yahoo.com");
    const cookies = (r1.headers as any).getSetCookie?.() ?? (r1.headers.get("set-cookie") ? [r1.headers.get("set-cookie") as string] : []);
    const cookie = cookies.map((c: string) => c.split(";")[0]).join("; ");
    if (!cookie) return empty;
    const r2 = await yfetch("https://query1.finance.yahoo.com/v1/test/getcrumb", { cookie });
    if (!r2.ok) return empty;
    const crumb = (await r2.text()).trim();
    if (!crumb || crumb.includes("<")) return empty;
    const r3 = await yfetch(
      `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(sym)}?modules=financialData,defaultKeyStatistics&crumb=${encodeURIComponent(crumb)}`,
      { cookie });
    if (!r3.ok) return empty;
    const d = await r3.json() as any;
    const res = d?.quoteSummary?.result?.[0];
    return {
      financialCurrency: res?.financialData?.financialCurrency ?? null,
      bookValue: res?.defaultKeyStatistics?.bookValue?.raw ?? null,
      trailingEps: res?.defaultKeyStatistics?.trailingEps?.raw ?? null,
    };
  } catch {
    return empty;
  }
}

// FX rate (e.g. CNYHKD=X). Returns null on failure; the caller handles the fallback.
export async function fetchFx(from: string, to: string): Promise<number | null> {
  if (from === to) return 1;
  try {
    const r = await yfetch(`https://query1.finance.yahoo.com/v8/finance/chart/${from}${to}=X?range=5d&interval=1d`);
    if (!r.ok) return null;
    const d = await r.json() as any;
    const v = d?.chart?.result?.[0]?.meta?.regularMarketPrice;
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}

// ── Daily OHLCV needed by CAN SLIM / Turtle ───────────────────────
export interface Daily {
  dates: number[]; close: number[]; high: number[]; low: number[]; volume: number[];
  currency: string; name: string; price: number;
}

// Fetch daily bars (default last 2 years, ~500 trading days, enough for MA200 / 52-week high / RS). Pass "SPY"/"^HSI" etc. for the benchmark.
export async function fetchDaily(sym: string, range = "2y"): Promise<Daily> {
  const r = await yfetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=${range}&interval=1d`);
  if (!r.ok) throw new Error(`Quote endpoint HTTP ${r.status} (symbol may not exist)`);
  const d = await r.json() as any;
  const res = d?.chart?.result?.[0];
  if (!res) throw new Error(d?.chart?.error?.description || "Quote data is empty");
  const ts: number[] = res.timestamp || [];
  const q = res.indicators?.quote?.[0] || {};
  const dates: number[] = [], close: number[] = [], high: number[] = [], low: number[] = [], volume: number[] = [];
  for (let i = 0; i < ts.length; i++) {
    const c = q.close?.[i];
    if (c == null) continue; // skip halted/gap days
    dates.push(ts[i]); close.push(c);
    high.push(q.high?.[i] ?? c); low.push(q.low?.[i] ?? c); volume.push(q.volume?.[i] ?? 0);
  }
  const meta = res.meta || {};
  return {
    dates, close, high, low, volume,
    currency: String(meta.currency || "USD"),
    name: String(meta.longName || meta.shortName || ""),
    price: Number(meta.regularMarketPrice ?? close[close.length - 1]),
  };
}

export interface FinPoint { date: string; eps?: number; netIncome?: number; revenue?: number; equity?: number }

// Fetch quarterly + annual financial time series (EPS / net income / revenue / equity), in descending date order (latest first).
export async function fetchFin(sym: string): Promise<{ annual: FinPoint[]; quarterly: FinPoint[] }> {
  const types = [
    "annualBasicEPS", "annualNetIncome", "annualTotalRevenue", "annualStockholdersEquity",
    "quarterlyBasicEPS", "quarterlyNetIncome", "quarterlyTotalRevenue",
  ].join(",");
  const now = Math.floor(Date.now() / 1000);
  const url = `https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${encodeURIComponent(sym)}` +
    `?symbol=${encodeURIComponent(sym)}&type=${types}&period1=${now - 86400 * 365 * 12}&period2=${now}`;
  const r = await yfetch(url);
  if (!r.ok) return { annual: [], quarterly: [] };
  const d = await r.json() as any;
  const results = d?.timeseries?.result;
  if (!Array.isArray(results)) return { annual: [], quarterly: [] };

  const build = (prefix: "annual" | "quarterly"): FinPoint[] => {
    const byDate: Record<string, FinPoint> = {};
    const map: Record<string, keyof FinPoint> = {
      [prefix + "BasicEPS"]: "eps", [prefix + "NetIncome"]: "netIncome",
      [prefix + "TotalRevenue"]: "revenue", [prefix + "StockholdersEquity"]: "equity",
    };
    for (const [type, field] of Object.entries(map)) {
      const item = results.find((x: any) => x?.meta?.type?.[0] === type);
      if (!item) continue;
      for (const v of item[type] || []) {
        if (v && v.asOfDate && v.reportedValue?.raw != null) {
          byDate[v.asOfDate] = byDate[v.asOfDate] || { date: v.asOfDate };
          (byDate[v.asOfDate] as any)[field] = Number(v.reportedValue.raw);
        }
      }
    }
    return Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date));
  };
  return { annual: build("annual"), quarterly: build("quarterly") };
}
