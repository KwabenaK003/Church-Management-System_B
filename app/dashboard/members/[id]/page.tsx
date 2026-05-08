"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMember, useUpdateMember } from "@/lib/hooks/useMembers";
import { useAttendance } from "@/lib/hooks/useAttendance";
import { useClusters } from "@/lib/hooks/useClusters";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { ArrowLeft, Pencil, CalendarCheck, User } from "@phosphor-icons/react";
import { MaritalStatus, MembershipStatus, Member } from "@/types";
import { useForm, Controller } from "react-hook-form";
import { format } from "date-fns";

const statusBadge: Record<MembershipStatus, "success" | "warning" | "neutral" | "danger"> = {
  active: "success",
  inactive: "warning",
  transferred: "neutral",
  deceased: "danger",
};

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const maritalStatusOptions: { value: MaritalStatus; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "widowed", label: "Widowed" },
  { value: "divorced", label: "Divorced" },
];

const membershipStatusOptions: { value: MembershipStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "transferred", label: "Transferred" },
  { value: "deceased", label: "Deceased" },
];

function asFormString(value?: string | null) {
  return value ?? "";
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 border-b border-[var(--border-color)] last:border-0">
      <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">{label}</span>
      <span className="text-sm text-slate-800">{value ?? "—"}</span>
    </div>
  );
}

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: member, isLoading } = useMember(id);
  const { data: attendance } = useAttendance();
  const { data: clusters } = useClusters();
  const updateMember = useUpdateMember();

  const [editOpen, setEditOpen] = useState(false);
  const { register, handleSubmit, reset, control } = useForm<Partial<Member>>();

  const memberAttendance = attendance?.filter((a) => a.member_id === id) ?? [];

  function openEdit() {
    if (!member) return;
    reset({
      first_name: member.first_name,
      last_name: member.last_name,
      email: asFormString(member.email),
      phone: asFormString(member.phone),
      gender: asFormString(member.gender),
      date_of_birth: asFormString(member.date_of_birth),
      address: asFormString(member.address),
      occupation: asFormString(member.occupation),
      marital_status: member.marital_status ?? undefined,
      baptism_date: asFormString(member.baptism_date),
      membership_status: member.membership_status,
      cluster_id: asFormString(member.cluster_id),
      join_date: asFormString(member.join_date),
      emergency_contact_name: asFormString(member.emergency_contact_name),
      emergency_contact_phone: asFormString(member.emergency_contact_phone),
      emergency_contact_relationship: asFormString(member.emergency_contact_relationship),
      notes: asFormString(member.notes),
    });
    setEditOpen(true);
  }

  async function onSubmit(data: Partial<Member>) {
    await updateMember.mutateAsync({ id, ...data });
    setEditOpen(false);
  }

  const clusterOptions = [
    { value: "", label: "No department" },
    ...(clusters?.map((c) => ({ value: c.id, label: c.name })) ?? []),
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Spinner size={32} className="text-[var(--blue-600)]" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Member not found</p>
        <Link href="/dashboard/members">
          <Button variant="secondary" size="sm" className="mt-4">Back to Members</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/members" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-1">
            <ArrowLeft size={14} />
            Members
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold text-slate-900">{member.first_name} {member.last_name}</h1>
            <Badge tone={statusBadge[member.membership_status]}>{member.membership_status}</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{member.email ?? "No email"} · Member since {format(new Date(member.join_date), "MMMM yyyy")}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={openEdit}>
          <Pencil size={14} />
          Edit
        </Button>
      </div>

      {/* Profile summary */}
      <div className="bg-white border border-[var(--border-color)] rounded-xl p-5 flex items-center gap-5">
        <div className="w-14 h-14 rounded-full bg-[var(--blue-50)] flex items-center justify-center flex-shrink-0 text-[var(--blue-600)]">
          {member.profile_photo_url ? (
            <Image
              src={member.profile_photo_url}
              alt={`${member.first_name} ${member.last_name}`}
              width={56}
              height={56}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User size={28} weight="fill" />
          )}
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900">{memberAttendance.length}</p>
          <p className="text-xs text-slate-400">Services attended</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Personal details */}
        <div className="lg:col-span-2 bg-white border border-[var(--border-color)] rounded-xl p-5">
          <p className="text-sm font-semibold text-slate-700 mb-2">Personal Information</p>
          <div>
            <DetailRow label="Phone" value={member.phone} />
            <DetailRow label="Gender" value={member.gender} />
            <DetailRow label="Date of Birth" value={member.date_of_birth ? format(new Date(member.date_of_birth), "dd MMMM yyyy") : undefined} />
            <DetailRow label="Marital Status" value={member.marital_status} />
            <DetailRow label="Occupation" value={member.occupation} />
            <DetailRow label="Address" value={member.address} />
            <DetailRow label="Baptism Date" value={member.baptism_date ? format(new Date(member.baptism_date), "dd MMMM yyyy") : undefined} />
            <DetailRow label="Department" value={member.cluster?.name} />
          </div>

          {(member.emergency_contact_name || member.emergency_contact_phone) && (
            <div className="mt-5 pt-4 border-t border-[var(--border-color)]">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Emergency Contact</p>
              <DetailRow label="Name" value={member.emergency_contact_name} />
              <DetailRow label="Phone" value={member.emergency_contact_phone} />
              <DetailRow label="Relationship" value={member.emergency_contact_relationship} />
            </div>
          )}

          {member.notes && (
            <div className="mt-5 pt-4 border-t border-[var(--border-color)]">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Notes</p>
              <p className="text-sm text-slate-600 leading-relaxed">{member.notes}</p>
            </div>
          )}
        </div>

        {/* Recent attendance */}
        <div className="bg-white border border-[var(--border-color)] rounded-xl p-5">
          <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <CalendarCheck size={16} className="text-[var(--blue-600)]" />
            Recent Attendance
          </p>
          {memberAttendance.length === 0 ? (
            <p className="text-sm text-slate-400">No attendance records yet</p>
          ) : (
            <div className="flex flex-col gap-2">
              {memberAttendance.slice(0, 10).map((a) => (
                <div key={a.id} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--blue-500)] flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-slate-700">{a.service?.name}</p>
                    <p className="text-xs text-slate-400">
                      {a.service?.service_date ? format(new Date(a.service.service_date), "dd MMM yyyy") : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Member" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" {...register("first_name")} required />
            <Input label="Last Name" {...register("last_name")} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" {...register("email")} />
            <Input label="Phone" {...register("phone")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Controller name="gender" control={control} render={({ field }) => (
              <Select
                label="Gender"
                options={genderOptions}
                placeholder="Select"
                {...field}
                value={field.value ?? ""}
              />
            )} />
            <Controller
              name="marital_status"
              control={control}
              render={({ field }) => (
                <Select
                  label="Marital Status"
                  options={maritalStatusOptions}
                  placeholder="Select"
                  {...field}
                  value={field.value ?? ""}
                />
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date of Birth" type="date" {...register("date_of_birth")} />
            <Input label="Baptism Date" type="date" {...register("baptism_date")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Occupation" {...register("occupation")} />
            <Input label="Join Date" type="date" {...register("join_date")} />
          </div>
          <Input label="Address" {...register("address")} />
          <div className="grid grid-cols-2 gap-4">
            <Controller name="membership_status" control={control} render={({ field }) => (
              <Select
                label="Status"
                options={membershipStatusOptions}
                {...field}
                value={field.value ?? ""}
              />
            )} />
            <Controller name="cluster_id" control={control} render={({ field }) => (
              <Select label="Department" options={clusterOptions} {...field} value={field.value ?? ""} />
            )} />
          </div>
          <div className="border-t border-[var(--border-color)] pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Emergency Contact
            </p>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Name" {...register("emergency_contact_name")} />
              <Input label="Phone" {...register("emergency_contact_phone")} />
              <Input label="Relationship" {...register("emergency_contact_relationship")} />
            </div>
          </div>
          <Textarea label="Notes" {...register("notes")} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={updateMember.isPending}>
              {updateMember.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
