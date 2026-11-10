export type KnowledgeResource = {
  label: string;
  url: string;
};

export type KnowledgeItem = {
  id: string;
  title: string;
  summary: string;
  description: string;
  points: string[];
  tags?: string[];
  color?: string;
  resources?: KnowledgeResource[];
  children?: KnowledgeItem[];
};

export type KnowledgeNodeData = {
  item: KnowledgeItem;
  kind: "root" | "category" | "topic";
  color: string;
  indexLabel?: string;
  expanded: boolean;
  hasChildren: boolean;
  selected: boolean;
  onToggle: (id: string) => void;
};
