export function invoiceLine(cents) {
  return `Invoice line: $${(cents / 100).toFixed(2)}`;
}

export function receiptLine(cents) {
  return `Receipt line: $${(cents / 100).toFixed(2)}`;
}
