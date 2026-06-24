import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ApiStatusBanner } from "@/components/ui/ApiStatusBanner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { HOTEL_IMAGES } from "@/lib/hotel-images";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { apiConnected } = useAuth();

  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [emailHint, setEmailHint] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidating(false);
      setTokenValid(false);
      return;
    }
    (async () => {
      try {
        const res = await api.validateResetToken(token);
        setTokenValid(res.valid);
        setEmailHint(res.emailHint);
      } catch {
        setTokenValid(false);
      } finally {
        setValidating(false);
      }
    })();
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.resetPasswordWithToken(token, newPassword, confirmPassword);
      setSuccess(res.message);
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reset password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle={
        success
          ? "Your password has been updated"
          : tokenValid
            ? `Choose a new password${emailHint ? ` for ${emailHint}` : ""}`
            : "Secure password recovery"
      }
      image={HOTEL_IMAGES.hero}
      imageAlt="Net Luna Villa resort"
    >
      {!apiConnected && <ApiStatusBanner />}

      <Card className="border-[var(--border-subtle)] p-6 sm:p-8">
        {validating ? (
          <p className="text-center text-sm text-[var(--text-muted)]">Checking reset link…</p>
        ) : !token || !tokenValid ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-[var(--danger)]">
              This reset link is invalid or has expired. Request a new one from the sign-in page.
            </p>
            <Button className="w-full" size="lg" onClick={() => navigate("/login")}>
              Back to login
            </Button>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <p className="rounded-lg bg-[var(--accent)]/10 px-3 py-2 text-sm text-[var(--accent)]">
              {success}
            </p>
            <Button className="w-full" size="lg" onClick={() => navigate("/login")}>
              Back to login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-default)] bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium">
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-default)] bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                placeholder="Repeat your password"
              />
            </div>
            {error && (
              <p className="rounded-lg bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" size="lg" loading={submitting}>
              Update password
            </Button>
            <Link
              to="/login"
              className="flex w-full items-center justify-center rounded-lg px-5 py-2.5 text-base font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)]"
            >
              Back to login
            </Link>
          </form>
        )}
      </Card>
    </AuthLayout>
  );
}
