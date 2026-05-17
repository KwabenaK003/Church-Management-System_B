import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  handleRouteError,
  jsonSuccess,
  parseJson,
  requireApiUser,
} from "@/lib/api/server";

const updatePledgeSchema = z.object({
  member_id: z.string().uuid().optional(),
  pledged_amount: z.number().positive().optional(),
  paid_amount: z.number().min(0).optional(),
  status: z.enum(["pending", "partial", "fulfilled", "cancelled"]).optional(),
  due_date: z.string().optional(),
  notes: z.string().optional(),
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
    const payload = await parseJson(request, updatePledgeSchema);
    const updates = {
      ...payload,
      due_date: payload.due_date || undefined,
      notes: payload.notes?.trim() || undefined,
    };

    const { data, error } = await supabaseAdmin
      .from("pledges")
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
      .from("pledges")
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
