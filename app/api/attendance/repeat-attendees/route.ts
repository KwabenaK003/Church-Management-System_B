import { handleRouteError, jsonSuccess, requireApiUser } from "@/lib/api/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type AttendanceRow = {
  member_id: string;
  checked_in_at: string;
  member: {
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    member_number: string | null;
  } | null;
  service: {
    name: string;
    service_date: string;
  } | null;
};

export type RepeatAttendee = {
  member_id: string;
  member_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  check_in_count: number;
  first_check_in: string;
  latest_check_in: string;
  services_attended: string;
};

const attendanceSelect =
  "member_id, checked_in_at, member:members(first_name, last_name, email, phone, member_number), service:services(name, service_date)";

export async function GET() {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const rows: AttendanceRow[] = [];
    const pageSize = 1_000;

    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabaseAdmin
        .from("attendance")
        .select(attendanceSelect)
        .order("checked_in_at", { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) {
        throw new Error(error.message);
      }

      const page = (data ?? []) as unknown as AttendanceRow[];
      rows.push(...page);
      if (page.length < pageSize) {
        break;
      }
    }

    const grouped = new Map<string, AttendanceRow[]>();
    for (const row of rows) {
      grouped.set(row.member_id, [...(grouped.get(row.member_id) ?? []), row]);
    }

    const repeatAttendees: RepeatAttendee[] = [];
    for (const [memberId, checkIns] of grouped) {
      if (checkIns.length < 2) {
        continue;
      }

      const member = checkIns[0].member;
      const services = checkIns
        .map((checkIn) => checkIn.service)
        .filter((service): service is NonNullable<typeof service> => Boolean(service))
        .map((service) => `${service.name} (${service.service_date.slice(0, 10)})`)
        .join("; ");

      repeatAttendees.push({
        member_id: memberId,
        member_number: member?.member_number ?? "",
        first_name: member?.first_name ?? "",
        last_name: member?.last_name ?? "",
        email: member?.email ?? "",
        phone: member?.phone ?? "",
        check_in_count: checkIns.length,
        first_check_in: checkIns[0].checked_in_at,
        latest_check_in: checkIns[checkIns.length - 1].checked_in_at,
        services_attended: services,
      });
    }

    return jsonSuccess(
      repeatAttendees.sort((a, b) => b.check_in_count - a.check_in_count),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
