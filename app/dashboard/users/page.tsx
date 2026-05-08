"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { UserPlus, Trash, UsersThree, MagnifyingGlass } from "@phosphor-icons/react";

import { apiFetch } from "@/lib/api/client";
import { AppUser } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { useToastStore } from "@/lib/stores/toastStore";

type DashboardUser = AppUser & {
  role?: string | null;
};

type UsersResponse = {
  data: DashboardUser[];
  count: number;
};

const userSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("A valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type UserFormData = z.infer<typeof userSchema>;

export default function UsersPage() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DashboardUser | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  const usersQuery = useQuery({
    queryKey: ["dashboard-users", search, page, rowsPerPage],
    queryFn: () => {
      const searchParams = new URLSearchParams({
        page: String(page),
        rowsPerPage: String(rowsPerPage),
      });

      if (search.trim()) {
        searchParams.set("search", search.trim());
      }

      return apiFetch<UsersResponse>(`/api/users/paginated?${searchParams.toString()}`);
    },
  });

  const createUser = useMutation({
    mutationFn: (payload: UserFormData) =>
      apiFetch<DashboardUser>("/api/users", {
        method: "POST",
        body: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-users"] });
      addToast("User added successfully.", "success");
      reset();
      setAddOpen(false);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to add user.";
      addToast(message, "error");
    },
  });

  const deleteUser = useMutation({
    mutationFn: (userId: string) =>
      apiFetch<{ message: string }>(`/api/users/${userId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-users"] });
      addToast("User removed successfully.", "success");
      setDeleteTarget(null);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to delete user.";
      addToast(message, "error");
    },
  });

  const users = usersQuery.data?.data ?? [];
  const totalCount = usersQuery.data?.count ?? 0;

  async function onSubmit(data: UserFormData) {
    await createUser.mutateAsync(data);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Users</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {totalCount} dashboard user{totalCount !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <UserPlus size={16} />
          Add User
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-[var(--border-color)] bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-white">
        {usersQuery.isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner size={28} className="text-[var(--blue-600)]" />
          </div>
        ) : usersQuery.isError ? (
          <div className="px-5 py-8 text-sm text-[var(--danger-text)]">
            {usersQuery.error instanceof Error
              ? usersQuery.error.message
              : "Unable to load dashboard users."}
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={<UsersThree size={24} />}
            title="No users yet"
            description="Add a dashboard user to grant access to the admin area."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="whitespace-nowrap px-5 py-3 text-left font-medium">
                      Name
                    </th>
                    <th className="whitespace-nowrap px-5 py-3 text-left font-medium">
                      Email
                    </th>
                    <th className="whitespace-nowrap px-5 py-3 text-left font-medium">
                      Added
                    </th>
                    <th className="whitespace-nowrap px-5 py-3 text-left font-medium">
                      Role
                    </th>
                    <th className="whitespace-nowrap px-5 py-3 text-left font-medium">
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {users.map((user) => (
                    <tr key={user.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {user.full_name || "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-500">{user.email}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                        {format(new Date(user.created_at), "dd MMM yyyy")}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {user.role || "admin"}
                      </td>
                      <td className="px-5 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(user)}
                        >
                          <Trash size={14} />
                          Delete
                        </Button>
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
        title="Add Dashboard User"
        size="sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Name"
            {...register("full_name")}
            error={errors.full_name?.message}
            required
          />
          <Input
            label="Email"
            type="email"
            {...register("email")}
            error={errors.email?.message}
            required
          />
          <Input
            label="Password"
            type="password"
            {...register("password")}
            error={errors.password?.message}
            required
          />
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
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? "Saving..." : "Add User"}
            </Button>
          </div>
        </form>
      </Modal>

      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }

          await deleteUser.mutateAsync(deleteTarget.id);
        }}
        description={`Are you sure you want to delete "${deleteTarget?.full_name || deleteTarget?.email || ""}"? This will remove their dashboard access.`}
        isPending={deleteUser.isPending}
      />
    </div>
  );
}
