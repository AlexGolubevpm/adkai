"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, Calendar, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

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

  const currentLabel =
    presets.find((p) => p.value === value.preset)?.label ?? "Select period";

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
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
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
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          className={cn(
            "z-50 w-56 rounded-xl border p-1.5",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
          )}
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
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer outline-none",
                value.preset === preset.value
                  ? "bg-[var(--primary-light)] text-[var(--primary)]"
                  : "text-[var(--foreground-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
              )}
            >
              {preset.label}
              {value.preset === preset.value && (
                <Check className="h-3.5 w-3.5" style={{ color: "var(--primary)" }} />
              )}
            </button>
          ))}

          {value.preset === "custom" && (
            <>
              <Separator className="my-1.5" />
              <div className="space-y-2 px-2 pt-1 pb-1">
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
            </>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
