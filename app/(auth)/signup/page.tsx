import type { Metadata } from "next";

import { SignupPageClient } from "./SignupPageClient";

export const metadata: Metadata = {
  title: "Admin Sign Up",
  description: "Create an admin account for the church management dashboard.",
};

export default function SignupPage() {
  return <SignupPageClient />;
}
