import { ChurchSettings, DonationCategory, ExpenseCategory } from "@/types";

import { apiFetch } from "@/lib/api/client";

export async function getChurchProfile(): Promise<ChurchSettings> {
  return apiFetch<ChurchSettings>("/api/settings/church-profile");
}

export async function updateChurchProfile(
  payload: Partial<ChurchSettings>,
): Promise<ChurchSettings> {
  return apiFetch<ChurchSettings>("/api/settings/church-profile", {
    method: "PATCH",
    body: payload,
  });
}

export async function getPublicChurchSettings(): Promise<
  Pick<ChurchSettings, "latitude" | "longitude" | "radius_metres">
> {
  return apiFetch<Pick<ChurchSettings, "latitude" | "longitude" | "radius_metres">>(
    "/api/public/church-settings",
  );
}

export async function createCategory(
  type: "donation" | "expense",
  name: string,
): Promise<DonationCategory | ExpenseCategory> {
  return apiFetch<DonationCategory | ExpenseCategory>("/api/settings/categories", {
    method: "POST",
    body: { type, name },
  });
}
