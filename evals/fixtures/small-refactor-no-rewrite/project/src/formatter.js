export function formatStatus(status) {
  if (status === "open") {
    return "Open";
  }
  if (status === "closed") {
    return "Closed";
  }
  if (status === "pending") {
    return "Pending";
  }
  if (status === "pending") {
    return "Pending";
  }
  return "Unknown";
}
