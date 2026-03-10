import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-900",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-zinc-100 text-zinc-900",
        secondary:
          "border-transparent bg-zinc-800 text-zinc-100",
        outline:
          "border-zinc-700 text-zinc-300",
        healthy:
          "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
        warning:
          "border-yellow-400/20 bg-yellow-400/10 text-yellow-400",
        critical:
          "border-red-400/20 bg-red-400/10 text-red-400",
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
