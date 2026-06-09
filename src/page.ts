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
  .mkt { margin:24px 0 10px; font-size:14px; font-weight:700; display:flex; align-items:center; gap:8px; }
  .mkt .n { color:var(--dim); font-weight:400; font-size:12px; }
  .co { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:12px 14px;
    display:flex; flex-direction:column; gap:7px; text-decoration:none; color:var(--txt); transition:border-color .15s; }
  .co:hover { border-color:var(--acc); }
  .co .nm { font-weight:600; font-size:14.5px; }
  .co .tk { color:var(--dim); font-size:12px; font-weight:400; margin-left:6px; }
  .co .fin { color:var(--acc); font-size:12.5px; }
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
  <button class="btn" id="earnBtn">📊 公司财报</button>
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
    <div id="earnings" style="display:none"></div>
    <div class="empty" id="empty" style="display:none" data-i18n="empty">
      暂无数据。点击右上角「刷新数据」拉取最新资讯。
    </div>
  </main>
</div>
<script>
const I18N = {
  zh: { title:"AI 链",
    refresh:"刷新数据", search:"搜索关键词…", empty:"暂无数据。点击右上角「刷新数据」拉取最新资讯。",
    all:"全部", loading:"加载中…", refreshing:"正在抓取…", count:n=>n+" 条资讯",
    earnings:"📊 公司财报", news:"📰 资讯", searchCo:"搜索公司 / 代码…", viewFin:"查看财报 →", market:"市场", noCo:"无匹配公司" },
  en: { title:"AIChain",
    refresh:"Refresh", search:"Search…", empty:"No data yet. Click \\"Refresh\\" to fetch the latest news.",
    all:"All", loading:"Loading…", refreshing:"Fetching…", count:n=>n+" articles",
    earnings:"📊 Earnings", news:"📰 News", searchCo:"Search company / ticker…", viewFin:"Financials →", market:"Market", noCo:"No companies" },
};
const TAX = [
  { key:"upstream", color:"var(--up)", zh:"上游 · 基础设施层", en:"Upstream · Infrastructure", segs:[
    {key:"ai_compute_chip", zh:"AI算力芯片", en:"AI Compute Chips"},
    {key:"self_designed_chip", zh:"云厂自研芯片", en:"In-house Silicon"},
    {key:"foundry", zh:"晶圆代工", en:"Foundry"},
    {key:"semi_equipment", zh:"半导体设备", en:"Semi Equipment"},
    {key:"semi_material", zh:"半导体材料", en:"Semi Materials"},
    {key:"advanced_packaging", zh:"先进封装(CoWoS)", en:"Advanced Packaging"},
    {key:"hbm_memory", zh:"HBM/存储", en:"HBM & Memory"},
    {key:"optical_interconnect", zh:"光模块/光互联", en:"Optical / Interconnect"},
    {key:"server_datacenter", zh:"服务器/数据中心", en:"Servers & DC"},
    {key:"cloud_compute", zh:"云算力/租赁", en:"Cloud & GPU Rental"},
    {key:"power_energy", zh:"电力/能源/核电", en:"Power & Energy"},
    {key:"cooling", zh:"液冷散热", en:"Cooling"},
  ]},
  { key:"midstream", color:"var(--mid)", zh:"中游 · 技术与模型层", en:"Midstream · Models", segs:[
    {key:"closed_model", zh:"闭源大模型", en:"Closed Models"},
    {key:"open_model", zh:"开源/国产模型", en:"Open & China Models"},
    {key:"data_annotation", zh:"数据/标注", en:"Data & Annotation"},
    {key:"framework_tooling", zh:"框架/工具链", en:"Frameworks & MLOps"},
  ]},
  { key:"downstream", color:"var(--down)", zh:"下游 · 应用层", en:"Downstream · Apps", segs:[
    {key:"ai_agent", zh:"AI Agent/智能体", en:"AI Agents"},
    {key:"ai_coding", zh:"AI编程", en:"AI Coding"},
    {key:"enterprise_saas", zh:"企业软件/SaaS", en:"Enterprise SaaS"},
    {key:"consumer_app", zh:"To C 应用", en:"Consumer Apps"},
    {key:"autonomous_driving", zh:"自动驾驶", en:"Autonomous Driving"},
    {key:"robotics", zh:"人形机器人/具身", en:"Robotics"},
    {key:"ai_hardware", zh:"AI硬件", en:"AI Hardware"},
    {key:"vertical_industry", zh:"垂直行业", en:"Vertical Industries"},
  ]},
  { key:"other", color:"var(--other)", zh:"其他 · 行业动态", en:"Other · Industry", segs:[] },
];
const COLOR = Object.fromEntries(TAX.map(t=>[t.key,t.color]));
const SEGLABEL = {}; TAX.forEach(t=>t.segs.forEach(s=>SEGLABEL[s.key]=s));
const SEGCOLOR = {}; TAX.forEach(t=>t.segs.forEach(s=>SEGCOLOR[s.key]=t.color));

