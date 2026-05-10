import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { FollowUpTask } from "@/types";
import {
  getFollowUpTasks,
  createFollowUpTask,
  updateFollowUpTask,
  deleteFollowUpTask,
  getFollowUpTasksPaginated,
} from "@/lib/services/followUpService";

const QUERY_KEY = ["follow_up_tasks"] as const;

export function useFollowUpTasks(clusterId?: string, status?: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, clusterId, status],
    queryFn: () => getFollowUpTasks(clusterId, status),
  });
}

export function useFollowUpTasksPaginated(
  clusterId?: string,
  status?: string,
  page = 1,
  rowsPerPage = 10,
) {
  return useQuery({
    queryKey: [...QUERY_KEY, "paginated", clusterId, status, page, rowsPerPage],
    queryFn: () =>
      getFollowUpTasksPaginated({
        clusterId: clusterId || undefined,
        status: status || undefined,
        page,
        rowsPerPage,
      }),
    placeholderData: keepPreviousData,
  });
}

export function useCreateFollowUpTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<FollowUpTask>) => createFollowUpTask(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateFollowUpTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<FollowUpTask> & { id: string }) => updateFollowUpTask(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteFollowUpTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteFollowUpTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
