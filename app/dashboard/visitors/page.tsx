"use client";

import { useState } from "react";
import {
  useVisitorsPaginated,
  useCreateVisitor,
  useUpdateVisitor,
} from "@/lib/hooks/useVisitors";
import { useMembers } from "@/lib/hooks/useMembers";
import { Visitor, FollowUpStatus } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Checkbox } from "@/components/ui/Checkbox";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { exportToCsv } from "@/lib/utils/exportCsv";
import {
  CheckCircle,
  UserPlusIcon,
  MagnifyingGlassIcon,
  UsersFourIcon,
} from "@phosphor-icons/react";
import { Export } from "@phosphor-icons/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { usePersistentTableSelection } from "@/lib/hooks/usePersistentTableSelection";

const visitorSchema = z.object({
  first_name: z.string().min(1, "First name required"),
  last_name: z.string().min(1, "Last name required"),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  phone: z.string().optional(),
  how_heard: z.string().optional(),
  invited_by: z.string().optional(),
  notes: z.string().optional(),
  visit_date: z.string().optional(),
});

type VisitorFormData = z.infer<typeof visitorSchema>;

const followUpBadge: Record<FollowUpStatus, "warning" | "primary" | "success"> =
  {
    pending: "warning",
    contacted: "primary",
    joined: "success",
  };

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "contacted", label: "Contacted" },
  { value: "joined", label: "Joined" },
];

const HOW_HEARD_OPTIONS = [
  { value: "friend", label: "Friend / Family" },
  { value: "social_media", label: "Social Media" },
  { value: "flyer", label: "Flyer / Poster" },
  { value: "website", label: "Website" },
  { value: "radio", label: "Radio / TV" },
  { value: "walk_in", label: "Walk-in" },
  { value: "other", label: "Other" },
];

const HOW_HEARD_FILTER_OPTIONS = [
  { value: "", label: "All Sources" },
  ...HOW_HEARD_OPTIONS,
];

