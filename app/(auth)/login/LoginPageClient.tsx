"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Church } from "@phosphor-icons/react";

import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const nextPath = searchParams.get("from") || "/dashboard";
  const isConfirmed = searchParams.get("confirmed") === "1";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(undefined);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.replace(nextPath);
  }

  return (
    <main className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--blue-600)] flex items-center justify-center">
            <Church size={24} color="white" weight="fill" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-slate-900">Church Management</h1>
            <p className="text-sm text-slate-500 mt-1">Sign in to your admin account</p>
          </div>
        </div>

        <div className="bg-white border border-[var(--border-color)] rounded-2xl p-8 shadow-[var(--shadow-md)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@church.org"
                required
                autoComplete="email"
              />
            </div>

            <div className="relative">
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-[var(--danger-bg)] border border-red-200 px-4 py-3 text-sm text-[var(--danger-text)]">
                {error}
                {error.toLowerCase().includes("email not confirmed") && (
                  <p className="mt-2 text-xs text-red-700">
                    Confirm your email first using the message that was sent to your inbox.
                  </p>
                )}
              </div>
            )}

            {isConfirmed && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Your email has been confirmed. Sign in to continue to the dashboard.
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full mt-2">
              {loading ? "Signing in..." : "Sign in"}
            </Button>

            <p className="text-center text-sm text-slate-500">
              Need an account?{" "}
              <Link href="/signup" className="font-medium text-[var(--blue-600)] hover:text-[var(--blue-700)]">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
