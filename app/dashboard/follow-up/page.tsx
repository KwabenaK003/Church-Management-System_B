"use client";

import { useState } from "react";
import {
  useFollowUpTasksPaginated,
  useCreateFollowUpTask,
  useUpdateFollowUpTask,
} from "@/lib/hooks/useFollowUp";
import { useClusters } from "@/lib/hooks/useClusters";
import { useMembers } from "@/lib/hooks/useMembers";
import { FollowUpTaskStatus } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { Plus, UsersThree } from "@phosphor-icons/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

const statusBadge: Record<
  FollowUpTaskStatus,
  "warning" | "primary" | "success" | "neutral"
> = {
  pending: "warning",
  in_progress: "primary",
  completed: "success",
  no_response: "neutral",
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "no_response", label: "No Response" },
];

const schema = z.object({
  member_id: z.string().min(1, "Required"),
  cluster_id: z.string().optional(),
  assigned_to: z.string().min(1, "Required"),
  reason: z.string().min(1, "Required"),
  due_date: z.string().optional(),
  notes: z.string().optional(),
});

export default function FollowUpPage() {
  const [clusterFilter, setClusterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [open, setOpen] = useState(false);

  const { data: tasksData, isLoading } = useFollowUpTasksPaginated(
    clusterFilter || undefined,
    statusFilter || undefined,
    page,
    rowsPerPage,
  );
  const tasks = tasksData?.data ?? [];
  const totalCount = tasksData?.count ?? 0;
  const { data: clusters } = useClusters();
  const { data: members } = useMembers();
  const createTask = useCreateFollowUpTask();
  const updateTask = useUpdateFollowUpTask();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const memberOptions =
    members?.map((m) => ({
      value: m.id,
      label: `${m.first_name} ${m.last_name}`,
    })) ?? [];
  const assignedToOptions =
    members?.map((m) => ({
      value: `${m.first_name} ${m.last_name}`,
      label: `${m.first_name} ${m.last_name}`,
    })) ?? [];
  const clusterOptions = [
    { value: "", label: "All Departments" },
    ...(clusters?.map((c) => ({ value: c.id, label: c.name })) ?? []),
  ];
  const clusterFormOptions = [
    { value: "", label: "No Department" },
    ...(clusters?.map((c) => ({ value: c.id, label: c.name })) ?? []),
  ];
  const filterStatusOptions = [
    { value: "", label: "All Statuses" },
    ...STATUS_OPTIONS,
  ];

  async function onSubmit(data: any) {
    await createTask.mutateAsync({ ...data });
    reset();
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Department Follow-up
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track follow-up tasks assigned to department leaders
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} />
          New Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={clusterFilter}
          onChange={(e) => {
            setClusterFilter(e.target.value);
            setPage(1);
          }}
          className="border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm bg-white"
        >
          {clusterOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm bg-white"
        >
          {filterStatusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-[var(--border-color)] rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Spinner size={24} className="text-[var(--blue-600)]" />
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={<UsersThree size={24} />}
            title="No follow-up tasks"
            description="Create a task to start tracking member follow-ups."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <tr>
                    {[
                      "Member",
                      "Department",
                      "Assigned To",
                      "Reason",
                      "Due Date",
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
                  {tasks.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-900 whitespace-nowrap">
                        {t.member?.first_name} {t.member?.last_name}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {t.cluster?.name ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {t.assigned_to}
                      </td>
                      <td className="px-5 py-3 text-slate-600 max-w-[200px] truncate">
                        {t.reason}
                      </td>
                      <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                        {t.due_date
                          ? format(new Date(t.due_date), "dd MMM yyyy")
                          : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={statusBadge[t.status]}>
                          {t.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 sticky-col-last">
                        <select
                          value={t.status}
                          onChange={(e) =>
                            updateTask.mutate({
                              id: t.id,
                              status: e.target.value as FollowUpTaskStatus,
                            })
                          }
                          className="text-xs border border-[var(--border-color)] rounded px-2 py-1 bg-white"
                        >
                          {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
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
        open={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        title="New Follow-up Task"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            name="member_id"
            control={control}
            render={({ field }) => (
              <Select
                label="Member"
                options={memberOptions}
                placeholder="Select member"
                required
                {...field}
                error={errors.member_id?.message as string | undefined}
              />
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="cluster_id"
              control={control}
              render={({ field }) => (
                <Select
                  label="Department"
                  options={clusterFormOptions}
                  {...field}
                />
              )}
            />
            <Controller
              name="assigned_to"
              control={control}
              render={({ field }) => (
                <Select
                  label="Assigned To"
                  options={assignedToOptions}
                  placeholder="Select member"
                  required
                  {...field}
                  error={errors.assigned_to?.message as string | undefined}
                />
              )}
            />
          </div>
          <Input
            label="Reason"
            {...register("reason")}
            error={errors.reason?.message as string | undefined}
            required
          />
          <Input label="Due Date" type="date" {...register("due_date")} />
          <Textarea label="Notes" {...register("notes")} />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setOpen(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createTask.isPending}>
              {createTask.isPending ? "Saving..." : "Create Task"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
