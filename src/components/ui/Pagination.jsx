import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "./Button";

export default function Pagination({ page, totalPages, total, pageSize, onChange }) {
  if (!total) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 px-4 py-3">
      <p className="meta">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <Button size="sm" iconOnly icon={ChevronLeft} disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Previous page
        </Button>
        <span className="px-2 text-[13px] text-body">
          {page} / {totalPages}
        </span>
        <Button size="sm" iconOnly icon={ChevronRight} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Next page
        </Button>
      </div>
    </nav>
  );
}
