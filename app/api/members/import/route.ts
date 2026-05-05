import { NextRequest, NextResponse } from "next/server";
// import { supabaseAdmin } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const { rows } = await req.json();

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "rows array is required" }, { status: 400 });
  }

  const details = [];

  for (const row of rows) {
    const { error } = await supabaseAdmin.from("members").insert({
      ...row,
      membership_status: row.membership_status ?? "active",
      join_date: row.join_date ?? new Date().toISOString().split("T")[0],
    });

    details.push({
      email:   row.email,
      success: !error,
      message: error?.message,
    });
  }

  return NextResponse.json({
    success: details.every((d) => d.success),
    details,
  });
}
