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
    .from("expenses")
    .select("*, category:expense_categories(id,name)", { count: "exact" })
    .order("expense_date", { ascending: false });

  if (year && month) {
    const y   = parseInt(year);
    const m   = parseInt(month);
    const pad = String(m).padStart(2, "0");
    const lastDay = new Date(y, m, 0).getDate();
    query = query
      .gte("expense_date", `${y}-${pad}-01`)
      .lte("expense_date", `${y}-${pad}-${lastDay}`);
  } else if (year) {
    query = query
      .gte("expense_date", `${year}-01-01`)
      .lte("expense_date", `${year}-12-31`);
  }

  const from = (page - 1) * rowsPerPage;
  query = query.range(from, from + rowsPerPage - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [], count: count ?? 0 });
}