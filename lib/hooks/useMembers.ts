import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Member } from "@/types";
import {
  getMembers,
  getPublicMembers,
  createMember,
  updateMember,
  deleteMember,
  getMemberById,
  getMembersPaginated,
  MemberPayload,
} from "@/lib/services/memberService";

const QUERY_KEY = ["members"] as const;

export function useMembers(search?: string, status?: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, search, status],
    queryFn: () => getMembers(search, status),
  });
}

export function usePublicMembers() {
  return useQuery({
    queryKey: [...QUERY_KEY, "public"],
    queryFn: getPublicMembers,
  });
}

export function useMembersPaginated(
  search?: string,
  status?: string,
  page = 1,
  rowsPerPage = 10,
  clusterId?: string,
  gender?: string,
) {
  return useQuery({
    queryKey: [...QUERY_KEY, "paginated", search, status, page, rowsPerPage, clusterId, gender],
    queryFn: () =>
      getMembersPaginated({
        search: search || undefined,
        status: status || undefined,
        gender: gender || undefined,
        cluster_id: clusterId || undefined,
        page,
        rowsPerPage,
      }),
    placeholderData: keepPreviousData,
  });
}

export function useMember(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => getMemberById(id),
    enabled: !!id,
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: MemberPayload) => createMember(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<MemberPayload> & { id: string }) =>
      updateMember(id, payload),
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, vars.id] }),
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMember(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
