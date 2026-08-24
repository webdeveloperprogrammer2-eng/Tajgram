// ============================================================
//  Button - az shadcn/ui girifta shud.
//  Farq: ranghoro az var(--...) megirad (naqli torik/ravshan)
//  va kunjho GIRD hastand - sabki instagram.
// ============================================================
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  // class-hoi umumi baroi HAMAI tugmaho
  "inline-flex items-center justify-center gap-2 rounded-full whitespace-nowrap font-semibold transition-all duration-200 outline-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // tugmai asosi: yagona gradient (2 rang)
        default:
          "bg-[linear-gradient(135deg,var(--accentA),var(--accentB))] text-white shadow-[var(--shadowSoft)] hover:brightness-110",
        // tugmai khokistari - monandi "Edit profile"-i instagram
        soft:
          "bg-[var(--panel)] text-[var(--fg)] hover:brightness-95",
        // tugmai sigali (rangi asosi, sof)
        signal:
          "bg-[var(--signal)] text-[var(--onSignal)] hover:brightness-110",
        // faqat ramka
        outline:
          "border border-[var(--lineStrong)] text-[var(--fg)] hover:bg-[var(--panel)]",
        // be fon
        ghost: "text-[var(--muted)] hover:bg-[var(--panel)] hover:text-[var(--fg)]",
      },
      size: {
        sm: "h-9 px-4 text-[13px]",
        default: "h-11 px-6 text-sm",
        lg: "h-13 px-7 text-base",
        icon: "h-9 w-9 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
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
  // asChild = true -> ba joi <button> component-i daruni istifoda meshavad
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
