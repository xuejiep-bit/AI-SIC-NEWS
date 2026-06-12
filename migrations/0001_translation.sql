-- 模块2 迁移：给已存在的 articles 表增量添加翻译管线字段（不影响存量数据）。
-- 对已有数据库执行一次：
--   npx wrangler d1 execute ai-sic-news --remote --file=./migrations/0001_translation.sql
-- 全新数据库直接用 schema.sql 即可，无需本迁移。

ALTER TABLE articles ADD COLUMN summary_zh TEXT;
ALTER TABLE articles ADD COLUMN region TEXT;
ALTER TABLE articles ADD COLUMN translate_status TEXT;
ALTER TABLE articles ADD COLUMN translate_attempts INTEGER DEFAULT 0;
ALTER TABLE articles ADD COLUMN translated_at INTEGER;

CREATE INDEX IF NOT EXISTS idx_articles_region  ON articles(region);
CREATE INDEX IF NOT EXISTS idx_articles_tstatus ON articles(translate_status);

-- 存量数据回填：
-- 中文资讯无需翻译，地区记国内、状态记 done、中文摘要同原摘要；
UPDATE articles SET region = 'cn', translate_status = 'done', summary_zh = summary
  WHERE lang = 'zh';
-- 视频（YouTube）无需进翻译管线，地区记国际、状态记 done；
UPDATE articles SET region = 'global', translate_status = 'done'
  WHERE layer IN ('video', 'video_invest');
-- 其余英文资讯：地区记国际、状态记 pending，等下一轮 Cron 翻译。
UPDATE articles SET region = 'global', translate_status = 'pending'
  WHERE lang != 'zh' AND layer NOT IN ('video', 'video_invest')
    AND translate_status IS NULL;
