// 模块4：AI 产业链地图页（/map）。
// 改造为「网络图」：固定坐标布局 + SVG 贝塞尔连线 + 绝对定位的信息卡片。
// 节点数据来自 src/mapconfig.json（经 /api/mapdata 下发）；近30天资讯条数来自 /api/stats；
// 笔记来自 /api/vidnotes。技术方案：纯 SVG + 原生 JS，零依赖、不引入构建步骤。

export const MAP_HTML = /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<title>AI Supply-Chain Map · AIChain</title>
<meta name="description" content="An interactive map of the AI supply chain — upstream (chips, equipment, data centers, power) → midstream (models) → downstream (apps). Click any node for a plain-English primer, representative companies, and the latest news." />
<link rel="canonical" href="https://ai.vid2quiz.com/map" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="AIChain" />
<meta property="og:title" content="AI Supply-Chain Map — AIChain" />
<meta property="og:description" content="Upstream chips & infrastructure → midstream models → downstream apps. An interactive map of the whole AI industry chain." />
<meta property="og:url" content="https://ai.vid2quiz.com/map" />
<meta property="og:image" content="https://ai.vid2quiz.com/og.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://ai.vid2quiz.com/og.png" />
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","name":"AI Supply-Chain Map","url":"https://ai.vid2quiz.com/map","inLanguage":"en","description":"An interactive map of the AI supply chain from upstream compute chips to downstream applications, with a plain-English primer, representative companies, and the latest news for each segment.","isPartOf":{"@type":"WebSite","name":"AIChain","url":"https://ai.vid2quiz.com/"}}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://ai.vid2quiz.com/"},{"@type":"ListItem","position":2,"name":"Supply-Chain Map","item":"https://ai.vid2quiz.com/map"}]}</script>
<style>
  :root {
    --bg:#0b0e14; --panel:#131826; --panel2:#1a2030; --line:#232a3d;
    --txt:#e6e9f0; --dim:#8a93a8; --acc:#4f8cff;
    --up:#4f8cff; --mid:#b07cff; --down:#36d399; --invest:#f5b301;
  }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--txt);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif; }
  header { padding:18px 24px; border-bottom:1px solid var(--line); background:var(--panel);
    display:flex; align-items:center; gap:14px; }
  header .logo { width:34px; height:34px; border-radius:9px; background:linear-gradient(135deg,var(--acc),var(--down));
    color:#fff; font-weight:800; font-size:14px; display:flex; align-items:center; justify-content:center;
    text-decoration:none; cursor:pointer; }
  header .logo:hover { filter:brightness(1.12); }
  header h1 { font-size:17px; margin:0; }
  header a.back { margin-left:auto; color:var(--acc); text-decoration:none; font-size:13px; }
  header a.back:hover { text-decoration:underline; }
  .wrap { max-width:1280px; margin:0 auto; padding:22px 20px 60px; }
  .hint { color:var(--dim); font-size:13px; margin:0 0 8px; }
  .legend { display:flex; gap:16px; flex-wrap:wrap; font-size:12px; color:var(--dim); margin-bottom:14px; }
  .legend .lg { display:inline-flex; align-items:center; gap:6px; }
  .legend .sw { width:11px; height:11px; border-radius:3px; }

  /* 网络图：固定尺寸画布，窄屏可横向滚动 */
  #graphwrap { overflow-x:auto; overflow-y:hidden; padding-bottom:10px;
    border:1px solid var(--line); border-radius:14px; background:
      radial-gradient(circle at 20% 0%, rgba(79,140,255,.05), transparent 55%),
      radial-gradient(circle at 80% 100%, rgba(54,211,153,.05), transparent 55%), var(--panel); }
  #canvas { position:relative; width:1240px; height:790px; margin:0 auto; }
  /* 三层色带（背景） */
  .band { position:absolute; left:14px; border-radius:14px; z-index:1; }
  .band .blabel { position:absolute; top:9px; left:14px; font-size:12px; font-weight:700; letter-spacing:.08em; }
  /* 连线层 */
  #edges { position:absolute; top:0; left:0; z-index:2; pointer-events:none; overflow:visible; }
  .edge { fill:none; stroke:#46506b; stroke-width:1.3; opacity:.38;
    transition:opacity .15s, stroke .15s, stroke-width .15s; }
  /* hover 时：非高亮的线/节点淡化，高亮的突出 */
  #canvas.hovering .edge { opacity:.07; }
  #canvas.hovering .edge.hi { opacity:.95; stroke:var(--acc); stroke-width:2.1; }
  /* 节点卡片 */
  .node { position:absolute; width:160px; z-index:3; border:1px solid var(--line);
    border-top:3px solid var(--up); border-radius:11px; background:var(--panel2);
    padding:9px 12px; cursor:pointer; transition:opacity .15s, transform .12s, box-shadow .15s; }
  .node:hover { transform:translateY(-2px); }
  .node.on { box-shadow:0 0 0 2px var(--acc); border-color:var(--acc); }
  .node .nname { font-size:13px; font-weight:600; line-height:1.3; }
  .node .nmeta { margin-top:7px; display:flex; gap:10px; font-size:11px; color:var(--dim); }
  .node .nmeta b { color:var(--txt); font-weight:700; }
  #canvas.hovering .node { opacity:.28; }
  #canvas.hovering .node.hi { opacity:1; }

  /* 档案卡：点击节点后在下方展开 */
  #detail { display:none; border:1px solid var(--line); border-radius:14px; background:var(--panel);
    padding:20px; margin-top:18px; }
  #detail h3 { margin:0 0 4px; font-size:17px; display:flex; align-items:center; gap:10px; }
  #detail h3 .lay { font-size:11px; font-weight:400; padding:2px 9px; border-radius:20px; color:#fff; }
  #detail .desc { color:var(--txt); font-size:13.5px; line-height:1.7; margin:10px 0 0; }
  /* 科普卡片：给小白看的通俗说明 */
  #detail .explain { margin-top:14px; border:1px solid rgba(245,179,1,.35); border-radius:12px;
    background:linear-gradient(180deg,rgba(245,179,1,.08),rgba(245,179,1,.02)); padding:14px 16px; }
  #detail .explain .etitle { font-size:12.5px; font-weight:700; color:var(--invest); margin-bottom:10px;
    display:flex; align-items:center; gap:6px; }
  #detail .explain .erow { margin:9px 0; line-height:1.75; font-size:13.5px; }
  #detail .explain .erow .lab { display:inline-block; font-weight:700; color:var(--txt);
    background:var(--panel2); border:1px solid var(--line); border-radius:6px; padding:1px 8px; margin-right:7px; font-size:12px; }
  #detail .sec { margin-top:16px; }
  #detail .sec h4 { margin:0 0 8px; font-size:12px; color:var(--dim); letter-spacing:.05em; }
  .chips { display:flex; flex-wrap:wrap; gap:7px; }
  .chips .co { background:var(--panel2); border:1px solid var(--line); border-radius:20px;
    padding:4px 12px; font-size:12.5px; }
  #detail a.newslink { color:var(--acc); text-decoration:none; font-size:13px; }
  #detail a.newslink:hover { text-decoration:underline; }
  #detail .notes a { color:var(--invest); text-decoration:none; font-size:13px; display:block; margin-bottom:4px; }
  #detail .notes .todo { color:var(--dim); font-size:13px; }
  @media (max-width:600px){ .wrap{padding:16px 12px 50px;} #detail{padding:16px;} }
</style>
</head>
<body>
<header>
  <a class="logo" href="/" title="Home" aria-label="Home">AI</a>
  <h1>🗺️ AI Supply-Chain Map</h1>
  <a class="back" href="/">← Back to news</a>
</header>
<div class="wrap">
  <p class="hint">A network map of the supply chain, laid out as Upstream → Midstream → Downstream: lines show upstream–downstream dependencies. <b>Hover</b> over a segment to highlight the segments directly connected to it; <b>click</b> to see the description, key companies and latest news. (On narrow screens, swipe left/right to see the whole map.)</p>
  <div class="legend">
    <span class="lg"><span class="sw" style="background:var(--up)"></span>Upstream · Infrastructure</span>
    <span class="lg"><span class="sw" style="background:var(--mid)"></span>Midstream · Models</span>
    <span class="lg"><span class="sw" style="background:var(--down)"></span>Downstream · Apps</span>
    <span class="lg">📰 News in the last 30 days　🏢 Number of key companies</span>
  </div>
  <div id="graphwrap"><div id="canvas"></div></div>
  <div id="detail"></div>
</div>
<script>
// 画布尺寸
const W = 1240, H = 790;

const LAYERS = [
  { key:"upstream",   name:"Upstream · Infrastructure", color:"var(--up)" },
  { key:"midstream",  name:"Midstream · Models", color:"var(--mid)" },
  { key:"downstream", name:"Downstream · Apps", color:"var(--down)" },
];
const LAYER_COLOR = { upstream:"var(--up)", midstream:"var(--mid)", downstream:"var(--down)" };

// 三层色带（每条色带顶部留出标题行的空间，节点首行从 band.top+46 起）
const BANDS = [
  { top:14,  h:332, bg:"rgba(79,140,255,.06)",  bd:"rgba(79,140,255,.22)",  color:"#4f8cff", name:"Upstream · Infrastructure" },
  { top:356, h:120, bg:"rgba(176,124,255,.06)", bd:"rgba(176,124,255,.22)", color:"#b07cff", name:"Midstream · Models" },
  { top:486, h:300, bg:"rgba(54,211,153,.06)",  bd:"rgba(54,211,153,.20)",  color:"#36d399", name:"Downstream · Apps" },
];

// 固定坐标（每个节点的左上角像素位置）。布局体现：芯片制造管线（左）+ 数据中心/电力管线（右）→ 汇入模型 → 扇出到下游应用。
// 注意：各层首行的 y 要避开该层左上角的标题文字（band.top+46 起）。
const POS = {
  // 上游
  semi_equipment:      { x:40,   y:60  },
  semi_material:       { x:214,  y:60  },
  self_designed_chip:  { x:470,  y:60  },
  power_energy:        { x:700,  y:60  },
  cooling:             { x:874,  y:60  },
  optical_interconnect:{ x:1048, y:60  },
  foundry:             { x:127,  y:160 },
  hbm_memory:          { x:301,  y:160 },
  server_datacenter:   { x:787,  y:160 },
  advanced_packaging:  { x:127,  y:262 },
  ai_compute_chip:     { x:301,  y:262 },
  cloud_compute:       { x:787,  y:262 },
  // 中游
  data_annotation:     { x:60,   y:402 },
  closed_model:        { x:440,  y:402 },
  open_model:          { x:672,  y:402 },
  framework_tooling:   { x:980,  y:402 },
  // 下游
  ai_agent:            { x:70,   y:548 },
  ai_coding:           { x:330,  y:548 },
  enterprise_saas:     { x:590,  y:548 },
  consumer_app:        { x:850,  y:548 },
  autonomous_driving:  { x:70,   y:668 },
  robotics:            { x:330,  y:668 },
  ai_hardware:         { x:590,  y:668 },
  vertical_industry:   { x:850,  y:668 },
};

const DOWNSTREAM = ["ai_agent","ai_coding","enterprise_saas","consumer_app",
  "autonomous_driving","robotics","ai_hardware","vertical_industry"];

// 依赖关系（from → to）
let EDGES = [
  // 上游内部：制造管线
  ["semi_equipment","foundry"], ["semi_material","foundry"],
  ["foundry","advanced_packaging"], ["advanced_packaging","ai_compute_chip"],
  ["hbm_memory","ai_compute_chip"],
  // 上游内部：数据中心管线
  ["power_energy","server_datacenter"], ["cooling","server_datacenter"],
  ["optical_interconnect","server_datacenter"],
  ["ai_compute_chip","server_datacenter"], ["self_designed_chip","server_datacenter"],
  ["server_datacenter","cloud_compute"],
  // 上游 → 中游（算力 + 数据/工具 支撑模型）
  ["ai_compute_chip","closed_model"], ["ai_compute_chip","open_model"],
  ["server_datacenter","closed_model"], ["server_datacenter","open_model"],
  ["cloud_compute","closed_model"], ["cloud_compute","open_model"],
  ["data_annotation","closed_model"], ["data_annotation","open_model"],
  ["framework_tooling","closed_model"], ["framework_tooling","open_model"],
];
// 中游 → 下游所有应用（模型驱动应用）
DOWNSTREAM.forEach(d=>{ EDGES.push(["closed_model",d]); EDGES.push(["open_model",d]); });

// 邻接表（双向），用于 hover 高亮
const ADJ = {};
EDGES.forEach(([a,b])=>{ (ADJ[a]=ADJ[a]||new Set()).add(b); (ADJ[b]=ADJ[b]||new Set()).add(a); });

let NODES = [];   // /api/mapdata
let COUNTS = {};  // /api/stats 分类计数
let NOTES = [];   // /api/vidnotes
let current = null;
const CARD = {};  // id -> 卡片 DOM
let PATHS = [];   // 连线 path DOM（与 EDGES 同序）

const $ = s => document.querySelector(s);
function esc(s){ return (s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
const layerOf = k => LAYERS.find(l=>l.key===k);

function buildGraph(){
  const canvas = $("#canvas");
  // 1) 色带
  let html = BANDS.map(b=>
    '<div class="band" style="top:'+b.top+'px;height:'+b.h+'px;width:'+(W-28)+'px;'+
      'background:'+b.bg+';border:1px solid '+b.bd+'">'+
      '<span class="blabel" style="color:'+b.color+'">'+esc(b.name)+'</span></div>'
  ).join("");
  // 2) 连线层（先占位，d 稍后计算）
  html += '<svg id="edges" width="'+W+'" height="'+H+'">'+
    EDGES.map((e,i)=>'<path class="edge" data-i="'+i+'" data-a="'+e[0]+'" data-b="'+e[1]+'"></path>').join("")+
    '</svg>';
  // 3) 节点卡片
  html += NODES.map(n=>{
    const p = POS[n.id]; if(!p) return "";
    const col = LAYER_COLOR[n.layer] || "var(--up)";
    const cnt = COUNTS[n.category_key]||0;
    const coN = (n.companies&&n.companies.length)||0;
    return '<div class="node" data-id="'+n.id+'" style="left:'+p.x+'px;top:'+p.y+'px;border-top-color:'+col+'">'+
      '<div class="nname">'+esc(n.name)+'</div>'+
      '<div class="nmeta"><span>📰 <b>'+cnt+'</b></span><span>🏢 <b>'+coN+'</b></span></div>'+
    '</div>';
  }).join("");
  canvas.innerHTML = html;

  // 收集 DOM 引用 + 绑定交互
  PATHS = [...canvas.querySelectorAll(".edge")];
  canvas.querySelectorAll(".node").forEach(el=>{
    const id = el.dataset.id; CARD[id] = el;
    el.addEventListener("mouseenter", ()=>highlight(id));
    el.addEventListener("mouseleave", clearHi);
    el.addEventListener("click", ()=>select(id));
  });
  requestAnimationFrame(drawEdges);
}

function center(id){
  const el = CARD[id]; if(!el) return null;
  return { x: el.offsetLeft + el.offsetWidth/2, y: el.offsetTop + el.offsetHeight/2 };
}
function drawEdges(){
  EDGES.forEach((e,i)=>{
    const a = center(e[0]), b = center(e[1]);
    if(!a||!b) return;
    const my = (a.y + b.y)/2;                       // 垂直 S 形贝塞尔，符合自上而下的产业链流向
    PATHS[i].setAttribute("d", "M"+a.x+" "+a.y+" C "+a.x+" "+my+" "+b.x+" "+my+" "+b.x+" "+b.y);
  });
}

function highlight(id){
  const canvas = $("#canvas");
  canvas.classList.add("hovering");
  const nbrs = ADJ[id] || new Set();
  // 节点：自己 + 直接相连的
  canvas.querySelectorAll(".node").forEach(el=>{
    const nid = el.dataset.id;
    el.classList.toggle("hi", nid===id || nbrs.has(nid));
  });
  // 连线：端点含 id 的
  PATHS.forEach(p=>{
    p.classList.toggle("hi", p.dataset.a===id || p.dataset.b===id);
  });
}
function clearHi(){
  const canvas = $("#canvas");
  canvas.classList.remove("hovering");
  canvas.querySelectorAll(".node.hi").forEach(el=>el.classList.remove("hi"));
  PATHS.forEach(p=>p.classList.remove("hi"));
}

function select(id){
  current = id;
  Object.values(CARD).forEach(el=>el.classList.toggle("on", el.dataset.id===id));
  renderDetail();
}

function renderDetail(){
  const n = NODES.find(x=>x.id===current);
  const box = $("#detail");
  if(!n){ box.style.display="none"; return; }
  const L = layerOf(n.layer);
  const count = COUNTS[n.category_key]||0;
  const cos = (n.companies&&n.companies.length)
    ? '<div class="chips">'+n.companies.map(c=>'<span class="co">'+esc(c)+'</span>').join("")+'</div>'
    : '<span class="todo" style="color:var(--dim);font-size:13px">TBD</span>';
  // 科普卡片（给小白看的通俗说明）：what=这是什么 / position=在产业链的位置 / watch=投资看点
  const ex = n.explainer;
  const explain = ex ? '<div class="explain">'+
      '<div class="etitle">📖 1-minute primer</div>'+
      (ex.what ? '<div class="erow"><span class="lab">What it is</span>'+esc(ex.what)+'</div>' : '')+
      (ex.position ? '<div class="erow"><span class="lab">Where it sits</span>'+esc(ex.position)+'</div>' : '')+
      (ex.watch ? '<div class="erow"><span class="lab">Why it matters</span>'+esc(ex.watch)+'</div>' : '')+
    '</div>' : '';
  // 笔记 = 自动关联（笔记的 segs 含本环节）+ mapconfig.json 里手动配置的链接
  const auto = NOTES.filter(v=>(v.segs||[]).includes(n.category_key) && v.category!=="howto")
    .map(v=>({ title:v.title, url:"/note?id="+encodeURIComponent(v.id) }));
  const links = auto.concat(n.note_links||[]);
  const notes = links.length
    ? links.map(x=>'<a href="'+x.url+'">📝 '+esc(x.title)+'</a>').join("")
    : '<span class="todo">TBD</span>';
  box.innerHTML =
    '<h3>'+esc(n.name)+'<span class="lay" style="background:'+L.color+'">'+esc(L.name)+'</span></h3>'+
    '<div class="desc">'+esc(n.desc||"")+'</div>'+
    explain+
    '<div class="sec"><h4>Companies</h4>'+cos+'</div>'+
    '<div class="sec"><h4>Latest news</h4>'+
      '<a class="newslink" href="/?segment='+encodeURIComponent(n.category_key)+'">'+
      count+' related stories in the last 30 days, click to view →</a></div>'+
    '<div class="sec notes"><h4>Notes</h4>'+notes+'</div>';
  box.style.display = "block";
  box.scrollIntoView({behavior:"smooth", block:"nearest"});
}

async function init(){
  try{
    const [md, st, vn] = await Promise.all([
      fetch("/api/mapdata").then(r=>r.json()),
      fetch("/api/stats").then(r=>r.json()),
      fetch("/api/vidnotes").then(r=>r.json()).catch(()=>[]),
    ]);
    NODES = md.nodes||[];
    NOTES = Array.isArray(vn) ? vn : [];
    (st.breakdown||[]).forEach(row=>{ if(row.segment) COUNTS[row.segment]=(COUNTS[row.segment]||0)+row.n; });
    buildGraph();
    window.addEventListener("resize", ()=>requestAnimationFrame(drawEdges));
  }catch(e){
    $("#canvas").innerHTML = '<p class="hint">Failed to load: '+esc(String(e))+'</p>';
  }
}
init();
</script>
</body>
</html>`;
