import { supabaseAdmin } from "@/lib/supabase-admin";
import { handleRouteError, jsonSuccess } from "@/lib/api/server";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("church_settings")
      .select("latitude, longitude, radius_metres")
      .eq("id", 1)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return jsonSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
