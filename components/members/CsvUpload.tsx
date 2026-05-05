"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import {
  CheckCircle,
  DownloadSimple,
  FileArrowUp,
  Trash,
  Warning,
  X,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useCreateMember } from "@/lib/hooks/useMembers";
import { ApiError } from "@/lib/api/client";
import { useToastStore } from "@/lib/stores/toastStore";

interface CsvUploadProps {
  open: boolean;
  onClose: () => void;
}

type CsvRow = Record<string, string>;

const TEMPLATE_HEADERS = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "gender",
  "occupation",
  "marital_status",
  "join_date",
  "address",
] as const;

const VALID_MARITAL_STATUSES = new Set([
  "single",
  "married",
  "widowed",
  "divorced",
]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CsvUpload({ open, onClose }: CsvUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<CsvRow[]>([]);
  const [errors, setErrors] = useState<{ row: number; msg: string }[]>([]);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMember = useCreateMember();
  const addToast = useToastStore((state) => state.addToast);

  const resetState = () => {
    setFile(null);
    setData([]);
    setErrors([]);
    setImporting(false);
    setImportedCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const formatHeader = (key: string) =>
    key
      .replace(/_/g, " ")
      .replace(/\w\S*/g, (part) => part.charAt(0).toUpperCase() + part.slice(1));

  const getRowValidationErrors = (
    row: CsvRow,
    rowIndex: number,
  ): { row: number; msg: string }[] => {
    const rowErrors: { row: number; msg: string }[] = [];
    const firstName = (row.first_name ?? "").trim();
    const lastName = (row.last_name ?? "").trim();
    const email = (row.email ?? "").trim();
    const maritalStatus = (row.marital_status ?? "").trim().toLowerCase();
    const joinDate = (row.join_date ?? "").trim();

    if (!firstName || !lastName) {
      rowErrors.push({ row: rowIndex + 1, msg: "Missing first or last name" });
    }

    if (email && !EMAIL_PATTERN.test(email)) {
      rowErrors.push({ row: rowIndex + 1, msg: "Email address is not valid" });
    }

    if (maritalStatus && !VALID_MARITAL_STATUSES.has(maritalStatus)) {
      rowErrors.push({
        row: rowIndex + 1,
        msg: "Marital status must be single, married, widowed, or divorced",
      });
    }

    if (joinDate) {
      const joinDateIsValid =
        /^\d{4}-\d{2}-\d{2}$/.test(joinDate) &&
        !Number.isNaN(Date.parse(joinDate));

      if (!joinDateIsValid) {
        rowErrors.push({
          row: rowIndex + 1,
          msg: "Join date must use YYYY-MM-DD format",
        });
      }
    }

    return rowErrors;
  };

  const getImportErrorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
      const payload = error.details as
        | {
            error?: string;
            details?: {
              fieldErrors?: Record<string, string[] | undefined>;
              formErrors?: string[];
            };
          }
        | undefined;
      const fieldErrors = payload?.details?.fieldErrors;

      if (fieldErrors) {
        for (const [field, messages] of Object.entries(fieldErrors)) {
          if (messages?.length) {
            return `${formatHeader(field)}: ${messages[0]}`;
          }
        }
      }

      if (payload?.details?.formErrors?.length) {
        return payload.details.formErrors[0];
      }

      return payload?.error ?? error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "Unknown error";
  };

  const getDisplayColumns = (): string[] => {
    const firstRowKeys = data[0] ? Object.keys(data[0]) : [];
    const orderedTemplateKeys: string[] = TEMPLATE_HEADERS.filter((header) =>
      firstRowKeys.includes(header)
    );
    const remainingKeys = firstRowKeys.filter(
      (key) => !orderedTemplateKeys.includes(key)
    );
    return [...orderedTemplateKeys, ...remainingKeys];
  };

  const validateData = (rows: CsvRow[]) => {
    const newErrors = rows.flatMap((row, index) => getRowValidationErrors(row, index));
    setErrors(newErrors);
  };

  const updateCell = (rowIndex: number, key: string, value: string) => {
    setData((prev) => {
      const newData = prev.map((row, index) =>
        index === rowIndex ? { ...row, [key]: value } : row
      );
      validateData(newData);
      return newData;
    });
  };

  const deleteRow = (rowIndex: number) => {
    setData((prev) => {
      const newData = prev.filter((_, index) => index !== rowIndex);
      validateData(newData);
      return newData;
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    setData([]);
    setImportedCount(0);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) =>
        header
          .trim()
          .toLowerCase()
          .replace(/[\s-]+/g, "_"),
      complete: (results) => {
        const rows = (results.data as Record<string, unknown>[]).map((row) => {
          const normalizedRow: CsvRow = {};

          Object.entries(row).forEach(([key, value]) => {
            if (!key) {
              return;
            }
            normalizedRow[key] = value == null ? "" : String(value).trim();
          });

          return normalizedRow;
        });

        setData(rows);
        validateData(rows);
      },
    });
  };

  const downloadTemplate = () => {
    const csv = Papa.unparse([TEMPLATE_HEADERS]);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "members_template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const startImport = async () => {
    if (errors.length > 0 || data.length === 0) {
      return;
    }

    setImporting(true);
    setImportedCount(0);
    let successCount = 0;
    const failedRows: CsvRow[] = [];
    const failedErrors: { row: number; msg: string }[] = [];

    for (const row of data) {
      try {
        await createMember.mutateAsync({
          first_name: row.first_name?.trim(),
          last_name: row.last_name?.trim(),
          email: row.email?.trim() || undefined,
          phone: row.phone?.trim() || undefined,
          gender: row.gender?.trim().toLowerCase() || undefined,
          occupation: row.occupation?.trim() || undefined,
          marital_status: row.marital_status?.trim().toLowerCase() as
            | "single"
            | "married"
            | "widowed"
            | "divorced"
            | undefined,
          join_date: row.join_date?.trim() || new Date().toISOString().split("T")[0],
          address: row.address?.trim() || undefined,
          membership_status: "active",
        });

        successCount += 1;
        setImportedCount(successCount);
      } catch (error) {
        failedRows.push(row);
        failedErrors.push({
          row: failedRows.length,
          msg: getImportErrorMessage(error),
        });
        console.error("Import failed for row", { row: failedRows.length, values: row }, error);
      }
    }

    setImporting(false);

    if (failedRows.length === 0) {
      addToast(`All ${successCount} members imported successfully`);
      handleClose();
      return;
    }

    setData(failedRows);
    setErrors(failedErrors);
    setImportedCount(0);
    addToast(
      `Imported ${successCount} of ${data.length} members. ${failedRows.length} row${failedRows.length === 1 ? "" : "s"} still need attention.`,
      "warning",
    );
  };

  const columns = getDisplayColumns();
  const hasValidationErrors = errors.length > 0;

  if (!file) {
    return (
      <Modal open={open} onClose={handleClose} title="Bulk Import Members" size="lg">
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border-color)] bg-slate-50 p-10 transition-colors hover:bg-slate-100">
            <FileArrowUp size={48} className="mb-4 text-slate-300" />
            <p className="text-base font-medium text-[var(--text-primary)]">Choose a CSV file</p>
            <p className="mt-1 mb-6 text-center text-sm text-[var(--text-muted)]">
              Your CSV should include headers like first_name, last_name, email, phone,
              gender, occupation, marital_status, join_date, and address.
            </p>

            <div className="flex gap-3">
              <Button onClick={() => fileInputRef.current?.click()}>Select File</Button>
              <Button variant="secondary" onClick={downloadTemplate}>
                <DownloadSimple size={18} />
                Download Template
              </Button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={handleClose} title="Review CSV Data" size="full">
      <div className="flex h-full min-h-0 flex-col gap-4">
        <div className="flex items-center justify-between rounded-lg border border-[var(--border-color)] bg-white px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{file.name}</p>
            <p className="text-xs text-[var(--text-secondary)]">
              {(file.size / 1024).toFixed(1)} KB · {data.length} rows
            </p>
          </div>

          <div className="flex items-center gap-3">
            {hasValidationErrors ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-[var(--danger-bg)] px-2.5 py-1 text-xs font-medium text-[var(--danger-text)]">
                <Warning size={14} weight="fill" />
                {errors.length} validation issue{errors.length === 1 ? "" : "s"}
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-[var(--success-bg)] px-2.5 py-1 text-xs font-medium text-[var(--success-text)]">
                <CheckCircle size={14} weight="fill" />
                Valid data
              </div>
            )}

            <button
              onClick={resetState}
              className="rounded-lg p-1 text-[var(--text-muted)] transition-colors hover:bg-slate-100 hover:text-[var(--text-primary)]"
              aria-label="Remove selected file"
              disabled={importing}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {hasValidationErrors && (
          <div className="rounded-lg border border-red-200 bg-[var(--danger-bg)] px-3 py-2">
            <div className="mb-1 flex items-center gap-2 text-[var(--danger-text)]">
              <Warning size={16} weight="fill" />
              <p className="text-xs font-semibold">Fix required fields before importing</p>
            </div>
            <p className="text-xs text-[var(--danger-text)]">
              Rows with issues: {errors.map((error) => error.row).join(", ")}
            </p>
            <div className="mt-2 space-y-1">
              {errors.slice(0, 5).map((error) => (
                <p key={`${error.row}-${error.msg}`} className="text-xs text-[var(--danger-text)]">
                  Row {error.row}: {error.msg}
                </p>
              ))}
              {errors.length > 5 ? (
                <p className="text-xs text-[var(--danger-text)]">
                  Plus {errors.length - 5} more issue{errors.length - 5 === 1 ? "" : "s"}.
                </p>
              ) : null}
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-[var(--border-color)]">
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr>
                  <th className="sticky left-0 z-20 w-16 border-b border-[var(--border-color)] bg-slate-50 px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                    #
                  </th>
                  {columns.map((key) => (
                    <th
                      key={key}
                      className="min-w-[180px] border-b border-[var(--border-color)] px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]"
                    >
                      {formatHeader(key)}
                    </th>
                  ))}
                  <th className="w-16 border-b border-[var(--border-color)] px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                    Remove
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.map((row, rowIndex) => (
                  <tr
                    key={`${rowIndex}-${Object.values(row).join("|")}`}
                    className="border-b border-[var(--border-color)] last:border-b-0"
                  >
                    <td className="sticky left-0 bg-white px-2 py-2 text-xs text-slate-400 align-top">
                      {rowIndex + 1}
                    </td>

                    {columns.map((key) => (
                      <td key={`${rowIndex}-${key}`} className="px-1 py-1.5 align-top">
                        <input
                          value={row[key] ?? ""}
                          onChange={(event) =>
                            updateCell(rowIndex, key, event.target.value)
                          }
                          className="w-full bg-transparent px-2 py-1.5 text-sm text-slate-700 border border-transparent rounded hover:border-[var(--border-color)] focus:border-[var(--blue-500)] focus:outline-none focus:ring-1 focus:ring-[var(--blue-500)]"
                        />
                      </td>
                    ))}

                    <td className="px-2 py-1.5 text-center align-top">
                      <button
                        type="button"
                        onClick={() => deleteRow(rowIndex)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete row ${rowIndex + 1}`}
                        disabled={importing}
                      >
                        <Trash size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {data.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                No data rows available.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 border-t border-[var(--border-color)] pt-4">
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={resetState} disabled={importing}>
              Reset
            </Button>
            <Button
              onClick={startImport}
              disabled={importing || hasValidationErrors || data.length === 0}
              className="min-w-[160px]"
            >
              {importing ? (
                <>
                  <Spinner size={16} />
                  Importing... ({importedCount}/{data.length})
                </>
              ) : (
                "Import Members"
              )}
            </Button>
          </div>

          {importing && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-1.5 rounded-full bg-[var(--blue-600)] transition-all duration-300"
                style={{
                  width:
                    data.length > 0
                      ? `${(importedCount / data.length) * 100}%`
                      : "0%",
                }}
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
