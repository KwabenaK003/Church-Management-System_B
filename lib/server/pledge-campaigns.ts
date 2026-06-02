
import { supabaseAdmin } from "@/lib/supabase-admin";

type CampaignRow = {
  id: string;
  name: string;
  description?: string | null;
  target_amount?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  updated_at?: string | null;
};

type MemberSummary = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  pledged_amount: number;
  paid_amount: number;
  status: string;
};

type JoinedMember = Pick<MemberSummary, "id" | "first_name" | "last_name">;

type PledgeCampaignMirror = {
  campaign_id: string;
  pledged_amount?: number | null;
  due_date?: string | null;
};

export async function attachPledgeCampaignMembers<T extends CampaignRow>(
  campaigns: T[],
): Promise<Array<T & { members: MemberSummary[]; total_pledged: number; total_paid: number }>> {
  if (campaigns.length === 0) {
    return campaigns.map((c) => ({ ...c, members: [], total_pledged: 0, total_paid: 0 }));
  }

  const campaignIds = campaigns.map((c) => c.id);

  // Fetch pledges with member details — typed explicitly
  const { data: pledges, error } = await supabaseAdmin
    .from("pledges")
    .select("campaign_id, member_id, pledged_amount, paid_amount, status, member:members(id,first_name,last_name)")
    .in("campaign_id", campaignIds);

  if (error) {
    throw new Error(error.message);
  }

  // Group pledges by campaign_id
  const pledgesByCampaign = new Map<string, MemberSummary[]>();

  for (const pledge of pledges ?? []) {
    const memberValue = pledge.member as unknown as JoinedMember | JoinedMember[] | null;
    const member = Array.isArray(memberValue) ? memberValue[0] ?? null : memberValue;

    const existing = pledgesByCampaign.get(pledge.campaign_id) ?? [];
    existing.push({
      id:             member?.id        ?? pledge.member_id,
      first_name:     member?.first_name ?? null,
      last_name:      member?.last_name  ?? null,
      pledged_amount: pledge.pledged_amount,
      paid_amount:    pledge.paid_amount,
      status:         pledge.status,
    });
    pledgesByCampaign.set(pledge.campaign_id, existing);
  }

  return campaigns.map((campaign) => {
    const members       = pledgesByCampaign.get(campaign.id) ?? [];
    const total_pledged = members.reduce((sum, m) => sum + (m.pledged_amount ?? 0), 0);
    const total_paid    = members.reduce((sum, m) => sum + (m.paid_amount    ?? 0), 0);
    return { ...campaign, members, total_pledged, total_paid };
  });
}

export async function mirrorPledgeToCampaign(
  pledge: PledgeCampaignMirror,
): Promise<void> {
  const updates = {
    ...(pledge.pledged_amount != null ? { target_amount: pledge.pledged_amount } : {}),
    ...(pledge.due_date !== undefined ? { end_date: pledge.due_date || null } : {}),
  };

  if (Object.keys(updates).length === 0) {
    return;
  }

  const { error } = await supabaseAdmin
    .from("pledge_campaigns")
    .update(updates)
    .eq("id", pledge.campaign_id);

  if (error) {
    throw new Error(error.message);
  }
}
