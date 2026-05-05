import { Suspense } from "react";
import type { Metadata } from "next";

import { Spinner } from "@/components/ui/Spinner";

import { CheckInPageClient } from "./CheckInPageClient";

export const metadata: Metadata = {
  title: "Event Check-In",
  description: "Check in to a church service using your personalised attendance link.",
};

function CheckInPageFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--page-bg)] px-4 py-12">
      <Spinner size={28} className="text-[var(--blue-600)]" />
    </main>
  );
}

export default function CheckInPage() {
  return (
    <Suspense fallback={<CheckInPageFallback />}>
      <CheckInPageClient />
    </Suspense>
  );
}
