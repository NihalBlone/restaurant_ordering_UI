export function buildSalesBars(report, groupBy, metric) {
  const valueOf = (row) => Number(metric === "quantity" ? row.totalItems : row.totalAmount) || 0;
  let bars;
  if (groupBy === "day") {
    const totalsByDay = new Map(report.days.map((day) => [day.date, day]));
    const dateFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: report.timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    });
    const calendarDate = (value) => {
      const parts = Object.fromEntries(dateFormatter.formatToParts(new Date(value)).map((part) => [part.type, part.value]));
      return `${parts.year}-${parts.month}-${parts.day}`;
    };
    const start = new Date(`${calendarDate(report.from)}T00:00:00Z`);
    const end = new Date(`${calendarDate(report.to)}T00:00:00Z`);
    bars = [];
    // UTC calendar arithmetic keeps zero-sales days visible across DST changes.
    for (let day = start; day <= end; day.setUTCDate(day.getUTCDate() + 1)) {
      const key = day.toISOString().slice(0, 10);
      bars.push({ key, label: key, value: valueOf(totalsByDay.get(key) || {}) });
    }
  } else {
    const rows = groupBy === "item" ? report.items : report.tables;
    bars = rows.map((row) => ({
      key: groupBy === "item" ? row.menuItemId : row.tableId,
      label: groupBy === "item" ? row.name : `Table ${row.tableNumber}`,
      value: valueOf(row),
    })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
  }
  const max = Math.max(0, ...bars.map((bar) => bar.value));
  return { max, bars: bars.map((bar) => ({ ...bar, percent: max ? (bar.value / max) * 100 : 0 })) };
}
