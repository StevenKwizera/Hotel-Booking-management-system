import { useState, type FormEvent } from "react";

import { Link, useNavigate } from "react-router-dom";

import { AuthLayout } from "@/components/auth/AuthLayout";

import { Button } from "@/components/ui/Button";

import { Card } from "@/components/ui/Card";

import { useAuth } from "@/context/AuthContext";

import { HOTEL_IMAGES } from "@/lib/hotel-images";

import { ApiStatusBanner } from "@/components/ui/ApiStatusBanner";

import { api } from "@/lib/api";



export function LoginPage() {

  const navigate = useNavigate();

  const { login, apiConnected } = useAuth();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const [info, setInfo] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [forgotSent, setForgotSent] = useState(false);



  const handleSubmit = async (e: FormEvent) => {

    e.preventDefault();

    setError("");

    setInfo("");

    setSubmitting(true);

    const result = await login(email, password);

    setSubmitting(false);

    if (result.ok) {

      navigate("/dashboard", { replace: true });

    } else {

      setError(result.error ?? "Login failed");

    }

  };



  const handleForgotPassword = async () => {

    if (!email.trim()) {

      setError("Enter your email first");

      return;

    }

    setSubmitting(true);

    setError("");

    setInfo("");

    try {

      const res = await api.forgotPassword(email.trim());

      setForgotSent(true);

      setInfo(res.message);

    } catch (e) {

      setError(e instanceof Error ? e.message : "Could not send reset link");

    } finally {

      setSubmitting(false);

    }

  };



  return (

    <AuthLayout

      title="Staff & guest sign in"

      subtitle="Sign in to manage your stay or hotel operations"

      image={HOTEL_IMAGES.hero}

      imageAlt="Net Luna Villa resort"

    >

      {!apiConnected && <ApiStatusBanner />}



      <Card className="border-[var(--border-subtle)] p-6 sm:p-8">

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>

            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">

              Email

            </label>

            <input

              id="email"

              type="email"

              autoComplete="email"

              required

              value={email}

              onChange={(e) => setEmail(e.target.value)}

              className="w-full rounded-lg border border-[var(--border-default)] bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"

              placeholder="you@hotel.com"

            />

          </div>

          <div>

            <label htmlFor="password" className="mb-1.5 block text-sm font-medium">

              Password

            </label>

            <input

              id="password"

              type="password"

              autoComplete="current-password"

              required

              value={password}

              onChange={(e) => setPassword(e.target.value)}

              className="w-full rounded-lg border border-[var(--border-default)] bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/30"

            />

          </div>

          {error && (

            <p className="rounded-lg bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">

              {error}

            </p>

          )}

          {info && (

            <p className="rounded-lg bg-[var(--accent)]/10 px-3 py-2 text-sm text-[var(--accent)]">

              {info}

            </p>

          )}

          <Button type="submit" className="w-full" size="lg" loading={submitting}>

            Sign in

          </Button>

          <Button

            type="button"

            variant="ghost"

            className="w-full"

            onClick={handleForgotPassword}

            loading={submitting}

            disabled={forgotSent}

          >

            {forgotSent ? "Reset link sent" : "Forgot password?"}

          </Button>

        </form>



        <p className="mt-6 border-t border-[var(--border-subtle)] pt-6 text-center text-sm text-[var(--text-muted)]">

          Booking a stay?{" "}

          <Link to="/register" className="font-medium text-[var(--accent)] hover:underline">

            Create a guest account

          </Link>

        </p>

      </Card>

    </AuthLayout>

  );

}

