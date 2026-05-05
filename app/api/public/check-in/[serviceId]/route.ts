import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  handleRouteError,
  jsonError,
  jsonSuccess,
  parseJson,
} from "@/lib/api/server";

type Context = { params: Promise<{ serviceId: string }> };
type OpenService = {
  id: string;
  name: string;
  service_date: string;
  service_type: string;
  status: "open" | "closed";
};

const submitCheckInSchema = z.discriminatedUnion("attendeeType", [
  z.object({
    attendeeType: z.literal("member"),
    memberId: z.string().uuid(),
  }),
  z.object({
    attendeeType: z.literal("visitor"),
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().trim().email("A valid email is required"),
    phone: z.string().trim().min(1, "Phone number is required"),
  }),
]);

export async function GET(_: Request, ctx: Context) {
  try {
    const { serviceId } = await ctx.params;

    const { data: service, error: serviceError } = await supabaseAdmin
      .from("services")
      .select("id, name, service_date, service_type, status")
      .eq("id", serviceId)
      .maybeSingle<OpenService>();

    if (serviceError) {
      throw new Error(serviceError.message);
    }

    if (!service) {
      return jsonError("Service not found", 404);
    }

    const { data: members, error: membersError } = await supabaseAdmin
      .from("members")
      .select("id, first_name, last_name")
      .eq("membership_status", "active")
      .order("last_name")
      .order("first_name");

    if (membersError) {
      throw new Error(membersError.message);
    }

    return jsonSuccess({
      service,
      members: members ?? [],
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, ctx: Context) {
  try {
    const { serviceId } = await ctx.params;
    const payload = await parseJson(request, submitCheckInSchema);

    const { data: service, error: serviceError } = await supabaseAdmin
      .from("services")
      .select("id, name, service_date, status")
      .eq("id", serviceId)
      .maybeSingle<Pick<OpenService, "id" | "name" | "service_date" | "status">>();

    if (serviceError) {
      throw new Error(serviceError.message);
    }

    if (!service) {
      return jsonError("Service not found", 404);
    }

    if (service.status === "closed") {
      return jsonError("Cannot check in to a closed service", 409);
    }

    if (payload.attendeeType === "member") {
      const { data: existing, error: existingError } = await supabaseAdmin
        .from("attendance")
        .select("id")
        .eq("member_id", payload.memberId)
        .eq("service_id", serviceId)
        .maybeSingle();

      if (existingError) {
        throw new Error(existingError.message);
      }

      if (existing) {
        return jsonError("Member has already checked in for this service", 409);
      }

      const { error: attendanceError } = await supabaseAdmin
        .from("attendance")
        .insert({
          member_id: payload.memberId,
          service_id: serviceId,
          checked_in_at: new Date().toISOString(),
        });

      if (attendanceError) {
        throw new Error(attendanceError.message);
      }

      return jsonSuccess({ success: true }, 201);
    }

    const nameParts = payload.name.trim().split(/\s+/);
    const firstName = nameParts.shift() ?? payload.name.trim();
    const lastName = nameParts.join(" ") || "Visitor";

    const { error: visitorError } = await supabaseAdmin.from("visitors").insert({
      first_name: firstName,
      last_name: lastName,
      email: payload.email,
      phone: payload.phone,
      visit_date: new Date(service.service_date).toISOString().split("T")[0],
      follow_up_status: "pending",
      notes: `Public service check-in for ${service.name}`,
    });

    if (visitorError) {
      throw new Error(visitorError.message);
    }

    return jsonSuccess({ success: true }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
