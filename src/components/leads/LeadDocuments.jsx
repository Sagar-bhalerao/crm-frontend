import { FileText, Receipt } from "lucide-react";
import { P } from "@/config/permissions";
import { getStatus } from "@/config/leadStatuses";
import { formatDate, formatDateTime } from "@/lib/format";
import { Badge, Button, EmptyState } from "@/components/ui";
import DocumentLines from "./DocumentLines";

/** Quotation tab content. */
export function QuotationTab({ lead, can, onEdit }) {
  const q = lead.quotation;
  const status = getStatus(lead.status);
  const editable = can(P.QUOTATION_CREATE) && !status.terminal && status.onPath && !lead.invoice;

  if (!q) {
    return (
      <EmptyState
        icon={FileText}
        title="No quotation yet"
        description="Build a quotation from the rate card once you know the customer's requirements."
        action={editable && <Button variant="primary" onClick={onEdit}>Create quotation</Button>}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-ink">{q.number}</span>
            <span className="meta">Version {q.version}</span>
            <Badge tone={q.status === "shared" ? "violet" : "gray"}>{q.status === "shared" ? "Shared" : "Draft"}</Badge>
          </p>
          <p className="meta mt-1">
            {q.sharedAt ? `Shared ${formatDateTime(q.sharedAt)}` : `Saved ${formatDateTime(q.updatedAt)}`}, valid until {formatDate(q.validUntil)}
          </p>
        </div>
        {editable && (
          <Button size="sm" onClick={onEdit}>
            {q.status === "draft" ? "Edit and share" : "Revise quotation"}
          </Button>
        )}
      </div>
      <DocumentLines doc={q} />
      {q.notes && <p className="mt-4 rounded-md bg-subtle px-3 py-2 text-[13px] text-body">{q.notes}</p>}
      {lead.invoice && !status.terminal && (
        <p className="meta mt-3">To revise this quotation, move the lead back to Quotation. The proforma invoice will be withdrawn.</p>
      )}
    </div>
  );
}

/** Proforma invoice tab content. */
export function InvoiceTab({ lead, can, onGenerate, onFinalize }) {
  const inv = lead.invoice;
  const status = getStatus(lead.status);

  if (!inv) {
    const allowed = can(P.INVOICE_CREATE) && lead.quotation && status.onPath && !status.terminal;
    return (
      <EmptyState
        icon={Receipt}
        title="No proforma invoice yet"
        description={lead.quotation ? "Generate it once the customer accepts the quotation." : "Create and share a quotation first."}
        action={allowed && <Button variant="primary" onClick={onGenerate}>Generate proforma invoice</Button>}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[15px] font-semibold text-ink">{inv.number}</p>
          <p className="meta mt-1">Generated {formatDateTime(inv.generatedAt)}, advance due {formatDate(inv.dueDate)}</p>
        </div>
        {lead.status === "proforma_invoice" && can(P.LEAD_FINALIZE) && (
          <Button size="sm" variant="success" onClick={onFinalize}>Finalize booking</Button>
        )}
      </div>

      <dl className="dl mb-4">
        <div><dt>Bill to</dt><dd>{inv.billingName}</dd></div>
        <div><dt>GSTIN</dt><dd>{inv.billingGstin || "Not provided"}</dd></div>
      </dl>

      <DocumentLines doc={inv} showAdvance />
      {inv.terms && <p className="mt-4 rounded-md bg-subtle px-3 py-2 text-[13px] text-body">{inv.terms}</p>}
    </div>
  );
}
