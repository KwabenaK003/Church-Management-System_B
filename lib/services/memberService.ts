import { Member, MembershipStatus } from "@/types";
import { apiFetch } from "@/lib/api/client";

export interface MemberPayload {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
  address?: string;
  occupation?: string;
  marital_status?: "single" | "married" | "widowed" | "divorced";
  baptism_date?: string;
  membership_status?: MembershipStatus;
  cluster_id?: string;
  join_date?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  profile_photo_url?: string;
  notes?: string;
}

export async function getMembers(
  search?: string,
  status?: string,
): Promise<Member[]> {
  const searchParams = new URLSearchParams();
  if (search) {
    searchParams.set("search", search);
  }
  if (status) {
    searchParams.set("status", status);
  }

  const query = searchParams.toString();
  return apiFetch<Member[]>(`/api/members${query ? `?${query}` : ""}`);
}

export async function getPublicMembers(): Promise<Member[]> {
  return apiFetch<Member[]>("/api/public/members");
}

export async function getMemberById(id: string): Promise<Member> {
  return apiFetch<Member>(`/api/members/${id}`);
}

export async function createMember(payload: MemberPayload): Promise<Member> {
  return apiFetch<Member>("/api/members", {
    method: "POST",
    body: {
      ...payload,
      membership_status:
        payload.membership_status ?? ("active" as MembershipStatus),
      join_date: payload.join_date ?? new Date().toISOString().split("T")[0],
    },
  });
}

export async function updateMember(id: string, updates: Partial<MemberPayload>): Promise<Member> {
  return apiFetch<Member>(`/api/members/${id}`, {
    method: "PATCH",
    body: updates,
  });
}

export async function deactivateMember(id: string): Promise<Member> {
  return updateMember(id, { membership_status: "inactive" });
}

export async function importMembers(
  rows: MemberPayload[]
): Promise<{ success: boolean; details: { email: string; success: boolean; message?: string }[] }> {
  const details: { email: string; success: boolean; message?: string }[] = [];

  for (const row of rows) {
    try {
      await createMember(row);
      details.push({ email: row.email ?? "", success: true });
    } catch (error) {
      details.push({
        email: row.email ?? "",
        success: false,
        message: error instanceof Error ? error.message : "Unknown",
      });
    }
  }

  return { success: details.every((d) => d.success), details };
}

export async function deleteMember(id: string): Promise<void> {
  await apiFetch<{ success: boolean }>(`/api/members/${id}`, {
    method: "DELETE",
  });
}

export async function getMembersPaginated(params: {
  search?: string;
  status?: string;
  cluster_id?: string;
  gender?: string;
  page: number;
  rowsPerPage: number;
}): Promise<{ data: Member[]; count: number }> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    rowsPerPage: String(params.rowsPerPage),
  });

  if (params.search) {
    searchParams.set("search", params.search);
  }
  if (params.status) {
    searchParams.set("status", params.status);
  }
  if (params.cluster_id) {
    searchParams.set("clusterId", params.cluster_id);
  }
  if (params.gender) {
    searchParams.set("gender", params.gender);
  }

  return apiFetch<{ data: Member[]; count: number }>(
    `/api/members?${searchParams.toString()}`,
  );
}
