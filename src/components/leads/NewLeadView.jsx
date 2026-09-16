"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { P } from "@/config/permissions";
import { useAuth } from "@/context/AuthContext";
import { useAction } from "@/hooks/useAction";
import { leadService, orgService } from "@/services";
import { canViewLead } from "@/lib/permissions";
import { Button, PageHeader, Spinner } from "@/components/ui";
import LeadForm, { EMPTY_LEAD, validateLead } from "./LeadForm";

export default function NewLeadView() {
  const { user, can } = useAuth();
  const router = useRouter();
  const [outlets, setOutlets] = useState(null);
  const [form, setForm] = useState(EMPTY_LEAD);
  const [errors, setErrors] = useState({});
  const [run, busy] = useAction();

  useEffect(() => {
    orgService.listOutlets().then((list) => {
      setOutlets(list);
      if (list.length === 1) setForm((f) => ({ ...f, outletId: list[0].id }));
    });
  }, []);

  const submit = async () => {
    const errs = validateLead(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.querySelector("[aria-invalid='true']")?.focus();
      return;
    }
    const lead = await run(() => leadService.createLead(form), {
      success: (l) => `Lead ${l.id} created`,
      successDescription: (l) => (l.assignee ? `Assigned to ${l.assignee.name}` : "Not assigned yet"),
    });
    if (lead) router.push(canViewLead(user, lead, lead.outlet) ? `/leads/${lead.id}` : "/leads");
  };

  return (
    <div className="page max-w-3xl pb-28 sm:pb-6">
      <PageHeader title="New lead" description="For enquiries received by phone, walk-in, email or referral." />

      <section className="panel p-4 sm:p-6">
        {!outlets ? (
          <Spinner />
        ) : (
          <LeadForm id="new-lead" mode="create" value={form} onChange={setForm} errors={errors} outlets={outlets} canAssign={can(P.LEAD_ASSIGN)} onSubmit={submit} />
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-line bg-surface p-3 sm:static sm:mt-4 sm:justify-end sm:border-0 sm:bg-transparent sm:p-0">
        <Button variant="secondary" href="/leads" className="flex-1 sm:flex-none">Cancel</Button>
        <Button variant="primary" type="submit" form="new-lead" loading={busy} className="flex-1 sm:flex-none">Create lead</Button>
      </div>
    </div>
  );
}
