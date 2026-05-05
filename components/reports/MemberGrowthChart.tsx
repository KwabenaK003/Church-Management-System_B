"use client";

import dynamic from "next/dynamic";

interface MemberGrowthChartProps {
  data: { label: string; total: number }[];
}

const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false },
) as any;
const LineChart = dynamic(
  () => import("recharts").then((mod) => mod.LineChart),
  { ssr: false },
) as any;
const CartesianGrid = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false },
) as any;
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
const Line = dynamic(() => import("recharts").then((mod) => mod.Line), {
  ssr: false,
}) as any;

export function MemberGrowthChart({ data }: MemberGrowthChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#f2ebe2" strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={{ fill: "#9c8e82", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#9c8e82", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ stroke: "#d8c8b8" }} />
        <Line type="monotone" dataKey="total" stroke="#8a2548" strokeWidth={2.5} dot={{ r: 3.5, fill: "#8a2548", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 5, fill: "#8a2548", stroke: "#fff", strokeWidth: 2 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
