"use client";

import { useEffect, useState } from "react";
import { useAction } from "@/hooks/useAction";
import { leadService } from "@/services";
import { Button, Modal } from "@/components/ui";
import LeadForm, { leadToForm, validateLead } from "./LeadForm";

export default function LeadEditDialog({ open, lead, onClose }) {
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [run, busy] = useAction();

  useEffect(() => {
    if (open && lead) {
      setForm(leadToForm(lead));
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lead?.id]);

  if (!lead || !form) return null;

  const save = async () => {
    const errs = validateLead(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const ok = await run(() => leadService.updateLeadDetails(lead.id, form), { success: "Lead details saved" });
    if (ok) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={`Edit ${lead.id}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="edit-lead" loading={busy}>Save changes</Button>
        </>
      }
    >
      <LeadForm id="edit-lead" mode="edit" value={form} onChange={setForm} errors={errors} outlets={[lead.outlet]} onSubmit={save} />
    </Modal>
  );
}
