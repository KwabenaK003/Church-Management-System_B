"use client";

import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CaretDown, Check, MagnifyingGlass } from "@phosphor-icons/react";

interface SearchableSelectProps {
  label?: string;
  error?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  searchPlaceholder?: string;
  noOptionsMessage?: string;
  searchThreshold?: number;
  showSearch?: boolean;
}

export const SearchableSelect = forwardRef<HTMLInputElement, SearchableSelectProps>(
  (
    {
      label,
      error,
      placeholder,
      options,
      value,
      onChange,
      onBlur,
      name,
      required,
      disabled,
      id,
      className = "",
      searchPlaceholder = "Search options...",
      noOptionsMessage = "No options found.",
      searchThreshold = 10,
      showSearch,
    },
    ref,
  ) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-") ?? name;
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

    const selectedValue = value ?? "";
    const selectedOption = options.find((option) => option.value === selectedValue);
    const searchEnabled = showSearch ?? options.length > searchThreshold;

    const filteredOptions = useMemo(() => {
      if (!searchEnabled || query.trim().length === 0) {
        return options;
      }

      const normalizedQuery = query.trim().toLowerCase();
      return options.filter((option) =>
        option.label.toLowerCase().includes(normalizedQuery),
      );
    }, [options, query, searchEnabled]);

    function closeMenu() {
      setOpen(false);
      setQuery("");
      onBlur?.();
    }

    function updatePosition() {
      if (!buttonRef.current) {
        return;
      }

      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    }

    useEffect(() => {
      if (!open) {
        return;
      }

      updatePosition();

      function handleClickOutside(event: MouseEvent) {
        const target = event.target as Node;
        const clickedButton = buttonRef.current?.contains(target);
        const clickedMenu = menuRef.current?.contains(target);

        if (!clickedButton && !clickedMenu) {
          closeMenu();
        }
      }

      function handleWindowChange() {
        closeMenu();
      }

      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleWindowChange, true);
      window.addEventListener("resize", handleWindowChange);

      if (searchEnabled) {
        requestAnimationFrame(() => {
          searchInputRef.current?.focus();
        });
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("scroll", handleWindowChange, true);
        window.removeEventListener("resize", handleWindowChange);
      };
    }, [open, searchEnabled]);

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-slate-700">
            {label}
            {required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
        )}

        <input ref={ref} type="hidden" name={name} value={selectedValue} readOnly />

        <button
          id={selectId}
          ref={buttonRef}
          type="button"
          disabled={disabled}
          onClick={() => {
            setOpen((previousOpen) => {
              const nextOpen = !previousOpen;
              if (nextOpen) {
                updatePosition();
              } else {
                setQuery("");
                onBlur?.();
              }
              return nextOpen;
            });
          }}
          className={[
            "flex w-full items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2 text-left text-sm transition-colors duration-150",
            error
              ? "border-red-400 focus:ring-red-300"
              : "border-[var(--border-color)] focus:ring-blue-200",
            "focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50",
            className,
          ].join(" ")}
        >
          <span className={selectedOption ? "text-slate-900" : "text-slate-400"}>
            {selectedOption?.label ?? placeholder ?? "Select option"}
          </span>
          <CaretDown
            size={16}
            className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {error && <p className="text-xs text-red-500">{error}</p>}

        {open &&
          typeof window !== "undefined" &&
          createPortal(
            <div
              ref={menuRef}
              className="fixed z-[9999] overflow-hidden rounded-xl border border-[var(--border-color)] bg-white shadow-lg"
              style={{ top: position.top, left: position.left, width: position.width }}
            >
              {searchEnabled && (
                <div className="border-b border-[var(--border-color)] p-2">
                  <div className="relative">
                    <MagnifyingGlass
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      ref={searchInputRef}
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={searchPlaceholder}
                      className="w-full rounded-lg border border-[var(--border-color)] py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-200 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>
              )}

              <div className="max-h-72 overflow-y-auto py-1.5">
                {filteredOptions.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-slate-500">{noOptionsMessage}</p>
                ) : (
                  filteredOptions.map((option) => {
                    const isSelected = option.value === selectedValue;

                    return (
                      <button
                        key={`${option.value}-${option.label}`}
                        type="button"
                        onClick={() => {
                          onChange?.(option.value);
                          closeMenu();
                        }}
                        className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors ${
                          isSelected
                            ? "bg-blue-50 text-[var(--blue-700)]"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{option.label}</span>
                        {isSelected && <Check size={16} weight="bold" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>,
            document.body,
          )}
      </div>
    );
  },
);

SearchableSelect.displayName = "SearchableSelect";
