import type { Metadata } from "next";

import { PublicCheckInPageClient } from "../PublicCheckInPageClient";

export const metadata: Metadata = {
  title: "Check In",
  description: "Confirm your attendance for today's church service.",
};

export default async function ServiceCheckInPage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = await params;

  return <PublicCheckInPageClient serviceId={serviceId} />;
}
