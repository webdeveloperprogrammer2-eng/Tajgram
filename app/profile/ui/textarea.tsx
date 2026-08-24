// ============================================================
//  Textarea - az shadcn/ui.
//  Baroi matni daroz: "about", matni post, kommentho.
// ============================================================
import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "w-full resize-none rounded-2xl border bg-[var(--panel)] p-4",
        "text-sm leading-relaxed text-[var(--fg)] placeholder:text-[var(--muted)]",
        "border-[var(--line)] outline-none transition-all duration-200",
        "focus:border-[var(--accentB)] focus:bg-transparent",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
