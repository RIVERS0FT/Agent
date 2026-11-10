# Agent Development Knowledge Map

一个面向 Agent 开发者的交互式知识图谱：以从左到右的树状结构，梳理从基础概念、模型与提示工程，到 Agent 架构、工具调用、记忆检索、评估、安全与部署的完整知识路径。

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

## 内容结构

- Agent 基础与核心概念
- 模型能力与提示工程
- Agent 架构与推理模式
- 工具调用与外部系统
- 知识检索与记忆
- 工作流编排与多 Agent 协作
- 评估、可观测性与质量
- 安全、部署与工程实践

知识内容集中维护在 `src/data/knowledge.ts`，可以直接通过数据结构扩展节点。