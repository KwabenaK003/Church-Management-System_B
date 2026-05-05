"use client";

import { ChangeEvent, useEffect, useRef } from "react";

interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  className = "",
}: CheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };

  const isActive = checked || indeterminate;

  return (
    <label className={`inline-flex cursor-pointer items-center ${className}`}>
      <input
        ref={inputRef}
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        className="peer sr-only"
        aria-checked={indeterminate ? "mixed" : checked}
      />

      <span
        aria-hidden="true"
        className={`
          inline-flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border
          transition-all duration-150
          peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--blue-600)]/20
          ${
            isActive
              ? "bg-[var(--blue-600)] border-transparent"
              : "bg-white border-[var(--border-color)] peer-hover:border-slate-400"
          }
        `}
      >
        {checked && !indeterminate ? (
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" aria-hidden="true">
            <polyline
              points="3.5 8.5 6.6 11.5 12.5 5.5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}

        {indeterminate ? (
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" aria-hidden="true">
            <line
              x1="3.5"
              y1="8"
              x2="12.5"
              y2="8"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : null}
      </span>
    </label>
  );
}
