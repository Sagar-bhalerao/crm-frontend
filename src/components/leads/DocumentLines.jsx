import { formatCurrency } from "@/lib/format";
import { calcTotals } from "@/lib/quotation";

/** Line items + totals, shared by quotation and proforma invoice views. */
export default function DocumentLines({ doc, showAdvance = false }) {
  const t = calcTotals(doc);
  return (
    <div>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-md border border-line sm:block">
        <table className="table">
          <thead>
            <tr>
              <th>Item</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Rate</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {doc.items.map((i, idx) => (
              <tr key={idx}>
                <td>{i.description}</td>
                <td className="text-right">{i.qty}</td>
                <td className="text-right">{formatCurrency(i.rate)}</td>
                <td className="text-right">{formatCurrency(i.qty * i.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <ul className="divide-y divide-line rounded-md border border-line sm:hidden">
        {doc.items.map((i, idx) => (
          <li key={idx} className="flex justify-between gap-3 px-3 py-2.5 text-sm">
            <span className="min-w-0">
              <span className="block text-ink">{i.description}</span>
              <span className="meta">{i.qty} × {formatCurrency(i.rate)}</span>
            </span>
            <span className="shrink-0 text-ink">{formatCurrency(i.qty * i.rate)}</span>
          </li>
        ))}
      </ul>

      <dl className="ml-auto mt-3 grid max-w-xs gap-1.5 text-sm">
        <Row label="Subtotal" value={formatCurrency(t.subtotal)} />
        {t.discountAmount > 0 && <Row label="Discount" value={`− ${formatCurrency(t.discountAmount)}`} />}
        <Row label={`GST (${doc.taxRate}%)`} value={formatCurrency(t.tax)} />
        <Row label="Total" value={formatCurrency(t.total)} strong />
        {showAdvance && (
          <>
            <Row label={`Advance (${doc.advancePercent}%)`} value={formatCurrency(t.advance)} />
            <Row label="Balance at venue" value={formatCurrency(t.balance)} />
          </>
        )}
      </dl>
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "border-t border-line pt-1.5 font-semibold text-ink" : "text-body"}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
