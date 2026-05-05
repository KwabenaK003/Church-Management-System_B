import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clusterId   = searchParams.get("clusterId");
  const status      = searchParams.get("status");
  const page        = parseInt(searchParams.get("page")        ?? "1");
  const rowsPerPage = parseInt(searchParams.get("rowsPerPage") ?? "10");

  let query = supabaseAdmin
    .from("follow_up_tasks")
    .select(
      "*, member:members(id,first_name,last_name), cluster:clusters(id,name)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (clusterId) query = query.eq("cluster_id", clusterId);
  if (status)    query = query.eq("status", status);

  const from = (page - 1) * rowsPerPage;
  query = query.range(from, from + rowsPerPage - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [], count: count ?? 0 });
}