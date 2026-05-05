import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  handleRouteError,
  jsonSuccess,
  parseJson,
  parseNumberParam,
  requireApiUser,
} from "@/lib/api/server";

const equipmentSchema = z.object({
  name: z.string().min(1, "Equipment name is required"),
  category: z.string().optional(),
  serial_number: z.string().optional(),
  purchase_date: z.string().optional(),
  purchase_price: z.number().nonnegative().optional(),
  condition: z.enum(["excellent", "good", "fair", "poor", "damaged"]),
  location: z.string().optional(),
  assigned_to: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const condition = searchParams.get("condition");
    const category = searchParams.get("category");
    const pageParam = searchParams.get("page");
    const rowsPerPageParam = searchParams.get("rowsPerPage");

    let query = supabaseAdmin
      .from("equipment")
      .select("*", { count: "exact" })
      .order("name");

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }
    if (condition) {
      query = query.eq("condition", condition);
    }
    if (category) {
      query = query.eq("category", category);
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
    const payload = await parseJson(request, equipmentSchema);
    const { data, error } = await supabaseAdmin
      .from("equipment")
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
