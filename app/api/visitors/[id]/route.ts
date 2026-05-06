import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  handleRouteError,
  jsonError,
  jsonSuccess,
  parseJson,
  requireApiUser,
} from "@/lib/api/server";

const updateVisitorSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  how_heard: z.string().optional(),
  invited_by: z.string().optional(),
  notes: z.string().optional(),
  visit_date: z.string().optional(),
  follow_up_status: z.enum(["pending", "contacted", "joined"]).optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const { data, error } = await supabaseAdmin
      .from("visitors")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return jsonError("Visitor not found", 404);
    }

    return jsonSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const payload = await parseJson(request, updateVisitorSchema);
    const updates = {
      ...payload,
      email: payload.email || undefined,
    };

    const { data, error } = await supabaseAdmin
      .from("visitors")
      .update(updates)
      .eq("id", id)
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

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const { error } = await supabaseAdmin.from("visitors").delete().eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return jsonSuccess({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
