// ============================================================
//  Input - az shadcn/ui.
//  Sabk: maidoni GIRD bo foni narm - monandi instagram.
// ============================================================
import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full rounded-2xl border bg-[var(--panel)] px-4 py-3",
        "text-sm text-[var(--fg)] placeholder:text-[var(--muted)]",
        "border-[var(--line)] outline-none transition-all duration-200",
        "focus:border-[var(--accentB)] focus:bg-transparent",
        "disabled:cursor-not-allowed disabled:opacity-40",
        "file:mr-3 file:rounded-full file:border-0 file:bg-[var(--invBg)] file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-[var(--invFg)]",
        className
      )}
      {...props}
    />
  );
}

export { Input };
