// 「投资视频解读」内容库 —— 人工精选 YouTube 投资类视频的字幕总结。
// 工作流：拿到视频字幕 → 用 Claude 总结成下面的结构 → 在 VID_NOTES 数组「开头」插入一条 → 部署即上线。
// 没有条目时前端自动隐藏该栏目。条目按数组顺序展示，新的放最前面。

export interface VidNote {
  id: string;         // 唯一 slug，如 "2026-06-veteran-on-nvda"
  title: string;      // 解读标题（中文，自己起，概括视频核心观点）
  channel: string;    // YouTube 频道名
  videoTitle: string; // 视频原标题
  url: string;        // 视频链接
  date: string;       // 视频发布日期 YYYY-MM-DD
  takeaways: string[];// 核心要点（3~6 条，每条一句话）
  summary: string;    // 详细总结（几段话，用 \n 分段）
  tickers?: string[]; // 涉及的股票代码，如 ["NVDA","TSM"]
}

export const VID_NOTES: VidNote[] = [];
