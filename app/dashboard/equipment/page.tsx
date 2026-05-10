"use client";

import { useState } from "react";
import { useEquipmentPaginated, useCreateEquipment, useUpdateEquipment, useDeleteEquipment, useEquipmentCategories } from "@/lib/hooks/useEquipment";
import { Equipment, EquipmentCondition } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { exportToCsv } from "@/lib/utils/exportCsv";
import { usePersistentTableSelection } from "@/lib/hooks/usePersistentTableSelection";
import { Plus, Desktop, Pencil, Trash, MagnifyingGlass, Export } from "@phosphor-icons/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const DEFAULT_ASSET_CATEGORIES = ["equipment", "inventory", "machinery"];

function formatAssetCategoryLabel(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

const CONDITIONS: { value: EquipmentCondition; label: string }[] = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
  { value: "damaged", label: "Damaged" },
];

const conditionBadge: Record<EquipmentCondition, "success" | "primary" | "warning" | "danger" | "neutral"> = {
  excellent: "success",
  good: "primary",
  fair: "warning",
  poor: "neutral",
  damaged: "danger",
};

const schema = z.object({
  name: z.string().min(1, "Required"),
  category: z.string().optional(),
  serial_number: z.string().optional(),
  purchase_date: z.string().optional(),
  purchase_price: z.string().optional(),
  condition: z.string().optional(),
  location: z.string().optional(),
  assigned_to: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function EquipmentPage() {
  const [search, setSearch] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Equipment | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");

  const { data: equipmentData, isLoading } = useEquipmentPaginated(
    search || undefined,
    conditionFilter || undefined,
    page,
    rowsPerPage,
    categoryFilter || undefined,
  );
  const { data: categories } = useEquipmentCategories();
  const assetCategories = Array.from(
    new Set([...(categories ?? []), ...DEFAULT_ASSET_CATEGORIES]),
  ).sort((left, right) => left.localeCompare(right));
  const equipment = equipmentData?.data ?? [];
  const totalCount = equipmentData?.count ?? 0;
  const {
    selectedIds,
    selectedCount,
    isSelected,
    allVisibleSelected,
    someVisibleSelected,
    toggleRow,
    toggleVisibleRows,
    clearSelection,
  } = usePersistentTableSelection("equipment", equipment.map((e) => e.id));

  const createEquipment = useCreateEquipment();
  const updateEquipment = useUpdateEquipment();
  const deleteEquipment = useDeleteEquipment();

  const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { condition: "good" },
  });

  function handleExport() {
    const dataToExport = equipment.map((e) => ({
      name: e.name,
      category: e.category ?? "",
      serial_number: e.serial_number ?? "",
      condition: e.condition,
      location: e.location ?? "",
      assigned_to: e.assigned_to ?? "",
      purchase_date: e.purchase_date ?? "",
      purchase_price: e.purchase_price != null ? String(e.purchase_price) : "",
      notes: e.notes ?? "",
    }));
    exportToCsv(dataToExport, "equipment-export", [
      { key: "name", header: "Name" },
      { key: "category", header: "Category" },
      { key: "serial_number", header: "Serial Number" },
      { key: "condition", header: "Condition" },
      { key: "location", header: "Location" },
      { key: "assigned_to", header: "Assigned To" },
      { key: "purchase_date", header: "Purchase Date" },
      { key: "purchase_price", header: "Purchase Price (GHS)" },
      { key: "notes", header: "Notes" },
    ]);
  }

  function openEdit(item: Equipment) {
    setEditing(item);
    setValue("name", item.name);
    setValue("category", item.category ?? "");
    setValue("serial_number", item.serial_number ?? "");
    setValue("purchase_date", item.purchase_date ?? "");
    setValue("purchase_price", String(item.purchase_price ?? ""));
    setValue("condition", item.condition);
    setValue("location", item.location ?? "");
    setValue("assigned_to", item.assigned_to ?? "");
    setValue("notes", item.notes ?? "");
    setOpen(true);
  }

  async function onSubmit(data: FormData) {
    const payload: Partial<Equipment> = {
      ...data,
      condition: data.condition as EquipmentCondition,
      purchase_price: data.purchase_price ? parseFloat(data.purchase_price) : undefined,
    };
    if (editing) {
      await updateEquipment.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createEquipment.mutateAsync(payload);
    }
    reset(); setOpen(false); setEditing(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Assets</h1>
          <p className="text-sm text-slate-500 mt-0.5">{totalCount} items recorded</p>
        </div>
        <Button onClick={() => { setEditing(null); reset({ condition: "good" }); setOpen(true); }}>
          <Plus size={16} />
          Add Asset
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search assets..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <select
          value={conditionFilter}
          onChange={(e) => {
            setConditionFilter(e.target.value);
            setPage(1);
          }}
          className="border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All Conditions</option>
          {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All Categories</option>
          {assetCategories.map((c) => (
            <option key={c} value={c}>{formatAssetCategoryLabel(c)}</option>
          ))}
        </select>
        <Button variant="secondary" onClick={handleExport} disabled={equipment.length === 0}>
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
          <div className="flex justify-center items-center h-48"><Spinner size={24} className="text-[var(--blue-600)]" /></div>
        ) : totalCount === 0 ? (
          <EmptyState icon={<Desktop size={24} />} title="No assets recorded" description="Add your first asset to get started." />
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
                    {["Name", "Category", "Serial No.", "Condition", "Location", "Assigned To"].map(h => (
                      <th key={h} className="px-5 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                    ))}
                    <th className="px-5 py-3 text-left font-medium whitespace-nowrap sticky-col-last"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {equipment.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <Checkbox
                          checked={isSelected(e.id)}
                          onChange={() => toggleRow(e.id)}
                        />
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-900">{e.name}</td>
                      <td className="px-5 py-3 text-slate-500">{e.category ?? "—"}</td>
                      <td className="px-5 py-3 text-slate-500 font-mono text-xs">{e.serial_number ?? "—"}</td>
                      <td className="px-5 py-3"><Badge tone={conditionBadge[e.condition]}>{e.condition}</Badge></td>
                      <td className="px-5 py-3 text-slate-500">{e.location ?? "—"}</td>
                      <td className="px-5 py-3 text-slate-500">{e.assigned_to ?? "—"}</td>
                      <td className="px-5 py-3 sticky-col-last">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(e)}><Pencil size={14} /></Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteTarget(e)}
                          ><Trash size={14} /></Button>
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
              onRowsPerPageChange={(rows) => { setRowsPerPage(rows); setPage(1); }}
            />
          </>
        )}
      </div>

      <Modal open={open} onClose={() => { setOpen(false); setEditing(null); reset(); }} title={editing ? "Edit Asset" : "Add Asset"} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Name" {...register("name")} error={errors.name?.message} required />
            <Input label="Category" {...register("category")} placeholder="e.g. equipment, inventory, machinery" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Serial Number" {...register("serial_number")} />
            <Controller name="condition" control={control} render={({ field }) => (
              <Select label="Condition" options={CONDITIONS} {...field} />
            )} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Purchase Date" type="date" {...register("purchase_date")} />
            <Input label="Purchase Price (GHS)" type="number" step="0.01" {...register("purchase_price")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Location" {...register("location")} />
            <Input label="Assigned To" {...register("assigned_to")} />
          </div>
          <Textarea label="Notes" {...register("notes")} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => { setOpen(false); setEditing(null); reset(); }}>Cancel</Button>
            <Button type="submit" disabled={createEquipment.isPending || updateEquipment.isPending}>
              {(createEquipment.isPending || updateEquipment.isPending) ? "Saving..." : editing ? "Save Changes" : "Add Asset"}
            </Button>
          </div>
        </form>
      </Modal>

      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) {
            return;
          }

          deleteEquipment.mutate(deleteTarget.id, {
            onSuccess: () => {
              setDeleteTarget(null);
            },
          });
        }}
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        isPending={deleteEquipment.isPending}
      />
    </div>
  );
}
