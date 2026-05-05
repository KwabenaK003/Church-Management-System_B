import { Suspense } from "react";
import type { Metadata } from "next";

import { Spinner } from "@/components/ui/Spinner";

import { LoginPageClient } from "./LoginPageClient";

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Sign in to manage attendance, members, visitors, and church operations.",
};

function LoginPageFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--page-bg)] px-4">
      <div className="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-white px-5 py-4 text-sm text-slate-600 shadow-[var(--shadow-sm)]">
        <Spinner size={20} className="text-[var(--blue-600)]" />
        Loading login
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageClient />
    </Suspense>
  );
}
