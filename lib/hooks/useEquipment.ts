import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Equipment } from "@/types";
import {
  getEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getEquipmentPaginated,
  getEquipmentCategories,
} from "@/lib/services/equipmentService";

const QUERY_KEY = ["equipment"] as const;

export function useEquipment(search?: string, condition?: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, search, condition],
    queryFn: () => getEquipment(search, condition),
  });
}

export function useEquipmentPaginated(
  search?: string,
  condition?: string,
  page = 1,
  rowsPerPage = 10,
  category?: string,
) {
  return useQuery({
    queryKey: [...QUERY_KEY, "paginated", search, condition, page, rowsPerPage, category],
    queryFn: () =>
      getEquipmentPaginated({
        search: search || undefined,
        condition: condition || undefined,
        category: category || undefined,
        page,
        rowsPerPage,
      }),
    placeholderData: keepPreviousData,
  });
}

export function useEquipmentCategories() {
  return useQuery({
    queryKey: [...QUERY_KEY, "categories"],
    queryFn: () => getEquipmentCategories(),
  });
}

export function useCreateEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Equipment>) => createEquipment(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<Equipment> & { id: string }) => updateEquipment(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteEquipment,
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
