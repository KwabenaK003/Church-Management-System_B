"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
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
  const {
    position,
    loading: locating,
    error: geolocationError,
    permissionState,
    requestPosition,
    clearError,
  } = useGeolocation();

  const isServiceClosed = service?.status === "closed";
  const isFormDisabled =
    loading || locating || isServiceClosed || !serviceId || !position;
  const locationMessage = geolocationError
    ? geolocationError
    : permissionState === "denied"
      ? "Location is blocked for this site. Enable location in your browser settings, then try again."
      : permissionState === "prompt"
        ? "Allow location in your browser notification to continue."
    : locating
      ? "Requesting your current location..."
      : "We request your location each time this page loads.";

  const requestLocation = useCallback(() => {
    if (!serviceId) {
      return;
    }

    requestPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }).catch(() => {
      // The browser decides whether to show a native permission prompt again.
    });
  }, [requestPosition, serviceId]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    const handlePageShow = () => {
      requestLocation();
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [requestLocation]);

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
          Enter your name or email to check in. Your current location is required before this
          check-in can be submitted.
        </p>
        {isServiceClosed && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            This service is closed for check-ins.
          </p>
        )}
        {!position && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
            <p>{locationMessage}</p>
            <p className="mt-1 text-xs text-amber-700">
              If the browser prompt does not appear, use the button below. Some browsers will
              not show the native prompt again after a previous block decision.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={requestLocation}
                disabled={locating}
              >
                Request location again
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Refresh page
              </Button>
            </div>
          </div>
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
