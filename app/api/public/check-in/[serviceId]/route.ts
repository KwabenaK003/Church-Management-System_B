import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Context = { params: Promise<{ serviceId: string }> };

// GET — load check-in context (service details + member list)
export async function GET(_: NextRequest, ctx: Context) {
  const { serviceId } = await ctx.params;

  const { data: service, error: serviceError } = await supabaseAdmin
    .from("services")
    .select("id, name, service_date, service_type, status")
    .eq("id", serviceId)
    .maybeSingle();

  if (serviceError || !service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const { data: members } = await supabaseAdmin
    .from("members")
    .select("id, first_name, last_name")
    .eq("membership_status", "active")
    .order("last_name");

  const { data: churchSettings } = await supabaseAdmin
    .from("church_settings")
    .select("latitude, longitude, radius_metres")
    .limit(1)
    .single();

  return NextResponse.json({
    service,
    members:        members ?? [],
    churchSettings: churchSettings ?? null,
  });
}

// POST — submit a check-in
export async function POST(req: NextRequest, ctx: Context) {
  const { serviceId } = await ctx.params;
  const body = await req.json();
  const { memberId, search, latitude, longitude } = body;

  // Verify service is open
  const { data: service, error: serviceError } = await supabaseAdmin
    .from("services")
    .select("id, status")
    .eq("id", serviceId)
    .maybeSingle();

  if (serviceError || !service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }
  if (service.status === "closed") {
    return NextResponse.json(
      { error: "Cannot check in to a closed service" },
      { status: 400 }
    );
  }

  // Resolve member
  let finalMemberId = memberId;
  if (!finalMemberId && search) {
    const { data: found } = await supabaseAdmin
      .from("members")
      .select("id")
      .or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
      )
      .eq("membership_status", "active")
      .limit(1);

    if (!found || found.length === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    finalMemberId = found[0].id;
  }

  if (!finalMemberId) {
    return NextResponse.json(
      { error: "memberId or search is required" },
      { status: 400 }
    );
  }

  // Check for duplicate
  const { data: existing } = await supabaseAdmin
    .from("attendance")
    .select("id")
    .eq("member_id", finalMemberId)
    .eq("service_id", serviceId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Member has already checked in for this service" },
      { status: 409 }
    );
  }

  // Insert check-in
  const { error } = await supabaseAdmin.from("attendance").insert({
    member_id:     finalMemberId,
    service_id:    serviceId,
    latitude,
    longitude,
    checked_in_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}