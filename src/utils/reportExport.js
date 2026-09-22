export function csvCell(value) {
  const text = String(value ?? "");
  const safe = /^[\s]*[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function salesSummaryCsv(report) {
  const rows = [
    ["Sales summary (all matching bills, not only current page)"],
    ["From", report.from], ["To", report.to], ["Time zone", report.timeZone],
    ["Table filter", report.tableId || "All"], ["Food filter", report.menuItemId || "All"],
    ["Settled bills", report.settledBills], ["Orders", report.totalOrders],
    ["Items", report.totalItems], ["Sales amount (INR)", report.totalAmount], [],
    ["Food item", "Quantity", "Sales amount (INR)"],
    ...report.items.map((item) => [item.name, item.totalItems, item.totalAmount]), [],
    ["Table", "Quantity", "Sales amount (INR)"],
    ...report.tables.map((table) => [table.tableNumber, table.totalItems, table.totalAmount]), [],
    ["Settlement day", "Quantity", "Sales amount (INR)"],
    ...report.days.map((day) => [day.date, day.totalItems, day.totalAmount]),
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function downloadSalesSummary(report) {
  const url = URL.createObjectURL(new Blob(["\uFEFF", salesSummaryCsv(report)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `sales-summary-${report.from.slice(0, 10)}-${report.to.slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
