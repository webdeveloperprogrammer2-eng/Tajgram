// ============================================================
//  app/chats/format.ts
//  Funksiyahoi khurdi namoish (sana, harfhoi avval).
//  Hech so-rov ba server in jo nest.
// ============================================================
import { tr } from "@/components/appLang";

// "Iso Samadov" -> "IS"
export function initials(name: string | null | undefined): string {
  const text = (name ?? "").trim();
  if (text === "") return "?";

  const parts = text.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0] ?? "").join("").toUpperCase();
}

// Vaqti payom: "14:35"
export function clockTime(iso: string | null | undefined): string {
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Baroi ro-ykhati chatho: "14:35" / "Dina" / "22.08"
export function chatTime(iso: string | null | undefined): string {
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return clockTime(iso);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return tr().yesterday;

  return date.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
}

// Sarlavhai ruz dar daruni chat: "Imruz" / "Dina" / "22.08.2026"
export function dayLabel(iso: string | null | undefined): string {
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  if (date.toDateString() === now.toDateString()) return tr().today;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return tr().yesterday;

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
