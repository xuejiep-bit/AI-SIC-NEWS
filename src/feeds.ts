// RSS / Atom 数据源清单（中英文）。
// 覆盖综合科技、AI 垂直、半导体/硬件、财经与公司官方博客。
// 不同站点的 RSS 可用性会随时间变化 —— 失效的源会在抓取时被静默跳过（见 index.ts），
// 不影响其它源。想增删来源，直接编辑此文件即可。

export interface Feed {
  name: string;
  url: string;
  lang: "zh" | "en";
}

export const FEEDS: Feed[] = [
  // ── 英文 · 综合科技 / AI ────────────────────────────
  { name: "TechCrunch", url: "https://techcrunch.com/feed/", lang: "en" },
  { name: "The Verge", url: "https://www.theverge.com/rss/index.xml", lang: "en" },
  { name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index", lang: "en" },
  { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/", lang: "en" },
  { name: "MIT Technology Review", url: "https://www.technologyreview.com/feed/", lang: "en" },
  { name: "The Register", url: "https://www.theregister.com/headlines.atom", lang: "en" },
  { name: "Hacker News", url: "https://hnrss.org/frontpage", lang: "en" },
  { name: "The Decoder", url: "https://the-decoder.com/feed/", lang: "en" },
  { name: "IEEE Spectrum", url: "https://spectrum.ieee.org/feeds/feed.rss", lang: "en" },

  // ── 英文 · 半导体 / 硬件 ────────────────────────────
  { name: "Tom's Hardware", url: "https://www.tomshardware.com/feeds/all", lang: "en" },
  { name: "Semiconductor Engineering", url: "https://semiengineering.com/feed/", lang: "en" },
  { name: "EE Times", url: "https://www.eetimes.com/feed/", lang: "en" },

  // ── 英文 · 大模型 / 公司官方博客 ────────────────────
  // 注：Anthropic（Claude）目前没有公开 RSS，暂无法自动抓取。
  { name: "OpenAI", url: "https://openai.com/news/rss.xml", lang: "en" },
  { name: "Google DeepMind", url: "https://deepmind.google/blog/rss.xml", lang: "en" },
  { name: "NVIDIA Blog", url: "https://blogs.nvidia.com/feed/", lang: "en" },
  { name: "Google AI Blog", url: "https://blog.google/technology/ai/rss/", lang: "en" },
  { name: "AWS Machine Learning", url: "https://aws.amazon.com/blogs/machine-learning/feed/", lang: "en" },
  { name: "Hugging Face Blog", url: "https://huggingface.co/blog/feed.xml", lang: "en" },

  // ── 中文 · 综合科技 / 创投 ──────────────────────────
  { name: "36氪", url: "https://www.36kr.com/feed", lang: "zh" },
  { name: "机器之心", url: "https://www.jiqizhixin.com/rss", lang: "zh" },
  { name: "钛媒体", url: "https://www.tmtpost.com/rss.xml", lang: "zh" },
  { name: "InfoQ 中文", url: "https://www.infoq.cn/feed", lang: "zh" },
  { name: "IT之家", url: "https://www.ithome.com/rss/", lang: "zh" },
  { name: "虎嗅网", url: "https://www.huxiu.com/rss/0.xml", lang: "zh" },
  { name: "雷峰网", url: "https://www.leiphone.com/feed", lang: "zh" },
  { name: "cnBeta", url: "https://www.cnbeta.com.tw/backend.php", lang: "zh" },

  // ── 经 Google News RSS 聚合（拿标题+链接，正文跳原站）─────
  // 路透等媒体已关闭官方 RSS，用 Google News 按来源检索可拿到标题与跳转链接。
  // 正文是否可读取决于用户在原站的会员权限；我们只展示标题/摘要/链接。
  {
    name: "路透 Reuters",
    url: "https://news.google.com/rss/search?q=(AI%20OR%20%22artificial%20intelligence%22%20OR%20semiconductor%20OR%20chip%20OR%20funding)%20site:reuters.com&hl=en-US&gl=US&ceid=US:en",
    lang: "en",
  },
  {
    name: "彭博 Bloomberg",
    url: "https://news.google.com/rss/search?q=(AI%20OR%20%22artificial%20intelligence%22%20OR%20semiconductor%20OR%20chip)%20site:bloomberg.com&hl=en-US&gl=US&ceid=US:en",
    lang: "en",
  },
  {
    name: "路透中文",
    url: "https://news.google.com/rss/search?q=(AI%20OR%20%E4%BA%BA%E5%B7%A5%E6%99%BA%E8%83%BD%20OR%20%E8%8A%AF%E7%89%87%20OR%20%E5%8D%8A%E5%AF%BC%E4%BD%93)%20site:reuters.com&hl=zh-CN&gl=CN&ceid=CN:zh-Hans",
    lang: "zh",
  },
];
