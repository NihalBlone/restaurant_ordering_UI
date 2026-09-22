import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { platformGet, platformSave } from "../services/api";
import StaffPanel, { InvitationNotice } from "../components/StaffPanel";
import SalesReportPanel from "../components/SalesReportPanel";

const sections = ["Overview", "Restaurants", "Reports", "Audit", "Settings"];
const emptyRestaurant = { name: "", location: "", planCode: "STARTER", tableLimit: 20, staffLimit: 10, trialEndsAt: "" };
const currency = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value || 0));

function RestaurantFields({ value, onChange }) {
  const field = (key, next) => onChange({ ...value, [key]: next });
  return <div className="grid gap-4 sm:grid-cols-2">
    <label className="admin-label">Restaurant name<input className="admin-input" required maxLength={120} value={value.name} onChange={(e) => field("name", e.target.value)} /></label>
    <label className="admin-label">Location<input className="admin-input" required maxLength={255} value={value.location} onChange={(e) => field("location", e.target.value)} /></label>
    <label className="admin-label">Plan label<input className="admin-input" required pattern="[A-Z0-9_-]{1,30}" maxLength={30} value={value.planCode} onChange={(e) => field("planCode", e.target.value.toUpperCase())} /></label>
    <label className="admin-label">Trial ends (optional)<input className="admin-input" type="date" value={value.trialEndsAt?.slice(0, 10) || ""} onChange={(e) => field("trialEndsAt", e.target.value)} /></label>
    <label className="admin-label">Table limit<input className="admin-input" required type="number" min={1} max={1000} value={value.tableLimit} onChange={(e) => field("tableLimit", Number(e.target.value))} /></label>
    <label className="admin-label">Staff account limit<input className="admin-input" required type="number" min={1} max={500} value={value.staffLimit} onChange={(e) => field("staffLimit", Number(e.target.value))} /></label>
  </div>;
}

function restaurantPayload(form) {
  return { name: form.name, location: form.location, planCode: form.planCode, tableLimit: form.tableLimit,
    staffLimit: form.staffLimit, trialEndsAt: form.trialEndsAt ? new Date(`${form.trialEndsAt.slice(0, 10)}T23:59:59Z`).toISOString() : null };
}

