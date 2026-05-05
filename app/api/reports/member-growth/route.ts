import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("members")
    .select("join_date")
    .order("join_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const map: Record<string, number> = {};
  (data ?? []).forEach((m: { join_date: string }) => {
    if (!m.join_date) return;
    const label = m.join_date.slice(0, 7);
    map[label] = (map[label] ?? 0) + 1;
  });

  return NextResponse.json(
    Object.entries(map).map(([label, total]) => ({ label, total }))
  );
}