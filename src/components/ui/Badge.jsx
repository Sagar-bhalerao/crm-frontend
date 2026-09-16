import { cx } from "@/lib/utils";

/** <Badge tone="blue" dot>New</Badge> — tones defined in globals.css */
export default function Badge({ tone = "gray", dot = false, className, children }) {
  return (
    <span className={cx("badge", `tone-${tone}`, className)}>
      {dot && <span className="badge-dot" aria-hidden />}
      {children}
    </span>
  );
}
