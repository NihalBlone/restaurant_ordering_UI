import { useState } from "react";
import { Link } from "react-router-dom";
import AdminAuthShell from "../components/AdminAuthShell";
import { requestPasswordReset } from "../services/api";

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("");
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      setResult(await requestPasswordReset(username.trim()));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminAuthShell
      eyebrow="Account recovery"
      title="Reset password"
      description="Enter your username. Production deployments can deliver the one-time link through email; local development exposes it here."
    >
      {error ? (
        <div role="alert" className="mb-5 rounded-2xl bg-paprika/10 px-4 py-3 text-sm text-paprika">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="space-y-5">
          <div className="rounded-2xl bg-emerald-100 px-4 py-4 text-sm leading-6 text-emerald-900">
            {result.message}
          </div>
          {result.developmentResetToken ? (
            <Link
              to={`/admin/reset-password?token=${encodeURIComponent(result.developmentResetToken)}`}
              className="flex min-h-14 items-center justify-center rounded-full bg-ink px-6 py-3 font-semibold text-white"
            >
              Continue with local reset link
            </Link>
          ) : null}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
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
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="min-h-14 w-full rounded-full bg-paprika px-6 py-3 font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Creating reset link..." : "Request reset link"}
          </button>
        </form>
      )}

      <Link to="/admin/login" className="mt-6 inline-block text-sm font-semibold text-paprika hover:underline">
        Back to sign in
      </Link>
    </AdminAuthShell>
  );
}
