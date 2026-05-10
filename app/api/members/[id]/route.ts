import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  handleRouteError,
  jsonError,
  jsonSuccess,
  parseJson,
  requireApiUser,
} from "@/lib/api/server";
import {
  getMemberWithRelations,
  normalizeMemberFields,
  splitEmergencyContactFields,
  syncMemberEmergencyContact,
} from "@/lib/server/member-records";

const updateMemberSchema = z.object({
  first_name: z.string().min(1).optional(),
  other_names: z.string().optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  gender: z.string().optional(),
  date_of_birth: z.string().optional(),
  address: z.string().optional(),
  occupation: z.string().optional(),
  marital_status: z
    .enum(["single", "married", "widowed", "divorced"])
    .optional()
    .or(z.literal("")),
  baptism_date: z.string().optional(),
  membership_status: z
    .enum(["active", "inactive", "transferred", "deceased"])
    .optional(),
  cluster_id: z
    .union([z.string().uuid(), z.string().startsWith("name:"), z.literal("")])
    .optional(),
  join_date: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  notes: z.string().optional(),
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
    const data = await getMemberWithRelations(id);

    if (!data) {
      return jsonError("Member not found", 404);
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
    const payload = await parseJson(request, updateMemberSchema);
    const { hasEmergencyContactFields, memberFields, emergencyContact } =
      splitEmergencyContactFields(payload);
    const updates = await normalizeMemberFields(memberFields);

    const { data, error } = await supabaseAdmin
      .from("members")
      .update(updates)
      .eq("id", id)
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (hasEmergencyContactFields) {
      await syncMemberEmergencyContact(id, emergencyContact);
    }

    const member = await getMemberWithRelations(data.id);
    return jsonSuccess(member);
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
    const { error } = await supabaseAdmin.from("members").delete().eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return jsonSuccess({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
