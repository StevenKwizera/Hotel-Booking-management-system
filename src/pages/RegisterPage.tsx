import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { ApiStatusBanner } from "@/components/ui/ApiStatusBanner";
import { HOTEL_IMAGES } from "@/lib/hotel-images";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, apiConnected } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    const result = await register({ name, email, password });
    setSubmitting(false);
    if (result.ok) {
      navigate("/dashboard", { replace: true });
    } else {
      setError(result.error ?? "Registration failed");
    }
  };

  return (
    <AuthLayout
      title="Guest registration"
      subtitle="Create an account to book rooms, pay online, and request hotel services"
      image={HOTEL_IMAGES.bookingDesk}
      imageAlt="Hotel reception and booking desk"
    >
      {!apiConnected && <ApiStatusBanner />}
      <Card className="border-[var(--border-subtle)] p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
              Full name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-default)] bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="reg-email" className="mb-1.5 block text-sm font-medium">
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-default)] bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
              placeholder="you@email.com"
            />
          </div>
          <div>
            <label htmlFor="reg-password" className="mb-1.5 block text-sm font-medium">
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-default)] bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium">
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-default)] bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" size="lg" loading={submitting}>
            Create guest account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          Already registered?{" "}
          <Link to="/login" className="font-medium text-[var(--accent)] hover:underline">
            Sign in
          </Link>
        </p>
        <p className="mt-4 text-center">
          <Link to="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)]">
            ← Back to home
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}
