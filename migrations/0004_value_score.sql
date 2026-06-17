-- 「今日精选」迁移：新增价值打分字段（纯免费关键词/规则打分，不调用任何付费 API）。
-- 对已有数据库执行一次：
--   npx wrangler d1 execute ai-sic-news --remote --file=./migrations/0004_value_score.sql

ALTER TABLE articles ADD COLUMN value_score INTEGER;   -- 1-10，对 AI 产业投资者的价值（NULL=尚未打分）
ALTER TABLE articles ADD COLUMN value_reason TEXT;     -- 一句话：命中了哪类高价值信号

CREATE INDEX IF NOT EXISTS idx_articles_value ON articles(value_score);
