import { Equipment } from "@/types";
import { apiFetch } from "@/lib/api/client";

export async function getEquipment(search?: string, condition?: string): Promise<Equipment[]> {
  const searchParams = new URLSearchParams();
  if (search) searchParams.set("search", search);
  if (condition) searchParams.set("condition", condition);
  const query = searchParams.toString();
  return apiFetch<Equipment[]>(`/api/equipment${query ? `?${query}` : ""}`);
}

export async function createEquipment(payload: Partial<Equipment>): Promise<Equipment> {
  return apiFetch<Equipment>("/api/equipment", {
    method: "POST",
    body: payload,
  });
}

export async function updateEquipment(id: string, payload: Partial<Equipment>): Promise<Equipment> {
  return apiFetch<Equipment>(`/api/equipment/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteEquipment(id: string): Promise<void> {
  await apiFetch<{ success: boolean }>(`/api/equipment/${id}`, {
    method: "DELETE",
  });
}

export async function getEquipmentPaginated(params: {
  search?: string;
  condition?: string;
  category?: string;
  page: number;
  rowsPerPage: number;
}): Promise<{ data: Equipment[]; count: number }> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    rowsPerPage: String(params.rowsPerPage),
  });

  if (params.search) searchParams.set("search", params.search);
  if (params.condition) searchParams.set("condition", params.condition);
  if (params.category) searchParams.set("category", params.category);

  return apiFetch<{ data: Equipment[]; count: number }>(
    `/api/equipment?${searchParams.toString()}`,
  );
}

export async function getEquipmentCategories(): Promise<string[]> {
  return apiFetch<string[]>("/api/equipment/categories");
}
