import { ChevronDown, ChevronRight } from "lucide-react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { CSSProperties } from "react";
import type { KnowledgeNodeData } from "../types";

type KnowledgeFlowNode = Node<KnowledgeNodeData, "knowledge">;

function ExpandButton({ data }: { data: KnowledgeNodeData }) {
  if (!data.hasChildren || data.kind === "root") return null;

  return (
    <button
      type="button"
      className="expand-node-button nodrag"
      aria-label={data.expanded ? "收起下级节点" : "展开下级节点"}
      title={data.expanded ? "收起下级节点" : "展开下级节点"}
      onClick={(event) => {
        event.stopPropagation();
        data.onToggle(data.item.id);
      }}
    >
      {data.expanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
    </button>
  );
}

export function KnowledgeNode({ data, selected }: NodeProps<KnowledgeFlowNode>) {
  const className =
    "knowledge-node node-" +
    data.kind +
    ((selected || data.selected) ? " is-selected" : "");

  const accentStyle = { "--node-accent": data.color } as CSSProperties;
  const childCount = data.item.children?.length ?? 0;
  const countLabel =
    data.kind === "root"
      ? childCount + " 个模块"
      : data.kind === "module"
        ? childCount + " 项能力"
        : childCount + " 种技术实现";

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

      <div className="node-main">
        {data.kind === "root" ? (
          <h2 className="node-title">{data.item.title}</h2>
        ) : (
          <h3 className="node-title">{data.item.title}</h3>
        )}
        <p className="node-summary">{data.item.summary}</p>
      </div>

      {data.hasChildren && (
        <div className="node-footer">
          <span className="node-child-count">{countLabel}</span>
          <ExpandButton data={data} />
        </div>
      )}
    </div>
  );
}
