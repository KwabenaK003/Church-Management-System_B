"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  useSmsCampaignsPaginated,
  useCreateSmsCampaign,
  useUpdateSmsCampaign,
  useDeleteSmsCampaign,
  useSmsTemplates,
  useCreateSmsTemplate,
  useDeleteSmsTemplate,
} from "@/lib/hooks/useSms";
import { useClusters } from "@/lib/hooks/useClusters";
import {
  Plus,
  ChatCircleText,
  Trash,
  FileText,
  MagnifyingGlass,
  Pencil,
} from "@phosphor-icons/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { SMSCampaign, SMSTarget, SMSTemplate } from "@/types";

const TARGET_OPTIONS = [
  { value: "all_members", label: "All Members" },
  { value: "all_visitors", label: "All Visitors" },
  { value: "cluster", label: "Specific Department" },
];

const campaignSchema = z.object({
  name: z.string().min(1, "Required"),
  message: z.string().min(1, "Required"),
  target: z.string().default("all_members"),
  cluster_id: z.string().optional(),
  scheduled_for: z.string().optional(),
});

const templateSchema = z.object({
  name: z.string().min(1, "Required"),
  body: z.string().min(1, "Required"),
});

function CampaignsTab() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editingCampaign, setEditingCampaign] = useState<SMSCampaign | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<SMSCampaign | null>(null);
  const { data: campaignsData, isLoading } = useSmsCampaignsPaginated(
    search,
    page,
    rowsPerPage,
  );
  const campaigns = campaignsData?.data ?? [];
  const totalCount = campaignsData?.count ?? 0;
  const { data: clusters } = useClusters();
  const createCampaign = useCreateSmsCampaign();
  const updateCampaign = useUpdateSmsCampaign();
  const deleteCampaign = useDeleteSmsCampaign();
  const { register, handleSubmit, reset, control, watch } = useForm({
    resolver: zodResolver(campaignSchema),
  });
  const targetValue = watch("target");

  const clusterOptions =
    clusters?.map((c) => ({ value: c.id, label: c.name })) ?? [];

  function openNewCampaign() {
    setEditingCampaign(null);
    reset({
      name: "",
      message: "",
      target: "all_members",
      cluster_id: "",
      scheduled_for: "",
    });
    setOpen(true);
  }

  function openEditCampaign(campaign: SMSCampaign) {
    setEditingCampaign(campaign);
    reset({
      name: campaign.name,
      message: campaign.message,
      target: campaign.target,
      cluster_id: campaign.cluster_id ?? "",
      scheduled_for: campaign.scheduled_for
        ? format(new Date(campaign.scheduled_for), "yyyy-MM-dd'T'HH:mm")
        : "",
    });
    setOpen(true);
  }

  async function onSubmit(data: any) {
    const payload = {
      ...data,
      target: data.target as SMSTarget,
      cluster_id: data.target === "cluster" ? data.cluster_id || null : null,
      scheduled_for: data.scheduled_for || null,
    };

    if (editingCampaign) {
      await updateCampaign.mutateAsync({
        id: editingCampaign.id,
        ...payload,
      });
    } else {
      await createCampaign.mutateAsync({
        ...payload,
        status: "draft",
      });
    }

    reset();
    setOpen(false);
    setEditingCampaign(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
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
            placeholder="Search campaigns..."
            className="w-full rounded-lg border border-[var(--border-color)] bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <Button onClick={openNewCampaign}>
          <Plus size={16} />
          New Campaign
        </Button>
      </div>

      <div className="bg-white border border-[var(--border-color)] rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Spinner size={24} className="text-[var(--blue-600)]" />
          </div>
        ) : campaigns.length === 0 ? (
          <EmptyState
            icon={<ChatCircleText size={24} />}
            title="No campaigns yet"
            description="Create a campaign to send bulk SMS messages."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <tr>
                    {["Name", "Target", "Status", "Scheduled", ""].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left font-medium"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                          {c.message}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {c.target.replace("_", " ")}
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          tone={
                            c.status === "sent"
                              ? "success"
                              : c.status === "failed"
                                ? "danger"
                                : "neutral"
                          }
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {c.scheduled_for
                          ? format(new Date(c.scheduled_for), "dd MMM yyyy HH:mm")
                          : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {c.status === "draft" && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={async () => {
                                alert(
                                  `Sending to ${c.target}... (Connect Hubtel credentials in Settings)`,
                                );
                              }}
                            >
                              Send
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditCampaign(c)}
                          >
                            <Pencil size={14} />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:bg-red-50 hover:text-red-700"
                            onClick={() => setDeleteTarget(c)}
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
            <div className="px-5 py-4 border-t border-[var(--border-color)]">
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
            </div>
          </>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingCampaign(null);
          reset();
        }}
        title={editingCampaign ? "Edit SMS Campaign" : "New SMS Campaign"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Campaign Name" {...register("name")} required />
          <Controller
            name="target"
            control={control}
            render={({ field }) => (
              <Select label="Target Audience" options={TARGET_OPTIONS} {...field} />
            )}
          />
          {targetValue === "cluster" && (
            <Controller
              name="cluster_id"
              control={control}
              render={({ field }) => (
                <Select
                  label="Select Department"
                  options={clusterOptions}
                  placeholder="Choose department"
                  {...field}
                  required
                />
              )}
            />
          )}
          <div>
            <label
              htmlFor="sms-campaign-message"
              className="text-sm font-medium text-slate-700 block mb-1"
            >
              Message
            </label>
            <textarea
              id="sms-campaign-message"
              {...register("message")}
              rows={5}
              className="w-full border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
              placeholder="Type your message here..."
            />
          </div>
          <Input
            label="Schedule For (optional)"
            type="datetime-local"
            {...register("scheduled_for")}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setOpen(false);
                setEditingCampaign(null);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createCampaign.isPending || updateCampaign.isPending}
            >
              {createCampaign.isPending || updateCampaign.isPending
                ? "Saving..."
                : editingCampaign
                  ? "Save Changes"
                  : "Save Campaign"}
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

          return deleteCampaign.mutateAsync(deleteTarget.id).then(() => {
            setDeleteTarget(null);
          });
        }}
        description={`Are you sure you want to delete the "${deleteTarget?.name}" campaign? This action cannot be undone.`}
        isPending={deleteCampaign.isPending}
      />
    </div>
  );
}

