import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-slate-100 text-slate-700",
        success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
        warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
        danger:  "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
        info:    "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
