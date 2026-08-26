"use client";

// ============================================================
//  components/CreateMenu.tsx
//
//  Tugmai "Create" -> hamin oyna kushoda meshavad.
//
//  DU QADAM:
//    1) "pick" - kadom NAMUD? (Post / Reel / Moment / Actual)
//    2) "form" - fayl guzoshtan va firistodan
//
//  Har namud faylhoi KHUDASHRO qabul mekunad:
//    Post   - surat va video, chandto
//    Reel   - FAQAT video, yakto
//    Moment - FAQAT surat, yakto (story, 24 soat)
//
//  DIQQAT — "Actualniy" (highlights):
//  Dar backend baroi on HECH endpoint NEST (dar swagger nayoft).
//  Baroi hamin on dar ro-ykhat hast, vale hozir band ast.
// ============================================================

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { CameraIcon, ImageIcon, ReelsIcon } from "./icons";
import { useT } from "./LocaleProvider";
import type { Dict } from "./appLang";

type Format = "post" | "reel" | "moment" | "actual";

type FormatCard = {
  id: Format;
  title: string;
  hint: string;
  accept: string;
  multiple: boolean;
  gradient: string;
  icon: React.ReactNode;
  ready: boolean;
};

function buildFormats(t: Dict): FormatCard[] {
  return [
  {
    id: "post",
    title: t.fmtPost,
    hint: t.fmtPostHint,
    accept: "image/*,video/*",
    multiple: true,
    gradient: "linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)",
    icon: <ImageIcon size={22} />,
    ready: true,
  },
  {
    id: "reel",
    title: t.fmtReel,
    hint: t.fmtReelHint,
    accept: "video/*",
    multiple: false,
    gradient: "linear-gradient(135deg,#8a2be2,#e1306c)",
    icon: <ReelsIcon size={22} />,
    ready: true,
  },
  {
    id: "moment",
    title: t.fmtStory,
    hint: t.fmtStoryHint,
    accept: "image/*",
    multiple: false,
    gradient: "linear-gradient(135deg,#f09433,#dc2743)",
    icon: <CameraIcon size={22} />,
    ready: true,
  },
  {
    id: "actual",
    title: t.fmtHighlight,
    hint: t.fmtHighlightHint,
    accept: "image/*",
    multiple: false,
    gradient: "linear-gradient(135deg,#4b5563,#6b7280)",
    icon: <StarGlyph />,
    ready: false,
  },
  ];
}