function TemplatesTab() {
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SMSTemplate | null>(null);
  const { data: templates, isLoading } = useSmsTemplates();
  const createTemplate = useCreateSmsTemplate();
  const deleteTemplate = useDeleteSmsTemplate();
  const { register, handleSubmit, reset } = useForm({
    resolver: zodResolver(templateSchema),
  });

  async function onSubmit(data: any) {
    await createTemplate.mutateAsync(data);
    reset();
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} />
          New Template
        </Button>
      </div>

      {isLoading ? (
        <Spinner size={24} className="text-[var(--blue-600)]" />
      ) : templates?.length === 0 ? (
        <EmptyState icon={<FileText size={24} />} title="No templates yet" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {templates?.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-[var(--border-color)] rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                <button
                  onClick={() => setDeleteTarget(t)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash size={15} />
                </button>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">{t.body}</p>
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
        title="New SMS Template"
        size="sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Template Name" {...register("name")} required />
          <Textarea label="Message Body" {...register("body")} rows={5} required />
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
            <Button type="submit" disabled={createTemplate.isPending}>
              Save Template
            </Button>
          </div>
        </form>
      </Modal>

      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteTemplate.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
          });
        }}
        description={`Are you sure you want to delete the "${deleteTarget?.name}" template? This action cannot be undone.`}
        isPending={deleteTemplate.isPending}
      />
    </div>
  );
}

const TABS = [
  { id: "campaigns", label: "Campaigns", icon: <ChatCircleText size={16} /> },
  { id: "templates", label: "Templates", icon: <FileText size={16} /> },
];

export default function SmsPage() {
  const [tab, setTab] = useState("campaigns");
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Bulk SMS</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Send SMS campaigns and manage templates
        </p>
      </div>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div>
        {tab === "campaigns" && <CampaignsTab />}
        {tab === "templates" && <TemplatesTab />}
      </div>
    </div>
  );
}
