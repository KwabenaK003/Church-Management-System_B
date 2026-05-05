"use client";

import { useState } from "react";
import Image from "next/image";
import {
  useServices,
  useCreateService,
  useCloseService,
  useAttendance,
  useAttendancePaginated,
} from "@/lib/hooks/useAttendance";
import { Service } from "@/types";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Dropdown } from "@/components/ui/Dropdown";
import { Pagination } from "@/components/ui/Pagination";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { exportToCsv } from "@/lib/utils/exportCsv";
import { usePersistentTableSelection } from "@/lib/hooks/usePersistentTableSelection";
import {
  Plus,
  CalendarCheck,
  Copy,
  Users,
  DotsThree,
  QrCode,
  DownloadSimple,
  Export,
  LockSimple,
} from "@phosphor-icons/react";
import { useToastStore } from "@/lib/stores/toastStore";
import QRCode from "qrcode";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

const serviceSchema = z.object({
  name: z.string().min(1, "Service name required"),
  service_date: z.string().min(1, "Date required"),
  service_type: z.string().optional(),
  expected_count: z.string().optional(),
  notes: z.string().optional(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export default function AttendancePage() {
  const [addOpen, setAddOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [closeTarget, setCloseTarget] = useState<Service | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const addToast = useToastStore((s) => s.addToast);

  const { data: services, isLoading: servicesLoading } = useServices();
  const activeServiceId =
    selectedService && services?.some((service) => service.id === selectedService)
      ? selectedService
      : services?.[0]?.id ?? null;
  const { data: attendance } = useAttendance(activeServiceId ?? undefined);
  const { data: attendanceData, isLoading: attendanceLoading } =
    useAttendancePaginated(activeServiceId ?? undefined, page, rowsPerPage);
  const createService = useCreateService();
  const closeService = useCloseService();
  const records = attendanceData?.data ?? [];
  const totalCount = attendanceData?.count ?? 0;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { service_type: "Saturday" },
  });

  async function onSubmit(data: ServiceFormData) {
    await createService.mutateAsync({
      name: data.name,
      service_date: data.service_date,
      service_type: data.service_type as Service["service_type"],
      expected_count: data.expected_count
        ? parseInt(data.expected_count, 10)
        : undefined,
      notes: data.notes,
    });
    reset();
    setAddOpen(false);
  }

  function copyCheckinUrl(serviceId: string) {
    const url = `${window.location.origin}/attendance/${serviceId}`;
    navigator.clipboard.writeText(url);
    addToast("Check-in link copied to clipboard");
  }

  async function generateQr(serviceId: string) {
    const url = `${window.location.origin}/attendance/${serviceId}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 });
    setQrDataUrl(dataUrl);
    setQrOpen(true);
  }

  const selected = services?.find((service) => service.id === activeServiceId);
  const isSelectedServiceClosed = selected?.status === "closed";
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
    `attendance:${activeServiceId ?? "none"}`,
    records.map((r) => r.id)
  );

  function handleSelectService(serviceId: string) {
    setSelectedService(serviceId);
    setPage(1);
  }

  function handleExport() {
    const dataToExport = records.map((r) => ({
      first_name: r.member?.first_name ?? "",
      last_name: r.member?.last_name ?? "",
      checked_in_at: r.checked_in_at,
    }));
    exportToCsv(dataToExport, `attendance-${selected?.name ?? "export"}`, [
      { key: "first_name", header: "First Name" },
      { key: "last_name", header: "Last Name" },
      { key: "checked_in_at", header: "Check-in Time" },
    ]);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Attendance</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {services ? services.length : 0} service
            {services?.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={16} />
          Create Service
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex min-h-[500px] flex-col overflow-hidden rounded-xl border border-[var(--border-color)] bg-white lg:col-span-1">
          <div className="border-b border-[var(--border-color)] bg-slate-50/50 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Services</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {servicesLoading ? (
              <div className="flex h-48 items-center justify-center">
                <Spinner size={32} />
              </div>
            ) : !services || services.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={<CalendarCheck size={24} />}
                  title="No services found"
                  description="Create your first service to start tracking attendance."
                />
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-[var(--border-color)]">
                {services.map((service) => {
                  const isSelected = service.id === selectedService;

                  const typeTones: Record<
                    string,
                    "success" | "warning" | "danger" | "neutral" | "primary"
                  > = {
                    Saturday: "primary",
                    Midweek: "success",
                    Special: "warning",
                  };
                  const tone = typeTones[service.service_type] || "neutral";

                  return (
                    <button
                      key={service.id}
                      onClick={() => handleSelectService(service.id)}
                      className={`group w-full text-left transition-colors hover:bg-slate-50 ${
                        isSelected ? "bg-slate-50" : "bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 px-5 py-4">
                        <div>
                          <h3
                            className={`font-medium ${isSelected ? "text-slate-900" : "text-slate-700"}`}
                          >
                            {service.name}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            {format(
                              new Date(service.service_date),
                              "MMM d, yyyy",
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge tone={tone}>{service.service_type}</Badge>
                          <Badge
                            tone={service.status === "open" ? "success" : "neutral"}
                          >
                            {service.status === "open" ? "Open" : "Closed"}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-[500px] flex-col overflow-hidden rounded-xl border border-[var(--border-color)] bg-white lg:col-span-2">
          {!selectedService || !selected ? (
            <div className="flex h-full min-h-[400px] items-center justify-center py-12">
              <EmptyState
                icon={<CalendarCheck size={24} />}
                title="Select a service"
                description="Choose a service from the list to view attendance details."
              />
            </div>
          ) : (
            <>
              <div className="flex flex-col justify-between gap-4 border-b border-[var(--border-color)] bg-slate-50/50 p-6 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-slate-900">
                      {selected.name}
                    </h2>
                    <Badge tone={isSelectedServiceClosed ? "neutral" : "success"}>
                      {isSelectedServiceClosed ? "Closed" : "Open"}
                    </Badge>
                  </div>
                  <p className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                    <span>
                      {format(
                        new Date(selected.service_date),
                        "MMMM d, yyyy 'at' h:mm a",
                      )}
                    </span>
                    <span>•</span>
                    <span>
                      Checked In:{" "}
                      <strong className="font-medium text-slate-900">
                        {attendance?.length || 0}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Expected:{" "}
                      <strong className="font-medium text-slate-900">
                        {selected.expected_count || 0}
                      </strong>
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleExport}
                    disabled={records.length === 0}
                  >
                    <Export size={16} />
                    Export
                  </Button>
                  {!isSelectedServiceClosed && (
                    <Dropdown
                      trigger={<DotsThree size={22} weight="bold" />}
                      items={[
                        {
                          label: "Copy Link",
                          icon: <Copy size={16} />,
                          onClick: () => copyCheckinUrl(selectedService),
                        },
                        {
                          label: "Generate QR Code",
                          icon: <QrCode size={16} />,
                          onClick: () => generateQr(selectedService),
                        },
                        {
                          label: "Close Service",
                          icon: <LockSimple size={16} />,
                          variant: "danger",
                          onClick: () => setCloseTarget(selected),
                        },
                      ]}
                    />
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                  {isSelectedServiceClosed && (
                    <div className="mx-6 mt-4 rounded-lg border border-[var(--border-color)] bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      This service is closed. New check-ins are disabled.
                    </div>
                  )}
                {selectedCount > 0 && (
                  <div className="px-6 pt-4">
                    <TableToolbar
                      selectedCount={selectedCount}
                      onClearSelection={clearSelection}
                    />
                  </div>
                )}
                {attendanceLoading ? (
                  <div className="flex h-48 items-center justify-center">
                    <Spinner size={32} />
                  </div>
                ) : records.length === 0 ? (
                  <div className="py-16">
                    <EmptyState
                      icon={<Users size={24} />}
                      title={
                        isSelectedServiceClosed
                          ? "Check-ins are closed"
                          : "No attendees yet"
                      }
                      description={
                        isSelectedServiceClosed
                          ? "This service is closed and no more check-ins can be recorded."
                          : "Share the check-in link to start recording attendance."
                      }
                    />
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="w-10 px-6 py-3">
                          <Checkbox
                            checked={allVisibleSelected}
                            indeterminate={someVisibleSelected}
                            onChange={toggleVisibleRows}
                          />
                        </th>
                        <th className="whitespace-nowrap px-6 py-3 text-left font-medium">
                          Name
                        </th>
                        <th className="whitespace-nowrap px-6 py-3 text-right font-medium">
                          Time Logged
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {records.map((record) => (
                        <tr
                          key={record.id}
                          className="transition-colors hover:bg-slate-50"
                        >
                          <td className="px-6 py-4">
                            <Checkbox
                              checked={isSelected(record.id)}
                              onChange={() => toggleRow(record.id)}
                            />
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-900">
                            {record.member?.first_name}{" "}
                            {record.member?.last_name}
                          </td>
                          <td className="px-6 py-4 text-right text-slate-500">
                            {format(new Date(record.checked_in_at), "h:mm a")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

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
      </div>

      <DeleteConfirmModal
        open={!!closeTarget}
        onClose={() => setCloseTarget(null)}
        onConfirm={() => {
          if (!closeTarget) {
            return;
          }

          closeService.mutate(closeTarget.id, {
            onSuccess: () => {
              addToast(`${closeTarget.name} has been closed.`, "success");
              setCloseTarget(null);
            },
            onError: (error) => {
              const message =
                error instanceof Error
                  ? error.message
                  : "Failed to close service.";
              addToast(message, "error");
            },
          });
        }}
        title="Close Service"
        description={`Are you sure you want to close "${closeTarget?.name}"? This will stop all new check-ins for this service.`}
        isPending={closeService.isPending}
        confirmLabel="Close Service"
      />

      <Modal
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          reset();
        }}
        title="Create Service"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <Input
            label="Service Name"
            {...register("name")}
            error={errors.name?.message}
            required
            placeholder="e.g. Sabbath Service"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Date & Time"
              type="datetime-local"
              {...register("service_date")}
              error={errors.service_date?.message}
              required
            />

            <Controller
              name="service_type"
              control={control}
              render={({ field }) => (
                <Select
                  label="Service Type"
                  options={[
                    { value: "Saturday", label: "Saturday" },
                    { value: "Midweek", label: "Midweek" },
                    { value: "Special", label: "Special" },
                  ]}
                  {...field}
                />
              )}
            />
          </div>

          <Input
            label="Expected Attendance"
            type="number"
            {...register("expected_count")}
            placeholder="e.g. 150"
          />

          <Textarea
            label="Notes"
            {...register("notes")}
            rows={3}
            placeholder="Add any service notes..."
          />

          <div className="mt-6 flex justify-end gap-3 border-t border-[var(--border-color)] pt-4">
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
            <Button type="submit" disabled={createService.isPending}>
              {createService.isPending ? "Saving..." : "Create Service"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        title="Check-in QR Code"
        size="sm"
      >
        <div className="flex flex-col items-center gap-4 py-4">
          {qrDataUrl && (
            <Image
              src={qrDataUrl}
              alt="Check-in QR Code"
              width={256}
              height={256}
              unoptimized
              className="h-64 w-64 rounded-lg"
            />
          )}
          <p className="text-center text-sm text-slate-500">
            Members can scan this code to check in to the service.
          </p>
          {qrDataUrl && (
            <a
              href={qrDataUrl}
              download={`checkin-qr-${selectedService}.png`}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <DownloadSimple size={16} />
              Download QR Code
            </a>
          )}
        </div>
      </Modal>
    </div>
  );
}
