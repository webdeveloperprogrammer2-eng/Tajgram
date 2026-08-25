"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Плавное появление контента при переходе между роутами. */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
