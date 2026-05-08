import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const { data, error } = await supabaseAdmin
    .from("app_users")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  const body = await req.json();
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const full_name = typeof body.full_name === "string" ? body.full_name.trim() : "";

  if (!full_name || !email || !password) {
    return NextResponse.json(
      { error: "name, email, and password are required" },
      { status: 400 }
    );
  }

  // Create auth user
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
      },
    });

  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });
  if (!authData.user) {
    return NextResponse.json({ error: "User account could not be created." }, { status: 500 });
  }

  const { data, error } = await supabaseAdmin
    .from("app_users")
    .upsert(
      { id: authData.user.id, email, full_name },
      { onConflict: "id" },
    )
    .select()
    .single();

  if (error) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
