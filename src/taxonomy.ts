// AI 产业链分类体系（投资板块视角）—— 三层 + 24 个细分板块。
// 每个板块的 keywords 含中英文及代表公司，便于关键词打分分类（见 classify.ts）。

export type Layer = "upstream" | "midstream" | "downstream" | "other";

export interface Segment {
  key: string;
  layer: Layer;
  zh: string;
  en: string;
  keywords: string[];
}

export const LAYERS: { key: Layer; zh: string; en: string }[] = [
  { key: "upstream", zh: "上游 · 基础设施层", en: "Upstream · Infrastructure" },
  { key: "midstream", zh: "中游 · 技术与模型层", en: "Midstream · Models" },
  { key: "downstream", zh: "下游 · 应用层", en: "Downstream · Applications" },
  { key: "other", zh: "其他 · 行业动态", en: "Other · Industry" },
];

export const SEGMENTS: Segment[] = [
  // ── 上游 · 基础设施（卖铲子，确定性最高）──────────────
  {
    key: "ai_compute_chip", layer: "upstream", zh: "AI算力芯片", en: "AI Compute Chips",
    keywords: [
      "AI算力芯片", "算力芯片", "AI芯片", "AI chip", "GPU", "加速器", "accelerator", "AI accelerator",
      "英伟达", "Nvidia", "AMD", "博通", "Broadcom", "寒武纪", "Cambricon", "Groq", "Cerebras",
      "H100", "H200", "B200", "Blackwell", "GB200", "MI300", "MI350",
    ],
  },
  {
    key: "self_designed_chip", layer: "upstream", zh: "云厂自研芯片", en: "In-house Silicon",
    keywords: [
      "自研芯片", "custom silicon", "in-house chip", "TPU", "谷歌TPU", "Google TPU",
      "Trainium", "Inferentia", "Maia", "昇腾", "Ascend", "华为昇腾", "自研AI芯片",
    ],
  },
  {
    key: "foundry", layer: "upstream", zh: "晶圆代工", en: "Foundry",
    keywords: [
      "晶圆代工", "代工厂", "foundry", "台积电", "TSMC", "三星代工", "Samsung Foundry",
      "中芯国际", "SMIC", "格芯", "GlobalFoundries", "制程", "3nm", "2nm", "nanometer", "先进制程",
    ],
  },
  {
    key: "semi_equipment", layer: "upstream", zh: "半导体设备", en: "Semi Equipment",
    keywords: [
      "半导体设备", "光刻机", "ASML", "EUV", "lithography", "刻蚀", "etch", "薄膜沉积", "deposition",
      "应用材料", "Applied Materials", "泛林", "Lam Research", "东京电子", "Tokyo Electron", "KLA",
      "北方华创", "中微公司", "晶圆制造设备",
    ],
  },
  {
    key: "semi_material", layer: "upstream", zh: "半导体材料", en: "Semi Materials",
    keywords: [
      "半导体材料", "光刻胶", "photoresist", "特种气体", "特气", "硅片", "wafer", "silicon wafer",
      "电子材料", "CMP", "靶材", "电子特气",
    ],
  },
  {
    key: "advanced_packaging", layer: "upstream", zh: "先进封装(CoWoS)", en: "Advanced Packaging",
    keywords: [
      "先进封装", "advanced packaging", "CoWoS", "chiplet", "2.5D", "3D封装", "封测",
      "日月光", "ASE", "长电科技", "通富微电", "甬矽电子", "封装基板",
    ],
  },
  {
    key: "hbm_memory", layer: "upstream", zh: "HBM/存储", en: "HBM & Memory",
    keywords: [
      "HBM", "高带宽内存", "HBM3", "HBM3E", "HBM4", "SK海力士", "SK Hynix", "海力士",
      "美光", "Micron", "DRAM", "存储芯片", "闪存", "NAND", "存储颗粒",
    ],
  },
  {
    key: "optical_interconnect", layer: "upstream", zh: "光模块/光互联", en: "Optical / Interconnect",
    keywords: [
      "光模块", "光通信", "光互联", "optical module", "CPO", "co-packaged optics", "硅光",
      "中际旭创", "新易盛", "InnoLight", "天孚通信", "Coherent", "NVLink", "InfiniBand",
      "交换机", "switch", "800G", "1.6T",
    ],
  },
  {
    key: "server_datacenter", layer: "upstream", zh: "服务器/数据中心", en: "Servers & DC",
    keywords: [
      "AI服务器", "服务器", "数据中心", "data center", "datacenter", "server", "机柜", "rack",
      "超微", "Supermicro", "工业富联", "浪潮", "戴尔", "Dell", "HPE", "Foxconn", "鸿海",
    ],
  },
  {
    key: "cloud_compute", layer: "upstream", zh: "云算力/租赁", en: "Cloud & GPU Rental",
    keywords: [
      "云计算", "云服务", "算力租赁", "算力出租", "GPU cloud", "hyperscaler", "云厂商",
      "AWS", "Azure", "Google Cloud", "谷歌云", "阿里云", "腾讯云", "华为云", "Oracle Cloud",
      "CoreWeave", "Lambda", "甲骨文云",
    ],
  },
  {
    key: "power_energy", layer: "upstream", zh: "电力/能源/核电", en: "Power & Energy",
    keywords: [
      "数据中心耗电", "电力", "电网", "power grid", "能源", "energy", "核电", "nuclear", "SMR",
      "小型核反应堆", "Vertiv", "维谛", "电力设备", "发电", "储能", "data center power", "用电",
    ],
  },
  {
    key: "cooling", layer: "upstream", zh: "液冷散热", en: "Cooling",
    keywords: [
      "液冷", "散热", "cooling", "liquid cooling", "immersion cooling", "浸没式", "冷板",
      "风冷", "thermal", "英维克", "高澜股份", "数据中心散热",
    ],
  },

  // ── 中游 · 模型与平台（高投入、分歧最大）──────────────
  {
    key: "closed_model", layer: "midstream", zh: "闭源大模型", en: "Closed Models",
    keywords: [
      "闭源", "闭源模型", "闭源大模型", "OpenAI", "GPT", "GPT-5", "Anthropic", "Claude",
      "Gemini", "DeepMind", "xAI", "Grok", "API 调用", "API调用", "前沿模型", "frontier model",
    ],
  },
  {
    key: "open_model", layer: "midstream", zh: "开源/国产模型", en: "Open & China Models",
    keywords: [
      "开源模型", "开源大模型", "open source model", "open weights", "开源", "Llama", "Meta AI",
      "DeepSeek", "深度求索", "通义千问", "Qwen", "智谱", "GLM", "月之暗面", "Kimi", "Mistral",
      "文心一言", "百度文心", "豆包大模型", "国产大模型", "Hugging Face", "模型权重",
    ],
  },
  {
    key: "data_annotation", layer: "midstream", zh: "数据/标注", en: "Data & Annotation",
    keywords: [
      "数据标注", "数据清洗", "数据采集", "合成数据", "训练数据", "Scale AI", "data labeling",
      "data annotation", "synthetic data", "dataset", "数据集", "语料", "高质量数据",
    ],
  },
  {
    key: "framework_tooling", layer: "midstream", zh: "框架/工具链", en: "Frameworks & MLOps",
    keywords: [
      "PyTorch", "TensorFlow", "JAX", "CUDA", "MLOps", "向量数据库", "vector database",
      "LangChain", "vLLM", "推理框架", "训练框架", "工具链", "model serving", "模型部署", "微调平台",
    ],
  },

  // ── 下游 · 应用与变现（潜力大，胜负未定）──────────────
  {
    key: "ai_agent", layer: "downstream", zh: "AI Agent/智能体", en: "AI Agents",
    keywords: [
      "AI Agent", "AI agent", "智能体", "agentic", "自主智能体", "multi-agent", "多智能体",
      "AutoGPT", "AI 助理", "智能助手", "agent 框架",
    ],
  },
  {
    key: "ai_coding", layer: "downstream", zh: "AI编程", en: "AI Coding",
    keywords: [
      "AI编程", "代码助手", "编程助手", "coding assistant", "code generation", "GitHub Copilot",
      "Copilot", "Cursor", "Cognition", "Devin", "Windsurf", "Claude Code", "AI 写代码", "vibe coding",
    ],
  },
  {
    key: "enterprise_saas", layer: "downstream", zh: "企业软件/SaaS", en: "Enterprise SaaS",
    keywords: [
      "企业软件", "SaaS", "企业级AI", "enterprise AI", "智能客服", "CRM", "ERP", "办公软件",
      "Salesforce", "ServiceNow", "Palantir", "SAP", "Adobe", "微软Copilot", "Microsoft 365", "钉钉",
    ],
  },
  {
    key: "consumer_app", layer: "downstream", zh: "To C 应用", en: "Consumer Apps",
    keywords: [
      "ChatGPT", "豆包", "文小言", "聊天助手", "AI写作", "AI绘画", "Midjourney", "AI视频", "Sora",
      "AI搜索", "Perplexity", "Character.AI", "AI陪伴", "图像生成", "视频生成", "DALL", "Stable Diffusion",
      "消费级AI", "consumer AI",
    ],
  },
  {
    key: "autonomous_driving", layer: "downstream", zh: "自动驾驶", en: "Autonomous Driving",
    keywords: [
      "自动驾驶", "autonomous driving", "智能驾驶", "Robotaxi", "FSD", "特斯拉FSD", "Tesla FSD",
      "Waymo", "小鹏", "萝卜快跑", "L4", "激光雷达", "lidar", "无人驾驶", "辅助驾驶",
    ],
  },
  {
    key: "robotics", layer: "downstream", zh: "人形机器人/具身", en: "Robotics",
    keywords: [
      "人形机器人", "humanoid", "机器人", "robot", "具身智能", "embodied AI", "Optimus",
      "Figure", "宇树", "Unitree", "波士顿动力", "Boston Dynamics", "灵巧手", "机器狗",
    ],
  },
  {
    key: "ai_hardware", layer: "downstream", zh: "AI硬件", en: "AI Hardware",
    keywords: [
      "AI手机", "AI PC", "AI 眼镜", "AI眼镜", "smart glasses", "智能音箱", "AI硬件", "AI hardware",
      "Rabbit", "AI Pin", "端侧AI", "on-device", "端侧大模型", "AI 耳机",
    ],
  },
  {
    key: "vertical_industry", layer: "downstream", zh: "垂直行业", en: "Vertical Industries",
    keywords: [
      "医疗AI", "AI医疗", "金融AI", "法律AI", "教育AI", "工业AI", "AI for science", "蛋白质",
      "AlphaFold", "药物研发", "行业大模型", "行业解决方案", "智能制造", "AI制药", "辅助诊断",
    ],
  },
];

export const SEGMENT_BY_KEY: Record<string, Segment> = Object.fromEntries(
  SEGMENTS.map((s) => [s.key, s]),
);
