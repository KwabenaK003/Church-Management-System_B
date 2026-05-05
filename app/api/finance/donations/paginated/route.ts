import { NextRequest, NextResponse } from "next/server";
// import { supabaseAdmin } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year        = searchParams.get("year");
  const month       = searchParams.get("month");
  const page        = parseInt(searchParams.get("page")        ?? "1");
  const rowsPerPage = parseInt(searchParams.get("rowsPerPage") ?? "10");

  let query = supabaseAdmin
    .from("donations")
    .select(
      "*, category:donation_categories(id,name), member:members(id,first_name,last_name)",
      { count: "exact" }
    )
    .order("donation_date", { ascending: false });

  if (year && month) {
    const y   = parseInt(year);
    const m   = parseInt(month);
    const pad = String(m).padStart(2, "0");
    const lastDay = new Date(y, m, 0).getDate();
    query = query
      .gte("donation_date", `${y}-${pad}-01`)
      .lte("donation_date", `${y}-${pad}-${lastDay}`);
  } else if (year) {
    query = query
      .gte("donation_date", `${year}-01-01`)
      .lte("donation_date", `${year}-12-31`);
  }

  const from = (page - 1) * rowsPerPage;
  query = query.range(from, from + rowsPerPage - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [], count: count ?? 0 });
}