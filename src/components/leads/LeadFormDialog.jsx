"use client";

import { useEffect, useState } from "react";
import { useAction } from "@/hooks/useAction";
import { leadService } from "@/services/admin";
import { Button, Modal } from "@/components/ui";
import LeadForm, { EMPTY_LEAD, brandsOf, formToPayload, leadToForm, validateLead } from "./LeadForm";

/**
 * Add or edit a lead in a dialog, using the same form as the New lead page.
 * options comes from GET /leads/options, which includes the locations this
 * user may use. The `locations` prop is only a fallback for older callers.
 */
export default function LeadFormDialog({ open, lead, options = {}, locations = [], onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_LEAD);
  const [errors, setErrors] = useState({});
  const [run, busy] = useAction();
  const isEdit = Boolean(lead);

  const usable = options.locations || locations;
  // An edited lead may sit at a location this user no longer covers; keep it choosable
  const list = isEdit && !usable.some((l) => l.id === lead.locationId)
    ? [...usable, { id: lead.locationId, name: lead.locationName, brandId: lead.brandId, brandName: lead.brandName }]
    : usable;

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (lead) {
      setForm(leadToForm(lead));
      return;
    }
    const brands = brandsOf(usable);
    setForm({
      ...EMPTY_LEAD,
      brandId: brands.length === 1 ? String(brands[0].id) : "",
      locationId: usable.length === 1 ? String(usable[0].id) : "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lead]);

  const submit = async () => {
    const found = validateLead(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = formToPayload(form, { isEdit });
    const saved = await run(
      () => (isEdit ? leadService.updateLead(lead.id, payload) : leadService.createLead(payload)),
      {
        success: isEdit ? "Lead updated" : "Lead created",
        successDescription: (l) => (isEdit ? undefined : `${l.leadCode}${l.assignedToName ? `, assigned to ${l.assignedToName}` : ""}`),
      }
    );
    if (saved) {
      onSaved?.(saved);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? `Edit ${lead.leadCode}` : "Add lead"}
      description={isEdit ? undefined : "For enquiries that come in by phone, walk-in, email or referral."}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" type="submit" form="lead-form" loading={busy}>
            {isEdit ? "Save changes" : "Create lead"}
          </Button>
        </>
      }
    >
      <LeadForm
        id="lead-form"
        mode={isEdit ? "edit" : "create"}
        value={form}
        onChange={setForm}
        errors={errors}
        locations={list}
        options={options}
        onSubmit={submit}
      />
    </Modal>
  );
}