import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  handleRouteError,
  jsonSuccess,
  requireApiUser,
} from "@/lib/api/server";

export async function GET() {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("equipment")
      .select("category")
      .not("category", "is", null)
      .order("category");

    if (error) {
      throw new Error(error.message);
    }

    const categories = [
      ...new Set(
        (data ?? [])
          .map((entry: { category: string | null }) => entry.category)
          .filter((value): value is string => Boolean(value)),
      ),
    ];

    return jsonSuccess(categories);
  } catch (error) {
    return handleRouteError(error);
  }
}
