// Front-end single page (inlined into the Worker response). Vanilla JS, no build step. English-only UI.

export const PAGE_HTML = /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="google-site-verification" content="kfdl_r02WiIyzoQIr02NPLqPGhe6lDbSo47Cj2QI7cE" />
<meta name="google-site-verification" content="1WLhkGYgNzFlGW6WdOoCBg7fkv5yIkw_9UJzgxGsgWo" />
<link rel="canonical" href="https://ai.vid2quiz.com/" />
<meta name="description" content="AIChain — real-time intelligence on the global AI supply chain: a heat map of news volume across every chain segment, the hottest stories ranked by importance, and the full list of sources we track." />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="AIChain" />
<meta property="og:title" content="AIChain — Global AI Supply-Chain Intelligence" />
<meta property="og:description" content="A heat map of news volume across every AI supply-chain segment, the hottest stories ranked by importance, and the full list of sources we track." />
<meta property="og:url" content="https://ai.vid2quiz.com/" />
<meta property="og:image" content="https://ai.vid2quiz.com/og.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://ai.vid2quiz.com/og.png" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<title>AIChain — Real-time AI Supply-Chain News</title>
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","name":"AIChain","url":"https://ai.vid2quiz.com/","description":"Real-time intelligence on the global AI supply chain."},{"@type":"WebSite","name":"AIChain","url":"https://ai.vid2quiz.com/","inLanguage":"en","description":"News from upstream compute chips to downstream apps, video notes, an industry-chain map, and value-analysis tools."}]}</script>
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
  /* 单栏布局：左侧分类导航已移除，首页只有「产业链热度 → 最热资讯 → 来源站点」三段。 */
  .wrap { max-width:1240px; margin:0 auto; }
  main { padding:18px 24px 60px; }
  .sechd { display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; margin:30px 0 12px; }
  .sechd h2 { margin:0; font-size:16px; font-weight:800; }
  .sechd .ss { color:var(--dim); font-size:12px; }
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
  /* 标签栏（财报视图的市场切换复用） */
  .ntabs { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:6px; }
  .ntab { background:var(--panel2); color:var(--txt); border:1px solid var(--line); border-radius:8px;
    padding:6px 14px; cursor:pointer; font-size:13px; }
  .ntab.on { background:var(--invest); border-color:var(--invest); color:#1a1a1a; font-weight:700; }
  .ntab .nn { color:var(--dim); font-size:11px; }
  .ntab.on .nn { color:#1a1a1a; }
  /* ── 来源站点板块 ── */
  #sources .sgrp { margin-bottom:18px; }
  #sources .sgh { font-size:11.5px; letter-spacing:.1em; text-transform:uppercase; color:var(--dim);
    margin:0 0 9px; display:flex; align-items:baseline; gap:8px; }
  #sources .sgh .n { letter-spacing:0; text-transform:none; font-size:11px; opacity:.75; }
  #sources .slist { display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:8px; }
  #sources .slink { display:flex; align-items:center; gap:8px; text-decoration:none; color:var(--txt);
    background:var(--panel); border:1px solid var(--line); border-radius:10px;
    padding:9px 12px; font-size:13px; transition:border-color .15s; }
  #sources .slink:hover { border-color:var(--acc); }
  #sources .slink .sn { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  #sources .slink .ext { margin-left:auto; color:var(--dim); font-size:11px; flex:none; }
  #sources .slink .lk { width:6px; height:6px; border-radius:50%; flex:none; background:var(--acc2); }
  #sources .slink .lk.off { background:var(--line); }
  #sources .sfoot { color:var(--dim); font-size:11.5px; margin-top:4px; }
  /* ── 产业链地图入口横幅 ── */
  #mapban { display:flex; align-items:center; gap:14px; text-decoration:none; color:var(--txt);
    background:linear-gradient(90deg,rgba(79,140,255,.16),rgba(54,211,153,.10)); border:1px solid var(--line);
    border-radius:14px; padding:13px 18px; margin-bottom:16px; transition:border-color .15s; }
  #mapban:hover { border-color:var(--acc); }
  #mapban .mi { font-size:24px; }
  #mapban .ms { color:var(--dim); font-size:12px; }
  #mapban .go { color:var(--acc); font-size:13px; flex:none; }
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
  @media (max-width:760px){ main { padding:16px 14px 48px; } }

  /* ── Supply-chain heatmap hero (namespaced #heatHero / .hm-*) ── */
  #heatHero { margin:0 0 20px; padding:20px 20px 16px; border:1px solid var(--line); border-radius:16px;
    background:linear-gradient(180deg, rgba(255,255,255,.015), transparent), var(--panel); }
  #heatHero .hm-head { display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; margin-bottom:14px; }
  #heatHero .hm-title { font-size:16px; font-weight:800; margin:0; }
  #heatHero .hm-sub { color:var(--dim); font-size:12px; }
  #heatHero .hm-tier { margin:12px 0 6px; font-size:11.5px; letter-spacing:.08em; text-transform:uppercase;
    color:var(--dim); display:flex; align-items:center; gap:8px; }
  #heatHero .hm-tier .dot { width:8px; height:8px; border-radius:50%; flex:none; }
  /* 格子大小随资讯量变化：最热的环节占 2×2 / 2×1 格，冷门与 0 占 1×1。
     grid-auto-flow:dense 让小格子自动回填大格子留下的空隙，避免出现空洞。 */
  #heatHero .hm-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(108px, 1fr));
    grid-auto-rows:72px; grid-auto-flow:dense; gap:6px; }
  #heatHero .hm-cell { border-radius:6px; padding:8px 10px; cursor:pointer; border:1px solid transparent;
    transition:transform .12s, box-shadow .12s, border-color .12s; min-width:0; overflow:hidden;
    display:flex; flex-direction:column; justify-content:space-between; }
  #heatHero .hm-cell:hover, #heatHero .hm-cell:focus-visible { transform:translateY(-1px);
    border-color:rgba(230,233,240,.35); box-shadow:0 2px 10px rgba(0,0,0,.35); outline:none; }
  #heatHero .hm-cell.w2 { grid-column:span 2; }
  #heatHero .hm-cell.h2 { grid-row:span 2; }
  #heatHero .hm-cell.zero { opacity:.5; }
  /* 环节名允许折到两行：格子窄，单行会把「Advanced Packaging」这类名字截成「Advanced Pa…」 */
  #heatHero .hm-name { font-size:11px; line-height:1.35; opacity:.92; overflow:hidden;
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
  #heatHero .hm-cell.h2 .hm-name { font-size:12.5px; }
  /* line-height 需略大于 1，否则大字号数字的字形盒会超出行盒、被 overflow:hidden 切到边缘 */
  #heatHero .hm-count { font-weight:800; line-height:1.12; font-variant-numeric:tabular-nums; }
  #heatHero .hm-legend { display:flex; align-items:center; gap:10px; margin-top:14px; color:var(--dim); font-size:11.5px; }
  #heatHero .hm-scale { flex:0 0 140px; height:8px; border-radius:4px;
    background:linear-gradient(90deg, #16213a, #1d3a6e, #2757ab, #3b78e7, #63a2ff); border:1px solid var(--line); }
  /* heatmap drawer */
  .hm-scrim { position:fixed; inset:0; background:rgba(4,7,12,.55); opacity:0; visibility:hidden; transition:opacity .25s; z-index:40; }
  .hm-scrim.on { opacity:1; visibility:visible; }
  .hm-drawer { position:fixed; top:0; right:0; height:100%; width:min(380px,92vw); z-index:50;
    background:var(--panel); border-left:1px solid var(--line); transform:translateX(100%);
    transition:transform .28s cubic-bezier(.4,0,.2,1); display:flex; flex-direction:column; box-shadow:-20px 0 60px rgba(0,0,0,.4); }
  .hm-drawer.on { transform:translateX(0); }
  .hm-dhead { padding:20px 22px 14px; border-bottom:1px solid var(--line); position:relative; }
  .hm-dhead .de { font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--dim); }
  .hm-dhead h3 { margin:8px 0 0; font-size:19px; line-height:1.3; }
  .hm-dx { position:absolute; top:16px; right:16px; width:30px; height:30px; border:1px solid var(--line);
    background:var(--panel2); color:var(--dim); border-radius:8px; cursor:pointer; font-size:14px; line-height:1; }
  .hm-dx:hover { color:var(--txt); border-color:var(--dim); }
  .hm-dbody { padding:6px 22px 30px; overflow:auto; }
  .hm-sec { margin-top:20px; }
  .hm-sec h4 { margin:0 0 10px; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--dim); }
  .hm-cos { display:flex; flex-wrap:wrap; gap:7px; }
  .hm-co { border:1px solid var(--line); background:var(--panel2); border-radius:20px; padding:5px 12px; font-size:12.5px; }
  .hm-news a { display:block; text-decoration:none; color:inherit; border:1px solid var(--line); background:var(--panel2);
    border-radius:10px; padding:11px 13px; margin-bottom:9px; transition:border-color .15s; }
  .hm-news a:hover { border-color:var(--dim); }
  .hm-news .nt { font-size:13.5px; font-weight:600; line-height:1.45; }
  .hm-news .nm { color:var(--dim); font-size:11.5px; margin-top:6px; display:flex; gap:8px; flex-wrap:wrap; }

