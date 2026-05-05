import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page        = parseInt(searchParams.get("page")        ?? "1");
  const rowsPerPage = parseInt(searchParams.get("rowsPerPage") ?? "10");

  const from = (page - 1) * rowsPerPage;

  const { data, error, count } = await supabaseAdmin
    .from("sms_campaigns")
    .select("*, cluster:clusters(id,name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + rowsPerPage - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [], count: count ?? 0 });
}