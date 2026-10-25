import { redirect } from "next/navigation";

export default async function LegacyCheckInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const urlSearchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        urlSearchParams.append(key, item);
      }
    } else {
      urlSearchParams.set(key, value);
    }
  }

  const query = urlSearchParams.toString();
  redirect(`/attendance/check-in${query ? `?${query}` : ""}`);
}
