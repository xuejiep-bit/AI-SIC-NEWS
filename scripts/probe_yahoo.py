# 临时探针 round 3：测 fundamentals-timeseries（免鉴权年报）+ crumb 鉴权流程（备选）。用完即删。
import json, time, urllib.request, urllib.parse

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"}

def get(url, headers=None):
    req = urllib.request.Request(url, headers={**UA, **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, r.read().decode(), r.headers
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:300], e.headers
    except Exception as e:
        return None, str(e), {}

TYPES = ",".join([
    "annualTotalRevenue", "annualNetIncome", "annualNetIncomeCommonStockholders",
    "annualCurrentAssets", "annualCurrentLiabilities",
    "annualTotalAssets", "annualTotalLiabilitiesNetMinorityInterest",
    "annualBasicEPS", "annualDilutedEPS",
    "annualStockholdersEquity", "annualBasicAverageShares",
])

p2 = int(time.time())
p1 = p2 - 86400 * 365 * 15  # 往回 15 年，看实际能给几年

for sym in ["KO", "0700.HK"]:
    print(f"\n========== {sym} : fundamentals-timeseries (no auth) ==========")
    url = (f"https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/{sym}"
           f"?symbol={sym}&type={TYPES}&period1={p1}&period2={p2}")
    code, body, _ = get(url)
    print("HTTP", code, "size", len(body or ""))
    try:
        res = json.loads(body)["timeseries"]["result"]
        for item in res:
            t = item["meta"]["type"][0]
            vals = item.get(t) or []
            pts = [(v["asOfDate"], v["reportedValue"]["raw"]) for v in vals if v]
            if t in ("annualTotalRevenue", "annualNetIncome", "annualBasicEPS", "annualStockholdersEquity"):
                print(f"  {t}: {len(pts)} periods -> {pts}")
            else:
                print(f"  {t}: {len(pts)} periods")
    except Exception as e:
        print("  parse error:", e, "| head:", (body or "")[:200])

print("\n========== crumb 鉴权流程（备选方案验证） ==========")
code, body, hdrs = get("https://fc.yahoo.com")
cookies = []
for k, v in (hdrs.items() if hdrs else []):
    if k.lower() == "set-cookie":
        cookies.append(v.split(";")[0])
cookie = "; ".join(cookies)
print("fc.yahoo.com:", code, "| cookie got:", bool(cookie))
if cookie:
    code, crumb, _ = get("https://query1.finance.yahoo.com/v1/test/getcrumb", {"Cookie": cookie})
    print("getcrumb:", code, "| crumb:", (crumb or "")[:16])
    if code == 200 and crumb:
        code, body, _ = get(
            f"https://query1.finance.yahoo.com/v10/finance/quoteSummary/KO?modules=summaryDetail,defaultKeyStatistics&crumb={urllib.parse.quote(crumb)}",
            {"Cookie": cookie})
        print("quoteSummary with crumb:", code, "| head:", (body or "")[:120])
