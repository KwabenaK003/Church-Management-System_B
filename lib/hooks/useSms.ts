import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SMSCampaign, SMSTemplate } from "@/types";
import {
  getSmsTemplates,
  createSmsTemplate,
  deleteSmsTemplate,
  getSmsCampaigns,
  getSmsCampaignsPaginated,
  createSmsCampaign,
  updateSmsCampaign,
  deleteSmsCampaign,
} from "@/lib/services/smsService";

const TEMPLATES_KEY = ["sms_templates"] as const;
const CAMPAIGNS_KEY = ["sms_campaigns"] as const;

export function useSmsTemplates() {
  return useQuery({
    queryKey: TEMPLATES_KEY,
    queryFn: getSmsTemplates,
  });
}

export function useCreateSmsTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<SMSTemplate>) => createSmsTemplate(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: TEMPLATES_KEY }),
  });
}

export function useDeleteSmsTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSmsTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: TEMPLATES_KEY }),
  });
}

export function useSmsCampaigns() {
  return useQuery({
    queryKey: CAMPAIGNS_KEY,
    queryFn: getSmsCampaigns,
  });
}

export function useSmsCampaignsPaginated(
  search = "",
  page = 1,
  rowsPerPage = 10,
) {
  return useQuery({
    queryKey: ["sms_campaigns", "paginated", search, page, rowsPerPage],
    queryFn: () => getSmsCampaignsPaginated({ search, page, rowsPerPage }),
    placeholderData: keepPreviousData,
  });
}

export function useCreateSmsCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<SMSCampaign>) => createSmsCampaign(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: CAMPAIGNS_KEY }),
  });
}

export function useUpdateSmsCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<SMSCampaign> & { id: string }) =>
      updateSmsCampaign(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: CAMPAIGNS_KEY }),
  });
}

export function useDeleteSmsCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSmsCampaign,
    onSuccess: () => qc.invalidateQueries({ queryKey: CAMPAIGNS_KEY }),
  });
}

/**
 * NOTE: For actual SMS sending via Hubtel, we recommend:
 * 1. A Supabase Edge Function triggered by a new insert in 'sms_campaigns'
 * 2. OR a DB Trigger calling a remote HTTP endpoint.
 * This keeps API secrets (Hubtel) server-side as requested.
 */
