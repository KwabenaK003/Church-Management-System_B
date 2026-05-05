"use client";

import { useEffect, useState } from "react";
import {
  ChurchIcon,
  MapPinAreaIcon,
  WarningIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { usePublicMembers } from "@/lib/hooks/useMembers";
import { useService, useCheckIn } from "@/lib/hooks/useAttendance";
import { getPublicChurchSettings } from "@/lib/services/settingsService";

const CLOSED_SERVICE_ERROR = "Cannot check in to a closed service";
const DUPLICATE_CHECK_IN_ERROR = "Member has already checked in for this service";

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusMetres = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return earthRadiusMetres * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function PublicCheckInPageClient({
  serviceId,
}: {
  serviceId: string;
}) {
  const { data: service, isLoading: serviceLoading, error: serviceError } = useService(serviceId);
  const { data: members, isLoading: membersLoading } = usePublicMembers();
  const checkIn = useCheckIn();

  const [step, setStep] = useState<"location" | "select" | "done" | "blocked">("location");
  const [churchSettings, setChurchSettings] = useState<{
    latitude?: number;
    longitude?: number;
    radius_metres: number;
  } | null>(null);
  const [geoError, setGeoError] = useState<string>();
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>();
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState<string>();

  useEffect(() => {
    getPublicChurchSettings().then((data) => {
      if (data) {
        setChurchSettings(data);
      }
    });
  }, []);

  function requestLocation() {
    if (!navigator.geolocation) {
      setGeoError("Your browser does not support geolocation.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });

        if (churchSettings?.latitude && churchSettings?.longitude) {
          const distance = getDistance(
            latitude,
            longitude,
            churchSettings.latitude,
            churchSettings.longitude,
          );

          if (distance > churchSettings.radius_metres) {
            setStep("blocked");
          } else {
            setStep("select");
          }
        } else {
          setStep("select");
        }
      },
      (err) => {
        setGeoError(`Could not get your location: ${err.message}`);
      },
      { enableHighAccuracy: true },
    );
  }

  async function handleCheckIn() {
    if (!selectedMemberId) {
      return;
    }

    setCheckInMessage(undefined);

    try {
      await checkIn.mutateAsync({
        member_id: selectedMemberId,
        service_id: serviceId,
        service_date: new Date().toISOString(),
        service_type: "Saturday",
        latitude: userCoords?.lat,
        longitude: userCoords?.lng,
      });
      setSubmitted(true);
      setStep("done");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to check you in right now.";

      if (message === DUPLICATE_CHECK_IN_ERROR) {
        setCheckInMessage("You have already checked in for this service.");
        return;
      }

      if (message === CLOSED_SERVICE_ERROR) {
        setCheckInMessage("Check-in is closed for this service.");
        return;
      }

      setCheckInMessage(message);
    }
  }

  const filteredMembers = members?.filter((member) => {
    const query = search.toLowerCase();
    return (
      member.first_name.toLowerCase().includes(query) ||
      member.last_name.toLowerCase().includes(query)
    );
  });

  if (serviceLoading || membersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={36} className="text-[var(--blue-600)]" />
      </div>
    );
  }

  if (serviceError || !service) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-800">Service not found</p>
          <p className="text-sm text-slate-500 mt-1">This check-in link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  if (service.status === "closed") {
    return (
      <div className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white border border-[var(--border-color)] rounded-2xl p-6 shadow-[var(--shadow-md)] text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-[var(--danger-bg)] flex items-center justify-center">
            <WarningIcon size={24} className="text-[var(--danger-text)]" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">Service Closed</p>
            <p className="text-sm text-slate-500 mt-1">
              Check-in for this service has been closed. Please contact a church admin if you need help.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--blue-600)] flex items-center justify-center">
            <ChurchIcon size={24} color="white" weight="fill" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-slate-900">{service.name}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {new Date(service.service_date).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="bg-white border border-[var(--border-color)] rounded-2xl p-6 shadow-[var(--shadow-md)]">
          {step === "location" && (
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--blue-50)] flex items-center justify-center">
                <MapPinAreaIcon size={24} className="text-[var(--blue-600)]" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Location Verification Required</p>
                <p className="text-sm text-slate-500 mt-1">
                  We need to confirm you are at the service location before checking you in.
                </p>
              </div>
              {geoError && (
                <div className="w-full bg-[var(--danger-bg)] text-[var(--danger-text)] rounded-lg px-4 py-3 text-sm border border-red-200">
                  {geoError}
                </div>
              )}
              <Button onClick={requestLocation} className="w-full">
                <MapPinAreaIcon size={16} />
                Allow Location Access
              </Button>
            </div>
          )}

          {step === "blocked" && (
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--danger-bg)] flex items-center justify-center">
                <WarningIcon size={24} className="text-[var(--danger-text)]" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">You are outside the allowed zone</p>
                <p className="text-sm text-slate-500 mt-1">
                  You must be within {churchSettings?.radius_metres ?? 500} metres of the service location to check in.
                </p>
              </div>
            </div>
          )}

          {step === "select" && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-700">Select your name to check in</p>
              <label htmlFor="member-search" className="sr-only">
                Search your name
              </label>
              <input
                id="member-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search your name..."
                className="w-full border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <div className="border border-[var(--border-color)] rounded-lg divide-y divide-[var(--border-color)] max-h-60 overflow-y-auto">
                {filteredMembers?.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setSelectedMemberId(member.id)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      selectedMemberId === member.id
                        ? "bg-[var(--blue-50)] text-[var(--blue-700)] font-medium"
                        : "hover:bg-slate-50 text-slate-800"
                    }`}
                  >
                    {member.first_name} {member.last_name}
                  </button>
                ))}
                {filteredMembers?.length === 0 && (
                  <p className="px-4 py-3 text-sm text-slate-400">No members found</p>
                )}
              </div>
              {checkInMessage && (
                <div className="rounded-lg border border-red-200 bg-[var(--danger-bg)] px-4 py-3 text-sm text-[var(--danger-text)]">
                  {checkInMessage}
                </div>
              )}
              <Button
                onClick={handleCheckIn}
                disabled={!selectedMemberId || checkIn.isPending}
                className="w-full"
              >
                {checkIn.isPending ? "Checking in..." : "Confirm Check-In"}
              </Button>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircleIcon size={24} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Check-in successful</p>
                <p className="text-sm text-slate-500 mt-1">
                  {submitted
                    ? "Thank you for checking in. Have a wonderful service."
                    : "Your check-in has been recorded."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
