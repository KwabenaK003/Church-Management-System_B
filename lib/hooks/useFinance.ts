import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Donation, DonationCategory, Expense, ExpenseCategory, Pledge, PledgeCampaign } from "@/types";
import {
  getDonationCategories,
  deleteDonationCategory,
  getDonations,
  createDonation,
  updateDonation,
  deleteDonation,
  getPledgeCampaigns,
  createPledgeCampaign,
  updatePledgeCampaign,
  deletePledgeCampaign,
  getPledges,
  createPledge,
  getExpenseCategories,
  deleteExpenseCategory,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getDonationsPaginated,
  getExpensesPaginated,
  getPledgesPaginated,
} from "@/lib/services/financeService";


const DONATION_CATS_KEY = ["donation_categories"] as const;

export function useDonationCategories() {
  return useQuery({
    queryKey: DONATION_CATS_KEY,
    queryFn: getDonationCategories,
  });
}

export function useDeleteDonationCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDonationCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: DONATION_CATS_KEY }),
  });
}


const DONATIONS_KEY = ["donations"] as const;

export function useDonations(year?: number, month?: number) {
  return useQuery({
    queryKey: [...DONATIONS_KEY, year, month],
    queryFn: () => getDonations(year, month),
  });
}

export function useCreateDonation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Donation>) => createDonation(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: DONATIONS_KEY }),
  });
}

export function useUpdateDonation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<Donation> & { id: string }) =>
      updateDonation(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: DONATIONS_KEY }),
  });
}

export function useDeleteDonation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDonation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: DONATIONS_KEY }),
  });
}


const CAMPAIGNS_KEY = ["pledge_campaigns"] as const;

export function usePledgeCampaigns() {
  return useQuery({
    queryKey: CAMPAIGNS_KEY,
    queryFn: getPledgeCampaigns,
  });
}

export function useCreatePledgeCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<PledgeCampaign>) => createPledgeCampaign(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: CAMPAIGNS_KEY }),
  });
}

export function useUpdatePledgeCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<PledgeCampaign> & { id: string }) =>
      updatePledgeCampaign(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: CAMPAIGNS_KEY }),
  });
}

export function useDeletePledgeCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePledgeCampaign(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CAMPAIGNS_KEY });
      qc.invalidateQueries({ queryKey: PLEDGES_KEY });
    },
  });
}


const PLEDGES_KEY = ["pledges"] as const;

export function usePledges(campaignId?: string) {
  return useQuery({
    queryKey: [...PLEDGES_KEY, campaignId],
    queryFn: () => getPledges(campaignId),
  });
}

export function useCreatePledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Pledge>) => createPledge(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: PLEDGES_KEY }),
  });
}


const EXPENSE_CATS_KEY = ["expense_categories"] as const;

export function useExpenseCategories() {
  return useQuery({
    queryKey: EXPENSE_CATS_KEY,
    queryFn: getExpenseCategories,
  });
}

export function useDeleteExpenseCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExpenseCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: EXPENSE_CATS_KEY }),
  });
}


const EXPENSES_KEY = ["expenses"] as const;

export function useExpenses(year?: number, month?: number) {
  return useQuery({
    queryKey: [...EXPENSES_KEY, year, month],
    queryFn: () => getExpenses(year, month),
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Expense>) => createExpense(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: EXPENSES_KEY }),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<Expense> & { id: string }) => updateExpense(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: EXPENSES_KEY }),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: EXPENSES_KEY }),
  });
}

export function useDonationsPaginated(
  year?: number,
  month?: number,
  search = "",
  page = 1,
  rowsPerPage = 10,
) {
  return useQuery({
    queryKey: [...DONATIONS_KEY, "paginated", year, month, search, page, rowsPerPage],
    queryFn: () => getDonationsPaginated({ year, month, search, page, rowsPerPage }),
    placeholderData: keepPreviousData,
  });
}

export function useExpensesPaginated(
  year?: number,
  month?: number,
  search = "",
  page = 1,
  rowsPerPage = 10,
) {
  return useQuery({
    queryKey: [...EXPENSES_KEY, "paginated", year, month, search, page, rowsPerPage],
    queryFn: () => getExpensesPaginated({ year, month, search, page, rowsPerPage }),
    placeholderData: keepPreviousData,
  });
}

export function usePledgesPaginated(
  campaignId?: string,
  search = "",
  page = 1,
  rowsPerPage = 10,
) {
  return useQuery({
    queryKey: [...PLEDGES_KEY, "paginated", campaignId, search, page, rowsPerPage],
    queryFn: () => getPledgesPaginated({ campaignId, search, page, rowsPerPage }),
    placeholderData: keepPreviousData,
  });
}
