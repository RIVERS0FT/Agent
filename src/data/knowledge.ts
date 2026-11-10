import type { KnowledgeItem, KnowledgeResource } from "../types";

type NodeOptions = {
  tags?: string[];
  color?: string;
  resources?: KnowledgeResource[];
  children?: KnowledgeItem[];
};

type TechSpec = {
  id: string;
  title: string;
  summary: string;
  description: string;
  tags?: string[];
  resources?: KnowledgeResource[];
  points?: string[];
};

const node = (
  id: string,
  title: string,
  summary: string,
  description: string,
  points: string[],
  options: NodeOptions = {}
): KnowledgeItem => ({
  id, title, summary, description, points,
  ...(options.tags ? { tags: options.tags } : {}),
  ...(options.color ? { color: options.color } : {}),
  ...(options.resources ? { resources: options.resources } : {}),
  ...(options.children ? { children: options.children } : {})
});

const tech = (spec: TechSpec): KnowledgeItem => node(
  spec.id,
  spec.title,
  spec.summary,
  spec.description,
  spec.points ?? [
    "核心机制：" + spec.summary,
    "实现关注点：" + spec.description
  ],
  { tags: spec.tags, resources: spec.resources }
);

const capability = (
  id: string,
  title: string,
  summary: string,
  description: string,
  implementations: TechSpec[],
  tags: string[] = []
): KnowledgeItem => node(
  id, title, summary, description,
  [
    "能力边界：" + summary,
    "设计原则：" + description
  ],
  { tags, children: implementations.map(tech) }
);

const moduleNode = (
  id: string,
  title: string,
  summary: string,
  description: string,
  color: string,
  tags: string[],
  capabilities: KnowledgeItem[]
): KnowledgeItem => node(
  id, title, summary, description,
  [
    "模块职责：" + summary,
    "架构原则：" + description
  ],
  { color, tags, children: capabilities }
);

