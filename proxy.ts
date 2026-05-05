import { NextRequest, NextResponse } from "next/server";

import { createSupabaseMiddleware } from "@/lib/supabase-middleware";

const PUBLIC_PATHS = ["/login", "/signup", "/register", "/attendance", "/auth", "/api/auth"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

function redirectTo(request: NextRequest, pathname: string) {
  const nextUrl = request.nextUrl.clone();
  nextUrl.pathname = pathname;
  return NextResponse.redirect(nextUrl);
}

export async function proxy(request: NextRequest) {
  const { supabase, response } = createSupabaseMiddleware(request);
  const { pathname } = request.nextUrl;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublic(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!user) {
    return response();
  }

  if (pathname === "/login") {
    return redirectTo(request, "/dashboard");
  }

  return response();
}

export const config = {
  matcher: [
    "/((?!_next|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
