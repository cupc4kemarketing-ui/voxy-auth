import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-accent/15 text-[#a5b4fc] ring-1 ring-inset ring-accent/25",
        success: "bg-success/15 text-[#4ade80] ring-1 ring-inset ring-success/25",
        danger: "bg-danger/15 text-[#f87171] ring-1 ring-inset ring-danger/25",
        warning: "bg-warning/15 text-[#fbbf24] ring-1 ring-inset ring-warning/25",
        muted: "bg-white/5 text-muted-foreground ring-1 ring-inset ring-white/10",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
