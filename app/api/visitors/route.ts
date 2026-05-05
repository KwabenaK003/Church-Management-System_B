import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  handleRouteError,
  jsonSuccess,
  parseJson,
  parseNumberParam,
  requireApiUser,
} from "@/lib/api/server";

const visitorSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  how_heard: z.string().optional(),
  invited_by: z.string().optional(),
  notes: z.string().optional(),
  visit_date: z.string().optional(),
  follow_up_status: z.enum(["pending", "contacted", "joined"]).optional(),
});

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const howHeard = searchParams.get("howHeard");
    const page = searchParams.get("page");
    const rowsPerPage = searchParams.get("rowsPerPage");

    let query = supabaseAdmin
      .from("visitors")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`,
      );
    }
    if (status) {
      query = query.eq("follow_up_status", status);
    }
    if (howHeard) {
      query = query.eq("how_heard", howHeard);
    }

    if (page && rowsPerPage) {
      const pageNumber = parseNumberParam(page, 1);
      const size = parseNumberParam(rowsPerPage, 10);
      const from = (pageNumber - 1) * size;
      query = query.range(from, from + size - 1);
    }

    const { data, error, count } = await query;
    if (error) {
      throw new Error(error.message);
    }

    if (page && rowsPerPage) {
      return jsonSuccess({ data: data ?? [], count: count ?? 0 });
    }

    return jsonSuccess(data ?? []);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const payload = await parseJson(request, visitorSchema);
    const row = {
      ...payload,
      email: payload.email || undefined,
      follow_up_status: payload.follow_up_status ?? "pending",
      visit_date: payload.visit_date || new Date().toISOString().split("T")[0],
    };

    const { data, error } = await supabaseAdmin
      .from("visitors")
      .insert(row)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return jsonSuccess(data, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
