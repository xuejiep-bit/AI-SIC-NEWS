// 分析工具页（/tools）：输入股票代码 → 选策略 → 生成 Markdown 分析报告。
// 阶段1: Graham 已上线；CAN SLIM / 海龟 为占位（即将上线）。

export const TOOLS_HTML = /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<title>Stock Analysis Tools · AIChain</title>
<meta name="description" content="Free teaching-style stock analysis for US and Hong Kong equities — Graham value, CAN SLIM growth-momentum, and Turtle trend-following strategies. Enter a ticker and get a plain-English report. Data from Yahoo Finance; not investment advice." />
<link rel="canonical" href="https://ai.vid2quiz.com/tools" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="AIChain" />
<meta property="og:title" content="Stock Analysis Tools — AIChain" />
<meta property="og:description" content="Graham, CAN SLIM and Turtle strategy reports for US & HK stocks. Enter a ticker, get a teaching-style analysis in seconds." />
<meta property="og:url" content="https://ai.vid2quiz.com/tools" />
<meta property="og:image" content="https://ai.vid2quiz.com/og.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://ai.vid2quiz.com/og.png" />
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebApplication","name":"AIChain Stock Analysis Tools","url":"https://ai.vid2quiz.com/tools","applicationCategory":"FinanceApplication","operatingSystem":"Web","inLanguage":"en","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"description":"Teaching-style stock analysis for US and Hong Kong equities using the Graham value, CAN SLIM growth-momentum, and Turtle trend-following strategies. Data from Yahoo Finance; not investment advice.","isPartOf":{"@type":"WebSite","name":"AIChain","url":"https://ai.vid2quiz.com/"}}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://ai.vid2quiz.com/"},{"@type":"ListItem","position":2,"name":"Analysis Tools","item":"https://ai.vid2quiz.com/tools"}]}</script>
<style>
  :root { --bg:#0b0e14; --panel:#131826; --panel2:#1a2030; --line:#232a3d;
    --txt:#e6e9f0; --dim:#8a93a8; --acc:#4f8cff; --acc2:#36d399; --invest:#f5b301; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--txt);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif; }
  header { padding:18px 24px; border-bottom:1px solid var(--line); background:var(--panel);
    display:flex; align-items:center; gap:14px; }
  header .logo { width:34px; height:34px; border-radius:9px; background:linear-gradient(135deg,var(--acc),var(--acc2));
    color:#fff; font-weight:800; font-size:14px; display:flex; align-items:center; justify-content:center;
    text-decoration:none; cursor:pointer; }
  header .logo:hover { filter:brightness(1.12); }
  header h1 { font-size:17px; margin:0; }
  header a.back { margin-left:auto; color:var(--acc); text-decoration:none; font-size:13px; }
  .wrap { max-width:880px; margin:0 auto; padding:22px 20px 80px; }
  .formbox { background:var(--panel); border:1px solid var(--line); border-radius:14px; padding:18px 20px;
    display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
  .formbox input { background:var(--panel2); border:1px solid var(--line); color:var(--txt);
    border-radius:8px; padding:10px 14px; width:180px; font-size:14px; }
  .formbox select { background:var(--panel2); border:1px solid var(--line); color:var(--txt);
    border-radius:8px; padding:10px 12px; font-size:13px; }
  .btn { background:var(--acc); color:#fff; border:none; border-radius:8px; padding:10px 20px;
    cursor:pointer; font-size:14px; font-weight:600; }
  .btn:disabled { opacity:.5; cursor:wait; }
  .hint { color:var(--dim); font-size:12.5px; margin-top:10px; line-height:1.7; }
  #status { color:var(--dim); font-size:13px; margin:16px 0; }
  /* 报告渲染区 */
  #report { background:var(--panel); border:1px solid var(--line); border-radius:14px;
    padding:26px 30px; margin-top:18px; display:none; line-height:1.75; font-size:14px; }
  #report h1 { font-size:21px; border-bottom:1px solid var(--line); padding-bottom:12px; }
  #report h2 { font-size:17px; margin-top:28px; color:var(--acc); }
  #report h3 { font-size:15px; }
  #report h4 { font-size:13.5px; color:var(--dim); }
  #report table { border-collapse:collapse; margin:10px 0; width:auto; min-width:50%; }
  #report th, #report td { border:1px solid var(--line); padding:7px 14px; font-size:13px; }
  #report th { background:var(--panel2); }
  #report hr { border:none; border-top:1px solid var(--line); margin:22px 0; }
  #report blockquote { border-left:3px solid var(--invest); margin:10px 0; padding:6px 14px;
    background:var(--panel2); border-radius:0 8px 8px 0; color:var(--dim); }
  #report code { background:var(--panel2); padding:1px 6px; border-radius:5px; font-size:12.5px; }
  #report li { margin:4px 0; }
  #report .dl { float:right; color:var(--acc); font-size:12.5px; cursor:pointer; }
  @media (max-width:600px){ .formbox input{width:100%;} .btn{width:100%;} #report{padding:18px;} }
</style>
</head>
<body>
<header>
  <a class="logo" href="/" title="Home" aria-label="Home">AI</a>
  <h1>📊 Analysis Tools</h1>
  <a class="back" href="/">← Back to news</a>
</header>
<div class="wrap">
  <div class="formbox">
    <input id="sym" placeholder="Ticker, e.g. KO or 00700" />
    <select id="market">
      <option value="auto">Auto-detect market</option>
      <option value="us">🇺🇸 US</option>
      <option value="hk">🇭🇰 Hong Kong</option>
    </select>
    <select id="strategy">
      <option value="graham">Graham (Value)</option>
      <option value="canslim">CAN SLIM (Growth Momentum)</option>
      <option value="turtle">Turtle (Trend Following)</option>
    </select>
    <input id="account" type="number" min="1" placeholder="Account size (optional)" style="display:none;width:150px" />
    <button class="btn" id="go">Generate report</button>
  </div>
  <div class="hint">
    Enter a <b>US stock</b> (letter ticker, e.g. KO / JNJ / AAPL) or <b>Hong Kong stock</b> (numeric code, e.g. 00700 / 00939),
    choose an analysis strategy, and generate a teaching-style report you can actually learn from. Reports for the same stock are cached for the day and returned instantly.
    <br/>Data: Yahoo Finance · Not investment advice.
  </div>
  <div id="status"></div>
  <div id="report"></div>
</div>
<script>
const $ = s => document.querySelector(s);

// ── 迷你 Markdown 渲染器（支持报告用到的全部语法：标题/表格/列表/粗体/引用/分隔线/任务清单）──
function esc(s){ return s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
function inline(s){
  return esc(s)
    .replace(/\\*\\*([^*]+)\\*\\*/g, "<b>$1</b>")
    .replace(/\\\`([^\\\`]+)\\\`/g, "<code>$1</code>");
}
function renderMd(md){
  const lines = md.split("\\n");
  let html = "", i = 0, inList = false, listTag = "";
  const closeList = ()=>{ if(inList){ html += "</"+listTag+">"; inList = false; } };
  while(i < lines.length){
    const L = lines[i];
    // 表格：当前行和下一行构成表头+分隔线
    if(L.trim().startsWith("|") && i+1 < lines.length && /^\\s*\\|[\\s:|-]+\\|?\\s*$/.test(lines[i+1])){
      closeList();
      const cells = r => r.split("|").slice(1, -1).map(c=>c.trim());
      // 兼容行尾无 | 的写法
      const cells2 = r => { const p = r.trim().replace(/^\\|/,"").replace(/\\|$/,"").split("|"); return p.map(c=>c.trim()); };
      html += "<table><thead><tr>" + cells2(L).map(c=>"<th>"+inline(c)+"</th>").join("") + "</tr></thead><tbody>";
      i += 2;
      while(i < lines.length && lines[i].trim().startsWith("|")){
        html += "<tr>" + cells2(lines[i]).map(c=>"<td>"+inline(c)+"</td>").join("") + "</tr>";
        i++;
      }
      html += "</tbody></table>";
      continue;
    }
    const h = L.match(/^(#{1,4})\\s+(.*)$/);
    if(h){ closeList(); html += "<h"+h[1].length+">"+inline(h[2])+"</h"+h[1].length+">"; i++; continue; }
    if(/^\\s*---+\\s*$/.test(L)){ closeList(); html += "<hr/>"; i++; continue; }
    if(/^>\\s?/.test(L)){ closeList(); html += "<blockquote>"+inline(L.replace(/^>\\s?/,""))+"</blockquote>"; i++; continue; }
    const task = L.match(/^\\s*-\\s+\\[( |x)\\]\\s+(.*)$/);
    if(task){
      if(!inList || listTag!=="ul"){ closeList(); html += "<ul>"; inList = true; listTag = "ul"; }
      html += '<li><input type="checkbox" disabled'+(task[1]==="x"?" checked":"")+'/> '+inline(task[2])+"</li>";
      i++; continue;
    }
    const ul = L.match(/^\\s*-\\s+(.*)$/);
    if(ul){
      if(!inList || listTag!=="ul"){ closeList(); html += "<ul>"; inList = true; listTag = "ul"; }
      html += "<li>"+inline(ul[1])+"</li>"; i++; continue;
    }
    const ol = L.match(/^\\s*\\d+\\.\\s+(.*)$/);
    if(ol){
      if(!inList || listTag!=="ol"){ closeList(); html += "<ol>"; inList = true; listTag = "ol"; }
      html += "<li>"+inline(ol[1])+"</li>"; i++; continue;
    }
    if(L.trim()===""){ closeList(); i++; continue; }
    closeList(); html += "<p>"+inline(L)+"</p>"; i++;
  }
  closeList();
  return html;
}

let lastMd = "", lastSym = "";
async function run(){
  const sym = $("#sym").value.trim();
  if(!sym){ $("#status").textContent = "Please enter a ticker"; return; }
  const market = $("#market").value;
  const strategy = $("#strategy").value;
  $("#go").disabled = true;
  $("#report").style.display = "none";
  $("#status").textContent = "Generating report… First run takes about 5-10 seconds; instant if already generated today.";
  try{
    const p = new URLSearchParams({ symbol: sym, strategy });
    if(market !== "auto") p.set("market", market);
    const acct = $("#account").value.trim();
    if(strategy==="turtle" && acct) p.set("account", acct);
    let r = await fetch("/api/report?" + p.toString());
    let d = await r.json();
    // CAN SLIM 首次需先算 RS 基准池（单独一次请求），返回 preparing 时自动重试一次
    if(d && d.preparing){
      $("#status").textContent = "Preparing RS benchmark data (first run is a bit slower)…";
      await new Promise(res=>setTimeout(res, 1500));
      r = await fetch("/api/report?" + p.toString());
      d = await r.json();
    }
    if(d.error){ $("#status").textContent = "❌ " + d.error; }
    else {
      lastMd = d.md; lastSym = d.symbol || sym;
      $("#status").textContent = d.cached ? "✓ Cache hit for today, returned instantly" : "✓ Report generated";
      $("#report").innerHTML = '<span class="dl" id="dlmd">⬇ Download Markdown</span>' + renderMd(d.md);
      $("#report").style.display = "block";
      $("#dlmd").onclick = ()=>{
        const blob = new Blob([lastMd], { type:"text/markdown" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = lastSym + "_" + strategy + "_" + new Date().toISOString().slice(0,10) + ".md";
        a.click();
      };
    }
  }catch(e){ $("#status").textContent = "❌ Request failed: " + e; }
  $("#go").disabled = false;
}
$("#go").onclick = run;
$("#sym").addEventListener("keydown", e=>{ if(e.key==="Enter") run(); });
// 海龟策略才显示「账户资金」输入框（其它策略用不到）
$("#strategy").addEventListener("change", ()=>{
  $("#account").style.display = $("#strategy").value==="turtle" ? "" : "none";
});
</script>
</body>
</html>`;
