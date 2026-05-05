"use client";

import { useState, useEffect } from "react";
import {
  useCreateMember,
  useDeleteMember,
  useMembersPaginated,
} from "@/lib/hooks/useMembers";
import { useClusters } from "@/lib/hooks/useClusters";
import { Member, MembershipStatus } from "@/types";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Textarea } from "@/components/ui/Textarea";
import { Pagination } from "@/components/ui/Pagination";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { Dropdown } from "@/components/ui/Dropdown";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { exportToCsv } from "@/lib/utils/exportCsv";
import {
  UserPlus,
  MagnifyingGlass,
  Trash,
  Eye,
  Users,
  FileArrowUp,
  DotsThree,
  Export,
} from "@phosphor-icons/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { CsvUpload } from "@/components/members/CsvUpload";
import { usePersistentTableSelection } from "@/lib/hooks/usePersistentTableSelection";

const memberSchema = z.object({
  first_name: z.string().min(1, "First name required"),
  last_name: z.string().min(1, "Last name required"),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  phone: z.string().optional(),
  gender: z.string().optional(),
  date_of_birth: z.string().optional(),
  address: z.string().optional(),
  occupation: z.string().optional(),
  marital_status: z
    .enum(["single", "married", "widowed", "divorced"] as const)
    .optional(),
  baptism_date: z.string().optional(),
  membership_status: z.enum([
    "active",
    "inactive",
    "transferred",
    "deceased",
  ] as const),
  cluster_id: z.string().optional(),
  join_date: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  notes: z.string().optional(),
});

type MemberFormData = z.infer<typeof memberSchema>;

const statusBadge: Record<
  MembershipStatus,
  "success" | "warning" | "neutral" | "danger"
> = {
  active: "success",
  inactive: "warning",
  transferred: "neutral",
  deceased: "danger",
};

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "transferred", label: "Transferred" },
  { value: "deceased", label: "Deceased" },
];

