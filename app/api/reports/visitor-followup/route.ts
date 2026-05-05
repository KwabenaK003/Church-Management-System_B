import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("visitors")
    .select("follow_up_status");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const map: Record<string, number> = {};
  (data ?? []).forEach((v: { follow_up_status: string }) => {
    const label = v.follow_up_status ?? "unknown";
    map[label] = (map[label] ?? 0) + 1;
  });

  return NextResponse.json(
    Object.entries(map).map(([status, total]) => ({ status, total }))
  );
}