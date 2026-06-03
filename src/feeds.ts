// RSS / Atom 数据源清单（中英文）。
// 这些源覆盖科技、财经、半导体、AI 垂直媒体及部分公司官方博客。
// 不同站点的 RSS 可用性会变化 —— 失效的源会在抓取时被静默跳过（见 index.ts）。
// 想增删来源，直接编辑此文件即可。

export interface Feed {
  name: string;
  url: string;
  lang: "zh" | "en";
}

export const FEEDS: Feed[] = [
  // ── 英文：综合科技 / AI ─────────────────────────────
  { name: "TechCrunch", url: "https://techcrunch.com/feed/", lang: "en" },
  { name: "The Verge", url: "https://www.theverge.com/rss/index.xml", lang: "en" },
  { name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index", lang: "en" },
  { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/", lang: "en" },
  { name: "MIT Technology Review", url: "https://www.technologyreview.com/feed/", lang: "en" },
  { name: "The Register", url: "https://www.theregister.com/headlines.atom", lang: "en" },
  { name: "Hacker News", url: "https://hnrss.org/frontpage", lang: "en" },

  // ── 英文：半导体 / 硬件 ─────────────────────────────
  { name: "Tom's Hardware", url: "https://www.tomshardware.com/feeds/all", lang: "en" },
  { name: "Semiconductor Engineering", url: "https://semiengineering.com/feed/", lang: "en" },
  { name: "EE Times", url: "https://www.eetimes.com/feed/", lang: "en" },
  { name: "AnandTech", url: "https://www.anandtech.com/rss/", lang: "en" },

  // ── 英文：公司官方博客 ─────────────────────────────
  { name: "NVIDIA Blog", url: "https://blogs.nvidia.com/feed/", lang: "en" },
  { name: "Google AI Blog", url: "https://blog.google/technology/ai/rss/", lang: "en" },
  { name: "AWS Machine Learning", url: "https://aws.amazon.com/blogs/machine-learning/feed/", lang: "en" },

  // ── 中文：综合科技 / 创投 ───────────────────────────
  { name: "36氪", url: "https://www.36kr.com/feed", lang: "zh" },
  { name: "机器之心", url: "https://www.jiqizhixin.com/rss", lang: "zh" },
  { name: "钛媒体", url: "https://www.tmtpost.com/rss.xml", lang: "zh" },
  { name: "InfoQ 中文", url: "https://www.infoq.cn/feed", lang: "zh" },
  { name: "cnBeta", url: "https://www.cnbeta.com.tw/backend.php", lang: "zh" },
];
