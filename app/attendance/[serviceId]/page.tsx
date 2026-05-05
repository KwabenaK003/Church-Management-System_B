import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Service Check-In",
  description: "Open the public check-in page for today's church service.",
};

function ChurchMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      className="h-8 w-8 fill-white"
    >
      <path d="M29 8h6v7h7v6h-7v9h11v26H18V30h11v-9h-7v-6h7V8Zm-5 28v14h6V36h-6Zm10 0v14h6V36h-6Z" />
    </svg>
  );
}

export default async function PublicCheckInPage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = await params;

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md items-center justify-center">
        <div className="w-full rounded-3xl border border-[var(--border-color)] bg-white p-8 text-center shadow-[var(--shadow-md)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--blue-600)]">
            <ChurchMark />
          </div>

          <div className="mt-6 space-y-3">
            <h1 className="text-3xl font-semibold text-slate-900">
              Bubiashie
              <span className="block">SDA Church</span>
            </h1>
            <p className="text-sm leading-6 text-slate-600">
              Welcome back! Please check in to continue your worship experience.
            </p>
          </div>

          <Link
            href={`/attendance/${serviceId}/check-in`}
            className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-[var(--blue-600)] px-4 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--blue-700)]"
          >
            Check In
          </Link>
        </div>
      </div>
    </main>
  );
}
