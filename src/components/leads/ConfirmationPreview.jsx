"use client";

import { useState } from "react";
import { CheckCircle2, Clock, Loader2, Mail, MessageCircle, XCircle } from "lucide-react";
import { useAction } from "@/hooks/useAction";
import { useQuery } from "@/hooks/useQuery";
import { formatDate, formatDateTime, formatPhone } from "@/lib/format";
import { leadService } from "@/services";
import { cx } from "@/lib/utils";
import { Button, ErrorState, Modal, Spinner, Tabs } from "@/components/ui";

const STATUS = {
  pending: { label: "Not sent yet", icon: Clock, className: "text-muted" },
  sending: { label: "Sending", icon: Loader2, className: "text-accent", spin: true },
  delivered: { label: "Delivered", icon: CheckCircle2, className: "text-success" },
  failed: { label: "Failed", icon: XCircle, className: "text-danger" },
};

/**
 * Preview of the brand's approved confirmation template filled with this
 * booking, plus WhatsApp / email delivery status.
 */
export default function ConfirmationPreview({ open, lead, onClose }) {
  const [tab, setTab] = useState("email");
  const [run, busy] = useAction();
  const enabled = Boolean(open && lead?.booking);
  const { data: rendered, loading, error } = useQuery(() => leadService.getConfirmationPreview(lead.id), [lead?.id], {
    enabled,
    refreshOn: [],
  });

  if (!lead?.booking) return null;
  const template = rendered?.template;
  const n = lead.booking.notifications;
  const sent = n.whatsapp.status === "delivered" && n.email.status === "delivered";

  const send = () =>
    run(() => leadService.sendConfirmation(lead.id), {
      success: "Confirmation sent",
      successDescription: "WhatsApp and email delivered (simulated)",
    });

  const channelStatus = (key) => (busy ? "sending" : n[key].status);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={`Booking confirmation ${lead.booking.confirmationNumber}`}
      description={
        template
          ? `Approved template ${template.id}, version ${template.version}, approved ${formatDate(template.approvedOn)}`
          : "Company-approved template"
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          {!sent && rendered && (
            <Button variant="primary" onClick={send} loading={busy}>Send confirmation</Button>
          )}
        </>
      }
    >
      {loading && !rendered ? (
        <Spinner label="Preparing confirmation" />
      ) : error ? (
        <ErrorState error={error} />
      ) : !rendered ? null : (
        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            <Tabs
              tabs={[{ key: "email", label: "Email" }, { key: "whatsapp", label: "WhatsApp" }]}
              value={tab}
              onChange={setTab}
              className="mb-4"
            />
            {tab === "email" ? <EmailPreview email={rendered.email} to={lead.customer.email} /> : <WhatsAppPreview text={rendered.whatsapp} />}
          </div>

          <aside className="grid content-start gap-3">
            <p className="section-title">Delivery</p>
            <DeliveryRow icon={MessageCircle} channel="WhatsApp" to={formatPhone(n.whatsapp.to)} status={channelStatus("whatsapp")} at={n.whatsapp.at} />
            <DeliveryRow icon={Mail} channel="Email" to={n.email.to} status={channelStatus("email")} at={n.email.at} />
            <p className="meta">
              Wording comes from the brand&apos;s approved template and can&apos;t be edited here. Only booking details are filled in.
            </p>
          </aside>
        </div>
      )}
    </Modal>
  );
}

function DeliveryRow({ icon: Icon, channel, to, status, at }) {
  const s = STATUS[status] || STATUS.pending;
  const StatusIcon = s.icon;
  return (
    <div className="rounded-md border border-line p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-ink">
          <Icon size={15} className="text-muted" /> {channel}
        </span>
        <span className={cx("flex items-center gap-1.5 text-[13px] font-medium", s.className)}>
          <StatusIcon size={14} className={s.spin ? "animate-spin" : undefined} />
          {s.label}
        </span>
      </div>
      <p className="meta mt-1 truncate">{to}</p>
      {at && status === "delivered" && <p className="meta">{formatDateTime(at)}</p>}
    </div>
  );
}

function EmailPreview({ email, to }) {
  return (
    <div className="overflow-hidden rounded-md border border-line">
      <div className="border-b border-line bg-subtle px-4 py-2.5 text-[13px]">
        <p><span className="text-muted">To:</span> {to}</p>
        <p className="truncate"><span className="text-muted">Subject:</span> <span className="text-ink">{email.subject}</span></p>
      </div>
      <div className="px-5 py-5">
        <div className="mb-4 h-1 w-10 rounded bg-ink" aria-hidden />
        <h3 className="text-lg font-semibold text-ink">{email.heading}</h3>
        <p className="mt-2 text-sm text-body">{email.intro}</p>
        <table className="mt-4 w-full text-sm">
          <tbody>
            {email.rows.map(([k, v]) => (
              <tr key={k} className="border-b border-line last:border-0">
                <th scope="row" className="w-44 py-2 pr-3 text-left align-top font-normal text-muted">{k}</th>
                <td className="py-2 text-ink">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-sm text-body">{email.closing}</p>
        <p className="mt-5 border-t border-line pt-3 text-xs text-faint">{email.footer}</p>
      </div>
    </div>
  );
}

function WhatsAppPreview({ text }) {
  return (
    <div className="rounded-md bg-[#e9e4dc] p-4">
      <div className="max-w-sm whitespace-pre-line rounded-lg rounded-tl-none bg-white px-3 py-2.5 text-[13px] leading-relaxed text-[#1f2c34] shadow-sm">
        {text}
      </div>
    </div>
  );
}
