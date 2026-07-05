import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/15 text-primary border-primary/30",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground border-border",
        success: "bg-neon-green/15 text-neon-green border-neon-green/30",
        warning: "bg-neon-amber/15 text-neon-amber border-neon-amber/30",
        danger: "bg-destructive/15 text-destructive border-destructive/30",
        purple: "bg-neon-purple/15 text-neon-purple border-neon-purple/30",
        pink: "bg-neon-pink/15 text-neon-pink border-neon-pink/30",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
