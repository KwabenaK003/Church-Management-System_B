import { Attendance, Service, ServiceType, Member } from "@/types";
import { apiFetch } from "@/lib/api/client";
import { getMembers } from "@/lib/services/memberService";

const CLOSED_SERVICE_CHECK_IN_ERROR = "Cannot check in to a closed service";
const DUPLICATE_CHECK_IN_ERROR = "Member has already checked in for this service";

type DatabaseError = {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
};

function mapCheckInInsertError(error: DatabaseError): Error {
  if (error.code === "23505") {
    return new Error(DUPLICATE_CHECK_IN_ERROR);
  }

  const text = `${error.message} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();
  if (text.includes(CLOSED_SERVICE_CHECK_IN_ERROR.toLowerCase())) {
    return new Error(CLOSED_SERVICE_CHECK_IN_ERROR);
  }

  return new Error(error.message);
}

export interface ServicePayload {
  name: string;
  service_date: string;
  service_type: ServiceType;
  expected_count?: number;
  notes?: string;
}

export interface CheckInPayload {
  member_id?: string;
  service_id: string;
  latitude?: number;
  longitude?: number;
  search?: string;
}

export async function manualCheckIn(payload: CheckInPayload): Promise<Attendance> {
  return recordCheckIn(payload);
}

export async function createService(payload: ServicePayload): Promise<Service> {
  return apiFetch<Service>("/api/attendance/services", {
    method: "POST",
    body: payload,
  });
}

export async function closeService(serviceId: string): Promise<Service> {
  return apiFetch<Service>(`/api/attendance/services/${serviceId}/close`, {
    method: "PATCH",
  });
}

export async function recordCheckIn(payload: CheckInPayload): Promise<Attendance> {
  try {
    return await apiFetch<Attendance>("/api/public/check-in", {
      method: "POST",
      body: payload,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw mapCheckInInsertError({ message: error.message });
    }
    throw error;
  }
}

export async function listServices(): Promise<Service[]> {
  return apiFetch<Service[]>("/api/attendance/services");
}

export async function getService(serviceId: string): Promise<Service> {
  return apiFetch<Service>(`/api/public/services/${serviceId}`);
}

export async function getAttendance(serviceId?: string): Promise<Attendance[]> {
  const params = new URLSearchParams();
  if (serviceId) {
    params.set("serviceId", serviceId);
  }

  const query = params.toString();
  return apiFetch<Attendance[]>(
    `/api/attendance/records${query ? `?${query}` : ""}`,
  );
}

export async function getAbsentMembers(lastServices = 1): Promise<Member[]> {
  const latestServices = await listServices();
  const serviceIds = latestServices.slice(0, lastServices).map((service) => service.id);
  if (serviceIds.length === 0) {
    return [];
  }

  const attendanceLists = await Promise.all(
    serviceIds.map((serviceId) => getAttendance(serviceId)),
  );
  const attended = new Set(
    attendanceLists.flatMap((entries) => entries.map((entry) => entry.member_id)),
  );
  const members = await getMembers(undefined, "active");
  return members.filter((member) => !attended.has(member.id));
}

export async function getAttendancePaginated(params: {
  serviceId?: string;
  page: number;
  rowsPerPage: number;
}): Promise<{ data: Attendance[]; count: number }> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    rowsPerPage: String(params.rowsPerPage),
  });

  if (params.serviceId) {
    searchParams.set("serviceId", params.serviceId);
  }

  return apiFetch<{ data: Attendance[]; count: number }>(
    `/api/attendance/records?${searchParams.toString()}`,
  );
}
