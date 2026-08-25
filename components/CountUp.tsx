"use client";

// ============================================================
//  CountUp - raqam az 0 to qimati aslash "meparad".
//  Dar omori profil (posts / followers / following) kor mekunad:
//  raqami sokit dilkash nest, raqami zinda ast.
// ============================================================

import { useEffect, useRef, useState } from "react";
import { formatCount } from "@/lib/format";

const DURATION = 900;

// easeOutExpo - avval tez, oxir narm meistad
const ease = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export function CountUp({
  value,
  delay = 0,
  format = formatCount,
}: {
  value?: number | null;
  delay?: number;
  /** Har modul shakli khudashro dorad (formatCount / shortNumber) */
  format?: (n: number) => string;
}) {
  const target = value ?? 0;
  const [shown, setShown] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    // Agar odam animatsiyaro nakhohad - foran qimati tayyor
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setShown(target);
      return;
    }

    let start = 0;
    const timer = window.setTimeout(() => {
      const step = (now: number) => {
        if (!start) start = now;
        const progress = Math.min(1, (now - start) / DURATION);
        setShown(Math.round(target * ease(progress)));
        if (progress < 1) frame.current = requestAnimationFrame(step);
      };
      frame.current = requestAnimationFrame(step);
    }, delay);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame.current);
    };
  }, [target, delay]);

  return <>{format(shown)}</>;
}
