// ============================================================
//  Input - az shadcn/ui.
//  Sabk: maidoni GIRD bo foni narm - ayni hamon sabki /profile.
// ============================================================
import * as React from "react";
import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full rounded-xl border bg-[var(--panel)] px-4 py-3.5 pr-20 text-[15px] outline-none transition-all duration-200",
        "border-[var(--line)] text-[var(--fg)] placeholder:text-[var(--muted)]",
        "focus:border-[var(--accentA)] focus:bg-transparent focus:ring-4 focus:ring-[var(--goldSoft)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
