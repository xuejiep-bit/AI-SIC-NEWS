-- AI 产业链资讯库 D1 schema

CREATE TABLE IF NOT EXISTS articles (
  id           TEXT PRIMARY KEY,   -- 基于链接的稳定 hash，用于去重
  title        TEXT NOT NULL,
  title_zh     TEXT,               -- 中文标题（英文资讯经 Claude 翻译；中文资讯同原标题）
  title_key    TEXT,               -- 标题归一化 key，用于跨源相似标题去重
  link         TEXT NOT NULL,
  summary      TEXT,
  source       TEXT,               -- 来源媒体名
  lang         TEXT,               -- 'zh' | 'en'
  layer        TEXT,               -- 'upstream' | 'midstream' | 'downstream' | 'other'
  segment      TEXT,               -- 细分环节 key，见 src/taxonomy.ts
  score        INTEGER DEFAULT 0,  -- 分类命中分数（关键词分类时使用）
  published_at INTEGER,            -- 发布时间 unix ms
  fetched_at   INTEGER,            -- 抓取入库时间 unix ms
  -- ── 模块2：英文资讯翻译管线字段 ──
  summary_zh         TEXT,         -- 中文摘要（英文资讯经 Workers AI 生成；中文资讯同原摘要）
  region             TEXT,         -- 'cn'(国内) | 'global'(国际)
  translate_status   TEXT,         -- NULL/'pending' 待翻译 | 'done' 已完成/无需 | 'failed' 失败
  translate_attempts INTEGER DEFAULT 0, -- 已重试次数（失败重试上限 3）
  translated_at      INTEGER,      -- 翻译完成时间 unix ms
  -- ── 今日精选：价值打分字段（纯免费关键词/规则打分）──
  value_score        INTEGER,      -- 1-10，对 AI 产业投资者的价值（NULL=尚未打分）
  value_reason       TEXT          -- 一句话：命中了哪类高价值信号
);

CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_layer     ON articles(layer);
CREATE INDEX IF NOT EXISTS idx_articles_segment   ON articles(segment);
CREATE INDEX IF NOT EXISTS idx_articles_lang      ON articles(lang);
CREATE INDEX IF NOT EXISTS idx_articles_region    ON articles(region);
CREATE INDEX IF NOT EXISTS idx_articles_tstatus   ON articles(translate_status);
CREATE INDEX IF NOT EXISTS idx_articles_value      ON articles(value_score);

-- 跨源去重：归一化标题唯一。配合入库时的 INSERT OR IGNORE，
-- 不同来源转载的同一篇资讯只会保留一条。
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_title_key ON articles(title_key);

-- ── 模块5：邮件订阅（第一版仅收集邮箱，不自动发信）──
CREATE TABLE IF NOT EXISTS subscribers (
  email         TEXT PRIMARY KEY,  -- 邮箱（小写归一化；主键天然去重）
  subscribed_at INTEGER,           -- 订阅时间 unix ms
  source        TEXT               -- 来源页面：home(首页主推区) | notes(笔记页底部)
);

-- ── 分析工具：单股报告当天缓存 ──
CREATE TABLE IF NOT EXISTS reports (
  k          TEXT PRIMARY KEY,  -- 策略:代码:日期
  md         TEXT,
  created_at INTEGER
);
