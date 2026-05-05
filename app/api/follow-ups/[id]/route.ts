import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Context = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Context) {
  const { id } = await ctx.params;
  const body   = await req.json();
  const { data, error } = await supabaseAdmin
    .from("follow_up_tasks").update(body).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_: NextRequest, ctx: Context) {
  const { id } = await ctx.params;
  const { error } = await supabaseAdmin
    .from("follow_up_tasks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Task deleted" });
}