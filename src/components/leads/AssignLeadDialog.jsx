"use client";

import { useEffect, useState } from "react";
import { useAction } from "@/hooks/useAction";
import { leadService, userService } from "@/services/admin";
import { Button, Field, Modal, Select } from "@/components/ui";

export default function AssignLeadDialog({ open, lead, onClose, onSaved }) {
  const [users, setUsers] = useState([]);
  const [assignedTo, setAssignedTo] = useState("");
  const [run, busy] = useAction();

  useEffect(() => {
    if (!open || !lead) return;
    setAssignedTo(lead.assignedTo ? String(lead.assignedTo) : "");
    // Only people who cover this location
    userService
      .listUsers({ locationId: lead.locationId, status: 1, pageSize: 100 })
      .then((r) => setUsers(r.items))
      .catch(() => setUsers([]));
  }, [open, lead]);

  if (!lead) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!assignedTo) return;
    const saved = await run(() => leadService.assignLead(lead.id, Number(assignedTo)), {
      success: "Lead assigned",
      successDescription: (l) => `${l.leadCode} is now with ${l.assignedToName}`,
    });
    if (saved) {
      onSaved?.(saved);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={lead.assignedTo ? "Reassign lead" : "Assign lead"}
      description={`${lead.leadCode} · ${lead.locationName}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="assign-lead-form" loading={busy} disabled={!assignedTo}>
            Assign
          </Button>
        </>
      }
    >
      <form id="assign-lead-form" onSubmit={submit} noValidate>
        <Field label="Sales POC" hint={users.length === 0 ? "Nobody covers this location yet." : undefined}>
          {(p) => (
            <Select
              {...p}
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Choose a person"
              options={users.map((u) => ({ value: String(u.id), label: `${u.name} (${u.roleName})` }))}
            />
          )}
        </Field>
      </form>
    </Modal>
  );
}