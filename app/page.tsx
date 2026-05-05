import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Church Management System",
  description: "Manage services, attendance, members, visitors, and church operations in one place.",
};

export default function Home() {
  redirect("/dashboard");
}
