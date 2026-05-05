import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  handleRouteError,
  jsonError,
  jsonSuccess,
  parseJson,
  parseNumberParam,
  requireApiUser,
} from "@/lib/api/server";

const attendanceSelect =
  "*, member:members(id, first_name, last_name), service:services(id, name, service_date)";

const checkInSchema = z.object({
  member_id: z.string().uuid().optional(),
  search: z.string().trim().min(1).optional(),
  service_id: z.string().uuid(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const CLOSED_SERVICE_CHECK_IN_ERROR = "Cannot check in to a closed service";
const DUPLICATE_CHECK_IN_ERROR = "Member has already checked in for this service";

type DatabaseError = {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
};

function mapCheckInInsertError(error: DatabaseError): Error {
  if (error.code === "23505") {
    return new Error(DUPLICATE_CHECK_IN_ERROR);
  }

  const text =
    `${error.message} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();
  if (text.includes(CLOSED_SERVICE_CHECK_IN_ERROR.toLowerCase())) {
    return new Error(CLOSED_SERVICE_CHECK_IN_ERROR);
  }

  return new Error(error.message);
}

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");
    const pageParam = searchParams.get("page");
    const rowsPerPageParam = searchParams.get("rowsPerPage");

    let query = supabaseAdmin
      .from("attendance")
      .select(attendanceSelect, { count: "exact" })
      .order("checked_in_at", { ascending: false });

    if (serviceId) {
      query = query.eq("service_id", serviceId);
    }

    if (pageParam && rowsPerPageParam) {
      const page = parseNumberParam(pageParam, 1);
      const rowsPerPage = parseNumberParam(rowsPerPageParam, 10);
      const from = (page - 1) * rowsPerPage;
      query = query.range(from, from + rowsPerPage - 1);
    }

    const { data, error, count } = await query;
    if (error) {
      throw new Error(error.message);
    }

    if (pageParam && rowsPerPageParam) {
      return jsonSuccess({
        data: data ?? [],
        count: count ?? 0,
      });
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
    const payload = await parseJson(request, checkInSchema);
    let memberId = payload.member_id;

    if (!memberId && payload.search) {
      const query = `%${payload.search}%`;
      const { data: members, error: memberLookupError } = await supabaseAdmin
        .from("members")
        .select("id")
        .or(
          `email.ilike.${query},first_name.ilike.${query},last_name.ilike.${query}`,
        )
        .eq("membership_status", "active")
        .limit(1);

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
      throw mapCheckInInsertError(error as DatabaseError);
    }

    return jsonSuccess(data, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
