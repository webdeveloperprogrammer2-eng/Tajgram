"use client";

// ============================================================
//  DropdownMenu - az shadcn/ui (dar asosi Radix UI).
//  Man faqat 4 qismi zarurro girift am: Root, Trigger, Content, Item.
// ============================================================
import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

import { cn } from "./utils";
import styles from "../auth.module.css";

function DropdownMenu(
  props: React.ComponentProps<typeof DropdownMenuPrimitive.Root>
) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuTrigger(
  props: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>
) {
  return (
    <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
  );
}

function DropdownMenuContent({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          styles.menuIn,
          "z-[70] min-w-[11rem] rounded-2xl border p-1.5 shadow-[var(--shadow)]",
          "border-[var(--line)] bg-[var(--surface)] text-[var(--fg)]",
          "shadow-[var(--shadow)]",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item>) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn(
        "flex cursor-pointer select-none items-center justify-between gap-4 rounded-xl px-3 py-2.5",
        "text-[13px] outline-none transition-colors",
        "focus:bg-[var(--goldSoft)] focus:text-[var(--gold)]",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
        className
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
};
