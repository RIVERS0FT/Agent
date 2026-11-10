import { ArrowUpRight, BookOpen, Layers3, X } from "lucide-react";
import type { KnowledgeItem } from "../types";

type DetailPanelProps = {
  item: KnowledgeItem;
  color: string;
  onClose: () => void;
};

export function DetailPanel({ item, color, onClose }: DetailPanelProps) {
  const isCategory = (item.children?.length ?? 0) > 0;

  return (
    <aside className="detail-panel" aria-label="知识节点详情">
      <div className="detail-panel-top">
        <div>
          <span className="detail-panel-eyebrow">NODE INSIGHT</span>
          <span className="detail-panel-status">知识节点</span>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="关闭详情">
          <X size={18} />
        </button>
      </div>

      <div className="detail-accent" style={{ background: color }} />
      <div className="detail-kind">{isCategory ? "KNOWLEDGE DOMAIN" : "KNOWLEDGE TOPIC"}</div>
      <h2>{item.title}</h2>
      <p className="detail-summary">{item.summary}</p>

      <section className="detail-section">
        <div className="detail-section-title">
          <BookOpen size={15} />
          <h3>核心理解</h3>
        </div>
        <p className="detail-description">{item.description}</p>
      </section>

      <section className="detail-section">
        <div className="detail-section-title">
          <span className="detail-number">01</span>
          <h3>关键知识点</h3>
        </div>
        <ul className="detail-points">
          {item.points.map((point, index) => (
            <li key={point}>
              <span className="point-index">{String(index + 1).padStart(2, "0")}</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </section>

      {!!item.tags?.length && (
        <section className="detail-section">
          <div className="detail-section-title">
            <span className="detail-number">02</span>
            <h3>关键词</h3>
          </div>
          <div className="detail-tags">
            {item.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </section>
      )}

      {!!item.children?.length && (
        <section className="detail-section">
          <div className="detail-section-title">
            <Layers3 size={15} />
            <h3>下级主题</h3>
          </div>
          <div className="detail-child-list">
            {item.children.map((child, index) => (
              <div className="detail-child-item" key={child.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{child.title}</strong>
              </div>
            ))}
          </div>
        </section>
      )}

      {!!item.resources?.length && (
        <section className="detail-section">
          <div className="detail-section-title">
            <span className="detail-number">03</span>
            <h3>延伸阅读</h3>
          </div>
          <div className="detail-resources">
            {item.resources.map((resource) => (
              <a href={resource.url} key={resource.url} target="_blank" rel="noreferrer">
                <span>{resource.label}</span>
                <ArrowUpRight size={15} />
              </a>
            ))}
          </div>
        </section>
      )}

      <div className="detail-panel-foot">
        <span className="detail-foot-dot" />
        点击画布空白处可关闭详情
      </div>
    </aside>
  );
}
