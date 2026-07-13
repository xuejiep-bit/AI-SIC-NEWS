// Front-end single page (inlined into the Worker response). Vanilla JS, no build step. English-only UI.

export const PAGE_HTML = /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="google-site-verification" content="kfdl_r02WiIyzoQIr02NPLqPGhe6lDbSo47Cj2QI7cE" />
<meta name="google-site-verification" content="1WLhkGYgNzFlGW6WdOoCBg7fkv5yIkw_9UJzgxGsgWo" />
<link rel="canonical" href="https://ai.vid2quiz.com/" />
<meta name="description" content="AIChain — real-time intelligence on the global AI supply chain: news from upstream compute chips to downstream apps, video notes, an industry-chain map, and value-analysis tools." />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="AIChain" />
<meta property="og:title" content="AIChain — Global AI Supply-Chain Intelligence" />
<meta property="og:description" content="News from upstream compute chips to downstream apps, video notes, an industry-chain map, and value-analysis tools." />
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

  /* ── Exploded-view chain hero (namespaced under #chainHero / .xd-*) ── */
  #chainHero { --faint:#5b6b86; --cyan:#38bdf8; --xmono:ui-monospace,"SF Mono",Menlo,Consolas,"DejaVu Sans Mono",monospace;
    margin:0 0 20px; padding:24px 22px 20px; border:1px solid var(--line); border-radius:16px; background:
      radial-gradient(700px 320px at 12% -20%, rgba(79,140,255,.10), transparent 60%),
      radial-gradient(700px 340px at 92% 130%, rgba(54,211,153,.08), transparent 60%),
      linear-gradient(180deg, rgba(255,255,255,.015), transparent), var(--panel); }
  #chainHero .xeye { font-family:var(--xmono); font-size:11px; letter-spacing:.22em; text-transform:uppercase; color:var(--dim); display:flex; align-items:center; gap:10px; }
  #chainHero .xeye::before { content:""; width:24px; height:1px; background:var(--faint); }
  #chainHero .xtitle { margin:10px 0 4px; font-size:clamp(22px,3vw,32px); line-height:1.14; font-weight:800; letter-spacing:-.01em; }
  #chainHero .xtitle b { background:linear-gradient(90deg,var(--up),var(--cyan) 55%,var(--down)); -webkit-background-clip:text; background-clip:text; color:transparent; }
  #chainHero .xsub { color:var(--dim); font-size:13px; max-width:64ch; line-height:1.6; margin:0 0 22px; }
  #chainHero .figs { display:flex; align-items:stretch; gap:0; }
  #chainHero .fig { flex:1 1 0; min-width:0; padding:0 6px; }
  #chainHero .fighead { font-family:var(--xmono); margin-bottom:8px; }
  #chainHero .fighead .code { color:var(--tc); font-size:12px; letter-spacing:.14em; }
  #chainHero .fighead .tier { color:var(--dim); font-size:10.5px; letter-spacing:.22em; text-transform:uppercase; }
  #chainHero .fighead .name { color:var(--txt); font-family:inherit; font-size:14px; font-weight:700; margin-top:3px; }
  #chainHero .figcard { border:1px solid var(--line); border-radius:14px; background:linear-gradient(180deg,rgba(255,255,255,.015),transparent); padding:10px 8px 6px; }
  #chainHero svg.exploded { width:100%; height:auto; display:block; overflow:visible; }
  #chainHero .ly { cursor:pointer; outline:none; }
  #chainHero .ly .bar { fill:color-mix(in srgb,var(--tc) 8%,transparent); stroke:color-mix(in srgb,var(--tc) 45%,var(--faint)); stroke-width:1; transition:fill .15s,stroke .15s,stroke-width .15s; }
  #chainHero .ly .grip { stroke:color-mix(in srgb,var(--tc) 35%,var(--faint)); stroke-width:1; opacity:.55; }
  #chainHero .ly .lead { stroke:var(--faint); stroke-width:1; stroke-dasharray:2 3; fill:none; transition:stroke .15s; }
  #chainHero .ly .num { fill:var(--dim); font-family:var(--xmono); font-size:8.5px; }
  #chainHero .ly .lbl { fill:var(--dim); font-family:var(--xmono); font-size:9.2px; transition:fill .15s; }
  #chainHero .ly .core { fill:var(--tc); }
  #chainHero .axis { stroke:var(--faint); stroke-width:1; stroke-dasharray:1 4; opacity:.55; }
  #chainHero .reg { stroke:var(--faint); stroke-width:1; opacity:.5; fill:none; }
  #chainHero .ly:hover .bar, #chainHero .ly:focus-visible .bar { fill:color-mix(in srgb,var(--tc) 20%,transparent); stroke:var(--tc); stroke-width:1.4; }
  #chainHero .ly:hover .lbl, #chainHero .ly:focus-visible .lbl, #chainHero .ly:hover .num { fill:var(--txt); }
  #chainHero .ly:hover .lead, #chainHero .ly:focus-visible .lead { stroke:var(--tc); opacity:1; }
  #chainHero .conn { flex:0 0 68px; display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; }
  #chainHero .conn .cl { width:100%; height:0; border-top:1px dashed var(--faint); transition:border-color .2s; }
  #chainHero .conn .ct { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-family:var(--xmono); font-size:9.5px; letter-spacing:.1em; color:var(--dim); white-space:nowrap; background:var(--panel); border:1px solid var(--line); border-radius:20px; padding:3px 9px; transition:color .2s,border-color .2s,box-shadow .2s; }
  #chainHero .conn .cdot { position:absolute; width:5px; height:5px; border-radius:50%; background:var(--faint); top:50%; transform:translateY(-50%); transition:background .2s; }
  #chainHero .conn .cdot.a { left:2px; } #chainHero .conn .cdot.b { right:2px; }
  #chainHero .figs:hover .conn .cl { border-top-color:var(--cyan); }
  #chainHero .figs:hover .conn .ct { color:var(--txt); border-color:color-mix(in srgb,var(--cyan) 55%,var(--line)); box-shadow:0 0 0 3px rgba(56,189,248,.08); }
  #chainHero .figs:hover .conn .cdot { background:var(--cyan); }
  @media (max-width:820px){
    #chainHero .figs { flex-direction:column; }
    #chainHero .fig { padding:0; }
    #chainHero .conn { flex:0 0 52px; width:100%; }
    #chainHero .conn .cl { width:0; height:100%; border-top:0; border-left:1px dashed var(--faint); }
    #chainHero .figs:hover .conn .cl { border-left-color:var(--cyan); }
    #chainHero .conn .cdot.a { left:50%; top:2px; transform:translateX(-50%); }
    #chainHero .conn .cdot.b { left:50%; top:auto; bottom:2px; right:auto; transform:translateX(-50%); }
  }
  /* exploded-hero drawer */
  .xd-scrim { position:fixed; inset:0; background:rgba(4,7,12,.55); opacity:0; visibility:hidden; transition:opacity .25s; z-index:40; }
  .xd-scrim.on { opacity:1; visibility:visible; }
  .xd-drawer { --faint:#5b6b86; --xmono:ui-monospace,Menlo,Consolas,monospace; position:fixed; top:0; right:0; height:100%; width:min(380px,92vw); z-index:50; background:var(--panel); border-left:1px solid var(--line); transform:translateX(100%); transition:transform .28s cubic-bezier(.4,0,.2,1); display:flex; flex-direction:column; box-shadow:-20px 0 60px rgba(0,0,0,.4); }
  .xd-drawer.on { transform:translateX(0); }
  .xd-dhead { padding:20px 22px 14px; border-bottom:1px solid var(--line); position:relative; }
  .xd-dhead .de { font-family:var(--xmono); font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:var(--tc,var(--dim)); }
  .xd-dhead h3 { margin:8px 0 0; font-size:19px; line-height:1.3; }
  .xd-dx { position:absolute; top:16px; right:16px; width:30px; height:30px; border:1px solid var(--line); background:var(--panel2); color:var(--dim); border-radius:8px; cursor:pointer; font-size:14px; line-height:1; }
  .xd-dx:hover { color:var(--txt); border-color:var(--faint); }
  .xd-dbody { padding:6px 22px 30px; overflow:auto; }
  .xd-sec { margin-top:20px; }
  .xd-sec h4 { margin:0 0 10px; font-family:var(--xmono); font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--dim); }
  .xd-cos { display:flex; flex-wrap:wrap; gap:7px; }
  .xd-co { border:1px solid var(--line); background:var(--panel2); border-radius:20px; padding:5px 12px; font-size:12.5px; }
  .xd-news a { display:block; text-decoration:none; color:inherit; border:1px solid var(--line); background:var(--panel2); border-radius:10px; padding:11px 13px; margin-bottom:9px; transition:border-color .15s; }
  .xd-news a:hover { border-color:var(--faint); }
  .xd-news .nt { font-size:13.5px; font-weight:600; line-height:1.45; }
  .xd-news .nm { color:var(--dim); font-size:11.5px; margin-top:6px; display:flex; gap:8px; flex-wrap:wrap; }
  .xd-empty { color:var(--dim); font-size:13px; padding:6px 0; }
  .xd-more { display:inline-block; margin-top:8px; color:var(--acc); text-decoration:none; font-size:13px; }
