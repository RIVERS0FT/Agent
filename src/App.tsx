import { useCallback, useEffect, useMemo, useState } from "react";
import {
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

  const matchCount = countDescendants(filteredTree.children ?? []);
  const selectedItem = findKnowledgeItem(knowledgeTree, selectedId);
  const selectedColor = selectedItem
    ? (findKnowledgeColor(knowledgeTree, selectedItem.id) ?? "#4E83E6")
    : "#4E83E6";

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      fitView({ padding: 0.2, duration: 320, minZoom: 0.15, maxZoom: 1.2 });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [query, fitView]);

  const handleSearch = (value: string) => {
    setQuery(value);
    setSelectedId(null);
  };

  const expandAll = () => {
    setExpanded(new Set((knowledgeTree.children ?? []).map((item) => item.id)));
  };

  const collapseAll = () => setExpanded(new Set());

  return (
    <main className="map-frame" aria-label="Agent 开发知识图谱">
      <div className="canvas-toolbar">
        <a className="canvas-brand" href="#" aria-label="Agent Map 首页">
          <span className="brand-mark"><Network size={17} strokeWidth={2.2} /></span>
          <span>Agent 开发知识图谱</span>
        </a>

        <label className="canvas-search">
          <Search size={16} />
          <input
            type="search"
            value={query}
            onChange={(event) => handleSearch(event.target.value)}
            placeholder="搜索知识点..."
            aria-label="搜索知识点"
          />
          {query && (
            <button type="button" onClick={() => handleSearch("")} aria-label="清除搜索">
              <X size={14} />
            </button>
          )}
        </label>
      </div>

      <div className="canvas-actions" aria-label="画布操作">
        <button type="button" title="全部展开" aria-label="全部展开" onClick={expandAll}>
          <Expand size={16} />
        </button>
        <button type="button" title="全部收起" aria-label="全部收起" onClick={collapseAll}>
          <Shrink size={16} />
        </button>
        <button
          type="button"
          title="适配画布"
          aria-label="适配画布"
          onClick={() => fitView({ padding: 0.2, duration: 350, minZoom: 0.15, maxZoom: 1.2 })}
        >
          <Scan size={16} />
        </button>
        <a
          href="https://github.com/RIVERS0FT/Agent"
          target="_blank"
          rel="noreferrer"
          title="GitHub 仓库"
          aria-label="GitHub 仓库"
        >
          <Github size={16} />
        </a>
      </div>

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
        minZoom={0.12}
        maxZoom={1.6}
        zoomOnDoubleClick={false}
        fitView
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={26}
          size={1}
          color="#dce4ef"
        />
        <Controls position="bottom-left" showInteractive={false} />
      </ReactFlow>

      {query && matchCount === 0 && (
        <div className="empty-search">
          <Search size={22} />
          <strong>没有找到相关知识点</strong>
          <span>试试 Agent、RAG、工具调用或评估。</span>
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

      <div className="canvas-help">滚轮缩放 · 拖动画布 · 点击节点查看详情</div>
    </main>
  );
}
