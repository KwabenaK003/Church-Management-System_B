"use server";

import { importMembers } from "@/lib/services/memberService";
import { MemberPayload } from "@/lib/services/memberService";

export async function importMembersAction(rows: MemberPayload[]) {
  return importMembers(rows);
}
