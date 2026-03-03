"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Mail, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!supabase) {
      setError("Supabase is not configured. Add your project keys to .env.local");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <a
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Back to Home
        </a>

        {/* Logo */}
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white font-bold text-xl">
            M
          </div>
          <span className="text-2xl font-bold text-foreground">
            My<span className="text-primary">Society</span>
          </span>
        </div>

        {sent ? (
          /* Success State */
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
              <CheckCircle size={28} className="text-success" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-foreground">
              Check Your Email
            </h2>
            <p className="mb-6 text-sm text-muted">
              We sent a login link to{" "}
              <span className="font-medium text-foreground">{email}</span>.
              Click the link in the email to sign in.
            </p>
            <button
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
              className="text-sm text-primary hover:underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          /* Login Form */
          <div className="rounded-xl border border-border bg-surface p-8">
            <h2 className="mb-2 text-xl font-bold text-foreground">
              Join Your Society
            </h2>
            <p className="mb-6 text-sm text-muted">
              Enter your email to get a magic login link. No password needed.
            </p>

            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {error && (
                <p className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Magic Link"
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-muted">
              By signing in, you agree to our Terms of Service and Privacy
              Policy.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
