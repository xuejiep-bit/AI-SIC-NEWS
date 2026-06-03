// AI 产业链分类体系 —— 对应「上游 / 中游 / 下游」三层及各细分环节。
// 资讯分类通过对标题+摘要做关键词匹配打分实现（见 classify.ts）。

export type Layer = "upstream" | "midstream" | "downstream" | "other";

export interface Segment {
  key: string;
  layer: Layer;
  zh: string;
  en: string;
  // 命中即归入该环节的关键词（中英文混合，大小写不敏感）
  keywords: string[];
}

export const LAYERS: { key: Layer; zh: string; en: string }[] = [
  { key: "upstream", zh: "上游 · 基础设施层", en: "Upstream · Infrastructure" },
  { key: "midstream", zh: "中游 · 技术与模型层", en: "Midstream · Models" },
  { key: "downstream", zh: "下游 · 应用层", en: "Downstream · Applications" },
  { key: "other", zh: "其他 · 行业动态", en: "Other · Industry" },
];

export const SEGMENTS: Segment[] = [
  // ── 上游 ──────────────────────────────────────────────
  {
    key: "equipment_materials",
    layer: "upstream",
    zh: "半导体设备与材料",
    en: "Equipment & Materials",
    keywords: [
      "光刻机", "光刻胶", "刻蚀", "薄膜沉积", "半导体设备", "晶圆制造设备", "特种气体",
      "ASML", "EUV", "lithography", "photoresist", "etch", "deposition",
      "Applied Materials", "应用材料", "Lam Research", "泛林", "Tokyo Electron",
      "东京电子", "KLA", "wafer fab equipment", "semiconductor equipment",
    ],
  },
  {
    key: "chip_design_mfg",
    layer: "upstream",
    zh: "芯片设计与制造",
    en: "Chip Design & Fabrication",
    keywords: [
      "英伟达", "Nvidia", "GPU", "AMD", "TPU", "Trainium", "Maia", "昇腾", "Ascend",
      "台积电", "TSMC", "三星代工", "Samsung Foundry", "英特尔", "Intel", "Fabless",
      "晶圆代工", "foundry", "芯片设计", "chip design", "制程", "nanometer", "nm 制程",
      "H100", "H200", "B200", "Blackwell", "GB200", "AI chip", "AI 芯片", "加速器", "accelerator",
      "Cerebras", "Groq", "寒武纪", "Cambricon",
    ],
  },
  {
    key: "memory_interconnect",
    layer: "upstream",
    zh: "存储与互联",
    en: "Memory & Interconnect",
    keywords: [
      "HBM", "高带宽内存", "SK海力士", "SK Hynix", "美光", "Micron", "DRAM", "存储芯片",
      "NVLink", "光模块", "光通信", "交换机", "interconnect", "optical module", "switch",
      "中际旭创", "新易盛", "InnoLight", "CPO", "co-packaged optics", "InfiniBand", "以太网交换",
    ],
  },
  {
    key: "server_datacenter",
    layer: "upstream",
    zh: "服务器与数据中心",
    en: "Servers & Data Centers",
    keywords: [
      "服务器", "AI 服务器", "数据中心", "超微", "Supermicro", "戴尔", "Dell", "浪潮",
      "工业富联", "data center", "datacenter", "server", "rack", "机柜", "Foxconn", "HPE",
    ],
  },
  {
    key: "cloud",
    layer: "upstream",
    zh: "云计算",
    en: "Cloud Computing",
    keywords: [
      "云计算", "云服务", "AWS", "Azure", "Google Cloud", "谷歌云", "阿里云", "Alibaba Cloud",
      "腾讯云", "华为云", "Oracle Cloud", "CoreWeave", "云厂商", "cloud provider", "hyperscaler",
      "算力租赁", "GPU cloud", "算力出租",
    ],
  },
  {
    key: "energy_cooling",
    layer: "upstream",
    zh: "能源与散热",
    en: "Energy & Cooling",
    keywords: [
      "液冷", "散热", "数据中心耗电", "电力", "核电", "nuclear", "power grid", "energy",
      "cooling", "liquid cooling", "immersion cooling", "浸没式", "电网", "SMR", "小型核反应堆",
      "data center power", "电力供应",
    ],
  },

  // ── 中游 ──────────────────────────────────────────────
  {
    key: "data",
    layer: "midstream",
    zh: "数据",
    en: "Data & Annotation",
    keywords: [
      "数据标注", "数据清洗", "数据采集", "合成数据", "训练数据", "Scale AI", "data labeling",
      "data annotation", "synthetic data", "training data", "dataset", "数据集", "语料",
    ],
  },
  {
    key: "model_training",
    layer: "midstream",
    zh: "算法与模型训练",
    en: "Models & Training",
    keywords: [
      "大模型", "大语言模型", "LLM", "GPT", "Claude", "Gemini", "Llama", "文心一言", "通义千问",
      "DeepSeek", "深度求索", "月之暗面", "Kimi", "智谱", "GLM", "OpenAI", "Anthropic",
      "DeepMind", "Mistral", "xAI", "Grok", "多模态", "multimodal", "模型训练", "预训练",
      "fine-tune", "微调", "推理模型", "reasoning model", "扩散模型", "diffusion", "Sora",
      "foundation model", "基础模型", "AGI", "百度", "字节", "腾讯", "阿里", "Qwen",
    ],
  },
  {
    key: "open_source",
    layer: "midstream",
    zh: "开源 / 闭源",
    en: "Open vs Closed Source",
    keywords: [
      "开源模型", "开源大模型", "模型权重", "open source model", "open weights", "open-source LLM",
      "Hugging Face", "权重公开", "闭源", "API 调用",
    ],
  },
  {
    key: "frameworks",
    layer: "midstream",
    zh: "框架与工具链",
    en: "Frameworks & MLOps",
    keywords: [
      "PyTorch", "TensorFlow", "JAX", "CUDA", "MLOps", "向量数据库", "vector database",
      "模型部署", "训练框架", "工具链", "LangChain", "推理框架", "vLLM", "model serving",
    ],
  },

  // ── 下游 ──────────────────────────────────────────────
  {
    key: "consumer",
    layer: "downstream",
    zh: "面向消费者 (To C)",
    en: "Consumer (To C)",
    keywords: [
      "ChatGPT", "豆包", "文小言", "聊天助手", "AI 写作", "AI 绘画", "Midjourney", "AI 视频",
      "AI 搜索", "AI 教育", "AI 陪伴", "Perplexity", "Character.AI", "AI assistant",
      "image generation", "video generation", "AI app", "consumer AI", "DALL", "Stable Diffusion",
    ],
  },
  {
    key: "enterprise",
    layer: "downstream",
    zh: "面向企业 (To B)",
    en: "Enterprise (To B)",
    keywords: [
      "智能客服", "代码助手", "GitHub Copilot", "Copilot", "Cursor", "企业级 AI", "enterprise AI",
      "金融风控", "医疗辅助", "法律", "智能制造", "AI 办公", "coding assistant", "AI agent",
      "智能体", "RPA", "客服机器人",
    ],
  },
  {
    key: "vertical",
    layer: "downstream",
    zh: "垂直行业应用",
    en: "Vertical Solutions",
    keywords: [
      "行业大模型", "垂直应用", "医疗 AI", "金融 AI", "法律 AI", "教育 AI", "工业 AI",
      "AI 医疗", "AI for science", "蛋白质", "AlphaFold", "药物研发", "vertical AI", "行业解决方案",
    ],
  },
  {
    key: "hardware",
    layer: "downstream",
    zh: "智能硬件",
    en: "Smart Hardware",
    keywords: [
      "AI 手机", "AI PC", "AI 眼镜", "智能音箱", "机器人", "人形机器人", "humanoid", "robot",
      "自动驾驶", "autonomous driving", "Robotaxi", "Tesla", "特斯拉", "smart glasses",
      "AI hardware", "具身智能", "embodied AI", "Optimus", "Figure",
    ],
  },
];

// 便于按 key 取细分环节
export const SEGMENT_BY_KEY: Record<string, Segment> = Object.fromEntries(
  SEGMENTS.map((s) => [s.key, s]),
);
