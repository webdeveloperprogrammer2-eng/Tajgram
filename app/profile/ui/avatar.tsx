"use client";

// ============================================================
//  Avatar - az shadcn/ui (bar asosi @radix-ui/react-avatar).
//  Aknun GIRD ast - monandi instagram.
//  Agar surat naboshad -> harfi avvali nom namoyon meshavad.
//
//  DIQQAT: in jo <img>-i oddi kor mekunad (na next/image),
//  chunki suratho az domeni digar (backend) meoyand va
//  next/image sozishro dar next.config talab mekunad.
// ============================================================
import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "./utils";

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full",
        "bg-[var(--panel)]",
        className
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("h-full w-full object-cover", className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      delayMs={0}
      className={cn(
        "flex h-full w-full items-center justify-center",
        "bg-[var(--panel)] font-bold uppercase text-[var(--muted)]",
        className
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
