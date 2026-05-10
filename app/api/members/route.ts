import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  handleRouteError,
  jsonSuccess,
  parseJson,
  parseNumberParam,
  requireApiUser,
} from "@/lib/api/server";
import {
  getMemberWithRelations,
  normalizeMemberFields,
  splitEmergencyContactFields,
  syncMemberEmergencyContact,
} from "@/lib/server/member-records";

const memberSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  other_names: z.string().optional(),
  last_name: z.string().min(1, "Last name is required"),
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

async function resolveClusterFilterId(clusterId: string) {
  if (!clusterId.startsWith("name:")) {
    return clusterId;
  }

  const departmentName = clusterId.slice(5).trim();

  if (!departmentName) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("clusters")
    .select("id")
    .ilike("name", departmentName)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.id ?? null;
}

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const clusterId = searchParams.get("clusterId");
    const gender = searchParams.get("gender");
    const page = searchParams.get("page");
    const rowsPerPage = searchParams.get("rowsPerPage");

    let query = supabaseAdmin
      .from("members")
      .select("*, cluster:clusters(id,name)", { count: "exact" })
      .order("last_name");

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`,
      );
    }
    if (status) {
      query = query.eq("membership_status", status);
    }
    if (clusterId) {
      const resolvedClusterId = await resolveClusterFilterId(clusterId);

      if (!resolvedClusterId) {
        if (page && rowsPerPage) {
          return jsonSuccess({ data: [], count: 0 });
        }

        return jsonSuccess([]);
      }

      query = query.eq("cluster_id", resolvedClusterId);
    }
    if (gender) {
      query = query.eq("gender", gender);
    }

    if (page && rowsPerPage) {
      const pageNumber = parseNumberParam(page, 1);
      const size = parseNumberParam(rowsPerPage, 10);
      const from = (pageNumber - 1) * size;
      query = query.range(from, from + size - 1);
    }

    const { data, error, count } = await query;
    if (error) {
      throw new Error(error.message);
    }

    if (page && rowsPerPage) {
      return jsonSuccess({ data: data ?? [], count: count ?? 0 });
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
    const payload = await parseJson(request, memberSchema);
    const { memberFields, emergencyContact } =
      splitEmergencyContactFields(payload);
    const normalizedMemberFields = await normalizeMemberFields(memberFields);
    const row = {
      ...normalizedMemberFields,
      membership_status: payload.membership_status ?? "active",
      join_date:
        normalizedMemberFields.join_date ??
        new Date().toISOString().split("T")[0],
    };

    const { data, error } = await supabaseAdmin
      .from("members")
      .insert(row)
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    try {
      await syncMemberEmergencyContact(data.id, emergencyContact);
    } catch (error) {
      await supabaseAdmin.from("members").delete().eq("id", data.id);
      throw error;
    }

    const member = await getMemberWithRelations(data.id);
    return jsonSuccess(member, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
