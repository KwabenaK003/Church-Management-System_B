import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  handleRouteError,
  jsonError,
  jsonSuccess,
  requireApiUser,
} from "@/lib/api/server";

function getCategoryTable(type: string | null) {
  if (type === "donation") {
    return "donation_categories";
  }

  if (type === "expense") {
    return "expense_categories";
  }

  return null;
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const table = getCategoryTable(searchParams.get("type"));
    if (!table) {
      return jsonError("Invalid category type", 400);
    }

    const { id } = await context.params;
    const { error } = await supabaseAdmin.from(table).delete().eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return jsonSuccess({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
