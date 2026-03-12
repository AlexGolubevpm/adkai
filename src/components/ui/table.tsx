import * as React from "react";
import { cn } from "@/lib/utils";

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom", className)}
      style={{ fontSize: "var(--text-sm)", borderCollapse: "collapse" }}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("sticky top-0 z-10", className)}
    style={{
      background: "var(--surface-1)",
    }}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn("transition-colors duration-150", className)}
    style={{
      borderBottom: "1px solid var(--border-subtle)",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = "var(--surface-1)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "transparent";
    }}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "text-left align-middle [&:has([role=checkbox])]:pr-0",
      className
    )}
    style={{
      color: "var(--foreground-subtle)",
      fontSize: "var(--text-xs)",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      padding: "12px 16px",
      borderBottom: "1px solid var(--border)",
      whiteSpace: "nowrap",
    }}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("align-middle [&:has([role=checkbox])]:pr-0", className)}
    style={{
      color: "var(--foreground-secondary)",
      padding: "14px 16px",
      fontSize: "var(--text-sm)",
      fontVariantNumeric: "tabular-nums",
    }}
    {...props}
  />
));
TableCell.displayName = "TableCell";

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
