import { Cluster } from "@/types";
import { apiFetch } from "@/lib/api/client";

export async function getClusters(): Promise<Cluster[]> {
  return apiFetch<Cluster[]>("/api/clusters");
}

export async function getClusterById(id: string): Promise<Cluster> {
  return apiFetch<Cluster>(`/api/clusters/${id}`);
}

export async function createCluster(payload: Partial<Cluster>): Promise<Cluster> {
  return apiFetch<Cluster>("/api/clusters", {
    method: "POST",
    body: payload,
  });
}

export async function updateCluster(id: string, payload: Partial<Cluster>): Promise<Cluster> {
  return apiFetch<Cluster>(`/api/clusters/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteCluster(id: string): Promise<void> {
  await apiFetch<{ success: boolean }>(`/api/clusters/${id}`, {
    method: "DELETE",
  });
}
