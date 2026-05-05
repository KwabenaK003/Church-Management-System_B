import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  handleRouteError,
  jsonSuccess,
  parseJson,
  parseNumberParam,
  requireApiUser,
} from "@/lib/api/server";

const memberSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  gender: z.string().optional(),
  date_of_birth: z.string().optional(),
  address: z.string().optional(),
  occupation: z.string().optional(),
  marital_status: z.enum(["single", "married", "widowed", "divorced"]).optional(),
  baptism_date: z.string().optional(),
  membership_status: z
    .enum(["active", "inactive", "transferred", "deceased"])
    .optional(),
  cluster_id: z.string().uuid().optional().or(z.literal("")),
  join_date: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  notes: z.string().optional(),
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
    const clusterId = searchParams.get("clusterId");
    const gender = searchParams.get("gender");
    const page = searchParams.get("page");
    const rowsPerPage = searchParams.get("rowsPerPage");

    let query = supabaseAdmin
      .from("members")
      .select("*, cluster:clusters(id,name)", { count: "exact" })
      .order("last_name");

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`,
      );
    }
    if (status) {
      query = query.eq("membership_status", status);
    }
    if (clusterId) {
      query = query.eq("cluster_id", clusterId);
    }
    if (gender) {
      query = query.eq("gender", gender);
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
    const payload = await parseJson(request, memberSchema);
    const row = {
      ...payload,
      email: payload.email || undefined,
      cluster_id: payload.cluster_id || undefined,
      membership_status: payload.membership_status ?? "active",
      join_date: payload.join_date || new Date().toISOString().split("T")[0],
    };

    const { data, error } = await supabaseAdmin
      .from("members")
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
