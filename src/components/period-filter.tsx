"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Calendar, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type PeriodValue = {
  preset: string;
  from?: string;
  to?: string;
};

const presets = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 days", value: "last_7_days" },
  { label: "Last 30 days", value: "last_30_days" },
  { label: "Custom range", value: "custom" },
];

interface PeriodFilterProps {
  value: PeriodValue;
  onChange: (value: PeriodValue) => void;
}

export default function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLabel =
    presets.find((p) => p.value === value.preset)?.label ?? "Select period";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(preset: string) {
    if (preset === "custom") {
      onChange({ preset: "custom", from: value.from, to: value.to });
    } else {
      onChange({ preset });
    }
    if (preset !== "custom") {
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-all duration-150",
          open
            ? "border-indigo-500/50 bg-[var(--surface-2)] text-[var(--foreground)] shadow-sm shadow-indigo-500/10"
            : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--foreground-muted)] hover:border-[var(--border-hover)] hover:text-[var(--foreground)]"
        )}
      >
        <Calendar className="h-3.5 w-3.5" />
        {currentLabel}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-1.5 shadow-2xl shadow-black/40 animate-fade-in">
          {presets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handleSelect(preset.value)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors duration-100",
                value.preset === preset.value
                  ? "bg-indigo-500/10 text-indigo-400"
                  : "text-[var(--foreground-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
              )}
            >
              {preset.label}
              {value.preset === preset.value && (
                <Check className="h-3.5 w-3.5 text-indigo-400" />
              )}
            </button>
          ))}

          {value.preset === "custom" && (
            <div className="mt-1.5 space-y-2 border-t border-[var(--border)] px-3 pt-3 pb-2">
              <div>
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-[var(--foreground-subtle)]">
                  From
                </label>
                <input
                  type="date"
                  value={value.from ?? ""}
                  onChange={(e) =>
                    onChange({ ...value, from: e.target.value })
                  }
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-0)] px-3 py-1.5 text-sm text-[var(--foreground)] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-[var(--foreground-subtle)]">
                  To
                </label>
                <input
                  type="date"
                  value={value.to ?? ""}
                  onChange={(e) =>
                    onChange({ ...value, to: e.target.value })
                  }
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-0)] px-3 py-1.5 text-sm text-[var(--foreground)] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
