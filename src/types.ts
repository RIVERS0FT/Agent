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
  relatedIds?: string[];
  children?: KnowledgeItem[];
};

export type KnowledgeNodeData = {
  item: KnowledgeItem;
  kind: "root" | "module" | "capability" | "implementation";
  color: string;
  indexLabel?: string;
  expanded: boolean;
  hasChildren: boolean;
  selected: boolean;
  onToggle: (id: string) => void;
};
