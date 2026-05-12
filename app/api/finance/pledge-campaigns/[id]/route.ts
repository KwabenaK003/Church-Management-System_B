import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  handleRouteError,
  jsonSuccess,
  parseJson,
  requireApiUser,
} from "@/lib/api/server";

const updateCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required").optional(),
  description: z.string().optional(),
  target_amount: z.number().positive().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

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
    const payload = await parseJson(request, updateCampaignSchema);
    const updates = {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.description !== undefined
        ? { description: payload.description.trim() || undefined }
        : {}),
      ...(payload.target_amount !== undefined
        ? { target_amount: payload.target_amount }
        : {}),
      ...(payload.start_date !== undefined
        ? { start_date: payload.start_date || undefined }
        : {}),
      ...(payload.end_date !== undefined
        ? { end_date: payload.end_date || undefined }
        : {}),
    };
    const { data, error } = await supabaseAdmin
      .from("pledge_campaigns")
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
    const { error } = await supabaseAdmin
      .from("pledge_campaigns")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return jsonSuccess({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
