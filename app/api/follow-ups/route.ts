import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clusterId = searchParams.get("clusterId");
  const status    = searchParams.get("status");

  let query = supabaseAdmin
    .from("follow_up_tasks")
    .select("*, member:members(id,first_name,last_name), cluster:clusters(id,name)")
    .order("created_at", { ascending: false });

  if (clusterId) query = query.eq("cluster_id", clusterId);
  if (status)    query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.member_id || !body.assigned_to || !body.reason) {
    return NextResponse.json(
      { error: "member_id, assigned_to and reason are required" },
      { status: 400 }
    );
  }
  const { data, error } = await supabaseAdmin
    .from("follow_up_tasks")
    .insert({ ...body, status: body.status ?? "pending" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}