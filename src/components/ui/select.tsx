import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-9 w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2 pr-8 text-sm text-[var(--foreground)] ring-offset-[var(--background)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";

const SelectOption = React.forwardRef<
  HTMLOptionElement,
  React.OptionHTMLAttributes<HTMLOptionElement>
>(({ className, ...props }, ref) => (
  <option
    ref={ref}
    className={cn("bg-[var(--surface-1)] text-[var(--foreground)]", className)}
    {...props}
  />
));
SelectOption.displayName = "SelectOption";

export { Select, SelectOption };
