import { NextRequest, NextResponse } from "next/server";
// import { supabaseAdmin } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search      = searchParams.get("search");
  const status      = searchParams.get("status");
  const cluster_id  = searchParams.get("cluster_id");
  const gender      = searchParams.get("gender");
  const page        = parseInt(searchParams.get("page")        ?? "1");
  const rowsPerPage = parseInt(searchParams.get("rowsPerPage") ?? "10");

  let query = supabaseAdmin
    .from("members")
    .select("*, cluster:clusters(id,name)", { count: "exact" })
    .order("last_name");

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
    );
  }
  if (status)     query = query.eq("membership_status", status);
  if (cluster_id) query = query.eq("cluster_id", cluster_id);
  if (gender)     query = query.eq("gender", gender);

  const from = (page - 1) * rowsPerPage;
  query = query.range(from, from + rowsPerPage - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [], count: count ?? 0 });
}