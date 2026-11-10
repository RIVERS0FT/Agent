import { ChevronDown, ChevronRight, CircleDot } from "lucide-react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { CSSProperties } from "react";
import type { KnowledgeNodeData } from "../types";

type KnowledgeFlowNode = Node<KnowledgeNodeData, "knowledge">;

function ExpandButton({ data }: { data: KnowledgeNodeData }) {
  if (!data.hasChildren) return null;
  return (
    <button
      type="button"
      className="expand-node-button nodrag"
      aria-label={data.expanded ? "收起下级" : "展开下级"}
      title={data.expanded ? "收起下级" : "展开下级"}
      onClick={(event) => {
        event.stopPropagation();
        data.onToggle(data.item.id);
      }}
    >
      {data.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
    </button>
  );
}

export function KnowledgeNode({ data, selected }: NodeProps<KnowledgeFlowNode>) {
  const className =
    "knowledge-node node-" +
    data.kind +
    ((selected || data.selected) ? " is-selected" : "");

  const accentStyle = { "--node-accent": data.color } as CSSProperties;

  return (
    <div className={className} style={accentStyle}>
      {data.kind !== "root" && (
        <Handle
          id="target"
          type="target"
          position={Position.Left}
          isConnectable={false}
          className="node-handle"
        />
      )}

      {data.hasChildren && data.expanded && (
        <Handle
          id="source"
          type="source"
          position={Position.Right}
          isConnectable={false}
          className="node-handle"
        />
      )}

      {data.kind === "root" && (
        <>
          <div className="root-node-kicker">
            <span className="root-node-pulse" />
            <span>AGENT SYSTEM</span>
          </div>
          <h2>{data.item.title}</h2>
          <p>{data.item.summary}</p>
          <div className="root-node-bottom">
            <span><CircleDot size={12} /> 功能模块总览</span>
            <span>从左到右探索</span>
          </div>
        </>
      )}

      {data.kind === "module" && (
        <>
          <div className="module-node-top">
            <span className="module-index">{data.indexLabel}</span>
            <span className="module-kicker">AGENT MODULE</span>
            <span className="module-accent" />
          </div>
          <div className="module-title-row">
            <h3>{data.item.title}</h3>
            <ExpandButton data={data} />
          </div>
          <p>{data.item.summary}</p>
          <div className="module-node-bottom">
            <span>{data.item.children?.length ?? 0} 项内部能力</span>
            <span>{data.expanded ? "已展开" : "展开模块"}</span>
          </div>
        </>
      )}

      {data.kind === "capability" && (
        <>
          <div className="capability-node-top">
            <span className="capability-node-dot" />
            <span>CAPABILITY</span>
          </div>
          <div className="capability-title-row">
            <h3>{data.item.title}</h3>
            <ExpandButton data={data} />
          </div>
          <p>{data.item.summary}</p>
          <div className="capability-node-bottom">
            <span>{data.item.children?.length ?? 0} 种技术实现</span>
            <span>{data.expanded ? "已展开" : "查看实现"}</span>
          </div>
        </>
      )}

      {data.kind === "implementation" && (
        <>
          <div className="implementation-node-kicker">
            <span className="implementation-node-dot" />
            <span>IMPLEMENTATION</span>
          </div>
          <h3>{data.item.title}</h3>
          <p>{data.item.summary}</p>
          {!!data.item.tags?.length && (
            <div className="implementation-node-tags">
              {data.item.tags.slice(0, 2).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