</style>
</head>
<body>
<header>
  <a class="logo" href="/" title="Home" aria-label="Home">AI</a>
  <div>
    <h1 data-i18n="title">AIChain</h1>
  </div>
  <div class="spacer"></div>
  <a class="btn" href="/tools" style="text-decoration:none">🧰 Tools</a>
  <button class="btn" id="earnBtn">📊 Earnings</button>
  <button class="btn" id="refreshBtn" data-i18n="refresh">Refresh</button>
</header>
<div class="wrap">
  <main>
    <!-- 1) Supply-chain heat: news volume per segment, click a cell for that segment's latest stories -->
    <div id="heatHero"></div>
    <!-- Supply-chain map entry banner -->
    <a id="mapban" href="/map">
      <span class="mi">🗺️</span>
      <span><b>AI Supply-Chain Map</b><br/><span class="ms">Upstream infrastructure → midstream models → downstream apps. See the whole chain at a glance; click any node for companies and the latest news.</span></span>
      <span class="spacer"></span><span class="go">Open →</span>
    </a>
    <!-- 2) The only news list on the page: hottest stories, ranked by importance score -->
    <div class="sechd" id="newsHd">
      <h2>🔥 Hottest right now</h2>
      <span class="ss">Top stories by importance score — this is the whole feed; the category browser was retired.</span>
    </div>
    <!-- Search serves both views: headlines here, companies in the Earnings view -->
    <div class="toolbar">
      <input type="search" id="q" data-i18n-ph="search" placeholder="Search headlines…" />
      <div class="meta" id="status"></div>
      <div class="spacer"></div>
      <div class="meta" id="count"></div>
    </div>
    <div class="cards" id="cards"></div>
    <div class="empty" id="empty" style="display:none" data-i18n="empty">
      No data yet. The next scheduled fetch will fill this in.
    </div>
    <div id="earnings" style="display:none"></div>
    <!-- 3) Where everything comes from: source websites, one block -->
    <div id="sources"></div>
  </main>
