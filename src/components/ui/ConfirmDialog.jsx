"use client";

import Button from "./Button";
import Modal from "./Modal";

/** Confirmation for important actions (finalize, not interested, reassign). */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  tone = "primary",
  loading,
  onConfirm,
  onClose,
  children,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description && <p className="text-sm text-body">{description}</p>}
      {children}
    </Modal>
  );
}
