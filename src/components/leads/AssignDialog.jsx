"use client";

import { useEffect, useState } from "react";
import { useAction } from "@/hooks/useAction";
import { leadService, orgService } from "@/services";
import { cx } from "@/lib/utils";
import { Avatar, Button, ConfirmDialog, Field, Modal, Spinner, Textarea } from "@/components/ui";

/** Reassign a lead to another Sales POC / Sales Head of the same outlet. */
export default function AssignDialog({ open, lead, onClose }) {
  const [people, setPeople] = useState(null);
  const [selected, setSelected] = useState("");
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [run, busy] = useAction();

  useEffect(() => {
    if (!open || !lead) return;
    setSelected("");
    setNote("");
    setConfirming(false);
    setPeople(null);
    orgService.listAssignees(lead.outletId).then(setPeople).catch(() => setPeople([]));
  }, [open, lead?.id, lead?.outletId]);

  if (!lead) return null;
  const chosen = people?.find((p) => p.id === selected);

  const save = async () => {
    const ok = await run(() => leadService.assignLead(lead.id, { assigneeId: selected, note }), {
      success: `Lead assigned to ${chosen?.name}`,
    });
    if (ok) {
      setConfirming(false);
      onClose();
    }
  };

  return (
    <>
      <Modal
        open={open && !confirming}
        onClose={onClose}
        title={lead.assignee ? "Reassign lead" : "Assign lead"}
        description={`${lead.outlet.name} outlet team`}
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="primary" disabled={!selected} onClick={() => (lead.assignee ? setConfirming(true) : save())} loading={busy}>
              {lead.assignee ? "Reassign" : "Assign"}
            </Button>
          </>
        }
      >
        {!people ? (
          <Spinner label="Loading team" />
        ) : (
          <fieldset className="grid gap-2">
            <legend className="label">Assign to</legend>
            {people.map((p) => {
              const current = p.id === lead.assignedToId;
              return (
                <label
                  key={p.id}
                  className={cx(
                    "flex items-center gap-3 rounded-md border px-3 py-2.5",
                    current ? "cursor-default opacity-60" : "cursor-pointer hover:bg-subtle",
                    selected === p.id ? "border-ink bg-subtle" : "border-line"
                  )}
                >
                  <input type="radio" name="assignee" value={p.id} disabled={current} checked={selected === p.id} onChange={() => setSelected(p.id)} className="accent-[var(--color-ink)]" />
                  <Avatar name={p.name} />
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-ink">{p.name}</span>
                    <span className="meta">{p.roleLabel}{current ? ", current owner" : ""}</span>
                  </span>
                </label>
              );
            })}
          </fieldset>
        )}
        <Field label="Note" hint="Optional. Visible on the timeline." className="mt-4">
          {(p) => <Textarea {...p} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />}
        </Field>
      </Modal>

      <ConfirmDialog
        open={confirming}
        title="Reassign this lead?"
        description={`${lead.id} will move from ${lead.assignee?.name} to ${chosen?.name}. ${chosen?.name} will be notified.`}
        confirmLabel="Reassign"
        loading={busy}
        onConfirm={save}
        onClose={() => setConfirming(false)}
      />
    </>
  );
}
