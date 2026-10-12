"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, CalendarDays, CheckCircle2, FileText, MapPin,
  Pencil, PhoneCall, Tag, UserCheck,CircleDot, FilePlus, Receipt, Send, UserPlus
} from "lucide-react";
import { P } from "@/config/permissions";
import { useAuth } from "@/context/AuthContext";
import { useAction } from "@/hooks/useAction";
import { formatDate, formatDateTime } from "@/lib/format";
import { cx } from "@/lib/utils";
import { leadService, locationService, userService } from "@/services/admin";
import {
  Avatar, Badge, Button, ErrorState, Field, Input, Modal,
  Select, Skeleton, Tabs, Textarea,
} from "@/components/ui";
import LeadFormDialog from "./LeadFormDialog";

/** The five stages shown on the progress rail, in order. */
const PIPELINE = ["new", "in_progress", "quotation", "proforma_invoice", "finalized"];

const STATUS_TONE = {
  new: "blue", assigned: "violet", in_progress: "amber", quotation: "violet",
  proforma_invoice: "teal", finalized: "green", not_interested: "gray", cancelled: "gray",
};
/** Icon and colour per activity type. Unknown types fall back to the dot. */
const ACTIVITY_STYLE = {
  created: { icon: FilePlus, tone: "bg-accent-soft text-accent" },
  assigned: { icon: UserPlus, tone: "bg-subtle text-muted" },
  status_changed: { icon: CircleDot, tone: "bg-warning-soft text-warning" },
  followup: { icon: PhoneCall, tone: "bg-subtle text-body" },
  updated: { icon: Pencil, tone: "bg-subtle text-muted" },
  quotation: { icon: FileText, tone: "bg-[#ede9fe] text-[#7c3aed]" },
  invoice: { icon: Receipt, tone: "bg-[#ccfbf1] text-[#0f766e]" },
  message_sent: { icon: Send, tone: "bg-success-soft text-success" },
  default: { icon: CircleDot, tone: "bg-subtle text-muted" },
};

/** Bar colour per stage, matching the badge tones. */
const STAGE_BAR = {
  new: "bg-accent",
  in_progress: "bg-[#b45309]",
  quotation: "bg-[#7c3aed]",
  proforma_invoice: "bg-[#0f766e]",
  finalized: "bg-success",
};

