import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("sms_campaigns")
    .select("*, cluster:clusters(id,name)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name || !body.message || !body.target) {
    return NextResponse.json(
      { error: "name, message and target are required" },
      { status: 400 }
    );
  }
  const { data, error } = await supabaseAdmin
    .from("sms_campaigns")
    .insert({ ...body, status: body.status ?? "draft" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}