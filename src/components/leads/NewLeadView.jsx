"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "@/hooks/useAction";
import { leadService } from "@/services/admin";
import { Button, ErrorState, PageHeader, Spinner } from "@/components/ui";
import LeadForm, { EMPTY_LEAD, brandsOf, formToPayload, validateLead } from "./LeadForm";

export default function NewLeadView() {
  const router = useRouter();
  const [options, setOptions] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [form, setForm] = useState(EMPTY_LEAD);
  const [errors, setErrors] = useState({});
  const [run, busy] = useAction();

  const load = () => {
    setLoadError(null);
    leadService
      .getOptions()
      .then((opts) => {
        setOptions(opts);
        // One brand or one location: choose it for them
        const locations = opts.locations || [];
        const brands = brandsOf(locations);
        setForm((f) => ({
          ...f,
          brandId: brands.length === 1 ? String(brands[0].id) : f.brandId,
          locationId: locations.length === 1 ? String(locations[0].id) : f.locationId,
        }));
      })
      .catch(setLoadError);
  };

  useEffect(load, []);

  const submit = async () => {
    const found = validateLead(form);
    setErrors(found);
    if (Object.keys(found).length) {
      document.querySelector("[aria-invalid='true']")?.focus();
      return;
    }

    const lead = await run(() => leadService.createLead(formToPayload(form)), {
      success: (l) => `Lead ${l.leadCode} created`,
      successDescription: (l) => (l.assignedToName ? `Assigned to ${l.assignedToName}` : "Not assigned yet"),
    });
    if (lead) router.push(`/leads/${lead.id}`);
  };

  return (
    <div className="page max-w-3xl pb-28 sm:pb-6">
      <PageHeader title="New lead" description="For enquiries received by phone, walk-in, email or referral, for any brand." />

      <section className="panel p-4 sm:p-6">
        {loadError ? (
          <ErrorState error={loadError} onRetry={load} />
        ) : !options ? (
          <Spinner />
        ) : (
          <LeadForm
            id="new-lead"
            mode="create"
            value={form}
            onChange={(v) => {
              setForm(v);
              if (Object.keys(errors).length) setErrors(validateLead(v));
            }}
            errors={errors}
            locations={options.locations || []}
            options={options}
            onSubmit={submit}
          />
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-line bg-surface p-3 sm:static sm:mt-4 sm:justify-end sm:border-0 sm:bg-transparent sm:p-0">
        <Button variant="secondary" href="/leads" className="flex-1 sm:flex-none">Cancel</Button>
        <Button variant="primary" type="submit" form="new-lead" loading={busy} disabled={!options} className="flex-1 sm:flex-none">
          Create lead
        </Button>
      </div>
    </div>
  );
}