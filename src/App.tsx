import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Expand,
  Network,
  Scan,
  Search,
  Shrink,
  X,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  useReactFlow
} from "@xyflow/react";
import { DetailPanel } from "./components/DetailPanel";
import { KnowledgeNode } from "./components/KnowledgeNode";
import { knowledgeTree } from "./data/knowledge";
import {
  buildGraph,
  collectExpandableIds,
  countDescendants,
  filterKnowledgeTree,
  findKnowledgeColor,
  findKnowledgeItem,
  findKnowledgePath,
  ROOT_ID
} from "./lib/graph";

const nodeTypes = { knowledge: KnowledgeNode };
const MAP_STATE_STORAGE_KEY = "agent-map:view-state:v1";

type SavedViewport = { x: number; y: number; zoom: number };
type PersistedMapState = {
  expanded: Set<string>;
  query: string;
  selectedId: string | null;
  canvasOffset: { x: number; y: number };
  viewport: SavedViewport | null;
};

function loadPersistedMapState(): PersistedMapState {
  const defaults: PersistedMapState = {
    expanded: new Set([ROOT_ID, "memory"]),
    query: "",
    selectedId: null,
    canvasOffset: { x: 0, y: 0 },
    viewport: null
  };

  try {
    if (typeof window === "undefined") return defaults;
    const raw = window.localStorage.getItem(MAP_STATE_STORAGE_KEY);
    if (!raw) return defaults;

    const saved = JSON.parse(raw) as Record<string, unknown>;
    const expandableIds = collectExpandableIds(knowledgeTree);
    const expanded = Array.isArray(saved.expanded)
      ? new Set(saved.expanded.filter(
          (id): id is string => typeof id === "string" && expandableIds.has(id)
        ))
      : defaults.expanded;

    const offset = saved.canvasOffset as { x?: unknown; y?: unknown } | undefined;
    const canvasOffset =
      offset && typeof offset.x === "number" && Number.isFinite(offset.x) &&
      typeof offset.y === "number" && Number.isFinite(offset.y)
        ? { x: offset.x, y: offset.y }
        : defaults.canvasOffset;

    const candidateViewport = saved.viewport as
      | { x?: unknown; y?: unknown; zoom?: unknown }
      | undefined;
    const viewport =
      candidateViewport &&
      typeof candidateViewport.x === "number" && Number.isFinite(candidateViewport.x) &&
      typeof candidateViewport.y === "number" && Number.isFinite(candidateViewport.y) &&
      typeof candidateViewport.zoom === "number" &&
      Number.isFinite(candidateViewport.zoom) &&
      candidateViewport.zoom > 0
        ? {
            x: candidateViewport.x,
            y: candidateViewport.y,
            zoom: candidateViewport.zoom
          }
        : null;

    const selectedId =
      typeof saved.selectedId === "string" &&
      findKnowledgeItem(knowledgeTree, saved.selectedId)
        ? saved.selectedId
        : null;

    return {
      expanded,
      query: typeof saved.query === "string" ? saved.query : "",
      selectedId,
      canvasOffset,
      viewport
    };
  } catch {
    return defaults;
  }
}