</style>
</head>
<body>
<header>
  <button class="btn" id="navToggle" title="Collapse / expand sidebar" aria-label="Collapse sidebar">«</button>
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
  <aside id="nav"></aside>
  <main>
    <!-- Exploded-view chain hero (top visual, home view only) -->
    <div id="chainHero" style="display:none"></div>
    <!-- Top spotlight: video notes (shown only on the default home view) -->
    <div id="hero" style="display:none"></div>
    <!-- Supply-chain map entry banner -->
    <a id="mapban" href="/map" style="display:none">
      <span class="mi">🗺️</span>
      <span><b>AI Supply-Chain Map</b><br/><span class="ms">Upstream infrastructure → midstream models → downstream apps. See the whole chain at a glance; click any node for companies and the latest news.</span></span>
      <span class="spacer"></span><span class="go">Open →</span>
    </a>
    <div class="toolbar">
      <input type="search" id="q" data-i18n-ph="search" placeholder="Search…" />
      <div class="meta" id="status"></div>
      <div class="spacer"></div>
      <div class="meta" id="count"></div>
    </div>
    <div class="cards" id="cards"></div>
    <div id="earnings" style="display:none"></div>
    <div class="empty" id="empty" style="display:none" data-i18n="empty">
      No data yet. Click ‘Refresh’ (top-right) to pull the latest.
    </div>
  </main>
