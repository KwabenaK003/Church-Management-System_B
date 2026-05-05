"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChurchIcon, WarningIcon } from "@phosphor-icons/react";

import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { useGeolocation } from "@/hooks/useGeolocation";

const CLOSED_SERVICE_ERROR = "Cannot check in to a closed service";
const DUPLICATE_CHECK_IN_ERROR = "Member has already checked in for this service";

type CheckInContext = {
  service: {
    id: string;
    name: string;
    service_date: string;
    service_type: string;
    status: "open" | "closed";
  };
  members: Array<{
    id: string;
    first_name: string;
    last_name: string;
  }>;
};

function getFriendlyErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "We could not complete your check-in right now.";
  }

  if (error.message.includes(DUPLICATE_CHECK_IN_ERROR)) {
    return "You have already checked in for this service.";
  }

  if (error.message.includes(CLOSED_SERVICE_ERROR)) {
    return "This service is closed for check-in.";
  }

  if (error.message.includes("Service not found")) {
    return "This check-in page could not be found.";
  }

  return error.message;
}

export function PublicCheckInPageClient({
  serviceId,
}: {
  serviceId: string;
}) {
  const router = useRouter();

  const [context, setContext] = useState<CheckInContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [submitError, setSubmitError] = useState<string>();
  const [attendeeType, setAttendeeType] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>();
  const { position, loading: locating, requestPosition, clearError } = useGeolocation();

  useEffect(() => {
    let isMounted = true;

    async function loadContext() {
      try {
        const data = await apiFetch<CheckInContext>(`/api/public/check-in/${serviceId}`);

        if (!isMounted) {
          return;
        }

        setContext(data);
        setLoadError(undefined);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setLoadError(getFriendlyErrorMessage(error));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadContext();

    return () => {
      isMounted = false;
    };
  }, [serviceId]);

  useEffect(() => {
    requestPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }).catch(() => {
      // The browser controls whether the permission dialog appears again.
    });
  }, [requestPosition]);

  function getSelectedAttendeeName() {
    if (attendeeType === "visitor") {
      return visitorName.trim();
    }

    const selectedMember = context?.members.find((member) => member.id === selectedMemberId);
    return selectedMember
      ? `${selectedMember.first_name} ${selectedMember.last_name}`.trim()
      : "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(undefined);
    setSuccessMessage(undefined);

    if (!attendeeType) {
      setSubmitError("Please select either member or visitor.");
      return;
    }

    if (attendeeType === "member" && !selectedMemberId) {
      setSubmitError("Please select your name from the member list.");
      return;
    }

    if (attendeeType === "visitor") {
      if (!visitorName.trim() || !visitorEmail.trim() || !visitorPhone.trim()) {
        setSubmitError("Please fill in your name, email, and phone number.");
        return;
      }
    }

    setIsSubmitting(true);
    clearError();

    try {
      const currentPosition =
        position ??
        (await requestPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }));

      if (attendeeType === "member") {
        await apiFetch(`/api/public/check-in/${serviceId}`, {
          method: "POST",
          body: {
            attendeeType: "member",
            memberId: selectedMemberId,
            latitude: currentPosition.coords.latitude,
            longitude: currentPosition.coords.longitude,
          },
        });
      } else {
        await apiFetch(`/api/public/check-in/${serviceId}`, {
          method: "POST",
          body: {
            attendeeType: "visitor",
            name: visitorName.trim(),
            email: visitorEmail.trim(),
            phone: visitorPhone.trim(),
            latitude: currentPosition.coords.latitude,
            longitude: currentPosition.coords.longitude,
          },
        });
      }

      const attendeeName = getSelectedAttendeeName();
      setSuccessMessage(
        `Welcome, ${attendeeName} to Bubiashie English Service Church. Enjoy today's service and stay blessed!`,
      );

      window.setTimeout(() => {
        router.replace(`/attendance/${serviceId}`);
      }, 2500);
    } catch (error) {
      setSubmitError(getFriendlyErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--page-bg)] px-4 py-12">
        <Spinner size={36} className="text-[var(--blue-600)]" />
      </div>
    );
  }

  if (loadError || !context) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--page-bg)] px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-[var(--border-color)] bg-white p-8 text-center shadow-[var(--shadow-md)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--danger-bg)]">
            <WarningIcon size={24} className="text-[var(--danger-text)]" />
          </div>
          <p className="mt-5 text-lg font-semibold text-slate-900">Service not found</p>
          <p className="mt-2 text-sm text-slate-500">
            {loadError ?? "This check-in link may be invalid or expired."}
          </p>
        </div>
      </div>
    );
  }

  if (context.service.status === "closed") {
    return (
      <div className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white border border-[var(--border-color)] rounded-3xl p-8 shadow-[var(--shadow-md)] text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--danger-bg)] flex items-center justify-center">
            <WarningIcon size={24} className="text-[var(--danger-text)]" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">Service Closed</p>
            <p className="text-sm text-slate-500 mt-1">
              Check-in for this service has been closed. Please contact a church admin if you need help.
            </p>
          </div>
          <Link
            href={`/attendance/${serviceId}`}
            className="inline-flex text-sm font-medium text-[var(--blue-600)] hover:text-[var(--blue-700)]"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--blue-600)]">
            <ChurchIcon size={28} color="white" weight="fill" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-slate-900">Check In</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Please confirm your attendance for today&apos;s church service. This page requests your
              location each time it opens for this check-in.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-[var(--border-color)] bg-white p-6 shadow-[var(--shadow-md)]"
        >
          <Select
            label="Attendee Type"
            value={attendeeType}
            onChange={(event) => {
              setAttendeeType(event.target.value);
              setSubmitError(undefined);
              setSelectedMemberId("");
              setVisitorName("");
              setVisitorEmail("");
              setVisitorPhone("");
            }}
            placeholder="Select member or visitor"
            options={[
              { value: "member", label: "Member" },
              { value: "visitor", label: "Visitor" },
            ]}
            required
          />

          {attendeeType === "member" && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">
                Select your name from the member list below.
              </p>
              <div className="max-h-64 overflow-y-auto rounded-xl border border-[var(--border-color)]">
                {context.members.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-slate-500">
                    No members are available for check-in yet.
                  </p>
                ) : (
                  context.members.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => setSelectedMemberId(member.id)}
                      className={`flex w-full items-center justify-between border-b border-[var(--border-color)] px-4 py-3 text-left text-sm last:border-b-0 ${
                        selectedMemberId === member.id
                          ? "bg-[var(--blue-50)] font-medium text-[var(--blue-700)]"
                          : "bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>
                        {member.first_name} {member.last_name}
                      </span>
                      {selectedMemberId === member.id && (
                        <span className="text-xs uppercase tracking-wide">Selected</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {attendeeType === "visitor" && (
            <div className="space-y-4">
              <Input
                label="Name"
                value={visitorName}
                onChange={(event) => setVisitorName(event.target.value)}
                placeholder="Enter your full name"
                required
              />
              <Input
                label="Email"
                type="email"
                value={visitorEmail}
                onChange={(event) => setVisitorEmail(event.target.value)}
                placeholder="Enter your email address"
                required
              />
              <Input
                label="Phone Number"
                value={visitorPhone}
                onChange={(event) => setVisitorPhone(event.target.value)}
                placeholder="Enter your phone number"
                required
              />
            </div>
          )}

          {submitError && (
            <div className="rounded-lg border border-red-200 bg-[var(--danger-bg)] px-4 py-3 text-sm text-[var(--danger-text)]">
              {submitError}
            </div>
          )}

          {successMessage && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {successMessage}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || locating || !attendeeType || !!successMessage}
            className="w-full"
          >
            {locating ? "Requesting location..." : isSubmitting ? "Submitting..." : "Submit"}
          </Button>

          <div className="text-center">
            <Link
              href={`/attendance/${serviceId}`}
              className="text-sm font-medium text-[var(--blue-600)] hover:text-[var(--blue-700)]"
            >
              Back to home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
