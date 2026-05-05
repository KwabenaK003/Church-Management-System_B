import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Cluster } from "@/types";
import { getClusters, getClusterById, createCluster, updateCluster, deleteCluster } from "@/lib/services/clusterService";

const QUERY_KEY = ["clusters"] as const;

export function useClusters() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getClusters,
  });
}

export function useCluster(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => getClusterById(id),
    enabled: !!id,
  });
}

export function useCreateCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Cluster>) => createCluster(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<Cluster> & { id: string }) => updateCluster(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCluster,
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
