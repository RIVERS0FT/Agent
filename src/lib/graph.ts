import { MarkerType, type Edge, type Node } from "@xyflow/react";
import type { KnowledgeItem, KnowledgeNodeData } from "../types";

export const ROOT_ID = "agent-root";

const COLUMN_GAP = 360;
const NODE_HEIGHT = 66;
const SIBLING_GAP = 10;

type KnowledgeFlowNode = Node<KnowledgeNodeData, "knowledge">;

export function filterKnowledgeTree(root: KnowledgeItem, query: string): KnowledgeItem {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return root;

  const visit = (item: KnowledgeItem, isRoot = false): KnowledgeItem | null => {
    const haystack = [
      item.title,
      item.summary,
      item.description,
      ...(item.tags ?? []),
      ...item.points
    ].join(" ").toLowerCase();
    const selfMatches = !isRoot && haystack.includes(normalized);
    if (selfMatches) return item;

    const children = (item.children ?? [])
      .map((child) => visit(child))
      .filter((child): child is KnowledgeItem => child !== null);

    if (isRoot) return { ...item, children };
    if (children.length > 0) return { ...item, children };
    return null;
  };

  return visit(root, true) ?? { ...root, children: [] };
}

export function buildGraph(
  root: KnowledgeItem,
  expanded: Set<string>,
  selectedId: string | null,
  onToggle: (id: string) => void,
  query = ""
): { nodes: KnowledgeFlowNode[]; edges: Edge[] } {
  const nodes: KnowledgeFlowNode[] = [];
  const edges: Edge[] = [];
  const searching = query.trim().length > 0;

  const getVisibleChildren = (item: KnowledgeItem): KnowledgeItem[] => {
    const shouldExpand = searching || expanded.has(item.id);
    return shouldExpand ? (item.children ?? []) : [];
  };

  type TidyLayout = {
    item: KnowledgeItem;
    depth: number;
    height: number;
    centerOffset: number;
    childOffsets: number[];
    children: TidyLayout[];
  };

  // Build compact subtree geometry from the fixed card height and a fixed
  // minimum gap between sibling subtrees. Parent cards are centered over
  // the first and last child centers, and the subtree bounds include the
  // parent card so neighboring branches can never overlap.
  const measure = (item: KnowledgeItem, depth: number): TidyLayout => {
    const children = getVisibleChildren(item).map((child) => measure(child, depth + 1));
    if (children.length === 0) {
      return {
        item,
        depth,
        height: NODE_HEIGHT,
        centerOffset: NODE_HEIGHT / 2,
        childOffsets: [],
        children
      };
    }

    const childTops: number[] = [];
    let cursor = 0;
    for (const child of children) {
      childTops.push(cursor);
      cursor += child.height + SIBLING_GAP;
    }
    const childrenHeight = cursor - SIBLING_GAP;
    const firstCenter = childTops[0] + children[0].centerOffset;
    const lastIndex = children.length - 1;
    const lastCenter = childTops[lastIndex] + children[lastIndex].centerOffset;
    const parentCenter = (firstCenter + lastCenter) / 2;
    const parentTop = parentCenter - NODE_HEIGHT / 2;
    const top = Math.min(0, parentTop);
    const bottom = Math.max(childrenHeight, parentTop + NODE_HEIGHT);
    const offset = -top;

    return {
      item,
      depth,
      height: bottom - top,
      centerOffset: parentCenter + offset,
      childOffsets: childTops.map((childTop) => childTop + offset),
      children
    };
  };

  const walk = (
    layout: TidyLayout,
    top: number,
    parentId: string | null,
    inheritedColor: string
  ): void => {
    const { item, depth, children } = layout;
    const centerY = top + layout.centerOffset;
    const kind: KnowledgeNodeData["kind"] =
      depth === 0
        ? "root"
        : depth === 1
          ? "module"
          : depth === 2
            ? "capability"
            : "implementation";
    const color = item.color ?? inheritedColor;
    const moduleIndex =
      kind === "module"
        ? (root.children ?? []).findIndex((module) => module.id === item.id) + 1
        : 0;

    const data: KnowledgeNodeData = {
      item,
      kind,
      color,
      indexLabel: moduleIndex > 0 ? String(moduleIndex).padStart(2, "0") : undefined,
      expanded: children.length > 0,
      hasChildren: (item.children?.length ?? 0) > 0,
      selected: selectedId === item.id,
      onToggle
    };

    nodes.push({
      id: item.id,
      type: "knowledge",
      position: { x: depth * COLUMN_GAP, y: centerY },
      data,
      selected: selectedId === item.id,
      draggable: false,
      selectable: true,
      style: {
        width:
          kind === "root" ? 300 :
          kind === "module" ? 278 :
          kind === "capability" ? 258 : 248,
        height: NODE_HEIGHT
      }
    });

    if (parentId) {
      const edgeColor = depth === 1 ? color : inheritedColor;
      edges.push({
        id: parentId + "-" + item.id,
        source: parentId,
        target: item.id,
        sourceHandle: "source",
        targetHandle: "target",
        type: "smoothstep",
        animated: false,
        style: { stroke: edgeColor, strokeWidth: 1.8, strokeOpacity: 0.46 },
        markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor }
      });
    }

    children.forEach((child, index) => {
      walk(child, top + layout.childOffsets[index], item.id, color);
    });
  };

  const rootLayout = measure(root, 0);
  walk(rootLayout, 0, null, "#4E83E6");
  return { nodes, edges };
}

export function findKnowledgeItem(
  item: KnowledgeItem,
  id: string | null
): KnowledgeItem | null {
  if (!id) return null;
  if (item.id === id) return item;
  for (const child of item.children ?? []) {
    const found = findKnowledgeItem(child, id);
    if (found) return found;
  }
  return null;
}

export function findKnowledgePath(
  item: KnowledgeItem,
  id: string | null,
  ancestors: KnowledgeItem[] = []
): KnowledgeItem[] {
  if (!id) return [];
  const path = [...ancestors, item];
  if (item.id === id) return path;

  for (const child of item.children ?? []) {
    const found = findKnowledgePath(child, id, path);
    if (found.length > 0) return found;
  }
  return [];
}

export function findKnowledgeColor(
  item: KnowledgeItem,
  id: string,
  inheritedColor = "#4E83E6"
): string | undefined {
  const color = item.color ?? inheritedColor;
  if (item.id === id) return color;
  for (const child of item.children ?? []) {
    const found = findKnowledgeColor(child, id, color);
    if (found) return found;
  }
  return undefined;
}

export function countDescendants(items: KnowledgeItem[] = []): number {
  return items.reduce(
    (total, item) => total + 1 + countDescendants(item.children ?? []),
    0
  );
}

export function collectExpandableIds(root: KnowledgeItem): Set<string> {
  const ids = new Set<string>();
  const visit = (item: KnowledgeItem) => {
    if (!item.children?.length) return;
    ids.add(item.id);
    item.children.forEach(visit);
  };
  visit(root);
  return ids;
}
