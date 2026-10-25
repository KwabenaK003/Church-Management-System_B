import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  handleRouteError,
  jsonError,
  jsonSuccess,
  parseJson,
} from "@/lib/api/server";

const attendanceSelect =
  "*, member:members(id, first_name, last_name), service:services(id, name, service_date)";

const checkInSchema = z.object({
  member_id: z.string().uuid().optional(),
  search: z.string().trim().min(1).optional(),
  service_id: z.string().uuid(),
  latitude: z.number(),
  longitude: z.number(),
});

const CLOSED_SERVICE_CHECK_IN_ERROR = "Cannot check in to a closed service";
const DUPLICATE_CHECK_IN_ERROR = "Member has already checked in for this service";

export async function POST(request: Request) {
  try {
    const payload = await parseJson(request, checkInSchema);
    let memberId = payload.member_id;

    if (!memberId && payload.search) {
      const searchTerm = payload.search.trim();
      const parts = searchTerm.split(/\s+/).filter(Boolean);

      let memberQuery = supabaseAdmin
        .from("members")
        .select("id")
        .eq("membership_status", "active");

      if (parts.length > 1) {
        const first = parts[0];
        const last = parts[parts.length - 1];
        memberQuery = memberQuery.or(
          `and(first_name.ilike.%${first}%,last_name.ilike.%${last}%),and(first_name.ilike.%${last}%,last_name.ilike.%${first}%),email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`,
        );
      } else {
        const query = `%${searchTerm}%`;
        memberQuery = memberQuery.or(
          `email.ilike.${query},first_name.ilike.${query},last_name.ilike.${query}`,
        );
      }

      const { data: members, error: memberLookupError } = await memberQuery.limit(1);

      if (memberLookupError || !members || members.length === 0) {
        return jsonError("Member not found", 404);
      }

      memberId = members[0].id;
    }

    if (!memberId) {
      return jsonError("Member is required", 400);
    }

    const { data: service, error: serviceError } = await supabaseAdmin
      .from("services")
      .select("id, status")
      .eq("id", payload.service_id)
      .maybeSingle();

    if (serviceError) {
      throw new Error(serviceError.message);
    }

    if (!service) {
      return jsonError("Service not found", 404);
    }

    if (service.status === "closed") {
      return jsonError(CLOSED_SERVICE_CHECK_IN_ERROR, 409);
    }

    const { data: existingAttendance, error: duplicateCheckError } =
      await supabaseAdmin
        .from("attendance")
        .select("id")
        .eq("member_id", memberId)
        .eq("service_id", payload.service_id)
        .maybeSingle();

    if (duplicateCheckError) {
      throw new Error(duplicateCheckError.message);
    }

    if (existingAttendance) {
      return jsonError(DUPLICATE_CHECK_IN_ERROR, 409);
    }

    const { data, error } = await supabaseAdmin
      .from("attendance")
      .insert({
        member_id: memberId,
        service_id: payload.service_id,
        latitude: payload.latitude,
        longitude: payload.longitude,
        checked_in_at: new Date().toISOString(),
      })
      .select(attendanceSelect)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return jsonSuccess(data, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
