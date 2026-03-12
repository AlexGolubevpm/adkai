import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--surface-2)] text-[var(--foreground-muted)]",
        secondary:
          "bg-[var(--surface-2)] text-[var(--foreground-muted)] border border-[var(--border)]",
        outline:
          "border border-[var(--border)] text-[var(--foreground-muted)]",
        primary:
          "bg-[var(--primary-light)] text-[var(--primary)]",
        healthy:
          "bg-[var(--success-light)] text-[var(--success-foreground)]",
        warning:
          "bg-[var(--warning-light)] text-[var(--warning-foreground)]",
        critical:
          "bg-[var(--danger-light)] text-[var(--danger-foreground)]",
        positive:
          "bg-[var(--success-light)] text-[var(--success)]",
        negative:
          "bg-[var(--danger-light)] text-[var(--danger)]",
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
