import type { KnowledgeItem } from "../types";

export const knowledgeTree: KnowledgeItem = {
  id: "agent-root",
  title: "Agent 开发知识图谱",
  summary: "从目标理解、推理规划到工具执行与持续反馈，系统掌握构建可靠 Agent 的关键知识。",
  description: "Agent 是一个围绕目标持续运行的软件系统。它接收上下文，利用模型进行判断，通过工具影响外部世界，并根据执行结果更新状态。真正的 Agent 工程不只关乎模型调用，还包括任务边界、状态管理、工具契约、知识供给、评估、安全与运行时治理。",
  points: [
    "先定义任务与成功标准，再决定是否需要 Agent，而不是为使用 Agent 而使用 Agent。",
    "把模型、上下文、工具、状态、控制流和评估视为一个整体系统。",
    "从单 Agent、少工具、短流程开始，依据真实瓶颈逐步增加复杂度。"
  ],
  tags: ["LLM", "Reasoning", "Tools", "Memory", "Evaluation"],
  children: [
    {
      id: "fundamentals",
      title: "基础认知",
      summary: "理解 Agent 的定义、边界与基本运行闭环。",
      description: "基础认知回答三个问题：Agent 是什么、它与普通工作流有什么区别，以及它如何在环境中完成目标。掌握这些概念后，才能合理判断任务是否值得交给 Agent。",
      color: "#4E83E6",
      tags: ["Agent", "Workflow", "Loop"],
      points: [
        "Agent 的核心是目标驱动的循环，而不是一次性文本生成。",
        "自主性应按任务风险和可逆性分级，不是越高越好。",
        "确定性流程优先使用普通代码，开放式决策再交给模型。"
      ],
      children: [
        {
          id: "agent-definition",
          title: "Agent 是什么",
          summary: "模型在目标约束下感知、决策并采取行动。",
          description: "Agent 通常由模型、指令、工具、状态和控制循环组成。模型负责解释上下文与选择下一步，工具负责与外部系统交互，运行时负责调度、校验和保存状态。",
          points: [
            "输入不只是用户消息，还包括历史状态、检索结果和环境反馈。",
            "输出不只是回答，也可能是工具调用、状态变更或交接请求。",
            "以任务是否完成作为循环终止条件，并设置步数、时间和预算上限。"
          ],
          tags: ["定义", "自主性", "运行时"],
          resources: [{ label: "Building effective agents · Anthropic", url: "https://www.anthropic.com/research/building-effective-agents" }]
        },
        {
          id: "workflow-vs-agent",
          title: "Workflow vs Agent",
          summary: "区分预定义流程与模型动态决策。",
          description: "Workflow 的步骤和分支主要由开发者预先编排；Agent 则在运行时根据上下文决定下一步行动。两者不是对立关系，实际系统通常将确定性工作流与局部 Agent 决策组合。",
          points: [
            "步骤稳定、规则明确、结果可预测：优先使用 Workflow。",
            "需要理解非结构化输入、动态选择工具或处理未知路径：考虑 Agent。",
            "将高风险操作放在确定性节点中，由代码负责权限与校验。"
          ],
          tags: ["流程编排", "决策边界", "架构选型"]
        },
        {
          id: "agent-loop",
          title: "Agent 运行闭环",
          summary: "Observe → Think → Act → Reflect。",
          description: "典型循环从观察当前状态开始，模型根据目标和可用动作进行判断，运行时执行动作并收集结果，再把新状态交回模型。循环应有明确的完成、失败和转人工出口。",
          points: [
            "Observe：整理用户目标、历史上下文和环境状态。",
            "Think / Plan：判断是否已有足够信息，以及下一步动作。",
            "Act：调用工具或输出结果；随后验证结果并更新状态。"
          ],
          tags: ["Observe", "Plan", "Act", "Feedback"]
        },
        {
          id: "autonomy-levels",
          title: "自主性与任务边界",
          summary: "按风险、可逆性和影响范围分配自主权限。",
          description: "Agent 的自主程度应与任务风险匹配。只读检索可以较高自动化；发送消息、修改数据、付款或删除资源等动作应加入确认、限额和审计。",
          points: [
            "区分建议、草稿、可逆写入和不可逆操作。",
            "为每类工具定义权限范围、确认策略和失败回滚方式。",
            "明确任务预算、最大循环次数、超时与升级人工条件。"
          ],
          tags: ["Human approval", "Guardrails", "Risk"]
        }
      ]
    },
    {
      id: "model-prompt",
      title: "模型与提示工程",
      summary: "选择合适的模型，并为其提供高质量上下文与输出约束。",
      description: "模型与提示工程决定 Agent 的理解、推理和生成能力。工程重点不是堆砌长 Prompt，而是通过模型选型、上下文组织、结构化输出和持续评测，让模型在明确边界内稳定工作。",
      color: "#8A6BD8",
      tags: ["LLM", "Prompt", "Context"],
      points: [
        "根据任务难度、延迟、成本和工具调用能力选择模型。",
        "把系统规则、任务上下文、参考资料和工具结果分层组织。",
        "用 Schema、校验与重试处理结构化输出，而不是只依赖提示词。"
      ],
      children: [
        {
          id: "model-selection",
          title: "模型选型",
          summary: "在能力、延迟、成本与稳定性之间权衡。",
          description: "不同模型在复杂推理、长上下文、多模态、结构化输出和工具调用方面各有差异。模型选型应建立在代表性任务集和可量化指标上，而不是只比较榜单分数。",
          points: [
            "用真实任务集测试成功率、工具参数准确率和拒答行为。",
            "将延迟、Token 成本、上下文长度和速率限制纳入评估。",
            "通过路由策略把简单任务交给轻量模型，复杂任务交给更强模型。"
          ],
          tags: ["模型路由", "Latency", "Cost"]
        },
        {
          id: "system-prompt",
          title: "System Prompt",
          summary: "定义角色、目标、约束、流程与失败策略。",
          description: "系统提示词是 Agent 的行为契约。它应清晰说明任务目标、可用能力、禁止事项、决策原则和输出要求；动态数据与工具结果应作为独立上下文传入。",
          points: [
            "把稳定规则放在系统层，把每轮任务放在用户或状态层。",
            "明确工具使用条件、信息不足时的行为和停止条件。",
            "避免相互冲突、重复堆叠和无法验证的模糊要求。"
          ],
          tags: ["System", "Instruction", "Policy"]
        },
        {
          id: "context-engineering",
          title: "上下文工程",
          summary: "管理模型每一轮真正需要看到的信息。",
          description: "上下文工程关注信息的选择、排序、压缩和更新。上下文窗口不是无限记忆，过量历史会增加成本并稀释关键信息；应根据当前任务检索、摘要并注入最相关的信息。",
          points: [
            "区分系统规则、当前目标、历史摘要、检索片段和工具返回。",
            "对长对话做滚动摘要，保留决策、约束和未完成事项。",
            "为检索结果标注来源、时间和可信度，避免无依据的信息混入。"
          ],
          tags: ["Context window", "Summarization", "Retrieval"]
        },
        {
          id: "structured-output",
          title: "结构化输出",
          summary: "用 JSON Schema 等契约约束模型响应。",
          description: "当下游代码需要消费模型结果时，应优先采用受约束的结构化输出。结构化输出降低了解析歧义，但仍需校验业务规则、字段语义和数据权限。",
          points: [
            "定义必填字段、枚举、类型和嵌套结构。",
            "对输出执行 Schema 校验与业务校验，失败后有限重试。",
            "区分模型生成的候选值与经过权限校验的最终动作。"
          ],
          tags: ["JSON Schema", "Validation", "Typed output"],
          resources: [{ label: "OpenAI Structured Outputs", url: "https://platform.openai.com/docs/guides/structured-outputs" }]
        }
      ]
    },
    {
      id: "architecture",
      title: "Agent 架构",
      summary: "掌握常见推理模式与单 Agent、多 Agent 的架构取舍。",
      description: "架构模式描述 Agent 如何拆解任务、选择动作、验证结果和组织协作。应先使用最简单且可观测的模式，再根据任务复杂度和失败数据演进。",
      color: "#D99445",
      tags: ["ReAct", "Planning", "Multi-Agent"],
      points: [
        "模式是解决问题的工具，不是必须套用的框架模板。",
        "规划与执行之间需要状态、校验和异常恢复机制。",
        "多 Agent 会增加通信、调试和评估成本，必须有明确收益。"
      ],
      children: [
        {
          id: "react-pattern",
          title: "ReAct",
          summary: "交替进行推理与行动，利用观察结果推进任务。",
          description: "ReAct 将模型推理与工具行动结合：模型提出下一步动作，运行时执行并返回观察结果，再由模型决定后续步骤。适合需要逐步探索和动态工具选择的任务。",
          points: [
            "每次行动都应有明确目的，并能通过观察结果判断是否有效。",
            "工具执行结果应结构化返回，减少模型误读。",
            "限制循环次数，并在重复失败或无进展时停止或升级。"
          ],
          tags: ["Reasoning", "Tool use", "Observation"]
        },
        {
          id: "plan-execute",
          title: "Plan & Execute",
          summary: "先形成计划，再逐步执行与动态修订。",
          description: "Plan-and-Execute 把复杂任务拆成多个子任务，由规划器生成步骤，执行器逐项完成，必要时重新规划。它适合步骤较多、依赖关系明显的任务。",
          points: [
            "计划应包含可验证的子目标和依赖，而不只是自然语言清单。",
            "执行后检查前置条件与产物质量，再决定是否进入下一步。",
            "环境变化或步骤失败时允许局部重规划，避免盲目执行旧计划。"
          ],
          tags: ["Planning", "Task decomposition", "Replanning"]
        },
        {
          id: "reflection",
          title: "Reflection / Critic",
          summary: "通过检查、反馈和修订提高结果质量。",
          description: "Reflection 模式让模型或独立检查器评估中间产物，指出缺陷并触发修订。它可以改善复杂输出质量，但必须有明确评判标准，否则容易陷入无效自我循环。",
          points: [
            "先定义可检查标准，例如事实依据、格式、覆盖率和约束满足度。",
            "优先使用确定性校验器检查可程序化的规则。",
            "限制修订轮次，并记录每轮反馈和质量变化。"
          ],
          tags: ["Critic", "Self-correction", "Quality"]
        },
        {
          id: "multi-agent",
          title: "Multi-Agent",
          summary: "通过角色分工或任务交接组织多个 Agent。",
          description: "多 Agent 系统可按专业能力、权限或工作阶段进行拆分。协调器负责路由和汇总，子 Agent 负责有边界的子任务。角色数量不应成为目标，只有在隔离上下文或并行执行能带来可测收益时才值得引入。",
          points: [
            "定义每个 Agent 的职责、输入输出 Schema 和可用工具。",
            "明确协作拓扑：层级委派、顺序交接、并行汇总或群组协作。",
            "处理冲突、重复劳动、超时、共享状态和最终责任归属。"
          ],
          tags: ["Delegation", "Orchestration", "Parallelism"],
          resources: [{ label: "OpenAI Agents SDK", url: "https://openai.github.io/openai-agents-python/" }]
        }
      ]
    },
    {
      id: "tools",
      title: "工具与执行",
      summary: "让 Agent 安全、可靠地连接 API、业务系统与执行环境。",
      description: "工具是 Agent 影响外部世界的接口。工具设计需要清晰的输入输出契约、权限边界、错误语义、幂等策略和可观测性；模型可以选择工具，但执行权限必须由运行时控制。",
      color: "#2DA58B",
      tags: ["Function Calling", "MCP", "API"],
      points: [
        "工具描述要让模型知道何时调用、需要什么参数以及会产生什么影响。",
        "在运行时校验参数、身份、权限、速率和副作用。",
        "把超时、重试、幂等、审计和结果验证纳入工具层。"
      ],
      children: [
        {
          id: "function-calling",
          title: "Function Calling",
          summary: "让模型按工具 Schema 请求执行外部函数。",
          description: "Function Calling 将工具名称、描述和参数 Schema 提供给模型。模型返回工具调用请求，应用侧负责校验并真正执行，再把结果回传给模型继续处理。",
          points: [
            "工具参数使用明确类型、枚举、必填项和合理默认值。",
            "不要把模型的工具调用请求等同于已经执行成功。",
            "对写操作增加权限检查、用户确认和幂等键。"
          ],
          tags: ["Tools", "JSON Schema", "Execution"],
          resources: [{ label: "OpenAI Function Calling", url: "https://platform.openai.com/docs/guides/function-calling" }]
        },
        {
          id: "mcp",
          title: "MCP",
          summary: "用统一协议连接模型应用与外部工具、资源。",
          description: "Model Context Protocol（MCP）定义了客户端与服务器之间发现和调用能力的通用方式。它可以降低集成成本，但不会自动解决身份认证、授权、信任和数据治理问题。",
          points: [
            "理解 Tools、Resources、Prompts 等核心原语及其适用场景。",
            "检查服务器来源、权限范围、传输方式和凭证处理。",
            "对返回内容进行来源标注与不可信输入隔离。"
          ],
          tags: ["Model Context Protocol", "Tools", "Resources"],
          resources: [{ label: "MCP 官方文档", url: "https://modelcontextprotocol.io/introduction" }]
        },
        {
          id: "tool-design",
          title: "工具设计原则",
          summary: "设计边界清晰、可组合、可恢复的工具接口。",
          description: "优秀工具应尽量聚焦单一业务能力，参数语义稳定，输出便于模型理解。复杂业务可以由多个原子工具组成，也可以封装为有明确契约的高层工具。",
          points: [
            "工具命名使用动作加对象，描述前置条件和副作用。",
            "区分可读操作与写操作，避免一个工具承担过多权限。",
            "返回结构化状态、错误码、资源 ID 和必要的下一步信息。"
          ],
          tags: ["API design", "Idempotency", "Error handling"]
        },
        {
          id: "sandbox",
          title: "执行环境与沙箱",
          summary: "隔离代码执行、文件访问和网络访问风险。",
          description: "当 Agent 需要运行代码、访问文件或浏览网页时，应在隔离环境中执行。沙箱要控制文件系统、网络出口、CPU、内存、执行时间和凭证可见范围。",
          points: [
            "默认最小权限，按任务动态授予必要的资源访问。",
            "限制网络目的地、文件路径、进程能力和资源配额。",
            "执行产物需要扫描、校验，并通过受控通道交付。"
          ],
          tags: ["Sandbox", "Isolation", "Runtime security"]
        }
      ]
    },
    {
      id: "memory",
      title: "知识与记忆",
      summary: "为 Agent 提供可检索的外部知识和跨轮次状态。",
      description: "模型上下文不是长期数据库。知识检索负责从外部资料中找到依据，记忆负责保留与未来任务相关的信息。两者需要数据治理、更新策略、来源追踪和隐私边界。",
      color: "#D66E91",
      tags: ["RAG", "Memory", "Vector Search"],
      points: [
        "先判断信息是否需要持久化，再选择短期状态或长期存储。",
        "检索质量取决于切分、索引、召回、重排和上下文组织。",
        "记录来源和时间，提供过期、删除与权限过滤机制。"
      ],
      children: [
        {
          id: "rag",
          title: "RAG 检索增强生成",
          summary: "先检索外部知识，再基于证据生成回答。",
          description: "RAG 将知识库检索接入生成过程。典型链路包括文档解析、切分、向量化、召回、重排、上下文组装和带引用生成。它适合知识频繁变化或需要外部依据的任务。",
          points: [
            "建立文档解析、元数据、权限标签和增量更新流程。",
            "结合关键词检索、向量检索和重排提升召回质量。",
            "评估检索命中率、答案忠实度、引用准确性和端到端效果。"
          ],
          tags: ["Retrieval", "Reranking", "Grounding"],
          resources: [{ label: "Retrieval Augmented Generation · OpenAI", url: "https://platform.openai.com/docs/guides/retrieval" }]
        },
        {
          id: "memory-types",
          title: "记忆分层",
          summary: "区分会话状态、情节记忆与语义记忆。",
          description: "短期记忆保存当前任务状态和近期交互；情节记忆记录过去发生的事件；语义记忆保存稳定事实、偏好或领域知识。不同记忆类型应使用不同的写入、检索和遗忘策略。",
          points: [
            "会话状态服务于当前任务，通常有明确生命周期。",
            "长期记忆需要判断重要性、可信度、时效性和隐私。",
            "设计记忆更新、冲突解决、过期和用户纠正机制。"
          ],
          tags: ["Short-term", "Episodic", "Semantic"]
        },
        {
          id: "vector-search",
          title: "向量检索",
          summary: "用 Embedding 表示语义，并进行相似度召回。",
          description: "Embedding 将文本或多模态内容映射到向量空间。向量检索可召回语义相近的内容，但不等于理解事实关系，也不保证结果完整或准确。",
          points: [
            "根据语料语言、领域和查询类型选择 Embedding 模型。",
            "合理设计 Chunk 大小、重叠、元数据过滤和索引更新。",
            "使用混合检索与 Reranker 弥补纯向量召回的不足。"
          ],
          tags: ["Embedding", "ANN", "Hybrid Search"]
        },
        {
          id: "knowledge-graph",
          title: "知识图谱",
          summary: "用实体、关系和属性组织结构化知识。",
          description: "知识图谱将实体及其关系显式建模，适合多跳关系查询、实体消歧和结构化约束。它可以与向量检索结合：向量负责语义召回，图结构负责关系扩展和约束。",
          points: [
            "定义实体类型、关系类型、唯一标识和数据来源。",
            "通过实体链接与消歧连接文档、事件和业务数据。",
            "对关系路径、图查询和图谱更新建立评测。"
          ],
          tags: ["Entities", "Relations", "Graph RAG"]
        }
      ]
    },
    {
      id: "orchestration",
      title: "编排与协作",
      summary: "管理状态、步骤、分支、重试和人机协同。",
      description: "编排层决定 Agent 何时执行、如何转移状态、失败后如何恢复，以及何时需要人类参与。复杂流程应显式建模状态与转移，避免把全部控制逻辑藏在一个超长提示词中。",
      color: "#4F9CA8",
      tags: ["State Machine", "LangGraph", "HITL"],
      points: [
        "显式保存任务状态、执行结果、检查点和恢复位置。",
        "区分模型决策与确定性流程控制，重要转移由代码验证。",
        "把人工审批作为正式节点，而不是临时补丁。"
      ],
      children: [
        {
          id: "state-machine",
          title: "状态机与检查点",
          summary: "将任务表示为状态、事件和受控转移。",
          description: "状态机把流程拆为明确状态与转移条件。检查点记录关键状态，使长任务可以暂停、恢复、审计和重试，是可靠 Agent 编排的重要基础。",
          points: [
            "定义状态、事件、转移条件、超时和终止状态。",
            "将外部副作用与状态提交设计为可恢复流程。",
            "为长任务保存检查点，并验证恢复后的幂等性。"
          ],
          tags: ["State", "Checkpoint", "Recovery"]
        },
        {
          id: "langgraph",
          title: "图式编排框架",
          summary: "通过节点与边描述有状态的 Agent 工作流。",
          description: "图式编排将模型调用、工具执行、条件分支和人工审核组织为有向图。以 LangGraph 为例，节点负责执行逻辑，边负责路由，状态在节点间传递，并可配合持久化与检查点。",
          points: [
            "节点应职责单一，输入输出围绕共享状态定义。",
            "条件边处理路由，循环边处理迭代，终止边处理完成。",
            "框架负责编排，不替代业务校验、权限和可观测性。"
          ],
          tags: ["Graph", "Stateful workflow", "LangGraph"],
          resources: [{ label: "LangGraph 文档", url: "https://docs.langchain.com/oss/python/langgraph/overview" }]
        },
        {
          id: "handoff",
          title: "Agent Handoff",
          summary: "将任务或控制权交接给更合适的 Agent。",
          description: "Handoff 是把当前任务交给另一个具备合适职责或工具权限的 Agent。交接时必须传递目标、必要上下文、已完成工作和未解决问题，并明确谁负责最终答复。",
          points: [
            "明确交接条件、目标 Agent 和允许访问的上下文。",
            "避免多个 Agent 同时修改同一状态而产生竞争。",
            "记录交接链路，设置最大跳数和循环检测。"
          ],
          tags: ["Delegation", "Routing", "Ownership"]
        },
        {
          id: "human-in-loop",
          title: "Human-in-the-loop",
          summary: "在关键决策或高风险操作前引入人工确认。",
          description: "Human-in-the-loop 将人类审核嵌入执行流程。系统需要展示足够的上下文、拟执行动作、影响范围和风险，并提供批准、修改、拒绝与超时处理。",
          points: [
            "为付款、外发、删除、权限变更等动作设置确认门槛。",
            "审批内容应绑定具体参数和版本，防止确认后被悄悄修改。",
            "保存审批人、时间、决定和后续执行结果。"
          ],
          tags: ["Approval", "Escalation", "Audit"]
        }
      ]
    },
    {
      id: "evaluation",
      title: "评估与可观测性",
      summary: "用数据验证 Agent 是否有效，并定位失败原因。",
      description: "Agent 具有非确定性和多步骤执行特征，单看最终答案不足以评估质量。需要覆盖任务结果、工具行为、过程轨迹、成本、延迟和安全边界，并持续回归测试。",
      color: "#7D88A7",
      tags: ["Evals", "Tracing", "Observability"],
      points: [
        "建立代表性数据集和明确评分标准，避免只依赖主观体验。",
        "记录每一步输入输出、工具调用、耗时、Token 和异常。",
        "将线上失败转化为测试样本，形成持续改进闭环。"
      ],
      children: [
        {
          id: "agent-evals",
          title: "Agent Evals",
          summary: "评估任务成功率、过程质量与约束满足度。",
          description: "Agent 评估需要同时看最终结果和执行过程。除人工评审外，可以使用规则校验、标准答案、模拟环境和模型辅助评分，但评分器本身也需要校准。",
          points: [
            "按任务类型建立数据集，覆盖正常、边界和对抗样本。",
            "评估任务完成率、事实准确率、工具选择和参数正确率。",
            "对评分结果抽样人工复核，监控评估器偏差。"
          ],
          tags: ["Dataset", "Success rate", "LLM-as-judge"]
        },
        {
          id: "tracing",
          title: "Tracing 与调试",
          summary: "追踪每轮模型调用、工具执行和状态变化。",
          description: "Tracing 将一次任务拆成可关联的 Span，记录模型请求、工具调用、检索、重试和交接。完整轨迹可以解释失败发生在哪一步，并支持性能分析和复现。",
          points: [
            "为任务、会话、模型调用和工具执行分配关联 ID。",
            "记录耗时、输入输出摘要、Token、异常和重试次数。",
            "对敏感字段脱敏，设置日志保留期限与访问权限。"
          ],
          tags: ["Trace", "Span", "Debugging"]
        },
        {
          id: "metrics",
          title: "质量与运行指标",
          summary: "从效果、性能、成本和安全多个维度观测。",
          description: "运行指标要能对应真实业务目标。除任务成功率外，还要监控延迟分位数、工具失败率、人工接管率、Token 成本、重复循环和策略拦截情况。",
          points: [
            "效果：完成率、用户采纳率、事实错误率和返工率。",
            "性能：P50/P95 延迟、吞吐量、超时率和队列等待。",
            "成本与安全：单任务成本、工具调用量、拒绝率和越权拦截。"
          ],
          tags: ["SLO", "Latency", "Cost", "Safety"]
        },
        {
          id: "regression",
          title: "回归测试与发布",
          summary: "将提示词、模型和工具变更纳入质量门禁。",
          description: "Agent 的行为可能随模型版本、提示词、工具 Schema 和知识库变化而改变。发布前应在固定数据集和模拟环境中进行回归，并对线上流量逐步放量。",
          points: [
            "为关键任务保留固定测试集和基准结果。",
            "比较版本间成功率、成本、延迟和安全指标变化。",
            "使用灰度发布、快速回滚和线上异常采样。"
          ],
          tags: ["Regression", "CI", "Release"]
        }
      ]
    },
    {
      id: "security",
      title: "安全与工程化",
      summary: "控制提示注入、权限、数据泄露与生产运行风险。",
      description: "Agent 会读取不可信内容并调用具有真实权限的工具，因此安全边界必须由系统架构保证。模型提示词只能提供行为引导，不能替代身份认证、授权、隔离和审计。",
      color: "#B97955",
      tags: ["Security", "Deployment", "Governance"],
      points: [
        "把用户输入、检索文档、网页内容和工具返回都视为潜在不可信数据。",
        "采用最小权限、明确授权、隔离执行和人工审批。",
        "生产环境需要限流、熔断、审计、密钥管理和成本预算。"
      ],
      children: [
        {
          id: "prompt-injection",
          title: "Prompt Injection",
          summary: "识别并隔离试图改变 Agent 行为的恶意内容。",
          description: "提示注入可能来自用户消息、网页、邮件、文档或工具结果。攻击者试图让模型忽略原有指令、泄露信息或调用不当工具。仅靠提示词要求模型忽略攻击并不足够。",
          points: [
            "区分可信指令与不可信数据，避免把检索内容提升为系统指令。",
            "工具权限由运行时强制执行，不让模型自行扩大权限。",
            "对外发、下载、执行代码等敏感动作设置独立策略和确认。"
          ],
          tags: ["Indirect injection", "Trust boundary", "Defense"],
          resources: [{ label: "OWASP Top 10 for LLM Applications", url: "https://genai.owasp.org/llm-top-10/" }]
        },
        {
          id: "permissions",
          title: "身份与权限控制",
          summary: "将用户身份、Agent 身份与工具权限绑定。",
          description: "授权应基于当前用户、任务目的和资源范围进行判断。不要让所有 Agent 共用一个拥有广泛权限的服务账号，也不要将长期凭证直接暴露给模型上下文。",
          points: [
            "使用最小权限与短期凭证，按需授权并定期轮换。",
            "服务端对每次工具调用重新检查身份、资源和操作权限。",
            "为敏感数据设置租户隔离、字段级访问控制和审计记录。"
          ],
          tags: ["IAM", "Least privilege", "Secrets"]
        },
        {
          id: "deployment",
          title: "部署与可靠性",
          summary: "为 Agent 服务建立可扩展、可恢复的生产运行环境。",
          description: "生产 Agent 通常需要 API 服务、异步任务队列、状态存储、检索服务、模型网关和观测系统。长任务应异步化，并具备超时、重试、取消和恢复能力。",
          points: [
            "分离请求接入、任务执行、状态存储和工具适配层。",
            "对模型与外部 API 设置超时、限流、重试和熔断。",
            "支持任务取消、断点恢复、版本追踪和快速回滚。"
          ],
          tags: ["Runtime", "Queue", "Resilience"]
        },
        {
          id: "cost-control",
          title: "成本与资源治理",
          summary: "控制模型调用、工具执行和长任务的资源消耗。",
          description: "Agent 可能因循环、重复检索或过度规划产生不可预测的成本。应在任务级别设置预算，并通过模型路由、缓存、上下文压缩和工具合并优化资源使用。",
          points: [
            "设置 Token、模型调用次数、工具次数、时间和并发上限。",
            "监控单任务成本分布，定位高成本路径与重复调用。",
            "为超预算任务定义降级、暂停、转人工或终止策略。"
          ],
          tags: ["Budget", "Caching", "Rate limit"]
        }
      ]
    }
  ]
};
