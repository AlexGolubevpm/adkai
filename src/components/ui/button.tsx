import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-sm",
        secondary:
          "bg-[var(--surface-2)] text-[var(--foreground-secondary)] hover:bg-[var(--surface-3)] border border-[var(--border)]",
        outline:
          "border border-[var(--border)] bg-white text-[var(--foreground-secondary)] hover:bg-[var(--surface-2)] hover:border-[var(--border-hover)]",
        ghost:
          "text-[var(--foreground-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
        destructive:
          "bg-[var(--danger)] text-white hover:bg-red-700 shadow-sm",
        success:
          "bg-[var(--success)] text-white hover:bg-emerald-700 shadow-sm",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-9 px-4 text-sm",
        lg: "h-10 px-5 text-sm",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
