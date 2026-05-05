"use client";

import { FormEvent, useState } from "react";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

import { Service, ServiceType } from "@/types";
import { useCheckIn } from "@/lib/hooks/useAttendance";

interface CheckInPanelProps {
  services: Service[];
  onSuccess?: () => void;
}

export function CheckInPanel({ services, onSuccess }: CheckInPanelProps) {
  const [memberId, setMemberId] = useState("");
  const [latitude, setLatitude] = useState("");
  const [loading, setLoading] = useState(false);
  const [longitude, setLongitude] = useState("");
  const [message, setMessage] = useState<string>();
  const [serviceId, setServiceId] = useState<string>(services[0]?.id ?? "");

  const selectedService = services.find((service) => service.id === serviceId);
  const isServiceClosed = selectedService?.status === "closed";

  const checkIn = useCheckIn();

  function getFriendlyErrorMessage(error: unknown): string {
    if (!(error instanceof Error)) {
      return "Unknown error";
    }

    if (error.message.includes("Member has already checked in for this service")) {
      return "This member has already been checked in for the selected service.";
    }

    if (error.message.includes("Cannot check in to a closed service")) {
      return "Check-ins are closed for the selected service.";
    }

    return error.message;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!serviceId || !memberId || !selectedService) {
      setMessage("Please select a service and member ID");
      return;
    }
    if (isServiceClosed) {
      setMessage("Check-ins are closed for the selected service.");
      return;
    }
    setLoading(true);
    setMessage(undefined);

    try {
      await checkIn.mutateAsync({
        member_id: memberId,
        service_id: serviceId,
        service_date: selectedService.service_date,
        service_type: selectedService.service_type as ServiceType,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        location_name: selectedService.service_location?.name,
      });

      setMessage("Check-in recorded.");
      onSuccess?.();
    } catch (err) {
      setMessage(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
      <p className="text-sm font-semibold text-slate-500">Manual check-in override</p>
      <form className="space-y-3" onSubmit={handleSubmit}>
        {isServiceClosed && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Check-ins are closed for this service. Reopen the service to record manual check-ins.
          </p>
        )}
        <div className="flex flex-col gap-1 text-sm font-medium text-slate-600">
          <label htmlFor="manual-checkin-service" className="text-sm font-medium text-slate-700">
            Service
          </label>
          <select
            id="manual-checkin-service"
            value={serviceId}
            onChange={(event) => setServiceId(event.target.value)}
            className="border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          >
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} ({service.service_type})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1 text-sm font-medium text-slate-600">
          <Input
            id="manual-checkin-member-id"
            label="Member ID"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            placeholder="Supabase member ID"
            disabled={isServiceClosed}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 text-sm font-medium text-slate-600">
            <Input
              id="manual-checkin-latitude"
              label="Latitude"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              disabled={isServiceClosed}
            />
          </div>
          <div className="flex flex-col gap-1 text-sm font-medium text-slate-600">
            <Input
              id="manual-checkin-longitude"
              label="Longitude"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              disabled={isServiceClosed}
            />
          </div>
        </div>
        {message && <p className="text-xs text-slate-600">{message}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading || isServiceClosed}>
            {loading ? "Saving..." : "Record Check-in"}
          </Button>
        </div>
      </form>
    </div>
  );
}
