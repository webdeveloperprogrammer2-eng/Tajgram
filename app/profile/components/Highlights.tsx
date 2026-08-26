"use client";

// ============================================================
//  Highlights - "ACTUALNIY" (to-plamhoi hameshagii story).
//
//  ============================================================
//  IN QISM TAMOMAN AZ NAV NAVISHTA SHUD.
//
//  Peshtar in jo storyhoi 24-SOATA namoyon meshudand - hamon
//  storyhoe ki allakay dar AVATAR ham budand. Ya'ne yak chiz
//  DU BOR menamud, va ba'di 24 soat hama ghoib meshud.
//  On "actualniy" NABUD.
//
//  Backend 26.08.2026 bakhshi /Actual-ro ilova kard:
//    GET    /Actual/get-my-actuals
//    GET    /Actual/get-actual-by-id?id=..
//    POST   /Actual/add-actual            (Title, StoryIds, Cover)
//    PUT    /Actual/update-actual
//    POST   /Actual/add-story-to-actual
//    DELETE /Actual/remove-story-from-actual
//    DELETE /Actual/delete-actual
//
//  Hozir in jo AYNAN monandi instagram kor mekunad:
//  doirahoi khokistari bo nom dar poyon, tugmai "+" dar avval,
//  va zadan to-plamro dar namoishi story mekushoyad.
// ============================================================
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";

import {
  deleteActual,
  errorText,
  getActualById,
  getMyActuals,
  mediaUrl,
  removeStoryFromActual,
  type Actual,
  type ActualDetails,
} from "../api";
import { useProfile } from "../providers";

import { useT } from "@/components/LocaleProvider";

import ActualModal from "./ActualModal";
import StoryViewer from "./StoryViewer";

export default function Highlights() {
  const { token, stories } = useProfile();
  const { t } = useT();

  const [actuals, setActuals] = useState<Actual[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // To-plami KUSHODA (hamrohi storyhoyash) va storyi jori
  const [open, setOpen] = useState<ActualDetails | null>(null);
  const [index, setIndex] = useState<number | null>(null);

  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    if (token === "") return;

    try {
      const list = await getMyActuals(token);
      setActuals(Array.isArray(list) ? list : []);
      setError("");
    } catch (err) {
      setError(errorText(err, t.highlightLoadFailed));
    } finally {
      setLoading(false);
    }
  }, [token, t.highlightLoadFailed]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  // ---------- Kushodani yak to-plam ----------
  async function openActual(actual: Actual) {
    try {
      // Ro-ykhati kutoh storyhoro NAMEDIHAD - onhoro alohida megirem
      const full = await getActualById(token, actual.actualId);

      if (!full || !Array.isArray(full.stories) || full.stories.length === 0) {
        setError(t.highlightEmpty);
        return;
      }

      setOpen(full);
      setIndex(0);
    } catch (err) {
      setError(errorText(err, t.highlightLoadFailed));
    }
  }

  // ---------- Barovardani story az to-plam ----------
  // DIQQAT: khudi story TARK KARDA NAMESHAVAD - u dar
  // /Story/get-my-stories memonad. Faqat az to-plam mebarояd.
  async function removeFromActual(storyId: number) {
    if (open === null) return;

    await removeStoryFromActual(token, open.actualId, storyId);
    await load();
  }

  // ---------- Tark kardani hamai to-plam ----------
  async function dropActual(actual: Actual) {
    if (!window.confirm(t.highlightDeleteAsk)) return;

    try {
      await deleteActual(token, actual.actualId);
      await load();
    } catch (err) {
      setError(errorText(err, t.highlightFailed));
    }
  }

  // Hanuz bor meshavad va hech chiz nest -> joi kholi nameguzorem
  if (loading && actuals.length === 0) return null;

  // Na to-plam hast, na story -> qism umuman lozim nest
  if (actuals.length === 0 && stories.length === 0) return null;

  return (
    <section
      className="mt-6 border-b pb-2 md:mt-8"
      style={{ borderColor: "var(--line)" }}
    >
      {/* Scrollbar penhon - instagram ham chunin ast */}
      <div className="flex gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] md:gap-8 [&::-webkit-scrollbar]:hidden">
        {/* ---------- Tugmai "+" - to-plami nav ---------- */}
        <Bubble
          label={t.newHighlight}
          onClick={() => setCreateOpen(true)}
          dashed
        >
          <Plus
            className="h-6 w-6 text-[var(--fg)] md:h-7 md:w-7"
            strokeWidth={1.6}
          />
        </Bubble>

        {/* ---------- To-plamho ---------- */}
        {actuals.map((actual) => {
          const cover = mediaUrl(actual.coverImage);

          return (
            <Bubble
              key={actual.actualId}
              label={actual.title}
              onClick={() => void openActual(actual)}
              // Zadani rost (yo dароz doshtan dar telefon) - tark kardan
              onContextMenu={(event) => {
                event.preventDefault();
                void dropActual(actual);
              }}
              title={`${actual.title} - ${actual.storyCount}`}
            >
              {cover !== null && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cover}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                  loading="lazy"
                />
              )}
            </Bubble>
          );
        })}
      </div>

      {error !== "" && (
        <p className="pb-3 text-[13px]" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      {/* ---------- Namoishi to-plam ---------- */}
      {open !== null && (
        <StoryViewer
          stories={open.stories}
          index={index}
          onChangeIndex={setIndex}
          onClose={() => {
            setIndex(null);
            setOpen(null);
          }}
          title={open.title}
          removeLabel={t.highlightRemoveStory}
          onRemove={(story) => removeFromActual(story.id)}
        />
      )}

      {/* ---------- Sokhtani to-plami nav ---------- */}
      <ActualModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => void load()}
      />
    </section>
  );
}

// ------------------------------------------------------------
//  Yak doira bo nom dar poyon - andozahoi instagram:
//  77px dar kompyuter, 64px dar telefon.
// ------------------------------------------------------------
function Bubble({
  label,
  onClick,
  onContextMenu,
  title,
  dashed = false,
  children,
}: {
  label: string;
  onClick: () => void;
  onContextMenu?: (event: React.MouseEvent) => void;
  title?: string;
  dashed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-[64px] shrink-0 flex-col items-center gap-1.5 md:w-[80px]">
      <button
        type="button"
        onClick={onClick}
        onContextMenu={onContextMenu}
        title={title ?? label}
        aria-label={label}
        className={`flex h-[64px] w-[64px] items-center justify-center overflow-hidden rounded-full bg-[var(--panel)] transition-transform duration-200 hover:scale-105 active:scale-95 md:h-[77px] md:w-[77px] ${
          dashed ? "border-2 border-dashed" : "border"
        }`}
        style={{ borderColor: dashed ? "var(--lineStrong)" : "var(--line)" }}
      >
        {children}
      </button>

      <span className="w-full truncate text-center text-[12px]">{label}</span>
    </div>
  );
}
