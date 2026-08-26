"use client";

// ============================================================
//  PostLightbox - vaqte dar profil ba surat mezani, post dar
//  oynai kalon kushoda meshavad (monandi instagram).
//
//  Peshtar dar profili korbari DIGAR zadan ba surat HECH KOR
//  namekard - tur faqat "surathoi murda" bud.
//
//  Daruni oyna hamon <PostCard> ast ki dar lenta kor mekunad,
//  ya'ne like, komment va saqlkuni darhol dastras hastand.
// ============================================================
import { useEffect } from "react";
import { createPortal } from "react-dom";

import type { Post } from "@/lib/types";
import { PostCard } from "../PostCard";
import { CloseIcon } from "../icons";
import { useT } from "@/components/LocaleProvider";

export function PostLightbox({
  post,
  onClose,
}: {
  post: Post | null;
  onClose: () => void;
}) {
  const { t } = useT();
  // DIQQAT: in jo "mounted"-i sun'i lozim NEST.
  // Hangomi render-i SERVER `post` hamesha null ast (holati avvala),
  // baroi hamin createPortal dar server HECH GOH sado nameshavad -
  // va hydration ham nameshikanad.

  // Esc mebandad, va scroll-i sahifa dar zeri oyna band meshavad
  useEffect(() => {
    if (post === null) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKey);

    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = before;
    };
  }, [post, onClose]);

  if (post === null) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="animate-fade-in fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm md:items-center md:p-8"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t.close}
        className="fixed top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors duration-200 hover:bg-white/15"
      >
        <CloseIcon size={22} />
      </button>

      {/* Zadan ba KHUDI post oynaro naboyad bandad */}
      <div
        onClick={(event) => event.stopPropagation()}
        className="animate-scale-in w-full max-w-[520px] rounded-xl bg-[var(--bg)] p-1"
      >
        <PostCard post={post} />
      </div>
    </div>,
    document.body,
  );
}
