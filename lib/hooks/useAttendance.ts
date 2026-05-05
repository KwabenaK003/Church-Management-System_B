import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Service, Attendance } from "@/types";
import {
  listServices,
  getService,
  getAttendance,
  getAttendancePaginated,
  createService,
  recordCheckIn,
  closeService,
} from "@/lib/services/attendanceService";

const SERVICES_KEY = ["services"] as const;
const ATTENDANCE_KEY = ["attendance"] as const;

export function useServices() {
  return useQuery({
    queryKey: SERVICES_KEY,
    queryFn: listServices,
  });
}

export function useService(id: string) {
  return useQuery({
    queryKey: [...SERVICES_KEY, id],
    queryFn: () => getService(id),
    enabled: !!id,
  });
}

export function useAttendance(serviceId?: string) {
  return useQuery({
    queryKey: [...ATTENDANCE_KEY, serviceId],
    queryFn: async () => {
      return getAttendance(serviceId);
    },
  });
}

export function useAttendancePaginated(
  serviceId?: string,
  page = 1,
  rowsPerPage = 10,
) {
  return useQuery({
    queryKey: ["attendance", "paginated", serviceId, page, rowsPerPage],
    queryFn: () =>
      getAttendancePaginated({
        serviceId: serviceId || undefined,
        page,
        rowsPerPage,
      }),
    placeholderData: keepPreviousData,
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Service>) => createService(payload as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: SERVICES_KEY }),
  });
}

export function useCloseService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (serviceId: string) => closeService(serviceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: SERVICES_KEY }),
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      search?: string;
      member_id?: string;
      service_id: string;
      service_date?: string;
      service_type?: string;
      location_name?: string;
      latitude?: number;
      longitude?: number;
    }) =>
      recordCheckIn({
        member_id: payload.member_id,
        search: payload.search,
        service_id: payload.service_id,
        latitude: payload.latitude,
        longitude: payload.longitude,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ATTENDANCE_KEY }),
  });
}
