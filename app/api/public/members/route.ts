import { supabaseAdmin } from "@/lib/supabase-admin";
import { handleRouteError, jsonSuccess } from "@/lib/api/server";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("members")
      .select("id, first_name, last_name, email, membership_status, cluster:clusters(id,name)")
      .eq("membership_status", "active")
      .order("last_name");

    if (error) {
      throw new Error(error.message);
    }

    return jsonSuccess(data ?? []);
  } catch (error) {
    return handleRouteError(error);
  }
}
