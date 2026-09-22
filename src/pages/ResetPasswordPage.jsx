import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AdminAuthShell from "../components/AdminAuthShell";
import { confirmPasswordReset } from "../services/api";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!token) {
      setError("This reset link is missing its token. Request a new link.");
      return;
    }
    if (password !== confirmation) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const result = await confirmPasswordReset(token, password);
      navigate("/admin/login", { replace: true, state: { message: result.message } });
    } catch (resetError) {
      setError(resetError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminAuthShell
      eyebrow="Secure reset"
      title="Choose a new password"
      description="Use at least 10 characters with uppercase, lowercase, a number and a special character."
    >
      {error ? (
        <div role="alert" className="mb-5 rounded-2xl bg-paprika/10 px-4 py-3 text-sm text-paprika">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-ink">New password</span>
          <input
            autoFocus
            required
            type="password"
            minLength={10}
            maxLength={72}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 min-h-14 w-full rounded-2xl border border-line bg-white px-4"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink">Confirm password</span>
          <input
            required
            type="password"
            minLength={10}
            maxLength={72}
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            className="mt-2 min-h-14 w-full rounded-2xl border border-line bg-white px-4"
          />
        </label>
        <button
          type="submit"
          disabled={submitting || !token}
          className="min-h-14 w-full rounded-full bg-paprika px-6 py-3 font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "Updating password..." : "Update password"}
        </button>
      </form>

      {!token ? (
        <Link to="/admin/forgot-password" className="mt-6 inline-block text-sm font-semibold text-paprika hover:underline">
          Request a new reset link
        </Link>
      ) : null}
    </AdminAuthShell>
  );
}
