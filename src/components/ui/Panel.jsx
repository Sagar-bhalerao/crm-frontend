import { cx } from "@/lib/utils";

/** Bordered section with optional header and actions. */
export default function Panel({ title, description, actions, className, bodyClassName, children, as: Tag = "section" }) {
  return (
    <Tag className={cx("panel min-w-0", className)}>
      {(title || actions) && (
        <div className="panel-header">
          <div className="min-w-0">
            {title && <h2 className="section-title">{title}</h2>}
            {description && <p className="meta mt-0.5">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cx("panel-body", bodyClassName)}>{children}</div>
    </Tag>
  );
}
