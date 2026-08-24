// ============================================================
//  Label - az shadcn/ui.
// ============================================================
import * as React from "react";
import { cn } from "./utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "block text-[11px] font-semibold uppercase tracking-[0.14em] select-none transition-colors duration-200",
        className
      )}
      {...props}
    />
  );
}

export { Label };
