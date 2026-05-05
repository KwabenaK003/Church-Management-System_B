import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_: NextRequest, ctx: Context) {
  const { id } = await ctx.params;
  const { error } = await supabaseAdmin
    .from("expense_categories").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Category deleted" });
}