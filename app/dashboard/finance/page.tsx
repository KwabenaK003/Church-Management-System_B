"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import {
  useDonationsPaginated,
  useCreateDonation,
  useUpdateDonation,
  useDeleteDonation,
  useDonationCategories,
  usePledgeCampaigns,
  useCreatePledgeCampaign,
  useUpdatePledgeCampaign,
  useDeletePledgeCampaign,
  usePledgesPaginated,
  useCreatePledge,
  useExpensesPaginated,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useExpenseCategories,
} from "@/lib/hooks/useFinance";
import { useMembers } from "@/lib/hooks/useMembers";
import {
  Plus,
  CurrencyDollar,
  Handshake,
  Receipt,
  MagnifyingGlass,
  Pencil,
  Trash,
} from "@phosphor-icons/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  ApprovalStatus,
  Donation,
  Expense,
  PaymentMethod,
  PledgeCampaign,
} from "@/types";
import { useToastStore } from "@/lib/stores/toastStore";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "online", label: "Online" },
];

const approvalBadge: Record<ApprovalStatus, "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

// ─── Donations Tab ────────────────────────────────────────────────────────────

const donationSchema = z.object({
  member_id: z.string().optional(),
  donor_name: z.string().optional(),
  category_id: z.string().optional(),
  amount: z.string().min(1, "Required"),
  payment_method: z.string().default("cash"),
  donation_date: z.string().optional(),
  notes: z.string().optional(),
});