function RestaurantDetails({ restaurant, onUpdated }) {
  const [form, setForm] = useState(restaurant);
  const [status, setStatus] = useState(restaurant.status);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function save(event, access = false) {
    event.preventDefault();
    if (access && !window.confirm(`Set ${restaurant.name} to ${status}? This signs out all staff. Suspended and archived restaurants cannot accept orders.`)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await platformSave(`restaurants/${restaurant.id}${access ? "/status" : ""}`, access ? { status, reason } : restaurantPayload(form));
      onUpdated(result); setNotice(access ? "Access updated. All staff sessions revoked." : "Restaurant details saved.");
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  return <div className="space-y-6">
    {error && <p role="alert" className="admin-error">{error}</p>}
    {notice && <p role="status" className="admin-success">{notice}</p>}
    <form className="panel space-y-5 p-6" onSubmit={save}>
      <h2 className="text-2xl font-bold">{restaurant.name}</h2>
      <p className="text-sm text-muted">{restaurant.tableCount} / {restaurant.tableLimit} tables, {restaurant.staffCount} / {restaurant.staffLimit} staff accounts. Disabled accounts still count toward the limit.</p>
      <RestaurantFields value={form} onChange={setForm} />
      <p className="text-xs text-muted">Plan and trial dates are administrative labels. No automatic billing or expiry enforcement is enabled.</p>
      <button className="admin-primary" disabled={busy}>Save restaurant</button>
    </form>
    <form className="panel space-y-4 p-6" onSubmit={(event) => save(event, true)}>
      <h3 className="text-xl font-bold">Restaurant access</h3>
      <p className="text-sm text-muted">Archiving preserves order and sales history. It does not delete customer data.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="admin-label">Status<select className="admin-input" value={status} onChange={(e) => setStatus(e.target.value)}>{["ACTIVE", "SUSPENDED", "ARCHIVED"].map((s) => <option key={s}>{s}</option>)}</select></label>
        <label className="admin-label">Reason for audit log<input required maxLength={500} className="admin-input" value={reason} onChange={(e) => setReason(e.target.value)} /></label>
      </div>
      <button className="admin-primary" disabled={busy || status === restaurant.status}>Update access</button>
    </form>
    <StaffPanel restaurantId={restaurant.id} />
  </div>;
}

function PlatformReport({ restaurant }) {
  const [tables, setTables] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    platformGet(`restaurants/${restaurant.id}/tables`).then((data) => { if (active) setTables(data); })
      .catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [restaurant.id]);
  if (error) return <p className="admin-error" role="alert">{error}</p>;
  if (!tables) return <p role="status">Loading restaurant report...</p>;
  return <div className="space-y-4"><p className="rounded-2xl bg-saffron/20 p-4 text-sm">Read-only support view for <strong>{restaurant.name}</strong>. Report access is recorded in the audit log.</p>
    <SalesReportPanel platform tables={tables} restaurantId={restaurant.id} /></div>;
}

function AuditPanel({ restaurantId }) {
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setData(null); setError("");
    platformGet("audit", { restaurantId: restaurantId || undefined, page }).then((result) => { if (active) setData(result); })
      .catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [page, restaurantId]);
  return <div className="space-y-4">
    <h2 className="text-2xl font-bold">Accountability, by default</h2>
    <p className="text-sm text-muted">Onboarding, account changes, access decisions, settings, and platform report views.</p>
    {error && <p role="alert" className="admin-error">{error}</p>}
    {!data && !error && <p role="status">Loading audit history...</p>}
    {data?.content.map((entry) => <article className="panel p-5" key={entry.id}>
      <div className="flex flex-wrap justify-between gap-2"><h3 className="font-bold">{entry.action.replaceAll("_", " ")}</h3><time className="text-xs text-muted">{new Date(entry.createdAt).toLocaleString()}</time></div>
      <p className="mt-2 text-sm">{entry.details}</p><p className="mt-2 break-all text-xs text-muted">By {entry.actorName} {entry.restaurantId ? ` / Restaurant ${entry.restaurantId}` : " / Platform"}</p>
    </article>)}
    {data && !data.content.length && <p className="panel p-8 text-muted">No recorded actions yet.</p>}
    {data && <div className="flex items-center gap-3"><button className="admin-secondary" disabled={!page} onClick={() => setPage(page - 1)}>Previous</button>
      <span className="text-sm">Page {page + 1} of {Math.max(1, data.totalPages)}</span><button className="admin-secondary" disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)}>Next</button></div>}
  </div>;
}

function SettingsPanel() {
  const [form, setForm] = useState(null);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    platformGet("settings").then((data) => { if (active) setForm(data); }).catch((e) => { if (active) setError(e.message); });
    platformGet("health").then((data) => { if (active) setHealth(data); }).catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, []);
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const { productName, supportEmail, announcement, version } = form;
      setForm(await platformSave("settings", { productName, supportEmail, announcement, version }));
      setNotice("Settings saved. Restaurant staff see the announcement when they open their workspace.");
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
    <div>{error && <p className="admin-error mb-4" role="alert">{error}</p>}{notice && <p className="admin-success mb-4" role="status">{notice}</p>}
      {form ? <form className="panel space-y-5 p-6" onSubmit={save}>
        <h2 className="text-2xl font-bold">Platform settings</h2>
        <label className="admin-label">Product name<input className="admin-input" required maxLength={120} value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} /></label>
        <label className="admin-label">Support email<input className="admin-input" type="email" maxLength={254} value={form.supportEmail} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} /></label>
        <label className="admin-label">Restaurant announcement<textarea className="admin-input min-h-32" maxLength={1000} value={form.announcement} onChange={(e) => setForm({ ...form, announcement: e.target.value })} /></label>
        <button className="admin-primary" disabled={busy}>{busy ? "Saving..." : "Publish settings"}</button>
      </form> : <p role="status">Loading settings...</p>}
    </div>
    <aside className="panel h-fit space-y-5 p-6"><h2 className="text-2xl font-bold">Operations</h2>
      {health ? <><p className="admin-success">Database connection: {health.database}</p><p className="text-sm text-muted">Server uptime: {Math.floor(health.uptimeSeconds / 60)} minutes</p>
        <div className="border-t border-line pt-4"><h3 className="font-bold">Backups</h3><p className="mt-2 text-sm text-muted">{health.backups}</p></div>
        <div><h3 className="font-bold">Realtime deployment</h3><p className="mt-2 text-sm text-muted">{health.messaging}. Use a shared broker and distributed rate limiting before running multiple application replicas.</p></div></> : <p>Checking database...</p>}
      <p className="text-xs text-muted">This screen does not configure cloud backups, monitoring alerts, payment processing, or retention jobs.</p>
    </aside>
  </div>;
}

