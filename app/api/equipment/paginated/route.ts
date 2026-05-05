import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search      = searchParams.get("search");
  const condition   = searchParams.get("condition");
  const category    = searchParams.get("category");
  const page        = parseInt(searchParams.get("page")        ?? "1");
  const rowsPerPage = parseInt(searchParams.get("rowsPerPage") ?? "10");

  let query = supabaseAdmin
    .from("equipment")
    .select("*", { count: "exact" })
    .order("name");

  if (search)    query = query.ilike("name", `%${search}%`);
  if (condition) query = query.eq("condition", condition);
  if (category)  query = query.eq("category", category);

  const from = (page - 1) * rowsPerPage;
  query = query.range(from, from + rowsPerPage - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [], count: count ?? 0 });
}