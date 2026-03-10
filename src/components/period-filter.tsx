"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Calendar } from "lucide-react";

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
  { label: "Custom", value: "custom" },
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
        className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700 hover:border-zinc-600"
      >
        <Calendar className="h-4 w-4 text-zinc-400" />
        {currentLabel}
        <ChevronDown
          className={`h-4 w-4 text-zinc-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-zinc-700 bg-zinc-800 p-1 shadow-xl">
          {presets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handleSelect(preset.value)}
              className={`flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors ${
                value.preset === preset.value
                  ? "bg-indigo-500/10 text-indigo-400"
                  : "text-zinc-300 hover:bg-zinc-700 hover:text-white"
              }`}
            >
              {preset.label}
            </button>
          ))}

          {value.preset === "custom" && (
            <div className="mt-2 space-y-2 border-t border-zinc-700 px-3 pt-3 pb-2">
              <div>
                <label className="mb-1 block text-xs text-zinc-400">From</label>
                <input
                  type="date"
                  value={value.from ?? ""}
                  onChange={(e) =>
                    onChange({ ...value, from: e.target.value })
                  }
                  className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">To</label>
                <input
                  type="date"
                  value={value.to ?? ""}
                  onChange={(e) =>
                    onChange({ ...value, to: e.target.value })
                  }
                  className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