const GENDER_OPTIONS = [
  { value: "", label: "All Genders" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export default function MembersPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [clusterFilter, setClusterFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");

  const { data, isLoading } = useMembersPaginated(
    search || undefined,
    statusFilter || undefined,
    page,
    rowsPerPage,
    clusterFilter || undefined,
    genderFilter || undefined,
  );
  const members = data?.data ?? [];
  const totalCount = data?.count ?? 0;
  const { data: clusters } = useClusters();
  const createMember = useCreateMember();
  const deleteMember = useDeleteMember();
  const {
    selectedIds,
    selectedCount,
    isSelected,
    allVisibleSelected,
    someVisibleSelected,
    toggleRow,
    toggleVisibleRows,
    clearSelection,
  } = usePersistentTableSelection(
    "members",
    members.map((m) => m.id),
  );

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalCount / rowsPerPage));
    if (page > maxPage) setPage(maxPage);
  }, [totalCount, rowsPerPage, page]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      membership_status: "active",
      first_name: "",
      last_name: "",
    },
  });

  async function onSubmit(data: MemberFormData) {
    await createMember.mutateAsync({
      ...data,
      join_date: data.join_date || new Date().toISOString().split("T")[0],
    });
    reset();
    setAddOpen(false);
  }

  const clusterOptions = [
    { value: "", label: "No cluster" },
    ...(clusters?.map((c) => ({ value: c.id, label: c.name })) ?? []),
  ];

  function handleExport() {
    const dataToExport = members.map((m) => ({
      first_name: m.first_name,
      last_name: m.last_name,
      email: m.email ?? "",
      phone: m.phone ?? "",
      membership_status: m.membership_status,
      cluster: m.cluster?.name ?? "",
      gender: m.gender ?? "",
      join_date: m.join_date,
    }));
    exportToCsv(dataToExport, "members-export", [
      { key: "first_name", header: "First Name" },
      { key: "last_name", header: "Last Name" },
      { key: "email", header: "Email" },
      { key: "phone", header: "Phone" },
      { key: "membership_status", header: "Status" },
      { key: "cluster", header: "Cluster" },
      { key: "gender", header: "Gender" },
      { key: "join_date", header: "Join Date" },
    ]);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Members</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {totalCount} member{totalCount !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            <FileArrowUp size={16} />
            Bulk Import
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <UserPlus size={16} />
            Add Member
          </Button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={clusterFilter}
          onChange={(e) => {
            setClusterFilter(e.target.value);
            setPage(1);
          }}
          className="border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="">All Clusters</option>
          {(clusters ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={genderFilter}
          onChange={(e) => {
            setGenderFilter(e.target.value);
            setPage(1);
          }}
          className="border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          {GENDER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Button
          variant="secondary"
          onClick={handleExport}
          disabled={members.length === 0}
        >
          <Export size={16} />
          Export
        </Button>
      </div>

      <TableToolbar
        selectedCount={selectedCount}
        onClearSelection={clearSelection}
      />

      {/* Table */}
      <div className="bg-white border border-[var(--border-color)] rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Spinner size={28} className="text-[var(--blue-600)]" />
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            icon={<Users size={24} />}
            title="No members found"
            description="Add your first member to get started."
            action={
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <UserPlus size={14} />
                Add Member
              </Button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3 w-10">
                      <Checkbox
                        checked={allVisibleSelected}
                        indeterminate={someVisibleSelected}
                        onChange={toggleVisibleRows}
                      />
                    </th>
                    {[
                      "Name",
                      "Email",
                      "Phone",
                      "Status",
                      "Cluster",
                      "Joined",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left font-medium whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                    <th className="px-5 py-3 text-left font-medium whitespace-nowrap sticky-col-last"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {members.map((m) => (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <Checkbox
                          checked={isSelected(m.id)}
                          onChange={() => toggleRow(m.id)}
                        />
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-900 whitespace-nowrap">
                        {m.first_name} {m.last_name}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {m.email ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {m.phone ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={statusBadge[m.membership_status]}>
                          {m.membership_status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {m.cluster?.name ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                        {format(new Date(m.join_date), "dd MMM yyyy")}
                      </td>
                      <td className="px-5 py-3 sticky-col-last">
                        <Dropdown
                          trigger={<DotsThree size={20} weight="bold" />}
                          items={[
                            {
                              label: "View",
                              icon: <Eye size={16} />,
                              onClick: () =>
                                router.push(`/dashboard/members/${m.id}`),
                            },
                            {
                              label: "Delete",
                              icon: <Trash size={16} />,
                              variant: "danger",
                              onClick: () => setDeleteTarget(m),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={page}
              totalItems={totalCount}
              rowsPerPage={rowsPerPage}
              onPageChange={setPage}
              onRowsPerPageChange={(rows) => {
                setRowsPerPage(rows);
                setPage(1);
              }}
            />
          </>
        )}
      </div>

      <Modal
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          reset();
        }}
        title="Add Member"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              {...register("first_name")}
              error={errors.first_name?.message}
              required
            />
            <Input
              label="Last Name"
              {...register("last_name")}
              error={errors.last_name?.message}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              {...register("email")}
              error={errors.email?.message}
            />
            <Input label="Phone" {...register("phone")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <Select
                  label="Gender"
                  options={[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                    { value: "other", label: "Other" },
                  ]}
                  placeholder="Select gender"
                  {...field}
                />
              )}
            />
            <Controller
              name="marital_status"
              control={control}
              render={({ field }) => (
                <Select
                  label="Marital Status"
                  options={[
                    { value: "single", label: "Single" },
                    { value: "married", label: "Married" },
                    { value: "widowed", label: "Widowed" },
                    { value: "divorced", label: "Divorced" },
                  ]}
                  placeholder="Select status"
                  {...field}
                />
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date of Birth"
              type="date"
              {...register("date_of_birth")}
            />
            <Input
              label="Baptism Date"
              type="date"
              {...register("baptism_date")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Occupation" {...register("occupation")} />
            <Input label="Join Date" type="date" {...register("join_date")} />
          </div>
          <Input label="Address" {...register("address")} />
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="membership_status"
              control={control}
              render={({ field }) => (
                <Select
                  label="Membership Status"
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                    { value: "transferred", label: "Transferred" },
                    { value: "deceased", label: "Deceased" },
                  ]}
                  required
                  {...field}
                />
              )}
            />
            <Controller
              name="cluster_id"
              control={control}
              render={({ field }) => (
                <Select
                  label="Cluster"
                  options={clusterOptions}
                  placeholder="No cluster"
                  {...field}
                />
              )}
            />
          </div>

          <div className="border-t border-[var(--border-color)] pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Emergency Contact
            </p>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Name" {...register("emergency_contact_name")} />
              <Input label="Phone" {...register("emergency_contact_phone")} />
              <Input
                label="Relationship"
                {...register("emergency_contact_relationship")}
              />
            </div>
          </div>

          <Textarea label="Notes" {...register("notes")} />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setAddOpen(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMember.isPending}>
              {createMember.isPending ? "Saving..." : "Add Member"}
            </Button>
          </div>
        </form>
      </Modal>

      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;

          deleteMember.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
          });
        }}
        description={`Are you sure you want to delete "${deleteTarget?.first_name ?? ""} ${deleteTarget?.last_name ?? ""}"? This action cannot be undone.`}
        isPending={deleteMember.isPending}
      />

      <CsvUpload open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
