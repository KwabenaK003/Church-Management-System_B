import { redirect } from "next/navigation";

export default function LegacyCheckInPage() {
  redirect("/attendance/check-in");
}