</div>
<script>
// English-only UI copy (language/version switch removed).
const I18N = {
  en: { title:"AIChain",
    refresh:"Refresh", search:"Search headlines…", empty:"No data yet. The next scheduled fetch will fill this in.",
    all:"All", loading:"Loading…", refreshing:"Fetching…", count:n=>n+" items",
    earnings:"📊 Earnings", news:"📰 News", searchCo:"Search company / ticker…", viewFin:"Financials →", market:"Market", noCo:"No matching company" },
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

const lang = "en";  // English-only (language switch removed)
let picksMin = null;  // 最热资讯的重要性阈值（null=用后端默认）
let picksItems = [];  // 最近一次拉到的最热资讯，供搜索框做本地过滤
let counts = {};      // "layer/segment" -> 近 HEAT_HOURS 小时的资讯条数，热力图用
let view = "news";    // "news" | "earnings"
let earnMkt = "all";  // 财报视图的市场筛选
const HEAT_HOURS = 48; // 热力图的统计窗口（小时）

const $ = s => document.querySelector(s);
const t = k => I18N[lang][k];

function applyI18n(){
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el=>{ el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-ph]").forEach(el=>{ el.placeholder = t(el.dataset.i18nPh); });
  $("#earnBtn").textContent = view==="earnings" ? t("news") : t("earnings");
  if(view==="earnings") $("#q").placeholder = t("searchCo");
}

// ── 来源站点板块 ─────────────────────────────────────
// 名单来自 /api/sources（服务端由 feeds.ts 派生），所以这里不再硬编码任何网址：
// 增删数据源只改 feeds.ts，本板块自动跟着变。
async function renderSources(){
  const box = $("#sources");
  try{
    const r = await fetch("/api/sources");
    const groups = await r.json();
    if(!Array.isArray(groups) || !groups.length){ box.innerHTML = ""; return; }
    const total = groups.reduce((n,g)=>n+g.items.length,0);
    let html = '<div class="sechd"><h2>📡 Sources</h2>'+
      '<span class="ss">Every site the headlines above come from — '+total+' in all. Green dot = auto-fetched, grey = browse only.</span></div>';
    html += groups.map(g=>
      '<div class="sgrp"><div class="sgh">'+esc(g.label)+'<span class="n">'+g.items.length+'</span></div>'+
      '<div class="slist">'+g.items.map(s=>
        '<a class="slink" href="'+esc(s.site)+'" target="_blank" rel="noopener noreferrer">'+
        '<span class="lk'+(s.fetched?'':' off')+'" title="'+(s.fetched?'Auto-fetched into the feed':'Link only — no public RSS')+'"></span>'+
        '<span class="sn">'+esc(s.name)+'</span><span class="ext">↗</span></a>').join("")+
      '</div></div>').join("");
    box.innerHTML = html;
  }catch(e){ box.innerHTML = ""; }
}

// ── Supply-chain heatmap hero. SupplyChainHeatmap(hostEl, data). ──
// data = [{ tier, color?, layer, items:[{ name, count, seg }] }, ...]
// Cell shade maps count → single blue scale, scaled to the max count in the current data.
// Built from TAX + live per-segment counts (/api/stats), so every chain segment is covered
// and the numbers are real article volumes, not samples.
function hmData(){
  return TAX.filter(L=>L.segs.length).map(L=>({
    tier: L.en, color: L.color, layer: L.key,
    items: L.segs.map(s=>({ name:s.en, seg:s.key, count: counts[L.key+"/"+s.key]||0 })),
  }));
}
const HM_COMPANIES = {
  ai_compute_chip:["NVIDIA","AMD","Broadcom"], self_designed_chip:["Google","Amazon","Microsoft"],
  foundry:["TSMC","Samsung Foundry","Intel"], semi_equipment:["ASML","Applied Materials","Lam Research"],
  hbm_memory:["SK Hynix","Micron","Samsung"], advanced_packaging:["TSMC","ASE","Amkor"],
  optical_interconnect:["Innolight","Coherent","Marvell"], server_datacenter:["Supermicro","Dell","Foxconn"],
  cloud_compute:["AWS","Azure","CoreWeave"], power_energy:["Vertiv","Constellation","NextEra"],
  cooling:["Vertiv","Envicool","Cooler Master"], closed_model:["OpenAI","Anthropic","Google"],
  open_model:["Meta","Mistral","DeepSeek"], data_annotation:["Scale AI","Surge","Appen"],
  framework_tooling:["NVIDIA","Hugging Face","Databricks"], ai_agent:["Microsoft","Salesforce","OpenAI"],
  ai_coding:["Anthropic","GitHub","Cursor"], enterprise_saas:["Palantir","ServiceNow","Salesforce"],
  consumer_app:["OpenAI","Perplexity","Midjourney"], autonomous_driving:["Tesla","Waymo","XPeng"],
  robotics:["Tesla","Figure","Unitree"], ai_hardware:["Apple","Samsung","Xiaomi"],
  vertical_industry:["Palantir","Tempus","iFlytek"],
};
// single-blue color ramp: t=0 → very light, t=1 → saturated deep blue
function hmColor(t){
  const lo=[214,228,255], hi=[26,64,175]; // #d6e4ff → #1a40af
  const c=lo.map((v,i)=>Math.round(v+(hi[i]-v)*t));
  return { bg:"rgb("+c.join(",")+")", fg: t>0.55 ? "#ffffff" : "#10306e" };
}
let HM_ITEM = {}; // cell id -> {item, tier}
function SupplyChainHeatmap(host, data){
  if(!host) return;
  const max = Math.max(1, ...data.flatMap(t=>t.items.map(x=>x.count||0)));
  HM_ITEM = {};
  let h = '<div class="hm-head"><h2 class="hm-title">🔥 Supply-Chain Heat</h2>'+
    '<span class="hm-sub">Articles per segment, last '+HEAT_HOURS+'h — bigger and darker = hotter. Click a cell for its latest stories.</span></div>';
  data.forEach((tier,ti)=>{
    h += '<div class="hm-tier"><span class="dot" style="background:'+(tier.color||"var(--acc)")+'"></span>'+esc(tier.tier)+'</div>';
    h += '<div class="hm-grid">';
    tier.items.forEach((it,ii)=>{
      const id = "hm-"+ti+"-"+ii; HM_ITEM[id]={item:it,tier:tier.tier,layer:tier.layer};
      const n = it.count||0;
      const ratio = n/max;              // 相对全图最热环节，色深与格子大小都用它
      const c = hmColor(ratio);
      // 面积分三档：领先梯队 2×2、次热 2×1、其余 1×1。0 再额外调暗，一眼能看出「这块没动静」。
      const size = n===0 ? " zero" : (ratio>=0.7 ? " w2 h2" : (ratio>=0.35 ? " w2" : ""));
      // 数字字号在档位内继续连续放大，让同为大格的 38 和 26 也能分出高下。
      const fs = (15 + Math.round(ratio*19));
      h += '<div class="hm-cell'+size+'" id="'+id+'" tabindex="0" role="button" title="'+esc(it.name)+' — '+n+' articles"'+
        ' aria-label="'+esc(it.name)+', '+n+' articles"'+
        ' style="background:'+c.bg+';color:'+c.fg+'">'+
        '<div class="hm-name">'+esc(it.name)+'</div>'+
        '<div class="hm-count" style="font-size:'+fs+'px">'+n+'</div></div>';
    });
    h += '</div>';
  });
  h += '<div class="hm-legend"><span>Fewer news</span><span class="hm-scale" style="background:linear-gradient(90deg,'+hmColor(0).bg+','+hmColor(.5).bg+','+hmColor(1).bg+')"></span><span>More news</span></div>';
  host.innerHTML = h;
  // 委托监听只绑一次：热力图会在每次刷新计数后重绘，重复绑定会让点击触发多次抓取。
  if(!host.dataset.bound){
    host.dataset.bound = "1";
    host.addEventListener("click", e=>{ const c=e.target.closest(".hm-cell"); if(c) hmOpen(c.id); });
    host.addEventListener("keydown", e=>{ if(e.key==="Enter"||e.key===" "){ const c=e.target.closest(".hm-cell"); if(c){ e.preventDefault(); hmOpen(c.id); } } });
  }
  if(!$("#hmDrawer")){
    const dr=document.createElement("aside"); dr.className="hm-drawer"; dr.id="hmDrawer";
    dr.setAttribute("role","dialog"); dr.setAttribute("aria-modal","true"); dr.setAttribute("aria-label","Segment details");
    dr.innerHTML='<div class="hm-dhead"><button class="hm-dx" id="hmX" aria-label="Close">✕</button><div class="de" id="hmEye"></div><h3 id="hmTitle"></h3></div>'+
      '<div class="hm-dbody"><div class="hm-sec"><h4>Companies</h4><div class="hm-cos" id="hmCos"></div></div>'+
      '<div class="hm-sec"><h4>Latest news</h4><div class="hm-news" id="hmNews"></div></div></div>';
    const sc=document.createElement("div"); sc.className="hm-scrim"; sc.id="hmScrim";
    document.body.appendChild(sc); document.body.appendChild(dr);
    sc.onclick=hmClose; $("#hmX").onclick=hmClose;
    document.addEventListener("keydown", e=>{ if(e.key==="Escape") hmClose(); });
  }
}
async function hmOpen(id){
  const rec=HM_ITEM[id]; if(!rec) return;
  const it=rec.item;
  $("#hmEye").textContent = rec.tier;
  $("#hmTitle").textContent = it.name;
  $("#hmCos").innerHTML = ((it.seg && HM_COMPANIES[it.seg])||[])
    .map(c=>'<span class="hm-co">'+esc(c)+'</span>').join("") || '<span class="hm-co">—</span>';
  $("#hmNews").innerHTML = '<div class="nm">'+t("loading")+'</div>';
  $("#hmScrim").classList.add("on"); $("#hmDrawer").classList.add("on");
  // 真实资讯：拉该细分环节最近的报道（按发布时间倒序）
  try{
    const p = new URLSearchParams({ segment: it.seg, limit: "10" });
    if(rec.layer) p.set("layer", rec.layer);
    const r = await fetch("/api/news?"+p.toString());
    const items = await r.json();
    if(!Array.isArray(items) || !items.length){
      $("#hmNews").innerHTML = '<div class="nm">No stories in this segment yet.</div>';
      return;
    }
    $("#hmNews").innerHTML = items.map(a=>{
      const title = a.title_zh || a.title;
      return '<a href="'+esc(a.link)+'" target="_blank" rel="noopener">'+
        '<div class="nt">'+esc(title)+'</div>'+
        '<div class="nm"><span>'+esc(a.source||"")+'</span><span>·</span><span>'+timeAgo(a.published_at)+'</span></div></a>';
    }).join("");
  }catch(e){ $("#hmNews").innerHTML = '<div class="nm">Failed to load: '+esc(String(e))+'</div>'; }
}
function hmClose(){ const d=$("#hmDrawer"), s=$("#hmScrim"); if(d) d.classList.remove("on"); if(s) s.classList.remove("on"); }

// 拉取近 HEAT_HOURS 小时的分环节资讯计数并（重）绘制热力图。
async function loadHeat(){
  try{
    const r = await fetch("/api/stats?hours="+HEAT_HOURS);
    const d = await r.json();
    counts = {};
    (d.breakdown||[]).forEach(row=>{ counts[(row.layer||"other")+"/"+(row.segment||"_")]=row.n; });
  }catch(e){}
  SupplyChainHeatmap($("#heatHero"), hmData());
}

function timeAgo(ms){
  if(!ms) return "";
  const d = Math.floor((Date.now()-ms)/1000);
  if(d<3600) return Math.max(1,Math.floor(d/60))+(lang==="zh"?" 分钟前":"m");
  if(d<86400) return Math.floor(d/3600)+(lang==="zh"?" 小时前":"h");
  return Math.floor(d/86400)+(lang==="zh"?" 天前":"d");
}

function esc(s){ return (s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

// ── 最热资讯：页面上唯一的资讯列表（按重要性打分排序，纯关键词规则，无需 AI）──
// 拉一次数据缓存在 picksItems 里，搜索框只在本地过滤，不再回源。
async function loadPicks(){
  $("#empty").style.display = "none";
  $("#status").textContent = t("loading");
  const p = new URLSearchParams({ limit:"30" }); // 只留最热的一屏，不再做长列表
  if(picksMin!=null) p.set("min", String(picksMin));
  try{
    const r = await fetch("/api/picks?"+p.toString());
    const d = await r.json();
    picksItems = (d && d.items) || [];
    picksMin = (d && d.threshold) || 7;
    $("#status").textContent = "";
    renderPicks();
  }catch(e){ $("#status").textContent = String(e); }
}
function renderPicks(){
  const box = $("#cards");
  const q = $("#q").value.trim().toLowerCase();
  const items = q
    ? picksItems.filter(a=>((a.title_zh||a.title||"")+" "+(a.summary||"")+" "+(a.source||"")).toLowerCase().includes(q))
    : picksItems;
  $("#count").textContent = items.length+(q?" of "+picksItems.length:"")+" stories";
  // Plain-language three levels of "how important" instead of "value threshold ≥N"; each maps to a score cutoff
  const LEVELS = [
    { min:6, name:"More", hint:"Loose: shows weaker signals too; the most items" },
    { min:7, name:"Balanced", hint:"Recommended: balances quality and volume" },
    { min:8, name:"Top only", hint:"Strict: only the most certain, high-impact stories; fewest items" },
  ];
  const cur = picksMin<=6 ? 6 : (picksMin>=8 ? 8 : 7);
  const opts = LEVELS.map(l=>
    '<button class="pbtn'+(cur===l.min?' on':'')+'" data-min="'+l.min+'" title="'+l.hint+'">'+l.name+'</button>').join("");
  const bar = '<div class="pickbar"><span class="pl">Filter by importance:</span>'+opts+
    '<span class="ph">Toward “Top only” = fewer but more worth reading; toward “More” = higher volume. '+
    'The <b>number</b> on the left of each item is its <b>importance score</b> (out of 10 — higher means more likely a supply/tech inflection or a major event).</span></div>';
  const cards = items.map(a=>{
    const seg = SEGLABEL[a.segment];
    const segLabel = seg ? seg.en : "Industry";
    const color = COLOR[a.layer]||"var(--other)";
    const title = a.title_zh || a.title;
    const sc = a.value_score||0;
    const scClass = sc>=8 ? "hi" : (sc>=7 ? "mid" : "lo");
    return '<div class="card pick">'+
      '<div class="pickhead"><span class="pickscore '+scClass+'" title="Importance score '+sc+'/10: higher = more likely an important inflection or event">'+sc+'</span>'+
        '<a class="t" href="'+a.link+'" target="_blank" rel="noopener">'+esc(title)+'</a></div>'+
      (a.value_reason?'<div class="pickreason">🎯 '+esc(a.value_reason)+'</div>':'')+
      '<div class="tags"><span class="chip" style="background:'+color+'">'+esc(segLabel)+'</span>'+
      '<span>'+esc(a.source||"")+'</span><span>·</span><span>'+timeAgo(a.published_at)+'</span>'+
      '<a class="srch" href="https://www.bing.com/search?q='+encodeURIComponent(title)+'" target="_blank" rel="noopener" title="Original not opening? Search this headline">🔍 Search title</a>'+
      '</div></div>';
  }).join("");
  const none = q
    ? '<div class="empty">No headline matches “'+esc(q)+'”.</div>'
    : '<div class="empty">Nothing at this level in the last 48h. Try a looser level, or wait for the next scheduled fetch.</div>';
  box.innerHTML = bar + (items.length ? cards : none);
  box.querySelectorAll(".pbtn").forEach(b=>{
    b.onclick = ()=>{ picksMin = parseInt(b.dataset.min,10); loadPicks(); };
  });
}

// ── 公司财报视图 ─────────────────────────────────────
// 侧栏已移除，市场筛选改为财报列表上方的行内标签栏。
function setView(v){
  view = v;
  const earn = v==="earnings";
  $("#heatHero").style.display = earn ? "none" : "";
  $("#mapban").style.display = earn ? "none" : "flex";
  $("#newsHd").style.display = earn ? "none" : "flex";
  $("#cards").style.display = earn ? "none" : "";
  $("#sources").style.display = earn ? "none" : "";
  $("#empty").style.display = "none";
  $("#status").style.display = earn ? "none" : "";
  $("#count").style.display = earn ? "none" : "";
  $("#earnings").style.display = earn ? "block" : "none";
  $("#refreshBtn").style.display = earn ? "none" : "";
  $("#q").value = "";
  $("#q").placeholder = earn ? t("searchCo") : t("search");
  $("#earnBtn").textContent = earn ? t("news") : t("earnings");
  if(earn) renderEarnings();
  else renderPicks();
}
// 每家公司的财报链接（可多个）：
// 美股给「官方文件(SEC EDGAR 原始申报)」+「财报数据(stockanalysis)」；A股同花顺 F10；港股雪球。
function finLinks(c){
  if(c.mkt==="a") return [
    {label:"Financials →", url:"https://basic.10jqka.com.cn/"+c.tk+"/finance.html"},
  ];
  if(c.mkt==="us") return [
    {label:"SEC filings →", url:"https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&ticker="+c.tk+"&type=&dateb=&owner=include&count=40"},
    {label:"Financial data →", url:"https://stockanalysis.com/stocks/"+c.tk+"/financials/"},
  ];
  return [
    {label:"Financials →", url:"https://xueqiu.com/S/"+c.tk},
  ];
}
function renderEarnings(){
  const q = $("#q").value.trim().toLowerCase();
  // 市场切换标签栏（原来在左侧栏，侧栏移除后放到列表顶部）
  const tabs = [["all", t("all"), COMPANIES.length]].concat(
    MKT.map(m=>[m.k, lang==="zh"?m.zh:m.en, COMPANIES.filter(c=>c.mkt===m.k).length]));
  let html = '<div class="ntabs">'+tabs.map(([k,label,n])=>
    '<button class="ntab'+(earnMkt===k?' on':'')+'" data-mkt="'+k+'">'+esc(label)+' <span class="nn">'+n+'</span></button>').join("")+'</div>';
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
  $("#earnings").querySelectorAll(".ntab").forEach(b=>{
    b.onclick = ()=>{ earnMkt = b.dataset.mkt; renderEarnings(); };
  });
}
$("#earnBtn").onclick = ()=>{ setView(view==="news"?"earnings":"news"); };
// 搜索：资讯视图在已加载的最热列表里本地过滤，财报视图筛公司；两者都不额外打接口。
$("#q").oninput = (()=>{ let tmr; return ()=>{ clearTimeout(tmr);
  tmr=setTimeout(()=>{ view==="earnings" ? renderEarnings() : renderPicks(); },200); }; })();
// 刷新按钮只重新拉取已入库的数据。抓取入库由 Cron 定时执行；
// /api/refresh 已改为令牌保护的管理接口，不再由前端触发（防止访客/爬虫刷爆 D1 写入额度）。
$("#refreshBtn").onclick = async ()=>{
  $("#status").textContent = t("refreshing"); $("#refreshBtn").disabled = true;
  try{ await Promise.all([loadHeat(), loadPicks()]); }
  catch(e){ $("#status").textContent = String(e); }
  $("#refreshBtn").disabled = false;
};

const _q = new URLSearchParams(location.search).get("q"); if(_q) $("#q").value = _q;
applyI18n(); loadHeat(); loadPicks(); renderSources();
</script>
</body>
</html>`;
