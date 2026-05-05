import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  handleRouteError,
  jsonSuccess,
  parseJson,
  requireApiUser,
} from "@/lib/api/server";

const updateExpenseSchema = z.object({
  category_id: z.string().uuid().optional().or(z.literal("")),
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  payment_method: z
    .enum(["cash", "mobile_money", "bank_transfer", "cheque", "online"])
    .optional(),
  expense_date: z.string().optional(),
  notes: z.string().optional(),
  approval_status: z.enum(["pending", "approved", "rejected"]).optional(),
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
    const payload = await parseJson(request, updateExpenseSchema);
    const updates = {
      ...payload,
      category_id: payload.category_id || undefined,
      ...(payload.approval_status && payload.approval_status !== "pending"
        ? { approved_at: new Date().toISOString() }
        : {}),
    };

    const { data, error } = await supabaseAdmin
      .from("expenses")
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
