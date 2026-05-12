import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  handleRouteError,
  jsonSuccess,
  parseJson,
  requireApiUser,
} from "@/lib/api/server";

const updateDonationSchema = z.object({
  member_id: z.string().uuid().optional().or(z.literal("")),
  donor_name: z.string().optional(),
  category_id: z.string().uuid().optional().or(z.literal("")),
  amount: z.number().positive().optional(),
  payment_method: z
    .enum(["cash", "mobile_money", "bank_transfer", "cheque", "online"])
    .optional(),
  donation_date: z.string().optional(),
  notes: z.string().optional(),
  reference_number: z.string().optional(),
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
    const payload = await parseJson(request, updateDonationSchema);
    const updates = {
      ...payload,
      member_id: payload.member_id || undefined,
      donor_name: payload.donor_name?.trim() || undefined,
      category_id: payload.category_id || undefined,
      notes: payload.notes?.trim() || undefined,
      reference_number: payload.reference_number?.trim() || undefined,
      donation_date: payload.donation_date || undefined,
    };

    const { data, error } = await supabaseAdmin
      .from("donations")
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
      .from("donations")
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
