import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--surface-3)] text-[var(--foreground)]",
        secondary:
          "border-[var(--border)] bg-[var(--surface-2)] text-[var(--foreground-muted)]",
        outline:
          "border-[var(--border)] text-[var(--foreground-muted)]",
        healthy:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
        warning:
          "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
        critical:
          "border-red-500/20 bg-red-500/10 text-red-400",
        primary:
          "border-indigo-500/20 bg-indigo-500/10 text-indigo-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  )
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
