import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  handleRouteError,
  jsonError,
  jsonSuccess,
  requireApiUser,
} from "@/lib/api/server";
import {
  getMemberWithRelations,
  normalizeMemberFields,
} from "@/lib/server/member-records";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const { data: visitor, error: visitorError } = await supabaseAdmin
      .from("visitors")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (visitorError) {
      throw new Error(visitorError.message);
    }

    if (!visitor) {
      return jsonError("Visitor not found", 404);
    }

    let member =
      visitor.converted_member_id != null
        ? await getMemberWithRelations(visitor.converted_member_id)
        : null;

    if (!member && visitor.email) {
      const { data: existingMember, error: existingMemberError } =
        await supabaseAdmin
          .from("members")
          .select("id")
          .eq("email", visitor.email)
          .maybeSingle();

      if (existingMemberError) {
        throw new Error(existingMemberError.message);
      }

      if (existingMember) {
        member = await getMemberWithRelations(existingMember.id);
      }
    }

    if (!member) {
      const normalizedMemberFields = await normalizeMemberFields({
        first_name: visitor.first_name,
        last_name: visitor.last_name,
        email: visitor.email,
        phone: visitor.phone,
        notes: visitor.notes,
        join_date: visitor.visit_date,
      });

      const { data: createdMember, error: createMemberError } =
        await supabaseAdmin
          .from("members")
          .insert({
            ...normalizedMemberFields,
            membership_status: "active",
            join_date:
              normalizedMemberFields.join_date ??
              new Date().toISOString().split("T")[0],
          })
          .select("id")
          .single();

      if (createMemberError) {
        throw new Error(createMemberError.message);
      }

      member = await getMemberWithRelations(createdMember.id);
    }

    if (!member) {
      throw new Error("Unable to convert visitor to member.");
    }

    const { data: updatedVisitor, error: updateVisitorError } =
      await supabaseAdmin
        .from("visitors")
        .update({
          follow_up_status: "joined",
          converted_member_id: member.id,
        })
        .eq("id", id)
        .select("*")
        .single();

    if (updateVisitorError) {
      throw new Error(updateVisitorError.message);
    }

    return jsonSuccess({
      visitor: updatedVisitor,
      member,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
