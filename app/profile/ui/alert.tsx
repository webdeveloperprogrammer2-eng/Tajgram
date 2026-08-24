// ============================================================
//  Alert - az shadcn/ui.
//  Do namud: "destructive" (khato) va "default" (khabar).
// ============================================================
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const alertVariants = cva(
  "flex items-start gap-3 rounded-2xl border px-4 py-3 text-[13px] leading-relaxed",
  {
    variants: {
      variant: {
        default: "border-[var(--line)] bg-[var(--panel)] text-[var(--fg)]",
        destructive:
          "border-[var(--signal)] bg-[var(--panel)] text-[var(--signal)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Alert, alertVariants };
