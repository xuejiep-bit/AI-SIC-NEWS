-- 模块5 迁移：新增邮件订阅表（不影响已有数据）。
-- 对已有数据库执行一次：
--   npx wrangler d1 execute ai-sic-news --remote --file=./migrations/0002_subscribers.sql

CREATE TABLE IF NOT EXISTS subscribers (
  email         TEXT PRIMARY KEY,
  subscribed_at INTEGER,
  source        TEXT
);
