import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  handleRouteError,
  jsonError,
  jsonSuccess,
  parseJson,
  requireApiUser,
} from "@/lib/api/server";

const categorySchema = z.object({
  type: z.enum(["donation", "expense"]),
  name: z.string().min(1, "Category name is required"),
});

function getCategoryTable(type: "donation" | "expense") {
  return type === "donation"
    ? "donation_categories"
    : "expense_categories";
}

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    if (type !== "donation" && type !== "expense") {
      return jsonError("Invalid category type", 400);
    }

    const { data, error } = await supabaseAdmin
      .from(getCategoryTable(type))
      .select("*")
      .order("name");

    if (error) {
      throw new Error(error.message);
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
    const payload = await parseJson(request, categorySchema);
    const { data, error } = await supabaseAdmin
      .from(getCategoryTable(payload.type))
      .insert({ name: payload.name })
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
