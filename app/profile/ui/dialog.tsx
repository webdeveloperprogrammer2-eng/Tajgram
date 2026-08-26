"use client";

// ============================================================
//  Dialog - az shadcn/ui (bar asosi @radix-ui/react-dialog).
//  Radix ba mo inhoro medihad: qufli fokus, tugmai Esc,
//  bastani scroll-i sahifa. Mo faqat dizaynro ivaz kardem.
//
//  DIQQAT: Radix modal-ro ba <body> mekashad, ya'ne BERUN az
//  .shell. Baroi hamin dar ProfileShell ba <html> attribut
//  data-profile-theme guzoshta meshavad - ki rangho in jo ham
//  kor kunand.
// ============================================================
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "./utils";
import styles from "../profile.module.css";
import { tr } from "@/components/appLang";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;
const DialogPortal = DialogPrimitive.Portal;

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(styles.overlay, className)}
      {...props}
    />
  );
}

function DialogContent({
  className,
  overlayClassName,
  children,
  showClose = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showClose?: boolean;
  /** Foni pushti oyna - masalan story onro RAVSHANTAR mekunad. */
  overlayClassName?: string;
}) {
  return (
    <DialogPortal>
      <DialogOverlay className={overlayClassName} />

      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          styles.modal,
          "w-[calc(100vw-2rem)] max-w-lg outline-none",
          className
        )}
        {...props}
      >
        {children}

        {showClose && (
          <DialogPrimitive.Close
            className={cn(
              "absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center",
              "rounded-full bg-[var(--panel)] text-[var(--fg)]",
              "transition-all duration-200 hover:brightness-110 active:scale-95",
              "outline-none"
            )}
          >
            <X className="h-4 w-4" strokeWidth={2} />
            <span className="sr-only">{tr().close}</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "border-b border-[var(--line)] px-6 py-5 pr-16",
        className
      )}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex items-center justify-end gap-3 border-t border-[var(--line)] px-6 py-4",
        className
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "text-base font-bold tracking-tight text-[var(--fg)]",
        className
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "mt-1 text-[12px] text-[var(--muted)]",
        className
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
