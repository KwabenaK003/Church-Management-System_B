"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

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
  const {
    data: service,
    isLoading: isServiceLoading,
    error: serviceError,
  } = useService(serviceId);
  const addToast = useToastStore((state) => state.addToast);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const {
    position,
    loading: locating,
    error: geolocationError,
    permissionState,
    requestPosition,
    clearError,
  } = useGeolocation();

  const isServiceClosed = service?.status === "closed";
  const hasInvalidService = Boolean(serviceError);
  const isInputDisabled =
    loading || isServiceClosed || !serviceId || hasInvalidService;
  const isSubmitDisabled =
    isInputDisabled || locating || !position;

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
      maximumAge: 30000,
    }).catch(() => {
      // The browser decides whether to show a native permission prompt again.
    });
  }, [requestPosition, serviceId]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        requestLocation();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [requestLocation]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!serviceId) {
      const message = "A service ID is required for check-in.";
      setStatus({ type: "error", message });
      addToast(message, "error");
      return;
    }

    if (isServiceClosed) {
      const message = "This service is closed for check-ins.";
      setStatus({ type: "error", message });
      addToast(message, "warning");
      return;
    }

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return;
    }

    setLoading(true);
    setStatus(null);
    clearError();

    try {
      const currentPosition =
        position ??
        (await requestPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        }));

      await checkIn.mutateAsync({
        search: trimmedQuery,
        service_id: serviceId,
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      });

      const successMessage = "Check-in recorded! Thank you for joining us today.";
      setStatus({ type: "success", message: successMessage });
      addToast(successMessage, "success");
      setQuery("");
    } catch (err) {
      const friendlyMessage = getFriendlyErrorMessage(err);
      setStatus({ type: "error", message: friendlyMessage });
      addToast(friendlyMessage, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-slate-900">Event check-in</h1>
          <p className="text-sm text-slate-500">
            Enter your name or email to check in. Your current location is required before this
            check-in can be submitted.
          </p>
        </div>

        {service && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <h2 className="text-sm font-semibold text-slate-800">{service.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {service.service_date
                ? new Date(service.service_date).toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : ""}
              {service.service_type ? ` • ${service.service_type}` : ""}
            </p>
          </div>
        )}

        {isServiceLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
            <Spinner size={16} className="text-[var(--blue-600)]" />
            <span>Loading service details...</span>
          </div>
        )}

        {!serviceId && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 space-y-1">
            <p className="font-semibold">No service specified</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              A valid check-in link with a service ID is required. Please scan the QR code displayed at the event or use the attendance link provided by your church administrators.
            </p>
          </div>
        )}

        {hasInvalidService && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 space-y-1">
            <p className="font-semibold">Service not found</p>
            <p className="text-xs text-red-800 leading-relaxed">
              This check-in link may be invalid, closed, or expired. Please confirm the link with church administrators.
            </p>
          </div>
        )}

        {isServiceClosed && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            This service is closed for check-ins.
          </p>
        )}

        {serviceId && !hasInvalidService && !position && (
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
            disabled={isInputDisabled}
            required
          />
          <Button type="submit" disabled={isSubmitDisabled} className="w-full">
            {locating
              ? "Requesting location..."
              : loading
                ? "Checking in..."
                : !position && serviceId && !hasInvalidService
                  ? "Waiting for location..."
                  : "Check in"}
          </Button>
        </form>

        {status && (
          <div
            role="status"
            aria-live="polite"
            className={`rounded-lg px-3 py-2.5 text-xs font-medium ${
              status.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {status.message}
          </div>
        )}

        {serviceId && !hasInvalidService && (
          <div className="pt-2 text-center border-t border-slate-100">
            <p className="text-xs text-slate-500">
              First time visiting or guest?{" "}
              <Link
                href={`/attendance/${serviceId}/check-in`}
                className="font-medium text-[var(--blue-600)] hover:underline"
              >
                Visitor check-in &rarr;
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
