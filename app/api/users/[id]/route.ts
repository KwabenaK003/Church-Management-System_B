import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Context = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Context) {
  const { id } = await ctx.params;
  const body   = await req.json();
  const { data, error } = await supabaseAdmin
    .from("app_users").update(body).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_: NextRequest, ctx: Context) {
  const { id } = await ctx.params;

  // Delete from auth
  await supabaseAdmin.auth.admin.deleteUser(id);

  // Delete from app_users
  const { error } = await supabaseAdmin.from("app_users").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "User deleted" });
}