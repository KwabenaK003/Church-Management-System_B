import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  handleRouteError,
  jsonSuccess,
  parseJson,
  parseNumberParam,
  requireApiUser,
} from "@/lib/api/server";

const pledgeSchema = z.object({
  campaign_id: z.string().uuid(),
  member_id: z.string().uuid(),
  pledged_amount: z.number().positive(),
  due_date: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const search = searchParams.get("search")?.trim().toLowerCase();
    const pageParam = searchParams.get("page");
    const rowsPerPageParam = searchParams.get("rowsPerPage");

    let query = supabaseAdmin
      .from("pledges")
      .select(
        "*, member:members(id,first_name,last_name), campaign:pledge_campaigns(id,name)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false });

    if (campaignId) {
      query = query.eq("campaign_id", campaignId);
    }

    if (pageParam && rowsPerPageParam && !search) {
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
      const page = parseNumberParam(pageParam, 1);
      const rowsPerPage = parseNumberParam(rowsPerPageParam, 10);
      const filteredData = search
        ? (data ?? []).filter((pledge) => {
            const memberName = pledge.member
              ? `${pledge.member.first_name ?? ""} ${pledge.member.last_name ?? ""}`.trim()
              : "";
            const haystack = [
              memberName,
              pledge.campaign?.name ?? "",
              pledge.status ?? "",
              pledge.notes ?? "",
            ]
              .join(" ")
              .toLowerCase();

            return haystack.includes(search);
          })
        : (data ?? []);

      if (search) {
        const from = (page - 1) * rowsPerPage;
        const paginatedData = filteredData.slice(from, from + rowsPerPage);
        return jsonSuccess({ data: paginatedData, count: filteredData.length });
      }

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
    const payload = await parseJson(request, pledgeSchema);
    const { data, error } = await supabaseAdmin
      .from("pledges")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return jsonSuccess(data, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
