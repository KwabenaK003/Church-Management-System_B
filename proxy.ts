import { NextRequest, NextResponse } from "next/server";

import { createSupabaseMiddleware } from "@/lib/supabase-middleware";
import { supabaseAdmin } from "@/lib/supabase-admin";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/register",
  "/attendance",
  "/check-in",
  "/auth",
  "/api/auth",
  "/api/public",
];

function isApiRoute(pathname: string) {
  return pathname === "/api" || pathname.startsWith("/api/");
}

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
    if (isApiRoute(pathname)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!user) {
    return response();
  }

  const shouldCheckDashboardAccess = pathname === "/login" || !isPublic(pathname);

  if (shouldCheckDashboardAccess) {
    const { data: appUser } = await supabaseAdmin
      .from("app_users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!appUser) {
      if (pathname === "/login") {
        return response();
      }

      if (isApiRoute(pathname)) {
        return NextResponse.json(
          {
            error:
              "Access denied. Only dashboard users created by an administrator can continue.",
          },
          { status: 403 },
        );
      }

      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("error", "access_denied");
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
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
