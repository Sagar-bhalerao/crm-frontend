"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, MapPin, RotateCcw, ShieldCheck, Users } from "lucide-react";
import { LEAD_STATUSES } from "@/config/leadStatuses";
import { LEAD_TYPES, LEAD_SOURCES } from "@/config/leadOptions";
import { P } from "@/config/permissions";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useAction } from "@/hooks/useAction";
import { formatDateTime } from "@/lib/format";
import { settingsService } from "@/services/admin";
import { Badge, Button, ConfirmDialog, ErrorState, Field, Input, PageHeader, Panel, Skeleton } from "@/components/ui";
import ReadOnlyNotice from "./ReadOnlyNotice";

/** Editable numbers, with the units and where each one is used. */
const FIELDS = [
  { key: "taxRate", label: "GST rate", suffix: "%", hint: "Applied to new quotations.", min: 0, max: 100 },
  { key: "advancePercent", label: "Advance required", suffix: "%", hint: "Default on a new proforma invoice.", min: 0, max: 100 },
  { key: "quotationValidDays", label: "Quotation validity", suffix: "days", hint: "How long a shared quotation stays valid.", min: 1, max: 365 },
  { key: "leadResponseHours", label: "First response target", suffix: "hours", hint: "A new lead is flagged on the dashboard after this.", min: 1, max: 72 },
  { key: "pageSize", label: "Rows per page", suffix: "rows", hint: "Used by the configuration lists.", min: 5, max: 100 },
];

export default function SettingsView() {
  const { can } = useAuth();
  const { settings, reload } = useSettings();
  const [data, setData] = useState(null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [run, busy] = useAction();

  const canManage = can(P.SETTINGS_MANAGE);

  const load = async () => {
    setError(null);
    try {
      const res = await settingsService.getSettings();
      setData(res);
      setForm(res.values);
      setErrors({});
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="page">
        <PageHeader title="Configuration" />
        <div className="panel"><ErrorState error={error} onRetry={load} /></div>
      </div>
    );
  }

  const dirty = data && FIELDS.some((f) => String(form[f.key]) !== String(data.values[f.key]));

  const validate = () => {
    const found = {};
    for (const f of FIELDS) {
      const value = Number(form[f.key]);
      if (form[f.key] === "" || Number.isNaN(value)) found[f.key] = "Enter a number";
      else if (value < f.min || value > f.max) found[f.key] = `Must be between ${f.min} and ${f.max}`;
    }
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const save = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const changes = Object.fromEntries(FIELDS.map((f) => [f.key, Number(form[f.key])]));
    const saved = await run(() => settingsService.updateSettings(changes), {
      success: "Settings saved",
      successDescription: "They apply the next time a quotation or invoice is created.",
    });
    if (saved) {
      setData(saved);
      setForm(saved.values);
      reload();
    }
  };

  const confirmReset = async () => {
    const saved = await run(() => settingsService.resetSettings(), { success: "Settings reset to defaults" });
    setResetting(false);
    if (saved) {
      setData(saved);
      setForm(saved.values);
      reload();
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Configuration"
        description="Settings that apply across every brand in the CRM."
        actions={
          canManage && data && (
            <Button size="sm" icon={RotateCcw} onClick={() => setResetting(true)} disabled={busy}>
              Reset to defaults
            </Button>
          )
        }
      />

      {!canManage && <ReadOnlyNotice what="the configuration" />}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid content-start gap-4">
          <Panel
            title="Quotation and invoice defaults"
            description={data?.updatedAt ? `Last changed ${formatDateTime(data.updatedAt)}` : "Using the built-in defaults"}
          >
            {!data ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : (
              <form onSubmit={save} noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  {FIELDS.map((f) => (
                    <Field key={f.key} label={f.label} hint={f.hint} error={errors[f.key]}>
                      {(p) => (
                        <div className="relative">
                          <Input
                            {...p}
                            type="number"
                            inputMode="numeric"
                            min={f.min}
                            max={f.max}
                            value={form[f.key] ?? ""}
                            disabled={!canManage}
                            onChange={(e) => {
                              setForm({ ...form, [f.key]: e.target.value });
                              setErrors((prev) => ({ ...prev, [f.key]: undefined }));
                            }}
                            className="pr-16"
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-muted">
                            {f.suffix}
                          </span>
                        </div>
                      )}
                    </Field>
                  ))}
                </div>

                {canManage && (
                  <div className="mt-5 flex items-center gap-2 border-t border-line pt-4">
                    <Button type="submit" variant="primary" loading={busy} disabled={!dirty}>Save changes</Button>
                    {dirty && (
                      <Button variant="secondary" onClick={() => { setForm(data.values); setErrors({}); }}>Discard</Button>
                    )}
                    {!dirty && <p className="meta">No unsaved changes</p>}
                  </div>
                )}
              </form>
            )}
          </Panel>

          <Panel title="Lead workflow" description="Defined in code today. Editing moves here once leads run on the API.">
            <p className="label">Statuses</p>
            <ul className="mb-4 flex flex-wrap gap-1.5">
              {LEAD_STATUSES.map((s) => (
                <li key={s.key}><Badge tone={s.tone} dot>{s.label}</Badge></li>
              ))}
            </ul>

            <p className="label">Lead types</p>
            <ul className="mb-4 flex flex-wrap gap-1.5">
              {LEAD_TYPES.map((t) => (
                <li key={t.key}><span className="chip">{t.label}</span></li>
              ))}
            </ul>

            <p className="label">Sources</p>
            <ul className="flex flex-wrap gap-1.5">
              {LEAD_SOURCES.map((s) => (
                <li key={s.value}><span className="chip">{s.label}</span></li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="grid content-start gap-4">
          <Panel title="Global entities" bodyClassName="p-0">
            <ul className="divide-y divide-line">
              <ConfigLink href="/brands" icon={Building2} label="Brands" hint="Add, edit and deactivate brands" />
              <ConfigLink href="/locations" icon={MapPin} label="Locations" hint="Outlets that belong to a brand" />
              <ConfigLink href="/users" icon={Users} label="Users" hint="Read-only until the user API lands" />
              <ConfigLink href="/roles" icon={ShieldCheck} label="Roles & permissions" hint="What each role may do" />
            </ul>
          </Panel>

          <Panel title="Where these apply">
            <p className="text-[13px] text-body">
              Values here are stored in PostgreSQL and shared by everyone. They set the starting point for new
              quotations and invoices; documents already created keep the numbers they were made with.
            </p>
          </Panel>
        </div>
      </div>

      <ConfirmDialog
        open={resetting}
        title="Reset to defaults?"
        description="Every value on this page goes back to the built-in default. Brands, locations and leads are not affected."
        confirmLabel="Reset"
        tone="danger"
        loading={busy}
        onConfirm={confirmReset}
        onClose={() => setResetting(false)}
      />
    </div>
  );
}

function ConfigLink({ href, icon: Icon, label, hint }) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 px-4 py-3 hover:bg-subtle">
        <Icon size={16} className="shrink-0 text-muted" />
        <span className="min-w-0">
          <span className="block text-sm font-medium text-ink">{label}</span>
          <span className="meta block truncate">{hint}</span>
        </span>
      </Link>
    </li>
  );
}
