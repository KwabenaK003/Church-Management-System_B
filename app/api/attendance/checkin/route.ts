import { NextRequest, NextResponse } from "next/server";
// import { supabaseAdmin } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { member_id, service_id, latitude, longitude, search } = body;

  if (!service_id) {
    return NextResponse.json({ error: "service_id is required" }, { status: 400 });
  }

  // Check service exists and is open
  const { data: service, error: serviceError } = await supabaseAdmin
    .from("services")
    .select("id, status")
    .eq("id", service_id)
    .maybeSingle();

  if (serviceError || !service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }
  if (service.status === "closed") {
    return NextResponse.json({ error: "Cannot check in to a closed service" }, { status: 400 });
  }

  // Resolve member by search if member_id not provided
  let finalMemberId = member_id;
  if (!finalMemberId && search) {
    const { data: members } = await supabaseAdmin
      .from("members")
      .select("id")
      .or(
        `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
      )
      .eq("membership_status", "active")
      .limit(1);

    if (!members || members.length === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    finalMemberId = members[0].id;
  }

  if (!finalMemberId) {
    return NextResponse.json({ error: "member_id or search is required" }, { status: 400 });
  }

  // Check for duplicate check-in
  const { data: existing } = await supabaseAdmin
    .from("attendance")
    .select("id")
    .eq("member_id", finalMemberId)
    .eq("service_id", service_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Member has already checked in for this service" },
      { status: 409 }
    );
  }

  // Record check-in
  const { data, error } = await supabaseAdmin
    .from("attendance")
    .insert({
      member_id:     finalMemberId,
      service_id,
      latitude,
      longitude,
      checked_in_at: new Date().toISOString(),
    })
    .select("*, member:members(id,first_name,last_name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}