// 公司财报目录（静态精选）。链接直达东方财富个股页（含财务/财报 Tab），无需逐个输代码。
// em = 东方财富网址路径片段：美股 us/代码，港股 hk/代码，A股 sh/sz/bj+代码。seg 用产业链板块 key。
const COMPANIES = [
  // ── 美股 ──
  {mkt:"us",name:"英伟达",en:"NVIDIA",tk:"NVDA",em:"us/NVDA",seg:"ai_compute_chip"},
  {mkt:"us",name:"AMD",en:"AMD",tk:"AMD",em:"us/AMD",seg:"ai_compute_chip"},
  {mkt:"us",name:"博通",en:"Broadcom",tk:"AVGO",em:"us/AVGO",seg:"ai_compute_chip"},
  {mkt:"us",name:"Arm",en:"Arm",tk:"ARM",em:"us/ARM",seg:"ai_compute_chip"},
  {mkt:"us",name:"英特尔",en:"Intel",tk:"INTC",em:"us/INTC",seg:"foundry"},
  {mkt:"us",name:"台积电",en:"TSMC",tk:"TSM",em:"us/TSM",seg:"foundry"},
  {mkt:"us",name:"ASML",en:"ASML",tk:"ASML",em:"us/ASML",seg:"semi_equipment"},
  {mkt:"us",name:"应用材料",en:"Applied Materials",tk:"AMAT",em:"us/AMAT",seg:"semi_equipment"},
  {mkt:"us",name:"泛林",en:"Lam Research",tk:"LRCX",em:"us/LRCX",seg:"semi_equipment"},
  {mkt:"us",name:"KLA",en:"KLA",tk:"KLAC",em:"us/KLAC",seg:"semi_equipment"},
  {mkt:"us",name:"美光",en:"Micron",tk:"MU",em:"us/MU",seg:"hbm_memory"},
  {mkt:"us",name:"美满电子",en:"Marvell",tk:"MRVL",em:"us/MRVL",seg:"optical_interconnect"},
  {mkt:"us",name:"微软",en:"Microsoft",tk:"MSFT",em:"us/MSFT",seg:"closed_model"},
  {mkt:"us",name:"谷歌",en:"Alphabet",tk:"GOOGL",em:"us/GOOGL",seg:"closed_model"},
  {mkt:"us",name:"Meta",en:"Meta",tk:"META",em:"us/META",seg:"open_model"},
  {mkt:"us",name:"亚马逊",en:"Amazon",tk:"AMZN",em:"us/AMZN",seg:"cloud_compute"},
  {mkt:"us",name:"甲骨文",en:"Oracle",tk:"ORCL",em:"us/ORCL",seg:"cloud_compute"},
  {mkt:"us",name:"CoreWeave",en:"CoreWeave",tk:"CRWV",em:"us/CRWV",seg:"cloud_compute"},
  {mkt:"us",name:"戴尔",en:"Dell",tk:"DELL",em:"us/DELL",seg:"server_datacenter"},
  {mkt:"us",name:"超微电脑",en:"Supermicro",tk:"SMCI",em:"us/SMCI",seg:"server_datacenter"},
  {mkt:"us",name:"Vertiv",en:"Vertiv",tk:"VRT",em:"us/VRT",seg:"power_energy"},
  {mkt:"us",name:"Palantir",en:"Palantir",tk:"PLTR",em:"us/PLTR",seg:"enterprise_saas"},
  {mkt:"us",name:"特斯拉",en:"Tesla",tk:"TSLA",em:"us/TSLA",seg:"robotics"},
  // ── 港股 ──
  {mkt:"hk",name:"中芯国际",en:"SMIC",tk:"00981",em:"hk/00981",seg:"foundry"},
  {mkt:"hk",name:"华虹半导体",en:"Hua Hong",tk:"01347",em:"hk/01347",seg:"foundry"},
  {mkt:"hk",name:"腾讯",en:"Tencent",tk:"00700",em:"hk/00700",seg:"closed_model"},
  {mkt:"hk",name:"阿里巴巴",en:"Alibaba",tk:"09988",em:"hk/09988",seg:"cloud_compute"},
  {mkt:"hk",name:"商汤",en:"SenseTime",tk:"00020",em:"hk/00020",seg:"open_model"},
  {mkt:"hk",name:"小米",en:"Xiaomi",tk:"01810",em:"hk/01810",seg:"ai_hardware"},
  {mkt:"hk",name:"联想",en:"Lenovo",tk:"00992",em:"hk/00992",seg:"server_datacenter"},
  {mkt:"hk",name:"舜宇光学",en:"Sunny Optical",tk:"02382",em:"hk/02382",seg:"ai_hardware"},
  {mkt:"hk",name:"比亚迪电子",en:"BYD Electronic",tk:"00285",em:"hk/00285",seg:"ai_hardware"},
  {mkt:"hk",name:"地平线",en:"Horizon Robotics",tk:"09660",em:"hk/09660",seg:"autonomous_driving"},
  {mkt:"hk",name:"美团",en:"Meituan",tk:"03690",em:"hk/03690",seg:"consumer_app"},
  {mkt:"hk",name:"快手",en:"Kuaishou",tk:"01024",em:"hk/01024",seg:"consumer_app"},
  // ── A股 ──
  {mkt:"a",name:"寒武纪",en:"Cambricon",tk:"688256",em:"sh688256",seg:"ai_compute_chip"},
  {mkt:"a",name:"海光信息",en:"Hygon",tk:"688041",em:"sh688041",seg:"ai_compute_chip"},
  {mkt:"a",name:"韦尔股份",en:"Will Semi",tk:"603501",em:"sh603501",seg:"ai_compute_chip"},
  {mkt:"a",name:"中际旭创",en:"InnoLight",tk:"300308",em:"sz300308",seg:"optical_interconnect"},
  {mkt:"a",name:"新易盛",en:"Eoptolink",tk:"300502",em:"sz300502",seg:"optical_interconnect"},
  {mkt:"a",name:"天孚通信",en:"T&S Comm",tk:"300394",em:"sz300394",seg:"optical_interconnect"},
  {mkt:"a",name:"北方华创",en:"Naura",tk:"002371",em:"sz002371",seg:"semi_equipment"},
  {mkt:"a",name:"中微公司",en:"AMEC",tk:"688012",em:"sh688012",seg:"semi_equipment"},
  {mkt:"a",name:"拓荆科技",en:"Piotech",tk:"688072",em:"sh688072",seg:"semi_equipment"},
  {mkt:"a",name:"盛美上海",en:"ACM Shanghai",tk:"688082",em:"sh688082",seg:"semi_equipment"},
  {mkt:"a",name:"澜起科技",en:"Montage",tk:"688008",em:"sh688008",seg:"hbm_memory"},
  {mkt:"a",name:"兆易创新",en:"GigaDevice",tk:"603986",em:"sh603986",seg:"hbm_memory"},
  {mkt:"a",name:"工业富联",en:"FII",tk:"601138",em:"sh601138",seg:"server_datacenter"},
  {mkt:"a",name:"浪潮信息",en:"Inspur",tk:"000977",em:"sz000977",seg:"server_datacenter"},
  {mkt:"a",name:"沪电股份",en:"WUS Printed Circuit",tk:"002463",em:"sz002463",seg:"server_datacenter"},
  {mkt:"a",name:"胜宏科技",en:"Victory Giant",tk:"300476",em:"sz300476",seg:"server_datacenter"},
  {mkt:"a",name:"立讯精密",en:"Luxshare",tk:"002475",em:"sz002475",seg:"ai_hardware"},
  {mkt:"a",name:"长电科技",en:"JCET",tk:"600584",em:"sh600584",seg:"advanced_packaging"},
  {mkt:"a",name:"通富微电",en:"TFME",tk:"002156",em:"sz002156",seg:"advanced_packaging"},
  {mkt:"a",name:"英维克",en:"Envicool",tk:"002837",em:"sz002837",seg:"cooling"},
  {mkt:"a",name:"科大讯飞",en:"iFlytek",tk:"002230",em:"sz002230",seg:"open_model"},
  {mkt:"a",name:"金山办公",en:"Kingsoft Office",tk:"688111",em:"sh688111",seg:"enterprise_saas"},
];
const MKT = [
  {k:"us", zh:"🇺🇸 美股", en:"🇺🇸 US"},
  {k:"hk", zh:"🇭🇰 港股", en:"🇭🇰 Hong Kong"},
  {k:"a",  zh:"🇨🇳 A股", en:"🇨🇳 A-Share"},
];

