import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  handleRouteError,
  jsonSuccess,
  parseJson,
  requireApiUser,
} from "@/lib/api/server";

const churchProfileSchema = z.object({
  church_name: z.string().min(1, "Church name is required"),
  address: z.string().optional(),
  logo_url: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  radius_metres: z.number().int().nonnegative().optional(),
});

export async function GET() {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("church_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return jsonSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const payload = await parseJson(request, churchProfileSchema);
    const { data, error } = await supabaseAdmin
      .from("church_settings")
      .update(payload)
      .eq("id", 1)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return jsonSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
