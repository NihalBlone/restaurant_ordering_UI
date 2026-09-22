import { useEffect, useState } from "react";
import { getRestaurantMenuItems, getSalesReport } from "../services/api";
import SalesBarChart from "./SalesBarChart";
import { downloadSalesSummary } from "../utils/reportExport";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});

function dateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function reportBoundary(value, endOfDay) {
  const time = endOfDay ? "23:59:59.999" : "00:00:00.000";
  return new Date(`${value}T${time}`).toISOString();
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function SummaryCard({ label, value, detail, accent = false }) {
  return (
    <article className={`rounded-[26px] p-5 ${accent ? "bg-ink text-white" : "panel"}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${accent ? "text-saffron" : "text-olive"}`}>
        {label}
      </p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
      <p className={`mt-2 text-xs ${accent ? "text-white/55" : "text-muted"}`}>{detail}</p>
    </article>
  );
}

export default function SalesReportPanel({ tables, restaurantId, platform = false }) {
  const today = new Date();
  const monthAgo = new Date();
  monthAgo.setDate(today.getDate() - 29);

  const [fromDate, setFromDate] = useState(() => dateInputValue(monthAgo));
  const [toDate, setToDate] = useState(() => dateInputValue(today));
  const [tableId, setTableId] = useState("");
  const [menuItemId, setMenuItemId] = useState("");
  const [menuItems, setMenuItems] = useState([]);
  const [itemOptionsLoading, setItemOptionsLoading] = useState(true);
  const [itemOptionsError, setItemOptionsError] = useState("");
  const [optionsRetry, setOptionsRetry] = useState(0);
  const [appliedFilters, setAppliedFilters] = useState(() => ({ fromDate, toDate, tableId: "", menuItemId: "" }));
  const [chartGroup, setChartGroup] = useState("item");
  const [chartMetric, setChartMetric] = useState("amount");
  const [report, setReport] = useState(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSessionId, setExpandedSessionId] = useState(null);

  useEffect(() => {
    let active = true;
    setItemOptionsLoading(true);
    setItemOptionsError("");
    getRestaurantMenuItems(restaurantId, platform)
      .then((items) => { if (active) setMenuItems(items); })
      .catch((requestError) => { if (active) setItemOptionsError(requestError.message); })
      .finally(() => { if (active) setItemOptionsLoading(false); });
    return () => { active = false; };
  }, [restaurantId, optionsRetry, platform]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setReport(null);
    setExpandedSessionId(null);
    getSalesReport({
      platformRestaurantId: platform ? restaurantId : undefined,
      from: reportBoundary(appliedFilters.fromDate, false),
      to: reportBoundary(appliedFilters.toDate, true),
      tableId: appliedFilters.tableId,
      menuItemId: appliedFilters.menuItemId,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      page,
      size: 20,
      signal: controller.signal,
    })
      .then((data) => {
        if (!Array.isArray(data.items) || !Array.isArray(data.days)) {
          throw new Error("Sales charts require the updated backend. Restart Spring Boot, then apply filters again.");
        }
        if (active) setReport(data);
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [appliedFilters, page, restaurantId, platform]);

  function handleSubmit(event) {
    event.preventDefault();
    if (!fromDate || !toDate || fromDate > toDate) {
      setError("Choose a valid date range, with From before or equal to To.");
      return;
    }
    setPage(0);
    setAppliedFilters({ fromDate, toDate, tableId, menuItemId });
  }

  const filtersChanged = fromDate !== appliedFilters.fromDate || toDate !== appliedFilters.toDate
    || tableId !== appliedFilters.tableId || menuItemId !== appliedFilters.menuItemId;
  const selectedItem = menuItems.find((item) => item.id === report?.menuItemId);

  return (
    <section className="space-y-6" role="tabpanel" aria-label="Sales and history">
      <form onSubmit={handleSubmit} className="panel p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted">From</span>
              <input
                required
                type="date"
                value={fromDate}
                max={toDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-2xl border border-line bg-white px-4"
              />
            </label>
            <label>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted">To</span>
              <input
                required
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(event) => setToDate(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-2xl border border-line bg-white px-4"
              />
            </label>
            <label>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Table</span>
              <select
                value={tableId}
                onChange={(event) => setTableId(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-2xl border border-line bg-white px-4"
              >
                <option value="">All tables</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>Table {table.tableNumber}</option>
                ))}
              </select>
            </label>
            <label className="min-w-0">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Food item</span>
              <select
                value={menuItemId}
                disabled={itemOptionsLoading || Boolean(itemOptionsError)}
                onChange={(event) => setMenuItemId(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-2xl border border-line bg-white px-4 disabled:opacity-50"
              >
                <option value="">{itemOptionsLoading ? "Loading food items..." : "All food items"}</option>
                {menuItems.map((item) => (
                  <option key={item.id} value={item.id}>{item.name} ({item.categoryName}){item.available ? "" : " - unavailable"}</option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="min-h-12 rounded-full bg-paprika px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Preparing report..." : "Apply filters"}
          </button>
        </div>
        <p className="mt-4 text-xs text-muted">
          Sales are recorded when a paid bill is closed. Dates use the settlement time. Food-item filters count only matching items, not the entire bill.
        </p>
        {filtersChanged ? <p role="status" className="mt-2 text-xs font-semibold text-paprika">Filters changed. Click Apply filters to update the chart and history.</p> : null}
        {itemOptionsError ? (
          <p role="alert" className="mt-3 text-sm text-paprika">
            Food filters could not be loaded: {itemOptionsError}{" "}
            <button type="button" onClick={() => setOptionsRetry((value) => value + 1)} className="min-h-11 px-2 font-bold underline">Retry food list</button>
          </p>
        ) : null}
      </form>

      {error ? (
        <div role="alert" className="rounded-2xl bg-paprika/10 px-4 py-3 text-sm text-paprika">
          {error}
        </div>
      ) : null}

      {loading && !report ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="panel h-36 animate-pulse bg-white/70" />
          ))}
        </div>
      ) : report ? (
        <>
          <button type="button" className="admin-secondary" onClick={() => downloadSalesSummary(report)}>Download summary CSV</button>
          <p className="text-sm text-muted" role="status">
            Showing {appliedFilters.fromDate} to {appliedFilters.toDate} / {report.tableId ? `Table ${tables.find((table) => table.id === report.tableId)?.tableNumber || "selected"}` : "All tables"} / {report.menuItemId ? selectedItem?.name || "Selected food item" : "All food items"}
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              accent
              label={report.menuItemId ? "Selected item sales" : "Settled sales"}
              value={currency.format(Number(report.totalAmount || 0))}
              detail={report.menuItemId ? "Matching quantities at order-time prices" : "External payments recorded"}
            />
            <SummaryCard label="Bills closed" value={report.settledBills} detail="Matching settled table sessions" />
            <SummaryCard label="Orders" value={report.totalOrders} detail={report.menuItemId ? "Orders containing the selected item" : "Orders across settled bills"} />
            <SummaryCard label="Items sold" value={report.totalItems} detail="Total item quantity" />
          </div>

          <SalesBarChart report={report} groupBy={chartGroup} metric={chartMetric} onGroupChange={setChartGroup} onMetricChange={setChartMetric} />

          <section>
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-olive">Performance</p>
              <h2 className="mt-1 text-2xl font-bold">Sales by table</h2>
            </div>
            {report.tables.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {report.tables.map((table) => (
                  <article key={table.tableId} className="panel p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-olive">Table {table.tableNumber}</p>
                        <p className="mt-2 text-sm text-muted">{table.settledBills} settled bills</p>
                      </div>
                      <p className="text-xl font-bold text-paprika">
                        {currency.format(Number(table.totalAmount || 0))}
                      </p>
                    </div>
                    <div className="mt-4 flex gap-4 border-t border-line pt-4 text-xs text-muted">
                      <span>{table.totalOrders} orders</span>
                      <span>{table.totalItems} items</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="panel p-7 text-center text-muted">No settled table sales in this date range.</div>
            )}
          </section>

          <section>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-olive">Statement</p>
                <h2 className="mt-1 text-2xl font-bold">Settled bill history</h2>
              </div>
              <p className="text-xs text-muted">{report.totalElements} records</p>
            </div>

            {report.statements.length ? (
              <div className="overflow-hidden rounded-[28px] border border-line bg-card shadow-lift">
                <div className="hidden grid-cols-[0.8fr_1.5fr_0.7fr_0.8fr_auto] gap-4 border-b border-line bg-white/70 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-muted md:grid">
                  <span>Table</span>
                  <span>Settled</span>
                  <span>Orders</span>
                  <span>Items</span>
                  <span className="text-right">{report.menuItemId ? "Item amount" : "Amount"}</span>
                </div>
                {report.statements.map((statement) => {
                  const expanded = expandedSessionId === statement.sessionId;
                  return (
                    <div key={statement.sessionId} className="border-b border-line last:border-0">
                      <button
                        type="button"
                        onClick={() => setExpandedSessionId(expanded ? null : statement.sessionId)}
                        className="grid w-full gap-2 px-5 py-4 text-left transition hover:bg-white/60 md:grid-cols-[0.8fr_1.5fr_0.7fr_0.8fr_auto] md:items-center md:gap-4"
                        aria-expanded={expanded}
                      >
                        <span className="font-bold text-ink">Table {statement.tableNumber}</span>
                        <span className="text-sm text-muted">{formatDateTime(statement.settledAt)}</span>
                        <span className="text-sm text-muted">{statement.totalOrders} orders</span>
                        <span className="text-sm text-muted">{statement.totalItems} items</span>
                        <span className="font-bold text-paprika md:text-right">
                          {currency.format(Number(statement.totalAmount || 0))}
                        </span>
                      </button>

                      {expanded ? (
                        <div className="bg-shell/50 px-5 py-5">
                          <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted">
                            <span>Opened {formatDateTime(statement.openedAt)}</span>
                            <span>Session {statement.sessionId.slice(0, 8)}</span>
                            {report.menuItemId ? <span>Full bill: {currency.format(Number(statement.billTotalAmount))}. Matching food items shown below.</span> : null}
                          </div>
                          <div className="grid gap-3 lg:grid-cols-2">
                            {statement.orders.map((order) => (
                              <article key={order.orderId} className="rounded-2xl border border-line bg-white p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-bold">{order.customerName || "Guest order"}</p>
                                    <p className="mt-1 text-xs text-muted">{formatDateTime(order.createdAt)}</p>
                                  </div>
                                  <p className="font-bold text-paprika">
                                    {currency.format(Number(order.estimatedTotalAmount || 0))}
                                  </p>
                                </div>
                                <ul className="mt-3 space-y-2 border-t border-line pt-3">
                                  {order.items.map((item) => (
                                    <li key={item.orderItemId} className="flex justify-between gap-3 text-sm">
                                      <span>{item.quantity} × {item.menuItemName}</span>
                                      <span className="text-muted">{currency.format(Number(item.lineTotal || 0))}</span>
                                    </li>
                                  ))}
                                </ul>
                              </article>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="panel p-10 text-center">
                <p className="text-2xl font-bold">No settled bills found</p>
                <p className="mt-2 text-sm text-muted">Change the date, table, or food item, or record a paid table session.</p>
              </div>
            )}

            {report.totalPages > 1 ? (
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={page === 0 || loading}
                  onClick={() => setPage((current) => current - 1)}
                  className="min-h-11 rounded-full border border-line bg-white px-5 text-sm font-semibold disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-muted">Page {page + 1} of {report.totalPages}</span>
                <button
                  type="button"
                  disabled={page + 1 >= report.totalPages || loading}
                  onClick={() => setPage((current) => current + 1)}
                  className="min-h-11 rounded-full border border-line bg-white px-5 text-sm font-semibold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </section>
  );
}
