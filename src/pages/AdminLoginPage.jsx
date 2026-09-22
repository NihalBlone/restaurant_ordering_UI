import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import AdminAuthShell from "../components/AdminAuthShell";
import { useAuth } from "../context/AuthContext";

export default function AdminLoginPage({ platform = false }) {
  const { admin, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (admin) {
    return <Navigate to={admin.role === "PLATFORM_ADMIN" ? "/platform" : "/dashboard"} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login({ username: username.trim(), password, ...(platform ? { code } : {}) }, platform);
      const destination = platform ? "/platform" : "/dashboard";
      navigate(destination, { replace: true });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminAuthShell
      platform={platform}
      eyebrow={platform ? "Platform owner" : "Staff sign in"}
      title={platform ? "The bigger picture" : "Welcome back"}
      description={platform ? "Manage restaurants, access, and the health of your platform." : "Sign in with the restaurant account created for your team."}
    >
      {location.state?.message ? (
        <div className="mb-5 rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-800">
          {location.state.message}
        </div>
      ) : null}
      {error ? (
        <div role="alert" className="mb-5 rounded-2xl bg-paprika/10 px-4 py-3 text-sm text-paprika">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-ink">Username</span>
          <input
            autoFocus
            required
            autoComplete="username"
            maxLength={80}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="mt-2 min-h-14 w-full rounded-2xl border border-line bg-white px-4"
            placeholder="Restaurant username"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink">Password</span>
          <input
            required
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 min-h-14 w-full rounded-2xl border border-line bg-white px-4"
            placeholder="Your password"
          />
        </label>

        {platform ? <label className="block">
          <span className="text-sm font-semibold">Authenticator code</span>
          <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code}
            onChange={(event) => setCode(event.target.value)} className="mt-2 min-h-14 w-full rounded-2xl border border-line bg-white px-4" placeholder="6-digit code" />
          <span className="mt-2 block text-xs text-muted">Required when two-factor authentication is configured.</span>
        </label> : null}
        <div className="flex justify-end">
          <Link to="/admin/forgot-password" className="text-sm font-semibold text-paprika hover:underline">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="min-h-14 w-full rounded-full bg-paprika px-6 py-3 font-semibold text-white transition hover:bg-[#a53e23] disabled:cursor-wait disabled:opacity-60"
        >
          {submitting ? "Signing in..." : "Sign in to dashboard"}
        </button>
      </form>

      {!platform && import.meta.env.DEV ? <div className="mt-6 rounded-2xl border border-dashed border-line bg-shell/60 px-4 py-3 text-xs leading-5 text-muted">
        Local sample account: <strong className="text-ink">admin</strong> / <strong className="text-ink">Admin@12345</strong>
      </div> : null}
      <Link to={platform ? "/admin/login" : "/platform/login"} className="mt-5 block text-center text-sm font-semibold text-muted underline">
        {platform ? "Restaurant staff sign in" : "Platform owner sign in"}
      </Link>
    </AdminAuthShell>
  );
}
