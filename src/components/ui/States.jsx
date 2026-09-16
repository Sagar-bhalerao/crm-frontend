import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import Button from "./Button";
import { cx } from "@/lib/utils";

export function Spinner({ label = "Loading", className }) {
  return (
    <div role="status" className={cx("flex items-center justify-center gap-2 py-10 text-muted", className)}>
      <Loader2 size={18} className="animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cx("skeleton", className)} aria-hidden />;
}

/** Empty screens should tell the user what to do next. */
export function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
  return (
    <div className={cx("flex flex-col items-center text-center px-6 py-12", className)}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-subtle text-muted">
        <Icon size={20} />
      </div>
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="meta mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, className }) {
  const status = error?.status;
  const title = status === 404 ? "Not found" : status === 403 ? "No access" : "Couldn't load this";
  return (
    <div className={cx("flex flex-col items-center text-center px-6 py-12", className)}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-danger-soft text-danger">
        <AlertTriangle size={20} />
      </div>
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="meta mt-1 max-w-sm">{error?.message || "Check your connection and try again."}</p>
      {onRetry && status !== 404 && status !== 403 && (
        <Button className="mt-4" size="sm" onClick={() => onRetry()}>
          Try again
        </Button>
      )}
    </div>
  );
}
