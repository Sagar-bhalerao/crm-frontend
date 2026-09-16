"use client";

import { useEffect, useState } from "react";
import { getStatus, NOT_INTERESTED_REASONS } from "@/config/leadStatuses";
import { useAuth } from "@/context/AuthContext";
import { useAction } from "@/hooks/useAction";
import { getNextStatuses, getRequirementError } from "@/lib/leadWorkflow";
import { leadService } from "@/services";
import { cx } from "@/lib/utils";
import { Button, ConfirmDialog, Field, Modal, Select, Textarea } from "@/components/ui";
import LeadStatusBadge from "./LeadStatusBadge";

/**
 * Change status. Options and rules come from config/leadStatuses.js.
 * `onNeed(action)` lets the page open the quotation / invoice / finalize flow.
 */
export default function StatusDialog({ open, lead, onClose, onNeed }) {
  const { user } = useAuth();
  const [target, setTarget] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [run, busy] = useAction();

  useEffect(() => {
    if (open) {
      setTarget("");
      setReason("");
      setNote("");
      setConfirming(false);
    }
  }, [open]);

  if (!lead) return null;
  const options = getNextStatuses(lead, user);
  const selected = target ? getStatus(target) : null;
  const requirement = target ? getRequirementError(lead, target) : null;
  const goesToFinalize = target === "finalized";

  const save = async () => {
    const ok = await run(() => leadService.changeStatus(lead.id, { status: target, reason, note }), {
      success: `Status changed to ${selected.label}`,
    });
    if (ok) {
      setConfirming(false);
      onClose();
    }
  };

  const primary = () => {
    if (requirement) {
      onClose();
      onNeed(selected.requires === "quotation" ? "quotation" : "invoice");
      return;
    }
    if (goesToFinalize) {
      onClose();
      onNeed("finalize");
      return;
    }
    if (selected.confirm) setConfirming(true);
    else save();
  };

  const primaryLabel = requirement
    ? selected.requires === "quotation"
      ? "Create quotation"
      : "Generate proforma invoice"
    : goesToFinalize
    ? "Continue to finalize"
    : selected?.confirm
    ? `Mark as ${selected.label.toLowerCase()}`
    : "Update status";

  return (
    <>
      <Modal
        open={open && !confirming}
        onClose={onClose}
        title="Update status"
        description={`${lead.id}, ${lead.customer.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button
              variant={selected?.needsReason ? "danger" : "primary"}
              disabled={!target || (selected?.needsReason && !reason)}
              loading={busy}
              onClick={primary}
            >
              {target ? primaryLabel : "Update status"}
            </Button>
          </>
        }
      >
        <div className="mb-4 flex items-center gap-2 text-sm">
          <span className="text-muted">Current</span>
          <LeadStatusBadge status={lead.status} />
        </div>

        {options.length === 0 ? (
          <p className="text-sm text-muted">This lead is closed. No further status changes are possible.</p>
        ) : (
          <fieldset>
            <legend className="label">Move to</legend>
            <div className="grid gap-2">
              {options.map((s) => (
                <label
                  key={s.key}
                  className={cx(
                    "flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 transition-colors",
                    target === s.key ? "border-ink bg-subtle" : "border-line hover:bg-subtle"
                  )}
                >
                  <input type="radio" name="status" value={s.key} checked={target === s.key} onChange={() => setTarget(s.key)} className="accent-[var(--color-ink)]" />
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-ink">{s.label}</span>
                    <span className="meta">{s.hint}</span>
                  </span>
                  <span className={cx("h-2.5 w-2.5 rounded-full", `tone-${s.tone}`, "bg-[var(--tone)]")} aria-hidden />
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {requirement && <p className="mt-3 rounded-md bg-warning-soft px-3 py-2 text-[13px] text-warning">{requirement}</p>}

        {selected?.needsReason && (
          <Field label="Reason" required className="mt-4">
            {(p) => <Select {...p} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Choose a reason" options={NOT_INTERESTED_REASONS.map((r) => ({ value: r, label: r }))} />}
          </Field>
        )}

        {target && !requirement && !goesToFinalize && (
          <Field label="Note" hint="Optional. Added to the activity timeline." className="mt-4">
            {(p) => <Textarea {...p} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />}
          </Field>
        )}
      </Modal>

      <ConfirmDialog
        open={confirming}
        title={`Mark ${lead.id} as ${selected?.label.toLowerCase()}?`}
        description={
          selected?.needsReason
            ? `The lead will be closed with the reason "${reason}". Pending follow-ups are cleared. You can reopen it later.`
            : "Please confirm this change."
        }
        confirmLabel={`Mark as ${selected?.label.toLowerCase()}`}
        tone={selected?.needsReason ? "danger" : "primary"}
        loading={busy}
        onConfirm={save}
        onClose={() => setConfirming(false)}
      />
    </>
  );
}
