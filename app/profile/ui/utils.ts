// ============================================================
//  cn() - funksiyai standarti-i shadcn/ui.
//  Class-hoi Tailwind-ro yakjo mekunad va takrorhoro toza mekunad.
//  Misol: cn("p-2", isBig && "p-6")  ->  "p-6"
// ============================================================
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
