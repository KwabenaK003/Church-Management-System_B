import { NextRequest, NextResponse } from "next/server";
// import { supabaseAdmin } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const serviceId   = searchParams.get("serviceId");
  const page        = parseInt(searchParams.get("page")        ?? "1");
  const rowsPerPage = parseInt(searchParams.get("rowsPerPage") ?? "10");

  let query = supabaseAdmin
    .from("attendance")
    .select(
      "*, member:members(id,first_name,last_name), service:services(id,name,service_date)",
      { count: "exact" }
    )
    .order("checked_in_at", { ascending: false });

  if (serviceId) query = query.eq("service_id", serviceId);

  const from = (page - 1) * rowsPerPage;
  query = query.range(from, from + rowsPerPage - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [], count: count ?? 0 });
}