function DonationsTab() {
  const addToast = useToastStore((state) => state.addToast);
  const [addOpen, setAddOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Donation | null>(null);
  const [search, setSearch] = useState("");
  const year: number | undefined = undefined;
  const month: number | undefined = undefined;
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { data, isLoading } = useDonationsPaginated(year, month, search, page, rowsPerPage);
  const { data: categories } = useDonationCategories();
  const { data: members } = useMembers();
  const showMemberSearch = (members?.length ?? 0) > 10;
  const createDonation = useCreateDonation();
  const updateDonation = useUpdateDonation();
  const deleteDonation = useDeleteDonation();
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({ resolver: zodResolver(donationSchema) });

  const donations = data?.data ?? [];
  const totalCount = data?.count ?? 0;

  const total = donations.reduce((s, d) => s + d.amount, 0);

  async function onSubmit(data: z.infer<typeof donationSchema>) {
    const payload = {
      ...data,
      amount: parseFloat(data.amount),
      payment_method: data.payment_method as PaymentMethod,
      donation_date: data.donation_date || new Date().toISOString().split("T")[0],
    };

    try {
      if (editingDonation) {
        await updateDonation.mutateAsync({
          id: editingDonation.id,
          ...payload,
        });
        addToast("Donation updated successfully.", "success");
      } else {
        await createDonation.mutateAsync(payload);
        addToast("Donation recorded successfully.", "success");
      }

      reset();
      setAddOpen(false);
      setEditingDonation(null);
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Failed to save donation.",
        "error",
      );
    }
  }

  const memberOptions = [{ value: "", label: "Anonymous / Walk-in" }, ...(members?.map(m => ({ value: m.id, label: `${m.first_name} ${m.last_name}` })) ?? [])];
  const categoryOptions = [{ value: "", label: "Uncategorised" }, ...(categories?.map(c => ({ value: c.id, label: c.name })) ?? [])];

  function openCreateDonation() {
    setEditingDonation(null);
    reset({
      member_id: "",
      donor_name: "",
      category_id: "",
      amount: "",
      payment_method: "cash",
      donation_date: "",
      notes: "",
    });
    setAddOpen(true);
  }

  function openEditDonation(donation: Donation) {
    setEditingDonation(donation);
    reset({
      member_id: donation.member_id ?? "",
      donor_name: donation.donor_name ?? "",
      category_id: donation.category_id ?? "",
      amount: donation.amount.toString(),
      payment_method: donation.payment_method,
      donation_date: donation.donation_date ?? "",
      notes: donation.notes ?? "",
    });
    setAddOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="bg-white border border-[var(--border-color)] rounded-xl px-5 py-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Total Donations</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">GHS {total.toLocaleString("en", { minimumFractionDigits: 2 })}</p>
        </div>
        <Button onClick={openCreateDonation}><Plus size={16} />Record Donation</Button>
      </div>

      <div className="relative min-w-[220px]">
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
          placeholder="Search donations..."
          className="w-full rounded-lg border border-[var(--border-color)] bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <div className="bg-white border border-[var(--border-color)] rounded-xl overflow-hidden">
        {isLoading ? <div className="flex justify-center items-center h-48"><Spinner size={24} className="text-[var(--blue-600)]" /></div> :
          donations.length === 0 ? <EmptyState title="No donations recorded" /> :
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <tr>{["Donor", "Category", "Amount", "Method", "Date", ""].map(h => <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {donations.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {d.member ? `${d.member.first_name} ${d.member.last_name}` : d.donor_name ?? "Anonymous"}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{d.category?.name ?? "—"}</td>
                    <td className="px-5 py-3 font-semibold">GHS {d.amount.toLocaleString()}</td>
                    <td className="px-5 py-3 text-slate-500">{d.payment_method.replace("_", " ")}</td>
                    <td className="px-5 py-3 text-slate-500">{format(new Date(d.donation_date), "dd MMM yyyy")}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEditDonation(d)}>
                          <Pencil size={14} />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:bg-red-50 hover:text-red-700"
                          onClick={() => setDeleteTarget(d)}
                        >
                          <Trash size={14} />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
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

      <Modal open={addOpen} onClose={() => { setAddOpen(false); setEditingDonation(null); reset(); }} title={editingDonation ? "Edit Donation" : "Record Donation"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Controller name="member_id" control={control} render={({ field }) => <SearchableSelect label="Member" options={memberOptions} showSearch={showMemberSearch} searchPlaceholder="Search members..." {...field} />} />
          <Input label="Donor Name (if not a member)" {...register("donor_name")} />
          <div className="grid grid-cols-2 gap-4">
            <Controller name="category_id" control={control} render={({ field }) => <Select label="Category" options={categoryOptions} placeholder="Select category" {...field} />} />
            <Input label="Amount (GHS)" type="number" step="0.01" {...register("amount")} error={errors.amount?.message} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Controller name="payment_method" control={control} render={({ field }) => <Select label="Payment Method" options={PAYMENT_METHODS} {...field} />} />
            <Input label="Date" type="date" {...register("donation_date")} />
          </div>
          <Textarea label="Notes" {...register("notes")} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => { setAddOpen(false); setEditingDonation(null); reset(); }}>Cancel</Button>
            <Button type="submit" disabled={createDonation.isPending || updateDonation.isPending}>{createDonation.isPending || updateDonation.isPending ? "Saving..." : editingDonation ? "Save Changes" : "Save Donation"}</Button>
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

          return deleteDonation
            .mutateAsync(deleteTarget.id)
            .then(() => {
              addToast("Donation deleted successfully.", "success");
              setDeleteTarget(null);
            })
            .catch((error) => {
              addToast(
                error instanceof Error
                  ? error.message
                  : "Failed to delete donation.",
                "error",
              );
            });
        }}
        description={`Are you sure you want to delete this donation from "${deleteTarget?.member ? `${deleteTarget.member.first_name} ${deleteTarget.member.last_name}` : deleteTarget?.donor_name ?? "Anonymous"}"? This action cannot be undone.`}
        isPending={deleteDonation.isPending}
      />
    </div>
  );
}

// ─── Expenses Tab ─────────────────────────────────────────────────────────────

const expenseSchema = z.object({
  category_id: z.string().optional(),
  description: z.string().min(1, "Required"),
  amount: z.string().min(1, "Required"),
  payment_method: z.string().default("cash"),
  expense_date: z.string().optional(),
  notes: z.string().optional(),
});

function ExpensesTab() {
  const addToast = useToastStore((state) => state.addToast);
  const [addOpen, setAddOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [search, setSearch] = useState("");
  const year: number | undefined = undefined;
  const month: number | undefined = undefined;
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { data, isLoading } = useExpensesPaginated(year, month, search, page, rowsPerPage);
  const { data: categories } = useExpenseCategories();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const { register, handleSubmit, reset, control } = useForm({ resolver: zodResolver(expenseSchema) });

  const expenses = data?.data ?? [];
  const totalCount = data?.count ?? 0;

  const categoryOptions = [{ value: "", label: "Uncategorised" }, ...(categories?.map(c => ({ value: c.id, label: c.name })) ?? [])];

  async function onSubmit(data: z.infer<typeof expenseSchema>) {
    const payload = {
      ...data,
      amount: parseFloat(data.amount),
      payment_method: data.payment_method as PaymentMethod,
      expense_date: data.expense_date || new Date().toISOString().split("T")[0],
    };

    try {
      if (editingExpense) {
        await updateExpense.mutateAsync({
          id: editingExpense.id,
          ...payload,
        });
        addToast("Expense updated successfully.", "success");
      } else {
        await createExpense.mutateAsync(payload);
        addToast("Expense recorded successfully.", "success");
      }

      reset();
      setAddOpen(false);
      setEditingExpense(null);
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Failed to save expense.",
        "error",
      );
    }
  }

  function openCreateExpense() {
    setEditingExpense(null);
    reset({
      category_id: "",
      description: "",
      amount: "",
      payment_method: "cash",
      expense_date: "",
      notes: "",
    });
    setAddOpen(true);
  }

  function openEditExpense(expense: Expense) {
    setEditingExpense(expense);
    reset({
      category_id: expense.category_id ?? "",
      description: expense.description,
      amount: expense.amount.toString(),
      payment_method: expense.payment_method,
      expense_date: expense.expense_date ?? "",
      notes: expense.notes ?? "",
    });
    setAddOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreateExpense}><Plus size={16} />Record Expense</Button>
      </div>

      <div className="relative min-w-[220px]">
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
          placeholder="Search expenses..."
          className="w-full rounded-lg border border-[var(--border-color)] bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <div className="bg-white border border-[var(--border-color)] rounded-xl overflow-hidden">
        {isLoading ? <div className="flex justify-center items-center h-48"><Spinner size={24} className="text-[var(--blue-600)]" /></div> :
          expenses.length === 0 ? <EmptyState title="No expenses recorded" /> :
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <tr>{["Description", "Category", "Amount", "Status", "Date", ""].map(h => <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {expenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">{e.description}</td>
                    <td className="px-5 py-3 text-slate-500">{e.category?.name ?? "—"}</td>
                    <td className="px-5 py-3 font-semibold">GHS {e.amount.toLocaleString()}</td>
                    <td className="px-5 py-3"><Badge tone={approvalBadge[e.approval_status]}>{e.approval_status}</Badge></td>
                    <td className="px-5 py-3 text-slate-500">{format(new Date(e.expense_date), "dd MMM yyyy")}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="ghost" onClick={() => openEditExpense(e)}>
                          <Pencil size={14} />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:bg-red-50 hover:text-red-700"
                          onClick={() => setDeleteTarget(e)}
                        >
                          <Trash size={14} />
                          Delete
                        </Button>
                        {e.approval_status === "pending" && (
                          <>
                          <Button size="sm" variant="ghost" onClick={() => updateExpense.mutate(
                            { id: e.id, approval_status: "approved" },
                            {
                              onSuccess: () =>
                                addToast("Expense approved successfully.", "success"),
                              onError: (error) =>
                                addToast(
                                  error instanceof Error
                                    ? error.message
                                    : "Failed to approve expense.",
                                  "error",
                                ),
                            },
                          )}>Approve</Button>
                          <Button size="sm" variant="danger" onClick={() => updateExpense.mutate(
                            { id: e.id, approval_status: "rejected" },
                            {
                              onSuccess: () =>
                                addToast("Expense rejected successfully.", "success"),
                              onError: (error) =>
                                addToast(
                                  error instanceof Error
                                    ? error.message
                                    : "Failed to reject expense.",
                                  "error",
                                ),
                            },
                          )}>Reject</Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
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

      <Modal open={addOpen} onClose={() => { setAddOpen(false); setEditingExpense(null); reset(); }} title={editingExpense ? "Edit Expense" : "Record Expense"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Description" {...register("description")} required />
          <div className="grid grid-cols-2 gap-4">
            <Controller name="category_id" control={control} render={({ field }) => <Select label="Category" options={categoryOptions} placeholder="Select category" {...field} />} />
            <Input label="Amount (GHS)" type="number" step="0.01" {...register("amount")} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Controller name="payment_method" control={control} render={({ field }) => <Select label="Payment Method" options={PAYMENT_METHODS} {...field} />} />
            <Input label="Date" type="date" {...register("expense_date")} />
          </div>
          <Textarea label="Notes" {...register("notes")} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => { setAddOpen(false); setEditingExpense(null); reset(); }}>Cancel</Button>
            <Button type="submit" disabled={createExpense.isPending || updateExpense.isPending}>{createExpense.isPending || updateExpense.isPending ? "Saving..." : editingExpense ? "Save Changes" : "Save Expense"}</Button>
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

          return deleteExpense
            .mutateAsync(deleteTarget.id)
            .then(() => {
              addToast("Expense deleted successfully.", "success");
              setDeleteTarget(null);
            })
            .catch((error) => {
              addToast(
                error instanceof Error
                  ? error.message
                  : "Failed to delete expense.",
                "error",
              );
            });
        }}
        description={`Are you sure you want to delete the expense "${deleteTarget?.description ?? ""}"? This action cannot be undone.`}
        isPending={deleteExpense.isPending}
      />
    </div>
  );
}

// ─── Pledges Tab ──────────────────────────────────────────────────────────────

function PledgesTab() {
  const [addCampaignOpen, setAddCampaignOpen] = useState(false);
  const [addPledgeOpen, setAddPledgeOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editingCampaign, setEditingCampaign] = useState<PledgeCampaign | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PledgeCampaign | null>(null);
  const { data: campaigns, isLoading: campaignsLoading } = usePledgeCampaigns();
  const { data, isLoading: pledgesLoading } = usePledgesPaginated(selectedCampaign || undefined, search, page, rowsPerPage);
  const { data: members } = useMembers();
  const showMemberSearch = (members?.length ?? 0) > 10;
  const createCampaign = useCreatePledgeCampaign();
  const updateCampaign = useUpdatePledgeCampaign();
  const deleteCampaign = useDeletePledgeCampaign();
  const createPledge = useCreatePledge();

  const pledges = data?.data ?? [];
  const totalCount = data?.count ?? 0;
  const activeCampaign = campaigns?.find((campaign) => campaign.id === selectedCampaign);

  const campaignForm = useForm({ defaultValues: { name: "", description: "", target_amount: "", start_date: "", end_date: "" } });
  const pledgeForm = useForm({ defaultValues: { member_id: "", pledged_amount: "", due_date: "" } });

  const memberOptions = members?.map(m => ({ value: m.id, label: `${m.first_name} ${m.last_name}` })) ?? [];

  async function onCampaignSubmit(data: any) {
    const payload = {
      name: data.name,
      description: data.description?.trim() || undefined,
      target_amount: data.target_amount ? parseFloat(data.target_amount) : undefined,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
    };

    const campaign = editingCampaign
      ? await updateCampaign.mutateAsync({
          id: editingCampaign.id,
          ...payload,
        })
      : await createCampaign.mutateAsync(payload);

    setSelectedCampaign(campaign.id);
    setPage(1);
    campaignForm.reset();
    setAddCampaignOpen(false);
    setEditingCampaign(null);
  }

  async function onPledgeSubmit(data: any) {
    if (!selectedCampaign) {
      return;
    }

    await createPledge.mutateAsync({ ...data, campaign_id: selectedCampaign, pledged_amount: parseFloat(data.pledged_amount) });
    pledgeForm.reset(); setAddPledgeOpen(false);
  }

  function openCreateCampaign() {
    setEditingCampaign(null);
    campaignForm.reset({
      name: "",
      description: "",
      target_amount: "",
      start_date: "",
      end_date: "",
    });
    setAddCampaignOpen(true);
  }

  function openEditCampaign(campaign: PledgeCampaign) {
    setEditingCampaign(campaign);
    campaignForm.reset({
      name: campaign.name,
      description: campaign.description ?? "",
      target_amount: campaign.target_amount?.toString() ?? "",
      start_date: campaign.start_date ?? "",
      end_date: campaign.end_date ?? "",
    });
    setAddCampaignOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Campaigns</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Create pledge campaigns, then add and track member commitments.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={openCreateCampaign}>
            <Plus size={14} />
            New Campaign
          </Button>
          {selectedCampaign && (
            <Button size="sm" onClick={() => setAddPledgeOpen(true)}>
              <Plus size={14} />
              Add Pledge
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
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
            placeholder="Search pledges by member, status, or notes..."
            className="w-full rounded-lg border border-[var(--border-color)] bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        {activeCampaign && (
          <div className="text-sm text-slate-500">
            Viewing: <span className="font-medium text-slate-700">{activeCampaign.name}</span>
          </div>
        )}
      </div>

      <div className="bg-white border border-[var(--border-color)] rounded-xl p-4">
        {campaignsLoading ? (
          <div className="flex justify-center items-center h-28">
            <Spinner size={24} className="text-[var(--blue-600)]" />
          </div>
        ) : (campaigns?.length ?? 0) === 0 ? (
          <EmptyState
            title="No campaigns yet"
            description="Create a campaign to start collecting and managing pledges."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {campaigns?.map((campaign) => {
              const isSelected = selectedCampaign === campaign.id;

              return (
                <div
                  key={campaign.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    isSelected
                      ? "border-[var(--blue-600)] bg-blue-50/50"
                      : "border-[var(--border-color)] bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{campaign.name}</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {campaign.description?.trim() || "No description provided."}
                      </p>
                    </div>
                    {isSelected && <Badge tone="primary">Selected</Badge>}
                  </div>
                  <div className="mt-4 space-y-1 text-sm text-slate-500">
                    <p>
                      Target:{" "}
                      <span className="font-medium text-slate-700">
                        {campaign.target_amount != null
                          ? `GHS ${campaign.target_amount.toLocaleString("en", {
                              minimumFractionDigits: 2,
                            })}`
                          : "Not set"}
                      </span>
                    </p>
                    <p>
                      Dates:{" "}
                      <span className="font-medium text-slate-700">
                        {campaign.start_date
                          ? format(new Date(campaign.start_date), "dd MMM yyyy")
                          : "No start date"}
                        {" - "}
                        {campaign.end_date
                          ? format(new Date(campaign.end_date), "dd MMM yyyy")
                          : "No end date"}
                      </span>
                    </p>
                  </div>
                  <div className="mt-4 flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant={isSelected ? "primary" : "secondary"}
                      onClick={() => {
                        setSelectedCampaign(campaign.id);
                        setPage(1);
                      }}
                    >
                      {isSelected ? "Viewing Pledges" : "View Pledges"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditCampaign(campaign)}
                    >
                      <Pencil size={14} />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:bg-red-50 hover:text-red-700"
                      onClick={() => setDeleteTarget(campaign)}
                    >
                      <Trash size={14} />
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white border border-[var(--border-color)] rounded-xl overflow-hidden">
        {!selectedCampaign ? <EmptyState title="Select a campaign" description="Choose a campaign card above to view and manage pledges." /> :
          pledgesLoading ? <div className="flex justify-center items-center h-48"><Spinner size={24} className="text-[var(--blue-600)]" /></div> :
          pledges.length === 0 ? <EmptyState title="No pledges for this campaign" description="Add a pledge to start tracking commitments for this campaign." /> :
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <tr>{["Member", "Pledged", "Paid", "Status", "Due Date"].map(h => <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {pledges.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">{p.member?.first_name} {p.member?.last_name}</td>
                    <td className="px-5 py-3">GHS {p.pledged_amount.toLocaleString()}</td>
                    <td className="px-5 py-3">GHS {p.paid_amount.toLocaleString()}</td>
                    <td className="px-5 py-3"><Badge tone={p.status === "fulfilled" ? "success" : p.status === "cancelled" ? "danger" : "warning"}>{p.status}</Badge></td>
                    <td className="px-5 py-3 text-slate-500">{p.due_date ? format(new Date(p.due_date), "dd MMM yyyy") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
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

      <Modal open={addCampaignOpen} onClose={() => { setAddCampaignOpen(false); setEditingCampaign(null); campaignForm.reset(); }} title={editingCampaign ? "Edit Campaign" : "New Campaign"}>
        <form onSubmit={campaignForm.handleSubmit(onCampaignSubmit)} className="space-y-4">
          <Input label="Campaign Name" {...campaignForm.register("name")} required />
          <Input label="Target Amount (GHS)" type="number" step="0.01" {...campaignForm.register("target_amount")} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" {...campaignForm.register("start_date")} />
            <Input label="End Date" type="date" {...campaignForm.register("end_date")} />
          </div>
          <Textarea label="Description" {...campaignForm.register("description")} />
          <div className="flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => { setAddCampaignOpen(false); setEditingCampaign(null); campaignForm.reset(); }}>Cancel</Button><Button type="submit" disabled={createCampaign.isPending || updateCampaign.isPending}>{createCampaign.isPending || updateCampaign.isPending ? "Saving..." : editingCampaign ? "Save Changes" : "Create Campaign"}</Button></div>
        </form>
      </Modal>

      <Modal open={addPledgeOpen} onClose={() => setAddPledgeOpen(false)} title="Add Pledge">
        <form onSubmit={pledgeForm.handleSubmit(onPledgeSubmit)} className="space-y-4">
          <Controller name="member_id" control={pledgeForm.control} render={({ field }) => <SearchableSelect label="Member" options={memberOptions} placeholder="Select member" showSearch={showMemberSearch} searchPlaceholder="Search members..." {...field} required />} />
          <Input label="Pledged Amount (GHS)" type="number" {...pledgeForm.register("pledged_amount")} required />
          <Input label="Due Date" type="date" {...pledgeForm.register("due_date")} />
          <div className="flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => setAddPledgeOpen(false)}>Cancel</Button><Button type="submit" disabled={createPledge.isPending}>{createPledge.isPending ? "Saving..." : "Save Pledge"}</Button></div>
        </form>
      </Modal>

      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) {
            return;
          }

          return deleteCampaign.mutateAsync(deleteTarget.id).then(() => {
            if (selectedCampaign === deleteTarget.id) {
              setSelectedCampaign("");
            }
            setDeleteTarget(null);
            setPage(1);
          });
        }}
        description={`Are you sure you want to delete "${deleteTarget?.name ?? ""}"? Any pledges linked to this campaign will also be removed.`}
        isPending={deleteCampaign.isPending}
      />
    </div>
  );
}

// ─── Main Finance Page ────────────────────────────────────────────────────────

const TABS = [
  { id: "donations", label: "Donations", icon: <CurrencyDollar size={16} /> },
  { id: "pledges",   label: "Pledges",   icon: <Handshake size={16} /> },
  { id: "expenses",  label: "Expenses",  icon: <Receipt size={16} /> },
];

export default function FinancePage() {
  const [tab, setTab] = useState("donations");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Finance</h1>
        <p className="text-sm text-slate-500 mt-0.5">Track donations, pledges, and expenses</p>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div>
        {tab === "donations" && <DonationsTab />}
        {tab === "pledges"   && <PledgesTab />}
        {tab === "expenses"  && <ExpensesTab />}
      </div>
    </div>
  );
}
