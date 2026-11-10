import { ChevronDown, ChevronRight, CircleDot } from "lucide-react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { CSSProperties } from "react";
import type { KnowledgeNodeData } from "../types";

type KnowledgeFlowNode = Node<KnowledgeNodeData, "knowledge">;

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
            <span>AGENT KNOWLEDGE SYSTEM</span>
          </div>
          <h2>{data.item.title}</h2>
          <p>{data.item.summary}</p>
          <div className="root-node-bottom">
            <span><CircleDot size={12} /> 交互式知识地图</span>
            <span>从左到右探索</span>
          </div>
        </>
      )}

      {data.kind === "category" && (
        <>
          <div className="category-node-top">
            <span className="category-index">{data.indexLabel}</span>
            <span className="category-kicker">KNOWLEDGE DOMAIN</span>
            <span className="category-accent" />
          </div>
          <div className="category-title-row">
            <h3>{data.item.title}</h3>
            <button
              type="button"
              className="expand-node-button nodrag"
              aria-label={data.expanded ? "收起主题" : "展开主题"}
              title={data.expanded ? "收起主题" : "展开主题"}
              onClick={(event) => {
                event.stopPropagation();
                data.onToggle(data.item.id);
              }}
            >
              {data.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
          <p>{data.item.summary}</p>
          <div className="category-node-bottom">
            <span>{data.item.children?.length ?? 0} 个主题</span>
            <span>{data.expanded ? "点击收起" : "点击展开"}</span>
          </div>
        </>
      )}

      {data.kind === "topic" && (
        <>
          <div className="topic-node-kicker">
            <span className="topic-node-dot" />
            <span>TOPIC</span>
          </div>
          <h3>{data.item.title}</h3>
          <p>{data.item.summary}</p>
          {!!data.item.tags?.length && (
            <div className="topic-node-tags">
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
