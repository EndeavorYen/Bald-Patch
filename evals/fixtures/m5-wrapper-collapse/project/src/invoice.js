export function formatInvoiceTotal(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function invoiceSummary(cents) {
  return `Invoice total: ${formatInvoiceTotal(cents)}`;
}
