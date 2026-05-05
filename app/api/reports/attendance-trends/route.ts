import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("attendance")
    .select("service_id, service:services(service_type)");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ✅ service is an array from the join, grab the first element
  type AttendanceRow = {
    service_id: string;
    service: { service_type: string }[] | null;
  };

  const map: Record<string, number> = {};
  (data as AttendanceRow[] ?? []).forEach((row) => {
    const label = row.service?.[0]?.service_type ?? "Unknown";
    map[label] = (map[label] ?? 0) + 1;
  });

  return NextResponse.json(
    Object.entries(map).map(([label, total]) => ({ label, total }))
  );
}