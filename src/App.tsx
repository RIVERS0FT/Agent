import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Expand,
  Github,
  Network,
  Scan,
  Search,
  Shrink,
  X
} from "lucide-react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  useReactFlow
} from "@xyflow/react";
import { DetailPanel } from "./components/DetailPanel";
import { KnowledgeNode } from "./components/KnowledgeNode";
import { knowledgeTree } from "./data/knowledge";
import {
  buildGraph,
  countDescendants,
  filterKnowledgeTree,
  findKnowledgeColor,
  findKnowledgeItem
} from "./lib/graph";
import type { KnowledgeNodeData } from "./types";

const nodeTypes = { knowledge: KnowledgeNode };

export default function App() {
  const { fitView } = useReactFlow();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(["fundamentals"]));
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredTree = useMemo(
    () => filterKnowledgeTree(knowledgeTree, query),
    [query]
  );

  const toggleBranch = useCallback((id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const graph = useMemo(
    () => buildGraph(filteredTree, expanded, selectedId, toggleBranch, query),
    [filteredTree, expanded, selectedId, toggleBranch, query]
  );

  const categoryCount = knowledgeTree.children?.length ?? 0;
  const topicCount = countDescendants(knowledgeTree.children ?? []) - categoryCount;
  const matchCount = countDescendants(filteredTree.children ?? []);
  const selectedItem = findKnowledgeItem(knowledgeTree, selectedId);
  const selectedColor = selectedItem
    ? (findKnowledgeColor(knowledgeTree, selectedItem.id) ?? "#4E83E6")
    : "#4E83E6";

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      fitView({ padding: 0.2, duration: 320, minZoom: 0.18, maxZoom: 1.15 });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [graph.nodes.length, query, fitView]);

  const handleSearch = (value: string) => {
    setQuery(value);
    setSelectedId(null);
  };

  const expandAll = () => {
    setExpanded(new Set((knowledgeTree.children ?? []).map((item) => item.id)));
  };

  const collapseAll = () => setExpanded(new Set());

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Agent Map 首页">
          <span className="brand-mark"><Network size={20} strokeWidth={2.2} /></span>
          <span className="brand-copy">
            <strong>AGENT MAP</strong>
            <small>KNOWLEDGE SYSTEM</small>
          </span>
        </a>

        <div className="topbar-center">
          <span className="live-indicator" />
          INTERACTIVE KNOWLEDGE BASE
        </div>

        <a
          className="github-link"
          href="https://github.com/RIVERS0FT/Agent"
          target="_blank"
          rel="noreferrer"
        >
          <Github size={16} />
          <span>GitHub</span>
          <ArrowUpRight size={14} />
        </a>
      </header>

      <main className="page-shell">
        <section className="intro-row">
          <div className="intro-copy">
            <div className="eyebrow"><span /> A FIELD GUIDE TO BUILDING AGENTS</div>
            <h1>Agent 开发知识图谱</h1>
            <p>从模型能力到工程落地，用一张图建立 Agent 开发的完整认知。</p>
          </div>

          <div className="overview-stats">
            <div className="overview-stat">
              <strong>{String(categoryCount).padStart(2, "0")}</strong>
              <span>知识领域</span>
            </div>
            <div className="overview-stat-divider" />
            <div className="overview-stat">
              <strong>{String(topicCount).padStart(2, "0")}</strong>
              <span>核心主题</span>
            </div>
            <div className="overview-stat-divider" />
            <div className="overview-stat">
              <strong>LR</strong>
              <span>树状结构</span>
            </div>
          </div>
        </section>

        <section className="workspace-toolbar" aria-label="知识图谱工具栏">
          <label className="search-box">
            <Search size={17} />
            <input
              type="search"
              value={query}
              onChange={(event) => handleSearch(event.target.value)}
              placeholder="搜索知识点、概念或关键词..."
              aria-label="搜索知识点"
            />
            {query && (
              <button type="button" onClick={() => handleSearch("")} aria-label="清除搜索">
                <X size={15} />
              </button>
            )}
            <kbd>/</kbd>
          </label>

          <div className="toolbar-actions">
            <button type="button" className="toolbar-button" onClick={expandAll}>
              <Expand size={15} />
              <span>全部展开</span>
            </button>
            <button type="button" className="toolbar-button" onClick={collapseAll}>
              <Shrink size={15} />
              <span>全部收起</span>
            </button>
            <button type="button" className="toolbar-button toolbar-button-primary" onClick={() => fitView({ padding: 0.2, duration: 350 })}>
              <Scan size={15} />
              <span>适配画布</span>
            </button>
          </div>
        </section>

        <section className="map-frame" aria-label="Agent 开发知识树">
          <ReactFlow
            nodes={graph.nodes}
            edges={graph.edges}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            onPaneClick={() => setSelectedId(null)}
            nodeOrigin={[0.5, 0.5]}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
            minZoom={0.15}
            maxZoom={1.5}
            zoomOnDoubleClick={false}
            fitView
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={1.1}
              color="#d9e2ee"
            />
            <Controls position="bottom-left" showInteractive={false} />
            <MiniMap
              position="bottom-right"
              pannable
              zoomable
              nodeColor={(node) => (node.data as KnowledgeNodeData).color}
              maskColor="rgba(238, 243, 249, 0.72)"
            />
            <Panel position="top-left" className="flow-hint">
              <span className="flow-hint-dot" />
              <span>ROOT</span>
              <span className="flow-hint-arrow">→</span>
              <span>DOMAIN</span>
              <span className="flow-hint-arrow">→</span>
              <span>TOPIC</span>
            </Panel>
          </ReactFlow>

          {query && matchCount === 0 && (
            <div className="empty-search">
              <Search size={24} />
              <strong>没有找到相关知识点</strong>
              <span>试试 Agent、RAG、工具调用或评估等关键词。</span>
              <button type="button" onClick={() => handleSearch("")}>清除搜索</button>
            </div>
          )}

          {selectedItem && (
            <DetailPanel
              item={selectedItem}
              color={selectedColor}
              onClose={() => setSelectedId(null)}
            />
          )}

          <div className="map-corner-label">
            {query ? "SEARCH RESULTS · " + matchCount : "KNOWLEDGE TREE · LIVE CANVAS"}
          </div>
        </section>

        <footer className="page-footer">
          <div className="footer-legend">
            <span><i className="legend-root" /> 起点</span>
            <span><i className="legend-domain" /> 知识领域</span>
            <span><i className="legend-topic" /> 具体主题</span>
          </div>
          <div className="footer-hint">滚轮缩放 · 拖动画布 · 点击节点查看详情</div>
          <a href="https://github.com/RIVERS0FT/Agent" target="_blank" rel="noreferrer">
            Built for Agent builders <ArrowUpRight size={13} />
          </a>
        </footer>
      </main>
    </div>
  );
}
