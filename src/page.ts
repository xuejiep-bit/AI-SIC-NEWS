// 前端单页（内嵌于 Worker 返回）。原生 JS，无需构建。全站统一中文界面。

export const PAGE_HTML = /* html */ `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="google-site-verification" content="kfdl_r02WiIyzoQIr02NPLqPGhe6lDbSo47Cj2QI7cE" />
<meta name="google-site-verification" content="1WLhkGYgNzFlGW6WdOoCBg7fkv5yIkw_9UJzgxGsgWo" />
<link rel="canonical" href="https://ai.vid2quiz.com/" />
<meta name="description" content="AI 链 · AIChain —— 面向中文读者的全球 AI 产业链情报站：上游算力芯片到下游应用全链路资讯、投资视频解读、产业链地图与价值分析工具。" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="AI 链 · AIChain" />
<meta property="og:title" content="AI 链 · AIChain — 全球 AI 产业链情报站" />
<meta property="og:description" content="上游算力芯片到下游应用全链路资讯、投资视频解读、产业链地图与价值分析工具。" />
<meta property="og:url" content="https://ai.vid2quiz.com/" />
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
    background:linear-gradient(135deg,var(--acc),var(--acc2)); color:#fff; text-decoration:none; cursor:pointer;
    font-weight:800; font-size:16px; display:flex; align-items:center; justify-content:center; }
  .logo:hover { filter:brightness(1.12); }
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
  /* 官方博客外链分组 */
  .navhdr { font-size:12px; letter-spacing:.04em; text-transform:uppercase; color:var(--dim); margin:0 0 8px; }
  .blogsub { font-size:11px; color:var(--mid,#b07cff); font-weight:700; margin:8px 0 3px 2px; }
  .bloglink { display:flex; align-items:center; justify-content:space-between; gap:6px;
    padding:6px 10px; border-radius:7px; font-size:12.5px; color:var(--txt); text-decoration:none; }
  .bloglink:hover { background:var(--panel2); }
  .bloglink .ext { color:var(--dim); font-size:11px; flex:none; }
  main { flex:1; padding:18px 24px; overflow:auto; max-height:calc(100vh - 62px); }
  .toolbar { display:flex; gap:10px; align-items:center; margin-bottom:14px; flex-wrap:wrap; }
  input[type=search]{ background:var(--panel); border:1px solid var(--line); color:var(--txt);
    border-radius:8px; padding:8px 12px; width:240px; font-size:13px; }
  .meta { color:var(--dim); font-size:12px; }
  .cards { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:14px; }
  .card { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:14px 16px;
    display:flex; flex-direction:column; gap:8px; transition:border-color .15s; }
  .card:hover { border-color:var(--acc); }
  .card a.t, .card .t { color:var(--txt); text-decoration:none; font-weight:600; font-size:14.5px; line-height:1.4; }
  .card a.t:hover { color:var(--acc); }
  .card.note { color:inherit; text-decoration:none; cursor:pointer; }
  .card.note:hover { border-color:var(--invest); }
  .card.note .readmore { color:var(--invest); font-size:12.5px; margin-top:2px; }
  .card .s { color:var(--dim); font-size:12.5px; line-height:1.5;
    display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
  .tags { display:flex; gap:6px; align-items:center; flex-wrap:wrap; font-size:11px; color:var(--dim); margin-top:2px; }
  .tags .srch { margin-left:auto; color:var(--acc); text-decoration:none; white-space:nowrap; }
  .tags .srch:hover { text-decoration:underline; }
  .chip { padding:2px 8px; border-radius:20px; font-weight:600; color:#fff; }
  .empty { color:var(--dim); text-align:center; padding:60px 0; }
  /* 今日精选 */
  .pickbar { grid-column:1/-1; display:flex; align-items:center; gap:8px; flex-wrap:wrap;
    background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:10px 14px; margin-bottom:4px; }
  .pickbar .pl { font-size:13px; font-weight:700; }
  .pickbar .ph { color:var(--dim); font-size:12px; margin-left:6px; }
  .pbtn { background:var(--panel2); color:var(--txt); border:1px solid var(--line); border-radius:8px;
    padding:5px 12px; cursor:pointer; font-size:13px; }
  .pbtn.on { background:var(--invest); border-color:var(--invest); color:#1a1a1a; font-weight:700; }
  .card.pick .pickhead { display:flex; align-items:flex-start; gap:10px; }
  .pickscore { flex:none; min-width:30px; height:30px; padding:0 6px; border-radius:8px; font-weight:800; font-size:15px;
    display:flex; align-items:center; justify-content:center; color:#1a1a1a; background:var(--dim); }
  .pickscore.hi { background:var(--acc2,#36d399); }
  .pickscore.mid { background:var(--invest); }
  .pickscore.lo { background:#6b7280; color:#fff; }
  .pickreason { color:var(--invest); font-size:12.5px; line-height:1.6; margin:6px 0 2px; }
  /* 大佬观点分类标签栏 */
  .ntabs { grid-column:1/-1; display:flex; gap:8px; flex-wrap:wrap; margin-bottom:6px; }
  .ntab { background:var(--panel2); color:var(--txt); border:1px solid var(--line); border-radius:8px;
    padding:6px 14px; cursor:pointer; font-size:13px; }
  .ntab.on { background:var(--invest); border-color:var(--invest); color:#1a1a1a; font-weight:700; }
  .ntab .nn { color:var(--dim); font-size:11px; }
  .ntab.on .nn { color:#1a1a1a; }
  /* ── 首页主推区：深度笔记大卡片 ── */
  #hero { margin-bottom:16px; }
  #hero .hh { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
  #hero .hh h2 { margin:0; font-size:16px; }
  #hero .hh .more { margin-left:auto; color:var(--acc); font-size:13px; cursor:pointer; }
  #hero .hh .more:hover { text-decoration:underline; }
  .hcards { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:14px; }
  .hcard { display:block; text-decoration:none; color:inherit;
    background:linear-gradient(150deg,var(--panel2),var(--panel)); border:1px solid var(--line);
    border-radius:14px; padding:18px; cursor:pointer; transition:border-color .15s; }
  .hcard:hover { border-color:var(--invest); }
  .hcard .ht { font-size:15.5px; font-weight:700; line-height:1.5; }
  .hcard .hs { color:var(--dim); font-size:12.5px; line-height:1.6; margin-top:8px;
    display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
  .hcard .hd { color:var(--dim); font-size:11px; margin-top:10px; display:flex; gap:8px; }
  /* ── 产业链地图入口横幅 ── */
  #mapban { display:flex; align-items:center; gap:14px; text-decoration:none; color:var(--txt);
    background:linear-gradient(90deg,rgba(79,140,255,.16),rgba(54,211,153,.10)); border:1px solid var(--line);
    border-radius:14px; padding:13px 18px; margin-bottom:16px; transition:border-color .15s; }
  #mapban:hover { border-color:var(--acc); }
  #mapban .mi { font-size:24px; }
  #mapban .ms { color:var(--dim); font-size:12px; }
  #mapban .go { color:var(--acc); font-size:13px; flex:none; }
  /* ── 地区筛选 ── */
  .seg { display:flex; gap:6px; }
  .seg .btn { padding:6px 12px; }
  .cards.notes { grid-template-columns:1fr; max-width:820px; }
  .card.note .pts { margin:4px 0 0; padding-left:20px; color:var(--txt); font-size:13px; line-height:1.7; }
  .card.note .pts li::marker { color:var(--invest); }
  .card.note .full { color:var(--dim); font-size:13px; line-height:1.7; border-top:1px solid var(--line); padding-top:8px; margin-top:4px; }
  .card.note .full p { margin:0 0 8px; }
  .mkt { margin:24px 0 10px; font-size:14px; font-weight:700; display:flex; align-items:center; gap:8px; }
  .mkt .n { color:var(--dim); font-weight:400; font-size:12px; }
  .co { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:12px 14px;
    display:flex; flex-direction:column; gap:7px; text-decoration:none; color:var(--txt); transition:border-color .15s; }
  .co:hover { border-color:var(--acc); }
  .co .nm { font-weight:600; font-size:14.5px; }
  .co .tk { color:var(--dim); font-size:12px; font-weight:400; margin-left:6px; }
  .co .fin { display:flex; gap:14px; flex-wrap:wrap; }
  .co .fin a { color:var(--acc); font-size:12.5px; text-decoration:none; }
  .co .fin a:hover { text-decoration:underline; }
  @media (max-width:760px){ aside{display:none;} .wrap{display:block;} }
  /* 侧栏折叠：折叠后隐藏 aside，main 自动占满 */
  #navToggle { font-size:15px; line-height:1; padding:7px 11px; }
  .wrap.navcollapsed aside { display:none; }
  @media (max-width:760px){ #navToggle{ display:none; } }
</style>
</head>
<body>
<header>
  <button class="btn" id="navToggle" title="折叠 / 展开侧栏" aria-label="折叠侧栏">«</button>
  <a class="logo" href="/" title="返回首页" aria-label="返回首页">AI</a>
  <div>
    <h1 data-i18n="title">AI 链</h1>
  </div>
  <div class="spacer"></div>
  <a class="btn" href="/tools" style="text-decoration:none">🧰 分析工具</a>
  <button class="btn" id="earnBtn">📊 公司财报</button>
  <button class="btn" id="refreshBtn" data-i18n="refresh">刷新数据</button>
</header>
<div class="wrap">
  <aside id="nav"></aside>
  <main>
    <!-- 顶部主推区：深度笔记（默认首页视图才显示） -->
    <div id="hero" style="display:none"></div>
    <!-- 产业链地图入口横幅 -->
    <a id="mapban" href="/map" style="display:none">
      <span class="mi">🗺️</span>
      <span><b>AI 产业链地图</b><br/><span class="ms">上游基础设施 → 中游模型 → 下游应用，一图看懂全链路，点击任一环节看公司与最新动态</span></span>
      <span class="spacer"></span><span class="go">进入 →</span>
    </a>
    <div class="toolbar">
      <input type="search" id="q" data-i18n-ph="search" placeholder="搜索关键词…" />
      <div class="seg" id="regionSeg"></div>
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
// 全站统一中文文案（语言/版本切换已移除）。
const I18N = {
  zh: { title:"AI 链",
    refresh:"刷新数据", search:"搜索关键词…", empty:"暂无数据。点击右上角「刷新数据」拉取最新资讯。",
    all:"全部", loading:"加载中…", refreshing:"正在抓取…", count:n=>n+" 条资讯",
    earnings:"📊 公司财报", news:"📰 资讯", searchCo:"搜索公司 / 代码…", viewFin:"查看财报 →", market:"市场", noCo:"无匹配公司" },
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

// 公司财报目录（静态精选）。链接由 finUrl() 直达各公司的「财务报表」页（打开即最新财报）。
// tk = 交易代码（美股符号 / 港股5位 / A股6位）；seg 用产业链板块 key。
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

const lang = "zh";  // 全站统一中文（语言切换已移除）
// sel.video：false 或具体视频 layer（"video" = AI 视频，"video_invest" = 投资视频）
let sel = { layer:"all", segment:"all", invest:false, video:false, notes:false, picks:false };
let picksMin = null; // 今日精选阈值（null=用后端默认）
let regionFilter = "all"; // 资讯流地区筛选：all | cn(国内) | global(国际)，与产业链分类叠加
let noteAnchor = "";      // ?note=<id> 直达某篇笔记（地图页「我的笔记」链接用），定位后清空
let counts = {};
let investCount = 0;
let videoCount = 0;
let vinvestCount = 0;
let noteList = [];   // 投资视频解读（/api/vidnotes，人工精选内容；为空时隐藏栏目）
let noteCat = "all"; // 大佬观点分类筛选：all | invest(投资观点) | howto(AI 实操)
// 笔记分类标签；未标 category 的默认按「投资观点」处理
const NOTE_CATS = { invest:"💡 投资观点", howto:"🛠️ AI 实操" };
const noteCatOf = n => (n.category==="howto" ? "howto" : "invest");
let view = "news";       // "news" | "earnings"
let earnMkt = "all";     // 财报视图的市场筛选

// 从网址参数初始化筛选状态，让 sitemap 里的分类网址（?layer= / ?segment= / ?invest=1）
// 直接展示对应内容，便于分享与搜索引擎收录。
(function(){
  const sp = new URLSearchParams(location.search);
  const rg = sp.get("region"); if(rg==="cn"||rg==="global") regionFilter = rg;
  if(sp.get("invest")==="1"){ sel.invest = true; }
  else if(sp.get("notes")==="1"){ sel.notes = true; noteAnchor = sp.get("note")||""; }
  else if(sp.get("layer")==="video"||sp.get("layer")==="video_invest"){ sel.video = sp.get("layer"); }
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
  $("#earnBtn").textContent = view==="earnings" ? t("news") : t("earnings");
  if(view==="earnings") $("#q").placeholder = t("searchCo");
}

// 前沿大模型实验室官方博客（一手信源）。要增删/改链接，改这里即可。
const BLOGS = {
  closed: [
    { name: "OpenAI · ChatGPT", url: "https://openai.com/news/" },
    { name: "Anthropic · Claude", url: "https://www.anthropic.com/news" },
    { name: "Google DeepMind · Gemini", url: "https://deepmind.google/discover/blog/" },
    { name: "xAI · Grok", url: "https://x.ai/news" },
    { name: "Microsoft AI", url: "https://blogs.microsoft.com/ai/" },
  ],
  open: [
    { name: "Meta AI · Llama", url: "https://ai.meta.com/blog/" },
    { name: "Mistral AI", url: "https://mistral.ai/news/" },
    { name: "DeepSeek 深度求索", url: "https://api-docs.deepseek.com/news" },
    { name: "通义千问 Qwen", url: "https://qwenlm.github.io/blog/" },
    { name: "智谱 GLM", url: "https://z.ai/blog" },
    { name: "Kimi · 月之暗面", url: "https://www.moonshot.cn/" },
  ],
};

function renderNav(){
  const nav = $("#nav");
  let html = '<div class="group">';
  html += '<div class="navitem '+(sel.picks?'on':'')+'" data-picks="1">'+
    '<span class="label"><span class="dot" style="background:var(--invest)"></span><span>⭐ 今日精选</span></span></div>';
  html += navItem("all","all",t("all"), totalCount(), null, false);
  const invLabel = lang==="zh" ? "💰 投资/融资" : "💰 Investment";
  html += '<div class="navitem '+(sel.invest?'on':'')+'" data-invest="1">'+
    '<span class="label"><span class="dot" style="background:var(--invest)"></span><span>'+invLabel+'</span></span>'+
    '<span class="n">'+(investCount||0)+'</span></div>';
  html += '<div class="navitem '+(sel.video==="video"?'on':'')+'" data-video="video">'+
    '<span class="label"><span class="dot" style="background:var(--video)"></span><span>📺 AI 视频</span></span>'+
    '<span class="n">'+(videoCount||0)+'</span></div>';
  html += '<div class="navitem '+(sel.video==="video_invest"?'on':'')+'" data-video="video_invest">'+
    '<span class="label"><span class="dot" style="background:var(--invest)"></span><span>📈 投资视频</span></span>'+
    '<span class="n">'+(vinvestCount||0)+'</span></div>';
  if(noteList.length){ // 投资视频解读：人工精选内容，有内容才显示
    const ntLabel = "🎬 投资视频解读";
    html += '<div class="navitem '+(sel.notes?'on':'')+'" data-notes="1">'+
      '<span class="label"><span class="dot" style="background:var(--invest)"></span><span>'+ntLabel+'</span></span>'+
      '<span class="n">'+noteList.length+'</span></div>';
  }
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
  // 官方博客（前沿大模型实验室一手信源，外链新标签页打开）
  html += '<div class="group">';
  html += '<div class="navhdr">🔗 官方博客</div>';
  const blogGroup = (sub, arr) => '<div class="blogsub">'+sub+'</div>' + arr.map(b=>
    '<a class="bloglink" href="'+b.url+'" target="_blank" rel="noopener noreferrer">'+
    '<span>'+esc(b.name)+'</span><span class="ext">↗</span></a>').join("");
  html += blogGroup("闭源前沿", BLOGS.closed);
  html += blogGroup("开源 / 国产", BLOGS.open);
  html += '</div>';
  nav.innerHTML = html;
  nav.querySelectorAll(".navitem").forEach(el=>{
    el.onclick = ()=>{
      if(el.dataset.picks){ sel={layer:"all", segment:"all", invest:false, video:false, notes:false, picks:true}; }
      else if(el.dataset.invest){ sel={layer:"all", segment:"all", invest:true, video:false, notes:false, picks:false}; }
      else if(el.dataset.video){ sel={layer:"all", segment:"all", invest:false, video:el.dataset.video, notes:false, picks:false}; }
      else if(el.dataset.notes){ sel={layer:"all", segment:"all", invest:false, video:false, notes:true, picks:false}; }
      else { sel={layer:el.dataset.layer, segment:el.dataset.segment, invest:false, video:false, notes:false, picks:false}; }
      renderNav(); load();
    };
  });
}
function navItem(layer,segment,label,n,color,sub){
  const on = !sel.invest && !sel.video && !sel.notes && sel.layer===layer && sel.segment===segment;
  const dot = color ? '<span class="dot" style="background:'+color+'"></span>' : '';
  return '<div class="navitem '+(sub?'sub-seg ':'')+(on?'on':'')+'" data-layer="'+layer+'" data-segment="'+segment+'">'+
    '<span class="label">'+dot+'<span>'+label+'</span></span><span class="n">'+(n||0)+'</span></div>';
}
function totalCount(){ return Object.values(counts).reduce((a,b)=>a+b,0); }
function layerCount(layer){ return Object.entries(counts).filter(([k])=>k.startsWith(layer+"/")).reduce((a,[,v])=>a+v,0); }

// ── 首页主推区 + 地图横幅（仅默认首页视图显示，筛选/搜索/其它视图时收起）──
function isHome(){
  return view==="news" && !sel.invest && !sel.video && !sel.notes && !sel.picks
    && sel.layer==="all" && sel.segment==="all" && !$("#q").value.trim();
}
function renderHome(){
  const home = isHome();
  $("#hero").style.display = (home && noteList.length) ? "" : "none";
  $("#mapban").style.display = home ? "flex" : "none";
  if(home && noteList.length) renderHero();
}
function renderHero(){
  // 首页热门区只放「投资观点」（AI 实操/工具教程归到笔记列表的对应标签下）
  const top = noteList.filter(n=>noteCatOf(n)==="invest").slice(0,3); // 最新 3 篇
  if(!top.length){ $("#hero").style.display="none"; return; }
  let html = '<div class="hh"><h2>🎙️ 大佬观点</h2><span class="more" id="allNotes">查看全部 →</span></div>';
  html += '<div class="hcards">'+top.map(n=>{
    const ex = (n.takeaways&&n.takeaways[0]) || (n.summary||"").split("\\n")[0] || "";
    return '<a class="hcard" href="/note?id='+encodeURIComponent(n.id)+'">'+
      '<div class="ht">'+esc(n.title)+'</div>'+
      '<div class="hs">'+esc(ex)+'</div>'+
      '<div class="hd"><span>'+esc(n.date)+'</span><span>·</span><span>'+esc(n.channel)+'</span></div></a>';
  }).join("")+'</div>';
  $("#hero").innerHTML = html;
  // 「查看全部笔记」进入站内笔记列表；单张卡片进入独立笔记页（上面的 <a>）
  $("#allNotes").onclick = ()=>{ sel={layer:"all",segment:"all",invest:false,video:false,notes:true,picks:false}; renderNav(); load(); };
}
// 地区筛选按钮（全部 / 国内 / 国际）
function renderRegionSeg(){
  const opts = [["all","全部"],["cn","国内"],["global","国际"]];
  $("#regionSeg").innerHTML = opts.map(([k,label])=>
    '<button class="btn '+(regionFilter===k?'on':'')+'" data-r="'+k+'">'+label+'</button>').join("");
  $("#regionSeg").querySelectorAll(".btn").forEach(el=>{
    el.onclick = ()=>{ regionFilter = el.dataset.r; renderRegionSeg(); loadStats(); load(); };
  });
}

async function loadStats(){
  try{
    const p = regionFilter!=="all" ? "?region="+regionFilter : "";
    const r = await fetch("/api/stats"+p); const d = await r.json(); // 侧栏计数跟随地区筛选
    counts = {};
    (d.breakdown||[]).forEach(row=>{ counts[(row.layer||"other")+"/"+(row.segment||"_")]=row.n; });
    investCount = d.invest||0;
    videoCount = d.video||0;
    vinvestCount = d.videoInvest||0;
    renderNav();
  }catch(e){}
}

async function load(){
  renderHome(); // 同步主推区/地图横幅的显隐
  if(sel.picks){ renderPicks(); return; }
  if(sel.notes){ renderNotes(); return; }
  $("#status").textContent = t("loading");
  const p = new URLSearchParams();
  if(sel.invest){ p.set("invest","1"); }
  else if(sel.video){ p.set("layer", sel.video); }
  else {
    if(sel.layer!=="all") p.set("layer", sel.layer);
    if(sel.segment!=="all") p.set("segment", sel.segment);
  }
  if(regionFilter!=="all") p.set("region", regionFilter); // 地区 × 产业链双维度叠加
  const q = $("#q").value.trim(); if(q) p.set("q", q);
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
  box.classList.remove("notes");
  $("#empty").style.display = items.length? "none":"block";
  box.innerHTML = items.map(a=>{
    let segLabel, color;
    if(a.layer==="video"){
      segLabel = lang==="zh" ? "📺 视频" : "📺 Video"; color = "var(--video)";
    } else if(a.layer==="video_invest"){
      segLabel = lang==="zh" ? "📈 投资视频" : "📈 Invest Video"; color = "var(--invest)";
    } else {
      const seg = SEGLABEL[a.segment];
      segLabel = seg ? (lang==="zh"?seg.zh:seg.en) : (lang==="zh"?"行业动态":"Industry");
      color = COLOR[a.layer]||"var(--other)";
    }
    // 中英资讯合并展示：中文源显示中文，英文源直接显示英文原文（不做翻译）。
    const title = a.title_zh || a.title;
    const summ = a.summary_zh || a.summary;
    const regionTag = a.region==="cn" ? "国内" : (a.region==="global" ? "国际" : "");
    return '<div class="card">'+
      '<a class="t" href="'+a.link+'" target="_blank" rel="noopener">'+esc(title)+'</a>'+
      (summ?'<div class="s">'+esc(summ)+'</div>':'')+
      '<div class="tags"><span class="chip" style="background:'+color+'">'+esc(segLabel)+'</span>'+
      '<span>'+esc(a.source||"")+'</span><span>·</span><span>'+timeAgo(a.published_at)+'</span>'+
      (regionTag?'<span>·</span><span>'+regionTag+'</span>':'')+
      '<a class="srch" href="https://www.bing.com/search?q='+encodeURIComponent(title)+'" target="_blank" rel="noopener" title="原文打不开？用标题搜索这条新闻">🔍 搜标题</a>'+
      '</div>'+
      '</div>';
  }).join("");
}
function esc(s){ return (s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

// ── 今日精选（按价值分阈值筛选；纯免费关键词打分，无需 AI）──
async function renderPicks(){
  renderHome();
  const box = $("#cards"); box.classList.remove("notes");
  $("#empty").style.display = "none";
  $("#status").textContent = t("loading");
  const p = new URLSearchParams();
  if(picksMin!=null) p.set("min", String(picksMin));
  if(regionFilter!=="all") p.set("region", regionFilter);
  try{
    const r = await fetch("/api/picks?"+p.toString());
    const d = await r.json();
    const items = (d && d.items) || [];
    const thr = (d && d.threshold) || 7; picksMin = thr;
    $("#status").textContent = "";
    $("#count").textContent = lang==="zh" ? (items.length+" 条") : (items.length+" picks");
    // 用大白话的三档「看多重要的」代替「价值阈值≥N」，每档背后对应一个分数门槛
    const LEVELS = [
      { min:6, name:"多看一些", hint:"宽松：连信号较弱的也显示，数量最多" },
      { min:7, name:"刚刚好",   hint:"推荐：质量和数量兼顾" },
      { min:8, name:"只看最重磅", hint:"严格：只显示最确定的大事，数量最少" },
    ];
    const cur = thr<=6 ? 6 : (thr>=8 ? 8 : 7);
    const opts = LEVELS.map(l=>
      '<button class="pbtn'+(cur===l.min?' on':'')+'" data-min="'+l.min+'" title="'+l.hint+'">'+l.name+'</button>').join("");
    const bar = '<div class="pickbar"><span class="pl">只看多重要的：</span>'+opts+
      '<span class="ph">往「最重磅」收=更少但更值得看，往「多看一些」放=数量更多。'+
      '每条左边的<b>数字</b>是这条消息的<b>重要度评分</b>（满分 10，越高越可能是供需/技术拐点或重大事件）。</span></div>';
    const cards = items.map(a=>{
      const seg = SEGLABEL[a.segment];
      const segLabel = seg ? (lang==="zh"?seg.zh:seg.en) : "行业动态";
      const color = COLOR[a.layer]||"var(--other)";
      const title = a.title_zh || a.title;
      const sc = a.value_score||0;
      const scClass = sc>=8 ? "hi" : (sc>=7 ? "mid" : "lo");
      const regionTag = a.region==="cn" ? "国内" : (a.region==="global" ? "国际" : "");
      return '<div class="card pick">'+
        '<div class="pickhead"><span class="pickscore '+scClass+'" title="重要度评分 '+sc+'/10：越高越可能是重要的拐点或事件">'+sc+'</span>'+
          '<a class="t" href="'+a.link+'" target="_blank" rel="noopener">'+esc(title)+'</a></div>'+
        (a.value_reason?'<div class="pickreason">🎯 '+esc(a.value_reason)+'</div>':'')+
        '<div class="tags"><span class="chip" style="background:'+color+'">'+esc(segLabel)+'</span>'+
        '<span>'+esc(a.source||"")+'</span><span>·</span><span>'+timeAgo(a.published_at)+'</span>'+
        (regionTag?'<span>·</span><span>'+regionTag+'</span>':'')+
        '<a class="srch" href="https://www.bing.com/search?q='+encodeURIComponent(title)+'" target="_blank" rel="noopener" title="原文打不开？用标题搜索这条新闻">🔍 搜标题</a>'+
        '</div></div>';
    }).join("");
    box.innerHTML = bar + (items.length? cards :
      '<div class="empty">这个阈值下近 48 小时暂无精选。试试调低阈值，或等下一次抓取累积更多资讯。</div>');
    box.querySelectorAll(".pbtn").forEach(b=>{
      b.onclick = ()=>{ picksMin = parseInt(b.dataset.min,10); renderPicks(); };
    });
  }catch(e){ $("#status").textContent = String(e); }
}

// ── 投资视频解读 ─────────────────────────────────────
async function loadNotes(){
  try{
    const r = await fetch("/api/vidnotes"); const d = await r.json();
    if(Array.isArray(d)){ noteList = d; renderNav(); renderHome(); if(sel.notes) renderNotes(); }
  }catch(e){}
}
function renderNotes(){
  const box = $("#cards");
  box.classList.add("notes");
  $("#status").textContent = "";
  const q = $("#q").value.trim().toLowerCase();
  let list = noteList;
  if(q) list = list.filter(n=>(n.title+n.videoTitle+n.channel+n.summary+
    (n.takeaways||[]).join("")+(n.tickers||[]).join("")).toLowerCase().includes(q));
  // 分类筛选
  if(noteCat!=="all") list = list.filter(n=>noteCatOf(n)===noteCat);
  $("#empty").style.display = list.length? "none":"block";
  $("#count").textContent = I18N[lang].count(list.length);
  // 分类标签栏（带每类条数）
  const nInv = noteList.filter(n=>noteCatOf(n)==="invest").length;
  const nHow = noteList.filter(n=>noteCatOf(n)==="howto").length;
  const tabs = [["all","全部",noteList.length],["invest",NOTE_CATS.invest,nInv],["howto",NOTE_CATS.howto,nHow]];
  const tabBar = '<div class="ntabs">'+tabs.map(([k,label,n])=>
    '<button class="ntab'+(noteCat===k?' on':'')+'" data-cat="'+k+'">'+esc(label)+' <span class="nn">'+n+'</span></button>').join("")+'</div>';
  // 列表只作索引：标题 + 标签 + 首条要点预览，点击进入独立笔记页放大阅读
  box.innerHTML = tabBar + list.map(n=>{
    const cat = noteCatOf(n);
    const catChip = '<span class="chip" style="background:'+(cat==="howto"?"var(--acc)":"var(--invest)")+';color:'+(cat==="howto"?"#fff":"#1a1a1a")+'">'+esc(NOTE_CATS[cat])+'</span>';
    const tks = (n.tickers||[]).map(tk=>'<span class="chip" style="background:var(--invest)">'+esc(tk)+'</span>').join("");
    const ex = (n.takeaways&&n.takeaways[0]) || (n.summary||"").split("\\n")[0] || "";
    return '<a class="card note" id="note-'+esc(n.id)+'" href="/note?id='+encodeURIComponent(n.id)+'" style="text-decoration:none">'+
      '<div class="t">🎬 '+esc(n.title)+'</div>'+
      '<div class="tags">'+catChip+tks+'<span>'+esc(n.channel)+'</span><span>·</span><span>'+esc(n.date)+'</span>'+
      '<span>·</span><span>'+esc(n.videoTitle)+'</span></div>'+
      '<div class="s">'+esc(ex)+'</div>'+
      '<div class="readmore">阅读全文 →</div>'+
      '</a>';
  }).join("");
  box.querySelectorAll(".ntab").forEach(b=>{ b.onclick = ()=>{ noteCat = b.dataset.cat; renderNotes(); }; });
  // 来自地图页的 ?note=<id> 直达：滚动到对应笔记并高亮
  if(noteAnchor){
    const el = document.getElementById("note-"+noteAnchor);
    if(el){ el.style.borderColor = "var(--invest)"; el.scrollIntoView({behavior:"smooth", block:"start"}); }
    noteAnchor = "";
  }
}

// ── 公司财报视图 ─────────────────────────────────────
function setView(v){
  view = v;
  const earn = v==="earnings";
  if(earn){ $("#hero").style.display="none"; $("#mapban").style.display="none"; }
  $("#regionSeg").style.display = earn ? "none" : "flex";
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
// 每家公司的财报链接（可多个）：
// 美股给「官方文件(SEC EDGAR 原始申报)」+「财报数据(stockanalysis)」；A股同花顺 F10；港股雪球。
function finLinks(c){
  if(c.mkt==="a") return [
    {label:"查看财报 →", url:"https://basic.10jqka.com.cn/"+c.tk+"/finance.html"},
  ];
  if(c.mkt==="us") return [
    {label:"官方文件 →", url:"https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&ticker="+c.tk+"&type=&dateb=&owner=include&count=40"},
    {label:"财报数据 →", url:"https://stockanalysis.com/stocks/"+c.tk+"/financials/"},
  ];
  return [
    {label:"查看财报 →", url:"https://xueqiu.com/S/"+c.tk},
  ];
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
      const nm = lang==="zh"?c.name:c.en;
      const seg = SEGLABEL[c.seg];
      const chip = seg ? '<span class="chip" style="background:'+(SEGCOLOR[c.seg]||"var(--other)")+'">'+
        esc(lang==="zh"?seg.zh:seg.en)+'</span>' : '';
      const links = finLinks(c).map(l=>'<a href="'+l.url+'" target="_blank" rel="noopener">'+l.label+'</a>').join("");
      return '<div class="co">'+
        '<div class="nm">'+esc(nm)+'<span class="tk">'+esc(c.tk)+'</span></div>'+
        '<div class="tags">'+chip+'</div>'+
        '<div class="fin">'+links+'</div></div>';
    }).join("")+'</div>';
  }
  $("#earnings").innerHTML = html || '<div class="empty">'+t("noCo")+'</div>';
}
$("#earnBtn").onclick = ()=>{ setView(view==="news"?"earnings":"news"); };
$("#q").oninput = (()=>{ let tmr; return ()=>{ clearTimeout(tmr);
  tmr=setTimeout(()=>{ view==="earnings" ? renderEarnings() : load(); },300); }; })();
$("#refreshBtn").onclick = async ()=>{
  $("#status").textContent = t("refreshing"); $("#refreshBtn").disabled = true;
  try{ await fetch("/api/refresh"); await loadStats(); await load(); }
  catch(e){ $("#status").textContent = String(e); }
  $("#refreshBtn").disabled = false;
};

// 侧栏折叠（桌面端），记忆在 localStorage
(function(){
  const wrap = document.querySelector(".wrap");
  const apply = c => { wrap.classList.toggle("navcollapsed", c); $("#navToggle").textContent = c ? "»" : "«"; };
  let collapsed = localStorage.getItem("navCollapsed")==="1";
  apply(collapsed);
  $("#navToggle").onclick = ()=>{ collapsed=!collapsed; localStorage.setItem("navCollapsed", collapsed?"1":"0"); apply(collapsed); };
})();

const _q = new URLSearchParams(location.search).get("q"); if(_q) $("#q").value = _q;
applyI18n(); renderRegionSeg(); loadStats(); loadNotes(); load();
</script>
</body>
</html>`;
