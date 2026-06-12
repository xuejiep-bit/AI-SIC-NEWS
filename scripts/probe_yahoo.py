# 临时探针：实测 Yahoo Finance 对美股(KO)/港股(0700.HK)的可用性与字段深度。用完即删。
import json, urllib.request

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"}

def get(url):
    req = urllib.request.Request(url, headers=UA)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:300]
    except Exception as e:
        return None, str(e)

for sym in ["KO", "0700.HK"]:
    print(f"\n==================== {sym} : chart (price+div) ====================")
    code, body = get(f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}?range=2y&interval=1d&events=div")
    print("HTTP", code, "size", len(body or ""))
    try:
        r = json.loads(body)["chart"]["result"][0]
        m = r["meta"]
        print("  currency", m.get("currency"), "| price", m.get("regularMarketPrice"), "| name", m.get("longName") or m.get("shortName"))
        closes = [x for x in r["indicators"]["quote"][0]["close"] if x][-3:]
        print("  last closes", [round(c,2) for c in closes], "| bars:", len(r.get("timestamp",[])))
        divs = r.get("events", {}).get("dividends", {})
        print("  dividend events in 2y:", len(divs))
    except Exception as e:
        print("  parse error:", e, "| body head:", (body or "")[:200])

    print(f"==================== {sym} : quoteSummary (fundamentals) ====================")
    mods = "incomeStatementHistory,balanceSheetHistory,defaultKeyStatistics,summaryDetail,financialData,price"
    code, body = get(f"https://query1.finance.yahoo.com/v10/finance/quoteSummary/{sym}?modules={mods}")
    print("HTTP", code, "size", len(body or ""))
    try:
        d = json.loads(body)["quoteSummary"]
        if d.get("error"):
            print("  API error:", d["error"])
        else:
            res = d["result"][0]
            ish = res.get("incomeStatementHistory", {}).get("incomeStatementHistory", [])
            print("  income annual periods:", len(ish))
            for a in ish[:2]:
                print("   ", a.get("endDate",{}).get("fmt"), "rev", a.get("totalRevenue",{}).get("raw"), "netIncome", a.get("netIncome",{}).get("raw"))
            bs = res.get("balanceSheetHistory", {}).get("balanceSheetStatements", [])
            print("  balance periods:", len(bs))
            if bs:
                b = bs[0]
                print("   curAssets", b.get("totalCurrentAssets",{}).get("raw"), "curLiab", b.get("totalCurrentLiabilities",{}).get("raw"),
                      "totLiab", b.get("totalLiab",{}).get("raw"), "totAssets", b.get("totalAssets",{}).get("raw"))
            ks = res.get("defaultKeyStatistics", {})
            sd = res.get("summaryDetail", {})
            print("  bookValue", ks.get("bookValue",{}).get("raw"), "| trailingEps", ks.get("trailingEps",{}).get("raw"),
                  "| priceToBook", ks.get("priceToBook",{}).get("raw"))
            print("  trailingPE", sd.get("trailingPE",{}).get("raw"), "| divRate", sd.get("dividendRate",{}).get("raw"),
                  "| divYield", sd.get("dividendYield",{}).get("raw"))
    except Exception as e:
        print("  parse error:", e, "| body head:", (body or "")[:300])
