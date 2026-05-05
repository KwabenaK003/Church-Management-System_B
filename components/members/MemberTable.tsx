import Link from "next/link";
import { Member } from "@/types";
import { Badge } from "@/components/ui/Badge";

interface MemberTableProps {
  members: Member[];
}

const toneMap: Record<Member["membership_status"], "success" | "warning" | "danger"> = {
  active: "success",
  inactive: "warning",
  transferred: "warning",
  deceased: "danger",
};

export function MemberTable({ members }: MemberTableProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
        Members
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {["Name", "Email", "Status", "Joined"].map((header) => (
                <th key={header} className="px-4 py-3 text-left font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/members/${member.id}`}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    {member.first_name} {member.last_name}
                  </Link>
                </td>
                <td className="px-4 py-3">{member.email}</td>
                <td className="px-4 py-3">
                  <Badge tone={toneMap[member.membership_status]}>{member.membership_status}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {new Date(member.join_date).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
