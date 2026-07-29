-- D1 写入量优化：精简 articles 表索引。
-- 背景：D1 按「行写入」计费（免费额度 10 万行/天），且每插入/删除 1 行数据，
-- 表上的每个索引也各计 1 行写入。articles 此前有 8 个索引，等于每篇文章
-- 入库计 ~9 行、到期删除再计 ~9 行，是写入超标的主因之一。
--
-- 此迁移删掉 4 个低价值索引：
--   idx_articles_lang     全站已 English-only，lang 过滤无意义
--   idx_articles_tstatus  翻译管线未运行，translate_status 无查询
--   idx_articles_region   低选择性（只有 cn/global 两值），全表扫描足够
--   idx_articles_segment  低选择性，且表内常驻仅几千行，扫描成本可忽略
-- 保留：idx_articles_published（排序主索引）、idx_articles_layer（视频/栏目查询）、
--       idx_articles_value（今日精选）、idx_articles_title_key（唯一索引，去重必需）。
--
-- 对已有数据库执行一次：
--   npx wrangler d1 execute ai-sic-news --remote --file=./migrations/0005_optimize_writes.sql

DROP INDEX IF EXISTS idx_articles_lang;
DROP INDEX IF EXISTS idx_articles_tstatus;
DROP INDEX IF EXISTS idx_articles_region;
DROP INDEX IF EXISTS idx_articles_segment;