export default function CreateMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { t } = useT();
  const fileInput = useRef<HTMLInputElement>(null);

  const [format, setFormat] = useState<Format | null>(null);
  const [picked, setPicked] = useState<{ file: File; url: string }[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const formats = buildFormats(t);
  const card = formats.find((item) => item.id === format) ?? null;

  // Peshnamoyishho khotira band mekunand - ozod mekunem
  useEffect(
    () => () => picked.forEach((item) => URL.revokeObjectURL(item.url)),
    [picked]
  );

  // Escape -> pushidan; sahifai pasho naghltad
  useEffect(() => {
    if (!open) return;

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
  }, [open, onClose]);

  if (!open) return null;

  function reset() {
    setFormat(null);
    setPicked([]);
    setTitle("");
    setContent("");
    setError("");
  }

  function closeAll() {
    reset();
    onClose();
  }

  function choose(item: FormatCard) {
    if (!item.ready) {
      setError(t.typeUnsupported);
      return;
    }
    setError("");
    setFormat(item.id);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || card === null) return;

    if (picked.length === 0) {
      setError(t.pickFileFirst);
      return;
    }

    setBusy(true);
    setError("");

    try {
      if (card.id === "post") {
        const form = new FormData();
        if (title.trim() !== "") form.append("Title", title.trim());
        if (content.trim() !== "") form.append("Content", content.trim());
        for (const item of picked) form.append("Images", item.file);

        await api.addPost(form);
        router.push("/");
      } else if (card.id === "reel") {
        const form = new FormData();
        form.append("Title", title.trim());
        form.append("Description", content.trim());
        form.append("Video", picked[0].file);

        await api.addReel(form);
        router.push("/reels");
      } else {
        await api.addStory(picked[0].file);
        router.push("/profile");
      }

      router.refresh();
      closeAll();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Guzoshta nashud. Boz sanjed."
      );
    } finally {
      setBusy(false);
    }
  }

  const pickLabel =
    card === null
      ? ""
      : card.id === "reel"
        ? t.pickVideo
        : card.id === "moment"
          ? t.pickPhoto
          : t.pickPhotoOrVideo;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.createSomething}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeAll();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      style={{ animation: "cmFade .18s ease-out" }}
    >
      <div
        className="w-full max-w-[560px] overflow-hidden rounded-3xl border border-[var(--sb-line)] bg-[var(--sb-bg)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
        style={{ animation: "cmPop .22s cubic-bezier(.2,.9,.3,1.2)" }}
      >
        {/* ---------- Sarlavha ---------- */}
        <div className="flex items-center gap-3 border-b border-[var(--sb-line)] px-5 py-4">
          {card !== null && (
            <button
              type="button"
              onClick={reset}
              aria-label={t.back}
              className="grid h-8 w-8 place-items-center rounded-full text-[18px] text-[var(--sb-fg)] transition hover:bg-[var(--sb-hover)]"
            >
              &#8249;
            </button>
          )}

          <p className="flex-1 text-[16px] font-semibold text-[var(--sb-fg)]">
            {card === null ? t.createThing : card.title}
          </p>

          <button
            type="button"
            onClick={closeAll}
            aria-label={t.close}
            className="grid h-8 w-8 place-items-center rounded-full text-[15px] text-[var(--sb-fg)] transition hover:bg-[var(--sb-hover)]"
          >
            &#10005;
          </button>
        </div>

        {/* ---------- QADAM 1: namudro gurftan ---------- */}
        {card === null && (
          <div className="p-4">
            <div className="grid gap-2.5 sm:grid-cols-2">
              {formats.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => choose(item)}
                  disabled={!item.ready}
                  style={{
                    animation: "cmUp .3s both",
                    animationDelay: `${index * 45}ms`,
                  }}
                  className="group flex items-center gap-3 rounded-2xl border border-[var(--sb-line)] p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-12px_rgba(0,0,0,0.55)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white transition-transform duration-300 group-hover:scale-110 group-disabled:group-hover:scale-100"
                    style={{ background: item.gradient }}
                  >
                    {item.icon}
                  </span>

                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-semibold text-[var(--sb-fg)]">
                      {item.title}
                    </span>
                    <span className="block truncate text-[12px] text-[var(--muted)]">
                      {item.hint}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            {error !== "" && (
              <p className="mt-3 text-[13px] text-[#ed4956]">{error}</p>
            )}
          </div>
        )}

        {/* ---------- QADAM 2: fayl va matn ---------- */}
        {card !== null && (
          <form onSubmit={submit} className="space-y-3 p-4">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="group flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--sb-line)] py-10 text-[var(--muted)] transition-all duration-300 hover:border-[var(--sb-accent)] hover:text-[var(--sb-accent)]"
            >
              <span className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110">
                {card.icon}
              </span>
              <span className="text-[13px]">
                {picked.length === 0
                  ? pickLabel
                  : `${t.chosen}: ${picked.length}`}
              </span>
            </button>

            <input
              ref={fileInput}
              type="file"
              accept={card.accept}
              multiple={card.multiple}
              hidden
              onChange={(event) => {
                const list = Array.from(event.target.files ?? []);
                setPicked(
                  list.map((file) => ({
                    file,
                    url: URL.createObjectURL(file),
                  }))
                );
                setError("");
              }}
            />

            {picked.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {picked.map((item) => (
                  <div
                    key={item.url}
                    className="aspect-square overflow-hidden rounded-xl bg-[var(--sb-hover)]"
                  >
                    {item.file.type.startsWith("video") ? (
                      <video
                        src={item.url}
                        muted
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Story matn nadorad - faqat surat */}
            {card.id !== "moment" && (
              <>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={t.reelTitleLabel}
                  className="w-full rounded-xl border border-[var(--sb-line)] bg-transparent px-3 py-2.5 text-[14px] text-[var(--sb-fg)] outline-none transition focus:border-[var(--sb-accent)]"
                />

                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder={t.captionText}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[var(--sb-line)] bg-transparent px-3 py-2.5 text-[14px] text-[var(--sb-fg)] outline-none transition focus:border-[var(--sb-accent)]"
                />
              </>
            )}

            {error !== "" && (
              <p className="text-[13px] text-[#ed4956]">{error}</p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl py-2.5 text-[14px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:hover:translate-y-0"
              style={{ background: card.gradient }}
            >
              {busy ? t.posting : t.post}
            </button>
          </form>
        )}
      </div>

      <style>{`
        @keyframes cmFade { from { opacity: 0 } }
        @keyframes cmPop {
          from { opacity: 0; transform: translateY(12px) scale(.97) }
        }
        @keyframes cmUp {
          from { opacity: 0; transform: translateY(8px) }
        }
        @media (prefers-reduced-motion: reduce) {
          [role="dialog"], [role="dialog"] * { animation: none !important }
        }
      `}</style>
    </div>
  );
}

// Nishonai "Actualniy" - doira bo setora
function StarGlyph() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 7.5l1.3 2.9 3.2.3-2.4 2.1.7 3.1-2.8-1.6-2.8 1.6.7-3.1-2.4-2.1 3.2-.3L12 7.5z"
        fill="currentColor"
      />
    </svg>
  );
}
