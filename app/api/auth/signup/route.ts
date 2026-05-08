import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Self-service signup is disabled. A dashboard administrator must create your account.",
    },
    { status: 403 },
  );
}
