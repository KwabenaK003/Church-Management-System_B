"use client";

import dynamic from "next/dynamic";
import {
  format,
  differenceInYears,
} from "date-fns";

import { Member } from "@/types";
import { MemberGrowthChart } from "@/components/reports/MemberGrowthChart";

interface MemberInsightsGridProps {
  members: Member[];
}

const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), {
  ssr: false,
}) as any;
const Pie = dynamic(() => import("recharts").then((mod) => mod.Pie), {
  ssr: false,
}) as any;
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell), {
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
const BarChart = dynamic(
  () => import("recharts").then((mod) => mod.BarChart),
  { ssr: false },
) as any;
const PieChart = dynamic(
  () => import("recharts").then((mod) => mod.PieChart),
  { ssr: false },
) as any;
const CartesianGrid = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false },
) as any;
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false },
) as any;

const GENDER_COLOURS = ["#8a2548", "#d97706", "#0f766e", "#9c8e82"];
const STATUS_COLOURS = ["#8a2548", "#6b5e54", "#d97706", "#b22026"];

const AGE_BUCKETS = [
  { label: "Under 18", min: 0, max: 17 },
  { label: "18-25", min: 18, max: 25 },
  { label: "26-35", min: 26, max: 35 },
  { label: "36-45", min: 36, max: 45 },
  { label: "46-60", min: 46, max: 60 },
  { label: "60+", min: 61, max: Number.POSITIVE_INFINITY },
] as const;

function parseDate(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function normaliseGender(value?: string) {
  const gender = value?.trim().toLowerCase();

  if (gender === "male") {
    return "Male";
  }

  if (gender === "female") {
    return "Female";
  }

  if (!gender) {
    return "Unspecified";
  }

  return "Other";
}

function formatTooltipValue(value: any) {
  return [Number(value).toLocaleString(), "Members"];
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center text-sm text-[var(--text-muted)]">
      {message}
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-[var(--text-secondary)]">
          {title}
        </p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p>
      </div>
    </div>
  );
}

export function MemberInsightsGrid({ members }: MemberInsightsGridProps) {
  const genderCounts = members.reduce<Record<string, number>>(
    (accumulator, member) => {
      const label = normaliseGender(member.gender);
      accumulator[label] = (accumulator[label] ?? 0) + 1;
      return accumulator;
    },
    {},
  );

  const genderData = ["Male", "Female", "Other", "Unspecified"]
    .map((label, index) => ({
      label,
      total: genderCounts[label] ?? 0,
      fill: GENDER_COLOURS[index],
    }))
    .filter((item) => item.total > 0);

  const ages = members
    .map((member) => parseDate(member.date_of_birth))
    .filter((value): value is Date => value !== null)
    .map((dateOfBirth) => differenceInYears(new Date(), dateOfBirth))
    .filter((age) => age >= 0 && age < 120);

  const ageData = AGE_BUCKETS.map((bucket) => ({
    label: bucket.label,
    total: ages.filter((age) => age >= bucket.min && age <= bucket.max).length,
  }));

  const averageAge =
    ages.length > 0
      ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length)
      : null;

  const statusOrder: Array<{
    label: string;
    value: Member["membership_status"];
    fill: string;
  }> = [
    { label: "Active", value: "active", fill: STATUS_COLOURS[0] },
    { label: "Inactive", value: "inactive", fill: STATUS_COLOURS[1] },
    { label: "Transferred", value: "transferred", fill: STATUS_COLOURS[2] },
    { label: "Deceased", value: "deceased", fill: STATUS_COLOURS[3] },
  ];

  const statusData = statusOrder.map((status) => ({
    label: status.label,
    total: members.filter((member) => member.membership_status === status.value)
      .length,
    fill: status.fill,
  }));

  const growthMap = members.reduce<Record<string, number>>(
    (accumulator, member) => {
      const joinedOn = parseDate(member.join_date);
      if (!joinedOn) {
        return accumulator;
      }

      const key = format(joinedOn, "yyyy-MM");
      accumulator[key] = (accumulator[key] ?? 0) + 1;
      return accumulator;
    },
    {},
  );

  const growthData = Object.entries(growthMap)
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-6)
    .map(([label, total]) => ({
      label: format(new Date(`${label}-01`), "MMM yyyy"),
      total,
    }));

  const membersWithBirthDate = ages.length;
  const unspecifiedGenderCount = genderCounts.Unspecified ?? 0;

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] p-5">
        <SectionHeader title="Gender Distribution" subtitle="" />
        {genderData.length === 0 ? (
          <EmptyChartState message="No gender data available yet." />
        ) : (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={genderData}
                  dataKey="total"
                  nameKey="label"
                  innerRadius={72}
                  outerRadius={102}
                  paddingAngle={3}
                >
                  {genderData.map((entry) => (
                    <Cell key={entry.label} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={formatTooltipValue} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {genderData.map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg bg-[var(--neutral-bg)] px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                      {item.label}
                    </p>
                  </div>
                  <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                    {item.total}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] p-5">
        <SectionHeader title="Age Distribution" subtitle="" />
        {membersWithBirthDate === 0 ? (
          <EmptyChartState message="Add dates of birth to see age distribution." />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ageData} barSize={28}>
              <CartesianGrid stroke="#f2ebe2" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#9c8e82" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9c8e82" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                formatter={formatTooltipValue}
                cursor={{ fill: "#faf5ef" }}
              />
              <Bar dataKey="total" fill="#0f766e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] p-5">
        <SectionHeader
          title="Membership Status"
          subtitle="Current roster health across active and inactive member records."
        />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={statusData}
            layout="vertical"
            margin={{ top: 8, right: 8, left: 16, bottom: 8 }}
          >
            <CartesianGrid
              stroke="#f2ebe2"
              strokeDasharray="3 3"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "#9c8e82" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 12, fill: "#9c8e82" }}
              axisLine={false}
              tickLine={false}
              width={88}
            />
            <Tooltip
              formatter={formatTooltipValue}
              cursor={{ fill: "#faf5ef" }}
            />
            <Bar dataKey="total" radius={[0, 6, 6, 0]}>
              {statusData.map((entry) => (
                <Cell key={entry.label} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] p-5">
        <SectionHeader
          title="Member Growth"
          subtitle="New members added over the last six recorded join months."
        />
        {growthData.length === 0 ? (
          <EmptyChartState message="No join-date data available yet." />
        ) : (
          <MemberGrowthChart data={growthData} />
        )}
      </div>
    </div>
  );
}
