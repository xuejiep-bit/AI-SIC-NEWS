-- 分析工具：单股报告当天缓存表。
-- 对已有数据库执行一次：
--   npx wrangler d1 execute ai-sic-news --remote --file=./migrations/0003_reports.sql

CREATE TABLE IF NOT EXISTS reports (
  k          TEXT PRIMARY KEY,  -- 缓存键: 策略:代码:日期, 如 graham:KO:2026-06-12
  md         TEXT,              -- 报告 Markdown 全文
  created_at INTEGER            -- 生成时间 unix ms
);
