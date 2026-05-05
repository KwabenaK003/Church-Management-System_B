import { supabase } from "@/lib/supabase";
import { Attendance, Service, Visitor, Member } from "@/types";

export async function getMemberGrowth(): Promise<{ label: string; total: number }[]> {
  const { data, error } = await supabase
    .from("members")
    .select("join_date")
    .order("join_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const map: Record<string, number> = {};
  (data ?? []).forEach((member) => {
    const label = new Date(member.join_date).toISOString().slice(0, 7);
    map[label] = (map[label] ?? 0) + 1;
  });

  return Object.entries(map).map(([label, total]) => ({ label, total }));
}

export async function getAttendanceTrends(): Promise<{ label: string; total: number }[]> {
  const { data, error } = await supabase
    .from("attendance")
    .select("service_type");

  if (error) {
    throw new Error(error.message);
  }

  const map: Record<string, number> = {};
  (data ?? []).forEach((attendance) => {
    const label = attendance.service_type;
    map[label] = (map[label] ?? 0) + 1;
  });

  return Object.entries(map).map(([label, total]) => ({ label, total }));
}

export async function getVisitorFollowUpReport(): Promise<{ status: string; total: number }[]> {
  const { data, error } = await supabase
    .from("visitors")
    .select("follow_up_status");

  if (error) {
    throw new Error(error.message);
  }

  const map: Record<string, number> = {};
  (data ?? []).forEach((visitor) => {
    const label = visitor.follow_up_status;
    map[label] = (map[label] ?? 0) + 1;
  });

  return Object.entries(map).map(([status, total]) => ({ status, total }));
}

export async function getAbsentMembersReport(lastServices = 1): Promise<Member[]> {
  const serviceResult = await supabase
    .from("services")
    .select("id")
    .order("service_date", { ascending: false })
    .limit(lastServices);

  if (serviceResult.error) {
    throw new Error(serviceResult.error.message);
  }

  const serviceIds = serviceResult.data?.map((s) => s.id) ?? [];
  if (serviceIds.length === 0) {
    return [];
  }

  const attendanceResult = await supabase
    .from("attendance")
    .select("member_id")
    .in("service_id", serviceIds);

  if (attendanceResult.error) {
    throw new Error(attendanceResult.error.message);
  }

  const attended = new Set(attendanceResult.data?.map((a) => a.member_id));

  const membersResult = await supabase
    .from("members")
    .select("*")
    .eq("membership_status", "active");

  if (membersResult.error) {
    throw new Error(membersResult.error.message);
  }

  return (membersResult.data ?? []).filter((m) => !attended.has(m.id));
}
