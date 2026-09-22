import { useRef, useState } from "react";
import { createAdminTable } from "../services/api";
import { isLocalCustomerUrl } from "../services/tableQr";
import TableQrCard from "./TableQrCard";

export default function TablesPanel({ tables, restaurantName, loading, onRefresh, onCreated }) {
  const [tableNumber, setTableNumber] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);
  const submitting = useRef(false);
  const visibleTables = tables
    .filter((table) => table.tableNumber.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => a.tableNumber.localeCompare(b.tableNumber, undefined, { numeric: true }));
  const localLinks = tables.some((table) => isLocalCustomerUrl(table.qrCodeUrl));

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting.current || loading || !tableNumber.trim()) return;
    submitting.current = true;
    setSaving(true);
    setError("");
    try {
      const table = await createAdminTable({ tableNumber: tableNumber.trim() });
      onCreated(table);
      setCreated(table);
      setTableNumber("");
      setSearch("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <section className="mt-6" role="tabpanel" aria-label="Tables and QR codes">
      <div className="panel grid overflow-hidden lg:grid-cols-[1fr_1.2fr]">
        <div className="border-b border-line bg-saffron/10 p-6 lg:border-b-0 lg:border-r">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-olive">Make room for more</p>
          <h2 className="mt-2 text-3xl font-bold">A table. A code. Ready.</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted">Add a table, download its QR card, and let guests order together. The same code works for every new group after settlement.</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <label htmlFor="new-table-name" className="text-sm font-semibold">Table name or number</label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="new-table-name"
              value={tableNumber}
              onChange={(event) => setTableNumber(event.target.value)}
              placeholder="e.g. T6, PATIO 1, ROOFTOP 2"
              required
              maxLength={30}
              disabled={saving || loading}
              aria-describedby="table-name-help"
              className="min-h-12 min-w-0 flex-1 rounded-2xl border border-line bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-saffron disabled:opacity-60"
            />
            <button type="submit" disabled={saving || loading || !tableNumber.trim()} className="min-h-12 shrink-0 rounded-full bg-paprika px-6 py-3 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? "Adding table..." : "Add table"}
            </button>
          </div>
          <p id="table-name-help" className="mt-3 text-xs leading-5 text-muted">Up to 30 characters. Letters, numbers, spaces, hyphens, and underscores. Names are saved in uppercase and must be unique in your restaurant.</p>
          {error ? <p role="alert" className="mt-3 text-sm text-paprika">{error}</p> : null}
          {created ? <p role="status" className="mt-3 text-sm font-semibold text-olive">Table {created.tableNumber} added. Its QR card is ready below.</p> : null}
        </form>
      </div>

      {localLinks ? (
        <aside className="mt-4 rounded-2xl border border-saffron/50 bg-saffron/15 p-4 text-sm leading-6 text-ink">
          <p className="font-bold">Before you print: these links use localhost.</p>
          <p>A phone cannot reach this Mac through localhost. Set the backend&apos;s <code className="break-all text-xs">APP_CUSTOMER_BASE_URL</code> to your public site or this Mac&apos;s Wi-Fi IP address, restart the backend, then refresh these cards.</p>
        </aside>
      ) : null}

      <div className="mb-4 mt-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your tables</h2>
          <p className="mt-1 text-sm text-muted">{visibleTables.length} of {tables.length} tables. QR codes are generated on your device.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input type="search" aria-label="Search tables" placeholder="Search tables" value={search} onChange={(event) => setSearch(event.target.value)} className="min-h-11 min-w-0 flex-1 rounded-full border border-line bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-saffron" />
          <button type="button" onClick={onRefresh} disabled={loading || saving} className="min-h-11 rounded-full border border-line bg-white px-4 text-sm font-semibold disabled:opacity-50">{loading ? "Refreshing..." : "Refresh tables"}</button>
        </div>
      </div>

      {loading && !tables.length ? (
        <p role="status" className="panel p-8 text-center text-muted">Loading your tables...</p>
      ) : visibleTables.length ? (
        <div className="grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visibleTables.map((table) => <TableQrCard key={table.id} table={table} restaurantName={restaurantName} isNew={created?.id === table.id} />)}
        </div>
      ) : (
        <div className="panel p-10 text-center">
          <h3 className="text-xl font-bold">{search ? "No matching tables" : "Add your first table"}</h3>
          <p className="mt-2 text-sm text-muted">{search ? "Try another table name." : "Use the form above to create a table and its customer QR code."}</p>
        </div>
      )}
    </section>
  );
}
