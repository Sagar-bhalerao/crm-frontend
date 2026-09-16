"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shuffle } from "lucide-react";
import { buildSampleEnquiry } from "@/mock/sampleEnquiry";
import { leadService, orgService } from "@/services";
import { useAction } from "@/hooks/useAction";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { canViewLead } from "@/lib/permissions";
import { Button, Modal } from "@/components/ui";
import LeadForm, { validateLead } from "./LeadForm";

/**
 * Prototype tool: acts like the customer submitting the
 * Dave & Buster's website form. The lead is auto-assigned by outlet.
 */
export default function SimulateEnquiryDialog({ open, onClose }) {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const [outlets, setOutlets] = useState([]);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [run, busy] = useAction();

  useEffect(() => {
    if (!open) return;
    orgService.listOutlets().then((list) => {
      setOutlets(list);
      setForm(buildSampleEnquiry(list));
      setErrors({});
    });
  }, [open]);

  const submit = async () => {
    const errs = validateLead(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const lead = await run(() => leadService.simulateWebsiteEnquiry(form));
    if (!lead) return;
    onClose();
    toast.success(
      `Lead ${lead.id} created`,
      lead.assignee ? `Assigned to ${lead.assignee.name}, ${lead.outlet.name}` : `No Sales POC available at ${lead.outlet.name}`
    );
    // Only open it if this user is allowed to see it (e.g. it went to another POC)
    if (canViewLead(user, lead, lead.outlet)) router.push(`/leads/${lead.id}`);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Simulate website enquiry"
      description="Submits this as if a customer filled the website form. Details are pre-filled with sample data."
      footer={
        <>
          <Button variant="ghost" icon={Shuffle} onClick={() => setForm(buildSampleEnquiry(outlets))} className="sm:mr-auto">
            New sample
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="simulate-enquiry" loading={busy}>
            Submit enquiry
          </Button>
        </>
      }
    >
      {form && <LeadForm id="simulate-enquiry" mode="website" value={form} onChange={setForm} errors={errors} outlets={outlets} onSubmit={submit} />}
    </Modal>
  );
}