export const knowledgeTree: KnowledgeItem = node(
  "agent-root",
  "Agent 系统",
  "由感知、推理、记忆、知识、工具和运行治理等模块组成的目标驱动系统。",
  "Agent 不是单一的大模型调用，而是一套围绕目标持续运行的软件系统。它接收输入、理解环境、组织上下文、进行推理规划、调用工具、读写记忆，并通过评估和反馈持续修正行为。知识图谱按照 Agent 的功能模块组织知识，每个模块继续拆分为内部能力与可落地的技术实现。",
  [
    "二级节点代表 Agent 的功能模块，回答系统由什么组成。",
    "三级节点代表模块内部能力，回答每个模块需要完成什么工作。",
    "四级节点代表具体技术实现，回答工程上可以用什么方法和组件落地。"
  ],
  {
    tags: ["Agent Architecture", "Modules", "Capabilities", "Implementations"],
    children: [
      moduleNode(
        "perception",
        "感知与输入 Perception",
        "接收用户请求和环境信号，将多模态输入转化为可处理的结构化信息。",
        "感知模块负责把外部世界转换为 Agent 可理解的状态。它覆盖文本、多模态内容、用户意图以及浏览器、业务系统和实时事件等环境观察。",
        "#4E83E6",
        ["Input", "Intent", "Observation"],
        [
          capability(
            "input-normalization",
            "输入解析与标准化",
            "将文本、文件和多模态载荷转换为统一输入结构。",
            "统一消息角色、渠道、附件、时间戳和模态信息，避免后续模块直接处理来源各异的原始载荷。",
            [
              { id: "message-parser", title: "Message Parser", summary: "解析消息角色、渠道、正文与附件。", description: "定义统一的 Message / ContentPart 数据结构，解析 user、assistant、tool 等角色以及文本、文件和引用片段。", tags: ["Message schema", "Parser"] },
              { id: "multimodal-adapter", title: "Multimodal Adapter", summary: "接入图像、音频、视频和文档输入。", description: "按模型能力将图像转为视觉输入，将音频转为转写或音频 Token，将视频抽帧，并将文档交给解析流水线。", tags: ["Vision", "Audio", "Video"] },
              { id: "input-schema-validation", title: "Schema Validation", summary: "用类型与 Schema 校验输入结构。", description: "使用 Zod、Pydantic 或 JSON Schema 校验字段、枚举、文件大小和必填项，在进入 Agent 循环前拒绝非法输入。", tags: ["Zod", "Pydantic", "JSON Schema"] }
            ],
            ["Parsing", "Normalization"]
          ),
          capability(
            "intent-understanding",
            "意图理解与路由",
            "识别用户目标、实体和任务类型，决定后续处理路径。",
            "将自然语言请求转成可路由的意图与槽位。简单场景可以使用规则或分类器，开放式请求可使用 LLM 结构化抽取。",
            [
              { id: "intent-classifier", title: "Intent Classifier", summary: "识别任务类别与用户意图。", description: "通过规则、传统分类模型或 LLM 分类，将输入映射到稳定的意图标签，并为低置信度结果设置澄清路径。", tags: ["Classification", "Routing"] },
              { id: "entity-slot-extraction", title: "Entity / Slot Extraction", summary: "抽取人物、时间、地点和任务参数。", description: "使用 NER、槽位填充或结构化 LLM 抽取实体与参数，并保留原文位置、置信度和规范化结果。", tags: ["NER", "Slot Filling", "Extraction"] },
              { id: "semantic-router", title: "Semantic Router", summary: "按语义将请求分配给 Agent 或工作流。", description: "使用 Embedding 相似度、轻量分类器或 LLM Router 选择目标模块，并设置阈值、默认路由和人工澄清策略。", tags: ["Embedding", "LLM Router"] }
            ],
            ["Intent", "Entity", "Routing"]
          ),
          capability(
            "environment-observation",
            "环境观察",
            "持续读取 Agent 所处环境的状态与变化。",
            "Agent 的决策必须基于当前环境，而不是过期的假设。观察层将网页、应用状态和外部事件整理成有时间戳的状态快照。",
            [
              { id: "browser-dom-snapshot", title: "DOM / Accessibility Snapshot", summary: "读取网页 DOM 和无障碍树。", description: "通过 Playwright、浏览器调试协议或计算机使用环境获取页面结构、可访问名称、可交互元素和当前 URL。", tags: ["Playwright", "DOM", "Accessibility"] },
              { id: "event-webhook", title: "Event / Webhook Listener", summary: "通过事件推送感知外部系统变化。", description: "接收 Webhook、消息队列事件和业务通知，为事件增加来源、签名验证、去重键和发生时间。", tags: ["Webhook", "Event-driven"] },
              { id: "polling-observer", title: "Polling Observer", summary: "定时轮询 API 或环境状态。", description: "使用定时任务读取外部 API、设备或业务系统状态，配置轮询间隔、退避、变化检测和速率限制。", tags: ["Polling", "Scheduler"] }
            ],
            ["Environment", "Events", "Browser"]
          ),
          capability(
            "multimodal-perception",
            "多模态感知 Multimodal Perception",
            "解析图像、音频、视频、文档和空间数据中的内容与结构。",
            "多模态输入不是简单地把文件附加到 Prompt。系统需要针对不同模态执行解码、分段、特征提取、时间对齐和语义理解，并保留原始媒体与派生文本之间的引用关系。",
            [
              { id: "vision-encoder-vlm", title: "Vision Encoder / Vision-Language Model", summary: "从图像中提取视觉特征并理解图文关系。", description: "使用 ViT、CLIP 类视觉编码器或多模态大模型解析场景、对象、图表和屏幕截图；根据任务选择高分辨率切片、区域裁剪和视觉定位策略。", tags: ["Vision", "ViT", "VLM"] },
              { id: "ocr-document-layout", title: "OCR / Document Layout Understanding", summary: "识别文字、表格、阅读顺序和页面布局。", description: "结合 OCR、版面检测、表格结构识别和阅读顺序恢复，把 PDF、扫描件和图片转换为带页码、坐标和区块类型的结构化内容。", tags: ["OCR", "Layout", "Table Extraction"] },
              { id: "speech-recognition-asr", title: "Automatic Speech Recognition · ASR", summary: "将语音转成带时间戳的文本。", description: "使用 Whisper、云端 Speech API 或流式 ASR 模型进行语音转写；保留词级或片段级时间戳、语言识别结果和转写置信度。", tags: ["ASR", "Whisper", "Speech"] },
              { id: "voice-activity-detection", title: "Voice Activity Detection / Diarization", summary: "检测语音片段并区分不同说话人。", description: "使用 VAD 识别语音起止，结合 Speaker Diarization 标注说话人片段；适合会议记录、实时语音和多说话人场景。", tags: ["VAD", "Diarization", "Audio"] },
              { id: "video-frame-sampling", title: "Video Frame Sampling / Temporal Understanding", summary: "从视频抽帧并理解跨时间的动作和事件。", description: "按固定间隔、场景切换或运动变化抽取关键帧，结合音轨转写和时间戳建立跨模态时间线；避免对长视频无差别地处理全部帧。", tags: ["Video", "Frame Sampling", "Temporal Alignment"] },
              { id: "spatial-sensor-perception", title: "Spatial / Sensor Perception", summary: "解析坐标、姿态、运动和传感器读数。", description: "将位置、方向、速度、深度和设备传感器数据转换为统一坐标系与时间序列，供机器人、空间 Agent 和环境感知任务使用。", tags: ["Spatial", "Sensor Fusion", "Robotics"] }
            ],
            ["Multimodal", "Vision", "Audio", "Video", "Spatial"]
          ),
          capability(
            "perception-stream-processing",
            "实时输入与事件流 Stream Processing",
            "处理持续到达、需要低延迟响应的消息和环境事件。",
            "实时 Agent 需要处理输入流而非单次请求。应设计缓冲、去抖、批处理、顺序保证、背压和断线恢复，避免事件风暴或乱序消息污染当前任务状态。",
            [
              { id: "websocket-stream-ingestion", title: "WebSocket / Streaming Ingestion", summary: "通过双向流接收持续输入。", description: "使用 WebSocket、SSE 或 gRPC Stream 接收语音片段、状态更新和实时事件；处理连接心跳、重连、序列号和流结束语义。", tags: ["WebSocket", "SSE", "gRPC"] },
              { id: "message-broker-ingestion", title: "Message Broker · Kafka / NATS / RabbitMQ", summary: "通过消息代理解耦事件生产者和 Agent。", description: "使用 Kafka、NATS 或 RabbitMQ 缓冲事件、控制消费速率并支持重放；根据业务选择至少一次、至多一次或恰好一次语义。", tags: ["Kafka", "NATS", "RabbitMQ"] },
              { id: "event-debounce-batching", title: "Debounce / Buffer / Micro-batching", summary: "合并短时间内重复或密集到达的输入。", description: "使用时间窗口、数量阈值和最大等待时间聚合事件，减少模型调用；需要定义丢弃、合并和优先级策略，不能静默丢失关键事件。", tags: ["Debounce", "Buffer", "Batching"] },
              { id: "active-perception-loop", title: "Active Perception Loop", summary: "根据当前不确定性主动请求新的观察。", description: "Agent 根据当前任务和观察置信度决定是否重新截图、放大区域、滚动页面或调用传感器；形成 Observe → Decide → Observe 的闭环。", tags: ["Active Perception", "Observe Loop"] }
            ],
            ["Streaming", "Event Processing", "Backpressure", "Active Perception"]
          ),
          capability(
            "perception-quality",
            "感知质量与不确定性 Perception Quality",
            "评估输入识别结果的置信度、歧义和可用性。",
            "感知输出应携带置信度、时间、来源和不确定性。对低质量音频、模糊图像或冲突传感器读数，应触发补充观察或向用户澄清，而不是把猜测当作事实。",
            [
              { id: "confidence-calibration", title: "Confidence Calibration", summary: "校准 OCR、ASR 和分类模型的置信度。", description: "通过验证集、温度缩放或分桶评估校准模型分数，使置信度更接近实际正确概率；按阈值决定自动接受、复核或澄清。", tags: ["Confidence", "Calibration"] },
              { id: "sensor-fusion", title: "Sensor / Modality Fusion", summary: "融合多个输入源形成更可靠的环境判断。", description: "对齐不同模态的时间和空间坐标，结合规则、概率模型或多模态模型融合图像、音频、位置和工具观测。", tags: ["Sensor Fusion", "Multimodal Fusion"] },
              { id: "ambiguity-detection", title: "Ambiguity Detection / Clarification", summary: "发现缺失参数、歧义和相互冲突的输入。", description: "检测时间、地点、对象和任务约束是否存在多种解释；在影响执行结果的关键字段不明确时，生成最小化澄清问题。", tags: ["Ambiguity", "Clarification"] },
              { id: "perception-anomaly-detection", title: "Input Anomaly / Drift Detection", summary: "发现异常输入和感知分布变化。", description: "监控图像质量、音频噪声、传感器范围和识别置信度分布，识别损坏文件、异常峰值、设备漂移和输入分布变化。", tags: ["Anomaly Detection", "Drift"] }
            ],
            ["Confidence", "Fusion", "Ambiguity", "Anomaly"]
          ),
        ]
      ),
      moduleNode(
        "reasoning-planning",
        "推理与规划 Reasoning",
        "理解目标、拆解任务、选择行动，并根据结果修订计划。",
        "推理与规划模块负责决定 Agent 下一步应该做什么。它将复杂目标拆成可验证的子任务，选择推理模式，并在环境变化或执行失败时重新规划。",
        "#8A6BD8",
        ["Reasoning", "Planning", "Reflection"],
        [
          capability(
            "task-decomposition",
            "任务拆解 Task Decomposition",
            "将复杂目标拆分为有依赖关系的子任务。",
            "拆解结果应具备明确的完成条件、依赖和执行顺序，避免只生成无法验证的自然语言计划。",
            [
              { id: "llm-planner", title: "LLM Planner", summary: "让模型生成结构化任务计划。", description: "使用结构化输出生成子任务、前置条件、预期产物和完成标准，并对计划进行 Schema 与业务校验。", tags: ["LLM", "Structured Plan"] },
              { id: "dag-planner", title: "DAG Planner", summary: "用有向无环图表达任务依赖。", description: "将任务建模为 DAG，明确可并行节点、依赖边和关键路径，适合多步骤研究、数据处理和工程任务。", tags: ["DAG", "Parallel Tasks"] },
              { id: "hierarchical-task-network", title: "Hierarchical Task Network", summary: "通过任务层级和方法分解复杂目标。", description: "使用 HTN 将高层任务映射为可执行子任务和方法，适用于领域规则明确、流程可复用的任务。", tags: ["HTN", "Planning"] }
            ],
            ["Decomposition", "Dependencies"]
          ),
          capability(
            "reasoning-strategy",
            "推理与行动策略",
            "根据任务特征选择逐步推理、计划执行或工具辅助推理。",
            "不同任务不应强行使用同一种推理模式。策略层决定何时继续思考、何时调用工具、何时停止，以及何时需要补充信息。",
            [
              {
                id: "react",
                title: "ReAct · Reason + Act",
                summary: "交替生成推理、工具行动和环境观察，让行动反馈持续修正下一步决策。",
                description: "ReAct（Reasoning and Acting）将语言模型的推理轨迹与面向环境的动作交错组织。模型先根据当前目标和观察形成下一步判断，再发出 Search、Lookup、Click 等动作；环境返回 Observation 后，模型把新证据纳入上下文，继续推理、调整计划或结束任务。它不是先写完一份固定计划再执行，而是让计划在交互过程中动态形成和更新。",
                points: [
                  "典型循环：Thought / Reasoning → Action → Observation → 下一轮 Reasoning；实际实现可以稀疏生成显式推理，不要求每一步都输出完整思维文本。",
                  "Reasoning 用于分解目标、跟踪进度、解释观察和处理异常；Action 用于查询外部知识库或改变环境状态。",
                  "适合信息需要边执行边获取、环境会变化、需要根据工具反馈修正策略的任务，例如多跳问答、网页操作和交互式环境。",
                  "优势是反馈闭环和可诊断的行动轨迹；成本是多轮模型与工具调用，且需要限制循环、步数、权限和停止条件。",
                  "与 Plan-and-Solve 的区别：ReAct 强调推理与外部行动/观察交替；Plan-and-Solve 强调先拆解问题，再按计划完成子问题。"
                ],
                tags: ["Reasoning", "Act", "Observe", "Tool Feedback", "Closed Loop"],
                resources: [
                  { label: "ReAct · ICLR 2023 Paper", url: "https://arxiv.org/abs/2210.03629" },
                  { label: "Google Research · ReAct Overview", url: "https://research.google/blog/react-synergizing-reasoning-and-acting-in-language-models/" },
                  { label: "ReAct Project & Code", url: "https://react-lm.github.io/" }
                ]
              },
              {
                id: "plan-and-solve-prompting",
                title: "Plan-and-Solve Prompting · PS / PS+",
                summary: "先生成子任务计划，再按计划逐项求解；PS+ 增加变量提取和中间计算指引。",
                description: "Plan-and-Solve（PS）是 Wang 等人在 ACL 2023 提出的零样本 Chain-of-Thought 提示方法，目标是缓解 Zero-shot-CoT 容易遗漏中间步骤的问题。它分为两个阶段：Plan 阶段先理解问题并把整体任务拆成更小的子任务；Solve 阶段再依照计划逐项求解并给出答案。PS+ 在此基础上加入更具体的求解指引，例如提取相关变量及其数值、计算中间结果，并注意计算与常识一致性。它主要是一种 Prompting / Reasoning Pattern，不要求独立 Planner 服务、任务队列或外部 Executor。",
                points: [
                  "Plan：理解题意、识别目标和约束，将复杂问题分解为有顺序的子问题；计划应覆盖求解所需的关键步骤。",
                  "Solve：严格按照计划处理子问题，保留必要的中间结果，再汇总为最终答案。",
                  "PS+：增加变量与数值抽取、中间计算和常识检查等更明确的指令，重点改善计算错误和推理步骤质量。",
                  "主要价值：减少遗漏步骤，适合数学、常识和符号推理等多步问题；可作为零样本提示策略，不需要人工示例。",
                  "局限：计划和求解仍主要由同一个模型按提示完成；如果需要真实环境反馈、调用工具或执行后验证，应组合 ReAct、Tool Use 或 Plan-and-Execute。",
                  "与 Plan-and-Execute 的区别：PS / PS+ 是提示层面的两阶段问题求解方法；Plan-and-Execute 是系统/工作流层的 Planner 与 Executor 分工，可跨工具执行并在环境变化时重规划。"
                ],
                tags: ["Plan-and-Solve", "PS", "PS+", "Zero-shot CoT", "Prompting", "Task Decomposition"],
                resources: [
                  { label: "ACL 2023 · Plan-and-Solve Prompting Paper", url: "https://aclanthology.org/2023.acl-long.147/" },
                  { label: "arXiv · Plan-and-Solve Prompting", url: "https://arxiv.org/abs/2305.04091" },
                  { label: "Plan-and-Solve Prompting · Official Code", url: "https://github.com/AGI-Edgerunners/Plan-and-Solve-Prompting" }
                ]
              },
              {
                id: "plan-and-execute",
                title: "Plan-and-Execute",
                summary: "先制定显式计划，再由执行器逐步执行、验证并在必要时重规划。",
                description: "Plan-and-Execute 是系统编排模式：Planner 产出结构化步骤，Executor 调用工具或子 Agent 执行，Verifier 检查实际结果；执行状态、依赖和环境反馈会决定是否继续、调整步骤或局部重规划。与 Plan-and-Solve Prompting 不同，它强调规划器与执行器的职责分离，以及计划在真实执行过程中的状态管理。",
                points: [
                  "Planner 输出可追踪的任务列表、依赖、预期产物和完成条件。",
                  "Executor 按步骤调用工具、API 或子 Agent，并将执行结果回写工作流状态。",
                  "Verifier 根据外部状态判断步骤是否真正完成；失败或环境变化时触发重试、补偿或重规划。",
                  "适合长任务、工具密集型任务和需要跨步骤管理执行状态的场景；代价是编排复杂度和状态管理成本更高。"
                ],
                tags: ["Planner", "Executor", "Verifier", "Workflow", "Replanning"]
              },
              { id: "tool-assisted-reasoning", title: "Tool-assisted Reasoning", summary: "借助搜索、计算和代码执行解决问题。", description: "将事实查询、精确计算和可验证操作交给外部工具，模型负责选择工具、解释结果和整合证据。", tags: ["Search", "Code", "Calculator"] }
            ],
            ["ReAct", "Planning", "Tool Use"]
          ),
          capability(
            "reflection-verification",
            "反思与结果验证",
            "检查中间结果和最终产物，识别错误并触发修订。",
            "反思应建立在可观察的评价标准上。能用代码判断的内容优先使用确定性校验，开放式质量问题再使用模型评审。",
            [
              { id: "llm-critic", title: "LLM Critic", summary: "使用独立评审提示词检查结果质量。", description: "让评审器按事实、完整性、格式和任务约束逐项给出结构化问题，避免只输出笼统的好坏评价。", tags: ["Critic", "LLM-as-Judge"] },
              { id: "rule-validator", title: "Rule-based Validator", summary: "用确定性规则校验输出和业务约束。", description: "使用 Schema、正则、业务规则和权限检查验证字段、数值、引用和操作参数，失败时返回可定位的错误。", tags: ["Validation", "Rules"] },
              { id: "execution-verifier", title: "Execution Verifier", summary: "通过测试或环境状态确认行动是否成功。", description: "对工具调用结果执行后置检查，例如查询资源是否创建、文件是否存在、测试是否通过，而不是仅相信工具返回文本。", tags: ["Postcondition", "Testing"] }
            ],
            ["Reflection", "Verification", "Correction"]
          ),
          capability(
            "self-improvement",
            "自我改进 Self-improvement",
            "利用评估和历史反馈持续优化提示词、策略与工作流。",
            "自我改进需要明确目标函数、可复现的数据集和安全边界。优化对象可以是 Prompt、工具选择策略或工作流配置，不应允许 Agent 未经验证地修改生产权限和核心代码。",
            [
              { id: "prompt-optimizer", title: "Prompt Optimizer", summary: "根据评测结果自动优化提示词。", description: "使用 DSPy 等优化方法，在固定训练与验证样本上搜索指令和示例，比较优化前后的任务指标并保留版本。", tags: ["DSPy", "Prompt Optimization"], resources: [{ label: "DSPy Documentation", url: "https://dspy.ai/" }] },
              { id: "feedback-dataset", title: "Feedback Dataset", summary: "将用户反馈和失败轨迹沉淀为改进样本。", description: "采集人工纠错、任务失败和用户评分，进行脱敏、标注和去重，形成可回归的数据集。", tags: ["Feedback", "Dataset", "Evals"] },
              { id: "optimization-loop", title: "Optimization Loop", summary: "执行候选生成、评估、选择和版本回滚。", description: "建立 Generate → Evaluate → Select → Deploy 的受控循环，要求候选版本通过离线评测、灰度和安全门禁后才能生效。", tags: ["Optimization", "Regression", "Guardrails"] }
            ],
            ["Learning Loop", "Optimization", "Feedback"]
          ),
          capability(
            "reasoning-search",
            "搜索式推理 Search-based Reasoning",
            "通过生成、扩展和评估多个候选思路寻找高质量解。",
            "当单次线性推理不可靠时，可以把推理过程表示为候选状态或思路空间，执行分支扩展、评分、剪枝和回溯。搜索策略需要设置深度、宽度、成本和终止条件。",
            [
              { id: "tree-of-thoughts", title: "Tree of Thoughts · ToT", summary: "并行探索多个中间思路并进行评估和回溯。", description: "将推理拆成中间状态，生成多个候选分支，使用评估器选择扩展方向；适合需要搜索而非单一路径生成的规划任务。", tags: ["ToT", "Search", "Backtracking"] },
              { id: "graph-of-thoughts", title: "Graph of Thoughts · GoT", summary: "允许思路合并、重组和形成非树状依赖。", description: "将推理单元表示为图节点，允许多个分支合并、循环迭代和信息聚合；适合多源综合、复杂分析和结构化问题求解。", tags: ["GoT", "Graph Reasoning"] },
              { id: "self-consistency", title: "Self-consistency / Best-of-N", summary: "生成多条候选推理并选择一致或得分最高的结果。", description: "对同一问题采样多条独立候选，使用多数投票、规则验证或模型评分聚合；成本更高，且一致性不等于事实正确。", tags: ["Self-consistency", "Sampling", "Best-of-N"] },
              { id: "monte-carlo-tree-search", title: "Monte Carlo Tree Search · MCTS", summary: "通过选择、扩展、模拟和回传搜索行动空间。", description: "使用 UCT 等策略平衡探索与利用，结合价值模型或环境模拟器评估候选行动；适合具有明确状态、动作和回报的规划问题。", tags: ["MCTS", "UCT", "Planning"] },
              { id: "beam-best-first-search", title: "Beam Search / Best-first Search", summary: "按启发式评分保留最有希望的候选状态。", description: "Beam Search 限制每层保留的候选宽度；Best-first 根据启发式分数选择下一状态。适合有可计算评价函数和明确搜索空间的任务。", tags: ["Beam Search", "Best-first", "Heuristic"] },
              { id: "verifier-guided-search", title: "Verifier-guided Search", summary: "用独立验证器筛除无效推理分支。", description: "为候选步骤配置代码测试、约束检查、定理证明器或独立模型验证器，将验证结果反馈给搜索过程；验证器质量决定整体可靠性。", tags: ["Verifier", "Search", "Formal Check"] }
            ],
            ["ToT", "GoT", "Self-consistency", "MCTS", "Search"]
          ),
          capability(
            "symbolic-constraint-planning",
            "符号推理与约束规划 Symbolic & Constraint Planning",
            "把目标、前置条件和资源约束转化为可计算的规划问题。",
            "对于规则明确、约束严格或高风险的任务，纯自然语言规划可能不够可靠。可以结合符号状态、逻辑规则、约束求解器和模型生成计划，再用确定性求解器检查可行性。",
            [
              { id: "pddl-strips-planning", title: "PDDL / STRIPS Planning", summary: "用动作前置条件和效果描述可执行计划。", description: "定义初始状态、目标条件、动作前置条件和状态效果，使用经典规划器搜索满足目标的动作序列。", tags: ["PDDL", "STRIPS", "Classical Planning"] },
              { id: "sat-smt-solving", title: "SAT / SMT Solver", summary: "将逻辑和算术约束编码后交给求解器。", description: "使用 SAT、SMT 或 Z3 检查约束是否可满足、生成变量赋值或证明冲突；适合配置验证、排程和形式化约束问题。", tags: ["SAT", "SMT", "Z3"] },
              { id: "constraint-programming", title: "Constraint Programming · CP-SAT", summary: "求解资源、时间和组合约束问题。", description: "使用 OR-Tools CP-SAT 等求解器处理排班、资源分配、时间窗口和组合优化，并将解映射回 Agent 可执行步骤。", tags: ["CP-SAT", "OR-Tools", "Optimization"] },
              { id: "rule-engine-reasoning", title: "Rule Engine / Production Rules", summary: "使用确定性规则推导状态和可行动作。", description: "将业务规则表达为 IF-THEN 规则、决策表或规则图；适合监管约束、资格判断和稳定业务流程，需管理规则优先级与冲突。", tags: ["Rule Engine", "Decision Table"] }
            ],
            ["PDDL", "SAT / SMT", "CP-SAT", "Rules", "Constraints"]
          ),
          capability(
            "decision-under-uncertainty",
            "不确定性决策 Decision under Uncertainty",
            "在信息不完整、行动有风险时选择期望收益更高的下一步。",
            "Agent 经常无法确定环境状态、工具成功概率或行动后果。决策层应显式表达信念、效用、风险和信息价值，并在必要时选择先观察、先验证或向用户询问。",
            [
              { id: "bayesian-belief-update", title: "Bayesian Belief Update", summary: "根据新证据更新对环境状态的概率判断。", description: "维护候选假设的先验概率，使用观测似然更新后验；保留证据来源和模型假设，避免把概率判断误写成确定事实。", tags: ["Bayesian", "Belief State"] },
              { id: "pomdp-planning", title: "POMDP / Belief-state Planning", summary: "在部分可观测环境中基于信念状态规划。", description: "将真实状态不可见的问题建模为 POMDP，维护 belief state，并考虑动作、观测和奖励；适合机器人、交互式环境和长期决策。", tags: ["POMDP", "Belief State", "Robotics"] },
              { id: "utility-risk-sensitive-policy", title: "Utility / Risk-sensitive Decision Policy", summary: "根据收益、成本和风险选择行动。", description: "定义效用函数、风险阈值和失败代价；对不可逆操作使用更保守的策略，并将安全约束作为硬约束而不是普通评分项。", tags: ["Utility", "Risk", "Decision Theory"] },
              { id: "value-of-information", title: "Value of Information · VOI", summary: "判断额外搜索、观察或提问是否值得成本。", description: "比较获取新信息前后的期望决策价值与信息获取成本，决定是否再搜索一次、读取文件、调用工具或向用户澄清。", tags: ["VOI", "Information Gain", "Clarification"] }
            ],
            ["Bayesian", "POMDP", "Utility", "Risk", "VOI"]
          ),
        ]
      ),
      moduleNode(
        "memory",
        "记忆 Memory",
        "提取、存储、检索、更新和遗忘 Agent 运行过程中有价值的信息。",
        "Memory 是跨轮次状态与经验管理子系统，不限定某种数据库或单一产品实现。通用链路覆盖来源采集、触发调度、提取与表示、存储、检索与上下文注入、整合更新、生命周期、使用反馈和安全治理。不同 Agent 可以选择不同组合；产品案例应映射到这些通用能力，而不是替代通用技术分类。它与 RAG 知识库不同：Memory 更关注用户、会话、任务经历和动态状态。",
        "#D66E91",
        ["Memory", "Episodic", "Semantic", "Lifecycle"],
        [
          capability(
            "memory-capture",
            "记忆来源与采集 Memory Capture & Ingestion",
            "从会话、任务轨迹、工具结果和外部事件中收集可形成记忆的原始证据。",
            "记忆系统首先要定义可采集的数据源和采集边界。不同 Agent 可能读取完整对话、压缩后的任务轨迹、工具调用事件、用户明确反馈或外部系统状态；采集时应保留时间、来源、会话、项目和权限元数据，并过滤无关或不可信内容。",
            [
              { id: "conversation-transcript-capture", title: "Conversation Transcript / Message Log", summary: "从用户与 Agent 的消息历史采集对话证据。", description: "将 user、assistant、tool 等消息按轮次保存，保留时间戳、消息角色、附件引用和工具结果；可使用数据库记录、JSONL 或平台会话日志作为来源。", tags: ["Transcript", "Message Log"] },
              { id: "agent-rollout-jsonl", title: "Agent Rollout / Execution Trace · JSONL", summary: "把任务过程、工具调用和结果作为可回放的事件轨迹。", description: "将会话元数据、模型响应、工具调用、工具结果和 Agent 间消息写成逐行 JSON 事件；适合按时间扫描、筛选证据和按任务重建上下文。", tags: ["Rollout", "JSONL", "Execution Trace"] },
              { id: "tool-event-capture", title: "Tool Result / Event Capture", summary: "采集工具结果、业务事件和环境状态变化。", description: "通过工具执行回调、Webhook、消息队列或事件总线记录外部动作与结果；保留调用参数摘要、返回状态、发生时间和来源标识，避免只记住模型的口头描述。", tags: ["Tool Events", "Webhook", "Event Bus"] },
              { id: "external-memory-source-adapter", title: "External Source Adapter", summary: "从 Issue、文档、代码仓库和业务系统补充外部事实。", description: "使用 API、MCP Connector 或文件适配器接入外部来源；记录原始 URL、资源 ID、权限范围和更新时间，并区分外部事实与模型推断。", tags: ["API", "MCP", "Connectors"] },
              {
                id: "codex-rollout-evidence-reader",
                title: "Codex · Rollout JSONL Reader",
                summary: "反向扫描历史 Rollout，筛选脱敏证据并按原始时间顺序恢复。",
                description: "Codex v2 使用 ReverseJsonlScanner 从 rollout JSONL 读取历史响应与 Agent 间通信，限制单条记录和总输入字节数，跳过无关记录并对响应内容做脱敏；先从较新的证据中按层级选择，再恢复源时间顺序交给提取 Prompt。",
                points: [
                  "读取器校验首行 SessionMeta，并限制最大记录大小；不把完整 Rollout 当作可无限输入的原始文本。",
                  "选择人类消息、最终响应、其他 Agent 消息、评论、上下文和工具结果等不同证据层级。",
                  "图像等媒体内容会被替换为占位信息；较旧或超预算的记录可能被省略，因此提取输入不等于完整可恢复 Transcript。",
                  "保留 rollout_path、cwd、git_branch 等任务上下文提示，但要求模型根据具体任务证据判断归属。"
                ],
                tags: ["Codex", "Reverse JSONL Scanner", "Evidence Filtering"],
                resources: [
                  { label: "Codex Rollout Input 实现", url: "https://github.com/openai/codex/blob/main/codex-rs/memories/write/src/rollout_input.rs" }
                ]
              }
            ],
            ["Capture", "Transcript", "Rollout", "Events", "Provenance"]
          ),
          capability(
            "memory-trigger-scheduling",
            "写入触发与调度 Memory Trigger & Scheduling",
            "决定何时启动记忆提取，以及如何安全地调度后台记忆任务。",
            "记忆写入可以发生在每轮结束、会话结束、用户显式请求、空闲窗口或定时后台任务。触发策略会影响延迟、成本和记忆完整性；后台执行还需要候选筛选、任务领取、租约、并发限制、重试和幂等控制。",
            [
              { id: "turn-end-memory-trigger", title: "Turn / Session-end Trigger", summary: "在一轮对话或会话结束时触发记忆写入。", description: "由消息完成事件、会话关闭回调或显式工具调用启动提取；实现简单且延迟低，但需要避免把短暂对话和未完成任务过早固化。", tags: ["Event Trigger", "Session End"] },
              { id: "idle-time-memory-scheduler", title: "Idle-time Background Scheduler", summary: "等待任务进入空闲窗口后再异步提取记忆。", description: "使用启动钩子、Cron 或后台调度器筛选已静默一段时间的会话，避开仍在执行的任务；适合将记忆生成从用户请求路径中解耦。", tags: ["Background Job", "Idle Window", "Scheduler"] },
              { id: "memory-job-lease", title: "Job Claim / Lease / Idempotency", summary: "通过数据库任务记录和租约避免重复处理。", description: "将候选任务写入 jobs 表或可靠队列，使用 ownership token、lease expiry 和幂等键标识任务所有权；并发 Worker 只能领取未被占用的任务。", tags: ["Job Queue", "Lease", "Idempotency"] },
              { id: "memory-job-retry-concurrency", title: "Retry / Backoff / Concurrency Limit", summary: "控制失败重试、并行提取数量和资源消耗。", description: "为失败任务记录重试次数和下次可运行时间，采用指数退避或固定退避；通过并发上限、批次大小、Token 预算和模型额度门槛控制后台负载。", tags: ["Retry", "Backoff", "Concurrency", "Rate Limit"] },
              {
                id: "codex-memory-startup-scheduler",
                title: "Codex · Startup-triggered Memory Pipeline",
                summary: "根会话启动时异步执行 Phase 1 和 Phase 2，而不是每轮对话立即写入。",
                description: "Codex 在符合条件的根会话启动时触发后台流水线。Phase 1 从 State DB 领取符合来源、年龄和空闲条件的历史线程并并行提取；Phase 2 使用全局任务租约与文件锁串行整合。当前开源配置默认最小空闲时间为 6 小时、最大 Rollout 年龄为 10 天、每次启动最多处理 2 个候选线程；均可配置。",
                points: [
                  "跳过 ephemeral 会话、sub-agent 会话、当前会话，以及记忆功能未启用或 State DB 不可用的情况。",
                  "候选任务由 SQLite 状态层领取，使用租约防止重复工作；失败任务有退避重试。",
                  "Phase 1 的逐线程提取可并行运行；Phase 2 对共享 Memory Workspace 使用全局锁，避免多个整合 Agent 同时写入。",
                  "6 小时、10 天和每次 2 个是当前源码中的默认值，不是所有 Codex 版本或用户配置的固定常量。"
                ],
                tags: ["Codex", "Async Pipeline", "Phase 1", "Phase 2"],
                resources: [
                  { label: "Codex Memory Pipeline", url: "https://github.com/openai/codex/blob/main/codex-rs/memories/README.md" },
                  { label: "Codex Phase 1 Scheduler", url: "https://github.com/openai/codex/blob/main/codex-rs/memories/write/src/phase1.rs" },
                  { label: "Codex Memory Configuration", url: "https://github.com/openai/codex/blob/main/codex-rs/config/src/types.rs" }
                ]
              }
            ],
            ["Trigger", "Scheduling", "Async Jobs", "Lease", "Retry"]
          ),
          capability(
            "memory-extraction",
            "记忆提取 Memory Extraction",
            "从对话、任务轨迹和环境反馈中识别值得长期保留的信息。",
            "提取阶段要区分事实、偏好、事件、任务状态和推测，保留来源与置信度，并避免把临时内容或敏感信息无条件写入长期记忆。",
            [
              { id: "llm-memory-extraction", title: "LLM Structured Extraction", summary: "通过 LLM 将对话转成结构化记忆。", description: "定义 Memory Schema，让模型抽取内容、类型、实体、时间、来源和置信度，并通过 JSON Schema 校验。", tags: ["LLM", "JSON Schema", "Extraction"] },
              { id: "memory-ner", title: "Entity Extraction / NER", summary: "识别人名、组织、项目和实体关系。", description: "使用 NER、实体链接和规范化规则识别实体，将不同称呼映射到统一 ID，并保留原始文本证据。", tags: ["NER", "Entity Linking"] },
              { id: "event-extraction", title: "Event Extraction", summary: "抽取事件、参与者、时间和结果。", description: "将任务经历表示为事件记录，包含主体、动作、对象、时间、结果和上下文，支持后续情节记忆检索。", tags: ["Event", "Episodic Memory"] },
              { id: "preference-extraction", title: "Preference Extraction", summary: "识别稳定偏好、习惯和用户明确要求。", description: "区分明确表达与模型推断，记录偏好适用范围、置信度和最后确认时间，并提供用户纠正入口。", tags: ["User Preference", "Profile"] },
              { id: "rule-based-memory-extraction", title: "Rule-based / Heuristic Extraction", summary: "用确定性规则捕获明确、格式稳定的记忆事件。", description: "通过正则、事件类型、命令或显式用户标记提取固定字段；适合提取明确的记住/忘记请求、项目标识和结构化事件，可与 LLM 抽取互补。", tags: ["Rules", "Heuristics", "Explicit Memory"] },
              { id: "task-boundary-extraction", title: "Task Boundary & Outcome Extraction", summary: "识别任务起止、目标变化、关键决策和最终结果。", description: "从长会话中划分多个任务片段，保留每个任务的目标、范围、工作目录、分支、操作、结果和未完成事项，避免将整个会话压缩成一段无边界摘要。", tags: ["Task Boundary", "Outcome", "Chronology"] },
              { id: "memory-source-attribution", title: "Source Attribution / Evidence Extraction", summary: "为每条记忆保留来自用户、工具或模型的证据来源。", description: "记录原始消息、工具输出、文件路径、时间和会话 ID；区分用户明确陈述、工具验证事实、Agent 建议与未验证推断，供后续冲突解决和引用使用。", tags: ["Provenance", "Evidence", "Confidence"] },
              { id: "memory-secret-redaction", title: "Secret / PII Redaction", summary: "在记忆落库前识别并移除密钥和敏感字段。", description: "对模型生成的记忆和原始输入执行 Secret、PII 检测与脱敏；应在写入数据库、Markdown、日志和检索索引之前处理，并保留必要的脱敏审计信息。", tags: ["Secret Redaction", "PII", "DLP"] },
              {
                id: "claude-memory-extraction",
                title: "Claude Code · Auto Memory",
                summary: "在会话工作过程中识别值得跨会话保留的经验。",
                description: "Claude Code 将自动记忆分为 user、feedback、project、reference 四类。它优先保留用户偏好与纠正、不能从代码或 Git 历史推导的项目背景，以及外部信息的位置；会跳过代码库中已经可推导的事实和 CLAUDE.md 已写明的内容。官方没有公开固定的逐轮提取模型或确定性触发算法。",
                points: [
                  "user：用户角色、专业背景和工作偏好；feedback：用户纠正和确认有效的做法。",
                  "project：进行中的工作、决策和截止时间；reference：Issue Tracker、看板等外部信息位置。",
                  "不是每轮都写入，Claude 根据未来复用价值决定是否保存；本地交互会话默认开启 Auto Memory。",
                  "记忆是模型可参考的上下文，不是强制执行策略；敏感或高风险规则仍应由权限和 Hook 机制约束。"
                ],
                tags: ["Claude Code", "Auto Memory", "User Feedback"],
                resources: [
                  { label: "Claude Code Memory 官方文档", url: "https://code.claude.com/docs/en/memory" }
                ]
              },
              {
                id: "codex-memory-extraction",
                title: "Codex · Rollout Extraction",
                summary: "开启 Local Memories 后，在后台扫描符合条件的历史线程并逐线程提取经验。",
                description: "Codex Local Memories 默认关闭；启用后，Codex 在后台异步筛选历史 rollout，而不是在每轮对话结束时立即写入。候选线程需满足来源、年龄和空闲时间条件，并通过批次、领取状态及速率限制检查。模型读取过滤后的对话并生成结构化记忆；没有长期价值时允许返回空结果，生成字段会进行 Secret Redaction。外部工具或网页上下文是否允许参与提取，还可由配置控制。",
                points: [
                  "Phase 1 先从 State DB 领取候选线程，再按并发上限并行提取；领取租约用于避免重复处理，失败任务使用退避重试。",
                  "v1 输出 raw_memory、rollout_summary 和可选 rollout_slug；v2 只输出 rollout_summary 与 rollout_slug，改为 task-first 任务记录，重视用户原话、任务边界、操作证据和结果状态，而不是把原始记忆字段一并写入。",
                  "跳过活跃或短期线程；空闲阈值、最大历史天数、每次启动处理量和提取模型均可配置。当前源码默认空闲阈值为 6 小时、最大历史年龄为 10 天、每次启动最多领取 2 个候选线程。",
                  "提取结果先写入 State DB，尚不是最终注入上下文的精简记忆；功能开关与每个会话的生成许可分别控制是否参与未来记忆生成。"
                ],
                tags: ["Codex", "Phase 1", "Rollout", "Secret Redaction"],
                resources: [
                  { label: "Codex Memories 官方文档", url: "https://learn.chatgpt.com/docs/customization/memories" },
                  { label: "Codex Phase 1 实现", url: "https://github.com/openai/codex/blob/main/codex-rs/memories/write/src/phase1.rs" },
                  { label: "Codex v2 提取 Prompt", url: "https://github.com/openai/codex/blob/main/codex-rs/memories/write/templates/memories/stage_one_system_v2.md" }
                ]
              }
            ],
            ["Extraction", "NER", "Events", "Claude Code", "Codex"]
          ),
          capability(
            "memory-representation",
            "记忆表示与数据模型 Memory Representation",
            "定义记忆的类型、字段、层级和证据关系，使不同 Agent 的记忆可以被理解与转换。",
            "记忆提取结果不能只有一段无结构文本。通用记忆记录应描述内容、类型、主体、作用范围、来源、时间、置信度和状态；可按用户、项目、任务和事件组织，并同时保留精简摘要与可追溯证据。不同产品可以采用 JSON、Markdown、关系表或图结构表达同一语义。",
            [
              { id: "typed-memory-schema", title: "Typed Memory Schema", summary: "为记忆定义稳定字段和类型约束。", description: "设计 MemoryItem Schema，例如 id、content、memory_type、entities、scope、source、created_at、updated_at、confidence、status 和 expires_at；使用 JSON Schema、Pydantic 或类型系统验证。", tags: ["Memory Schema", "JSON Schema", "Typed Data"] },
              { id: "memory-taxonomy", title: "Episodic / Semantic / Procedural / Profile Memory", summary: "按记忆内容和未来用途划分记忆类型。", description: "Episodic 记录发生过的任务和事件；Semantic 记录稳定事实与关系；Procedural 记录做事方法和可复用流程；Profile 记录用户偏好与长期背景。一个产品可以只实现其中一部分。", tags: ["Episodic", "Semantic", "Procedural", "Profile"] },
              { id: "hierarchical-memory-representation", title: "Hierarchical / Multi-resolution Memory", summary: "将原始事件、任务摘要和长期摘要组织成不同粒度。", description: "保留原始对话或事件作为证据层，按任务生成中间摘要，再整合成跨任务的长期摘要；读取时先用粗粒度索引定位，再下钻到细粒度内容。", tags: ["Hierarchical Memory", "Summary", "Progressive Disclosure"] },
              { id: "memory-provenance-model", title: "Memory Provenance & Evidence Links", summary: "保存记忆来源、时间线和可验证的证据指针。", description: "为记忆关联 source_id、thread_id、rollout_id、文件路径、行号、时间戳和证据类型；记忆摘要应能回到原始来源，避免把摘要误当作当前事实。", tags: ["Provenance", "Evidence", "Citation"] },
              {
                id: "codex-task-first-memory-record",
                title: "Codex · Task-first Rollout Summary",
                summary: "以任务为单位记录目标、决策、操作、结果和未完成事项。",
                description: "Codex v2 的提取 Prompt 要求生成自包含 Markdown 任务记录，按时间顺序保留任务范围、用户纠正、工作目录与分支、关键发现、执行结果和未解决问题。它要求区分用户陈述与 Agent 推断，并避免把单次任务选择过度泛化成永久用户偏好。",
                points: [
                  "一个会话可能包含多个工作目录和分支，Rollout 级元数据只能作为提示，任务级归属需要根据证据判断。",
                  "保留被中断、被替代或未完成的任务，明确记录动作来源和最终状态。",
                  "仅在有证据支持时记录可复用偏好；普通 Agent 行为或单次任务决定不能自动变成用户画像。",
                  "v2 输出 rollout_summary 与 rollout_slug，不再要求 v1 的 raw_memory 字段。"
                ],
                tags: ["Codex", "Task-first", "Chronology", "Provenance"],
                resources: [
                  { label: "Codex v2 Extraction Prompt", url: "https://github.com/openai/codex/blob/main/codex-rs/memories/write/templates/memories/stage_one_system_v2.md" },
                  { label: "Codex v2 Extraction Input", url: "https://github.com/openai/codex/blob/main/codex-rs/memories/write/templates/memories/stage_one_input_v2.md" }
                ]
              }
            ],
            ["Schema", "Memory Types", "Hierarchy", "Provenance"]
          ),
          capability(
            "memory-storage",
            "记忆存储 Memory Storage",
            "根据记忆类型选择合适的数据结构和持久化介质。",
            "不要把所有记忆都塞进向量数据库。会话状态、结构化事实、语义片段和实体关系具有不同查询模式，应采用适合的数据模型并保留用户、租户和来源元数据。",
            [
              { id: "session-store", title: "Session Store · Redis", summary: "保存短期会话状态和高频上下文。", description: "使用 Redis Hash、JSON 或 TTL Key 保存会话状态、临时变量和短期缓存，设置过期策略并避免把唯一长期副本放在缓存中。", tags: ["Redis", "TTL", "Short-term"] },
              { id: "relational-memory-store", title: "Relational Store · PostgreSQL", summary: "保存结构化事实、偏好和任务记录。", description: "使用 PostgreSQL 表、JSONB、索引和事务保存有明确字段与一致性要求的记忆，适合按用户、时间和类型过滤。", tags: ["PostgreSQL", "SQL", "JSONB"] },
              { id: "vector-memory-store", title: "Vector Store · pgvector / Qdrant", summary: "保存语义片段和 Embedding 向量。", description: "为记忆内容生成 Embedding，存储向量与 metadata，支持相似度检索、用户隔离、过滤和索引更新。", tags: ["pgvector", "Qdrant", "Embedding"] },
              { id: "graph-memory-store", title: "Graph Store · Neo4j", summary: "保存实体及其关系和多跳连接。", description: "将人物、项目、事件建模为节点，将参与、拥有、依赖等关系建模为边，适合关系查询、实体消歧和关联推理。", tags: ["Neo4j", "Knowledge Graph"] },
              { id: "sqlite-memory-store", title: "Embedded Relational DB · SQLite", summary: "在本机进程或应用内保存结构化记忆和任务状态。", description: "使用 SQLite 保存结构化记录、索引、任务状态、租约和使用统计；无需独立数据库服务，适合桌面 Agent、CLI 和单机工作区。可将线程元数据与记忆提取状态放在不同数据库文件中。", tags: ["SQLite", "Embedded DB", "Local-first"] },
              { id: "document-memory-store", title: "Document Store · MongoDB", summary: "以文档形式保存字段可变的记忆记录。", description: "将一条记忆作为 BSON / JSON 文档保存，适合字段结构经常变化、需要按用户和元数据过滤的应用；需要另外设计版本、关系查询和一致性策略。", tags: ["MongoDB", "Document DB", "JSON"] },
              { id: "filesystem-memory-store", title: "Filesystem / Markdown Store", summary: "将记忆保存为可读、可编辑的本地文件。", description: "使用 Markdown、YAML 或纯文本文件组织索引、主题和任务摘要；优点是透明、可版本控制和易人工检查，缺点是并发写入、查询和结构化约束需要额外机制。", tags: ["Markdown", "Filesystem", "Human-readable"] },
              { id: "jsonl-event-store", title: "Append-only Event Log · JSONL", summary: "按时间追加保存消息和执行事件。", description: "每行保存一个独立 JSON 事件，适合日志采集、时间线回放和增量扫描；通常作为原始证据层，仍需摘要、索引或数据库支持高效检索。", tags: ["JSONL", "Append-only", "Event Log"] },
              { id: "object-memory-archive", title: "Object Storage · S3 / MinIO", summary: "归档大量历史轨迹、附件和低频证据文件。", description: "将大体积 Transcript、附件和归档记忆存入对象存储，通过对象键和元数据索引定位；适合低频历史证据，不宜直接替代需要事务更新的记忆状态库。", tags: ["S3", "MinIO", "Archive"] },
              {
                id: "claude-memory-storage",
                title: "Claude Code · Markdown Store",
                summary: "每个 Git 仓库使用本机独立的 Markdown 记忆目录。",
                description: "Claude Code 将 Auto Memory 写入 ~/.claude/projects/<project>/memory/。目录以 MEMORY.md 作为索引，并用独立 Markdown 主题文件保存具体记忆。项目标识来自 Git 仓库，因此同一仓库的 worktree 和子目录共享记忆目录；文件保存在本机，不会自动同步到其他机器或云环境。",
                points: [
                  "MEMORY.md 是索引文件；user_role.md、feedback_testing.md 等主题文件分别保存详细内容。",
                  "记忆文件与会话 Transcript 分离，Transcript 清理策略不会清理该记忆目录。",
                  "可以通过 /memory 浏览、编辑或打开记忆目录；Auto Memory 路径可通过 settings.json 配置。",
                  "CLAUDE.md 是人工维护的持久指令，不属于 Auto Memory 存储本身。"
                ],
                tags: ["Claude Code", "Markdown", "Repository Scope"],
                resources: [
                  { label: "Claude Code Memory 官方文档", url: "https://code.claude.com/docs/en/memory" }
                ]
              },
              {
                id: "codex-memory-storage",
                title: "Codex · Local Memory Store",
                summary: "使用本地 State DB 和版本化文件工作区保存记忆。",
                description: "Codex 使用本地 SQLite + 文件系统，而不是单一 Markdown 文件。State DB（state_*.sqlite）保存线程和会话元数据；独立的 memories_1.sqlite 或 memories_v2_1.sqlite 保存逐线程提取结果、jobs、使用次数和最近使用时间。Phase 2 再把选中的 rollout 摘要同步到 CODEX_HOME 下的版本化文件工作区。新 profile 的 v2 默认行为受 memories.version 与 memories.dual_write 配置影响；已有 v1 工作区可能继续使用 v1。",
                points: [
                  "v1 工作区包含 raw_memories.md、rollout_summaries/ 以及由整合 Agent 维护的 MEMORY.md、memory_summary.md 和可选 skills/。",
                  "v2 更强调 memory_summary.md 作为启动摘要、rollout_summaries/ 作为证据和任务细节，以及 extensions/ad_hoc/notes/ 作为用户明确提出的记忆修改入口；v2 的 State DB 仍独立保存提取任务与使用统计。",
                  "配置项 memories.version 和 memories.dual_write 控制版本选择与双写迁移；桌面端迁移期间可能同时读取旧目录并写入两个目录。memories.dual_write=false 时，新 profile 也可能保留 v1 默认行为。",
                  "这些文件是生成状态，适合检查和排障，不建议把手工编辑生成文件作为主要记忆控制方式。"
                ],
                tags: ["Codex", "State DB", "Filesystem", "v1 / v2"],
                resources: [
                  { label: "Codex Memories 官方文档", url: "https://learn.chatgpt.com/docs/customization/memories" },
                  { label: "Codex Memory Pipeline", url: "https://github.com/openai/codex/blob/main/codex-rs/memories/README.md" },
                  { label: "Codex Storage 实现", url: "https://github.com/openai/codex/blob/main/codex-rs/memories/write/src/storage.rs" }
                ]
              }
            ],
            ["Redis", "PostgreSQL", "SQLite", "MongoDB", "Vector DB", "Graph DB", "Markdown", "JSONL", "Object Storage", "Claude Code", "Codex"]
          ),
          capability(
            "memory-retrieval",
            "记忆检索 Memory Retrieval",
            "根据当前任务召回最相关、可信且仍然有效的记忆。",
            "记忆召回应结合语义相关性、时间、重要性、用户权限和记忆类型。检索结果应返回来源与更新时间，避免过期记忆被当作当前事实。",
            [
              { id: "semantic-memory-search", title: "Semantic Vector Search", summary: "通过向量相似度召回语义相关记忆。", description: "使用 Embedding 将查询与记忆映射到向量空间，采用 cosine、dot product 或 ANN 索引召回候选。", tags: ["Embedding", "ANN", "Vector Search"] },
              { id: "keyword-memory-search", title: "Keyword Search · BM25", summary: "按关键词和词项相关性检索记忆。", description: "使用 BM25、倒排索引或全文搜索召回专有名词、编号和精确术语，弥补向量检索对精确词项不敏感的问题。", tags: ["BM25", "Full-text Search"] },
              { id: "hybrid-memory-search", title: "Hybrid Retrieval", summary: "融合关键词召回与向量召回。", description: "结合稀疏检索和稠密检索，通过 RRF 或归一化分数融合候选，再进行权限和时间过滤。", tags: ["Hybrid Search", "RRF"] },
              { id: "memory-reranker", title: "Memory Reranker", summary: "对候选记忆进行相关性重排。", description: "使用 Cross-Encoder 或 LLM Reranker 对查询与候选记忆进行联合打分，并限制最终注入上下文的数量和 Token 预算。", tags: ["Reranker", "Cross-Encoder"] },
              { id: "structured-memory-filter", title: "Structured / Metadata Filtering", summary: "按用户、项目、类型、时间和权限过滤记忆。", description: "在全文或向量召回前后使用 SQL 条件、metadata filter 或规则过滤候选，避免跨用户、跨项目和跨权限范围召回不相关记录。", tags: ["Metadata Filter", "SQL", "Scope"] },
              { id: "recency-importance-retrieval", title: "Recency / Importance Ranking", summary: "综合时间、重要性和使用频率决定记忆优先级。", description: "将语义相关度与最近更新时间、最近使用时间、使用次数、置信度和有效状态组合打分；时间衰减不能替代事实有效性判断。", tags: ["Recency", "Importance", "Usage"] },
              { id: "graph-memory-traversal", title: "Graph Traversal Retrieval", summary: "沿实体关系和事件关联执行多跳记忆查询。", description: "从人物、项目或事件实体出发，按关系边扩展关联记忆；适合需要关系推理和跨事件连接的任务，但需要实体解析、关系更新和图查询成本控制。", tags: ["Graph Query", "Neo4j", "Multi-hop"] },
              {
                id: "claude-memory-retrieval",
                title: "Claude Code · Index + On-demand Read",
                summary: "启动时加载精简索引，任务需要时再读取主题记忆。",
                description: "每次会话启动时，Claude Code 只加载 MEMORY.md 的前 200 行或 25KB（先达到哪个限制就按哪个限制）。主题文件不会全部注入上下文；Claude 根据索引定位相关主题，再使用标准文件工具按需读取。公开文档描述的是文件索引和 JIT 读取机制，没有声明使用向量数据库或 Embedding 检索。",
                points: [
                  "MEMORY.md 负责启动时的低成本路由；详细事实放在 topic files，避免每轮占用大量上下文。",
                  "当索引接近容量限制时，Claude 会被提醒缩短索引、移动细节、合并或删除过时条目。",
                  "主会话 Auto Memory 默认不注入普通 subagent；fork 会继承父会话上下文，配置了独立 memory 的 subagent 可维护自己的记忆。",
                  "通过 /memory 可以检查实际加载的指令和记忆文件。"
                ],
                tags: ["Claude Code", "Progressive Disclosure", "JIT Retrieval"],
                resources: [
                  { label: "Claude Code Memory 官方文档", url: "https://code.claude.com/docs/en/memory" }
                ]
              },
              {
                id: "codex-memory-retrieval",
                title: "Codex · Summary + Memory Tools",
                summary: "先注入记忆摘要，再按需搜索、列出和读取具体记忆。",
                description: "Codex v2 将 memory_summary.md 作为历史上下文注入新会话，摘要提供项目范围和 rollout 文件的定位线索。需要更具体证据时，再通过 Memory Search、List、Read 工具读取本地记忆或 rollout summary。Search 是对文件内容执行文本匹配，支持多查询词、同一行或行窗口匹配、上下文行和分页；不是 Embedding 向量语义检索。",
                points: [
                  "read_path_v2 指引 Agent 先使用注入的 MEMORY_SUMMARY；只有当历史证据、措辞、时间线或不确定性会影响当前回答时，才打开对应 rollout summary。",
                  "Memory Search 支持 Any、AllOnSameLine、AllWithinLines 等匹配模式、大小写控制、上下文行和分页；List 用于枚举目录，Read 支持按路径、行偏移和 Token 上限读取文件片段。",
                  "检索范围被限制在 memories root 内，并拒绝路径穿越和符号链接，避免越权读取本地文件。",
                  "通过 /memories 可以按线程控制是否读取现有记忆，以及当前线程是否可作为未来记忆生成的输入。"
                ],
                tags: ["Codex", "Memory Search", "List / Read", "Progressive Disclosure"],
                resources: [
                  { label: "Codex Memories 官方文档", url: "https://learn.chatgpt.com/docs/customization/memories" },
                  { label: "Codex v2 Read Path", url: "https://github.com/openai/codex/blob/main/codex-rs/ext/memories/templates/memories/read_path_v2.md" },
                  { label: "Codex Local Search 实现", url: "https://github.com/openai/codex/blob/main/codex-rs/ext/memories/src/local/search.rs" }
                ]
              }
            ],
            ["Vector Search", "BM25", "Hybrid", "Reranking", "Claude Code", "Codex"]
          ),
          capability(
            "memory-consolidation",
            "记忆更新与整合 Memory Consolidation",
            "合并重复信息，解决冲突，并将零散经历整理成稳定知识。",
            "记忆不是只增不减的日志。系统应周期性整理候选记忆，识别重复和矛盾，保留时间变化与来源证据，并避免将一次性事件错误固化为长期事实。",
            [
              { id: "memory-summarization", title: "Memory Summarization", summary: "将长对话和任务轨迹压缩为摘要。", description: "按会话或主题生成滚动摘要，保留目标、决策、关键事实、未完成事项和引用来源。", tags: ["Summarization", "Compression"] },
              { id: "memory-deduplication", title: "Deduplication", summary: "识别并合并重复记忆。", description: "使用规范化键、实体 ID、文本相似度和时间窗口识别重复记录，合并时保留原始来源和更新时间。", tags: ["Deduplication", "Canonicalization"] },
              { id: "memory-conflict-resolution", title: "Conflict Resolution", summary: "处理新旧记忆之间的矛盾。", description: "按来源可信度、时间、用户确认和适用范围解决冲突；无法判定时保留多版本或请求用户确认。", tags: ["Conflict Resolution", "Provenance"] },
              { id: "entity-resolution", title: "Entity Resolution", summary: "把不同名称映射到同一实体。", description: "结合别名表、规则、Embedding 和上下文判断实体是否相同，维护稳定 ID 与关系更新。", tags: ["Entity Linking", "Knowledge Graph"] },
              { id: "incremental-memory-consolidation", title: "Incremental Consolidation", summary: "只处理新增或发生变化的记忆输入。", description: "为每批输入维护 watermark、版本号或变更游标，按增量更新摘要和索引；避免每次全量扫描，也要保证失败重试不会丢失尚未整合的变更。", tags: ["Incremental", "Watermark", "Diff"] },
              { id: "git-diff-memory-workspace", title: "Git-backed Memory Workspace Diff", summary: "用文件版本基线检测记忆工作区的新增、修改和删除。", description: "为 Memory Workspace 建立本地 Git baseline，在同步 rollout summaries 后计算 diff，只在工作区有变化时启动整合；完成后重置基线，便于追踪增量变化。", tags: ["Git", "Diff", "Workspace"] },
              { id: "memory-consolidation-lock", title: "Global Lock / Transactional Consolidation", summary: "保证同一份长期记忆不会被多个整合任务同时改写。", description: "使用数据库全局任务租约、文件锁或事务控制整合所有权；写入完成后验证产物，再更新 watermark 或版本基线，避免并发覆盖和半成品摘要。", tags: ["Global Lock", "Lease", "Transaction"] },
              { id: "memory-version-migration", title: "Memory Versioning / Migration", summary: "在记忆结构升级时兼容旧版本并支持迁移。", description: "为文件布局、Schema 和 Prompt 版本建立显式版本号，使用双写、读旧写新、校验和回滚策略迁移历史记忆，避免 v1 与 v2 产物混用。", tags: ["Versioning", "Migration", "Dual Write"] },
              {
                id: "claude-memory-consolidation",
                title: "Claude Code · Index Curation",
                summary: "在会话中维护索引和主题文件，没有公开独立的全局整合阶段。",
                description: "Claude Code 的 Auto Memory 由 Claude 在工作过程中读写。它通过 MEMORY.md 维护主题索引，将详细内容移到独立文件，并在索引接近 200 行或 25KB 限制时收到整理提醒。官方文档没有描述一个独立的后台全局 Consolidation Agent 或定时全库合并任务。",
                points: [
                  "把 MEMORY.md 保持为简短导航索引，主题文件承载详细记忆。",
                  "索引接近上限时，优先移动细节、合并重复条目、删除过期信息。",
                  "用户可以通过 /memory 直接查看、编辑或删除 Markdown 记忆。",
                  "这是一种轻量、文件级、会话内维护模式，与 Codex 的双阶段后台整合不同。"
                ],
                tags: ["Claude Code", "Index Curation", "Topic Files"],
                resources: [
                  { label: "Claude Code Memory 官方文档", url: "https://code.claude.com/docs/en/memory" }
                ]
              },
              {
                id: "codex-memory-consolidation",
                title: "Codex · Global Consolidation",
                summary: "Phase 2 使用全局锁和独立 Agent 整理跨线程记忆。",
                description: "Codex 在逐线程 Phase 1 之后运行 Phase 2。它先获取全局工作区文件锁和数据库任务租约，再按使用情况和保留条件选择 Stage 1 记录，同步 rollout summaries 并计算 Git Workspace Diff；只有工作区发生变化时才启动受限的 Consolidation Agent。v2 主要更新 memory_summary.md，v1 还维护 MEMORY.md、memory_summary.md 和可选 skills。max_unused_days 同时参与 Stage 1 旧记录清理和 Phase 2 候选筛选，不是每条 Markdown 文件的简单 TTL。",
                points: [
                  "全局锁保证同一份 memory workspace 不会被多个整合任务同时修改；State DB watermark 记录已处理输入。",
                  "v1 将 raw_memories.md 和 rollout_summaries/ 同步到工作区，再由 Agent 更新 MEMORY.md、memory_summary.md 和可选 skills。",
                  "v2 更强调生成紧凑的 memory_summary.md：区分用户明确偏好与单次任务决策，按项目和日期组织历史指针，并限制摘要体积。",
                  "整合 Agent 在本地受限环境中运行，不获得网络访问，只允许本地写入；成功后校验产物并重置 Git 基线。旧的 Stage 1 记录、未被选中的 rollout summaries 和过期扩展资源按不同清理规则处理，不能把 max_unused_days 简化为所有记忆文件的统一 TTL。" 
                ],
                tags: ["Codex", "Phase 2", "Consolidation Agent", "Git Diff"],
                resources: [
                  { label: "Codex Memory Pipeline", url: "https://github.com/openai/codex/blob/main/codex-rs/memories/README.md" },
                  { label: "Codex Phase 2 实现", url: "https://github.com/openai/codex/blob/main/codex-rs/memories/write/src/phase2.rs" },
                  { label: "Codex v2 Consolidation Prompt", url: "https://github.com/openai/codex/blob/main/codex-rs/memories/write/templates/memories/consolidation_v2.md" }
                ]
              }
            ],
            ["Summarization", "Deduplication", "Conflict", "Claude Code", "Codex"]
          ),
          capability(
            "memory-lifecycle",
            "记忆生命周期 Memory Lifecycle",
            "控制记忆何时保留、衰减、过期和删除。",
            "记忆生命周期策略决定哪些信息值得长期保留。需要同时支持自动过期、重要性衰减、用户查看和删除，以及隐私和租户隔离要求。",
            [
              { id: "memory-ttl", title: "TTL / Expiration", summary: "为临时记忆设置过期时间。", description: "为会话状态、短期事实和临时授权设置 TTL，使用 Redis TTL、数据库清理任务或生命周期策略自动清除。", tags: ["TTL", "Expiration"] },
              { id: "memory-decay", title: "Importance Decay", summary: "根据时间和使用频率调整记忆权重。", description: "结合时间衰减、访问频率、重要性和用户确认更新检索分数，降低陈旧信息的优先级。", tags: ["Decay", "Importance", "Recency"] },
              { id: "memory-forgetting", title: "Forgetting Policy", summary: "按规则淘汰低价值或过期记忆。", description: "定义容量上限、淘汰优先级和保护规则，确保关键事实、审计记录和用户明确保留的信息不会被随意清除。", tags: ["Forgetting", "Retention"] },
              { id: "memory-user-controls", title: "User Correction & Deletion", summary: "允许用户查看、纠正和删除记忆。", description: "提供记忆来源、修改记录和删除接口，并同步清理缓存、向量索引和派生摘要，防止删除后又被重新召回。", tags: ["Privacy", "User Control", "Deletion"] },
              { id: "memory-retention-pruning", title: "Retention Window / Pruning", summary: "按年龄、使用情况和保留策略清理不再需要的记忆记录。", description: "区分候选筛选、数据库记录清理、文件归档和用户可见删除；同一个 max-age 或 inactivity 配置可能只影响某个阶段，必须明确其作用对象和实际删除行为。", tags: ["Retention", "Pruning", "Inactivity Window"] },
              { id: "memory-tombstone-propagation", title: "Tombstone / Deletion Propagation", summary: "将用户删除请求传播到所有副本和派生记忆。", description: "为删除请求建立 tombstone 或删除事件，传播到数据库、Markdown 摘要、向量索引、缓存、备份和派生摘要；避免旧副本重新导入已删除内容。", tags: ["Tombstone", "Deletion", "Consistency"] },
              { id: "memory-archive-compaction", title: "Archive / Compaction", summary: "将低频历史记忆归档，并压缩活跃记忆集合。", description: "把低频原始轨迹移入冷存储或压缩归档，保留可检索摘要和稳定引用；归档与删除不同，必须定义恢复和访问路径。", tags: ["Archive", "Compaction", "Cold Storage"] },
              {
                id: "claude-memory-lifecycle",
                title: "Claude Code · Persistent Local Memory",
                summary: "Auto Memory 不随会话 Transcript 清理自动过期，直到用户或 Claude 修改、删除。",
                description: "Claude Code 的 cleanupPeriodDays 只清理旧会话 Transcript，Auto Memory 目录被排除在清理范围之外。MEMORY.md 的 200 行或 25KB 限制是启动加载预算，不是 TTL；接近上限时 Claude 会整理索引、移动细节或清除过时条目。主题文件持续保留，直到用户或 Claude 修改、删除。",
                points: [
                  "本地交互会话默认开启 Auto Memory；可通过 /memory、autoMemoryEnabled 或 CLAUDE_CODE_DISABLE_AUTO_MEMORY 控制。",
                  "Transcript 清理不会删除 MEMORY.md 和主题文件；记忆目录中的文件会一直保留，除非被编辑或删除。",
                  "启动时只加载 MEMORY.md 前 200 行或 25KB；超限影响索引可见范围，并触发整理提示，不代表系统自动执行 TTL。",
                  "用户可以通过 /memory 浏览、编辑或删除 Markdown 文件；维护时应同时检查索引与被索引的主题文件。"
                ],
                tags: ["Claude Code", "Retention", "Manual Deletion", "No TTL"],
                resources: [
                  { label: "Claude Code Memory 官方文档", url: "https://code.claude.com/docs/en/memory" }
                ]
              },
              {
                id: "codex-memory-lifecycle",
                title: "Codex · Configurable Memory Lifecycle",
                summary: "通过全局开关、逐会话读写控制和后台筛选管理记忆生命周期。",
                description: "Codex Local Memories 默认关闭。启用后，后台任务只处理满足空闲时间、历史年龄、批次和速率限制的线程；/memories 可以分别控制当前会话是否读取已有记忆、是否贡献未来记忆。max_unused_days 只让长期未使用的记忆失去整合资格，并非逐条过期删除；用户可通过 Delete Codex memories 重置整台机器的本地记忆库。",
                points: [
                  "全局功能默认关闭；开启后仍可用 /memories 或 memories.use_memories、memories.generate_memories 分别控制读取和生成。",
                  "后台生成跳过活跃或短期线程；当前源码默认最少空闲 6 小时、候选线程最大年龄 10 天、每次启动最多领取 2 个候选线程。max_unused_days 默认 30 天，是 Stage 1 记录清理和 Phase 2 候选筛选的另一项策略。",
                  "min_rate_limit_remaining_percent 可阻止额度不足时启动生成；生成字段会进行 Secret Redaction。",
                  "max_unused_days 默认 30 天，既影响旧 Stage 1 输出的清理，也影响 Phase 2 整合候选资格；它不是所有 rollout Markdown 文件统一到期删除的 TTL。",
                  "可通过 Settings > Personalization 中的 Delete Codex memories 清空本机记忆库；/memories 提供逐会话读写控制。"
                ],
                tags: ["Codex", "Retention", "Background Jobs", "User Controls"],
                resources: [
                  { label: "Codex Memories 官方文档", url: "https://learn.chatgpt.com/docs/customization/memories" },
                  { label: "Codex Configuration Reference", url: "https://learn.chatgpt.com/docs/config-file/config-reference" }
                ]
              }
            ],
            ["TTL", "Forgetting", "Privacy", "Claude Code", "Codex"]
          ),
          capability(
            "memory-usage-feedback",
            "记忆使用反馈 Memory Usage & Feedback",
            "利用记忆的实际召回和使用结果，调整后续记忆的优先级与质量。",
            "记忆系统不能只记录写入次数，还应观察记忆是否被检索、是否被模型引用、是否帮助任务完成，以及用户是否纠正或否定了它。反馈数据可用于排序、整合、淘汰和质量评估，但不能仅凭访问次数推断事实正确。",
            [
              { id: "memory-usage-tracking", title: "Usage Count / Last-used Tracking", summary: "记录每条记忆被引用的次数和最近使用时间。", description: "在记忆被检索并实际用于回答或任务时更新 usage_count、last_usage 等字段；与单纯的搜索曝光次数区分，防止未被采用的候选也被算作有效记忆。", tags: ["Usage Count", "Last Usage", "Telemetry"] },
              { id: "memory-relevance-feedback", title: "Relevance / Outcome Feedback", summary: "根据记忆是否相关、是否帮助完成任务调整质量判断。", description: "结合用户反馈、任务成功率、后续纠正和模型引用记录评估记忆价值；将正向使用信号与错误、过时和误召回信号分开存储。", tags: ["Relevance", "Outcome", "Feedback Loop"] },
              { id: "explicit-memory-edit", title: "Explicit Remember / Forget / Correction", summary: "将用户明确提出的记忆修改转为可审查的更新请求。", description: "把用户的记住、忘记或纠正请求写入独立更新队列或 notes，而不是让模型随意覆盖生成文件；后续由受控整合流程应用并验证修改。", tags: ["User Control", "Ad Hoc Notes", "Correction"] },
              { id: "memory-quality-observability", title: "Memory Quality Metrics", summary: "监控提取、检索、整合的成功率、延迟和资源消耗。", description: "记录提取有无输出、任务失败与重试、检索命中、截断、Token 使用、存储大小和整合耗时；用指标定位记忆质量和系统可靠性问题。", tags: ["Metrics", "Tracing", "Quality"] },
              {
                id: "codex-memory-usage-feedback",
                title: "Codex · Citation-based Usage Feedback",
                summary: "当历史 Rollout 摘要被引用时，更新使用次数和最近使用时间。",
                description: "Codex 的 Memory Store 在历史 Stage 1 输出被引用时更新 usage_count 和 last_usage。Phase 2 按使用次数优先、最近使用时间其次选择整合输入，因此检索后的真实使用会反过来影响后续长期记忆的组织和保留。",
                points: [
                  "只对被引用的 Stage 1 输出记录使用情况，而不是简单把所有搜索结果都视为有效使用。",
                  "Phase 2 使用 usage_count 和 last_usage 排序候选，并结合 max_unused_days 等窗口筛选。",
                  "Memory Search / List / Read 工具也记录调用成功、作用范围和结果是否截断等指标。",
                  "使用频率是价值信号之一，不代表事实正确；仍需结合来源证据、时间和用户纠正。"
                ],
                tags: ["Codex", "Usage Tracking", "Citation", "Feedback Loop"],
                resources: [
                  { label: "Codex Memory Store Usage Tracking", url: "https://github.com/openai/codex/blob/main/codex-rs/state/src/runtime/memories.rs" },
                  { label: "Codex Memory Tool Metrics", url: "https://github.com/openai/codex/blob/main/codex-rs/ext/memories/src/tools/mod.rs" }
                ]
              }
            ],
            ["Usage Tracking", "Relevance Feedback", "User Correction", "Metrics"]
          ),
          capability(
            "memory-security-trust",
            "记忆安全与信任 Memory Security & Trust",
            "保护记忆数据的来源可信度、访问范围、敏感内容和执行边界。",
            "记忆会跨会话影响后续 Agent 行为，因此既是数据存储问题，也是信任边界问题。需要防止秘密泄露、跨项目或跨用户召回、路径越权、历史提示注入和后台整合任务越权；模型生成的记忆应被视为带来源的证据，而不是高于当前指令的权威规则。",
            [
              { id: "memory-secret-pii-protection", title: "Secret / PII Redaction", summary: "在采集、提取和持久化多个阶段保护敏感数据。", description: "对 API Key、Token、邮箱、电话和个人身份信息使用规则、NER 或 DLP 检测；在进入模型、日志和持久化存储前按策略脱敏，并测试派生摘要是否重新暴露敏感信息。", tags: ["Secrets", "PII", "DLP"] },
              { id: "memory-scope-isolation", title: "User / Tenant / Project Scope Isolation", summary: "限制记忆只能在所属用户、项目和权限范围内访问。", description: "为记忆记录绑定 user_id、tenant_id、project_id、repository_id 或 session scope；检索、读取、更新和删除时都在可信服务端执行权限过滤。", tags: ["Tenant Isolation", "RBAC", "Scope"] },
              { id: "memory-untrusted-evidence", title: "Memory as Untrusted Evidence", summary: "把历史消息和记忆内容当作证据数据，而不是可覆盖当前规则的指令。", description: "保留来源与信任等级；历史网页、工具输出、用户粘贴内容和旧 Agent 指令都可能包含提示注入。读取记忆时必须服从当前系统与项目指令，不执行记忆内容中嵌入的命令。", tags: ["Prompt Injection", "Trust Boundary", "Provenance"] },
              { id: "memory-path-confinement", title: "Path Confinement / Symlink Defense", summary: "限制记忆文件工具只能访问指定根目录内的普通文件。", description: "对相对路径规范化，拒绝路径穿越、符号链接和非文件对象；对 Search、List、Read 使用统一的 root scope，防止记忆工具变成任意本地文件读取入口。", tags: ["Path Traversal", "Symlink", "Filesystem Security"] },
              { id: "memory-agent-sandbox", title: "Sandboxed Consolidation Agent", summary: "为后台记忆整合 Agent 设置独立的工具、网络和文件权限。", description: "使用独立运行上下文，关闭递归记忆生成和协作委派，限制网络访问和写入目录；由可信运行时验证输出文件，而不是依赖 Prompt 自我约束。", tags: ["Sandbox", "No Network", "Least Privilege"] },
              {
                id: "codex-memory-security-controls",
                title: "Codex · Redaction, Scoped Tools & Sandboxed Consolidation",
                summary: "通过脱敏、路径约束和无网络本地整合保护记忆工作区。",
                description: "Codex 在提取结果解析时执行 Secret Redaction；Memory Search、List、Read 将路径限制在 memories root 并拒绝路径穿越和符号链接；Phase 2 Consolidation Agent 在受限配置中运行，不允许网络访问，只能写入本地记忆工作区。",
                points: [
                  "Rollout 输入也会筛选并脱敏，不能把历史工具输出中的任意文本当作指令执行。",
                  "本地 Search / List / Read 仅访问 memory root 下允许的普通文件，并限制结果数量、行数和 Token 数。",
                  "Consolidation Agent 关闭 MCP Servers、Apps Instructions、Collab 和 Memory 自身读写，避免递归与外部数据外传。",
                  "Agent 运行成功后还会校验必需摘要文件，并移除工作区中的符号链接。"
                ],
                tags: ["Codex", "Secret Redaction", "Path Safety", "Sandbox"],
                resources: [
                  { label: "Codex Phase 2 Sandbox", url: "https://github.com/openai/codex/blob/main/codex-rs/memories/write/src/phase2.rs" },
                  { label: "Codex Local Memory Path Guard", url: "https://github.com/openai/codex/blob/main/codex-rs/ext/memories/src/local/path.rs" },
                  { label: "Codex Memory Read Tool", url: "https://github.com/openai/codex/blob/main/codex-rs/ext/memories/src/local/read.rs" }
                ]
              }
            ],
            ["Privacy", "Trust Boundary", "Path Safety", "Sandbox"]
          ),
          capability(
            "memory-instruction-boundary",
            "指令与记忆边界 Instructions vs Memory",
            "区分需要稳定遵循的人工指令，与从历史工作中提取的辅助记忆。",
            "指令文件承载明确、可审查、可随仓库共享的规则；自动记忆承载偏好、纠正和历史经验。两者都可能进入模型上下文，但不等于权限系统或硬性执行约束。必须始终遵循的团队规则应写入指令文件；安全边界应由权限、Hook 或沙箱执行。",
            [
              {
                id: "claude-instruction-memory-boundary",
                title: "Claude Code · CLAUDE.md + Auto Memory",
                summary: "CLAUDE.md 保存人工规则，Auto Memory 保存 Claude 自动归纳的经验。",
                description: "CLAUDE.md 由用户或团队维护，用于编码规范、工作流和项目架构，可按用户、项目或组织范围加载。Auto Memory 由 Claude 写入，保存偏好、纠正、项目背景和外部信息索引。官方将两者定义为互补系统；它们作为上下文提供给模型，不是强制执行配置。Claude Code 也能在符合配置条件时读取 AGENTS.md。",
                points: [
                  "CLAUDE.md：人维护的持久指令，适合编码规范、测试命令、项目架构和团队约定；可通过层级与规则文件划分作用范围。",
                  "Auto Memory：Claude 自动维护的学习记录，适合用户偏好、反馈纠正、无法从代码推导的项目状态和外部参考位置。",
                  "两者都在会话开始时提供上下文，但职责不同；Auto Memory 的 MEMORY.md 只加载前 200 行或 25KB。",
                  "当前版本可按 Project instructions 设置读取 AGENTS.md；默认在工作目录及上级目录没有 CLAUDE.md 时读取 AGENTS.md。",
                  "如果需要无论模型如何判断都禁止某项操作，应使用 PreToolUse Hook 或权限控制，而不是依赖记忆文本。"
                ],
                tags: ["Claude Code", "CLAUDE.md", "Auto Memory", "Instructions"],
                resources: [
                  { label: "Claude Code Memory 官方文档", url: "https://code.claude.com/docs/en/memory" }
                ]
              },
              {
                id: "codex-instruction-memory-boundary",
                title: "Codex · AGENTS.md + Local Memories",
                summary: "AGENTS.md 负责项目规则，Local Memories 负责本机历史经验召回。",
                description: "Codex 在任务开始前读取 AGENTS.md 指令链，可从全局配置、仓库根目录和子目录逐层合并；项目文件可随仓库提交并供团队共享。Local Memories 则保存在 CODEX_HOME 下，是可选的本机辅助召回层。OpenAI 文档明确建议：必须始终适用的团队指导写入 AGENTS.md 或仓库文档，不要只依赖 Memories。",
                points: [
                  "AGENTS.md：承载项目构建、测试、代码风格和工作约定；全局与项目级文件按目录层级合并，子目录可追加或覆盖更具体的指导。",
                  "Local Memories：从历史任务中提取可复用背景和经验，默认关闭，存储在本机 CODEX_HOME，不随仓库自动共享。",
                  "/memories 可针对当前会话分别控制是否读取已有记忆、是否作为未来记忆生成输入；这不替代全局配置。",
                  "AGENTS.md 是持久指令，Memory 是辅助回忆，Skills 是可复用工作流，MCP 是外部系统连接，四者职责不同。",
                  "必须始终执行的规则应放入 AGENTS.md 或受控策略；不要把记忆当成唯一规则来源。"
                ],
                tags: ["Codex", "AGENTS.md", "Local Memories", "Instructions"],
                resources: [
                  { label: "Codex AGENTS.md 官方文档", url: "https://learn.chatgpt.com/docs/agent-configuration/agents-md" },
                  { label: "Codex Memories 官方文档", url: "https://learn.chatgpt.com/docs/customization/memories" }
                ]
              }
            ],
            ["Instructions", "CLAUDE.md", "AGENTS.md", "Auto Memory", "Local Memories"]
          ),
          capability(
            "memory-architecture-comparison",
            "产品架构对比 Architecture Comparison",
            "从触发、写入、存储、读取和治理五个维度比较真实产品的记忆架构。",
            "Claude Code 与 Codex 都采用本地文件和渐进式上下文加载，但记忆写入路径不同。Claude 偏向会话内持续维护仓库级 Markdown 记忆；Codex 偏向后台逐线程提取，再通过全局整合 Agent 形成摘要和证据库。该对比以公开文档与当前开源实现为依据。",
            [
              {
                id: "claude-codex-memory-architecture",
                title: "Claude Code vs Codex · Architecture Trade-offs",
                summary: "Claude 偏会话内持续维护；Codex 偏后台两阶段提取与全局整合。",
                description: "Claude 将 Auto Memory 作为会话中的持续读写能力：模型直接维护 MEMORY.md 索引和主题文件，按需读取细节。Codex 将 Local Memories 设计成异步流水线：Phase 1 从历史 rollout 提取候选记忆，Phase 2 集中整合为摘要、索引和可选扩展。两者的主要差别是写入触发与整合边界，而不是简单的 Markdown 与数据库之争。",
                points: [
                  "触发方式：Claude 在会话工作过程中决定何时记录或回忆；Codex 在功能开启后等待历史线程达到空闲条件，再由后台任务处理。",
                  "写入架构：Claude 直接读写 MEMORY.md 与主题文件，没有公开的独立全局整合阶段；Codex 使用逐线程 Phase 1 和全局 Phase 2。",
                  "存储范围：Claude 按 Git 仓库建立本机记忆目录，同一仓库的 worktree 共享；Codex 将记忆放在本机 CODEX_HOME 下，并以 rollout 记录项目和任务来源。",
                  "读取方式：Claude 启动时加载 MEMORY.md 前 200 行或 25KB，再按需读取主题文件；Codex 注入 memory_summary，并通过 Search、List、Read 深入查看 MEMORY.md 或 rollout summaries。",
                  "生命周期：Claude 记忆不会随 Transcript 清理自动过期，主要由用户或 Claude 编辑、删除；Codex 提供全局开关、逐会话读写控制、候选窗口和整库重置。",
                  "指令边界：Claude 的 CLAUDE.md 与 Auto Memory 分工；Codex 的 AGENTS.md 与 Local Memories 分工。两者都不应把辅助记忆当成硬性权限策略。",
                  "设计取舍：Claude 路径更直接、低延迟、易人工检查，但跨主题全局归并依赖模型持续维护；Codex 的后台整合和 rollout 证据链更系统，但配置、后台调度和额度门槛更复杂。"
                ],
                tags: ["Architecture Comparison", "Claude Code", "Codex", "Trade-offs"],
                resources: [
                  { label: "Claude Code Memory 官方文档", url: "https://code.claude.com/docs/en/memory" },
                  { label: "Codex Memories 官方文档", url: "https://learn.chatgpt.com/docs/customization/memories" },
                  { label: "Codex Memory Pipeline", url: "https://github.com/openai/codex/blob/main/codex-rs/memories/README.md" }
                ]
              }
            ],
            ["Architecture", "Claude Code", "Codex", "Trade-offs"]
          )
        ]
      ),
      moduleNode(
        "knowledge-rag",
        "知识检索 Knowledge / RAG",
        "将外部文档和领域知识转化为可检索、可引用的证据。",
        "知识模块主要处理外部、相对稳定或规模较大的资料库；与 Memory 的个人经历和会话状态区分。核心链路是数据接入、解析切分、索引、召回、重排和基于证据生成。",
        "#D99445",
        ["RAG", "Indexing", "Grounding"],
        [
          capability(
            "document-ingestion",
            "文档接入与解析 Ingestion",
            "接入多种来源的知识内容，并提取正文与元数据。",
            "文档解析质量决定后续检索上限。接入流程需要保留文件来源、权限、版本和更新时间，并处理扫描件、表格和复杂布局。",
            [
              { id: "document-loaders", title: "Document Loaders", summary: "接入网页、PDF、Office 和数据源。", description: "通过文件解析器、网页抓取器和连接器统一加载文档，记录 source_id、版本、权限和更新时间。", tags: ["PDF", "HTML", "Connectors"] },
              { id: "ocr-layout-parser", title: "OCR / Layout Parser", summary: "解析扫描件、图片和复杂版面。", description: "使用 OCR、版面检测和表格识别恢复标题层级、段落、表格单元格和阅读顺序。", tags: ["OCR", "Layout", "Tables"] },
              { id: "metadata-enrichment", title: "Metadata Enrichment", summary: "补充文档类型、主题、作者和权限元数据。", description: "通过规则或模型生成分类、实体、时间和访问标签，元数据应可追溯并能被权限过滤使用。", tags: ["Metadata", "Classification"] }
            ],
            ["Loaders", "Parsing", "Metadata"]
          ),
          capability(
            "chunking-indexing",
            "切分与索引 Chunking & Indexing",
            "将文档转换为适合召回的片段和索引结构。",
            "Chunk 策略需要在语义完整性、召回粒度和上下文成本之间平衡。索引构建还要考虑增量更新、版本替换和删除传播。",
            [
              { id: "recursive-chunking", title: "Recursive Character Splitter", summary: "按标题、段落和分隔符递归切分。", description: "先按大结构切分，再逐级使用段落和句子分隔符，配置 chunk_size 与 overlap，尽量保留自然语义边界。", tags: ["Chunking", "Overlap"] },
              { id: "semantic-chunking", title: "Semantic Chunking", summary: "根据语义变化决定片段边界。", description: "计算相邻句子的 Embedding 差异，在主题变化处切分，适合语义连续性比固定长度更重要的知识库。", tags: ["Semantic", "Embedding"] },
              { id: "embedding-model", title: "Embedding Model", summary: "将文本片段编码为向量。", description: "选择适合语料语言和领域的 Embedding 模型，统一查询与文档的向量空间，并管理模型版本和重建索引。", tags: ["Embedding", "Vectorization"] },
              { id: "vector-index", title: "Vector Index", summary: "建立向量近邻索引以支持快速召回。", description: "使用 HNSW、IVF 等 ANN 索引结构，并根据数据规模、过滤需求、召回率和延迟调整参数。", tags: ["HNSW", "IVF", "ANN"] }
            ],
            ["Chunking", "Embedding", "Vector Index"]
          ),
          capability(
            "knowledge-retrieval",
            "知识召回与重排 Retrieval",
            "从知识库中找出与当前问题最相关的证据片段。",
            "召回层应结合问题类型选择检索方式，并在候选集合上执行过滤和重排。检索效果要通过独立数据集评估，而不是只看生成答案是否流畅。",
            [
              { id: "dense-retrieval", title: "Dense Retrieval", summary: "使用向量相似度进行语义召回。", description: "将 Query 编码为向量，使用 ANN 在向量索引中查找语义相近的文档片段。", tags: ["Dense", "Vector Search"] },
              { id: "sparse-retrieval", title: "Sparse Retrieval · BM25", summary: "使用关键词倒排索引进行精确召回。", description: "使用 BM25 或全文索引处理专有名词、错误码、编号和精确术语查询。", tags: ["Sparse", "BM25"] },
              { id: "hybrid-rag", title: "Hybrid Retrieval", summary: "融合 Dense 与 Sparse 的召回结果。", description: "使用 Reciprocal Rank Fusion 或分数归一化融合两类候选，提升不同查询类型下的召回覆盖率。", tags: ["Hybrid", "RRF"] },
              { id: "cross-encoder-reranking", title: "Cross-Encoder Reranking", summary: "对 Query 与候选文档进行联合相关性打分。", description: "使用 Cross-Encoder 或专用 Reranker 重排初始候选，截取高相关证据并控制推理成本。", tags: ["Cross-Encoder", "Reranker"] },
              { id: "graph-retrieval", title: "Graph Retrieval", summary: "沿实体关系扩展多跳证据。", description: "通过实体链接和图查询检索关联实体、事件和关系，适合需要跨文档关系推理的问题。", tags: ["Graph RAG", "Neo4j"] }
            ],
            ["Dense", "Sparse", "Hybrid", "Reranking"]
          ),
          capability(
            "grounded-generation",
            "证据组织与生成 Grounding",
            "将检索证据组织为上下文，并生成可追溯的答案。",
            "生成阶段应区分证据与模型推断，对关键结论保留引用，并在证据不足时明确说明不确定性。",
            [
              { id: "citation-attribution", title: "Citation Attribution", summary: "为答案中的结论绑定来源片段。", description: "为每个 Chunk 保存文档 ID、页码、段落和 URL，生成时要求引用能够回链到具体来源。", tags: ["Citation", "Provenance"] },
              { id: "evidence-filter", title: "Evidence Filtering", summary: "过滤低相关、冲突或越权的检索结果。", description: "按相关性、来源可信度、时间和用户权限过滤候选，避免把无关或不可访问内容注入上下文。", tags: ["Relevance", "ACL", "Trust"] },
              { id: "grounded-answer-validator", title: "Grounded Answer Validator", summary: "检查回答是否得到证据支持。", description: "使用规则或评审模型检查引用覆盖、事实忠实度和无依据陈述，对证据不足的问题触发补检索或拒答。", tags: ["Faithfulness", "Evaluation"] }
            ],
            ["Grounding", "Citation", "Faithfulness"]
          ),
          capability(
            "query-transformation",
            "查询理解与改写 Query Understanding",
            "把用户问题转换成更适合知识检索的查询表达。",
            "用户问题可能含有指代、省略、多个子问题或与知识库术语不一致。查询处理应在保留原意的前提下生成检索查询，并避免把改写过程引入的新事实当成用户输入。",
            [
              { id: "query-rewriting", title: "Query Rewriting / Expansion", summary: "补全指代、术语和检索关键词。", description: "根据会话上下文和领域词典生成更明确的检索表达，可添加同义词、实体别名和关键限定词；保留原始 Query 供审计。", tags: ["Query Rewrite", "Expansion"] },
              { id: "multi-query-retrieval", title: "Multi-query Retrieval", summary: "从不同角度生成多个查询并合并召回结果。", description: "将一个问题改写为多个互补查询，分别检索后去重和融合；适合多术语、多视角和召回不足的场景。", tags: ["Multi-query", "Recall"] },
              { id: "query-decomposition", title: "Query Decomposition", summary: "把复杂问题拆成可独立检索的子问题。", description: "识别问题中的实体、时间、比较和因果子任务，分别检索证据后再聚合；需要保留子问题与最终结论的依赖关系。", tags: ["Decomposition", "Multi-hop RAG"] },
              { id: "hyde-retrieval", title: "HyDE · Hypothetical Document Embeddings", summary: "先生成假设性答案文本，再用其向量进行召回。", description: "让模型生成可能包含目标信息的假设文档并对其编码，以缓解 Query 与文档表达差异；必须将假设文本仅用于检索，不能作为证据引用。", tags: ["HyDE", "Embedding", "Query Expansion"] },
              { id: "self-query-retriever", title: "Self-query / Metadata-aware Retrieval", summary: "从自然语言问题中提取元数据过滤条件。", description: "识别用户、时间、文档类型、项目和权限等结构化约束，生成 metadata filter 与文本查询；执行前校验过滤字段和权限范围。", tags: ["Self-query", "Metadata Filter"] }
            ],
            ["Query Rewrite", "Multi-query", "Decomposition", "HyDE"]
          ),
          capability(
            "advanced-indexing",
            "高级索引与检索结构 Advanced Indexing",
            "根据语料规模、查询类型和延迟目标选择索引结构。",
            "Embedding 只是检索管线的一部分。实际系统还需要选择向量索引、稀疏倒排索引、多向量表示、父子片段和字段索引，并权衡召回率、内存、更新成本和查询延迟。",
            [
              { id: "hnsw-ann-index", title: "HNSW / ANN Index", summary: "通过近似最近邻图结构加速向量检索。", description: "使用 HNSW 等 ANN 索引在高维向量中快速查找近邻，调整 M、efConstruction 和 efSearch 等参数平衡召回率、内存和延迟。", tags: ["HNSW", "ANN", "Vector Index"] },
              { id: "ivf-pq-index", title: "IVF / Product Quantization", summary: "通过聚类和向量压缩降低大规模索引成本。", description: "使用 IVF 划分向量桶，并用 Product Quantization 压缩向量表示；适合规模较大且可接受近似误差的检索场景。", tags: ["IVF", "PQ", "Compression"] },
              { id: "colbert-late-interaction", title: "ColBERT / Late Interaction", summary: "保留 Token 级向量并进行细粒度匹配。", description: "对 Query 和文档分别编码多个 Token 向量，再用 MaxSim 等机制进行晚交互匹配；比单向量更细粒度，但存储和计算成本更高。", tags: ["ColBERT", "Late Interaction", "Multi-vector"] },
              { id: "parent-child-retrieval", title: "Parent-child / Hierarchical Retrieval", summary: "用小片段召回，再返回更完整的父级上下文。", description: "索引细粒度 child chunks 以提高召回精度，命中后返回 parent section 或相邻上下文；适合长文档和结构化手册。", tags: ["Parent-child", "Hierarchical Retrieval"] },
              { id: "sql-structured-retrieval", title: "Structured / SQL Retrieval", summary: "对表格和结构化业务数据执行精确查询。", description: "将自然语言转换为受限 SQL、GraphQL 或分析查询，经过 Schema 校验、权限过滤和只读策略后执行；不应把结构化查询全部替换成向量搜索。", tags: ["SQL", "Text-to-SQL", "Structured Data"] }
            ],
            ["HNSW", "IVF-PQ", "ColBERT", "Parent-child", "SQL"]
          ),
          capability(
            "knowledge-freshness-governance",
            "知识更新与权限治理 Freshness & Governance",
            "让索引与原始知识源保持同步，并遵守来源权限。",
            "知识库会持续变化。生产系统需要处理新增、修改、删除、版本、权限变更和重建任务；如果只做一次性导入，召回结果可能过期或泄露已撤销访问的数据。",
            [
              { id: "incremental-indexing-cdc", title: "Incremental Indexing / CDC", summary: "根据源数据变化增量更新索引。", description: "使用 Webhook、CDC、更新时间戳或内容哈希发现变更，只重建受影响文档和向量；通过重试队列保证失败任务最终可恢复。", tags: ["Incremental Indexing", "CDC", "Webhook"] },
              { id: "document-versioning-dedup", title: "Document Versioning / Deduplication", summary: "管理文档版本并避免重复索引。", description: "使用稳定文档 ID、内容哈希、版本号和有效时间管理更新；区分同一文档的新版本与内容相似但来源不同的文档。", tags: ["Versioning", "Hash", "Deduplication"] },
              { id: "acl-aware-retrieval", title: "ACL-aware Retrieval", summary: "检索阶段强制执行原始文档访问权限。", description: "同步源系统 ACL 和用户身份，在召回前或可信服务端重排前执行权限过滤；权限变更或撤销时同步清理缓存和索引可见性。", tags: ["ACL", "Authorization", "Tenant Isolation"] },
              { id: "index-rebuild-blue-green", title: "Index Rebuild / Blue-green Swap", summary: "在索引升级或模型更换时安全重建并切换。", description: "在新索引中离线重建和验证召回质量，完成后原子切换别名或版本指针；保留回滚能力，避免重建期间查询不可用。", tags: ["Reindex", "Blue-green", "Rollback"] },
              { id: "retrieval-cache-invalidation", title: "Retrieval Cache Invalidation", summary: "当文档或权限变化时使缓存失效。", description: "为缓存键绑定 Query、索引版本、权限范围和数据版本；源数据变更、删除或权限撤销时主动失效相关缓存。", tags: ["Cache Invalidation", "Freshness"] }
            ],
            ["Freshness", "CDC", "ACL", "Versioning", "Reindex"]
          ),
        ]
      ),
      moduleNode(
        "tools-actions",
        "工具与行动 Tools",
        "发现、选择和执行工具，让 Agent 能够安全地影响外部系统。",
        "工具模块是 Agent 与外部世界交互的执行层。模型可以提出工具调用意图，但参数校验、身份授权、实际执行、副作用控制和结果确认必须由运行时负责。",
        "#2DA58B",
        ["Function Calling", "MCP", "Execution"],
        [
          capability(
            "tool-definition",
            "工具定义与契约 Tool Definition",
            "把外部能力封装为模型可理解、程序可校验的工具接口。",
            "工具描述应明确用途、参数、返回值、副作用和失败语义。工具越清晰，模型越容易正确选择和组合。",
            [
              { id: "function-schema", title: "Function Calling Schema", summary: "用 JSON Schema 定义工具参数。", description: "声明工具名称、用途、必填参数、类型和枚举，使用严格 Schema 减少参数歧义。", tags: ["Function Calling", "JSON Schema"] },
              { id: "typed-tool-contract", title: "Pydantic / Zod Contract", summary: "用类型系统校验输入和输出。", description: "在服务端用 Pydantic 或 Zod 对工具参数、业务约束和返回结构进行运行时校验。", tags: ["Pydantic", "Zod", "Type Safety"] },
              { id: "openapi-tool-generation", title: "OpenAPI Tool Generation", summary: "从 API 描述生成工具定义。", description: "从 OpenAPI 文档读取 endpoint、参数和认证要求，生成工具包装层并补充面向模型的语义描述。", tags: ["OpenAPI", "API Schema"] },
              { id: "codex-memory-tool-namespace", title: "Codex · Memory Tools Namespace", summary: "将 Search、List、Read 和 Add Ad Hoc Note 暴露为有 Schema 的专用工具。", description: "Codex 的 Memory Extension 为模型提供专用工具命名空间，分别用于搜索记忆文件、列出目录、读取指定路径和提交用户明确要求的记忆修改；工具参数与返回值使用 Schema，并记录调用范围、成功状态和截断信息。", tags: ["Codex", "Tool Namespace", "Search / List / Read"], resources: [{ label: "Codex Memory Tools", url: "https://github.com/openai/codex/tree/main/codex-rs/ext/memories/src/tools" }] }
            ],
            ["Schema", "Contract", "Type Safety"]
          ),
          capability(
            "tool-discovery-routing",
            "工具发现与选择 Tool Routing",
            "根据任务目标选择合适工具，并管理可用工具集合。",
            "工具选择需要结合模型判断、规则约束和当前身份权限。大量工具场景应采用分组、搜索或分层路由，避免一次性暴露全部工具。",
            [
              { id: "model-tool-selection", title: "Model Tool Selection", summary: "由模型根据描述选择工具和参数。", description: "将工具 Schema 提供给模型，接收 tool call 后先进行参数校验和权限判断，再进入执行层。", tags: ["Tool Calling", "LLM"] },
              { id: "rule-tool-router", title: "Rule-based Tool Router", summary: "按明确条件将任务映射到工具。", description: "对稳定业务规则使用代码路由，减少不必要的模型调用，并为冲突和低置信度情况保留回退策略。", tags: ["Rules", "Routing"] },
              { id: "dynamic-tool-discovery", title: "Dynamic Tool Discovery", summary: "按需发现和加载工具能力。", description: "使用 MCP Registry、工具目录或语义检索发现相关工具，加载前检查来源、描述、权限和版本。", tags: ["MCP", "Discovery"] }
            ],
            ["Selection", "Routing", "Discovery"]
          ),
          capability(
            "tool-execution",
            "工具执行与可靠性 Execution",
            "可靠执行工具调用，并处理超时、失败、重试和副作用。",
            "工具执行不能假设网络和外部系统始终可用。执行层应提供统一错误模型、有限重试、幂等控制和后置验证。",
            [
              { id: "timeout-retry", title: "Timeout / Retry / Backoff", summary: "使用超时、有限重试和指数退避。", description: "为每种工具定义超时、可重试错误、最大重试次数和指数退避，避免对非幂等操作盲目重试。", tags: ["Timeout", "Retry", "Backoff"] },
              { id: "idempotency", title: "Idempotency Key", summary: "防止重复请求造成重复副作用。", description: "为写操作生成幂等键，在服务端保存执行结果或请求状态，使网络重试不会重复创建、扣款或发送。", tags: ["Idempotency", "Deduplication"] },
              { id: "async-tool-job", title: "Async Tool Job", summary: "将耗时操作转为异步任务。", description: "返回 job_id 并通过轮询、Webhook 或事件通知获取最终结果，支持取消、超时和状态恢复。", tags: ["Async", "Job Queue"] },
              { id: "tool-result-validation", title: "Tool Result Validation", summary: "校验工具结果并确认外部状态。", description: "对返回值执行 Schema 校验和业务后置条件检查，区分成功、部分成功、可重试失败和永久失败。", tags: ["Result Schema", "Postcondition"] },
              { id: "lifecycle-hooks-middleware", title: "Lifecycle Hooks / Middleware", summary: "在会话、模型调用和工具执行前后插入确定性逻辑。", description: "通过 SessionStart、PreToolUse、PostToolUse、Stop 等生命周期事件执行参数检查、权限门禁、日志、通知和结果校验；Hook 由运行时确定性触发，适合承载不能只依赖模型自觉遵守的规则。", tags: ["Hooks", "Middleware", "Pre / Post Tool"] }
            ],
            ["Reliability", "Idempotency", "Async"]
          ),
          capability(
            "tool-integrations",
            "外部系统集成 Integrations",
            "连接 API、MCP 服务、浏览器和计算机使用环境。",
            "集成层负责协议适配和凭证管理，不应将第三方协议细节散落在 Agent 推理逻辑中。",
            [
              { id: "rest-api-client", title: "REST / GraphQL Client", summary: "通过 API 客户端访问业务系统。", description: "封装认证、分页、速率限制、错误映射和数据类型，避免模型直接拼接任意 HTTP 请求。", tags: ["REST", "GraphQL"] },
              { id: "mcp-client-server", title: "MCP Client / Server", summary: "通过 MCP 暴露和调用工具及资源。", description: "使用 MCP Client 发现服务器能力，通过 stdio 或 Streamable HTTP 传输调用工具，并隔离服务器信任边界。", tags: ["MCP", "stdio", "HTTP"], resources: [{ label: "MCP Documentation", url: "https://modelcontextprotocol.io/docs" }] },
              { id: "codex-mcp-client-example", title: "Codex · MCP Client Integration", summary: "将 MCP Server 的工具和资源接入统一 Tool Runtime。", description: "Codex 维护 MCP Server 连接，将远程工具定义规范化为模型可调用的 ToolSpec，并通过统一执行层调用；同时提供 MCP Resource 的列举和读取处理器。", tags: ["Codex", "MCP", "Tool Runtime"], resources: [{ label: "Codex MCP Handler", url: "https://github.com/openai/codex/blob/main/codex-rs/core/src/tools/handlers/mcp.rs" }] },
              { id: "browser-automation", title: "Browser Automation", summary: "通过浏览器自动化完成网页操作。", description: "使用 Playwright 等工具进行页面导航、元素定位、表单交互和状态验证，并限制可访问域名与下载行为。", tags: ["Playwright", "Browser"] },
              { id: "computer-use-gui", title: "Computer Use / GUI Automation", summary: "通过屏幕观察和输入动作操作桌面应用与图形界面。", description: "使用截图、Accessibility Tree、DOM 或视觉定位观察界面，再执行点击、键盘输入、滚动和拖拽；每次动作后重新观察并验证状态。与 Browser Automation 相比，Computer Use 可操作浏览器以外的桌面应用，但更依赖视觉反馈、坐标稳定性和执行权限。", tags: ["Computer Use", "GUI", "Screenshot", "Accessibility"] }
            ],
            ["API", "MCP", "Browser"]
          ),
          capability(
            "tool-permissions-sandbox",
            "权限与执行隔离 Permissions & Sandbox",
            "限制工具可以访问的资源、数据和执行能力。",
            "工具权限必须由可信运行时强制执行。模型输出、网页内容和 MCP 返回都不能直接扩大权限范围。",
            [
              { id: "oauth-scopes", title: "OAuth Scopes", summary: "使用细粒度授权范围访问外部服务。", description: "为用户和 Agent 申请最小 OAuth Scope，使用短期 Token，安全存储并支持撤销和轮换。", tags: ["OAuth", "Least Privilege"] },
              { id: "policy-engine", title: "Policy Engine", summary: "在执行前按身份和资源策略授权。", description: "使用 RBAC、ABAC 或 OPA 等策略引擎判断主体、动作、资源和上下文是否满足授权条件。", tags: ["RBAC", "ABAC", "OPA"] },
              { id: "execution-sandbox", title: "Execution Sandbox", summary: "隔离代码、文件和网络执行环境。", description: "使用容器、微虚拟机或受限运行时控制文件系统、网络出口、CPU、内存、进程和执行时间。", tags: ["Container", "MicroVM", "Isolation"] },
              { id: "codex-workspace-sandbox-example", title: "Codex · Workspace-write Sandbox", summary: "将文件写入范围限制在工作目录和显式可写目录。", description: "Codex 的 workspace-write sandbox 允许读取文件，并限制写入 cwd 和 writable_roots；访问其他目录需要审批，网络访问由独立策略控制。", tags: ["Codex", "Filesystem Sandbox", "Approval"], resources: [{ label: "Codex Workspace-write Policy", url: "https://github.com/openai/codex/blob/main/codex-rs/prompts/templates/permissions/sandbox_mode/workspace_write.md" }] }
            ],
            ["OAuth", "Policy", "Sandbox"]
          ),
          capability(
            "tool-runtime-adapters",
            "工具运行时与执行适配 Tool Runtime Adapters",
            "把模型提出的工具调用安全地转换成真实执行，并统一处理不同执行环境。",
            "工具定义不等于工具执行。运行时需要完成参数校验、身份与权限检查、执行环境选择、输出捕获和副作用验证；同一个 Agent 可能同时调用 API、Shell、文件系统、数据库和远程工具。",
            [
              { id: "shell-cli-execution", title: "Shell / CLI Execution", summary: "通过命令行执行构建、测试和系统操作。", description: "封装 Shell、PowerShell 或专用 CLI 执行器，限制工作目录、环境变量、命令权限、超时和输出大小；高风险命令需要审批或隔离环境。", tags: ["Shell", "CLI", "Process"] },
              { id: "filesystem-git-operations", title: "Filesystem / Git Operations", summary: "通过受控文件操作和版本控制修改项目。", description: "提供文件读写、目录枚举、补丁应用、Git diff、分支和提交操作；校验路径边界、文件大小、符号链接和并发修改。", tags: ["Filesystem", "Git", "Patch"] },
              { id: "database-tool-adapter", title: "Database Tool Adapter", summary: "通过结构化工具执行数据库查询和受控写入。", description: "使用只读连接、参数化 SQL、Schema 限制和事务封装数据库操作；写入操作应有授权、幂等键和执行后验证。", tags: ["SQL", "Database", "Transactions"] },
              { id: "rpc-tool-adapter", title: "RPC / gRPC Tool Adapter", summary: "通过类型化 RPC 接口调用远程服务。", description: "将 protobuf 或 RPC 方法映射为工具 Schema，统一认证、超时、流式响应和错误语义；对长流和重试定义明确的取消及幂等策略。", tags: ["RPC", "gRPC", "Protobuf"] },
              {
                id: "codex-mcp-runtime",
                title: "Codex · MCP Tool Runtime",
                summary: "发现 MCP Server 工具，将其 Schema 规范化后注册为模型可调用工具。",
                description: "Codex 的 MCP Handler 将远程 ToolInfo 转换为 Responses API ToolSpec，缓存规范化后的工具定义，并在执行时通过 MCP Client 调用远端服务器；同时支持 MCP Resources 等资源读取入口。",
                points: [
                  "工具定义包含名称、描述和参数 Schema，并根据工具来源处理命名空间。",
                  "执行链路经过统一 Tool Runtime，采集调用来源、耗时和遥测信息。",
                  "MCP Server 是外部信任边界，仍需单独配置连接、授权和工具审批。"
                ],
                tags: ["Codex", "MCP", "ToolSpec", "Runtime"],
                resources: [
                  { label: "Codex MCP Tool Handler", url: "https://github.com/openai/codex/blob/main/codex-rs/core/src/tools/handlers/mcp.rs" }
                ]
              }
            ],
            ["Shell", "Filesystem", "Git", "Database", "RPC", "MCP"]
          ),
          capability(
            "tool-result-streaming",
            "工具结果与长任务管理 Tool Results & Long-running Jobs",
            "处理大结果、分页结果、流式输出和需要等待的外部任务。",
            "工具返回值可能超出上下文窗口，或需要数分钟到数小时才能完成。工具层应提供分页、截断、文件引用、异步任务 ID、进度事件和取消机制，而不是把所有输出直接塞回模型。",
            [
              { id: "tool-output-truncation-artifact", title: "Output Truncation / Artifact Reference", summary: "截断超大输出并将完整结果保存为可读取产物。", description: "为模型返回摘要、关键片段和文件引用，完整内容保存在工作区或对象存储；提供后续按需读取方式，避免丢失证据。", tags: ["Truncation", "Artifacts", "Output Budget"] },
              { id: "tool-pagination-cursor", title: "Pagination / Cursor-based Results", summary: "通过游标分批返回大型结果集。", description: "使用 offset、cursor 或 continuation token 分页，保持稳定排序和权限范围；模型只读取与当前任务相关的页面。", tags: ["Pagination", "Cursor"] },
              { id: "tool-streaming-progress", title: "Streaming Progress / Job Polling", summary: "持续报告长时间工具任务的进度和最终结果。", description: "工具先返回 job_id，再通过轮询、Webhook 或事件流报告状态；支持取消、超时、重试和最终结果确认。", tags: ["Streaming", "Polling", "Job ID"] },
              { id: "tool-cancellation-compensation", title: "Cancellation / Compensation", summary: "支持取消执行并对部分副作用执行补偿。", description: "定义取消信号传播、可中断步骤和已完成副作用的补偿操作；对于无法撤销的外部动作，应在执行前明确告知用户。", tags: ["Cancellation", "Compensation", "Saga"] }
            ],
            ["Streaming", "Pagination", "Artifacts", "Cancellation"]
          ),
          capability(
            "tool-extension-governance",
            "工具扩展与供应治理 Tool Extensions & Governance",
            "管理插件、工具包和外部服务器的发现、加载、升级与信任。",
            "工具生态不仅是接口集合，还包含第三方代码、权限声明和版本依赖。扩展加载应有清晰来源、能力清单、签名或校验、版本约束和隔离边界。",
            [
              { id: "tool-registry-manifest", title: "Tool Registry / Capability Manifest", summary: "通过清单声明工具能力、参数、来源和权限需求。", description: "维护工具注册表与机器可读 Manifest，声明工具名称、版本、Schema、所需 Scope、网络和文件权限；加载前执行校验。", tags: ["Registry", "Manifest", "Capabilities"] },
              { id: "plugin-version-dependency", title: "Plugin Versioning / Dependency Management", summary: "管理插件版本、依赖和兼容性。", description: "锁定扩展版本和依赖，记录兼容的 Agent Runtime 版本，使用分阶段升级和回滚避免供应链变化破坏执行。", tags: ["Plugin", "SemVer", "Dependencies"] },
              { id: "lazy-tool-loading", title: "Lazy Tool Loading / Tool Search", summary: "只向模型暴露当前任务相关的工具。", description: "先提供工具目录或搜索工具，模型发现能力后再加载详细 Schema；控制工具描述 Token 占用并避免无关工具干扰选择。", tags: ["Lazy Loading", "Tool Search", "Token Budget"] },
              { id: "tool-provenance-signing", title: "Tool Provenance / Signature Verification", summary: "验证工具来源、发布者和制品完整性。", description: "通过发布者身份、签名、哈希和软件物料清单验证扩展来源；对高权限工具执行人工审核和持续漏洞扫描。", tags: ["Supply Chain", "Signing", "SBOM"] },
              {
                id: "claude-code-hooks-example",
                title: "Claude Code · Lifecycle Hooks",
                summary: "通过工具和会话生命周期事件运行确定性脚本。",
                description: "Claude Code Hooks 可在 SessionStart、PreToolUse、PostToolUse、Stop 等事件触发命令或其他处理器，用于验证、审计、格式化和策略执行；Hook 是运行时自动触发的程序逻辑，不等同于模型自己选择调用的普通 Tool。",
                points: [
                  "PreToolUse 可在工具执行前检查参数或阻止操作。",
                  "PostToolUse 可对执行结果执行后处理和记录。",
                  "Hook 的配置和脚本本身也需要权限、来源和执行环境治理。"
                ],
                tags: ["Claude Code", "Hooks", "Lifecycle Events"],
                resources: [
                  { label: "Claude Code Hooks Documentation", url: "https://code.claude.com/docs/en/hooks" }
                ]
              }
            ],
            ["Registry", "Plugins", "Lazy Loading", "Provenance", "Hooks"]
          ),
        ]
      ),
      moduleNode(
        "orchestration",
        "流程编排 Orchestration",
        "管理 Agent 的状态、步骤流转、任务交接和人机协作。",
        "编排模块负责将多个能力组织成可靠的运行流程。它维护状态、检查点和转移条件，并处理并行任务、Agent 委派、人工审批和异常恢复。",
        "#4F9CA8",
        ["Workflow", "State", "Multi-Agent"],
        [
          capability(
            "workflow-state",
            "工作流与状态管理 Workflow State",
            "使用明确的状态和转移条件控制任务生命周期。",
            "长任务需要可暂停、可恢复和可审计的状态模型。状态转移应由确定性代码验证，避免关键业务流程只存在于 Prompt 中。",
            [
              { id: "finite-state-machine", title: "Finite State Machine", summary: "使用状态机管理任务状态与转移。", description: "定义状态、事件、守卫条件和终止状态，适合审批、订单处理和明确阶段的 Agent 任务。", tags: ["FSM", "State Machine"] },
              { id: "graph-workflow", title: "Graph Workflow · LangGraph", summary: "用节点和边组织有状态 Agent 流程。", description: "将模型调用、工具执行和条件路由建模为图节点与边，使用共享 State 和循环边管理复杂工作流。", tags: ["LangGraph", "Graph"], resources: [{ label: "LangGraph Documentation", url: "https://docs.langchain.com/oss/python/langgraph/overview" }] },
              { id: "checkpoint-persistence", title: "Checkpoint Persistence", summary: "保存执行快照并支持断点恢复。", description: "在关键节点持久化状态、已完成步骤和执行游标，恢复时验证版本和副作用幂等性。", tags: ["Checkpoint", "Persistence"] },
              { id: "codex-agent-lifecycle-example", title: "Codex · Subagent Lifecycle", summary: "管理子 Agent 的创建、等待、恢复和关闭。", description: "Codex 为子 Agent 维护独立 Thread、配置快照和运行状态，并通过控制工具完成 Spawn、Wait、Resume 和 Close；父子任务的状态和权限在运行时管理。", tags: ["Codex", "Subagent", "Lifecycle"], resources: [{ label: "Codex Agent Control", url: "https://github.com/openai/codex/tree/main/codex-rs/core/src/agent/control" }] }
            ],
            ["State Machine", "Graph", "Checkpoint"]
          ),
          capability(
            "multi-agent-collaboration",
            "多 Agent 协作 Multi-Agent",
            "通过分工、委派和并行执行完成复杂任务。",
            "多 Agent 应建立在清晰的职责边界和可测收益上。需要定义通信协议、上下文传递、结果合并和责任归属。",
            [
              { id: "supervisor-worker", title: "Supervisor / Worker", summary: "由协调 Agent 分配任务并汇总结果。", description: "Supervisor 负责任务拆分、子 Agent 路由和结果验收，Worker 在受限职责与工具权限内执行子任务。", tags: ["Supervisor", "Delegation"] },
              { id: "agent-handoff", title: "Agent Handoff", summary: "将控制权和必要上下文交给另一个 Agent。", description: "交接时传递目标、已完成工作、未解决问题和允许使用的工具，并设置最大跳数和循环检测。", tags: ["Handoff", "Routing"] },
              { id: "parallel-map-reduce", title: "Parallel Map-Reduce", summary: "并行执行子任务后统一聚合。", description: "将可独立执行的子任务并发分发，使用统一输出 Schema 汇总，并处理超时、部分失败和冲突结果。", tags: ["Parallel", "Map-Reduce"] },
              { id: "agent-to-agent-protocol", title: "Agent-to-Agent Protocol · A2A", summary: "通过标准化 Agent 身份、任务和产物协议实现跨 Agent 互操作。", description: "使用 Agent Card 发现远端 Agent 能力，通过标准化 Task 生命周期提交任务、查询状态、接收流式更新并获取 Artifact；协议层负责跨框架通信，具体授权、信任和结果验收仍由调用方控制。", tags: ["A2A", "Agent Interoperability", "Task Protocol"], resources: [{ label: "A2A Protocol", url: "https://a2a-protocol.org/latest/" }] }
            ],
            ["Delegation", "Handoff", "Parallel"]
          ),
          capability(
            "human-in-loop",
            "人机协同 Human-in-the-loop",
            "在关键节点暂停流程并等待人工决策或补充信息。",
            "人工协同是 Agent 工作流中的正式控制节点。审批应绑定具体动作和参数，支持修改、拒绝、超时与恢复。",
            [
              { id: "approval-gate", title: "Approval Gate", summary: "在高风险操作前要求人工批准。", description: "展示拟执行动作、影响范围和参数快照，审批结果与请求版本绑定，防止审批后参数被替换。", tags: ["Approval", "Human Review"] },
              { id: "interrupt-resume", title: "Interrupt / Resume", summary: "暂停 Agent 并在人工输入后恢复。", description: "持久化当前状态和检查点，等待人工补充或选择后从指定节点继续执行。", tags: ["Interrupt", "Resume"] },
              { id: "review-queue", title: "Review Queue", summary: "将待审核任务分发到人工工作台。", description: "使用队列管理待处理、已批准、已拒绝和超时任务，记录审核人、时间、理由和执行结果。", tags: ["Queue", "Audit"] }
            ],
            ["Approval", "Interrupt", "Review"]
          ),
          capability(
            "durable-execution",
            "异步任务与持久执行 Durable Execution",
            "支持长时间运行、调度、重试和故障恢复。",
            "长流程不应依赖单个 HTTP 请求保持存活。持久执行需要可靠队列、任务状态存储和可恢复的活动步骤。",
            [
              { id: "task-queue", title: "Task Queue · BullMQ / Celery", summary: "通过任务队列解耦请求和后台执行。", description: "使用 Redis Queue、BullMQ 或 Celery 管理任务分发、并发、重试、优先级和死信队列。", tags: ["BullMQ", "Celery", "Redis"] },
              { id: "durable-workflow-engine", title: "Durable Workflow · Temporal", summary: "持久化执行历史并自动恢复工作流。", description: "使用 Temporal 等持久执行引擎管理长流程、定时器、重试和故障恢复，避免自行实现复杂恢复协议。", tags: ["Temporal", "Durable Execution"], resources: [{ label: "Temporal Documentation", url: "https://docs.temporal.io/" }] },
              { id: "scheduler", title: "Scheduler", summary: "执行定时、周期和延迟任务。", description: "通过 Cron、任务调度器或延迟队列触发 Agent 工作，并处理重复执行、时区和错过调度的补偿策略。", tags: ["Cron", "Scheduling"] },
              { id: "codex-sqlite-memory-jobs", title: "Codex · SQLite-backed Memory Jobs", summary: "通过 SQLite jobs 表、领取租约和退避重试调度记忆后台任务。", description: "Codex 将每个 rollout 的提取任务和全局整合任务写入 Memory Store；State DB 提供线程元数据，独立 Memory DB 保存 stage1_outputs 与 jobs。Phase 1 使用线程级租约并行处理，Phase 2 使用全局任务租约和文件锁串行写入工作区。", tags: ["Codex", "SQLite", "Job Lease", "Retry"], resources: [{ label: "Codex Memory Job State", url: "https://github.com/openai/codex/blob/main/codex-rs/state/src/runtime/memories.rs" }] }
            ],
            ["Queue", "Durable Execution", "Scheduler"]
          ),
          capability(
            "workflow-patterns",
            "工作流编排模式 Workflow Patterns",
            "选择适合任务结构的串行、并行、路由、循环和评估优化模式。",
            "Agent 工作流不只有单一的 Planner-Executor。应根据任务依赖、可并行性和错误恢复需求选择模式；复杂系统可以组合多种模式，但需要明确停止条件和结果汇总责任。",
            [
              { id: "sequential-chain", title: "Sequential Chain", summary: "按确定顺序执行多个处理阶段。", description: "将输入解析、计划、工具执行、验证和输出串成阶段流水线；适合依赖明确的流程，并在每一步定义输入输出契约。", tags: ["Sequential", "Pipeline"] },
              { id: "router-workflow", title: "Router / Dispatch Workflow", summary: "根据任务类型选择不同 Agent 或子工作流。", description: "使用规则、分类器或模型将任务路由到专门工作流；保留默认路由、低置信度回退和路由决策日志。", tags: ["Router", "Dispatch"] },
              { id: "parallel-fanout-fanin", title: "Fan-out / Fan-in", summary: "并行分发独立子任务，再统一汇总。", description: "把可并行的检索、分析或编码任务分发给多个 Worker，等待结果或超时后聚合；处理部分失败、重复结果和冲突。", tags: ["Fan-out", "Fan-in", "Parallel"] },
              { id: "iterative-refinement-loop", title: "Iterative Refinement Loop", summary: "在生成、评估和修订之间循环直到满足停止条件。", description: "组合 Generator、Critic、Verifier 和执行反馈，迭代修正计划或产物；设置最大轮次、预算和通过阈值，避免无限循环。", tags: ["Loop", "Evaluator-Optimizer"] },
              { id: "hierarchical-orchestrator", title: "Hierarchical Orchestrator", summary: "由上层协调者管理多个层级的子 Agent。", description: "将复杂任务拆成子目标，由不同层级的协调者继续分解和分派；需要控制委派深度、上下文传递和最终责任归属。", tags: ["Hierarchical", "Orchestrator"] }
            ],
            ["Sequential", "Router", "Parallel", "Loop", "Hierarchical"]
          ),
          capability(
            "distributed-state-reliability",
            "分布式状态与恢复 Distributed State & Recovery",
            "保证跨进程、跨服务和长时间运行的 Agent 工作流可恢复。",
            "工作流可能在模型调用、工具执行或等待人工审批时中断。可靠编排需要持久化事件和检查点，处理重复投递、部分完成、补偿和状态版本迁移。",
            [
              { id: "event-sourcing-workflow", title: "Event Sourcing", summary: "通过追加事件记录工作流状态变化。", description: "将任务创建、步骤完成、工具结果、审批和失败记录为不可变事件，通过重放事件重建当前状态；需要处理事件 Schema 版本和隐私保留。", tags: ["Event Sourcing", "Event Log"] },
              { id: "saga-compensation", title: "Saga / Compensation", summary: "用补偿步骤管理跨服务的部分成功。", description: "将长事务拆成多个本地事务，每一步定义补偿动作；失败时按策略回滚已完成步骤或进入人工恢复。", tags: ["Saga", "Compensation", "Distributed Transaction"] },
              { id: "transactional-outbox", title: "Transactional Outbox / Inbox", summary: "保证数据库状态变更与消息发布的一致性。", description: "在同一数据库事务中写入业务状态和待发布事件，再由 Dispatcher 投递；消费者使用 Inbox 或幂等键处理重复消息。", tags: ["Outbox", "Inbox", "Exactly-once Effect"] },
              { id: "workflow-checkpoint-replay", title: "Checkpoint / Replay / Resume", summary: "保存执行快照并从最近成功节点恢复。", description: "保存状态快照、事件游标和已完成副作用，恢复时检查工具幂等性与外部状态；支持重放和人工定位失败步骤。", tags: ["Checkpoint", "Replay", "Resume"] },
              { id: "workflow-version-migration", title: "Workflow Versioning / Migration", summary: "在工作流升级后恢复旧任务并迁移状态。", description: "为工作流定义版本和兼容策略；长任务恢复时选择旧定义继续、执行状态迁移或安全终止，避免新代码错误解释旧快照。", tags: ["Workflow Versioning", "Migration"] }
            ],
            ["Event Sourcing", "Saga", "Outbox", "Checkpoint", "Replay"]
          ),
          capability(
            "agent-communication-coordination",
            "Agent 通信与协同 Agent Communication",
            "管理 Agent 之间的消息、共享状态、任务交接和协作协议。",
            "多 Agent 协作不仅是启动多个模型实例，还需要定义消息语义、收件箱、状态可见性、交接责任和冲突处理。通信协议应区分消息已发送、已接收、已处理和任务已完成。",
            [
              { id: "agent-message-passing", title: "Message Passing / Mailbox", summary: "通过消息和收件箱实现 Agent 间异步通信。", description: "为每个 Agent 建立消息队列或 Mailbox，定义发送、接收、确认、重试和未读消息保留策略；适合异步 Worker 和长生命周期 Agent。", tags: ["Message Passing", "Mailbox", "Async"] },
              { id: "shared-state-blackboard", title: "Shared State / Blackboard", summary: "多个 Agent 通过共享工作区协同。", description: "使用共享数据库、任务板或文件工作区发布发现和中间产物；通过锁、版本号和写入权限避免并发覆盖与无效状态。", tags: ["Shared State", "Blackboard"] },
              { id: "agent-consensus-debate", title: "Debate / Consensus / Voting", summary: "通过独立观点、交叉质询或投票处理分歧。", description: "让多个 Agent 独立给出结论，再使用证据交叉审查、加权投票或仲裁者整合；需要避免同源模型带来的相关性错误。", tags: ["Debate", "Consensus", "Voting"] },
              { id: "agent-deadlock-loop-detection", title: "Deadlock / Loop / Delegation-depth Detection", summary: "识别循环委派、互相等待和过深的 Agent 调用链。", description: "跟踪调用图、父子关系、等待状态和最大委派深度；使用超时、取消传播和循环检测防止资源耗尽。", tags: ["Deadlock", "Loop Detection", "Budget"] },
              {
                id: "codex-multi-agent-runtime",
                title: "Codex · Spawned Agents & Mailboxes",
                summary: "通过 Spawn、Send Input、Wait 和 Resume 管理子 Agent 生命周期与消息。",
                description: "Codex 开源实现包含子 Agent 启动、角色配置、权限配置、消息传递和 Mailbox；未加载的本地会话仍可暂存消息，Agent 恢复后再接收。它不是单纯并行调用多个模型，而是有生命周期和消息状态管理的协作运行时。",
                points: [
                  "Spawn 为子 Agent 建立独立线程和执行配置，并根据角色与权限构建子 Agent 上下文。",
                  "Mailbox 保存待处理消息，支持 watch、take 和未读消息保留。",
                  "工具层提供 spawn、send_input、wait、resume_agent 和 close_agent 等控制入口。",
                  "父子 Agent 的权限配置需要受限，消息与交接上下文需要保留来源。"
                ],
                tags: ["Codex", "Subagents", "Mailbox", "Handoff"],
                resources: [
                  { label: "Codex Agent Spawn", url: "https://github.com/openai/codex/blob/main/codex-rs/core/src/agent/control/spawn.rs" },
                  { label: "Codex Agent Mailbox", url: "https://github.com/openai/codex/blob/main/codex-rs/core/src/agent/control/mailbox.rs" },
                  { label: "Codex Multi-agent Tools", url: "https://github.com/openai/codex/tree/main/codex-rs/core/src/tools/handlers/multi_agents" }
                ]
              }
            ],
            ["Message Passing", "Mailbox", "Blackboard", "Consensus", "Codex"]
          ),
        ]
      ),
      moduleNode(
        "context-prompt",
        "上下文与提示 Context",
        "为每次模型调用组装正确、精简且符合约束的信息。",
        "上下文模块决定模型每一轮能看到什么。它将系统规则、当前任务、历史状态、检索证据和工具结果按优先级组织，并在 Token 预算内压缩和注入。",
        "#6C8DBB",
        ["Prompt", "Context Engineering", "Structured Output"],
        [
          capability(
            "prompt-management",
            "提示词管理 Prompt Management",
            "组织稳定规则、任务指令和可复用提示模板。",
            "Prompt 应作为可测试、可版本化的工程资产管理，避免将业务逻辑散落在多个字符串中。",
            [
              { id: "system-prompt-template", title: "System Prompt Template", summary: "定义角色、目标、规则和工具使用边界。", description: "将系统级约束与动态任务参数分离，明确禁止事项、失败策略和停止条件。", tags: ["System Prompt", "Template"] },
              { id: "codex-agents-md-example", title: "Codex · Hierarchical AGENTS.md", summary: "按项目根目录和当前目录加载层级化项目指令。", description: "Codex 根据项目根标记查找 AGENTS.md，并按根目录到当前工作目录的顺序合并项目指令；该机制属于任务上下文组装，不是 Local Memories。", tags: ["Codex", "AGENTS.md", "Project Context"], resources: [{ label: "Codex AGENTS.md Implementation", url: "https://github.com/openai/codex/blob/main/codex-rs/core/src/agents_md.rs" }] },
              { id: "prompt-versioning", title: "Prompt Versioning", summary: "记录提示词版本并支持对比和回滚。", description: "为 Prompt 建立版本号、变更记录和测试样本，发布前执行离线回归并支持快速回滚。", tags: ["Versioning", "A/B Test"] },
              { id: "prompt-composition", title: "Prompt Composition", summary: "通过模块化片段组合复杂提示词。", description: "将安全规则、角色说明、任务指令、输出格式和示例拆成可复用片段，按任务类型组合。", tags: ["Composition", "Templates"] },
              { id: "agent-skills-package", title: "Agent Skills · SKILL.md Package", summary: "将领域指令、工作流程、脚本和示例封装为按需加载的能力包。", description: "Skill 通常由入口说明文件和可选 scripts、references、assets 组成；Agent 先发现 Skill 的名称与用途，再在任务相关时加载详细指令或执行脚本。它不同于单次 Prompt，也不同于需要即时调用的 Tool。", tags: ["Agent Skills", "SKILL.md", "Progressive Disclosure"], resources: [{ label: "Agent Skills Specification", url: "https://agentskills.io/specification" }] }
            ],
            ["System Prompt", "Versioning", "Composition"]
          ),
          capability(
            "context-assembly",
            "上下文组装 Context Assembly",
            "从多个数据源选择当前任务真正需要的信息。",
            "上下文组装要处理优先级、时效性、相关性和信任等级，避免将全部历史记录和检索结果无差别塞入模型。",
            [
              { id: "context-builder", title: "Context Builder", summary: "统一构建模型调用所需的上下文对象。", description: "将系统指令、用户目标、状态摘要、记忆、检索证据和工具结果装配为结构化 Context。", tags: ["Context Builder", "Assembly"] },
              { id: "memory-injection", title: "Memory Injection", summary: "按当前任务召回并注入相关记忆。", description: "根据用户、任务和时间过滤记忆，控制注入数量，并保留来源、更新时间和可信度。", tags: ["Memory", "Retrieval"] },
              { id: "codex-memory-summary-injection", title: "Codex · memory_summary Injection", summary: "在新会话开始时注入精简摘要，再通过工具按需读取历史证据。", description: "Codex v2 将 memory_summary.md 渲染为 MEMORY_SUMMARY 注入新会话的开发者上下文；摘要中的项目和 rollout 路径用于定位详细历史。只有当历史证据、原始措辞、时间线或不确定性会影响当前工作时，才读取具体 rollout summary。", tags: ["Codex", "Context Injection", "Progressive Disclosure"], resources: [{ label: "Codex v2 Read Path", url: "https://github.com/openai/codex/blob/main/codex-rs/ext/memories/templates/memories/read_path_v2.md" }] },
              { id: "retrieval-injection", title: "RAG Context Injection", summary: "将检索证据按相关性组织进 Prompt。", description: "对候选文档进行权限过滤、去重和排序，保留引用标识，并将不可信内容明确标记为数据。", tags: ["RAG", "Evidence"] }
            ],
            ["Context Builder", "Memory", "RAG"]
          ),
          capability(
            "context-compression",
            "上下文压缩 Context Compression",
            "在有限 Token 预算下保留最有价值的信息。",
            "上下文压缩应优先保留目标、约束、关键决策和未完成事项。压缩结果需要能够追溯原始来源，并避免摘要引入新事实。",
            [
              { id: "rolling-summary", title: "Rolling Summary", summary: "持续维护会话和任务滚动摘要。", description: "在上下文达到阈值时总结历史轮次，保留目标、事实、决策、约束和待办，再替换低价值历史文本。", tags: ["Summarization", "Rolling Context"] },
              { id: "token-budget-selector", title: "Token Budget Selector", summary: "按优先级选择上下文片段。", description: "估算 Token 数，结合相关性、重要性、时效性和来源可信度进行预算分配。", tags: ["Token Budget", "Selection"] },
              { id: "prompt-cache", title: "Prompt Caching", summary: "复用稳定前缀以降低延迟和成本。", description: "将稳定系统指令和静态上下文放在可缓存前缀，减少重复输入并注意缓存命中条件和敏感数据边界。", tags: ["Caching", "Cost"] }
            ],
            ["Summarization", "Token Budget", "Caching"]
          ),
          capability(
            "output-contract",
            "输出约束 Output Contract",
            "让模型响应符合下游程序可消费的格式和业务契约。",
            "模型输出必须经过解析和业务验证。格式正确并不代表语义正确，敏感操作还需要独立授权。",
            [
              { id: "json-schema-output", title: "JSON Schema / Structured Output", summary: "通过 Schema 限定输出字段和类型。", description: "定义必填字段、枚举、嵌套结构和额外字段策略，使用模型结构化输出能力或受约束解码。", tags: ["JSON Schema", "Structured Output"] },
              { id: "typed-parser", title: "Typed Parser", summary: "将模型响应解析为强类型对象。", description: "使用 Pydantic、Zod 或类型化解析器验证模型响应，并将解析错误转为明确的修复请求。", tags: ["Pydantic", "Zod", "Parser"] },
              { id: "repair-retry", title: "Repair / Retry", summary: "对格式错误或缺失字段进行有限修复。", description: "将校验错误反馈给模型进行有限重试，设置次数和 Token 上限，并避免自动修复越过权限边界。", tags: ["Retry", "Repair"] }
            ],
            ["Schema", "Parser", "Validation"]
          ),
          capability(
            "instruction-hierarchy",
            "指令层级与动态加载 Instruction Hierarchy",
            "管理系统、开发者、用户、项目和任务级指令的优先级与作用范围。",
            "Agent 指令来源可能包括系统规则、开发者策略、用户要求、仓库说明、Skill 和动态工具描述。需要定义优先级、作用域、合并方式、预算和冲突处理，避免把所有文本无差别拼接。",
            [
              { id: "instruction-priority-resolution", title: "Instruction Priority / Conflict Resolution", summary: "定义不同来源指令的优先级和冲突处理。", description: "明确系统、开发者、组织、项目和用户指令之间的层级；对冲突保留来源与适用范围，禁止低信任内容覆盖高优先级规则。", tags: ["Instruction Hierarchy", "Conflict"] },
              { id: "hierarchical-project-instructions", title: "Hierarchical Project Instructions", summary: "沿目录层级加载适用的项目指令。", description: "从用户级、仓库根目录和当前子目录收集指令文件，按范围合并并设置字节或 Token 预算；常见形式包括 AGENTS.md、CLAUDE.md 和项目规则目录。", tags: ["AGENTS.md", "CLAUDE.md", "Project Rules"] },
              { id: "dynamic-instruction-loading", title: "Dynamic Instruction / Skill Loading", summary: "按当前任务动态加载规则和可复用能力说明。", description: "先暴露简短能力目录，再根据任务相关性读取 Skill、参考文档和规则文件；记录加载来源和版本，避免不相关内容占用上下文。", tags: ["Skills", "Lazy Loading", "Progressive Disclosure"] },
              {
                id: "codex-agents-md-loader",
                title: "Codex · AGENTS.md Discovery",
                summary: "从项目根目录到当前工作目录逐层发现并合并 AGENTS.md。",
                description: "Codex 通过项目根标记定位仓库边界，收集根目录到当前目录之间的 AGENTS.md 并按层级拼接；支持本地 override 文件、项目文档预算和不可信项目跳过策略。",
                points: [
                  "默认使用 .git 等 project root marker 定位项目根目录。",
                  "只收集项目根到当前工作目录范围内的说明，不继续向仓库根之外无限遍历。",
                  "项目说明可设置最大字节预算；不可信项目或预算为零时可以跳过加载。"
                ],
                tags: ["Codex", "AGENTS.md", "Instruction Discovery"],
                resources: [
                  { label: "Codex AGENTS.md Loader", url: "https://github.com/openai/codex/blob/main/codex-rs/core/src/agents_md.rs" }
                ]
              }
            ],
            ["Instruction Hierarchy", "Project Rules", "Skills", "Dynamic Loading"]
          ),
          capability(
            "context-selection-ranking",
            "上下文选择与排序 Context Selection",
            "从多种候选来源中挑选当前任务真正需要的上下文。",
            "上下文来源包括当前对话、长期记忆、RAG 证据、项目指令、工具输出和执行状态。选择时应结合相关性、时效性、来源可信度、权限和 Token 成本，而不是简单按时间追加。",
            [
              { id: "context-relevance-ranking", title: "Relevance / Recency Ranking", summary: "综合相关性、时间和重要性对上下文片段排序。", description: "将 Query 相关度、最近使用时间、任务优先级、置信度和来源可信度组合打分；对过时或低信任片段降低优先级。", tags: ["Relevance", "Recency", "Ranking"] },
              { id: "context-source-priority", title: "Source Priority / Authority", summary: "按来源权威性和适用范围选择事实。", description: "区分当前代码、官方文档、用户明确决定、历史摘要、模型推断和第三方内容；对可变化事实优先读取当前权威来源。", tags: ["Source Authority", "Provenance"] },
              { id: "context-conflict-resolution", title: "Context Conflict Resolution", summary: "识别不同来源中的冲突并保留适用范围。", description: "比较版本、时间、用户确认和来源可信度；无法安全消解时并列展示冲突或请求用户澄清，不应静默拼接矛盾事实。", tags: ["Conflict", "Temporal Validity"] },
              { id: "context-source-budgeting", title: "Context Source Budgeting", summary: "在不同上下文来源之间分配 Token 预算。", description: "为系统规则、任务目标、工具结果、记忆和 RAG 证据设定预算与优先级；为长结果保留可追溯引用，支持后续按需展开。", tags: ["Token Budget", "Selection"] }
            ],
            ["Ranking", "Authority", "Conflict", "Budget"]
          ),
          capability(
            "context-window-lifecycle",
            "上下文窗口与生命周期 Context Window Management",
            "控制上下文长度、压缩时机和历史保留策略。",
            "长会话会持续消耗上下文窗口。系统需要估算 Token、识别压缩触发点、保留重要状态和未完成事项，并避免压缩后破坏工具调用、引用或多 Agent 通信的完整性。",
            [
              { id: "token-counting-budget", title: "Token Counting / Budget Allocation", summary: "估算输入长度并为各类上下文预留预算。", description: "使用对应模型 Tokenizer 或近似估算器计算消息、工具 Schema 和多模态输入成本；预留输出和安全余量，防止请求超过模型限制。", tags: ["Tokenizer", "Token Budget"] },
              { id: "context-compaction", title: "Context Compaction / Summarization", summary: "在接近窗口上限时压缩历史并保留关键状态。", description: "使用模型摘要、结构化状态提取或保留关键消息的方式替换冗长历史；保留目标、约束、已完成步骤、工具结果和未解决事项，并标注压缩边界。", tags: ["Compaction", "Summarization"] },
              { id: "context-trimming-sliding-window", title: "Trimming / Sliding Window", summary: "删除或移出低价值旧内容以控制上下文长度。", description: "按轮次、Token、时间或消息类型裁剪历史；对工具输出和大段引用优先采用摘要或外部引用，避免误删仍然有效的约束。", tags: ["Trimming", "Sliding Window"] },
              { id: "prefix-kv-cache", title: "Prefix Cache / KV Cache Reuse", summary: "复用稳定上下文前缀或模型 KV 状态。", description: "通过 Prompt Prefix Cache 或推理服务 KV Cache 复用重复的系统指令和上下文前缀；缓存命中依赖前缀一致性、模型和服务端策略。", tags: ["Prefix Cache", "KV Cache"] },
              {
                id: "codex-context-compaction",
                title: "Codex · Automatic Context Compaction",
                summary: "接近上下文限制时生成压缩摘要并替换历史上下文。",
                description: "Codex 的 compact 模块维护压缩触发、摘要生成、历史替换和压缩元数据；支持压缩前后 Hook、保留待处理输入和不同压缩策略。压缩后的摘要属于当前线程上下文管理，不等同于跨会话 Local Memories。",
                points: [
                  "自动压缩由上下文预算和运行策略触发。",
                  "压缩历史会记录元数据并替换会话历史片段。",
                  "PreCompact / PostCompact Hook 可在压缩前后执行额外逻辑。"
                ],
                tags: ["Codex", "Compaction", "Context Window"],
                resources: [
                  { label: "Codex Context Compaction", url: "https://github.com/openai/codex/blob/main/codex-rs/core/src/compact.rs" }
                ]
              }
            ],
            ["Token Budget", "Compaction", "Trimming", "Cache"]
          ),
          capability(
            "context-provenance-trust",
            "上下文来源与信任 Context Provenance & Trust",
            "标注上下文来源、信任等级和可引用证据边界。",
            "模型看到的文本不都具有相同权威性。系统需要区分可信指令、用户内容、外部文档、网页、工具输出和历史记忆；将不可信内容作为数据传递，并保留可追溯来源。",
            [
              { id: "annotated-context-fragments", title: "Annotated Context Fragments", summary: "为上下文片段附加来源、类型和信任标记。", description: "将上下文拆成带 metadata 的片段，记录来源、时间、权限、信任级别和引用 ID；在序列化到 Prompt 时保留边界。", tags: ["Annotations", "Provenance"] },
              { id: "untrusted-region-delimiters", title: "Untrusted Region Delimiters", summary: "明确标记网页、工具和外部文件中的不可信内容。", description: "使用结构化消息类型或明确边界包裹外部内容，告诉模型这些文本仅供分析，不能覆盖当前指令或触发未经授权的动作。", tags: ["Untrusted Input", "Prompt Injection"] },
              { id: "citation-linked-context", title: "Citation-linked Context", summary: "让生成结论可以回溯到具体上下文片段。", description: "为检索片段和历史记录分配稳定引用 ID，生成时保留结论与证据之间的关联；回答前检查引用是否真实支持对应结论。", tags: ["Citation", "Evidence"] }
            ],
            ["Provenance", "Trust Boundary", "Citation"]
          ),
        ]
      ),
      moduleNode(
        "model-runtime",
        "模型运行时 Model Runtime",
        "统一接入模型供应商，管理模型路由、调用策略和多模态能力。",
        "模型运行时将上层 Agent 逻辑与模型供应商 API 解耦，负责模型选择、参数管理、流式响应、降级和调用成本治理。",
        "#7384A5",
        ["LLM", "Gateway", "Streaming"],
        [
          capability(
            "model-routing",
            "模型路由 Model Routing",
            "根据任务能力、成本、延迟和可用性选择模型。",
            "路由策略应可解释、可观测，并保留故障回退。不要只按模型名称硬编码业务逻辑。",
            [
              { id: "capability-router", title: "Capability-based Router", summary: "按推理、视觉、长上下文等能力路由。", description: "维护模型能力目录，根据任务标签和输入模态选择满足约束的模型。", tags: ["Routing", "Capabilities"] },
              { id: "cost-latency-router", title: "Cost / Latency Router", summary: "按预算和响应时间选择模型。", description: "根据 Token 价格、历史延迟、速率限制和任务优先级选择模型，必要时降级。", tags: ["Cost", "Latency"] },
              { id: "fallback-chain", title: "Fallback Chain", summary: "主模型不可用时切换备用模型。", description: "配置主备模型、错误分类、熔断和重试，确保回退模型满足基本能力和安全要求。", tags: ["Fallback", "Circuit Breaker"] },
              { id: "codex-provider-catalog-example", title: "Codex · Provider & Model Catalog", summary: "通过 Provider 抽象、模型目录和认证适配接入不同模型供应商。", description: "Codex 将 Provider、模型能力、模型目录、认证和请求准备拆分为独立模块；具体可用模型和特性由 Provider 能力信息决定，而不是仅靠模型名称推断。", tags: ["Codex", "Provider Adapter", "Model Catalog"], resources: [{ label: "Codex Model Provider", url: "https://github.com/openai/codex/tree/main/codex-rs/model-provider/src" }] }
            ],
            ["Routing", "Fallback", "Cost"]
          ),
          capability(
            "provider-adapters",
            "供应商适配 Provider Adapters",
            "将不同模型 API 统一为内部调用接口。",
            "适配层统一消息结构、工具调用、错误码和 Token 统计，减少上层代码对特定供应商协议的耦合。",
            [
              { id: "provider-abstraction", title: "Provider Abstraction", summary: "定义统一的模型调用接口。", description: "抽象 messages、tools、response format、usage 和 error，使不同供应商适配到同一内部协议。", tags: ["Adapter", "Abstraction"] },
              { id: "openai-compatible-api", title: "OpenAI-compatible API", summary: "通过兼容协议接入不同模型服务。", description: "使用兼容 Chat Completions 或 Responses 的接口接入自托管和第三方模型，并对不兼容特性做能力检测。", tags: ["API Compatibility"] },
              { id: "litellm-gateway", title: "LiteLLM Gateway", summary: "统一代理多个模型供应商。", description: "使用 LiteLLM 统一模型名称、密钥、预算、日志和回退策略，作为模型访问网关。", tags: ["LiteLLM", "Gateway"], resources: [{ label: "LiteLLM Documentation", url: "https://docs.litellm.ai/" }] }
            ],
            ["Adapter", "Gateway", "Providers"]
          ),
          capability(
            "streaming-multimodal",
            "流式与多模态生成 Streaming & Multimodal",
            "处理流式文本、音频和其他多模态模型输出。",
            "模型输出可能是文本片段、工具调用增量或音频数据。调用层应统一事件协议，并正确处理取消、断连和最终 usage。",
            [
              { id: "sse-streaming", title: "SSE Streaming", summary: "通过 Server-Sent Events 推送生成增量。", description: "将模型流转换为稳定事件格式，处理首 Token 时间、断连、取消和流结束事件。", tags: ["SSE", "Streaming"] },
              { id: "realtime-audio", title: "Realtime Audio", summary: "处理语音输入输出和实时双向交互。", description: "管理音频分块、转写、打断、端点检测和会话状态，区分实时语音与离线转写链路。", tags: ["Audio", "Realtime"] },
              { id: "multimodal-output", title: "Multimodal Output Adapter", summary: "统一处理文本、图像和结构化多模态输出。", description: "解析模型响应中的文本、图像引用、音频片段和工具调用，按客户端能力转换为可呈现事件。", tags: ["Multimodal", "Output"] }
            ],
            ["Streaming", "Audio", "Multimodal"]
          ),
          capability(
            "inference-serving",
            "模型推理服务 Inference Serving",
            "将模型权重部署为可被 Agent 调用的在线或本地推理服务。",
            "模型运行时不仅是 API Adapter，还包括模型加载、GPU/CPU 调度、批处理、并发、显存管理、流式生成和服务健康。部署形态可为托管 API、本地进程或集群推理服务。",
            [
              { id: "hosted-model-api", title: "Hosted Model API", summary: "通过云端供应商 API 调用托管模型。", description: "使用云端模型 API 管理认证、速率限制、区域、服务等级和请求重试；适合不希望自行管理模型权重和 GPU 的 Agent。", tags: ["Hosted API", "Cloud Inference"] },
              { id: "vllm-serving", title: "vLLM / PagedAttention", summary: "通过高吞吐 GPU 推理引擎部署开源模型。", description: "vLLM 使用 PagedAttention 管理 KV Cache，并支持连续批处理和 OpenAI-compatible Server；适合多请求并发的模型服务。", tags: ["vLLM", "PagedAttention", "GPU"] },
              { id: "sglang-tgi-serving", title: "SGLang / Text Generation Inference", summary: "使用专用推理服务器管理请求调度和生成。", description: "SGLang、TGI 等推理服务提供模型加载、批处理、流式输出和硬件优化；需根据模型架构、并发模式和部署平台选择。", tags: ["SGLang", "TGI", "Serving"] },
              { id: "local-model-runtime", title: "Ollama / llama.cpp / MLX", summary: "在本机或边缘设备运行量化模型。", description: "使用 Ollama、llama.cpp 或 MLX 在本地 CPU/GPU/Apple Silicon 上加载模型，适合隐私、离线或开发场景；需权衡模型尺寸、速度和能力。", tags: ["Ollama", "llama.cpp", "MLX", "Local LLM"] },
              { id: "multi-gpu-model-parallelism", title: "Tensor / Pipeline / Expert Parallelism", summary: "将大模型分布到多张 GPU 或多个计算节点。", description: "使用 Tensor Parallel、Pipeline Parallel 或 Expert Parallel 拆分模型计算与权重，处理显存容量和吞吐扩展；需要考虑通信开销和故障恢复。", tags: ["Tensor Parallel", "Pipeline Parallel", "MoE"] }
            ],
            ["Inference", "vLLM", "SGLang", "TGI", "Local Runtime"]
          ),
          capability(
            "inference-optimization",
            "推理性能优化 Inference Optimization",
            "降低 Token 延迟、显存占用和单位请求成本。",
            "推理性能由模型大小、KV Cache、批处理、解码策略、量化和硬件共同决定。优化时应同时衡量首 Token 延迟、每 Token 延迟、吞吐、质量和显存。",
            [
              { id: "continuous-batching", title: "Continuous / Dynamic Batching", summary: "动态合并并发请求以提高 GPU 利用率。", description: "在生成过程中动态加入和移出请求，减少静态批处理的空闲；需要控制排队延迟和长短请求之间的公平性。", tags: ["Continuous Batching", "Throughput"] },
              { id: "kv-cache-paged-attention", title: "KV Cache / PagedAttention", summary: "缓存历史 Key / Value 并降低重复计算。", description: "在自回归生成中复用历史 KV 状态；通过分页管理减少显存碎片，并在会话隔离和缓存淘汰上设置边界。", tags: ["KV Cache", "PagedAttention"] },
              { id: "model-quantization", title: "Quantization · INT8 / INT4 / FP8", summary: "使用低精度权重和计算降低模型资源需求。", description: "通过权重量化、激活量化或 KV Cache 量化降低显存和带宽；需要在目标任务上评估精度损失、算子支持和量化校准。", tags: ["INT8", "INT4", "FP8", "Quantization"] },
              { id: "speculative-decoding", title: "Speculative Decoding", summary: "用小模型提出候选 Token，再由大模型并行验证。", description: "通过 Draft Model 或辅助预测头生成候选 Token，由目标模型验证并接受部分候选；收益取决于候选接受率和模型组合。", tags: ["Speculative Decoding", "Draft Model"] },
              { id: "prefix-prompt-caching", title: "Prefix / Prompt Cache", summary: "复用重复的系统提示和上下文前缀。", description: "缓存稳定 Prompt 前缀的计算结果，减少重复 Prefill 成本；必须考虑缓存键、租户隔离、过期策略和敏感数据风险。", tags: ["Prompt Cache", "Prefix Cache"] }
            ],
            ["Batching", "KV Cache", "Quantization", "Speculative Decoding"]
          ),
          capability(
            "model-adaptation-decoding",
            "模型适配与生成控制 Model Adaptation & Decoding",
            "通过模型适配、解码参数和受约束生成满足不同 Agent 任务。",
            "模型选择之外，还可以调整模型行为和输出空间。应区分改变模型权重的适配技术、改变采样过程的解码策略，以及约束输出格式的解码机制。",
            [
              { id: "lora-peft-finetuning", title: "Fine-tuning / LoRA / PEFT", summary: "使用领域数据适配模型权重或低秩参数。", description: "通过监督微调、LoRA 或 PEFT 学习特定任务格式和领域行为；需要高质量数据、训练评估、版本治理和回滚。", tags: ["Fine-tuning", "LoRA", "PEFT"] },
              { id: "distillation-model-adaptation", title: "Knowledge Distillation", summary: "将较大模型的能力迁移到更小模型。", description: "使用教师模型输出、轨迹或偏好数据训练学生模型，降低部署成本；应验证学生模型在关键任务和安全场景中的能力保持。", tags: ["Distillation", "Student Model"] },
              { id: "sampling-decoding-controls", title: "Sampling · Temperature / Top-p / Top-k", summary: "控制 Token 采样的随机性和候选范围。", description: "通过 Temperature、Top-p、Top-k 和重复惩罚调整生成多样性；事实抽取和结构化任务通常需要更稳定的解码配置。", tags: ["Temperature", "Top-p", "Top-k"] },
              { id: "constrained-decoding-grammar", title: "Constrained Decoding / Grammar", summary: "限制模型只能生成满足语法或 Schema 的输出。", description: "使用 JSON Schema、CFG 或有限状态机约束 Token 生成，使输出符合工具参数或业务格式；仍需独立验证语义正确性和权限。", tags: ["Constrained Decoding", "Grammar", "JSON Schema"] },
              { id: "tool-call-protocol-parser", title: "Tool-call Protocol Parser", summary: "解析模型的工具调用、参数和流式增量。", description: "将模型协议中的 Tool Call、Arguments Delta 和结束状态转换为内部调用对象；处理不完整 JSON、重复调用 ID 和协议版本差异。", tags: ["Tool Calling", "Protocol Parser", "Streaming"] }
            ],
            ["Fine-tuning", "LoRA", "Decoding", "Constrained Output"]
          ),
        ]
      ),
      moduleNode(
        "evaluation-observability",
        "评估与可观测性 Evaluation",
        "衡量 Agent 的任务效果、执行轨迹、性能成本和版本变化。",
        "评估与可观测性为 Agent 提供反馈闭环。既要判断任务最终是否完成，也要观察每次模型调用、检索和工具执行，定位失败原因并持续回归。",
        "#7D88A7",
        ["Evals", "Tracing", "Metrics"],
        [
          capability(
            "evaluation-datasets",
            "评测数据与任务成功率 Evals",
            "建立可重复的数据集和评分标准，量化 Agent 任务表现。",
            "评测集应覆盖常见路径、边界条件和对抗样本，并将主观质量与可程序化指标分开。",
            [
              { id: "golden-dataset", title: "Golden Dataset", summary: "维护代表性任务和标准结果。", description: "收集真实任务、人工标注和边界样本，版本化保存输入、预期结果和评分标准。", tags: ["Dataset", "Ground Truth"] },
              { id: "environment-simulator", title: "Environment Simulator", summary: "在可控环境中模拟工具和外部系统。", description: "使用 Mock API、测试数据库和模拟浏览器构造可重复环境，覆盖成功、超时和异常路径。", tags: ["Simulation", "Mock"] },
              { id: "llm-as-judge", title: "LLM-as-a-Judge", summary: "使用评审模型评价开放式输出质量。", description: "定义评分 Rubric、成对比较和理由输出，对评审器做人工抽检和偏差校准。", tags: ["LLM Judge", "Rubric"] }
            ],
            ["Dataset", "Simulation", "Judge"]
          ),
          capability(
            "tracing-debugging",
            "执行追踪与调试 Tracing",
            "记录模型、工具、检索和状态变更的完整调用链。",
            "一次 Agent 任务可能跨越多个模型和外部系统。Trace 应能串联每个 Span，并在保护隐私的前提下保留足够的调试信息。",
            [
              { id: "opentelemetry", title: "OpenTelemetry", summary: "使用标准 Trace / Span 采集执行链路。", description: "为请求、模型调用、工具和检索创建 Span，统一 trace_id、span_id、属性和异常记录。", tags: ["OpenTelemetry", "Tracing"], resources: [{ label: "OpenTelemetry", url: "https://opentelemetry.io/docs/" }] },
              { id: "langfuse-tracing", title: "Langfuse", summary: "追踪 LLM 调用、Prompt 和 Token 成本。", description: "记录模型输入输出、Prompt 版本、工具调用、用户反馈和 Token usage，支持会话级排查。", tags: ["Langfuse", "LLM Observability"], resources: [{ label: "Langfuse Docs", url: "https://langfuse.com/docs" }] },
              { id: "phoenix-tracing", title: "Arize Phoenix", summary: "分析 LLM Trace 和检索质量。", description: "采集 LLM 和 RAG Trace，检查检索片段、模型输出和调用耗时，辅助调试与评估。", tags: ["Phoenix", "RAG Tracing"], resources: [{ label: "Phoenix Documentation", url: "https://arize.com/docs/phoenix" }] }
            ],
            ["Trace", "Span", "Debug"]
          ),
          capability(
            "runtime-metrics",
            "运行指标 Metrics",
            "从效果、性能、成本和安全维度监控 Agent。",
            "指标需要与真实业务目标关联，并按任务类型、模型版本和工具维度切分，避免只观察平均延迟或总 Token 数。",
            [
              { id: "task-quality-metrics", title: "Task Quality Metrics", summary: "衡量完成率、准确率和人工接管率。", description: "统计任务成功率、用户采纳率、返工率、事实错误率和人工升级比例。", tags: ["Success Rate", "Quality"] },
              { id: "latency-metrics", title: "Latency / Throughput", summary: "监控端到端延迟和系统吞吐。", description: "记录 P50/P95/P99 延迟、首 Token 时间、工具耗时、队列等待和超时率。", tags: ["P95", "Throughput", "SLO"] },
              { id: "cost-metrics", title: "Cost / Token Metrics", summary: "追踪单任务模型与工具成本。", description: "按任务和模型统计输入输出 Token、调用次数、工具成本和缓存命中率，定位成本异常。", tags: ["Token", "Budget", "Cost"] },
              { id: "codex-memory-pipeline-metrics", title: "Codex · Memory Pipeline Telemetry", summary: "分别监控 Phase 1、Phase 2、记忆工具和存储规模。", description: "Codex 为记忆流水线记录阶段耗时、任务成功/失败/无输出数量、Token 使用、Memory Search/List/Read 工具调用结果与截断状态，以及本地记忆工作区大小；指标按 v1/v2 版本标记。", tags: ["Codex", "OpenTelemetry", "Pipeline Metrics"], resources: [{ label: "Codex Memory Metrics", url: "https://github.com/openai/codex/tree/main/codex-rs/memories/write/src" }] }
            ],
            ["Quality", "Latency", "Cost"]
          ),
          capability(
            "regression-release",
            "回归测试与发布 Regression",
            "将模型、Prompt、工具和知识库变化纳入发布质量门禁。",
            "Agent 行为会随模型版本和上下文变化。发布应使用固定基准集、灰度流量和快速回滚机制。",
            [
              { id: "agent-ci-eval", title: "CI Evaluation Gate", summary: "在 CI 中运行关键任务回归评测。", description: "每次代码、Prompt 或模型配置变更后运行基准任务，对成功率、成本和安全指标设置门槛。", tags: ["CI", "Regression"] },
              { id: "ab-canary", title: "A/B Test / Canary", summary: "通过灰度和对照实验验证新版本。", description: "将流量分配给基线和候选版本，监控质量、延迟、成本和用户反馈，达到门槛后逐步放量。", tags: ["A/B", "Canary"] },
              { id: "failure-replay", title: "Failure Replay", summary: "重放线上失败轨迹并沉淀回归用例。", description: "脱敏保存输入、模型版本、工具结果和状态快照，在隔离环境中重放并验证修复是否有效。", tags: ["Replay", "Debugging"] }
            ],
            ["CI", "Canary", "Replay"]
          ),
          capability(
            "agent-trajectory-evaluation",
            "Agent 轨迹与过程评估 Agent Trajectory Evaluation",
            "评估 Agent 每一步决策、工具选择和状态转移是否合理。",
            "只看最终答案无法判断 Agent 是否使用了错误工具、执行了多余步骤或造成不必要副作用。轨迹评估应关联计划、模型响应、工具调用、工具结果和最终环境状态。",
            [
              { id: "tool-selection-evaluation", title: "Tool Selection / Argument Evaluation", summary: "评估工具选择是否正确、参数是否完整。", description: "根据任务目标和可用工具集，检查调用的工具、参数、调用顺序和权限边界；使用人工标注、规则或 LLM Judge 评分。", tags: ["Tool Use", "Arguments", "Tool Accuracy"] },
              { id: "trajectory-step-evaluation", title: "Trajectory / Step-level Evaluation", summary: "对 Agent 的中间步骤和行动轨迹逐步评分。", description: "将执行轨迹拆成计划、推理摘要、工具行动、观察和状态变化，识别无效循环、遗漏步骤、错误假设和过度调用。", tags: ["Trajectory", "Step-level Eval"] },
              { id: "environment-state-evaluation", title: "Environment State / Outcome Verification", summary: "通过外部状态确认任务是否真正完成。", description: "检查文件、数据库、网页、工单或业务系统的最终状态，而不是只依赖 Agent 自述成功；对部分完成和副作用定义明确判定。", tags: ["Outcome", "State Verification"] },
              { id: "plan-quality-evaluation", title: "Plan Quality / Efficiency Evaluation", summary: "评估计划的可行性、覆盖率和执行成本。", description: "衡量计划是否满足约束、是否存在依赖遗漏、是否选择了合理并行度，以及是否以更低工具和 Token 成本达到相同结果。", tags: ["Planning", "Efficiency"] }
            ],
            ["Trajectory", "Tool Use", "Outcome", "Plan Quality"]
          ),
          capability(
            "rag-evaluation",
            "检索与知识质量评估 RAG Evaluation",
            "分别评估检索召回质量、证据质量和答案忠实度。",
            "RAG 评估需要将检索器和生成器分开测量。检索结果正确不代表答案忠实，答案看似合理也不代表引用证据支持结论。",
            [
              { id: "retrieval-recall-precision", title: "Recall@k / Precision@k / MRR / nDCG", summary: "衡量相关文档是否被召回以及排序是否合理。", description: "使用标注 Query-Document 对评估 Recall@k、Precision@k、MRR 和 nDCG；按 Query 类型和语料分层，定位召回和排序问题。", tags: ["Recall@k", "MRR", "nDCG"] },
              { id: "rag-faithfulness-groundedness", title: "Faithfulness / Groundedness", summary: "检查答案是否由检索证据支持。", description: "将答案拆成原子声明，检查每条声明是否被上下文蕴含；区分无证据陈述、证据矛盾和合理推断。", tags: ["Faithfulness", "Groundedness"] },
              { id: "rag-context-relevance", title: "Context Precision / Context Recall", summary: "衡量提供给生成模型的上下文是否相关且充分。", description: "检查检索上下文是否包含回答问题所需的证据，以及无关片段占比；用于比较 Chunking、Query Rewrite 和 Reranker 配置。", tags: ["Context Precision", "Context Recall"] },
              { id: "citation-correctness-eval", title: "Citation Correctness / Coverage", summary: "评估引用是否真实存在并覆盖答案关键结论。", description: "验证引用标识、来源范围和内容匹配，测量关键声明的引用覆盖率；对错误引用、过宽引用和无关引用分别计分。", tags: ["Citation", "Attribution", "Coverage"] }
            ],
            ["Recall", "MRR", "Faithfulness", "Citation"]
          ),
          capability(
            "safety-redteam-evaluation",
            "安全评估与红队测试 Safety Evals & Red Teaming",
            "系统性测试 Agent 在恶意输入和高风险环境下的行为。",
            "安全评估应覆盖模型、上下文、工具、记忆、插件和外部环境。测试集需要包含攻击成功与失败样本，并检查实际副作用和数据泄露，而不只判断文本是否拒绝。",
            [
              { id: "prompt-injection-redteam", title: "Prompt Injection / Indirect Injection Tests", summary: "测试网页、文档和工具结果中的间接提示注入。", description: "在检索文档、网页、邮件和工具输出中嵌入恶意指令，检查 Agent 是否越权调用工具或泄露上下文；覆盖多轮和多 Agent 传播路径。", tags: ["Prompt Injection", "Indirect Injection"] },
              { id: "tool-abuse-evaluation", title: "Tool Abuse / Destructive Action Tests", summary: "测试工具越权、重复执行和危险副作用。", description: "构造删除、发送、支付、部署和权限变更场景，验证审批、参数边界、幂等、取消和后置状态检查。", tags: ["Tool Abuse", "Destructive Actions"] },
              { id: "data-exfiltration-evaluation", title: "Data Exfiltration / Privacy Tests", summary: "测试敏感数据是否会通过回答或工具外传。", description: "构造跨用户数据、秘密文件、提示词和凭证泄露场景，检查模型输出、日志、记忆、第三方工具和网络请求。", tags: ["Data Leakage", "Privacy", "Secrets"] },
              { id: "jailbreak-adversarial-eval", title: "Jailbreak / Adversarial Robustness", summary: "测试对抗性输入和越狱提示下的策略稳定性。", description: "使用变体提示、编码混淆、多语言攻击和多轮诱导评估策略鲁棒性；记录攻击路径、成功条件和修复回归用例。", tags: ["Jailbreak", "Adversarial", "Red Team"] }
            ],
            ["Red Team", "Prompt Injection", "Tool Abuse", "Privacy"]
          ),
          capability(
            "online-evaluation-feedback",
            "在线评估与用户反馈 Online Evaluation",
            "通过真实流量、用户反馈和版本实验持续监控 Agent 质量。",
            "离线基准无法覆盖真实用户分布和外部系统变化。在线评估应采用灰度、对照实验、用户反馈和漂移监测，并在质量或安全指标退化时触发回滚。",
            [
              { id: "human-review-feedback", title: "Human Review / User Feedback", summary: "采集人工审核、用户纠正和任务采纳情况。", description: "将点赞、纠正、重试、人工接管和最终采纳等信号关联到任务轨迹；区分主观满意度与客观任务成功。", tags: ["Human Review", "User Feedback"] },
              { id: "online-shadow-evaluation", title: "Shadow / Online Evaluation", summary: "在真实请求上并行评估候选版本而不影响用户结果。", description: "将脱敏流量复制到候选模型或 Prompt，比较输出质量、延迟和成本；限制副作用，候选版本不能执行真实写操作。", tags: ["Shadow", "Online Eval"] },
              { id: "quality-drift-monitoring", title: "Quality Drift / Data Drift Monitoring", summary: "发现模型、用户任务和外部环境变化导致的质量退化。", description: "按任务类别、模型版本和工具环境监控指标分布；使用基线比较和阈值告警触发复评、回滚或数据集更新。", tags: ["Drift", "Monitoring", "Alerting"] },
              { id: "release-gate-rollback", title: "Quality Gate / Automatic Rollback", summary: "将质量和安全指标设为发布门槛。", description: "为成功率、事实性、安全事件、成本和延迟设置门槛；灰度期间超限时停止放量或回滚到已验证版本。", tags: ["Release Gate", "Rollback", "Canary"] }
            ],
            ["Online Eval", "Feedback", "Drift", "Release Gate"]
          ),
        ]
      ),
      moduleNode(
        "security-governance",
        "安全与治理 Security",
        "保护 Agent、用户数据和外部系统，约束高风险行为。",
        "安全治理是横切模块，覆盖感知、记忆、模型、工具和运行时。提示词只能提供引导，真正的安全边界必须由权限系统、隔离执行、数据治理和审计机制保证。",
        "#B97955",
        ["Prompt Injection", "IAM", "Privacy"],
        [
          capability(
            "prompt-injection-defense",
            "提示注入防护 Prompt Injection",
            "识别并隔离来自用户、网页、文档和工具结果的恶意指令。",
            "所有外部内容都应视为不可信数据。不能让检索文档或网页内容覆盖系统规则，也不能让模型自行决定是否突破工具权限。",
            [
              { id: "trust-boundary", title: "Trust Boundary Separation", summary: "区分可信指令与不可信内容。", description: "将系统指令、用户请求、检索资料和工具结果分层传递，对不可信片段添加明确边界和来源标记。", tags: ["Trust Boundary", "Untrusted Input"] },
              { id: "tool-allowlist", title: "Tool Allowlist / Policy", summary: "使用工具白名单和策略限制可执行动作。", description: "按任务和用户身份限制工具集合、参数范围、目标域名和副作用，执行前进行服务端策略检查。", tags: ["Allowlist", "Policy"] },
              { id: "output-sanitization", title: "Output Sanitization", summary: "过滤不安全输出和可执行内容。", description: "对 HTML、Markdown、URL 和文件产物进行安全处理，避免脚本注入、危险链接和不可信内容直接执行。", tags: ["Sanitization", "XSS"] },
              { id: "codex-memory-untrusted-rollout", title: "Codex · Historical Memory as Untrusted Evidence", summary: "读取历史 Rollout 时把其中的指令视为数据，不允许覆盖当前规则。", description: "Codex v2 Read Path 明确要求不要执行历史 Rollout 中出现的指令；记忆摘要只提供历史背景，不能证明当前行为。对于会变化或影响重大的事实，应检查当前权威来源并说明不确定性。", tags: ["Codex", "Prompt Injection", "Untrusted Data"], resources: [{ label: "Codex v2 Read Path", url: "https://github.com/openai/codex/blob/main/codex-rs/ext/memories/templates/memories/read_path_v2.md" }] }
            ],
            ["Injection", "Trust", "Guardrails"]
          ),
          capability(
            "identity-access",
            "身份与访问控制 IAM",
            "确认当前主体身份，并对每次资源访问执行授权。",
            "用户身份、Agent 身份和工具凭证应分离。授权要按资源和动作细粒度执行，默认拒绝未明确授权的操作。",
            [
              { id: "rbac-abac", title: "RBAC / ABAC", summary: "按角色或属性决定资源访问权限。", description: "使用角色权限或主体、资源、动作和环境属性进行策略决策，并在服务端对每次操作重新授权。", tags: ["RBAC", "ABAC"] },
              { id: "oauth-oidc", title: "OAuth 2.0 / OIDC", summary: "使用标准身份认证和委托授权。", description: "使用 OIDC 验证身份，OAuth Scope 限定授权范围，采用短期 Token 和可撤销授权。", tags: ["OAuth", "OIDC"] },
              { id: "secrets-manager", title: "Secrets Manager", summary: "安全存储和轮换 API Key 与凭证。", description: "通过云密钥管理服务或 Vault 保存凭证，避免将长期密钥暴露给模型、Prompt、日志或前端。", tags: ["Vault", "KMS", "Secrets"] }
            ],
            ["Identity", "Authorization", "Secrets"]
          ),
          capability(
            "data-privacy",
            "数据隐私与治理 Data Privacy",
            "控制敏感信息的采集、使用、存储、保留和删除。",
            "记忆和日志可能包含个人信息与业务机密。数据治理需要贯穿采集、模型调用、存储、检索和删除全链路。",
            [
              { id: "pii-redaction", title: "PII Detection / Redaction", summary: "识别并脱敏个人敏感信息。", description: "使用规则、NER 或 DLP 检测邮箱、电话、证件号和敏感字段，在日志和外部模型调用前按策略脱敏。", tags: ["PII", "DLP", "Redaction"] },
              { id: "encryption", title: "Encryption at Rest / Transit", summary: "保护传输中和持久化的数据。", description: "使用 TLS 保护传输，使用 KMS 管理静态数据加密密钥，并限制密钥访问和轮换。", tags: ["TLS", "KMS", "Encryption"] },
              { id: "retention-deletion", title: "Retention / Deletion Policy", summary: "按数据类型执行保留和删除策略。", description: "定义日志、记忆和文档的保留周期，删除时同步清理缓存、索引和派生数据，并保留必要审计。", tags: ["Retention", "Deletion"] },
              { id: "codex-secret-redaction", title: "Codex · Memory Secret Redaction", summary: "在 Rollout 输入与结构化提取结果中执行密钥脱敏。", description: "Codex 在构建记忆输入时筛选响应内容，并在解析提取结果后对 raw_memory、rollout_summary 和 rollout_slug 执行 Secret Redaction；v2 还对摘要长度进行限制。", tags: ["Codex", "Secret Redaction", "Data Minimization"], resources: [{ label: "Codex Stage One Output", url: "https://github.com/openai/codex/blob/main/codex-rs/memories/write/src/phase1_output.rs" }] }
            ],
            ["PII", "Encryption", "Retention"]
          ),
          capability(
            "runtime-guardrails",
            "运行时安全与韧性 Runtime Guardrails",
            "通过预算、限流、审计和故障保护控制系统风险。",
            "Agent 可能循环调用、过度消耗 Token 或重复执行操作。运行时必须为任务、模型和工具设置明确的资源与安全边界。",
            [
              { id: "rate-limit-circuit-breaker", title: "Rate Limit / Circuit Breaker", summary: "限制调用速率并隔离持续故障服务。", description: "按用户、模型和工具设置限流，使用熔断和半开探测避免故障扩散。", tags: ["Rate Limit", "Circuit Breaker"] },
              { id: "agent-budget", title: "Agent Budget", summary: "限制 Token、工具次数、时间和并发。", description: "为单任务设置最大循环步数、模型调用数、Token 预算、执行时间和工具调用次数，超限后暂停或转人工。", tags: ["Budget", "Token", "Limits"] },
              { id: "audit-log", title: "Audit Log", summary: "记录敏感决策、审批和外部副作用。", description: "记录主体、动作、资源、参数摘要、授权结果、审批信息和执行结果，提供关联 ID 和防篡改存储。", tags: ["Audit", "Compliance"] },
              { id: "codex-consolidation-sandbox", title: "Codex · Sandboxed Consolidation Agent", summary: "整合 Agent 禁止网络访问，只能在本地记忆工作区内写入。", description: "Codex Phase 2 为内部 Consolidation Agent 创建受限配置：关闭 MCP Servers、Apps Instructions、Collab 和记忆读写，设置 no-network sandbox 与本地工作区写入边界，并在完成后校验记忆产物。", tags: ["Codex", "Sandbox", "No Network", "Least Privilege"], resources: [{ label: "Codex Phase 2 Implementation", url: "https://github.com/openai/codex/blob/main/codex-rs/memories/write/src/phase2.rs" }] }
            ],
            ["Rate Limit", "Budget", "Audit"]
          ),
          capability(
            "agent-threat-modeling",
            "Agent 威胁建模 Agent Threat Modeling",
            "识别 Agent 在输入、推理、工具、记忆和外部执行中的攻击面。",
            "Agent 的攻击面跨越自然语言、模型上下文、插件、工具和真实环境。威胁建模应覆盖直接与间接提示注入、工具参数操纵、记忆投毒、数据外传、越权执行和资源耗尽。",
            [
              { id: "indirect-prompt-injection", title: "Indirect Prompt Injection", summary: "防御网页、邮件、文档和工具结果中的恶意指令。", description: "将外部内容视为不可信数据，使用来源标记、工具白名单和执行前策略检查；测试恶意指令是否能改变工具参数或泄露系统上下文。", tags: ["Indirect Injection", "Untrusted Content"] },
              { id: "memory-poisoning-defense", title: "Memory / RAG Poisoning Defense", summary: "防止恶意或错误内容进入长期记忆和知识索引。", description: "记录来源、写入主体和证据，限制自动写入范围，识别相互矛盾和异常高影响内容，并提供纠正、删除和来源审计。", tags: ["Memory Poisoning", "RAG Poisoning"] },
              { id: "tool-output-injection-defense", title: "Tool Output Injection Defense", summary: "防止工具返回内容诱导 Agent 执行未经授权的操作。", description: "对工具结果设置不可信边界；模型提出后续动作时重新执行参数验证、权限检查和人工审批，不继承工具内容中的授权声明。", tags: ["Tool Output", "Trust Boundary"] },
              { id: "ssrf-data-exfiltration-defense", title: "SSRF / Data Exfiltration Defense", summary: "限制 Agent 通过 URL、文件和工具接口访问内部资源或外传数据。", description: "对目标域名、IP 段、重定向、DNS 解析、文件路径和网络出口执行可信服务端校验；禁止模型自由构造可访问内网的请求。", tags: ["SSRF", "Egress Control", "Exfiltration"] },
              { id: "agent-resource-exhaustion", title: "Runaway Agent / Resource Exhaustion", summary: "防止无限循环、递归委派和资源消耗失控。", description: "设置任务时长、模型调用、Token、工具调用、并发和委派深度预算；通过循环检测、熔断和取消传播限制失控执行。", tags: ["Runaway Agent", "Resource Limits"] }
            ],
            ["Threat Modeling", "Injection", "Poisoning", "Exfiltration", "Resource Abuse"]
          ),
          capability(
            "tool-supply-chain-security",
            "工具与插件供应链安全 Tool / Plugin Supply Chain",
            "验证外部工具、MCP Server、Skill 和插件的来源与运行权限。",
            "Agent 扩展可能携带可执行脚本、网络访问和文件权限。安全模型应覆盖发现、安装、升级、运行和卸载全生命周期，并确保能力声明与实际权限一致。",
            [
              { id: "extension-source-trust", title: "Extension Source / Publisher Trust", summary: "验证插件、Skill 和 MCP Server 的发布来源。", description: "维护可信发布者、仓库和注册表来源；对来源不明、名称相似或被替换的扩展执行警告和人工审核。", tags: ["Publisher Trust", "Registry"] },
              { id: "dependency-sbom-scanning", title: "Dependency Scan / SBOM", summary: "扫描扩展依赖和已知漏洞。", description: "生成软件物料清单，扫描依赖漏洞、恶意包和许可证风险；对构建产物绑定版本与哈希，支持持续复查。", tags: ["SBOM", "SCA", "Vulnerability Scan"] },
              { id: "plugin-signature-integrity", title: "Artifact Signing / Integrity Verification", summary: "验证插件和工具制品未被篡改。", description: "通过签名、哈希和可信发布流水线验证安装包与脚本完整性；升级时重新验证来源、权限变化和依赖差异。", tags: ["Code Signing", "Integrity"] },
              { id: "capability-permission-review", title: "Capability Manifest / Permission Review", summary: "在安装和运行前审核扩展请求的权限。", description: "对文件、网络、Shell、账户和数据访问权限做最小授权；权限扩大或发布者变化时要求重新审核。", tags: ["Capability Manifest", "Least Privilege"] },
              { id: "extension-isolation", title: "Extension Isolation / Revocation", summary: "隔离第三方扩展并支持快速停用和撤销。", description: "在独立进程、容器或受限运行时执行扩展，限制凭证传递和网络出口；发现异常时撤销令牌、禁用扩展并保留审计证据。", tags: ["Isolation", "Revocation"] }
            ],
            ["Supply Chain", "SBOM", "Signing", "Permissions", "Isolation"]
          ),
          capability(
            "data-governance-compliance",
            "数据治理与合规 Data Governance",
            "管理 Agent 数据的分类、访问、地域、保留和删除要求。",
            "Agent 会处理用户内容、企业数据、凭证和模型生成的派生数据。治理策略必须覆盖原始输入、上下文、记忆、索引、日志、缓存和备份，确保数据用途与保留范围可审计。",
            [
              { id: "data-classification-labeling", title: "Data Classification / Labeling", summary: "按敏感级别和业务用途标记数据。", description: "定义公开、内部、机密和受监管数据分类，为每个来源和派生片段附加标签；下游模型、工具和存储策略根据标签执行。", tags: ["Classification", "Data Labels"] },
              { id: "data-residency-boundary", title: "Data Residency / Processing Boundary", summary: "控制数据存储和模型处理的地域范围。", description: "根据用户、租户和法规要求约束数据所在区域、模型供应商和日志出口；跨区域传输需要明确授权和审计。", tags: ["Data Residency", "Regional Processing"] },
              { id: "consent-purpose-limitation", title: "Consent / Purpose Limitation", summary: "确保数据采集和二次使用符合用户授权目的。", description: "记录用户同意范围、数据用途和撤回状态；禁止将仅用于当前任务的数据自动用于长期记忆、训练或无关分析。", tags: ["Consent", "Purpose Limitation"] },
              { id: "derived-data-deletion", title: "Derived Data / Backup Deletion", summary: "将删除要求传播到摘要、索引、缓存和备份。", description: "建立数据血缘和派生关系，删除原始记录时同步处理摘要、向量、搜索索引、缓存和备份；记录完成状态和不可立即删除的例外。", tags: ["Data Lineage", "Deletion", "Backups"] },
              { id: "audit-retention-governance", title: "Audit / Retention Governance", summary: "定义可审计日志和不同数据类型的保留期限。", description: "为安全事件、工具副作用、审批和模型调用定义审计字段与保留周期；日志本身也应脱敏、访问控制和防篡改。", tags: ["Audit", "Retention", "Compliance"] }
            ],
            ["Classification", "Residency", "Consent", "Deletion", "Audit"]
          ),
        ]
      )
    ]
  }
);
