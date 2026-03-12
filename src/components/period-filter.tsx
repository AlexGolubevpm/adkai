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
          "flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-all cursor-pointer",
          open
            ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]"
            : "border-[var(--border)] bg-white text-[var(--foreground-muted)] hover:border-[var(--border-hover)] hover:text-[var(--foreground)]"
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
        <div
          className="absolute right-0 z-50 mt-1.5 w-56 rounded-xl border p-1.5 animate-fade-in"
          style={{
            borderColor: "var(--border)",
            background: "white",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {presets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handleSelect(preset.value)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer"
              style={
                value.preset === preset.value
                  ? { background: "var(--primary-light)", color: "var(--primary)" }
                  : { color: "var(--foreground-muted)" }
              }
              onMouseEnter={(e) => {
                if (value.preset !== preset.value) {
                  e.currentTarget.style.background = "var(--surface-2)";
                  e.currentTarget.style.color = "var(--foreground)";
                }
              }}
              onMouseLeave={(e) => {
                if (value.preset !== preset.value) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--foreground-muted)";
                }
              }}
            >
              {preset.label}
              {value.preset === preset.value && (
                <Check className="h-3.5 w-3.5" style={{ color: "var(--primary)" }} />
              )}
            </button>
          ))}

          {value.preset === "custom" && (
            <div
              className="mt-1.5 space-y-2 px-3 pt-3 pb-2"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <div>
                <label
                  className="mb-1 block text-[10px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--foreground-subtle)" }}
                >
                  From
                </label>
                <input
                  type="date"
                  value={value.from ?? ""}
                  onChange={(e) =>
                    onChange({ ...value, from: e.target.value })
                  }
                  className="w-full rounded-lg border px-3 py-1.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--ring)]"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                    background: "white",
                  }}
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-[10px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--foreground-subtle)" }}
                >
                  To
                </label>
                <input
                  type="date"
                  value={value.to ?? ""}
                  onChange={(e) =>
                    onChange({ ...value, to: e.target.value })
                  }
                  className="w-full rounded-lg border px-3 py-1.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--ring)]"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                    background: "white",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
