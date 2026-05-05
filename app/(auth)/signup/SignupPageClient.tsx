"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Church } from "@phosphor-icons/react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function SignupPageClient() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(undefined);
    setSuccess(undefined);

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const result = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      setError(result.error || "Unable to create your account.");
      setLoading(false);
      return;
    }

    setSuccess(
      result.message ||
        "A confirmation email has been sent. Open it, confirm your account, then sign in."
    );
    setName("");
    setEmail("");
    setPassword("");
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--blue-600)]">
            <Church size={24} color="white" weight="fill" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-slate-900">Create your account</h1>
            <p className="mt-1 text-sm text-slate-500">Register with your name, email, and password</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-color)] bg-white p-8 shadow-[var(--shadow-md)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="John Doe"
              required
              autoComplete="name"
            />

            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@church.org"
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />

            {error && (
              <div className="rounded-lg border border-red-200 bg-[var(--danger-bg)] px-4 py-3 text-sm text-[var(--danger-text)]">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            )}

            <Button type="submit" disabled={loading} className="mt-2 w-full">
              {loading ? "Creating account..." : "Sign up"}
            </Button>

            <p className="text-center text-sm text-slate-500">
              Already registered?{" "}
              <Link href="/login" className="font-medium text-[var(--blue-600)] hover:text-[var(--blue-700)]">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