</div>
<script>
// English-only UI copy (language/version switch removed).
const I18N = {
  en: { title:"AIChain",
    refresh:"Refresh", search:"Search…", empty:"No data yet. Click ‘Refresh’ (top-right) to pull the latest.",
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
// sel.video: false or a specific video layer ("video" = AI Videos, "video_invest" = Investing Videos)
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
// Note category labels; entries without a category default to "Market Views"
const NOTE_CATS = { invest:"💡 Market Views", howto:"🛠️ AI How-To" };
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

// Frontier-lab official blogs (primary sources). Add/remove/edit links here.
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
    { name: "DeepSeek", url: "https://api-docs.deepseek.com/news" },
    { name: "Qwen (Alibaba)", url: "https://qwenlm.github.io/blog/" },
    { name: "Zhipu GLM", url: "https://z.ai/blog" },
    { name: "Kimi (Moonshot)", url: "https://www.moonshot.cn/" },
  ],
};

function renderNav(){
  const nav = $("#nav");
  let html = '<div class="group">';
  html += '<div class="navitem '+(sel.picks?'on':'')+'" data-picks="1">'+
    '<span class="label"><span class="dot" style="background:var(--invest)"></span><span>⭐ Today\\'s Picks</span></span></div>';
  html += navItem("all","all",t("all"), totalCount(), null, false);
  const invLabel = "💰 Funding & Deals";
  html += '<div class="navitem '+(sel.invest?'on':'')+'" data-invest="1">'+
    '<span class="label"><span class="dot" style="background:var(--invest)"></span><span>'+invLabel+'</span></span>'+
    '<span class="n">'+(investCount||0)+'</span></div>';
  html += '<div class="navitem '+(sel.video==="video"?'on':'')+'" data-video="video">'+
    '<span class="label"><span class="dot" style="background:var(--video)"></span><span>📺 AI Videos</span></span>'+
    '<span class="n">'+(videoCount||0)+'</span></div>';
  html += '<div class="navitem '+(sel.video==="video_invest"?'on':'')+'" data-video="video_invest">'+
    '<span class="label"><span class="dot" style="background:var(--invest)"></span><span>📈 Investing Videos</span></span>'+
    '<span class="n">'+(vinvestCount||0)+'</span></div>';
  if(noteList.length){ // Video Notes: curated content, shown only when non-empty
    const ntLabel = "🎬 Video Notes";
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
  // Official blogs (frontier-lab primary sources; open in a new tab)
  html += '<div class="group">';
  html += '<div class="navhdr">🔗 Official Blogs</div>';
  const blogGroup = (sub, arr) => '<div class="blogsub">'+sub+'</div>' + arr.map(b=>
    '<a class="bloglink" href="'+b.url+'" target="_blank" rel="noopener noreferrer">'+
    '<span>'+esc(b.name)+'</span><span class="ext">↗</span></a>').join("");
  html += blogGroup("Frontier (closed)", BLOGS.closed);
  html += blogGroup("Open source", BLOGS.open);
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
  $("#chainHero").style.display = home ? "" : "none";
  $("#hero").style.display = (home && noteList.length) ? "" : "none";
  $("#mapban").style.display = home ? "flex" : "none";
  if(home && noteList.length) renderHero();
}

// ── Exploded-view chain hero (top homepage visual). Reusable, data-driven. ──
const XD_DIAGRAMS = [
  { fig:"FIG.001", tier:"Upstream", name:"Chip Package", color:"var(--up)", layers:[
    { id:"u-lid",   n:"05", label:"Heat Spreader (Lid)",    seg:"cooling" },
    { id:"u-pkg",   n:"04", label:"Adv. Packaging (CoWoS)", seg:"advanced_packaging" },
    { id:"u-hbm",   n:"03", label:"HBM Memory Stack",       seg:"hbm_memory" },
    { id:"u-die",   n:"02", label:"Compute Die (GPU)",      seg:"ai_compute_chip", core:true },
    { id:"u-wafer", n:"01", label:"Wafer / Foundry",        seg:"foundry" },
  ]},
  { fig:"FIG.002", tier:"Midstream", name:"GPU Board", color:"var(--mid)", layers:[
    { id:"m-fins", n:"05", label:"Heatsink Fins",        seg:"cooling" },
    { id:"m-vrm",  n:"04", label:"Power Delivery (VRM)", seg:"power_energy" },
    { id:"m-mem",  n:"03", label:"Memory (GDDR / HBM)",  seg:"hbm_memory" },
    { id:"m-core", n:"02", label:"GPU Core",             seg:"ai_compute_chip", core:true },
    { id:"m-pcb",  n:"01", label:"PCB Substrate",        seg:"advanced_packaging" },
  ]},
  { fig:"FIG.003", tier:"Downstream", name:"End Device", color:"var(--down)", layers:[
    { id:"d-screen", n:"04", label:"Display",         seg:"ai_hardware" },
    { id:"d-board",  n:"03", label:"Mainboard / SoC", seg:"ai_hardware", core:true },
    { id:"d-batt",   n:"02", label:"Battery",         seg:"power_energy" },
    { id:"d-shell",  n:"01", label:"Chassis",         seg:"ai_hardware" },
  ]},
];
const XD_COMPANIES = {
  "u-lid":["TSMC","ASE","Amkor"], "u-pkg":["TSMC","ASE","SPIL"], "u-hbm":["SK Hynix","Micron","Samsung"],
  "u-die":["NVIDIA","AMD","Broadcom"], "u-wafer":["TSMC","Samsung Foundry","Intel"],
  "m-fins":["Cooler Master","Auras","Vertiv"], "m-vrm":["Monolithic Power","Infineon","Vicor"],
  "m-mem":["Samsung","Micron","SK Hynix"], "m-core":["NVIDIA","AMD","Intel"], "m-pcb":["Ibiden","Unimicron","AT&S"],
  "d-screen":["Samsung Display","BOE","LG Display"], "d-board":["Apple","Qualcomm","MediaTek"],
  "d-batt":["CATL","ATL","LG Energy"], "d-shell":["Foxconn","Luxshare","BYD Electronics"],
};
const XD_CONN = [{t:"Chip →"},{t:"Compute →"}];
const XD_LAYER = {}, XD_TIER = {};
XD_DIAGRAMS.forEach(d=>d.layers.forEach(L=>{ XD_LAYER[L.id]=L; XD_TIER[L.id]=d; }));

function xdSVG(d){
  const N=d.layers.length, VW=340, topPad=12, slot=48, barH=22, barX=26, barW=118, axisX=barX+barW/2;
  const H=topPad+N*slot+8, t=7;
  let s='<svg class="exploded" viewBox="0 0 '+VW+' '+H+'" role="img" aria-label="'+esc(d.tier)+' '+esc(d.name)+' exploded view">';
  s+='<g class="reg"><path d="M2 '+t+' V2 H'+t+'"/><path d="M'+(VW-t)+' 2 H'+(VW-2)+' V'+t+'"/>'+
     '<path d="M2 '+(H-t)+' V'+(H-2)+' H'+t+'"/><path d="M'+(VW-t)+' '+(H-2)+' H'+(VW-2)+' V'+(H-t)+'"/></g>';
  s+='<line class="axis" x1="'+axisX+'" y1="'+(topPad-4)+'" x2="'+axisX+'" y2="'+(H-4)+'"/>';
  d.layers.forEach((L,i)=>{
    const y=topPad+i*slot, cy=y+barH/2, rx=barX+barW;
    s+='<g class="ly" data-id="'+L.id+'" tabindex="0" role="button" aria-label="'+esc(L.label)+'">';
    s+='<rect class="bar" x="'+barX+'" y="'+y+'" width="'+barW+'" height="'+barH+'" rx="4"/>';
    s+='<line class="grip" x1="'+(barX+10)+'" y1="'+(y+6)+'" x2="'+(barX+10)+'" y2="'+(y+barH-6)+'"/>';
    s+='<line class="grip" x1="'+(rx-10)+'" y1="'+(y+6)+'" x2="'+(rx-10)+'" y2="'+(y+barH-6)+'"/>';
    s+='<text class="num" x="'+(barX-8)+'" y="'+(cy+3)+'" text-anchor="end">'+L.n+'</text>';
    if(L.core) s+='<path class="core" d="M'+axisX+' '+(cy-4)+' l4 4 l-4 4 l-4 -4 z"/>';
    s+='<path class="lead" d="M'+rx+' '+cy+' H'+(rx+16)+'"/>';
    s+='<text class="lbl" x="'+(rx+24)+'" y="'+(cy+3)+'">'+esc(L.label)+'</text>';
    s+='</g>';
  });
  return s+'</svg>';
}
function buildChainHero(){
  const host = $("#chainHero"); if(!host || host.dataset.built) return;
  let h = '<div class="xeye">AIChain · Assembly Reference</div>'+
    '<h2 class="xtitle">The AI supply chain, <b>exploded</b>.</h2>'+
    '<p class="xsub">Upstream chip package → midstream GPU board → downstream device — dismantled layer by layer and linked into one chain. Click any layer for its companies and latest news.</p>'+
    '<div class="figs">';
  XD_DIAGRAMS.forEach((d,i)=>{
    h += '<div class="fig" style="--tc:'+d.color+'"><div class="fighead"><span class="code">'+d.fig+'</span> · <span class="tier">'+esc(d.tier)+'</span>'+
      '<div class="name">'+esc(d.name)+'</div></div><div class="figcard">'+xdSVG(d)+'</div></div>';
    if(i<XD_DIAGRAMS.length-1) h += '<div class="conn"><span class="cdot a"></span><span class="cl"></span><span class="cdot b"></span><span class="ct">'+XD_CONN[i].t+'</span></div>';
  });
  h += '</div>';
  host.innerHTML = h; host.dataset.built = "1";
  host.addEventListener("click", e=>{ const g=e.target.closest(".ly"); if(g) xdOpen(g.dataset.id); });
  host.addEventListener("keydown", e=>{ if(e.key==="Enter"||e.key===" "){ const g=e.target.closest(".ly"); if(g){ e.preventDefault(); xdOpen(g.dataset.id); } } });
  // drawer + scrim (created once, appended to body)
  const dr = document.createElement("aside"); dr.className="xd-drawer"; dr.id="xdDrawer"; dr.setAttribute("role","dialog"); dr.setAttribute("aria-modal","true");
  dr.innerHTML = '<div class="xd-dhead"><button class="xd-dx" id="xdX" aria-label="Close">✕</button><div class="de" id="xdEye"></div><h3 id="xdTitle"></h3></div>'+
    '<div class="xd-dbody"><div class="xd-sec"><h4>Companies</h4><div class="xd-cos" id="xdCos"></div></div>'+
    '<div class="xd-sec"><h4>Latest news</h4><div class="xd-news" id="xdNews"></div></div></div>';
  const sc = document.createElement("div"); sc.className="xd-scrim"; sc.id="xdScrim";
  document.body.appendChild(sc); document.body.appendChild(dr);
  sc.onclick = xdClose; $("#xdX").onclick = xdClose;
  document.addEventListener("keydown", e=>{ if(e.key==="Escape") xdClose(); });
}
function xdOpen(id){
  const L=XD_LAYER[id], d=XD_TIER[id]; if(!L) return;
  $("#xdDrawer").style.setProperty("--tc", d.color);
  $("#xdEye").textContent = d.fig+" · "+d.tier;
  $("#xdTitle").textContent = L.label;
  $("#xdCos").innerHTML = (XD_COMPANIES[id]||[]).map(c=>'<span class="xd-co">'+esc(c)+'</span>').join("") || '<span class="xd-empty">—</span>';
  $("#xdNews").innerHTML = '<span class="xd-empty">Loading…</span>';
  $("#xdScrim").classList.add("on"); $("#xdDrawer").classList.add("on");
  if(L.seg){
    fetch("/api/news?segment="+encodeURIComponent(L.seg)+"&limit=6").then(r=>r.json()).then(list=>{
      const more = '<a class="xd-more" href="/?segment='+encodeURIComponent(L.seg)+'">See all in this segment →</a>';
      if(!Array.isArray(list) || !list.length){ $("#xdNews").innerHTML = '<div class="xd-empty">No recent news in this segment yet.</div>'+more; return; }
      $("#xdNews").innerHTML = list.slice(0,6).map(a=>{ const tt=a.title_zh||a.title;
        return '<a href="'+a.link+'" target="_blank" rel="noopener"><div class="nt">'+esc(tt)+'</div>'+
          '<div class="nm"><span>'+esc(a.source||"")+'</span><span>·</span><span>'+timeAgo(a.published_at)+'</span></div></a>';
      }).join("") + more;
    }).catch(()=>{ $("#xdNews").innerHTML = '<div class="xd-empty">Couldn’t load news right now.</div>'; });
  } else { $("#xdNews").innerHTML = '<div class="xd-empty">No dedicated news segment for this layer.</div>'; }
}
function xdClose(){ const d=$("#xdDrawer"), s=$("#xdScrim"); if(d) d.classList.remove("on"); if(s) s.classList.remove("on"); }
function renderHero(){
  // Home spotlight shows only "Market Views" (AI How-To/tutorials live under their tab in the notes list)
  const top = noteList.filter(n=>noteCatOf(n)==="invest").slice(0,3); // latest 3
  if(!top.length){ $("#hero").style.display="none"; return; }
  let html = '<div class="hh"><h2>🎙️ The Big Picture</h2><span class="more" id="allNotes">View all →</span></div>';
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
      const msg = (data && data.error) ? data.error : "Failed to load data";
      $("#status").textContent = "Error: "+msg;
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
      segLabel = "📺 Video"; color = "var(--video)";
    } else if(a.layer==="video_invest"){
      segLabel = "📈 Invest Video"; color = "var(--invest)";
    } else {
      const seg = SEGLABEL[a.segment];
      segLabel = seg ? seg.en : "Industry";
      color = COLOR[a.layer]||"var(--other)";
    }
    const title = a.title_zh || a.title;
    const summ = a.summary_zh || a.summary;
    return '<div class="card">'+
      '<a class="t" href="'+a.link+'" target="_blank" rel="noopener">'+esc(title)+'</a>'+
      (summ?'<div class="s">'+esc(summ)+'</div>':'')+
      '<div class="tags"><span class="chip" style="background:'+color+'">'+esc(segLabel)+'</span>'+
      '<span>'+esc(a.source||"")+'</span><span>·</span><span>'+timeAgo(a.published_at)+'</span>'+
      '<a class="srch" href="https://www.bing.com/search?q='+encodeURIComponent(title)+'" target="_blank" rel="noopener" title="Original not opening? Search this headline">🔍 Search title</a>'+
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
    $("#count").textContent = items.length+" picks";
    // Plain-language three levels of "how important" instead of "value threshold ≥N"; each maps to a score cutoff
    const LEVELS = [
      { min:6, name:"More", hint:"Loose: shows weaker signals too; the most items" },
      { min:7, name:"Balanced", hint:"Recommended: balances quality and volume" },
      { min:8, name:"Top only", hint:"Strict: only the most certain, high-impact stories; fewest items" },
    ];
    const cur = thr<=6 ? 6 : (thr>=8 ? 8 : 7);
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
    box.innerHTML = bar + (items.length? cards :
      '<div class="empty">No picks in the last 48h at this level. Try a lower level, or wait for the next fetch to bring in more.</div>');
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
  const tabs = [["all","All",noteList.length],["invest",NOTE_CATS.invest,nInv],["howto",NOTE_CATS.howto,nHow]];
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
      '<div class="readmore">Read more →</div>'+
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
applyI18n(); buildChainHero(); loadStats(); loadNotes(); load();
</script>
</body>
</html>`;
