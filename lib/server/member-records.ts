import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";

type EmergencyContactFields = {
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
};

type MemberRecordWithEmergencyContacts = {
  emergency_contacts?: Array<{
    id: string;
    full_name: string;
    phone?: string | null;
    relationship?: string | null;
    created_at?: string;
  }>;
  [key: string]: unknown;
};

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

async function resolveClusterId(value: unknown) {
  const normalizedValue = normalizeOptionalString(value);

  if (!normalizedValue) {
    return undefined;
  }

  if (!normalizedValue.startsWith("name:")) {
    return normalizedValue;
  }

  const departmentName = normalizeOptionalString(normalizedValue.slice(5));

  if (!departmentName) {
    return undefined;
  }

  const { data: existingCluster, error: existingClusterError } =
    await supabaseAdmin
      .from("clusters")
      .select("id")
      .ilike("name", departmentName)
      .maybeSingle();

  if (existingClusterError) {
    throw new Error(existingClusterError.message);
  }

  if (existingCluster) {
    return existingCluster.id;
  }

  const { data: newCluster, error: newClusterError } = await supabaseAdmin
    .from("clusters")
    .insert({ name: departmentName })
    .select("id")
    .single();

  if (newClusterError) {
    throw new Error(newClusterError.message);
  }

  return newCluster.id;
}

export async function normalizeMemberFields(
  memberFields: Record<string, unknown>,
) {
  const normalizedFields = {
    ...memberFields,
  };

  const optionalStringFields = [
    "email",
    "phone",
    "gender",
    "address",
    "occupation",
    "other_names",
    "notes",
    "profile_photo_url",
  ] as const;
  const optionalDateFields = [
    "date_of_birth",
    "baptism_date",
    "join_date",
  ] as const;

  for (const field of optionalStringFields) {
    if (Object.prototype.hasOwnProperty.call(normalizedFields, field)) {
      normalizedFields[field] = normalizeOptionalString(normalizedFields[field]);
    }
  }

  for (const field of optionalDateFields) {
    if (Object.prototype.hasOwnProperty.call(normalizedFields, field)) {
      normalizedFields[field] = normalizeOptionalString(normalizedFields[field]);
    }
  }

  if (Object.prototype.hasOwnProperty.call(normalizedFields, "marital_status")) {
    normalizedFields.marital_status = normalizeOptionalString(
      normalizedFields.marital_status,
    );
  }

  if (Object.prototype.hasOwnProperty.call(normalizedFields, "cluster_id")) {
    normalizedFields.cluster_id = await resolveClusterId(
      normalizedFields.cluster_id,
    );
  }

  return normalizedFields;
}

export function splitEmergencyContactFields<T extends EmergencyContactFields & Record<string, unknown>>(
  payload: T,
) {
  const hasEmergencyContactFields =
    Object.prototype.hasOwnProperty.call(payload, "emergency_contact_name") ||
    Object.prototype.hasOwnProperty.call(payload, "emergency_contact_phone") ||
    Object.prototype.hasOwnProperty.call(payload, "emergency_contact_relationship");

  const {
    emergency_contact_name,
    emergency_contact_phone,
    emergency_contact_relationship,
    ...memberFields
  } = payload;

  return {
    hasEmergencyContactFields,
    memberFields,
    emergencyContact: {
      full_name: normalizeOptionalString(emergency_contact_name),
      phone: normalizeOptionalString(emergency_contact_phone),
      relationship: normalizeOptionalString(emergency_contact_relationship),
    },
  };
}

export function flattenMemberEmergencyContact<T extends MemberRecordWithEmergencyContacts>(member: T) {
  const primaryEmergencyContact = member.emergency_contacts?.[0];

  return {
    ...member,
    emergency_contact_name: primaryEmergencyContact?.full_name,
    emergency_contact_phone: primaryEmergencyContact?.phone ?? undefined,
    emergency_contact_relationship: primaryEmergencyContact?.relationship ?? undefined,
  };
}

export async function syncMemberEmergencyContact(
  memberId: string,
  emergencyContact: {
    full_name?: string;
    phone?: string;
    relationship?: string;
  },
) {
  const { data: existingContacts, error: existingContactsError } = await supabaseAdmin
    .from("member_emergency_contacts")
    .select("id")
    .eq("member_id", memberId)
    .order("created_at", { ascending: true });

  if (existingContactsError) {
    throw new Error(existingContactsError.message);
  }

  const hasAnyValue = Boolean(
    emergencyContact.full_name || emergencyContact.phone || emergencyContact.relationship,
  );

  if (!hasAnyValue) {
    if (existingContacts && existingContacts.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from("member_emergency_contacts")
        .delete()
        .eq("member_id", memberId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }
    }

    return;
  }

  const row = {
    member_id: memberId,
    full_name: emergencyContact.full_name ?? "Emergency Contact",
    phone: emergencyContact.phone,
    relationship: emergencyContact.relationship,
  };

  if (existingContacts && existingContacts.length > 0) {
    const { error: updateError } = await supabaseAdmin
      .from("member_emergency_contacts")
      .update(row)
      .eq("id", existingContacts[0].id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return;
  }

  const { error: insertError } = await supabaseAdmin
    .from("member_emergency_contacts")
    .insert(row);

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function getMemberWithRelations(id: string) {
  const { data, error } = await supabaseAdmin
    .from("members")
    .select(
      "*, cluster:clusters(id,name), emergency_contacts:member_emergency_contacts(id,full_name,phone,relationship,created_at)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? flattenMemberEmergencyContact(data) : null;
}
