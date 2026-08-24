// ============================================================
//  Button - az shadcn/ui girifta shud.
//  Sabk: AYNI HAMON sabki /profile - kunjhoi purra gird,
//  tugmai asosi bo YAK gradient az DU rang.
// ============================================================
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full whitespace-nowrap font-semibold transition-colors duration-150 outline-none active:opacity-80 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // asosi: yagona gradient (2 rang)
        default:
          "bg-[var(--accentA)] text-white shadow-[var(--shadowSoft)] hover:brightness-110",
        // khokistari - amalhoi duyumdaraja
        soft: "bg-[var(--panel)] text-[var(--fg)] hover:brightness-95",
        // hamon "gold"-i kuhna -> aknun rangi asosi (violet)
        gold: "bg-[var(--gold)] text-white hover:brightness-110",
        // faqat ramka
        outline:
          "border border-[var(--lineStrong)] text-[var(--fg)] hover:bg-[var(--panel)]",
        // be fon
        ghost:
          "text-[var(--muted)] hover:bg-[var(--panel)] hover:text-[var(--fg)]",
        // khato
        danger:
          "border border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--dangerSoft)]",
      },
      size: {
        sm: "h-9 px-4 text-[13px]",
        default: "h-11 px-6 text-sm",
        lg: "h-13 px-8 text-[15px]",
        icon: "h-9 w-9 px-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
