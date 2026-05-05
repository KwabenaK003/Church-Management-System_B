"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

import { useCheckIn, useService } from "@/lib/hooks/useAttendance";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useToastStore } from "@/lib/stores/toastStore";

const DUPLICATE_CHECK_IN_ERROR = "Member has already checked in for this service";
const CLOSED_SERVICE_CHECK_IN_ERROR = "Cannot check in to a closed service";

function getFriendlyErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "We could not complete your check-in. Please try again.";
  }

  if (error.message.includes(DUPLICATE_CHECK_IN_ERROR)) {
    return "You have already checked in for this service.";
  }

  if (error.message.includes(CLOSED_SERVICE_CHECK_IN_ERROR)) {
    return "This service is closed for check-ins.";
  }

  return error.message;
}

export function CheckInPageClient() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("serviceId") ?? "";

  const checkIn = useCheckIn();
  const { data: service } = useService(serviceId);
  const addToast = useToastStore((state) => state.addToast);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>();
  const { position, loading: locating, requestPosition, clearError } = useGeolocation();

  const isServiceClosed = service?.status === "closed";
  const isFormDisabled = loading || isServiceClosed || !serviceId;

  useEffect(() => {
    if (!serviceId) {
      return;
    }

    requestPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }).catch(() => {
      // The browser controls whether the permission dialog appears again.
    });
  }, [requestPosition, serviceId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isServiceClosed) {
      const message = "This service is closed for check-ins.";
      setStatus(message);
      addToast(message, "warning");
      return;
    }

    setLoading(true);
    setStatus(undefined);
    clearError();

    try {
      const currentPosition =
        position ??
        (await requestPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }));

      await checkIn.mutateAsync({
        search: query,
        service_id: serviceId,
        service_date: new Date().toISOString(),
        service_type: "Saturday",
        location_name: "QR check-in",
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      });

      setStatus("Check-in recorded! Thank you.");
      setQuery("");
    } catch (err) {
      const friendlyMessage = getFriendlyErrorMessage(err);
      setStatus(friendlyMessage);
      addToast(friendlyMessage, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">Event check-in</h1>
        <p className="text-sm text-slate-500">
          Enter your name or email to check in. This page requests your current location each time it
          opens so we can record where you are standing.
        </p>
        {isServiceClosed && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            This service is closed for check-ins.
          </p>
        )}
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Input
            label="Full name or email"
            placeholder="Full name or email"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            disabled={isFormDisabled}
            required
          />
          <Button type="submit" disabled={isFormDisabled}>
            {locating ? "Requesting location..." : loading ? "Checking in..." : "Check in"}
          </Button>
        </form>
        {status && <p className="text-xs text-slate-500">{status}</p>}
      </div>
    </main>
  );
}
