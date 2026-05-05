import type { Metadata } from "next";

import { PublicCheckInPageClient } from "./PublicCheckInPageClient";

export const metadata: Metadata = {
  title: "Service Check-In",
  description: "Confirm your location and check in to a church service.",
};

export default function PublicCheckInPage({
  params,
}: {
  params: { serviceId: string };
}) {
  return <PublicCheckInPageClient serviceId={params.serviceId} />;
}
