import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Context = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Context) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const email = typeof body.email === "string" ? body.email.trim() : undefined;
  const full_name =
    typeof body.full_name === "string" ? body.full_name.trim() : undefined;
  const password =
    typeof body.password === "string" && body.password.length > 0
      ? body.password
      : undefined;

  const authPayload: {
    email?: string;
    password?: string;
    user_metadata?: { full_name?: string };
  } = {};

  if (email) {
    authPayload.email = email;
  }
  if (password) {
    authPayload.password = password;
  }
  if (full_name) {
    authPayload.user_metadata = { full_name };
  }

  if (Object.keys(authPayload).length > 0) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      id,
      authPayload,
    );

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }
  }

  const updatePayload = {
    ...(email ? { email } : {}),
    ...(full_name ? { full_name } : {}),
  };

  const { data, error } = await supabaseAdmin
    .from("app_users")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_: NextRequest, ctx: Context) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await ctx.params;

  // Delete from auth
  await supabaseAdmin.auth.admin.deleteUser(id);

  // Delete from app_users
  const { error } = await supabaseAdmin.from("app_users").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "User deleted" });
}
