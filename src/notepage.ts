// 笔记独立阅读页（/note?id=xxx）：单篇深度笔记全幅展示，可单独分享。
// 数据来自 /api/vidnotes，关联环节名称来自 /api/mapdata（seg key → 中文名 + 跳地图）。

export const NOTE_HTML = /* html */ `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<title>深度笔记 · AI 链</title>
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
  header h1 { font-size:16px; margin:0; }
  header a.back { margin-left:auto; color:var(--acc); text-decoration:none; font-size:13px; }
  .wrap { max-width:760px; margin:0 auto; padding:30px 20px 70px; }
  h1.title { font-size:24px; line-height:1.4; margin:0 0 14px; }
  .meta { color:var(--dim); font-size:13px; display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:18px; }
  .watch { display:inline-flex; align-items:center; gap:6px; background:var(--invest); color:#1a1a1a;
    font-weight:700; text-decoration:none; padding:9px 16px; border-radius:9px; font-size:13.5px; margin-bottom:22px; }
  .chips { display:flex; flex-wrap:wrap; gap:7px; margin-bottom:22px; }
  .chip { padding:3px 11px; border-radius:20px; font-size:12.5px; font-weight:600; color:#fff; background:var(--invest); }
  .seglink { padding:3px 11px; border-radius:20px; font-size:12.5px; background:var(--panel2);
    border:1px solid var(--line); color:var(--acc); text-decoration:none; }
  .seglink:hover { border-color:var(--acc); }
  h2.sec { font-size:16px; margin:26px 0 10px; }
  .pts { padding-left:0; list-style:none; }
  .pts li { background:var(--panel); border:1px solid var(--line); border-left:3px solid var(--invest);
    border-radius:0 10px 10px 0; padding:11px 15px; margin-bottom:9px; line-height:1.65; font-size:14px; }
  .full p { line-height:1.85; font-size:15px; margin:0 0 15px; color:#dfe3ec; }
  .src { color:var(--dim); font-size:12px; border-top:1px solid var(--line); padding-top:14px; margin-top:24px; }
  /* 底部订阅 */
  .subbox { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-top:26px;
    background:linear-gradient(90deg,rgba(245,179,1,.12),rgba(79,140,255,.06));
    border:1px solid rgba(245,179,1,.4); border-radius:12px; padding:14px 18px; }
  .subbox .st { font-size:13px; margin-right:auto; }
  .subbox input { background:var(--panel2); border:1px solid var(--line); color:var(--txt);
    border-radius:8px; padding:9px 12px; width:200px; font-size:13px; }
  .subbox button { background:var(--invest); color:#1a1a1a; border:none; border-radius:8px;
    padding:9px 18px; font-weight:700; cursor:pointer; font-size:13px; }
  .subbox .msg { font-size:12px; color:var(--acc2); }
  #loading { color:var(--dim); padding:40px 0; text-align:center; }
  @media (max-width:600px){ .subbox input{width:100%;} .subbox button{width:100%;} }
</style>
</head>
<body>
<header>
  <div class="logo">AI</div>
  <h1>🎬 投资视频解读</h1>
  <a class="back" href="/?notes=1">← 全部笔记</a>
</header>
<div class="wrap">
  <div id="loading">加载中…</div>
  <article id="article" style="display:none"></article>
</div>
<script>
const $ = s => document.querySelector(s);
function esc(s){ return (s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

async function init(){
  const id = new URLSearchParams(location.search).get("id");
  let notes = [], segNames = {};
  try{
    const [vn, md] = await Promise.all([
      fetch("/api/vidnotes").then(r=>r.json()),
      fetch("/api/mapdata").then(r=>r.json()).catch(()=>({nodes:[]})),
    ]);
    notes = Array.isArray(vn) ? vn : [];
    (md.nodes||[]).forEach(n=>{ segNames[n.id] = n.name; });
  }catch(e){}
  const n = notes.find(x=>x.id===id);
  if(!n){ $("#loading").textContent = "未找到这篇笔记。"; return; }
  document.title = n.title + " · AI 链";

  const tks = (n.tickers||[]).map(t=>'<span class="chip">'+esc(t)+'</span>').join("");
  const segs = (n.segs||[]).map(s=>'<a class="seglink" href="/map">🔗 '+esc(segNames[s]||s)+'</a>').join("");
  const chips = (tks||segs) ? '<div class="chips">'+tks+segs+'</div>' : "";
  const pts = (n.takeaways||[]).map(p=>'<li>'+esc(p)+'</li>').join("");
  const paras = (n.summary||"").split("\\n").filter(s=>s.trim()).map(s=>'<p>'+esc(s)+'</p>').join("");

  $("#article").innerHTML =
    '<h1 class="title">'+esc(n.title)+'</h1>'+
    '<div class="meta"><span>'+esc(n.channel)+'</span><span>·</span><span>'+esc(n.date)+'</span>'+
      '<span>·</span><span>'+esc(n.videoTitle||"")+'</span></div>'+
    (n.url?'<a class="watch" href="'+esc(n.url)+'" target="_blank" rel="noopener">▶ 观看原视频</a>':"")+
    chips +
    (pts?'<h2 class="sec">📌 核心要点</h2><ul class="pts">'+pts+'</ul>':"")+
    (paras?'<h2 class="sec">📝 详细解读</h2><div class="full">'+paras+'</div>':"")+
    '<div class="src">本文为基于公开视频的要点整理, 不构成投资建议. 数据/观点版权归原作者所有.</div>'+
    '<div class="subbox"><span class="st">📮 订阅日报: 每个交易日一封, 精选当日全球 AI 产业链最值得看的信号</span>'+
      '<input type="email" id="se" placeholder="输入邮箱…" /><button id="sb">免费订阅</button><span class="msg" id="sm"></span></div>';
  $("#loading").style.display = "none";
  $("#article").style.display = "block";

  const sb = $("#sb"), se = $("#se"), sm = $("#sm");
  const submit = async ()=>{
    const email = se.value.trim();
    if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(email)){ sm.textContent="邮箱格式不正确"; return; }
    sb.disabled = true; sm.textContent = "提交中…";
    try{
      const r = await fetch("/api/subscribe",{method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({email,source:"note"})});
      const d = await r.json();
      sm.textContent = d.ok ? (d.existed?"你已订阅过啦":"订阅成功 ✓") : (d.error||"提交失败");
      if(d.ok) se.value="";
    }catch(e){ sm.textContent="网络错误，请重试"; }
    sb.disabled = false;
  };
  sb.onclick = submit;
  se.addEventListener("keydown", e=>{ if(e.key==="Enter") submit(); });
}
init();
</script>
</body>
</html>`;
