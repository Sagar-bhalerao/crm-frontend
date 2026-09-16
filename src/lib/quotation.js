/** Totals for a quotation or proforma invoice. */
export function calcTotals({ items = [], discount = 0, taxRate = 0, advancePercent = 0 }) {
  const subtotal = items.reduce((sum, i) => sum + (Number(i.qty) || 0) * (Number(i.rate) || 0), 0);
  const discountAmount = Math.min(Number(discount) || 0, subtotal);
  const taxable = subtotal - discountAmount;
  const tax = Math.round((taxable * (Number(taxRate) || 0)) / 100);
  const total = taxable + tax;
  const advance = Math.round((total * (Number(advancePercent) || 0)) / 100);
  return { subtotal, discountAmount, taxable, tax, total, advance, balance: total - advance };
}
