import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  handleRouteError,
  jsonSuccess,
  parseJson,
  requireApiUser,
} from "@/lib/api/server";

const createServiceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  service_date: z.string().min(1, "Service date is required"),
  service_type: z.enum(["Saturday", "Midweek", "Special"]),
  expected_count: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("services")
      .select("*")
      .order("service_date", { ascending: false });

    if (error) {
      throw new Error(error.message);
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
    const payload = await parseJson(request, createServiceSchema);
    const { data, error } = await supabaseAdmin
      .from("services")
      .insert(payload)
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
