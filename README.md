# AI 产业链实时资讯 · AI Supply Chain News

每天定时（默认 2 次）自动从全球中英文媒体抓取 AI 产业链相关资讯，按 **上游（基础设施）→ 中游（技术与模型）→ 下游（应用）** 的结构自动分类，提供一个可筛选、可搜索的双语网站。

基于 **Cloudflare 全家桶**：Workers（API + 网站）+ D1（数据库）+ Cron（定时抓取）。数据来源以 **RSS / 免费源聚合** 为主，稳定、合法、零成本。

---

## 产业链分类结构

| 层级 | 细分环节 |
|------|----------|
| **上游 · 基础设施** | 半导体设备与材料、芯片设计与制造、存储与互联、服务器与数据中心、云计算、能源与散热 |
| **中游 · 技术与模型** | 数据、算法与模型训练、开源/闭源、框架与工具链 |
| **下游 · 应用** | 面向消费者(To C)、面向企业(To B)、垂直行业、智能硬件 |
| **其他** | 未明确归类的行业动态 |

分类逻辑见 `src/taxonomy.ts`（关键词词典）与 `src/classify.ts`（打分匹配）。想调整归类，编辑关键词即可。

## 首页结构

首页只有三段，没有侧栏分类导航：

1. **🔥 Supply-Chain Heat** —— 产业链 24 个细分环节的资讯热度（近 48 小时的真实条数，颜色越深越热）。点任一格子，抽屉里给出该环节的代表公司和最新报道。
2. **🔥 Hottest right now** —— 全站唯一的资讯列表：按重要性打分排序的最热 30 条，可用 More / Balanced / Top only 调档，搜索框在已加载的列表里本地过滤。
3. **📡 Sources** —— 全部信息来源站点的网址，按「AI 实验室 / 科技媒体 / 半导体 / 财经媒体 / 视频频道」分组。绿点＝已自动抓取，灰点＝只做外链（无公开 RSS）。名单由 `/api/sources` 从 `src/feeds.ts` 派生，增删数据源只改 `feeds.ts` 一处即可。

## 国内版 / 国际版

网站分两支，按访问者 IP 自动选默认版本（中国大陆 IP → 国内版），右上角按钮可手动切换并记忆；分享时可用 `?region=cn` / `?region=global` 直达指定版本。

| | 国际版 | 国内版 |
|---|---|---|
| 资讯 | 全部来源 | 剔除经 Google News 跳转的条目（大陆打不开） |
| AI 视频 | 显示（YouTube） | 隐藏 |
| 美股财报 | SEC EDGAR + stockanalysis | 雪球 |
| 港股财报 | 雪球 | 雪球 |
| A股财报 | 同花顺 F10 | 同花顺 F10 |

## 项目结构

```
wrangler.toml      Cloudflare 配置（D1 绑定 + Cron）
schema.sql         D1 表结构
src/
  index.ts         Worker 入口：API、网站、scheduled 定时抓取
  feeds.ts         RSS 数据源清单（中英文，可自由增删）
  rss.ts           零依赖 RSS/Atom 解析器
  taxonomy.ts      产业链分类体系 + 关键词
  classify.ts      关键词打分分类
  page.ts          内嵌的双语前端单页
```

## 本地运行

```bash
npm install

# 1) 创建本地 D1 并建表
npm run db:init:local

# 2) 启动本地开发服务器（默认 http://localhost:8787）
npm run dev

# 3) 触发一次抓取，灌入数据（本地默认 REFRESH_TOKEN 为空 = 管理接口关闭，
#    需先在 wrangler.toml 里临时设置 REFRESH_TOKEN 并在请求里带 ?token=）
npm run refresh:local        # 等价于 curl http://localhost:8787/api/refresh
```

打开 http://localhost:8787 即可看到网站。

## 部署到 Cloudflare

```bash
# 1) 登录
npx wrangler login

# 2) 创建 D1 数据库，把输出的 database_id 填回 wrangler.toml
npx wrangler d1 create ai-sic-news

# 3) 远端建表
npm run db:init

# 4)（可选）设置管理接口（/api/refresh 等）的保护令牌；不设置则这些接口整体关闭
npx wrangler secret put REFRESH_TOKEN

# 5) 部署
npm run deploy
```

部署后：
- 网站在 Worker 的默认域名上（`*.workers.dev`）或你绑定的自定义域名。
- Cron（默认每天 2 次，见 `wrangler.toml` 的 `crons`）会自动抓取入库，无需人工干预。
- 也可手动触发：`GET /api/refresh?token=<你的令牌>`（需已设置 `REFRESH_TOKEN`，未设置时接口关闭）。

### D1 写入额度（免费版 10 万行/天）

D1 按「行写入」计费，且每插入/删除 1 行数据，表上的每个索引也各计 1 行。为控制写入量，抓取管线做了四层限制（都可在 `wrangler.toml` 调整）：

- **降频**：Cron 每天 2 次（曾经每小时一次是写入超标的放大器之一）。
- **每源限量**：`PER_FEED_LIMIT`（默认 10），每个源每轮只取最新 N 条。
- **入库前过滤**：`INGEST_MIN_VALUE`（默认 4），分类为 other 的低价值资讯直接丢弃、不写库。
- **精简索引**：articles 表只保留 4 个索引（见 `migrations/0005_optimize_writes.sql`）。

## API

| 路由 | 说明 |
|------|------|
| `GET /` | 双语网站首页 |
| `GET /api/news?layer=&segment=&lang=&q=&limit=` | 资讯列表（JSON），支持按层级/环节/语言/关键词筛选 |
| `GET /api/picks?min=&hours=&limit=` | 最热资讯（按重要性打分排序），首页主列表用 |
| `GET /api/stats?hours=` | 各层级 / 环节的资讯计数；`hours=` 限定统计窗口，首页热力图用 |
| `GET /api/sources` | 信息来源站点清单（由 `src/feeds.ts` 派生），首页 Sources 板块用 |
| `GET /api/refresh?token=` | 手动触发抓取（管理接口：必须配置 REFRESH_TOKEN，否则关闭） |

## 后续可扩展

- **AI 语义分类**：当前用关键词打分，可接 Claude API 做更准的归类与中英标题互译。
- **去重增强**：跨源标题相似度去重。
- **更多源**：在 `src/feeds.ts` 增加官方博客、行业站点；对无 RSS 的站点可补充 HTML 抓取。
- **数据保留策略**：定期清理过期文章（如保留近 30 天）。
