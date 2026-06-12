// 分析工具页（/tools）：输入股票代码 → 选策略 → 生成 Markdown 分析报告。
// 阶段1: Graham 已上线；CAN SLIM / 海龟 为占位（即将上线）。

export const TOOLS_HTML = /* html */ `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<title>分析工具 · AI 链</title>
<style>
  :root { --bg:#0b0e14; --panel:#131826; --panel2:#1a2030; --line:#232a3d;
    --txt:#e6e9f0; --dim:#8a93a8; --acc:#4f8cff; --acc2:#36d399; --invest:#f5b301; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--txt);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif; }
  header { padding:18px 24px; border-bottom:1px solid var(--line); background:var(--panel);
    display:flex; align-items:center; gap:14px; }
  header .logo { width:34px; height:34px; border-radius:9px; background:linear-gradient(135deg,var(--acc),var(--acc2));
    color:#fff; font-weight:800; font-size:14px; display:flex; align-items:center; justify-content:center; }
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
  <div class="logo">AI</div>
  <h1>📊 投资分析工具</h1>
  <a class="back" href="/">← 返回资讯首页</a>
</header>
<div class="wrap">
  <div class="formbox">
    <input id="sym" placeholder="股票代码, 如 KO 或 00700" />
    <select id="market">
      <option value="auto">自动识别市场</option>
      <option value="us">🇺🇸 美股</option>
      <option value="hk">🇭🇰 港股</option>
    </select>
    <select id="strategy">
      <option value="graham">Graham 价值投资</option>
      <option value="canslim" disabled>CAN SLIM（即将上线）</option>
      <option value="turtle" disabled>海龟交易（即将上线）</option>
    </select>
    <button class="btn" id="go">生成报告</button>
  </div>
  <div class="hint">
    输入一只<b>美股</b>(字母代码, 如 KO / JNJ / AAPL)或<b>港股</b>(数字代码, 如 00700 / 00939)股票,
    选择分析策略, 生成一份"看完能学会"的教学式分析报告. 同一只股票当天的报告会缓存, 秒出.
    <br/>数据源: Yahoo Finance · 本工具不构成投资建议.
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
  if(!sym){ $("#status").textContent = "请输入股票代码"; return; }
  const market = $("#market").value;
  const strategy = $("#strategy").value;
  $("#go").disabled = true;
  $("#report").style.display = "none";
  $("#status").textContent = "报告生成中… 首次生成约 5-10 秒, 当天已生成过则秒出.";
  try{
    const p = new URLSearchParams({ symbol: sym, strategy });
    if(market !== "auto") p.set("market", market);
    const r = await fetch("/api/report?" + p.toString());
    const d = await r.json();
    if(d.error){ $("#status").textContent = "❌ " + d.error; }
    else {
      lastMd = d.md; lastSym = d.symbol || sym;
      $("#status").textContent = d.cached ? "✓ 当天缓存命中, 即时返回" : "✓ 报告生成完成";
      $("#report").innerHTML = '<span class="dl" id="dlmd">⬇ 下载 Markdown</span>' + renderMd(d.md);
      $("#report").style.display = "block";
      $("#dlmd").onclick = ()=>{
        const blob = new Blob([lastMd], { type:"text/markdown" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = lastSym + "_" + strategy + "_" + new Date().toISOString().slice(0,10) + ".md";
        a.click();
      };
    }
  }catch(e){ $("#status").textContent = "❌ 请求失败: " + e; }
  $("#go").disabled = false;
}
$("#go").onclick = run;
$("#sym").addEventListener("keydown", e=>{ if(e.key==="Enter") run(); });
</script>
</body>
</html>`;
