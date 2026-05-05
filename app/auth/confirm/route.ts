import { type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServer } from "@/lib/supabase-server";

function buildRedirectUrl(request: NextRequest, path: string) {
  return new URL(path, request.url);
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const next = request.nextUrl.searchParams.get("next") || "/login?confirmed=1";
  const safeNext = next.startsWith("/") ? next : "/login?confirmed=1";

  if (tokenHash && type) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      await supabase.auth.signOut();
      return NextResponse.redirect(buildRedirectUrl(request, safeNext));
    }
  }

  return NextResponse.redirect(buildRedirectUrl(request, "/login"));
}
