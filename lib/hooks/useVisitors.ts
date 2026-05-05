import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Visitor } from "@/types";
import {
  getVisitors,
  logVisitor,
  updateVisitorFollowUp,
  getVisitorsPaginated,
} from "@/lib/services/visitorService";
import { apiFetch } from "@/lib/api/client";

const QUERY_KEY = ["visitors"] as const;

export function useVisitors(search?: string, status?: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, search, status],
    queryFn: () => getVisitors(search, status),
  });
}

export function useVisitorsPaginated(
  search?: string,
  status?: string,
  page = 1,
  rowsPerPage = 10,
  howHeard?: string,
) {
  return useQuery({
    queryKey: [...QUERY_KEY, "paginated", search, status, page, rowsPerPage, howHeard],
    queryFn: () =>
      getVisitorsPaginated({
        search: search || undefined,
        status: status || undefined,
        page,
        rowsPerPage,
        how_heard: howHeard || undefined,
      }),
    placeholderData: keepPreviousData,
  });
}

export function useCreateVisitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Visitor>) => logVisitor(payload as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateVisitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<Visitor> & { id: string }) =>
      apiFetch<Visitor>(`/api/visitors/${id}`, {
        method: "PATCH",
        body: payload,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
