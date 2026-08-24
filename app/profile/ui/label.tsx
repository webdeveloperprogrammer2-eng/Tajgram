// ============================================================
//  Label - az shadcn/ui.
//  Nomi maidon: khurd, tunuk, khokistari.
// ============================================================
import * as React from "react";

import { cn } from "./utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]",
        "select-none",
        className
      )}
      {...props}
    />
  );
}

export { Label };
