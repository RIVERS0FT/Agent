# Agent Development Knowledge Map

一个面向 Agent 开发者的交互式知识图谱。使用从左到右的四级结构，将 Agent 系统拆解为功能模块、模块能力和具体技术实现。

## 知识结构

1. **一级：Agent 系统** — 整体系统入口。
2. **二级：Agent 模块** — Perception、Reasoning、Memory、Knowledge / RAG、Tools、Orchestration、Context、Model Runtime、Evaluation、Security。
3. **三级：模块能力** — 例如 Memory Extraction、Memory Storage、Memory Retrieval、Memory Lifecycle。
4. **四级：技术实现** — 例如 LLM Structured Extraction、NER、Redis、PostgreSQL、Vector Search、BM25、Reranker。

点击模块或能力节点旁的展开按钮，可以逐层查看下级内容；点击节点可查看职责说明、关键知识点、关键词和参考资料。

## 技术栈

- React 19 + TypeScript
- Vite
- [React Flow](https://reactflow.dev/)（`@xyflow/react`）
- GitHub Pages + GitHub Actions

## 本地开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
npm run preview
```

## GitHub Pages

仓库通过 `.github/workflows/deploy.yml` 自动构建并部署到 GitHub Pages。

在 GitHub 仓库的 **Settings → Pages → Build and deployment** 中，将 Source 设置为 **GitHub Actions**。推送到 `main` 后，工作流会自动发布站点。

## 扩展知识

知识内容集中维护在 `src/data/knowledge.ts`。树结构使用递归数据模型，新增模块、能力或技术实现时，按四级结构添加 `KnowledgeItem` 即可。
