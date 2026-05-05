import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lastServices = parseInt(searchParams.get("lastServices") ?? "1");

  const { data: services, error: svcError } = await supabaseAdmin
    .from("services")
    .select("id")
    .order("service_date", { ascending: false })
    .limit(lastServices);

  if (svcError) return NextResponse.json({ error: svcError.message }, { status: 500 });

  const serviceIds = (services ?? []).map((s: { id: string }) => s.id);
  if (serviceIds.length === 0) return NextResponse.json([]);

  const { data: attendances, error: attError } = await supabaseAdmin
    .from("attendance")
    .select("member_id")
    .in("service_id", serviceIds);

  if (attError) return NextResponse.json({ error: attError.message }, { status: 500 });

  const attended = new Set((attendances ?? []).map((a: { member_id: string }) => a.member_id));

  const { data: members, error: memError } = await supabaseAdmin
    .from("members")
    .select("*")
    .eq("membership_status", "active");

  if (memError) return NextResponse.json({ error: memError.message }, { status: 500 });

  return NextResponse.json(
    (members ?? []).filter((m: { id: string }) => !attended.has(m.id))
  );
}