import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Attendance Registration",
  description: "Learn how public attendance check-in is handled through service-specific links.",
};

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--page-bg)] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-white p-8 text-center shadow-[var(--shadow-md)]">
        <h1 className="text-xl font-semibold text-slate-900">Attendance Registration Moved</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Public attendance is now handled through service-specific links under the attendance module.
          Church administrators can create a service from the dashboard and share the generated public check-in URL.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-[var(--blue-600)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--blue-700)]"
          >
            Go to Admin Login
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-[var(--border-color)] px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
