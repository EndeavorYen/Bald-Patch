export function formatReceiptTotal(cents) {
  return `${(cents / 100).toFixed(2)} USD`;
}

export function receiptSummary(cents) {
  return `Receipt total: ${formatReceiptTotal(cents)}`;
}
