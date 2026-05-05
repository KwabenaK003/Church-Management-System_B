import Papa from "papaparse";

type CsvColumn<T extends Record<string, unknown>> = {
  key: keyof T;
  header: string;
};

export function exportToCsv<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: CsvColumn<T>[]
): void {
  if (data.length === 0) {
    return;
  }

  const safeFilename = filename.toLowerCase().endsWith(".csv")
    ? filename
    : `${filename}.csv`;

  const rows = columns
    ? data.map((item) => {
        const mappedRow: Record<string, unknown> = {};

        columns.forEach(({ key, header }) => {
          mappedRow[header] = item[key];
        });

        return mappedRow;
      })
    : data;

  const csv = Papa.unparse(rows, { escapeFormulae: true });
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = safeFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}