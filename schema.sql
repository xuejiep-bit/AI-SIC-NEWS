-- AI 产业链资讯库 D1 schema

CREATE TABLE IF NOT EXISTS articles (
  id           TEXT PRIMARY KEY,   -- 基于链接的稳定 hash，用于去重
  title        TEXT NOT NULL,
  link         TEXT NOT NULL,
  summary      TEXT,
  source       TEXT,               -- 来源媒体名
  lang         TEXT,               -- 'zh' | 'en'
  layer        TEXT,               -- 'upstream' | 'midstream' | 'downstream' | 'other'
  segment      TEXT,               -- 细分环节 key，见 src/taxonomy.ts
  score        INTEGER DEFAULT 0,  -- 分类命中分数（用于排序/调试）
  published_at INTEGER,            -- 发布时间 unix ms
  fetched_at   INTEGER             -- 抓取入库时间 unix ms
);

CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_layer     ON articles(layer);
CREATE INDEX IF NOT EXISTS idx_articles_segment   ON articles(segment);
CREATE INDEX IF NOT EXISTS idx_articles_lang      ON articles(lang);
