"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FileText,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  PhoneCall,
  Receipt,
  RotateCcw,
  Send,
  Tag,
} from "lucide-react";
import { getLeadType } from "@/config/leadOptions";
import { getStatus } from "@/config/leadStatuses";
import { P } from "@/config/permissions";
import { useAuth } from "@/context/AuthContext";
import { useAction } from "@/hooks/useAction";
import { useQuery } from "@/hooks/useQuery";
import { formatDateTime, formatWeekday } from "@/lib/format";
import { leadService } from "@/services";
import { Button, ErrorState, Skeleton, Tabs } from "@/components/ui";
import AssignDialog from "./AssignDialog";
import ConfirmationPreview from "./ConfirmationPreview";
import FinalizeDialog from "./FinalizeDialog";
import FollowUpDialog from "./FollowUpDialog";
import InvoiceDialog from "./InvoiceDialog";
import LeadDetails from "./LeadDetails";
import { InvoiceTab, QuotationTab } from "./LeadDocuments";
import LeadEditDialog from "./LeadEditDialog";
import LeadMail from "./LeadMail";
import { FollowUpPanel, OwnerPanel } from "./LeadSidePanels";
import LeadStatusBadge from "./LeadStatusBadge";
import LeadTimeline from "./LeadTimeline";
import QuotationEditor from "./QuotationEditor";
import StageRail from "./StageRail";
import StatusDialog from "./StatusDialog";

/** The main action for a lead, based on its status (config: nextAction). */
function getPrimaryAction(lead, can) {
  const s = getStatus(lead.status);
  switch (s.nextAction) {
    case "followup":
      return can(P.FOLLOWUP_CREATE) && { key: "followup", label: "Log follow-up", icon: PhoneCall };
    case "quotation":
      return (
        can(P.QUOTATION_CREATE) && {
          key: "quotation",
          label: lead.quotation?.status === "draft" ? "Share quotation" : lead.quotation ? "Revise quotation" : "Create quotation",
          icon: FileText,
        }
      );
    case "invoice":
      return can(P.INVOICE_CREATE) && { key: "invoice", label: "Generate proforma invoice", icon: Receipt };
    case "finalize":
      return can(P.LEAD_FINALIZE) && { key: "finalize", label: "Finalize booking", icon: CheckCircle2, variant: "success" };
    case "confirmation":
      return { key: "confirmation", label: "View confirmation", icon: Send };
    case "reopen":
      return can(P.LEAD_UPDATE) && { key: "reopen", label: "Reopen lead", icon: RotateCcw };
    default:
      return null;
  }
}

const DIALOG_TAB = { quotation: "quotation", invoice: "invoice", finalize: "invoice", followup: "activity" };

