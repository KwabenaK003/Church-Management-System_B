import { supabase } from "@/lib/supabase";
import { SMSCampaign, SMSTemplate } from "@/types";

export async function getSmsTemplates(): Promise<SMSTemplate[]> {
  const { data, error } = await supabase.from("sms_templates").select("*").order("name");
  if (error) throw new Error(error.message);
  return data as SMSTemplate[];
}

export async function createSmsTemplate(payload: Partial<SMSTemplate>): Promise<SMSTemplate> {
  const { data, error } = await supabase.from("sms_templates").insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data as SMSTemplate;
}

export async function deleteSmsTemplate(id: string): Promise<void> {
  const { error } = await supabase.from("sms_templates").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getSmsCampaigns(): Promise<SMSCampaign[]> {
  const { data, error } = await supabase
    .from("sms_campaigns")
    .select("*, cluster:clusters(id,name)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as SMSCampaign[];
}

export async function createSmsCampaign(payload: Partial<SMSCampaign>): Promise<SMSCampaign> {
  const { data, error } = await supabase.from("sms_campaigns").insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data as SMSCampaign;
}

export async function updateSmsCampaign(
  id: string,
  payload: Partial<SMSCampaign>,
): Promise<SMSCampaign> {
  const { data, error } = await supabase
    .from("sms_campaigns")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as SMSCampaign;
}

export async function deleteSmsCampaign(id: string): Promise<void> {
  const { error } = await supabase.from("sms_campaigns").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getSmsCampaignsPaginated(params: {
  search?: string;
  page: number;
  rowsPerPage: number;
}): Promise<{ data: SMSCampaign[]; count: number }> {
  let query = supabase
    .from("sms_campaigns")
    .select("*, cluster:clusters(id,name)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (params.search?.trim()) {
    const search = params.search.trim();
    query = query.or(`name.ilike.%${search}%,message.ilike.%${search}%`);
  }

  const from = (params.page - 1) * params.rowsPerPage;
  const { data, error, count } = await query.range(from, from + params.rowsPerPage - 1);

  if (error) throw new Error(error.message);
  return { data: (data ?? []) as SMSCampaign[], count: count ?? 0 };
}