export default function App() {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const [restoredState] = useState(loadPersistedMapState);
  const [expanded, setExpanded] = useState<Set<string>>(() => restoredState.expanded);
  const [query, setQuery] = useState(restoredState.query);
  const [selectedId, setSelectedId] = useState<string | null>(restoredState.selectedId);
  const [canvasOffset, setCanvasOffset] = useState(restoredState.canvasOffset);

  const graphRef = useRef<{ nodes: Array<{ id: string; position: { x: number; y: number } }> }>({
    nodes: []
  });
  const expandedRef = useRef(expanded);
  const filteredTreeRef = useRef(knowledgeTree);
  const selectedIdRef = useRef(selectedId);
  const queryRef = useRef(query);
  const canvasOffsetRef = useRef(canvasOffset);
  const viewportRef = useRef<SavedViewport>(
    restoredState.viewport ?? { x: 0, y: 0, zoom: 1 }
  );
  const hasSavedViewportRef = useRef(restoredState.viewport !== null);
  const initialFitHandledRef = useRef(false);

  const persistViewState = useCallback((viewport = viewportRef.current) => {
    try {
      window.localStorage.setItem(
        MAP_STATE_STORAGE_KEY,
        JSON.stringify({
          expanded: Array.from(expandedRef.current),
          query: queryRef.current,
          selectedId: selectedIdRef.current,
          canvasOffset: canvasOffsetRef.current,
          viewport: hasSavedViewportRef.current ? viewport : null
        })
      );
    } catch {
      // The graph remains usable when browser storage is unavailable or full.
    }
  }, []);

  const handleMoveEnd = useCallback(
    (_event: unknown, viewport: SavedViewport) => {
      viewportRef.current = viewport;
      hasSavedViewportRef.current = true;
      persistViewState(viewport);
    },
    [persistViewState]
  );

  const filteredTree = useMemo(
    () => filterKnowledgeTree(knowledgeTree, query),
    [query]
  );

  const applyExpanded = useCallback((nextExpanded: Set<string>, anchorId: string) => {
    const previousAnchor = graphRef.current.nodes.find((node) => node.id === anchorId);
    const nextGraph = buildGraph(
      filteredTreeRef.current,
      nextExpanded,
      selectedIdRef.current,
      () => {},
      queryRef.current
    );
    const nextAnchor = nextGraph.nodes.find((node) => node.id === anchorId);

    if (previousAnchor && nextAnchor) {
      const nextOffset = {
        x: previousAnchor.position.x - nextAnchor.position.x,
        y: previousAnchor.position.y - nextAnchor.position.y
      };
      canvasOffsetRef.current = nextOffset;
      setCanvasOffset(nextOffset);
    }

    expandedRef.current = nextExpanded;
    setExpanded(nextExpanded);
  }, []);

  const toggleBranch = useCallback((id: string) => {
    const nextExpanded = new Set(expandedRef.current);
    if (nextExpanded.has(id)) nextExpanded.delete(id);
    else nextExpanded.add(id);
    applyExpanded(nextExpanded, id);
  }, [applyExpanded]);

  const baseGraph = useMemo(
    () => buildGraph(filteredTree, expanded, selectedId, toggleBranch, query),
    [filteredTree, expanded, selectedId, toggleBranch, query]
  );

  const graph = useMemo(() => ({
    nodes: baseGraph.nodes.map((node) => ({
      ...node,
      position: {
        x: node.position.x + canvasOffset.x,
        y: node.position.y + canvasOffset.y
      }
    })),
    edges: baseGraph.edges
  }), [baseGraph, canvasOffset]);

  graphRef.current = graph;
  expandedRef.current = expanded;
  filteredTreeRef.current = filteredTree;
  selectedIdRef.current = selectedId;
  queryRef.current = query;
  canvasOffsetRef.current = canvasOffset;

  const matchCount = countDescendants(filteredTree.children ?? []);
  const selectedItem = findKnowledgeItem(knowledgeTree, selectedId);
  const selectedExpandableIds = useMemo(
    () => selectedItem ? collectExpandableIds(selectedItem) : new Set<string>(),
    [selectedItem]
  );
  const selectedPath = useMemo(
    () => findKnowledgePath(knowledgeTree, selectedId),
    [selectedId]
  );
  const selectedRelatedItems = useMemo(
    () => (selectedItem?.relatedIds ?? [])
      .map((id) => findKnowledgeItem(knowledgeTree, id))
      .filter((item): item is NonNullable<typeof item> => item !== null),
    [selectedItem]
  );
  const selectedNode = graph.nodes.find((node) => node.id === selectedId);
  const selectedColor = selectedItem
    ? (findKnowledgeColor(knowledgeTree, selectedItem.id) ?? "#4E83E6")
    : "#4E83E6";

  useEffect(() => {
    if (!initialFitHandledRef.current) {
      initialFitHandledRef.current = true;
      if (hasSavedViewportRef.current) return;
    }

    const frame = window.requestAnimationFrame(() => {
      fitView({ padding: 0.2, duration: 320, minZoom: 0.15, maxZoom: 1.2 });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [query, fitView]);

  useEffect(() => {
    persistViewState();
  }, [expanded, query, selectedId, canvasOffset, persistViewState]);

  useEffect(() => {
    const saveBeforePageExit = () => persistViewState();
    window.addEventListener("pagehide", saveBeforePageExit);
    return () => window.removeEventListener("pagehide", saveBeforePageExit);
  }, [persistViewState]);

  const handleSearch = (value: string) => {
    setQuery(value);
    setSelectedId(null);
    setCanvasOffset({ x: 0, y: 0 });
  };

  const expandAll = () => {
    if (!selectedItem || selectedExpandableIds.size === 0) return;
    const nextExpanded = new Set(expandedRef.current);
    selectedExpandableIds.forEach((id) => nextExpanded.add(id));
    applyExpanded(nextExpanded, selectedItem.id);
  };

  const collapseAll = () => {
    if (!selectedItem || selectedExpandableIds.size === 0) return;
    const nextExpanded = new Set(expandedRef.current);
    selectedExpandableIds.forEach((id) => nextExpanded.delete(id));
    applyExpanded(nextExpanded, selectedItem.id);
  };

  const canManageSelectedSubtree = selectedExpandableIds.size > 0;

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
            placeholder="搜索模块、能力或技术..."
            aria-label="搜索模块、能力或技术"
          />
          {query && (
            <button type="button" onClick={() => handleSearch("")} aria-label="清除搜索">
              <X size={14} />
            </button>
          )}
        </label>
      </div>

      <div className="canvas-function-area" role="group" aria-label="功能区">
        <button
          type="button"
          title="展开选中节点及其所有子节点"
          aria-label="全部展开选中节点及其所有子节点"
          disabled={!canManageSelectedSubtree}
          onClick={expandAll}
        >
          <Expand size={16} />
        </button>
        <button
          type="button"
          title="折叠选中节点及其所有子节点"
          aria-label="全部折叠选中节点及其所有子节点"
          disabled={!canManageSelectedSubtree}
          onClick={collapseAll}
        >
          <Shrink size={16} />
        </button>
        <button type="button" title="放大" aria-label="放大" onClick={() => zoomIn({ duration: 200 })}>
          <ZoomIn size={16} />
        </button>
        <button type="button" title="缩小" aria-label="缩小" onClick={() => zoomOut({ duration: 200 })}>
          <ZoomOut size={16} />
        </button>
        <span className="canvas-function-divider" aria-hidden="true" />
        <button
          type="button"
          title="适配画布"
          aria-label="适配画布"
          onClick={() => fitView({ padding: 0.2, duration: 350, minZoom: 0.15, maxZoom: 1.2 })}
        >
          <Scan size={16} />
        </button>
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
        defaultViewport={restoredState.viewport ?? undefined}
        onMoveEnd={handleMoveEnd}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={26}
          size={1}
          color="#dce4ef"
        />
      </ReactFlow>

      {query && matchCount === 0 && (
        <div className="empty-search">
          <Search size={22} />
          <strong>没有找到相关知识点</strong>
          <span>试试 Memory、RAG、ReAct、MCP 或 Embedding。</span>
          <button type="button" onClick={() => handleSearch("")}>清除搜索</button>
        </div>
      )}

      {selectedItem && (
        <DetailPanel
          item={selectedItem}
          path={selectedPath}
          relatedItems={selectedRelatedItems}
          color={selectedColor}
          kind={selectedNode?.data.kind ?? "implementation"}
          onNavigate={setSelectedId}
          onClose={() => setSelectedId(null)}
        />
      )}

      <div className="canvas-help">滚轮缩放 · 拖动画布 · 点击节点查看详情</div>
    </main>
  );
}
