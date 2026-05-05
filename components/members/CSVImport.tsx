"use client";

import { ChangeEvent, useState } from "react";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

import { parseMembersCsv } from "@/lib/csv";
import { importMembersAction } from "@/lib/actions/memberActions";

interface CsvImportResult {
  message?: string;
  success: boolean;
  email: string;
}

export function CSVImport() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [preview, setPreview] = useState<string[]>([]);
  const [fileContent, setFileContent] = useState<string>();
  const [results, setResults] = useState<CsvImportResult[]>([]);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setFileContent(text);
      parseMembersCsv(text).then((parsed) => {
        setPreview(
          parsed.rows.slice(0, 5).map((row) => `${row.first_name} ${row.last_name} (${row.email})`)
        );
        setErrors(parsed.errors);
      });
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!fileContent) return;
    setLoading(true);
    try {
      const payload = await parseMembersCsv(fileContent);
      const res = await importMembersAction(payload.rows as any);
      if (res.success || res.details) {
        setResults(res.details);
      } else {
        setErrors(["Failed to import CSV completely"]);
      }
    } catch(err) {
      setErrors([err instanceof Error ? err.message : "Failed to import CSV"]);
    }
    setLoading(false);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
      <div>
        <p className="text-sm font-semibold text-slate-500">Bulk import members</p>
        <p className="text-xs text-slate-400">Upload a CSV with names, emails, phones, departments, etc.</p>
      </div>
      <Input type="file" accept=".csv" onChange={handleFile} />
      {preview.length > 0 && (
        <div className="text-xs text-slate-500 space-y-0.5">
          <p className="font-semibold">Preview</p>
          {preview.map((row) => (
            <p key={row}>{row}</p>
          ))}
        </div>
      )}
      {errors.length > 0 && (
        <div className="text-xs text-red-600 space-y-0.5">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}
      {results.length > 0 && (
        <div className="text-xs text-slate-500 space-y-0.5">
          {results.map((result) => (
            <p key={`${result.email}-${result.message ?? "ok"}`}>
              {result.success ? "Success" : "Failed"} {result.email} {result.message ? `- ${result.message}` : ""}
            </p>
          ))}
        </div>
      )}
      <Button onClick={handleImport} disabled={loading || !fileContent}>
        {loading ? "Importing..." : "Import members"}
      </Button>
    </div>
  );
}
