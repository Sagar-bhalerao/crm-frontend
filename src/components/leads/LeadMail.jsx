"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Mail, PenLine, RefreshCw } from "lucide-react";
import { useAction } from "@/hooks/useAction";
import { useQuery } from "@/hooks/useQuery";
import { formatDateTime, formatRelative } from "@/lib/format";
import { mailService } from "@/services";
import { cx } from "@/lib/utils";
import { Button, EmptyState, ErrorState, Field, Input, Modal, Spinner, Textarea } from "@/components/ui";

/** Email thread with the customer, synced from the Sales POC mailbox. */
export default function LeadMail({ lead }) {
  const { data, loading, error, reload } = useQuery(() => mailService.getLeadMail(lead.id), [lead.id]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [run, syncing] = useAction();

  if (loading && !data) return <Spinner label="Loading emails" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const { mailbox, canSend, emails } = data;
  const lastId = emails.at(-1)?.id;

  const sync = () =>
    run(() => mailService.syncMailbox(lead.id), {
      success: (r) => (r.newCount ? `${r.newCount} new email synced` : "Mailbox is up to date"),
    });

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 rounded-md bg-subtle px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 text-[13px]">
          {mailbox ? (
            <>
              <p className="truncate text-ink">Synced with {mailbox.address}</p>
              <p className="meta">{mailbox.lastSyncedAt ? `Last synced ${formatRelative(mailbox.lastSyncedAt)}` : "Not synced yet"}</p>
            </>
          ) : (
            <p className="text-muted">Your account has no connected mailbox. You can read this thread but not send.</p>
          )}
        </div>
        <div className="flex gap-2">
          {mailbox && <Button size="sm" icon={RefreshCw} onClick={sync} loading={syncing}>Sync now</Button>}
          {canSend && <Button size="sm" variant="primary" icon={PenLine} onClick={() => setComposeOpen(true)}>Write email</Button>}
        </div>
      </div>

      {emails.length === 0 ? (
        <EmptyState icon={Mail} title="No emails with this customer yet" description="Emails you send from the CRM or your mailbox will appear here." />
      ) : (
        <ul className="grid gap-2">
          {emails.map((m) => {
            const open = expanded === m.id || (expanded === null && m.id === lastId);
            return (
              <li key={m.id} className={cx("rounded-md border", m.direction === "in" ? "border-line bg-surface" : "border-line bg-subtle/60")}>
                <button onClick={() => setExpanded(open ? "" : m.id)} aria-expanded={open} className="flex w-full items-start gap-3 px-3 py-2.5 text-left cursor-pointer">
                  <span className={cx("mt-0.5 rounded px-1.5 py-0.5 text-[11px] font-medium", m.direction === "in" ? "bg-accent-soft text-accent" : "bg-line text-body")}>
                    {m.direction === "in" ? "Received" : "Sent"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{m.subject}</span>
                    <span className="meta block truncate">{m.direction === "in" ? `From ${m.from}` : `To ${m.to}`}, {formatDateTime(m.at)}</span>
                  </span>
                  <ChevronDown size={16} className={cx("mt-1 shrink-0 text-muted transition-transform", open && "rotate-180")} />
                </button>
                {open && <p className="whitespace-pre-line border-t border-line px-3 py-3 text-sm text-body">{m.body}</p>}
              </li>
            );
          })}
        </ul>
      )}

      <ComposeDialog open={composeOpen} onClose={() => setComposeOpen(false)} lead={lead} mailbox={mailbox} lastSubject={emails.at(-1)?.subject} />
    </div>
  );
}

function ComposeDialog({ open, onClose, lead, mailbox, lastSubject }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [run, busy] = useAction();
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSubject(lastSubject ? (lastSubject.startsWith("Re:") ? lastSubject : `Re: ${lastSubject}`) : "");
    setBody(`Hi ${lead.customer.name.split(" ")[0]},\n\n`);
    setTouched(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const send = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!subject.trim() || body.trim().length < 10) return;
    const ok = await run(() => mailService.sendLeadEmail(lead.id, { subject, body }), { success: "Email sent" });
    if (ok) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Write email"
      description={mailbox ? `From ${mailbox.address}` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="compose-form" loading={busy}>Send email</Button>
        </>
      }
    >
      <form id="compose-form" onSubmit={send} className="grid gap-4" noValidate>
        <Field label="To">{(p) => <Input {...p} value={lead.customer.email} readOnly disabled />}</Field>
        <Field label="Subject" error={touched && !subject.trim() ? "Add a subject" : undefined}>
          {(p) => <Input {...p} value={subject} onChange={(e) => setSubject(e.target.value)} />}
        </Field>
        <Field label="Message" error={touched && body.trim().length < 10 ? "Write a message" : undefined}>
          {(p) => <Textarea {...p} rows={8} value={body} onChange={(e) => setBody(e.target.value)} />}
        </Field>
      </form>
    </Modal>
  );
}
