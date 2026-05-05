import { Visitor, FollowUpStatus, Member } from "@/types";
import { createMember, MemberPayload } from "@/lib/services/memberService";
import { apiFetch } from "@/lib/api/client";

export interface VisitorPayload {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  visit_date: string;
  invited_by?: string;
  notes?: string;
}

export async function getVisitors(
  search?: string,
  status?: string,
): Promise<Visitor[]> {
  const searchParams = new URLSearchParams();
  if (search) {
    searchParams.set("search", search);
  }
  if (status) {
    searchParams.set("status", status);
  }

  const query = searchParams.toString();
  return apiFetch<Visitor[]>(`/api/visitors${query ? `?${query}` : ""}`);
}

export async function getVisitorById(id: string): Promise<Visitor> {
  return apiFetch<Visitor>(`/api/visitors/${id}`);
}

export async function logVisitor(payload: VisitorPayload): Promise<Visitor> {
  return apiFetch<Visitor>("/api/visitors", {
    method: "POST",
    body: {
      ...payload,
      follow_up_status: "pending" as FollowUpStatus,
    },
  });
}

export async function updateVisitorFollowUp(id: string, status: FollowUpStatus): Promise<Visitor> {
  return apiFetch<Visitor>(`/api/visitors/${id}`, {
    method: "PATCH",
    body: { follow_up_status: status },
  });
}

export async function convertVisitorToMember(visitorId: string, memberData: MemberPayload): Promise<Member> {
  const visitor = await getVisitorById(visitorId);

  const newMember = await createMember({
    ...memberData,
    first_name: memberData.first_name ?? visitor.first_name,
    last_name: memberData.last_name ?? visitor.last_name,
    email: memberData.email ?? visitor.email ?? "",
  });

  await updateVisitorFollowUp(visitorId, "joined");

  return newMember;
}

export async function getVisitorsPaginated(params: {
  search?: string;
  status?: string;
  how_heard?: string;
  page: number;
  rowsPerPage: number;
}): Promise<{ data: Visitor[]; count: number }> {
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
  if (params.how_heard) {
    searchParams.set("howHeard", params.how_heard);
  }

  return apiFetch<{ data: Visitor[]; count: number }>(
    `/api/visitors?${searchParams.toString()}`,
  );
}
