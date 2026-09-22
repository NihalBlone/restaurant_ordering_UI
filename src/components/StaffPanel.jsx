import { useEffect, useState } from "react";
import { getStaff, inviteStaff, updateStaff, staffAction } from "../services/api";

export const STAFF_ROLES = [
  ["RESTAURANT_ADMIN", "Owner"], ["MANAGER", "Manager"], ["KITCHEN", "Kitchen"], ["WAITER", "Waiter"],
];

export function InvitationNotice({ token }) {
  if (!token) return null;
  const url = `${window.location.origin}/admin/reset-password?token=${encodeURIComponent(token)}`;
  return <div className="rounded-2xl border border-saffron bg-saffron/15 p-4 text-sm">
    <p className="font-bold">Development invitation link</p>
    <p className="mt-1 text-muted">Shown only when the backend enables development reset tokens. Production invitations are sent by email.</p>
    <a className="mt-3 block break-all font-semibold text-paprika underline" href={url} target="_blank" rel="noreferrer">{url}</a>
  </div>;
}

export default function StaffPanel({ restaurantId }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [token, setToken] = useState(null);
  const [revision, setRevision] = useState(0);
  const [form, setForm] = useState({ username: "", email: "", role: "WAITER" });

  useEffect(() => {
    let active = true;
    setLoading(true);
    getStaff(restaurantId).then((data) => { if (active) setStaff(data); })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [restaurantId, revision]);

  async function run(action, message) {
    setBusy(true); setError(""); setNotice(""); setToken(null);
    try {
      const response = await action();
      setToken(response?.developmentResetToken || null);
      setNotice(message);
      setRevision((value) => value + 1);
      return true;
    } catch (e) { setError(e.message); return false; }
    finally { setBusy(false); }
  }

  async function invite(event) {
    event.preventDefault();
    if (await run(() => inviteStaff(restaurantId, form), "Account invited. Ask the team member to set their password using the email link.")) {
      setForm({ username: "", email: "", role: "WAITER" });
    }
  }

  return <section className="space-y-5" aria-label="Staff management">
    <div><h2 className="text-2xl font-bold">People & permissions</h2>
      <p className="mt-2 text-sm text-muted">Owners manage staff. Managers manage the menu and reports. Kitchen staff update orders. Waiters can also settle bills.</p></div>
    {error && <div className="admin-error" role="alert">{error}</div>}
    {notice && <p role="status" className="admin-success">{notice}</p>}
    <InvitationNotice token={token} />
    <form onSubmit={invite} className="panel grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
      <label className="admin-label">Username<input className="admin-input" required pattern="[A-Za-z0-9._-]{3,80}" maxLength={80} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
      <label className="admin-label">Email<input className="admin-input" type="email" required maxLength={254} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
      <label className="admin-label">Role<select className="admin-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{STAFF_ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <button className="admin-primary self-end" disabled={busy} type="submit">{busy ? "Working..." : "Invite team member"}</button>
    </form>
    <button className="admin-secondary" onClick={() => setRevision((value) => value + 1)} disabled={loading}>Refresh accounts</button>
    {loading ? <p className="p-5 text-muted" role="status">Loading accounts...</p> : <div className="grid gap-4 lg:grid-cols-2">
      {staff.map((account) => <article className="panel p-5" key={account.id}>
        <div className="flex justify-between gap-3"><div><h3 className="text-lg font-bold">@{account.username}</h3><p className="break-all text-sm text-muted">{account.email}</p></div>
          <span className={`h-fit rounded-full px-3 py-1 text-xs font-bold ${account.active ? "bg-emerald-100 text-emerald-800" : "bg-paprika/10 text-paprika"}`}>{account.active ? "Active" : "Disabled"}</span></div>
        <label className="admin-label mt-4">Access role<select className="admin-input" disabled={busy} value={account.role} onChange={(e) => {
          const role = e.target.value;
          if (window.confirm(`Change ${account.username}'s role? Existing sessions will be revoked.`)) run(() => updateStaff(restaurantId, account.id, { role, active: account.active }), "Role updated; existing sessions revoked.");
        }}>{STAFF_ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="admin-secondary" disabled={busy} onClick={() => {
            if (window.confirm(`${account.active ? "Disable" : "Enable"} ${account.username}?`)) run(() => updateStaff(restaurantId, account.id, { role: account.role, active: !account.active }), "Account access updated.");
          }}>{account.active ? "Disable" : "Enable"}</button>
          <button className="admin-secondary" disabled={busy} onClick={() => run(() => staffAction(restaurantId, account.id, "revoke"), "All sessions revoked.")}>Revoke sessions</button>
          <button className="admin-secondary" disabled={busy || !account.active} onClick={() => run(() => staffAction(restaurantId, account.id, "reset"), "Password reset issued.")}>Reset password</button>
        </div>
      </article>)}
      {!staff.length && <p className="panel p-6 text-muted">No staff accounts found.</p>}
    </div>}
  </section>;
}
