import { buildSalesBars } from "../services/salesChart";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const quantity = new Intl.NumberFormat("en-IN");
const groupNames = { item: "food item", table: "table", day: "day" };

export default function SalesBarChart({ report, groupBy, metric, onGroupChange, onMetricChange }) {
  const { bars, max } = buildSalesBars(report, groupBy, metric);
  const format = (value) => metric === "amount" ? money.format(value) : `${quantity.format(value)} items`;

  return (
    <section className="panel overflow-hidden" aria-label="Filtered sales bar chart">
      <div className="flex flex-col gap-4 border-b border-line p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-olive">The bigger picture</p>
          <h2 className="mt-2 text-2xl font-bold">{metric === "amount" ? "Sales" : "Quantity sold"} by {groupNames[groupBy]}</h2>
          <p className="mt-2 text-xs leading-5 text-muted">All matching settled bills, across every history page. Daily totals use {report.timeZone}.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-semibold text-muted">
            Group chart by
            <select value={groupBy} onChange={(event) => onGroupChange(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink">
              <option value="item">Food item</option>
              <option value="table">Table</option>
              <option value="day">Day</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-muted">
            Measure
            <select value={metric} onChange={(event) => onMetricChange(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink">
              <option value="amount">Sales amount</option>
              <option value="quantity">Quantity sold</option>
            </select>
          </label>
        </div>
      </div>
      {report.settledBills > 0 && bars.length ? (
        <figure className="p-5 sm:p-6">
          <figcaption className="mb-5 flex justify-between gap-3 text-xs text-muted">
            <span>{bars.length} {groupBy === "day" ? "days" : "groups"}{groupBy !== "day" ? ", highest first" : ", settlement date"}</span>
            <span>Scale: 0 to {format(max)}</span>
          </figcaption>
          <div className="max-h-[28rem] overflow-y-auto pr-2" tabIndex={0} aria-label="Scroll sales chart values">
            <ul className="space-y-5">
              {bars.map((bar) => (
                <li key={bar.key}>
                  <div className="mb-2 flex items-start justify-between gap-4 text-sm">
                    <span className="min-w-0 break-words font-semibold">{bar.label}</span>
                    <span className="shrink-0 font-bold tabular-nums text-paprika">{format(bar.value)}</span>
                  </div>
                  <div aria-hidden="true" className="h-5 overflow-hidden rounded-r-md border-l border-ink/20 bg-shell" style={{backgroundImage:"linear-gradient(to right, transparent calc(100% - 1px), #e7dbc7 1px)",backgroundSize:"25% 100%"}}>
                    <div className="h-full rounded-r-md bg-gradient-to-r from-paprika to-saffron motion-safe:transition-[width] motion-safe:duration-500" style={{width:`${bar.percent}%`}} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </figure>
      ) : (
        <p className="p-8 text-center text-sm text-muted">No settled sales match these filters. Try a different date, table, or food item.</p>
      )}
    </section>
  );
}