export default function LeadDetailView({ id }) {
  const { can } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: lead, loading, error, reload } = useQuery(() => leadService.getLead(id), [id]);
  const [tab, setTab] = useState("details");
  const [dialog, setDialog] = useState(null);
  const [run, busy] = useAction();

  // /leads/:id?edit=1 opens the edit form (from the table's edit action)
  useEffect(() => {
    if (lead && searchParams.get("edit") === "1") {
      if (can(P.LEAD_UPDATE) && !getStatus(lead.status).terminal) setDialog("edit");
      router.replace(`/leads/${id}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?.id, searchParams]);

  if (loading && !lead) return <DetailSkeleton />;
  if (error) {
    return (
      <div className="page">
        <div className="panel">
          <ErrorState error={error} onRetry={reload} />
          <div className="pb-8 text-center">
            <Link href="/leads" className="link text-sm">Back to leads</Link>
          </div>
        </div>
      </div>
    );
  }

  const status = getStatus(lead.status);
  const primary = getPrimaryAction(lead, can);
  const editable = can(P.LEAD_UPDATE) && !status.terminal;
  const close = () => setDialog(null);

  const open = (key) => {
    if (key === "reopen") {
      run(() => leadService.changeStatus(lead.id, { status: "in_progress", note: "Lead reopened" }), { success: "Lead reopened" });
      return;
    }
    if (DIALOG_TAB[key]) setTab(DIALOG_TAB[key]);
    setDialog(key);
  };

  const tabs = [
    { key: "details", label: "Details" },
    { key: "activity", label: "Activity", count: lead.activities.length },
    can(P.MAIL_VIEW) && { key: "emails", label: "Emails", count: lead.emails.length },
    can(P.QUOTATION_VIEW) && { key: "quotation", label: "Quotation" },
    can(P.INVOICE_VIEW) && { key: "invoice", label: "Proforma invoice" },
  ].filter(Boolean);

  return (
    <div className="page pb-28 lg:pb-6">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link href="/leads" className="mb-2 inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink lg:hidden">
            <ArrowLeft size={14} /> Leads
          </Link>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="page-title">{lead.customer.name}</h1>
            <LeadStatusBadge status={lead.status} />
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-body">
            <Meta icon={Tag}>{lead.id}</Meta>
            <Meta icon={FileText}>{getLeadType(lead.type).label}{lead.company ? `, ${lead.company.name}` : ""}</Meta>
            <Meta icon={MapPin}>{lead.outlet.name}</Meta>
            <Meta icon={CalendarDays}>{formatWeekday(lead.event.date)}, {lead.event.guests} guests</Meta>
          </ul>
        </div>

        <div className="hidden shrink-0 flex-wrap items-center gap-2 lg:flex">
          {editable && status.next.length > 0 && <Button onClick={() => setDialog("status")}>Update status</Button>}
          {primary?.key !== "followup" && can(P.FOLLOWUP_CREATE) && !status.terminal && status.onPath && (
            <Button icon={PhoneCall} onClick={() => open("followup")}>Log follow-up</Button>
          )}
          {primary && primary.key !== "confirmation" && (
            <Button variant={primary.variant || "primary"} icon={primary.icon} onClick={() => open(primary.key)} loading={busy && primary.key === "reopen"}>
              {primary.label}
            </Button>
          )}
        </div>
      </div>

      {/* Booking banner */}
      {lead.booking && <BookingBanner lead={lead} onView={() => setDialog("confirmation")} />}

      {/* Stage */}
      <section className="panel mb-4 px-4 py-4">
        <StageRail status={lead.status} reason={lead.notInterestedReason} />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="panel min-w-0">
          <div className="border-b border-line px-2 sm:px-3">
            <Tabs tabs={tabs} value={tab} onChange={setTab} className="border-b-0" />
          </div>
          <div className="p-4 sm:p-5">
            {tab === "details" && (
              <>
                {editable && (
                  <div className="-mt-1 mb-2 flex justify-end">
                    <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setDialog("edit")}>Edit details</Button>
                  </div>
                )}
                <LeadDetails lead={lead} />
              </>
            )}
            {tab === "activity" && (
              <>
                <p className="meta mb-4">Updated {formatDateTime(lead.updatedAt)}</p>
                <LeadTimeline activities={lead.activities} people={lead.people} />
              </>
            )}
            {tab === "emails" && <LeadMail lead={lead} />}
            {tab === "quotation" && <QuotationTab lead={lead} can={can} onEdit={() => setDialog("quotation")} />}
            {tab === "invoice" && (
              <InvoiceTab lead={lead} can={can} onGenerate={() => setDialog("invoice")} onFinalize={() => setDialog("finalize")} />
            )}
          </div>
        </section>

        <aside className="order-first grid content-start gap-4 lg:order-none">
          <FollowUpPanel lead={lead} can={can} onLog={() => open("followup")} />
          <OwnerPanel lead={lead} can={can} onReassign={() => setDialog("assign")} />
        </aside>
      </div>

      {/* Mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-2 border-t border-line bg-surface px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] lg:hidden">
        <a href={`tel:+91${lead.customer.mobile}`} className="btn btn-secondary w-11 px-0" aria-label={`Call ${lead.customer.name}`}>
          <Phone size={18} />
        </a>
        <a href={`https://wa.me/91${lead.customer.mobile}`} target="_blank" rel="noreferrer" className="btn btn-secondary w-11 px-0" aria-label="Open WhatsApp chat">
          <MessageCircle size={18} />
        </a>
        {editable && status.next.length > 0 && (
          <Button className="h-11" onClick={() => setDialog("status")}>Status</Button>
        )}
        {primary && (
          <Button variant={primary.variant || "primary"} className="h-11 flex-1" onClick={() => open(primary.key)} loading={busy && primary.key === "reopen"}>
            {primary.label}
          </Button>
        )}
      </div>

      {/* Dialogs */}
      <StatusDialog open={dialog === "status"} lead={lead} onClose={close} onNeed={(key) => open(key)} />
      <FollowUpDialog open={dialog === "followup"} lead={lead} onClose={close} />
      <AssignDialog open={dialog === "assign"} lead={lead} onClose={close} />
      <QuotationEditor open={dialog === "quotation"} lead={lead} onClose={close} />
      <InvoiceDialog open={dialog === "invoice"} lead={lead} onClose={close} />
      <FinalizeDialog open={dialog === "finalize"} lead={lead} onClose={close} onFinalized={() => setDialog("confirmation")} />
      <ConfirmationPreview open={dialog === "confirmation"} lead={lead} onClose={close} />
      <LeadEditDialog open={dialog === "edit"} lead={lead} onClose={close} />
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

function BookingBanner({ lead, onView }) {
  const n = lead.booking.notifications;
  const sent = n.whatsapp.status === "delivered" && n.email.status === "delivered";
  return (
    <section className="mb-4 flex flex-col gap-3 rounded-lg border border-[#b3dcc3] bg-success-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-success" />
        <div>
          <p className="text-sm font-semibold text-ink">Booking confirmed, {lead.booking.confirmationNumber}</p>
          <p className="text-[13px] text-body">
            {sent
              ? "Confirmation delivered to the customer on WhatsApp and email."
              : "Confirmation has not been sent to the customer yet."}
          </p>
        </div>
      </div>
      <Button size="sm" variant={sent ? "secondary" : "primary"} onClick={onView}>
        {sent ? "View confirmation" : "Review and send confirmation"}
      </Button>
    </section>
  );
}

function DetailSkeleton() {
  return (
    <div className="page">
      <Skeleton className="mb-2 h-7 w-56" />
      <Skeleton className="mb-5 h-4 w-80" />
      <Skeleton className="mb-4 h-16 w-full" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Skeleton className="h-96" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
