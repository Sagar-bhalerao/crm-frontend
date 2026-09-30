"use client";

import { Pencil } from "lucide-react";
import { Button, Modal } from "@/components/ui";

/**
 * Read-only view of one configuration.
 * items: [{ label, value, wide?, pre? }] — `pre` keeps line breaks (message text).
 */
export default function ConfigDetailsDialog({ open, title, description, items = [], onClose, onEdit }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          {onEdit && <Button variant="primary" icon={Pencil} onClick={onEdit}>Edit</Button>}
        </>
      }
    >
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className={item.wide ? "sm:col-span-2" : undefined}>
            <dt className="meta">{item.label}</dt>
            <dd
              className={
                item.pre
                  ? "mt-1 max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-subtle px-3 py-2 text-sm text-ink"
                  : "mt-0.5 break-words text-sm text-ink"
              }
            >
              {item.value === null || item.value === undefined || item.value === "" ? "—" : item.value}
            </dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
