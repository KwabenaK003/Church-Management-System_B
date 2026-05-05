import Papa from "papaparse";
import { Member } from "@/types";

export interface CsvMemberRow {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender?: string;
  date_of_birth?: string;
  address?: string;
  department?: string;
  role?: string;
  membership_status?: Member["membership_status"];
  profile_photo_url?: string;
}

export interface CsvParseResult {
  rows: CsvMemberRow[];
  errors: string[];
}

export function parseMembersCsv(content: string): Promise<CsvParseResult> {
  return new Promise((resolve) => {
    Papa.parse<CsvMemberRow>(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, "_"),
      complete: (result) => {
        const rows: CsvMemberRow[] = [];
        const errors: string[] = [];

        result.data.forEach((row, index) => {
          if (!row.first_name || !row.last_name || !row.email || !row.phone) {
            errors.push(`Row ${index + 2}: missing required fields.`);
            return;
          }
          rows.push(row);
        });

        resolve({ rows, errors });
      },
    });
  });
}
