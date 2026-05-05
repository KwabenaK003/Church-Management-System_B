import { redirect } from "next/navigation";

export default async function LegacyServiceCheckInPage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = await params;

  redirect(`/attendance/${serviceId}/check-in`);
}
