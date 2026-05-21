import { Donation, DonationCategory, Expense, ExpenseCategory, Pledge, PledgeCampaign } from "@/types";
import { apiFetch } from "@/lib/api/client";

export async function getDonationCategories(): Promise<DonationCategory[]> {
  return apiFetch<DonationCategory[]>("/api/settings/categories?type=donation");
}

export async function deleteDonationCategory(id: string): Promise<void> {
  await apiFetch<{ success: boolean }>(
    `/api/settings/categories/${id}?type=donation`,
    { method: "DELETE" },
  );
}

export async function getDonations(year?: number, month?: number): Promise<Donation[]> {
  const searchParams = new URLSearchParams();
  if (year) searchParams.set("year", String(year));
  if (month) searchParams.set("month", String(month));
  const query = searchParams.toString();
  return apiFetch<Donation[]>(`/api/finance/donations${query ? `?${query}` : ""}`);
}

export async function createDonation(payload: Partial<Donation>): Promise<Donation> {
  return apiFetch<Donation>("/api/finance/donations", {
    method: "POST",
    body: payload,
  });
}

export async function updateDonation(
  id: string,
  payload: Partial<Donation>,
): Promise<Donation> {
  return apiFetch<Donation>(`/api/finance/donations/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteDonation(id: string): Promise<void> {
  await apiFetch<{ success: boolean }>(`/api/finance/donations/${id}`, {
    method: "DELETE",
  });
}

export async function getPledgeCampaigns(): Promise<PledgeCampaign[]> {
  return apiFetch<PledgeCampaign[]>("/api/finance/pledge-campaigns");
}

export async function createPledgeCampaign(payload: Partial<PledgeCampaign>): Promise<PledgeCampaign> {
  return apiFetch<PledgeCampaign>("/api/finance/pledge-campaigns", {
    method: "POST",
    body: payload,
  });
}

export async function updatePledgeCampaign(
  id: string,
  payload: Partial<PledgeCampaign>,
): Promise<PledgeCampaign> {
  return apiFetch<PledgeCampaign>(`/api/finance/pledge-campaigns/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deletePledgeCampaign(id: string): Promise<void> {
  await apiFetch<{ success: boolean }>(`/api/finance/pledge-campaigns/${id}`, {
    method: "DELETE",
  });
}

export async function getPledges(campaignId?: string): Promise<Pledge[]> {
  const searchParams = new URLSearchParams();
  if (campaignId) searchParams.set("campaignId", campaignId);
  const query = searchParams.toString();
  return apiFetch<Pledge[]>(`/api/finance/pledges${query ? `?${query}` : ""}`);
}

export async function createPledge(payload: Partial<Pledge>): Promise<Pledge> {
  return apiFetch<Pledge>("/api/finance/pledges", {
    method: "POST",
    body: payload,
  });
}

export async function updatePledge(id: string, payload: Partial<Pledge>): Promise<Pledge> {
  return apiFetch<Pledge>(`/api/finance/pledges/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deletePledge(id: string): Promise<void> {
  await apiFetch<{ success: boolean }>(`/api/finance/pledges/${id}`, {
    method: "DELETE",
  });
}

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  return apiFetch<ExpenseCategory[]>("/api/settings/categories?type=expense");
}

export async function deleteExpenseCategory(id: string): Promise<void> {
  await apiFetch<{ success: boolean }>(
    `/api/settings/categories/${id}?type=expense`,
    { method: "DELETE" },
  );
}

export async function getExpenses(year?: number, month?: number): Promise<Expense[]> {
  const searchParams = new URLSearchParams();
  if (year) searchParams.set("year", String(year));
  if (month) searchParams.set("month", String(month));
  const query = searchParams.toString();
  return apiFetch<Expense[]>(`/api/finance/expenses${query ? `?${query}` : ""}`);
}

export async function createExpense(payload: Partial<Expense>): Promise<Expense> {
  return apiFetch<Expense>("/api/finance/expenses", {
    method: "POST",
    body: payload,
  });
}

export async function updateExpense(id: string, payload: Partial<Expense>): Promise<Expense> {
  return apiFetch<Expense>(`/api/finance/expenses/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteExpense(id: string): Promise<void> {
  await apiFetch<{ success: boolean }>(`/api/finance/expenses/${id}`, {
    method: "DELETE",
  });
}

export async function getDonationsPaginated(params: {
  year?: number;
  month?: number;
  search?: string;
  page: number;
  rowsPerPage: number;
}): Promise<{ data: Donation[]; count: number }> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    rowsPerPage: String(params.rowsPerPage),
  });
  if (params.year) searchParams.set("year", String(params.year));
  if (params.month) searchParams.set("month", String(params.month));
  if (params.search?.trim()) searchParams.set("search", params.search.trim());
  return apiFetch<{ data: Donation[]; count: number }>(
    `/api/finance/donations?${searchParams.toString()}`,
  );
}

export async function getExpensesPaginated(params: {
  year?: number;
  month?: number;
  search?: string;
  page: number;
  rowsPerPage: number;
}): Promise<{ data: Expense[]; count: number }> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    rowsPerPage: String(params.rowsPerPage),
  });
  if (params.year) searchParams.set("year", String(params.year));
  if (params.month) searchParams.set("month", String(params.month));
  if (params.search?.trim()) searchParams.set("search", params.search.trim());
  return apiFetch<{ data: Expense[]; count: number }>(
    `/api/finance/expenses?${searchParams.toString()}`,
  );
}

export async function getPledgesPaginated(params: {
  campaignId?: string;
  search?: string;
  page: number;
  rowsPerPage: number;
}): Promise<{ data: Pledge[]; count: number }> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    rowsPerPage: String(params.rowsPerPage),
  });
  if (params.campaignId) searchParams.set("campaignId", params.campaignId);
  if (params.search?.trim()) searchParams.set("search", params.search.trim());
  return apiFetch<{ data: Pledge[]; count: number }>(
    `/api/finance/pledges?${searchParams.toString()}`,
  );
}
