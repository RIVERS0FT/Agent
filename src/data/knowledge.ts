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
          )
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
              { id: "react", title: "ReAct", summary: "交替执行推理、工具行动与观察。", description: "在模型决策和工具反馈之间循环，将每次行动的观察结果加入下一轮上下文，并设置最大步数与停止条件。", tags: ["Reasoning", "Act", "Observe"] },
              { id: "plan-and-execute", title: "Plan-and-Execute", summary: "先规划，再按步骤执行和修订。", description: "由 Planner 生成计划，Executor 执行子任务，Verifier 检查产物；当依赖或环境发生变化时触发局部重规划。", tags: ["Planner", "Executor"] },
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
          )
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
          )
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
              { id: "execution-sandbox", title: "Execution Sandbox", summary: "隔离代码、文件和网络执行环境。", description: "使用容器、微虚拟机或受限运行时控制文件系统、网络出口、CPU、内存、进程和执行时间。", tags: ["Container", "MicroVM", "Isolation"] }
            ],
            ["OAuth", "Policy", "Sandbox"]
          )
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
              { id: "checkpoint-persistence", title: "Checkpoint Persistence", summary: "保存执行快照并支持断点恢复。", description: "在关键节点持久化状态、已完成步骤和执行游标，恢复时验证版本和副作用幂等性。", tags: ["Checkpoint", "Persistence"] }
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
          )
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
          )
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
              { id: "fallback-chain", title: "Fallback Chain", summary: "主模型不可用时切换备用模型。", description: "配置主备模型、错误分类、熔断和重试，确保回退模型满足基本能力和安全要求。", tags: ["Fallback", "Circuit Breaker"] }
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
          )
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
          )
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
          )
        ]
      )
    ]
  }
);
