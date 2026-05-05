"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import {
  useDonationsPaginated,
  useCreateDonation,
  useDonationCategories,
  usePledgeCampaigns,
  useCreatePledgeCampaign,
  usePledgesPaginated,
  useCreatePledge,
  useExpensesPaginated,
  useCreateExpense,
  useUpdateExpense,
  useExpenseCategories,
} from "@/lib/hooks/useFinance";
import { useMembers } from "@/lib/hooks/useMembers";
import { Plus, CurrencyDollar, Handshake, Receipt, ChartBar } from "@phosphor-icons/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ApprovalStatus, PaymentMethod } from "@/types";

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
  const [addOpen, setAddOpen] = useState(false);
  const year: number | undefined = undefined;
  const month: number | undefined = undefined;
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { data, isLoading } = useDonationsPaginated(year, month, page, rowsPerPage);
  const { data: categories } = useDonationCategories();
  const { data: members } = useMembers();
  const createDonation = useCreateDonation();
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({ resolver: zodResolver(donationSchema) });

  const donations = data?.data ?? [];
  const totalCount = data?.count ?? 0;

  const total = donations.reduce((s, d) => s + d.amount, 0);

  async function onSubmit(data: z.infer<typeof donationSchema>) {
    await createDonation.mutateAsync({
      ...data,
      amount: parseFloat(data.amount),
      payment_method: data.payment_method as PaymentMethod,
      donation_date: data.donation_date || new Date().toISOString().split("T")[0],
    });
    reset(); setAddOpen(false);
  }

  const memberOptions = [{ value: "", label: "Anonymous / Walk-in" }, ...(members?.map(m => ({ value: m.id, label: `${m.first_name} ${m.last_name}` })) ?? [])];
  const categoryOptions = [{ value: "", label: "Uncategorised" }, ...(categories?.map(c => ({ value: c.id, label: c.name })) ?? [])];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="bg-white border border-[var(--border-color)] rounded-xl px-5 py-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Total Donations</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">GHS {total.toLocaleString("en", { minimumFractionDigits: 2 })}</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus size={16} />Record Donation</Button>
      </div>

      <div className="bg-white border border-[var(--border-color)] rounded-xl overflow-hidden">
        {isLoading ? <div className="flex justify-center items-center h-48"><Spinner size={24} className="text-[var(--blue-600)]" /></div> :
          donations.length === 0 ? <EmptyState title="No donations recorded" /> :
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <tr>{["Donor", "Category", "Amount", "Method", "Date"].map(h => <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>)}</tr>
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

      <Modal open={addOpen} onClose={() => { setAddOpen(false); reset(); }} title="Record Donation">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Controller name="member_id" control={control} render={({ field }) => <Select label="Member" options={memberOptions} {...field} />} />
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
            <Button variant="secondary" type="button" onClick={() => { setAddOpen(false); reset(); }}>Cancel</Button>
            <Button type="submit" disabled={createDonation.isPending}>{createDonation.isPending ? "Saving..." : "Save Donation"}</Button>
          </div>
        </form>
      </Modal>
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
  const [addOpen, setAddOpen] = useState(false);
  const year: number | undefined = undefined;
  const month: number | undefined = undefined;
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { data, isLoading } = useExpensesPaginated(year, month, page, rowsPerPage);
  const { data: categories } = useExpenseCategories();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const { register, handleSubmit, reset, control } = useForm({ resolver: zodResolver(expenseSchema) });

  const expenses = data?.data ?? [];
  const totalCount = data?.count ?? 0;

  const categoryOptions = [{ value: "", label: "Uncategorised" }, ...(categories?.map(c => ({ value: c.id, label: c.name })) ?? [])];

  async function onSubmit(data: z.infer<typeof expenseSchema>) {
    await createExpense.mutateAsync({
      ...data,
      amount: parseFloat(data.amount),
      payment_method: data.payment_method as PaymentMethod,
      expense_date: data.expense_date || new Date().toISOString().split("T")[0],
    });
    reset(); setAddOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)}><Plus size={16} />Record Expense</Button>
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
                      {e.approval_status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => updateExpense.mutate({ id: e.id, approval_status: "approved" })}>Approve</Button>
                          <Button size="sm" variant="danger" onClick={() => updateExpense.mutate({ id: e.id, approval_status: "rejected" })}>Reject</Button>
                        </div>
                      )}
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

      <Modal open={addOpen} onClose={() => { setAddOpen(false); reset(); }} title="Record Expense">
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
            <Button variant="secondary" type="button" onClick={() => { setAddOpen(false); reset(); }}>Cancel</Button>
            <Button type="submit" disabled={createExpense.isPending}>{createExpense.isPending ? "Saving..." : "Save Expense"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── Pledges Tab ──────────────────────────────────────────────────────────────

function PledgesTab() {
  const [addCampaignOpen, setAddCampaignOpen] = useState(false);
  const [addPledgeOpen, setAddPledgeOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { data: campaigns } = usePledgeCampaigns();
  const { data } = usePledgesPaginated(selectedCampaign || undefined, page, rowsPerPage);
  const { data: members } = useMembers();
  const createCampaign = useCreatePledgeCampaign();
  const createPledge = useCreatePledge();

  const pledges = data?.data ?? [];
  const totalCount = data?.count ?? 0;

  const campaignForm = useForm({ defaultValues: { name: "", description: "", target_amount: "", start_date: "", end_date: "" } });
  const pledgeForm = useForm({ defaultValues: { member_id: "", pledged_amount: "", due_date: "" } });

  const memberOptions = members?.map(m => ({ value: m.id, label: `${m.first_name} ${m.last_name}` })) ?? [];
  const campaignOptions = [{ value: "", label: "All Campaigns" }, ...(campaigns?.map(c => ({ value: c.id, label: c.name })) ?? [])];

  async function onCampaignSubmit(data: any) {
    await createCampaign.mutateAsync({ ...data, target_amount: data.target_amount ? parseFloat(data.target_amount) : undefined });
    campaignForm.reset(); setAddCampaignOpen(false);
  }

  async function onPledgeSubmit(data: any) {
    await createPledge.mutateAsync({ ...data, campaign_id: selectedCampaign, pledged_amount: parseFloat(data.pledged_amount) });
    pledgeForm.reset(); setAddPledgeOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={selectedCampaign}
          onChange={(e) => {
            setSelectedCampaign(e.target.value);
            setPage(1);
          }}
          className="border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm bg-white">
          {campaignOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <Button variant="secondary" size="sm" onClick={() => setAddCampaignOpen(true)}><Plus size={14} />New Campaign</Button>
        {selectedCampaign && <Button size="sm" onClick={() => setAddPledgeOpen(true)}><Plus size={14} />Add Pledge</Button>}
      </div>

      <div className="bg-white border border-[var(--border-color)] rounded-xl overflow-hidden">
        {selectedCampaign && pledges.length === 0 ? <EmptyState title="No pledges for this campaign" description="Add a pledge to start tracking commitments for this campaign." /> : !selectedCampaign ? <EmptyState title="Select a campaign" description="Choose a pledge campaign to view and manage pledges." /> :
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

      <Modal open={addCampaignOpen} onClose={() => setAddCampaignOpen(false)} title="New Campaign">
        <form onSubmit={campaignForm.handleSubmit(onCampaignSubmit)} className="space-y-4">
          <Input label="Campaign Name" {...campaignForm.register("name")} required />
          <Input label="Target Amount (GHS)" type="number" {...campaignForm.register("target_amount")} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" {...campaignForm.register("start_date")} />
            <Input label="End Date" type="date" {...campaignForm.register("end_date")} />
          </div>
          <Textarea label="Description" {...campaignForm.register("description")} />
          <div className="flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => setAddCampaignOpen(false)}>Cancel</Button><Button type="submit">Create</Button></div>
        </form>
      </Modal>

      <Modal open={addPledgeOpen} onClose={() => setAddPledgeOpen(false)} title="Add Pledge">
        <form onSubmit={pledgeForm.handleSubmit(onPledgeSubmit)} className="space-y-4">
          <Controller name="member_id" control={pledgeForm.control} render={({ field }) => <Select label="Member" options={memberOptions} placeholder="Select member" {...field} required />} />
          <Input label="Pledged Amount (GHS)" type="number" {...pledgeForm.register("pledged_amount")} required />
          <Input label="Due Date" type="date" {...pledgeForm.register("due_date")} />
          <div className="flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => setAddPledgeOpen(false)}>Cancel</Button><Button type="submit">Save Pledge</Button></div>
        </form>
      </Modal>
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
