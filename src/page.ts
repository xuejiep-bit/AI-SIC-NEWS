// 前端单页（内嵌于 Worker 返回）。原生 JS，无需构建。中英文双语界面。

export const PAGE_HTML = /* html */ `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="google-site-verification" content="kfdl_r02WiIyzoQIr02NPLqPGhe6lDbSo47Cj2QI7cE" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<title>AI 链 · AIChain — AI 产业链实时资讯</title>
<style>
  :root {
    --bg: #0b0e14; --panel: #131826; --panel2: #1a2030; --line: #232a3d;
    --txt: #e6e9f0; --dim: #8a93a8; --acc: #4f8cff; --acc2: #36d399;
    --up: #4f8cff; --mid: #b07cff; --down: #36d399; --other: #8a93a8; --invest: #f5b301; --video: #ff5c5c;
  }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--txt);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif; }
  header { padding:20px 24px; border-bottom:1px solid var(--line);
    display:flex; align-items:center; gap:16px; flex-wrap:wrap; background:var(--panel); }
  h1 { font-size:18px; margin:0; font-weight:700; }
  .sub { color:var(--dim); font-size:13px; }
  .logo { width:38px; height:38px; border-radius:10px; flex:none; letter-spacing:.5px;
    background:linear-gradient(135deg,var(--acc),var(--acc2)); color:#fff;
    font-weight:800; font-size:16px; display:flex; align-items:center; justify-content:center; }
  .spacer { flex:1; }
  .btn { background:var(--panel2); color:var(--txt); border:1px solid var(--line);
    border-radius:8px; padding:7px 12px; cursor:pointer; font-size:13px; }
  .btn:hover { border-color:var(--acc); }
  .btn.on { background:var(--acc); border-color:var(--acc); color:#fff; }
  .wrap { display:flex; gap:0; min-height:calc(100vh - 62px); }
  aside { width:248px; flex:none; border-right:1px solid var(--line); padding:16px; background:var(--panel);
    overflow:auto; max-height:calc(100vh - 62px); position:sticky; top:0; }
  .group { margin-bottom:18px; }
  .group h3 { font-size:12px; letter-spacing:.04em; text-transform:uppercase; color:var(--dim); margin:0 0 8px; }
  .navitem { display:flex; justify-content:space-between; align-items:center; padding:6px 10px;
    border-radius:7px; cursor:pointer; font-size:13px; color:var(--txt); }
  .navitem:hover { background:var(--panel2); }
  .navitem.on { background:var(--panel2); font-weight:600; }
  .navitem .dot { width:8px; height:8px; border-radius:50%; margin-right:8px; flex:none; }
  .navitem .label { display:flex; align-items:center; overflow:hidden; }
  .navitem .n { color:var(--dim); font-size:11px; }
  .sub-seg { padding-left:18px; font-size:12.5px; }
  main { flex:1; padding:18px 24px; overflow:auto; max-height:calc(100vh - 62px); }
  .toolbar { display:flex; gap:10px; align-items:center; margin-bottom:14px; flex-wrap:wrap; }
  input[type=search]{ background:var(--panel); border:1px solid var(--line); color:var(--txt);
    border-radius:8px; padding:8px 12px; width:240px; font-size:13px; }
  .meta { color:var(--dim); font-size:12px; }
  .cards { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:14px; }
  .card { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:14px 16px;
    display:flex; flex-direction:column; gap:8px; transition:border-color .15s; }
  .card:hover { border-color:var(--acc); }
  .card a.t { color:var(--txt); text-decoration:none; font-weight:600; font-size:14.5px; line-height:1.4; }
  .card a.t:hover { color:var(--acc); }
  .card .s { color:var(--dim); font-size:12.5px; line-height:1.5;
    display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
  .tags { display:flex; gap:6px; align-items:center; flex-wrap:wrap; font-size:11px; color:var(--dim); margin-top:2px; }
  .chip { padding:2px 8px; border-radius:20px; font-weight:600; color:#fff; }
  .empty { color:var(--dim); text-align:center; padding:60px 0; }
  @media (max-width:760px){ aside{display:none;} .wrap{display:block;} }
</style>
</head>
<body>
<header>
  <div class="logo" aria-hidden="true">AI</div>
  <div>
    <h1 data-i18n="title">AI 链</h1>
  </div>
  <div class="spacer"></div>
  <button class="btn" id="langBtn">EN</button>
  <button class="btn" id="refreshBtn" data-i18n="refresh">刷新数据</button>
</header>
<div class="wrap">
  <aside id="nav"></aside>
  <main>
    <div class="toolbar">
      <input type="search" id="q" data-i18n-ph="search" placeholder="搜索关键词…" />
      <div class="meta" id="status"></div>
      <div class="spacer"></div>
      <div class="meta" id="count"></div>
    </div>
    <div class="cards" id="cards"></div>
    <div class="empty" id="empty" style="display:none" data-i18n="empty">
      暂无数据。点击右上角「刷新数据」拉取最新资讯。
    </div>
  </main>
</div>
<script>
const I18N = {
  zh: { title:"AI 链",
    refresh:"刷新数据", search:"搜索关键词…", empty:"暂无数据。点击右上角「刷新数据」拉取最新资讯。",
    all:"全部", loading:"加载中…", refreshing:"正在抓取…", count:n=>n+" 条资讯" },
  en: { title:"AIChain",
    refresh:"Refresh", search:"Search…", empty:"No data yet. Click \\"Refresh\\" to fetch the latest news.",
    all:"All", loading:"Loading…", refreshing:"Fetching…", count:n=>n+" articles" },
};
const TAX = [
  { key:"upstream", color:"var(--up)", zh:"上游 · 基础设施层", en:"Upstream · Infrastructure", segs:[
    {key:"equipment_materials", zh:"半导体设备与材料", en:"Equipment & Materials"},
    {key:"chip_design_mfg", zh:"芯片设计与制造", en:"Chip Design & Fab"},
    {key:"memory_interconnect", zh:"存储与互联", en:"Memory & Interconnect"},
    {key:"server_datacenter", zh:"服务器与数据中心", en:"Servers & Data Centers"},
    {key:"cloud", zh:"云计算", en:"Cloud"},
    {key:"energy_cooling", zh:"能源与散热", en:"Energy & Cooling"},
  ]},
  { key:"midstream", color:"var(--mid)", zh:"中游 · 技术与模型层", en:"Midstream · Models", segs:[
    {key:"data", zh:"数据", en:"Data & Annotation"},
    {key:"model_training", zh:"算法与模型训练", en:"Models & Training"},
    {key:"open_source", zh:"开源 / 闭源", en:"Open vs Closed"},
    {key:"frameworks", zh:"框架与工具链", en:"Frameworks & MLOps"},
  ]},
  { key:"downstream", color:"var(--down)", zh:"下游 · 应用层", en:"Downstream · Apps", segs:[
    {key:"consumer", zh:"面向消费者 (To C)", en:"Consumer (To C)"},
    {key:"enterprise", zh:"面向企业 (To B)", en:"Enterprise (To B)"},
    {key:"vertical", zh:"垂直行业应用", en:"Vertical Solutions"},
    {key:"hardware", zh:"智能硬件", en:"Smart Hardware"},
  ]},
  { key:"other", color:"var(--other)", zh:"其他 · 行业动态", en:"Other · Industry", segs:[] },
];
const COLOR = Object.fromEntries(TAX.map(t=>[t.key,t.color]));
const SEGLABEL = {}; TAX.forEach(t=>t.segs.forEach(s=>SEGLABEL[s.key]=s));

let lang = localStorage.getItem("lang") || "zh";
let sel = { layer:"all", segment:"all", invest:false, video:false };
let counts = {};
let investCount = 0;
let videoCount = 0;

// 从网址参数初始化筛选状态，让 sitemap 里的分类网址（?layer= / ?segment= / ?invest=1 / ?lang=）
// 直接展示对应内容，便于分享与搜索引擎收录。
(function(){
  const sp = new URLSearchParams(location.search);
  const l = sp.get("lang"); if(l==="en"||l==="zh") lang = l;
  if(sp.get("invest")==="1"){ sel.invest = true; }
  else if(sp.get("layer")==="video"){ sel.video = true; }
  else {
    if(sp.get("layer")) sel.layer = sp.get("layer");
    if(sp.get("segment")) sel.segment = sp.get("segment");
  }
})();

const $ = s => document.querySelector(s);
const t = k => I18N[lang][k];

function applyI18n(){
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el=>{ el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-ph]").forEach(el=>{ el.placeholder = t(el.dataset.i18nPh); });
  $("#langBtn").textContent = lang==="zh" ? "EN" : "中文";
}

function renderNav(){
  const nav = $("#nav");
  let html = '<div class="group">';
  html += navItem("all","all",t("all"), totalCount(), null, false);
  const invLabel = lang==="zh" ? "💰 投资/融资" : "💰 Investment";
  html += '<div class="navitem '+(sel.invest?'on':'')+'" data-invest="1">'+
    '<span class="label"><span class="dot" style="background:var(--invest)"></span><span>'+invLabel+'</span></span>'+
    '<span class="n">'+(investCount||0)+'</span></div>';
  const vidLabel = lang==="zh" ? "📺 AI 视频" : "📺 AI Videos";
  html += '<div class="navitem '+(sel.video?'on':'')+'" data-video="1">'+
    '<span class="label"><span class="dot" style="background:var(--video)"></span><span>'+vidLabel+'</span></span>'+
    '<span class="n">'+(videoCount||0)+'</span></div>';
  html += '</div>';
  for(const L of TAX){
    html += '<div class="group">';
    html += navItem(L.key,"all", lang==="zh"?L.zh:L.en, layerCount(L.key), L.color, false);
    for(const s of L.segs){
      const n = counts[L.key+"/"+s.key]||0;
      html += navItem(L.key,s.key, lang==="zh"?s.zh:s.en, n, L.color, true);
    }
    html += '</div>';
  }
  nav.innerHTML = html;
  nav.querySelectorAll(".navitem").forEach(el=>{
    el.onclick = ()=>{
      if(el.dataset.invest){ sel={layer:"all", segment:"all", invest:true, video:false}; }
      else if(el.dataset.video){ sel={layer:"all", segment:"all", invest:false, video:true}; }
      else { sel={layer:el.dataset.layer, segment:el.dataset.segment, invest:false, video:false}; }
      renderNav(); load();
    };
  });
}
function navItem(layer,segment,label,n,color,sub){
  const on = !sel.invest && !sel.video && sel.layer===layer && sel.segment===segment;
  const dot = color ? '<span class="dot" style="background:'+color+'"></span>' : '';
  return '<div class="navitem '+(sub?'sub-seg ':'')+(on?'on':'')+'" data-layer="'+layer+'" data-segment="'+segment+'">'+
    '<span class="label">'+dot+'<span>'+label+'</span></span><span class="n">'+(n||0)+'</span></div>';
}
function totalCount(){ return Object.values(counts).reduce((a,b)=>a+b,0); }
function layerCount(layer){ return Object.entries(counts).filter(([k])=>k.startsWith(layer+"/")).reduce((a,[,v])=>a+v,0); }

async function loadStats(){
  try{
    const r = await fetch("/api/stats?lang="+lang); const d = await r.json();
    counts = {};
    (d.breakdown||[]).forEach(row=>{ counts[(row.layer||"other")+"/"+(row.segment||"_")]=row.n; });
    investCount = d.invest||0;
    videoCount = d.video||0;
    renderNav();
  }catch(e){}
}

async function load(){
  $("#status").textContent = t("loading");
  const p = new URLSearchParams();
  if(sel.invest){ p.set("invest","1"); }
  else if(sel.video){ p.set("layer","video"); }
  else {
    if(sel.layer!=="all") p.set("layer", sel.layer);
    if(sel.segment!=="all") p.set("segment", sel.segment);
  }
  const q = $("#q").value.trim(); if(q) p.set("q", q);
  p.set("lang", lang);
  p.set("limit","100");
  try{
    const r = await fetch("/api/news?"+p.toString());
    const data = await r.json();
    if(!Array.isArray(data)){
      const msg = (data && data.error) ? data.error : "数据加载失败";
      $("#status").textContent = (lang==="zh"?"出错: ":"Error: ")+msg;
      renderCards([]); $("#count").textContent = "";
      return;
    }
    renderCards(data);
    $("#status").textContent = "";
    $("#count").textContent = I18N[lang].count(data.length);
  }catch(e){ $("#status").textContent = String(e); }
}

function timeAgo(ms){
  if(!ms) return "";
  const d = Math.floor((Date.now()-ms)/1000);
  if(d<3600) return Math.max(1,Math.floor(d/60))+(lang==="zh"?" 分钟前":"m");
  if(d<86400) return Math.floor(d/3600)+(lang==="zh"?" 小时前":"h");
  return Math.floor(d/86400)+(lang==="zh"?" 天前":"d");
}

function renderCards(items){
  const box = $("#cards");
  $("#empty").style.display = items.length? "none":"block";
  box.innerHTML = items.map(a=>{
    let segLabel, color;
    if(a.layer==="video"){
      segLabel = lang==="zh" ? "📺 视频" : "📺 Video"; color = "var(--video)";
    } else {
      const seg = SEGLABEL[a.segment];
      segLabel = seg ? (lang==="zh"?seg.zh:seg.en) : (lang==="zh"?"行业动态":"Industry");
      color = COLOR[a.layer]||"var(--other)";
    }
    const title = (lang==="zh" && a.title_zh) ? a.title_zh : a.title;
    return '<div class="card">'+
      '<a class="t" href="'+a.link+'" target="_blank" rel="noopener">'+esc(title)+'</a>'+
      (a.summary?'<div class="s">'+esc(a.summary)+'</div>':'')+
      '<div class="tags"><span class="chip" style="background:'+color+'">'+esc(segLabel)+'</span>'+
      '<span>'+esc(a.source||"")+'</span><span>·</span><span>'+timeAgo(a.published_at)+'</span>'+
      '<span>·</span><span>'+(a.lang==="zh"?"中文":"EN")+'</span></div>'+
      '</div>';
  }).join("");
}
function esc(s){ return (s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

$("#langBtn").onclick = ()=>{ lang = lang==="zh"?"en":"zh"; localStorage.setItem("lang",lang); applyI18n(); loadStats(); load(); };
$("#q").oninput = (()=>{ let tmr; return ()=>{ clearTimeout(tmr); tmr=setTimeout(load,300); }; })();
$("#refreshBtn").onclick = async ()=>{
  $("#status").textContent = t("refreshing"); $("#refreshBtn").disabled = true;
  try{ await fetch("/api/refresh"); await loadStats(); await load(); }
  catch(e){ $("#status").textContent = String(e); }
  $("#refreshBtn").disabled = false;
};

const _q = new URLSearchParams(location.search).get("q"); if(_q) $("#q").value = _q;
applyI18n(); loadStats(); load();
</script>
</body>
</html>`;
