"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { WarningCircle, CalendarCheckIcon } from "@phosphor-icons/react";

import { useMembers } from "@/lib/hooks/useMembers";
import { useVisitors } from "@/lib/hooks/useVisitors";
import { useServices, useAttendance } from "@/lib/hooks/useAttendance";

import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { UpcomingBirthdays } from "@/components/dashboard/UpcomingBirthdays";
import { MemberInsightsGrid } from "@/components/dashboard/MemberInsightsGrid";

function SummaryCard({
  label,
  value,
  accentColor,
}: {
  label: string;
  accentColor: string;
  value: string | number;
}) {
  return (
    <div
      className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] p-6 transition-all"
    >
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div
            className="h-2 w-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: accentColor }}
          />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </p>
        </div>
        <p className="font-serif text-4xl font-normal tracking-tight text-slate-900 sm:text-5xl">
          {value}
        </p>
      </div>
      <div className="mt-8 h-1 w-full rounded-full bg-[var(--neutral-bg)] overflow-hidden">
        <div
          className="h-full rounded-full w-1/3 opacity-75"
          style={{ backgroundColor: accentColor }}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: members, isLoading: membersLoading } = useMembers();
  const { data: visitors, isLoading: visitorsLoading } = useVisitors();
  const { data: services, isLoading: servicesLoading } = useServices();
  const { data: attendance } = useAttendance();

  const activeMembers =
    members?.filter((member) => member.membership_status === "active").length ?? 0;
  const pendingVisitors =
    visitors?.filter((visitor) => visitor.follow_up_status === "pending").length ?? 0;
  const servicesThisMonth =
    services?.filter((service) => {
      const date = new Date(service.service_date);
      const now = new Date();
      return (
        date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      );
    }).length ?? 0;
  const recentServices = services?.slice(0, 5) ?? [];

  if (membersLoading || visitorsLoading || servicesLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[var(--page-bg)]">
        <Spinner size={32} className="text-[var(--chart-2)]" />
      </div>
    );
  }

  return (
    <div className="min-h-full space-y-8 bg-[var(--page-bg)] pb-12">
      <div>
        <h1 className="font-serif text-4xl text-slate-900 tracking-tight">
          Church Overview
        </h1>
        <p className="mt-2 text-md text-slate-500">
          Welcome back. Here is a summary of the church&apos;s recent activities and presence.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Active Members"
          value={activeMembers}
          accentColor="var(--chart-1)"
        />
        <SummaryCard
          label="Services This Month"
          value={servicesThisMonth}
          accentColor="var(--chart-3)"
        />
        <SummaryCard
          label="Total Attendance"
          value={attendance?.length ?? 0}
          accentColor="var(--chart-2)"
        />
        <SummaryCard
          label="Total Visitors"
          value={visitors?.length ?? 0}
          accentColor="var(--chart-4)"
        />
      </div>

      {pendingVisitors > 0 && (
        <Link
          href="/dashboard/visitors"
          className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 transition-colors hover:bg-amber-100"
        >
          <WarningCircle size={24} className="text-amber-600" weight="fill" />
          <p className="text-sm font-medium text-amber-900">
            {pendingVisitors} visitor{pendingVisitors === 1 ? "" : "s"} pending follow-up. Click here to review.
          </p>
        </Link>
      )}


      <div className="pt-2">
        <MemberInsightsGrid members={members ?? []} />
      </div>

            <UpcomingBirthdays members={members ?? []} />


       <div
        className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)]"
      >
        <div className="border-b border-[var(--border-color)] px-6 py-5">
          <h2 className="font-serif text-2xl text-slate-800">Recent Services</h2>
        </div>
        {recentServices.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<CalendarCheckIcon size={28} />}
              title="No services found"
              description="No services have been recorded yet."
            />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border-color)] bg-[var(--panel-bg)] text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Service</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 text-right font-semibold">Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {recentServices.map((service) => {
                const count =
                  attendance?.filter((entry) => entry.service_id === service.id).length ?? 0;
                return (
                  <tr
                    key={service.id}
                    className="transition-colors hover:bg-[var(--neutral-bg)]"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {service.name}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {format(new Date(service.service_date), "dd MMM yyyy")}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {service.service_type}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-900">
                      {count}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
