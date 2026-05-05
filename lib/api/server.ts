import { NextResponse } from "next/server";
import { User } from "@supabase/supabase-js";
import { ZodError, ZodType } from "zod";

import { createSupabaseServer } from "@/lib/supabase-server";

export function jsonError(
  error: string,
  status = 400,
  details?: unknown,
) {
  return NextResponse.json(
    {
      error,
      ...(details !== undefined ? { details } : {}),
    },
    { status },
  );
}

export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export async function requireApiUser(): Promise<
  { user: User } | { response: NextResponse }
> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { response: jsonError("Unauthorized", 401) };
  }

  return { user };
}

export async function parseJson<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<T> {
  const body = await request.json();
  return schema.parse(body);
}

export function parseNumberParam(
  value: string | null,
  fallback: number,
): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError("Invalid request", 400, error.flatten());
  }

  if (error instanceof Error) {
    return jsonError(error.message, 500);
  }

  return jsonError("Internal server error", 500);
}
