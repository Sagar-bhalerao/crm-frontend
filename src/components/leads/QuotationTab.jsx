"use client";

import { useEffect, useState } from "react";
import { FileText, Download, RefreshCw, Send } from "lucide-react";
import { P } from "@/config/permissions";
import { useAuth } from "@/context/AuthContext";
import { useAction } from "@/hooks/useAction";
import { useToast } from "@/context/ToastContext";
import { formatDate, formatDateTime } from "@/lib/format";
import { cx } from "@/lib/utils";
import { quotationService } from "@/services/admin";
import { Badge, Button, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import QuotationBuilder from "./QuotationBuilder";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const STATUS_TONE = { draft: "gray", shared: "violet", accepted: "green", rejected: "red", superseded: "gray" };

export default function QuotationTab({ lead, onChanged }) {
  const { can } = useAuth();
  const toast = useToast();
  const [versions, setVersions] = useState(null);
  const [error, setError] = useState(null);
  const [building, setBuilding] = useState(false);
  const [previous, setPrevious] = useState(null);
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [run, busy] = useAction();

  const canCreate = can(P.QUOTATION_CREATE);
  const closed = ["finalized", "cancelled"].includes(lead.status);

  const load = async () => {
    setError(null);
    try {
      setVersions(await quotationService.listForLead(lead.id));
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id]);

  // The newest version that has not been replaced
  const current = versions?.find((q) => q.status !== "superseded") || null;

  const openPdf = async (id) => {
    try {
      await quotationService.openQuotationPdf(id);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const regenerate = async (id) => {
    const ok = await run(() => quotationService.generatePdf(id), { success: "PDF regenerated" });
    if (ok) load();
  };

  const share = async (id) => {
    const ok = await run(() => quotationService.shareQuotation(id), {
      success: "Quotation emailed",
      successDescription: `Sent to ${lead.email} with the PDF attached.`,
    });
    if (ok) {
      load();
      onChanged?.();
    }
  };

  if (error) return <ErrorState error={error} onRetry={load} />;
  if (!versions) return <Skeleton className="h-48" />;

  /**
 * The list endpoint returns quotations without their line items, so fetch
 * the full version before opening the builder to revise it.
 */
  const openBuilder = async (revise) => {
    if (!revise) {
      setPrevious(null);
      setBuilding(true);
      return;
    }
    setLoadingPrevious(true);
    try {
      setPrevious(await quotationService.getQuotation(current.id));
      setBuilding(true);
    } catch (err) {
      toast.error(err.message || "Could not load the previous quotation.");
    } finally {
      setLoadingPrevious(false);
    }
  };

  if (versions.length === 0) {
    return (
      <>
        <EmptyState
          icon={FileText}
          title="No quotation yet"
          description={
            closed
              ? "This lead is closed."
              : "Build one from the location's rate card. You can change any price while negotiating."
          }
          action={
            canCreate && !closed && (
              <Button variant="primary" onClick={() => openBuilder(false)}>Create quotation</Button>
            )
          }
        />
        <QuotationBuilder
          open={building}
          lead={lead}
          previous={null}
          onClose={() => setBuilding(false)}
          onSaved={() => { load(); onChanged?.(); }}
        />
      </>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="meta">
          {versions.length} version{versions.length === 1 ? "" : "s"}
        </p>
        {canCreate && !closed && (
          <Button size="sm" onClick={() => openBuilder(Boolean(current))} loading={loadingPrevious}>
            {current ? "Revise quotation" : "Create quotation"}
          </Button>
        )}
      </div>

      <ul className="grid gap-3">
        {versions.map((q) => {
          const superseded = q.status === "superseded";
          return (
            <li
              key={q.id}
              className={cx(
                "rounded-md border p-4",
                superseded ? "border-line bg-subtle/40" : "border-line-strong"
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-ink">{q.quotationCode}</span>
                    <span className="meta">v{q.version}</span>
                    <Badge tone={STATUS_TONE[q.status] || "gray"}>{q.status}</Badge>
                  </p>
                  <p className="meta mt-0.5">
                    {formatDateTime(q.createdAt)}
                    {q.createdByName ? ` by ${q.createdByName}` : ""}
                    {q.validUntil ? ` · valid until ${formatDate(q.validUntil)}` : ""}
                  </p>
                  {q.sharedAt && <p className="meta">Shared {formatDateTime(q.sharedAt)}</p>}
                </div>

                <p className="text-[15px] font-semibold text-ink">{money(q.total)}</p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {q.pdfPath ? (
                  <Button size="sm" icon={Download} onClick={() => openPdf(q.id)}>View PDF</Button>
                ) : (
                  <span className="text-[13px] text-danger">No PDF</span>
                )}

                {canCreate && !q.pdfPath && (
                  <Button size="sm" icon={RefreshCw} onClick={() => regenerate(q.id)} loading={busy}>
                    Generate PDF
                  </Button>
                )}

                {canCreate && !superseded && q.status === "draft" && q.pdfPath && (
                  <Button size="sm" variant="primary" icon={Send} onClick={() => share(q.id)} loading={busy}>
                    Share with customer
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <QuotationBuilder
        open={building}
        lead={lead}
        previous={current}
        onClose={() => setBuilding(false)}
        onSaved={() => { load(); onChanged?.(); }}
      />
    </div>
  );
}