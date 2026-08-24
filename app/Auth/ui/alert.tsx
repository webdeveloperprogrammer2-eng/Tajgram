// ============================================================
//  Alert - az shadcn/ui.
//  Sabk: bloki orom bo yak khati borik dar chap.
// ============================================================
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

const alertVariants = cva(
  "flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-[13px] leading-relaxed",
  {
    variants: {
      variant: {
        destructive:
          "border-[var(--danger)] bg-[var(--dangerSoft)] text-[var(--fg)]",
        success:
          "border-[var(--ok)] bg-[var(--okSoft)] text-[var(--fg)]",
      },
    },
    defaultVariants: { variant: "destructive" },
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