let lang = localStorage.getItem("lang") || "zh";
let sel = { layer:"all", segment:"all", invest:false, video:false };
let counts = {};
let investCount = 0;
let videoCount = 0;
let view = "news";       // "news" | "earnings"
let earnMkt = "all";     // 财报视图的市场筛选

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
  $("#earnBtn").textContent = view==="earnings" ? t("news") : t("earnings");
  if(view==="earnings") $("#q").placeholder = t("searchCo");
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

// ── 公司财报视图 ─────────────────────────────────────
function setView(v){
  view = v;
  const earn = v==="earnings";
  $("#earnings").style.display = earn ? "block" : "none";
  $("#cards").style.display = earn ? "none" : "";
  if(earn) $("#empty").style.display = "none";
  $("#status").style.display = earn ? "none" : "";
  $("#count").style.display = earn ? "none" : "";
  $("#refreshBtn").style.display = earn ? "none" : "";
  $("#q").value = "";
  $("#q").placeholder = earn ? t("searchCo") : t("search");
  $("#earnBtn").textContent = earn ? t("news") : t("earnings");
  if(earn){ renderEarnNav(); renderEarnings(); }
  else { renderNav(); load(); }
}
function renderEarnNav(){
  let html = '<div class="group"><h3>'+t("market")+'</h3>';
  html += earnNavItem("all", t("all"), COMPANIES.length);
  for(const m of MKT){
    const n = COMPANIES.filter(c=>c.mkt===m.k).length;
    html += earnNavItem(m.k, lang==="zh"?m.zh:m.en, n);
  }
  html += '</div>';
  const nav = $("#nav"); nav.innerHTML = html;
  nav.querySelectorAll(".navitem").forEach(el=>{
    el.onclick = ()=>{ earnMkt = el.dataset.mkt; renderEarnNav(); renderEarnings(); };
  });
}
function earnNavItem(k,label,n){
  return '<div class="navitem '+(earnMkt===k?'on':'')+'" data-mkt="'+k+'">'+
    '<span class="label"><span>'+label+'</span></span><span class="n">'+n+'</span></div>';
}
function renderEarnings(){
  const q = $("#q").value.trim().toLowerCase();
  let html = "";
  for(const m of MKT){
    if(earnMkt!=="all" && earnMkt!==m.k) continue;
    let list = COMPANIES.filter(c=>c.mkt===m.k);
    if(q) list = list.filter(c=>{
      const seg = SEGLABEL[c.seg];
      return (c.name+c.en+c.tk+(seg?seg.zh+seg.en:"")).toLowerCase().includes(q);
    });
    if(!list.length) continue;
    html += '<div class="mkt">'+(lang==="zh"?m.zh:m.en)+'<span class="n">'+list.length+'</span></div>';
    html += '<div class="cards">'+list.map(c=>{
      const url = "https://quote.eastmoney.com/"+c.em+".html";
      const nm = lang==="zh"?c.name:c.en;
      const seg = SEGLABEL[c.seg];
      const chip = seg ? '<span class="chip" style="background:'+(SEGCOLOR[c.seg]||"var(--other)")+'">'+
        esc(lang==="zh"?seg.zh:seg.en)+'</span>' : '';
      return '<a class="co" href="'+url+'" target="_blank" rel="noopener">'+
        '<div class="nm">'+esc(nm)+'<span class="tk">'+esc(c.tk)+'</span></div>'+
        '<div class="tags">'+chip+'</div>'+
        '<div class="fin">'+t("viewFin")+'</div></a>';
    }).join("")+'</div>';
  }
  $("#earnings").innerHTML = html || '<div class="empty">'+t("noCo")+'</div>';
}
$("#earnBtn").onclick = ()=>{ setView(view==="news"?"earnings":"news"); };
$("#langBtn").onclick = ()=>{
  lang = lang==="zh"?"en":"zh"; localStorage.setItem("lang",lang); applyI18n();
  if(view==="earnings"){ renderEarnNav(); renderEarnings(); }
  else { loadStats(); load(); }
};
$("#q").oninput = (()=>{ let tmr; return ()=>{ clearTimeout(tmr);
  tmr=setTimeout(()=>{ view==="earnings" ? renderEarnings() : load(); },300); }; })();
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
