// 分析工具的数据层：Yahoo Finance 免费接口（CI 实测美股/港股均可用，见 2026-06-12 探针）。
// - chart 接口（免鉴权）：现价、币种、公司名、全量分红历史
// - fundamentals-timeseries 接口（免鉴权）：近 4 年年报（营收/净利/EPS/资产负债/净资产/股本）
// - quoteSummary 接口（需 cookie+crumb，做了完整鉴权流程）：财报币种、BPS 兜底；失败可降级
// - 汇率：财报币种 ≠ 股价币种时（如腾讯 CNY 财报/HKD 股价）自动换算

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36";

async function yfetch(url: string, headers: Record<string, string> = {}): Promise<Response> {
  return fetch(url, { headers: { "user-agent": UA, ...headers } });
}

// 代码归一化：美股大写直传；港股数字补足 4 位 + ".HK"（00700 / 700 / 0700 → 0700.HK）
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
  currency: string;          // 股价币种（USD / HKD）
  name: string;
  dividends: { date: Date; amount: number }[]; // 全量分红（按时间升序）
}

// 现价 + 币种 + 公司名 + 全量分红（range=max 月线，载荷小且分红齐全）
export async function fetchChart(sym: string): Promise<ChartData> {
  const r = await yfetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=max&interval=1mo&events=div`);
  if (!r.ok) throw new Error(`行情接口 HTTP ${r.status}（代码可能不存在）`);
  const d = await r.json() as any;
  const res = d?.chart?.result?.[0];
  if (!res) throw new Error(d?.chart?.error?.description || "行情数据为空（请检查代码）");
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

// 年报时间序列（Yahoo 通常提供最近 4 个年度）。返回按年份倒序（最新在前），与原 Python 脚本一致。
export async function fetchAnnuals(sym: string): Promise<AnnualRow[]> {
  const now = Math.floor(Date.now() / 1000);
  const url = `https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${encodeURIComponent(sym)}` +
    `?symbol=${encodeURIComponent(sym)}&type=${TS_TYPES.join(",")}&period1=${now - 86400 * 365 * 15}&period2=${now}`;
  const r = await yfetch(url);
  if (!r.ok) throw new Error(`年报接口 HTTP ${r.status}`);
  const d = await r.json() as any;
  const results = d?.timeseries?.result;
  if (!Array.isArray(results)) throw new Error("年报数据为空");

  const byYear: Record<string, AnnualRow> = {};
  const put = (date: string, key: keyof AnnualRow, v: number) => {
    const y = date.slice(0, 4);
    byYear[y] = byYear[y] || { year: y };
    (byYear[y] as any)[key] = v;
  };
  const fieldMap: Record<string, keyof AnnualRow> = {
    annualTotalRevenue: "revenue",
    annualNetIncomeCommonStockholders: "netIncome",
    annualNetIncome: "netIncome",          // 兜底（归母净利缺失时用净利）
    annualCurrentAssets: "currentAssets",
    annualCurrentLiabilities: "currentLiabilities",
    annualTotalAssets: "totalAssets",
    annualTotalLiabilitiesNetMinorityInterest: "totalLiabilities",
    annualBasicEPS: "eps",
    annualStockholdersEquity: "equity",
    annualBasicAverageShares: "shares",
  };
  // 先写兜底字段，再写优先字段覆盖（归母净利覆盖净利）
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
  financialCurrency: string | null; // 财报币种（如腾讯 CNY）
  bookValue: number | null;         // 每股净资产兜底（财报币种）
  trailingEps: number | null;
}

// quoteSummary 需要 cookie+crumb（CI 实测流程可用）。失败时降级返回空值，不阻塞报告。
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

// 汇率（如 CNYHKD=X）。失败返回 null，调用方自行降级。
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
