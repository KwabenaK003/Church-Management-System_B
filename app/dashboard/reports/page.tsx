"use client";

import dynamic from "next/dynamic";
import { useMembers } from "@/lib/hooks/useMembers";
import { useServices, useAttendance } from "@/lib/hooks/useAttendance";
import { useDonations, useExpenses } from "@/lib/hooks/useFinance";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { CalendarCheck, ChartBar, CurrencyDollar } from "@phosphor-icons/react";
import { format } from "date-fns";

const BarChart = dynamic(
  () => import("recharts").then((mod) => mod.BarChart),
  { ssr: false },
) as any;
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), {
  ssr: false,
}) as any;
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), {
  ssr: false,
}) as any;
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), {
  ssr: false,
}) as any;
const Tooltip = dynamic(
  () => import("recharts").then((mod) => mod.Tooltip),
  { ssr: false },
) as any;
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false },
) as any;
const CartesianGrid = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false },
) as any;

export default function ReportsPage() {
  const { data: members, isLoading: membersLoading } = useMembers();
  const { data: services } = useServices();
  const { data: attendance } = useAttendance();
  const { data: donations } = useDonations();
  const { data: expenses } = useExpenses();

  const attendanceData = (services?.slice(0, 8) ?? []).map((s) => ({
    name: format(new Date(s.service_date), "dd MMM"),
    count: attendance?.filter((a) => a.service_id === s.id).length ?? 0,
  })).reverse();

  const growthData = (() => {
    const map: Record<string, number> = {};
    members?.forEach((m) => {
      const key = format(new Date(m.join_date), "MMM yyyy");
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count })).slice(-8);
  })();

  const financeData = (() => {
    const map: Record<string, { name: string; income: number; expenses: number }> = {};
    donations?.forEach((d) => {
      const key = format(new Date(d.donation_date), "MMM yyyy");
      if (!map[key]) map[key] = { name: key, income: 0, expenses: 0 };
      map[key].income += d.amount;
    });
    expenses?.forEach((e) => {
      const key = format(new Date(e.expense_date), "MMM yyyy");
      if (!map[key]) map[key] = { name: key, income: 0, expenses: 0 };
      map[key].expenses += e.amount;
    });
    return Object.values(map).slice(-8);
  })();

  function downloadCsv(data: object[], filename: string) {
    const keys = Object.keys(data[0] ?? {});
    const rows = [keys.join(","), ...data.map((r: any) => keys.map((k) => r[k]).join(","))];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  if (membersLoading) return <div className="flex justify-center items-center h-64"><Spinner size={32} className="text-[var(--blue-600)]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Church performance analytics and data exports</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => members && downloadCsv(members, "members.csv")} className="text-sm border border-[var(--border-color)] bg-white rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors">
            Export Members CSV
          </button>
          <button onClick={() => donations && downloadCsv(donations, "donations.csv")} className="text-sm border border-[var(--border-color)] bg-white rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors">
            Export Donations CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Attendance Trend */}
        <div className="bg-white border border-[var(--border-color)] rounded-xl p-5">
          <p className="text-sm font-semibold text-slate-700 mb-4">Attendance — Last 8 Services</p>
          {attendanceData.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck size={24} />}
              title="No attendance data yet"
              description="Create services and record check-ins to see attendance trends here."
            />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={attendanceData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#F1F5F9" }} contentStyle={{ border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Member Growth */}
        <div className="bg-white border border-[var(--border-color)] rounded-xl p-5">
          <p className="text-sm font-semibold text-slate-700 mb-4">Member Growth (by Join Month)</p>
          {growthData.length === 0 ? (
            <EmptyState
              icon={<ChartBar size={24} />}
              title="No member growth data yet"
              description="Add members with join dates to visualize membership growth over time."
            />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={growthData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#F1F5F9" }} contentStyle={{ border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Income vs Expenses */}
        <div className="bg-white border border-[var(--border-color)] rounded-xl p-5 lg:col-span-2">
          <p className="text-sm font-semibold text-slate-700 mb-4">Income vs Expenses (Monthly)</p>
          {financeData.length === 0 ? (
            <EmptyState
              icon={<CurrencyDollar size={24} />}
              title="No finance data yet"
              description="Record donations or expenses to compare monthly financial activity."
            />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={financeData} barSize={22} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#F1F5F9" }} contentStyle={{ border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="income" name="Income" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
