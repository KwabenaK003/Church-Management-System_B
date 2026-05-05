"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useCallback, useState } from "react";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50] as const;

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}

export function Pagination({
  currentPage,
  totalItems,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * rowsPerPage + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(safeCurrentPage * rowsPerPage, totalItems);

  return (
    <div className="border-t border-[var(--border-color)] px-5 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--text-secondary)]">
          Showing {startItem}-{endItem} of {totalItems}
        </p>

        <div className="flex items-center gap-2 sm:gap-3">
          <label className="text-sm text-[var(--text-secondary)]" htmlFor="rows-per-page-select">
            Rows per page
          </label>
          <select
            id="rows-per-page-select"
            className="rounded-lg border border-[var(--border-color)] bg-white px-2.5 py-1.5 text-sm text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--blue-600)]/20"
            value={rowsPerPage}
            onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
          >
            {ROWS_PER_PAGE_OPTIONS.map((rows) => (
              <option key={rows} value={rows}>
                {rows}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="rounded-lg border border-[var(--border-color)] px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={safeCurrentPage <= 1}
            onClick={() => onPageChange(safeCurrentPage - 1)}
            aria-label="Go to previous page"
          >
            <span className="inline-flex items-center gap-1">
              <CaretLeft size={14} weight="bold" />
              Prev
            </span>
          </button>

          <button
            type="button"
            className="rounded-lg border border-[var(--border-color)] px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={safeCurrentPage >= totalPages || totalItems === 0}
            onClick={() => onPageChange(safeCurrentPage + 1)}
            aria-label="Go to next page"
          >
            <span className="inline-flex items-center gap-1">
              Next
              <CaretRight size={14} weight="bold" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function usePagination(initialRowsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPageState] = useState(initialRowsPerPage);

  const setRowsPerPage = useCallback((rows: number) => {
    setRowsPerPageState(rows);
    setCurrentPage(1);
  }, []);

  const resetPage = useCallback(() => setCurrentPage(1), []);

  return {
    currentPage,
    rowsPerPage,
    setCurrentPage,
    setRowsPerPage,
    resetPage,
  };
}