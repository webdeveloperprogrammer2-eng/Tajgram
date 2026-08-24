"use client";

// ============================================================
//  Tabs - az shadcn/ui (bar asosi @radix-ui/react-tabs).
//  Dar instagram: POSTS / REELS / SAQLSHUDA.
//  Sabki mo: khati boloi faol - rangi asosi.
// ============================================================
import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "./utils";

const Tabs = TabsPrimitive.Root;

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "flex w-full items-stretch justify-center gap-2 border-t border-[var(--line)] sm:gap-12",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative flex flex-1 items-center justify-center gap-2 sm:flex-none",
        "-mt-px border-t-2 border-transparent px-4 py-4",
        "text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]",
        "transition-colors duration-200 outline-none",
        "hover:text-[var(--fg)]",
        "data-[state=active]:border-[var(--fg)] data-[state=active]:text-[var(--fg)]",
        "[&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
