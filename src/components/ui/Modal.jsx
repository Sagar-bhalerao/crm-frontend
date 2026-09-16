"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cx } from "@/lib/utils";

const SIZES = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-4xl" };

/**
 * Dialog. On mobile it opens as a bottom sheet.
 * <Modal open title="..." onClose={...} footer={<Button/>}>body</Modal>
 */
export default function Modal({ open, onClose, title, description, size = "md", footer, children, dismissible = true }) {
  const panelRef = useRef(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusable = panelRef.current?.querySelector("input, select, textarea, button:not([data-close])");
    (focusable || panelRef.current)?.focus();

    const onKey = (e) => {
      if (e.key === "Escape" && dismissible) onCloseRef.current?.();
      if (e.key === "Tab" && panelRef.current) {
        const nodes = panelRef.current.querySelectorAll("a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex='-1'])");
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, dismissible]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-ink/45" onClick={dismissible ? onClose : undefined} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx(
          "relative flex w-full flex-col bg-surface shadow-xl outline-none",
          "max-h-[92dvh] rounded-t-xl sm:rounded-lg animate-[sheet-in_180ms_ease-out]",
          SIZES[size]
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="section-title">{title}</h2>
            {description && <p className="meta mt-0.5">{description}</p>}
          </div>
          {dismissible && (
            <button data-close onClick={onClose} className="btn btn-ghost btn-sm w-8 px-0 -mr-2" aria-label="Close">
              <X size={18} />
            </button>
          )}
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-3 sm:flex-row sm:justify-end [&>.btn]:w-full sm:[&>.btn]:w-auto">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