export default function VisitorsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [howHeardFilter, setHowHeardFilter] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [addOpen, setAddOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");

  const { data: visitorsData, isLoading } = useVisitorsPaginated(
    search || undefined,
    statusFilter || undefined,
    page,
    rowsPerPage,
    howHeardFilter || undefined,
  );
  const visitors = visitorsData?.data ?? [];
  const totalCount = visitorsData?.count ?? 0;

  const { data: members } = useMembers();
  const createVisitor = useCreateVisitor();
  const updateVisitor = useUpdateVisitor();

  const {
    selectedIds,
    selectedCount,
    isSelected,
    allVisibleSelected,
    someVisibleSelected,
    toggleRow,
    toggleVisibleRows,
    clearSelection,
  } = usePersistentTableSelection("visitors", visitors.map((v) => v.id));

  const invitedByOptions = [
    { value: "", label: "Select member" },
    ...(members?.map((member) => ({
      value: `${member.first_name} ${member.last_name}`,
      label: `${member.first_name} ${member.last_name}`,
    })) ?? []),
  ];

  function handleExport() {
    const dataToExport = visitors.map((v) => ({
      first_name: v.first_name,
      last_name: v.last_name,
      email: v.email ?? "",
      phone: v.phone ?? "",
      how_heard: v.how_heard ?? "",
      visit_date: v.visit_date,
      follow_up_status: v.follow_up_status,
      notes: v.notes ?? "",
    }));
    exportToCsv(dataToExport, "visitors-export", [
      { key: "first_name", header: "First Name" },
      { key: "last_name", header: "Last Name" },
      { key: "email", header: "Email" },
      { key: "phone", header: "Phone" },
      { key: "how_heard", header: "How They Heard" },
      { key: "visit_date", header: "Visit Date" },
      { key: "follow_up_status", header: "Follow-up Status" },
      { key: "notes", header: "Notes" },
    ]);
  }

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<VisitorFormData>({
    resolver: zodResolver(visitorSchema),
  });

  async function onSubmit(data: VisitorFormData) {
    await createVisitor.mutateAsync({
      ...data,
      visit_date: data.visit_date || new Date().toISOString().split("T")[0],
      follow_up_status: "pending",
    });
    reset();
    setAddOpen(false);
  }

  async function markFollowedUp(v: Visitor, status: FollowUpStatus) {
    await updateVisitor.mutateAsync({ id: v.id, follow_up_status: status });
  }

  async function saveNotes(id: string) {
    await updateVisitor.mutateAsync({ id, notes: notesValue });
    setNotesOpen(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Visitors</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {totalCount} total visitors
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <UserPlusIcon className="w-4 h-4" />
          Record Visitor
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
          className="border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={howHeardFilter}
          onChange={(e) => {
            setHowHeardFilter(e.target.value);
            setPage(1);
          }}
          className="border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
        >
          {HOW_HEARD_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Button
          variant="secondary"
          onClick={handleExport}
          disabled={visitors.length === 0}
        >
          <Export size={16} />
          Export
        </Button>
      </div>

      <TableToolbar
        selectedCount={selectedCount}
        onClearSelection={clearSelection}
      />

      <div className="bg-white border border-[var(--border-color)] rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Spinner size={28} className="text-[var(--blue-600)]" />
          </div>
        ) : visitors.length === 0 ? (
          <EmptyState
            icon={<UsersFourIcon className="w-24 h-24" />}
            title="No visitors yet"
            description="Record your first visitor using the button above."
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
                      "Phone",
                      "How They Heard",
                      "Visit Date",
                      "Status",
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
                  {visitors.map((v) => (
                    <tr
                      key={v.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <Checkbox
                          checked={isSelected(v.id)}
                          onChange={() => toggleRow(v.id)}
                        />
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-900 whitespace-nowrap">
                        {v.first_name} {v.last_name}
                        {v.email && (
                          <p className="text-xs text-slate-400 font-normal">
                            {v.email}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {v.phone ?? "-"}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {v.how_heard ?? "-"}
                      </td>
                      <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                        {format(new Date(v.visit_date), "dd MMM yyyy")}
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={followUpBadge[v.follow_up_status]}>
                          {v.follow_up_status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 sticky-col-last">
                        <div className="flex items-center gap-2">
                          {v.follow_up_status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markFollowedUp(v, "contacted")}
                            >
                              <CheckCircle size={14} />
                              Contacted
                            </Button>
                          )}
                          {v.follow_up_status === "contacted" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markFollowedUp(v, "joined")}
                            >
                              <CheckCircle size={14} />
                              Joined
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setNotesOpen(v.id);
                              setNotesValue(v.notes ?? "");
                            }}
                          >
                            Notes
                          </Button>
                        </div>
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
        title="Record Visitor"
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
            <Input label="Phone" {...register("phone")} />
            <Input
              label="Email"
              type="email"
              {...register("email")}
              error={errors.email?.message}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="how_heard"
              control={control}
              render={({ field }) => (
                <Select
                  label="How did they hear?"
                  options={HOW_HEARD_OPTIONS}
                  placeholder="Select"
                  {...field}
                />
              )}
            />
            <Controller
              name="invited_by"
              control={control}
              render={({ field }) => (
                <Select
                  label="Invited By"
                  options={invitedByOptions}
                  placeholder="Select member"
                  {...field}
                />
              )}
            />
          </div>
          <Input label="Visit Date" type="date" {...register("visit_date")} />
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
            <Button type="submit" disabled={createVisitor.isPending}>
              {createVisitor.isPending ? "Saving..." : "Record Visitor"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!notesOpen}
        onClose={() => setNotesOpen(null)}
        title="Visitor Notes"
        size="sm"
      >
        <div className="space-y-4">
          <Textarea
            label="Notes"
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            rows={5}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setNotesOpen(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => notesOpen && saveNotes(notesOpen)}
              disabled={updateVisitor.isPending}
            >
              Save Notes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
