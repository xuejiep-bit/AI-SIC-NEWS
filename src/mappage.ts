// 模块4：AI 产业链地图页（/map）。三层布局 + 节点档案卡。
// 节点数据来自 src/mapconfig.json（经 /api/mapdata 下发，直接编辑该 JSON 即可更新页面）；
// 「最新动态」条数来自 /api/stats 的分类计数，点击跳转到按该分类筛选后的资讯流。

export const MAP_HTML = /* html */ `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<title>AI 产业链地图 · AI 链</title>
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
    color:#fff; font-weight:800; font-size:14px; display:flex; align-items:center; justify-content:center; }
  header h1 { font-size:17px; margin:0; }
  header a.back { margin-left:auto; color:var(--acc); text-decoration:none; font-size:13px; }
  header a.back:hover { text-decoration:underline; }
  .wrap { max-width:1080px; margin:0 auto; padding:22px 20px 60px; }
  .hint { color:var(--dim); font-size:13px; margin:0 0 18px; }
  /* 三层布局：每层一个色系区块，节点为色块按钮，自动换行（移动端适配） */
  .layerbox { border:1px solid var(--line); border-radius:14px; padding:16px 18px; margin-bottom:14px; background:var(--panel); }
  .layerbox h2 { margin:0 0 12px; font-size:14.5px; display:flex; align-items:center; gap:8px; }
  .layerbox h2 .dot { width:10px; height:10px; border-radius:50%; }
  .nodes { display:flex; flex-wrap:wrap; gap:8px; }
  .node { border:1px solid var(--line); border-radius:9px; padding:8px 13px; cursor:pointer;
    font-size:13px; color:var(--txt); background:var(--panel2); transition:all .15s; }
  .node:hover { transform:translateY(-1px); }
  .node.on { color:#fff; font-weight:600; }
  .arrow { text-align:center; color:var(--dim); font-size:16px; margin:2px 0; }
  /* 档案卡：点击节点后在下方展开 */
  #detail { display:none; border:1px solid var(--line); border-radius:14px; background:var(--panel);
    padding:20px; margin-top:18px; }
  #detail h3 { margin:0 0 4px; font-size:17px; display:flex; align-items:center; gap:10px; }
  #detail h3 .lay { font-size:11px; font-weight:400; padding:2px 9px; border-radius:20px; color:#fff; }
  #detail .desc { color:var(--txt); font-size:13.5px; line-height:1.7; margin:10px 0 0; }
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
  <div class="logo">AI</div>
  <h1>🗺️ AI 产业链地图</h1>
  <a class="back" href="/">← 返回资讯首页</a>
</header>
<div class="wrap">
  <p class="hint">按「上游 → 中游 → 下游」三层展开，点击任一环节查看说明、代表公司与最新动态。</p>
  <div id="layers"></div>
  <div id="detail"></div>
</div>
<script>
const LAYERS = [
  { key:"upstream",   name:"上游 · 基础设施层", color:"var(--up)" },
  { key:"midstream",  name:"中游 · 技术与模型层", color:"var(--mid)" },
  { key:"downstream", name:"下游 · 应用层", color:"var(--down)" },
];
let NODES = [];   // 节点配置（/api/mapdata，编辑 src/mapconfig.json 即可更新）
let COUNTS = {};  // 各分类的资讯条数（/api/stats）
let NOTES = [];   // 深度笔记（/api/vidnotes）：带 segs 标签的笔记自动挂到对应环节下
let current = null;

const $ = s => document.querySelector(s);
function esc(s){ return (s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
const layerOf = k => LAYERS.find(l=>l.key===k);

function render(){
  $("#layers").innerHTML = LAYERS.map((L,i)=>{
    const nodes = NODES.filter(n=>n.layer===L.key);
    return '<div class="layerbox" style="border-left:3px solid '+L.color+'">'+
      '<h2><span class="dot" style="background:'+L.color+'"></span>'+esc(L.name)+'</h2>'+
      '<div class="nodes">'+nodes.map(n=>
        '<div class="node'+(current===n.id?' on':'')+'" data-id="'+n.id+'"'+
        (current===n.id?' style="background:'+L.color+';border-color:'+L.color+'"':'')+'>'+esc(n.name)+'</div>'
      ).join("")+'</div></div>'+
      (i<LAYERS.length-1?'<div class="arrow">↓</div>':'');
  }).join("");
  document.querySelectorAll(".node").forEach(el=>{
    el.onclick = ()=>{ current = el.dataset.id; render(); renderDetail(); };
  });
}

function renderDetail(){
  const n = NODES.find(x=>x.id===current);
  const box = $("#detail");
  if(!n){ box.style.display="none"; return; }
  const L = layerOf(n.layer);
  const count = COUNTS[n.category_key]||0;
  const cos = (n.companies&&n.companies.length)
    ? '<div class="chips">'+n.companies.map(c=>'<span class="co">'+esc(c)+'</span>').join("")+'</div>'
    : '<span class="todo" style="color:var(--dim);font-size:13px">待补充</span>';
  // 笔记 = 自动关联（笔记的 segs 含本环节）+ mapconfig.json 里手动配置的链接
  const auto = NOTES.filter(v=>(v.segs||[]).includes(n.category_key))
    .map(v=>({ title:v.title, url:"/?notes=1&note="+encodeURIComponent(v.id) }));
  const links = auto.concat(n.note_links||[]);
  const notes = links.length
    ? links.map(x=>'<a href="'+x.url+'">📝 '+esc(x.title)+'</a>').join("")
    : '<span class="todo">待写</span>';
  box.innerHTML =
    '<h3>'+esc(n.name)+'<span class="lay" style="background:'+L.color+'">'+esc(L.name)+'</span></h3>'+
    '<div class="desc">'+esc(n.desc||"")+'</div>'+
    '<div class="sec"><h4>相关公司</h4>'+cos+'</div>'+
    '<div class="sec"><h4>最新动态</h4>'+
      '<a class="newslink" href="/?segment='+encodeURIComponent(n.category_key)+'">'+
      '近 30 天 '+count+' 条相关资讯，点击查看 →</a></div>'+
    '<div class="sec notes"><h4>我的笔记</h4>'+notes+'</div>';
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
    render();
  }catch(e){
    $("#layers").innerHTML = '<p class="hint">加载失败：'+esc(String(e))+'</p>';
  }
}
init();
</script>
</body>
</html>`;