export default function LeadDetailPage({ id }) {
  const { can } = useAuth();
  const [lead, setLead] = useState(null);
  const [options, setOptions] = useState({ statuses: [], types: [], timeSlots: [], followupChannels: [], followupOutcomes: [] });
  const [locations, setLocations] = useState([]);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("details");
  const [dialog, setDialog] = useState(null); // edit | status | assign | followup

  const canUpdate = can(P.LEAD_UPDATE);
  const canAssign = can(P.LEAD_ASSIGN);
  const canFollowup = can(P.FOLLOWUP_CREATE);

  const load = async () => {
    setError(null);
    try {
      setLead(await leadService.getLead(id));
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    load();
    leadService.getOptions().then(setOptions).catch(() => {});
    locationService.listLocations({ pageSize: 100 }).then((r) => setLocations(r.items)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) {
    return (
      <div className="page">
        <div className="panel">
          <ErrorState error={error} onRetry={load} />
          <p className="pb-8 text-center"><Link href="/leads" className="link text-sm">Back to leads</Link></p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="page">
        <Skeleton className="mb-2 h-7 w-56" />
        <Skeleton className="mb-5 h-4 w-80" />
        <Skeleton className="mb-4 h-16 w-full" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Skeleton className="h-96" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const statusLabel = (key) => options.statuses.find((s) => s.key === key)?.label || key;
  const typeLabel = (key) => options.types.find((t) => t.key === key)?.label || key;
  const slotLabel = (key) => options.timeSlots.find((t) => t.key === key)?.label || key || "Any";
  const closed = ["finalized", "cancelled"].includes(lead.status);

  const tabs = [
    { key: "details", label: "Details" },
    { key: "activity", label: "Activity", count: lead.activities.length },
    { key: "followups", label: "Follow-ups", count: lead.followups.length },
    { key: "messages", label: "Messages", count: lead.messages.length },
  ];

  return (
    <div className="page">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link href="/leads" className="mb-2 inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink">
            <ArrowLeft size={14} /> Leads
          </Link>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="page-title">{lead.name}</h1>
            <Badge tone={STATUS_TONE[lead.status] || "gray"} dot>{statusLabel(lead.status)}</Badge>
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-body">
            <Meta icon={Tag}>{lead.leadCode}</Meta>
            <Meta icon={FileText}>{typeLabel(lead.leadType)}{lead.companyName ? `, ${lead.companyName}` : ""}</Meta>
            <Meta icon={MapPin}>{lead.locationName}</Meta>
            <Meta icon={CalendarDays}>
              {lead.eventDate ? formatDate(lead.eventDate) : "No date"}{lead.guests ? `, ${lead.guests} guests` : ""}
            </Meta>
          </ul>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {canFollowup && !closed && <Button icon={PhoneCall} onClick={() => setDialog("followup")}>Log follow-up</Button>}
          {canAssign && <Button icon={UserCheck} onClick={() => setDialog("assign")}>Assign</Button>}
          {canUpdate && !closed && <Button variant="primary" onClick={() => setDialog("status")}>Update status</Button>}
        </div>
      </div>

      {/* Stage rail */}
      <section className="panel mb-4 px-4 py-4">
        <StageRail status={lead.status} statusLabel={statusLabel} lostReason={lead.lostReason} />
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Tabs */}
        <section className="panel min-w-0">
          <div className="border-b border-line px-2 sm:px-3">
            <Tabs tabs={tabs} value={tab} onChange={setTab} className="border-b-0" />
          </div>

          <div className="p-4 sm:p-5">
            {tab === "details" && (
              <>
                {canUpdate && !closed && (
                  <div className="-mt-1 mb-2 flex justify-end">
                    <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setDialog("edit")}>Edit details</Button>
                  </div>
                )}

                <p className="section-title mb-2">Customer</p>
                <dl className="dl mb-5">
                  <div><dt>Name</dt><dd>{lead.name}</dd></div>
                  <div><dt>Mobile</dt><dd><a href={`tel:${lead.mobile}`} className="link">{lead.mobile}</a></dd></div>
                  <div>
                    <dt>Email</dt>
                    <dd>{lead.email ? <a href={`mailto:${lead.email}`} className="link">{lead.email}</a> : "Not given"}</dd>
                  </div>
                </dl>

                <p className="section-title mb-2">Event</p>
                <dl className="dl mb-5">
                  <div><dt>Lead type</dt><dd>{typeLabel(lead.leadType)}</dd></div>
                  <div><dt>Location</dt><dd>{lead.locationName}</dd></div>
                  <div><dt>Event date</dt><dd>{lead.eventDate ? formatDate(lead.eventDate) : "Not set"}</dd></div>
                  <div><dt>Preferred time</dt><dd>{slotLabel(lead.eventTimeSlot)}</dd></div>
                  <div><dt>Guests</dt><dd>{lead.guests ?? "—"}{lead.kids ? ` (${lead.kids} kids)` : ""}</dd></div>
                  {lead.companyName && <div><dt>Company</dt><dd>{lead.companyName}</dd></div>}
                  {lead.companyGstin && <div><dt>GSTIN</dt><dd>{lead.companyGstin}</dd></div>}
                  <div className="sm:col-span-2"><dt>Requirements</dt><dd>{lead.requirements || "None noted"}</dd></div>
                  <div className="sm:col-span-2"><dt>Remarks</dt><dd>{lead.remarks || "None"}</dd></div>
                </dl>

                <p className="section-title mb-2">Lead</p>
                <dl className="dl">
                  <div><dt>Lead ID</dt><dd>{lead.leadCode}</dd></div>
                  <div><dt>Source</dt><dd className="capitalize">{String(lead.source).replace(/_/g, " ")}</dd></div>
                  <div><dt>Created</dt><dd>{formatDateTime(lead.createdAt)}{lead.createdByName ? ` by ${lead.createdByName}` : ""}</dd></div>
                  <div><dt>Last updated</dt><dd>{formatDateTime(lead.updatedAt)}</dd></div>
                </dl>
              </>
            )}

                        {tab === "activity" && (
              <>
                <p className="meta mb-4">Updated {formatDateTime(lead.updatedAt)}</p>
                <ul className="grid gap-4">
                  {lead.activities.map((a) => {
                    const { icon: Icon, tone } = ACTIVITY_STYLE[a.type] || ACTIVITY_STYLE.default;
                    return (
                      <li key={a.id} className="flex gap-3">
                        <span className={cx("grid h-7 w-7 shrink-0 place-items-center rounded-full", tone)}>
                          <Icon size={14} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm text-ink">{a.message}</span>
                          <span className="meta block">
                            {formatDateTime(a.createdAt)}{a.userName ? ` by ${a.userName}` : ", automatic"}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {tab === "followups" && (
              <>
                {canFollowup && !closed && (
                  <div className="-mt-1 mb-3 flex justify-end">
                    <Button size="sm" variant="ghost" icon={PhoneCall} onClick={() => setDialog("followup")}>Log follow-up</Button>
                  </div>
                )}
                {lead.followups.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted">No follow-ups logged yet.</p>
                ) : (
                  <ul className="grid gap-3">
                    {lead.followups.map((f) => (
                      <li key={f.id} className="rounded-md border border-line p-3">
                        <p className="text-sm font-medium text-ink capitalize">
                          {f.channel}: {String(f.outcome).replace(/_/g, " ")}
                        </p>
                        {f.note && <p className="mt-1 text-[13px] text-body">{f.note}</p>}
                        <p className="meta mt-1">
                          {formatDateTime(f.createdAt)} by {f.userName}
                          {f.nextAt ? ` · next ${formatDate(f.nextAt)}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {tab === "messages" && (
              lead.messages.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">Nothing sent to this customer yet.</p>
              ) : (
                <ul className="grid gap-2">
                  {lead.messages.map((m) => (
                    <li key={m.id} className="rounded-md border border-line px-3 py-2.5">
                      <p className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium text-ink capitalize">
                          {m.channel}: {String(m.messageType).replace(/_/g, " ")}
                        </span>
                        <Badge tone={m.status === "sent" ? "green" : m.status === "failed" ? "red" : "gray"}>
                          {m.status}
                        </Badge>
                      </p>
                      <p className="meta">{m.recipient}{m.sentAt ? ` · ${formatDateTime(m.sentAt)}` : ""}</p>
                      {m.errorMessage && <p className="mt-1 text-[13px] text-danger">{m.errorMessage}</p>}
                    </li>
                  ))}
                </ul>
              )
            )}
          </div>
        </section>

        {/* Side panels */}
        <aside className="order-first grid content-start gap-4 lg:order-none">
          <section className="panel">
            <div className="panel-header py-2.5">
              <h2 className="section-title">Follow-up</h2>
              {canFollowup && !closed && (
                <Button size="sm" variant="ghost" onClick={() => setDialog("followup")}>Log follow-up</Button>
              )}
            </div>
            <div className="panel-body grid gap-3">
              <div>
                <p className="meta">Next follow-up</p>
                <p className="text-sm text-ink">{lead.nextFollowupAt ? formatDateTime(lead.nextFollowupAt) : "Not scheduled"}</p>
              </div>
              <div className="border-t border-line pt-3">
                <p className="meta">Last contact</p>
                {lead.followups[0] ? (
                  <>
                    <p className="text-sm text-ink capitalize">
                      {lead.followups[0].channel}: {String(lead.followups[0].outcome).replace(/_/g, " ")}
                    </p>
                    <p className="meta">{formatDate(lead.followups[0].createdAt)} by {lead.followups[0].userName}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted">Customer not contacted yet</p>
                )}
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header py-2.5">
              <h2 className="section-title">Sales POC</h2>
              {canAssign && <Button size="sm" variant="ghost" onClick={() => setDialog("assign")}>
                {lead.assignedTo ? "Reassign" : "Assign"}
              </Button>}
            </div>
            <div className="panel-body">
              {lead.assignedToName ? (
                <div className="flex items-center gap-3">
                  <Avatar name={lead.assignedToName} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{lead.assignedToName}</p>
                    <p className="meta">Assigned {lead.assignedAt ? formatDate(lead.assignedAt) : "—"}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-danger">Not assigned to anyone</p>
              )}
              <p className="mt-3 flex items-center gap-1.5 text-[13px] text-body">
                <MapPin size={14} className="text-muted" /> {lead.brandName}, {lead.locationName}
              </p>
            </div>
          </section>
        </aside>
      </div>

      <LeadFormDialog
        open={dialog === "edit"}
        lead={lead}
        options={options}
        locations={locations}
        onClose={() => setDialog(null)}
        onSaved={load}
      />
      <StatusDialog open={dialog === "status"} lead={lead} statuses={options.statuses} onClose={() => setDialog(null)} onSaved={load} />
      <AssignDialog open={dialog === "assign"} lead={lead} onClose={() => setDialog(null)} onSaved={load} />
      <FollowupDialog open={dialog === "followup"} lead={lead} options={options} onClose={() => setDialog(null)} onSaved={load} />
    </div>
  );
}

function Meta({ icon: Icon, children }) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <Icon size={14} className="text-muted" aria-hidden />
      {children}
    </li>
  );
}

/**
 * The five pipeline stages as a progress bar. Stages before the current one
 * are filled; "assigned" counts as New, since it is still the first stage.
 */
function StageRail({ status, statusLabel, lostReason }) {
  const current = status === "assigned" ? "new" : status;
  const index = PIPELINE.indexOf(current);
  const offPath = index === -1; // not_interested or cancelled

  return (
    <>
      <ol className="grid gap-x-3 gap-y-2 sm:grid-cols-5">
        {PIPELINE.map((key, i) => {
          const done = !offPath && i < index;
          const active = !offPath && i === index;
          return (
            <li key={key}>
              <span
                className={cx(
                  "block h-1.5 rounded-full",
                  done || active ? STAGE_BAR[key] : "bg-subtle"
                )}
                aria-hidden
              />
              <span className={cx("mt-2 block text-[13px]", active ? "font-medium text-ink" : "text-muted")}>
                {done && <CheckCircle2 size={13} className="mr-1 inline text-success" />}
                {statusLabel(key)}
              </span>
            </li>
          );
        })}
      </ol>

      {offPath && (
        <p className="mt-3 rounded-md bg-subtle px-3 py-2 text-[13px] text-body">
          This lead is marked {statusLabel(status)}{lostReason ? `: ${lostReason}` : ""}.
        </p>
      )}
    </>
  );
}

/** Only the moves the backend allows from the current status are offered. */
function StatusDialog({ open, lead, statuses, onClose, onSaved }) {
  const [status, setStatus] = useState("");
  const [reason, setReason] = useState("");
  const [run, busy] = useAction();

  useEffect(() => {
    if (open) {
      setStatus("");
      setReason("");
    }
  }, [open]);

  const allowed = statuses.find((s) => s.key === lead.status)?.next || [];
  const needsReason = status === "not_interested";

  const submit = async (e) => {
    e.preventDefault();
    if (!status) return;
    const ok = await run(() => leadService.changeStatus(lead.id, status, reason), { success: "Status updated" });
    if (ok) {
      onSaved();
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Update status"
      description={`Currently ${statuses.find((s) => s.key === lead.status)?.label || lead.status}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="status-form" loading={busy} disabled={!status}>Update</Button>
        </>
      }
    >
      <form id="status-form" onSubmit={submit} noValidate className="grid gap-4">
        <Field label="Move to">
          {(p) => (
            <Select
              {...p}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="Choose status"
              options={allowed.map((key) => ({ value: key, label: statuses.find((s) => s.key === key)?.label || key }))}
            />
          )}
        </Field>

        {needsReason && (
          <Field label="Reason" required hint="Why did they drop off?">
            {(p) => <Textarea {...p} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />}
          </Field>
        )}
      </form>
    </Modal>
  );
}

function AssignDialog({ open, lead, onClose, onSaved }) {
  const [users, setUsers] = useState([]);
  const [assignedTo, setAssignedTo] = useState("");
  const [run, busy] = useAction();

  useEffect(() => {
    if (!open) return;
    setAssignedTo(lead.assignedTo ? String(lead.assignedTo) : "");
    userService
      .listUsers({ locationId: lead.locationId, status: 1, pageSize: 100 })
      .then((r) => setUsers(r.items))
      .catch(() => setUsers([]));
  }, [open, lead]);

  const submit = async (e) => {
    e.preventDefault();
    if (!assignedTo) return;
    const ok = await run(() => leadService.assignLead(lead.id, Number(assignedTo)), { success: "Lead assigned" });
    if (ok) {
      onSaved();
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={lead.assignedTo ? "Reassign lead" : "Assign lead"}
      description={`${lead.locationName} team`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="assign-form" loading={busy} disabled={!assignedTo}>Assign</Button>
        </>
      }
    >
      <form id="assign-form" onSubmit={submit} noValidate>
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

function FollowupDialog({ open, lead, options, onClose, onSaved }) {
  const [form, setForm] = useState({ channel: "call", outcome: "", note: "", nextAt: "" });
  const [run, busy] = useAction();

  useEffect(() => {
    if (open) setForm({ channel: "call", outcome: "", note: "", nextAt: "" });
  }, [open]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const label = (v) => String(v).replace(/_/g, " ");

  const submit = async (e) => {
    e.preventDefault();
    if (!form.outcome) return;
    const ok = await run(
      () => leadService.addFollowup(lead.id, { ...form, nextAt: form.nextAt || null }),
      { success: "Follow-up saved" }
    );
    if (ok) {
      onSaved();
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Log follow-up"
      description={lead.name}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="followup-form" loading={busy} disabled={!form.outcome}>Save</Button>
        </>
      }
    >
      <form id="followup-form" onSubmit={submit} noValidate className="grid gap-4">
        <Field label="How did you contact them?">
          {(p) => (
            <Select
              {...p}
              value={form.channel}
              onChange={set("channel")}
              options={(options.followupChannels || []).map((c) => ({ value: c, label: label(c) }))}
            />
          )}
        </Field>

        <Field label="Outcome" required>
          {(p) => (
            <Select
              {...p}
              value={form.outcome}
              onChange={set("outcome")}
              placeholder="Choose outcome"
              options={(options.followupOutcomes || []).map((o) => ({ value: o, label: label(o) }))}
            />
          )}
        </Field>

        <Field label="Note">
          {(p) => <Textarea {...p} rows={3} value={form.note} onChange={set("note")} placeholder="What was discussed" />}
        </Field>

        <Field label="Next follow-up" hint="Leave empty if none is needed.">
          {(p) => <Input {...p} type="datetime-local" value={form.nextAt} onChange={set("nextAt")} />}
        </Field>
      </form>
    </Modal>
  );
}