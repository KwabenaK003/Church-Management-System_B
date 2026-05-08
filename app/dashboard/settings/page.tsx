"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Tag,
  Plus,
  Trash,
  Pencil,
  Buildings,
  UsersThree,
} from "@phosphor-icons/react";

import { Tabs } from "@/components/ui/Tabs";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Textarea } from "@/components/ui/Textarea";
import { EmptyState } from "@/components/ui/EmptyState";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";

import {
  useExpenseCategories,
  useDonationCategories,
  useDeleteExpenseCategory,
  useDeleteDonationCategory,
} from "@/lib/hooks/useFinance";
import { Cluster, DonationCategory, ExpenseCategory } from "@/types";
import {
  useClusters,
  useCreateCluster,
  useUpdateCluster,
  useDeleteCluster,
} from "@/lib/hooks/useClusters";
import {
  createCategory,
  getChurchProfile,
  updateChurchProfile,
} from "@/lib/services/settingsService";

function ChurchProfileTab() {
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    getChurchProfile().then((data) => {
      if (data) {
        reset(data);
      }
    });
  }, [reset]);

  async function onSubmit(data: any) {
    await updateChurchProfile({
      church_name: data.church_name,
      address: data.address || undefined,
      logo_url: data.logo_url || undefined,
      latitude: data.latitude ? Number(data.latitude) : undefined,
      longitude: data.longitude ? Number(data.longitude) : undefined,
      radius_metres: data.radius_metres
        ? Number(data.radius_metres)
        : undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Church Name" {...register("church_name")} required />
        <Textarea label="Address" {...register("address")} />
        <Input
          label="Logo URL"
          {...register("logo_url")}
          placeholder="https://..."
        />
        <div className="border-t border-[var(--border-color)] pt-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Geofencing
          </p>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Latitude"
              type="number"
              step="any"
              {...register("latitude")}
              placeholder="5.6037"
            />
            <Input
              label="Longitude"
              type="number"
              step="any"
              {...register("longitude")}
              placeholder="-0.1870"
            />
            <Input
              label="Radius (metres)"
              type="number"
              {...register("radius_metres")}
              placeholder="500"
            />
          </div>
        </div>
        <Button type="submit">{saved ? "Saved!" : "Save Settings"}</Button>
      </form>
    </div>
  );
}

function ClustersTab() {
  const [open, setOpen] = useState(false);
  const createCluster = useCreateCluster();
  const updateCluster = useUpdateCluster();
  const deleteCluster = useDeleteCluster();
  const [editing, setEditing] = useState<any>(null);
  const { data: clusters, isLoading } = useClusters();
  const [deleteTarget, setDeleteTarget] = useState<Cluster | null>(null);

  const { register, handleSubmit, reset, setValue } = useForm();

  function openEdit(c: any) {
    setEditing(c);
    setValue("name", c.name);
    setValue("leader_name", c.leader_name ?? "");
    setValue("description", c.description ?? "");
    setOpen(true);
  }

  async function onSubmit(data: any) {
    if (editing) {
      await updateCluster.mutateAsync({ id: editing.id, ...data });
    } else {
      await createCluster.mutateAsync(data);
    }
    reset();
    setOpen(false);
    setEditing(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            reset();
            setOpen(true);
          }}
        >
          <Plus size={14} />
          Add Department
        </Button>
      </div>
      {isLoading ? (
        <Spinner size={24} />
      ) : clusters?.length === 0 ? (
        <EmptyState title="No departments yet" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {clusters?.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-[var(--border-color)] rounded-xl p-4 flex items-start justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                {c.leader_name && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Leader: {c.leader_name}
                  </p>
                )}
                {c.description && (
                  <p className="text-xs text-slate-400 mt-1">{c.description}</p>
                )}
              </div>
              <div className="flex gap-2 ml-3">
                <button
                  onClick={() => openEdit(c)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setDeleteTarget(c)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <Trash size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
          reset();
        }}
        title={editing ? "Edit Department" : "Add Department"}
        size="sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Department Name" {...register("name")} required />
          <Input label="Leader Name" {...register("leader_name")} />
          <Textarea label="Description" {...register("description")} />
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteCluster.mutateAsync(deleteTarget.id);
          setDeleteTarget(null);
        }}
        description={`Are you sure you want to delete the "${deleteTarget?.name}" department? This action cannot be undone.`}
        isPending={deleteCluster.isPending}
      />
    </div>
  );
}

function CategoryTab({ table, label }: { table: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const qc = useQueryClient();
  const donationCategoriesQuery = useDonationCategories();
  const expenseCategoriesQuery = useExpenseCategories();
  const deleteDonationCategory = useDeleteDonationCategory();
  const deleteExpenseCategory = useDeleteExpenseCategory();
  const categories =
    table === "donation_categories"
      ? donationCategoriesQuery.data
      : expenseCategoriesQuery.data;
  const isLoading =
    table === "donation_categories"
      ? donationCategoriesQuery.isLoading
      : expenseCategoriesQuery.isLoading;
  const deleteMutation =
    table === "donation_categories"
      ? deleteDonationCategory
      : deleteExpenseCategory;

  const create = useMutation({
    mutationFn: (name: string) =>
      createCategory(
        table === "donation_categories" ? "donation" : "expense",
        name,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
  });
  const { register, handleSubmit, reset } = useForm<{ name: string }>();
  async function onSubmit(data: any) {
    await create.mutateAsync(data.name);
    reset();
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus size={14} />
          Add {label}
        </Button>
      </div>
      {isLoading ? (
        <Spinner size={24} />
      ) : categories?.length === 0 ? (
        <EmptyState title={`No ${label.toLowerCase()}s yet`} />
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories?.map((c: Category) => (
            <div
              key={c.id}
              className="flex items-center gap-2 bg-white border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm"
            >
              <span className="text-slate-800">{c.name}</span>
              <button
                onClick={() => setDeleteTarget(c)}
                className="text-slate-300 hover:text-red-500"
              >
                <Trash size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        title={`Add ${label}`}
        size="sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Name" {...register("name")} required />
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add</Button>
          </div>
        </form>
      </Modal>
      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget.id);
          setDeleteTarget(null);
        }}
        description={`Are you sure you want to delete the "${deleteTarget?.name}" category? This action cannot be undone.`}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}

type Category = DonationCategory | ExpenseCategory;

const TABS = [
  { id: "profile", label: "Church Profile", icon: <Buildings size={16} /> },
  { id: "clusters", label: "Departments", icon: <UsersThree size={16} /> },
  {
    id: "donation_cats",
    label: "Donation Categories",
    icon: <Tag size={16} />,
  },
  { id: "expense_cats", label: "Expense Categories", icon: <Tag size={16} /> },
];

export default function SettingsPage() {
  const [tab, setTab] = useState("profile");
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure church profile, departments, and categories
        </p>
      </div>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="mt-2">
        {tab === "profile" && <ChurchProfileTab />}
        {tab === "clusters" && <ClustersTab />}
        {tab === "donation_cats" && (
          <CategoryTab table="donation_categories" label="Donation Category" />
        )}
        {tab === "expense_cats" && (
          <CategoryTab table="expense_categories" label="Expense Category" />
        )}
      </div>
    </div>
  );
}