export default function PlatformDashboardPage() {
  const { admin, logout } = useAuth();
  const [section, setSection] = useState("Overview");
  const [overview, setOverview] = useState(null);
  const [restaurants, setRestaurants] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyRestaurant);
  const [owner, setOwner] = useState({ username: "", email: "", role: "RESTAURANT_ADMIN" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setError("");
    platformGet("overview").then((data) => { if (active) setOverview(data); }).catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [revision]);
  useEffect(() => {
    let active = true;
    setRestaurants(null);
    platformGet("restaurants", { search: filter, page }).then((data) => { if (active) setRestaurants(data); }).catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [filter, page, revision]);

  async function onboard(event) {
    event.preventDefault(); setBusy(true); setError(""); setToken(null);
    try {
      const result = await platformSave("restaurants", { restaurant: restaurantPayload(form), owner }, "post");
      setToken(result.invitation.developmentResetToken); setSelected(result.restaurant);
      setShowCreate(false); setForm(emptyRestaurant); setOwner({ username: "", email: "", role: "RESTAURANT_ADMIN" });
      setRevision((value) => value + 1);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  return <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6">
    <header className="overflow-hidden rounded-[30px] bg-ink text-white shadow-lift">
      <div className="flex flex-wrap items-start justify-between gap-6 p-7 sm:p-9"><div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-saffron">Tableside / Platform</p>
        <h1 className="mt-3 text-4xl font-bold sm:text-5xl">Every restaurant.<br /><span className="text-white/45">One clear view.</span></h1>
      </div><div className="text-sm"><p className="mb-3 text-white/60">Platform owner / @{admin.username}</p><button onClick={logout} className="min-h-11 rounded-full border border-white/25 px-5 font-semibold">Sign out</button></div></div>
      <nav className="flex gap-2 overflow-auto border-t border-white/10 px-5 py-3" aria-label="Platform sections">{sections.map((name) => <button key={name} onClick={() => { setSection(name); setError(""); }} aria-current={section === name ? "page" : undefined} className={`min-h-11 shrink-0 rounded-full px-5 text-sm font-semibold ${section === name ? "bg-saffron text-ink" : "text-white/65 hover:bg-white/10"}`}>{name}</button>)}</nav>
    </header>
    <div className="my-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted">Platform access is separate from restaurant operations. Customer QR links need no login.</p><button className="admin-secondary" onClick={() => setRevision((value) => value + 1)}>Refresh</button></div>
    {error && <p role="alert" className="admin-error mb-5">{error}</p>}
    {section === "Overview" && <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
        ["Restaurants", overview?.restaurants], ["Active", overview?.activeRestaurants], ["Suspended", overview?.suspendedRestaurants], ["Orders placed", overview?.orders],
      ].map(([label, value]) => <article className="panel p-6" key={label}><p className="text-xs font-bold uppercase tracking-[0.18em] text-olive">{label}</p><p className="mt-4 text-5xl font-bold">{value ?? "..."}</p></article>)}</div>
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]"><article className="rounded-[28px] bg-olive p-8 text-white"><p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">Restaurant sales recorded</p><p className="mt-4 text-4xl font-bold">{overview ? currency(overview.settledSales) : "..."}</p><p className="mt-4 text-sm text-white/65">{overview?.settledBills ?? 0} settled bills across all restaurants, all time. This is restaurant sales, not your SaaS subscription revenue.</p></article>
        <article className="panel p-8"><h2 className="text-2xl font-bold">Bring a restaurant online</h2><p className="mt-3 text-sm leading-6 text-muted">Create its workspace, set capacity, and invite an owner. Their team handles the menu, tables, and service.</p><button className="admin-primary mt-5" onClick={() => { setSection("Restaurants"); setShowCreate(true); }}>Onboard restaurant</button></article></div>
    </section>}

    {["Restaurants", "Reports", "Audit"].includes(section) && <section className="space-y-5">
      <form className="panel flex flex-wrap items-end gap-3 p-5" onSubmit={(event) => { event.preventDefault(); setFilter(search); setPage(0); }}>
        <label className="admin-label flex-1">Find a restaurant<input className="admin-input" maxLength={120} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by restaurant name" /></label><button className="admin-primary">Search</button>
        {section === "Restaurants" && <button type="button" className="admin-secondary" onClick={() => setShowCreate(!showCreate)}>{showCreate ? "Close form" : "New restaurant"}</button>}
      </form>
      {section === "Restaurants" && <InvitationNotice token={token} />}
      {showCreate && section === "Restaurants" && <form className="panel space-y-5 p-6" onSubmit={onboard}>
        <h2 className="text-2xl font-bold">A new place at the table</h2><RestaurantFields value={form} onChange={setForm} />
        <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2"><label className="admin-label">Owner username<input required pattern="[A-Za-z0-9._-]{3,80}" maxLength={80} className="admin-input" value={owner.username} onChange={(e) => setOwner({ ...owner, username: e.target.value })} /></label>
          <label className="admin-label">Owner email<input type="email" required maxLength={254} className="admin-input" value={owner.email} onChange={(e) => setOwner({ ...owner, email: e.target.value })} /></label></div>
        <p className="text-sm text-muted">An invitation lets the owner choose their own password. Plan labels do not charge or automatically suspend the restaurant.</p><button className="admin-primary" disabled={busy}>{busy ? "Creating workspace..." : "Create & invite owner"}</button>
      </form>}
      <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-3" aria-label="Restaurant selection">
          {selected && <button className="admin-secondary w-full" onClick={() => setSelected(null)}>Clear selection{section === "Audit" ? " / All activity" : ""}</button>}
          {!restaurants && <p role="status" className="p-4">Loading restaurants...</p>}
          {restaurants?.content.map((restaurant) => <button key={restaurant.id} onClick={() => setSelected(restaurant)} aria-pressed={selected?.id === restaurant.id} className={`w-full rounded-2xl border p-5 text-left transition ${selected?.id === restaurant.id ? "border-olive bg-olive text-white" : "border-line bg-card hover:bg-white"}`}>
            <span className="block text-lg font-bold">{restaurant.name}</span><span className="mt-1 block text-xs opacity-65">{restaurant.location}</span><span className="mt-3 block text-xs font-bold tracking-wider">{restaurant.status} / {restaurant.planCode}</span>
          </button>)}
          {restaurants && !restaurants.content.length && <p className="panel p-5 text-sm text-muted">No matching restaurants. Create one or change your search.</p>}
          {restaurants && <div className="flex justify-between gap-2"><button className="admin-secondary" disabled={!page} onClick={() => setPage(page - 1)}>Previous</button><button className="admin-secondary" disabled={page + 1 >= restaurants.totalPages} onClick={() => setPage(page + 1)}>Next</button></div>}
        </aside>
        <div className="min-w-0">{section === "Audit" ? <AuditPanel key={selected?.id || "all"} restaurantId={selected?.id} /> : selected ? (
          section === "Restaurants" ? <RestaurantDetails key={selected.id} restaurant={selected} onUpdated={(value) => { setSelected(value); setRevision((v) => v + 1); }} /> : <PlatformReport key={selected.id} restaurant={selected} />
        ) : <div className="panel p-10"><p className="text-xs font-bold uppercase tracking-widest text-olive">Choose a workspace</p><h2 className="mt-3 text-3xl font-bold">Select a restaurant to continue</h2><p className="mt-3 text-sm text-muted">{section === "Reports" ? "Explore read-only sales history by date, table, or food item." : "Manage profile, capacity, access, and staff without impersonating an owner."}</p></div>}</div>
      </div>
    </section>}
    {section === "Settings" && <SettingsPanel />}
  </main>;
}
