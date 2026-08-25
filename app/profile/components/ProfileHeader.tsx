"use client";

// ============================================================
//  ProfileHeader - qismi bolo-i sahifa.
// ============================================================
import { useRef, useState } from "react";
import { Plus } from "lucide-react";

import { CountUp } from "@/components/CountUp";

import { addStory, errorText, mediaUrl } from "../api";
import { toJpegFile } from "../toJpeg";
import { initials, shortNumber } from "../format";
import { useProfile } from "../providers";
import styles from "../profile.module.css";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Alert } from "../ui/alert";

import CreatePostModal from "./CreatePostModal";
import CreateReelModal from "./CreateReelModal";
import FollowListModal from "./FollowListModal";

export default function ProfileHeader() {
  const { profile, token, reload } = useProfile();

  const [postOpen, setPostOpen] = useState(false);
  const [reelOpen, setReelOpen] = useState(false);
  const [followTab, setFollowTab] = useState<"followers" | "following" | null>(
    null
  );

  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (profile === null) return null;

  const avatar = mediaUrl(profile.image);

  async function handleStoryPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError("");
    setBusy(true);

    try {
      const image = await toJpegFile(file);
      await addStory(token, image);
      await reload();
    } catch (err) {
      setError(
        errorText(err, "Стори гузошта нашуд. Акси дигарро санҷед.")
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`${styles.rise} pt-2 sm:pt-4`}>
      <div className={`${styles.glass} overflow-hidden`}>
        {/* ================= MUQOVA (daruni karta) ================= */}
        <div aria-hidden className={styles.cover}>
          {avatar !== null && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className={styles.coverImg} />
          )}
          <span className={`${styles.blob} ${styles.blobA}`} />
          <span className={`${styles.blob} ${styles.blobB}`} />
          <span className={`${styles.blob} ${styles.blobC}`} />
          <span className={styles.coverFade} />
        </div>

        {/* ================= MA'LUMOT ================= */}
        <div className="relative px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="-mt-[62px] flex flex-col items-center gap-5 sm:-mt-[76px] sm:flex-row sm:items-end sm:gap-7">
            {/* ---------- AVATAR + STORY ---------- */}
            <div className="relative shrink-0">
              <span
                className={`${styles.spinRing} ${styles.spinGlow}`}
                style={{ inset: "-12px" }}
              />
              <span className={styles.spinRing} style={{ inset: "-3px" }} />
              <span className="absolute inset-0 rounded-full bg-[var(--bg)]" />

              <Avatar className="relative h-[124px] w-[124px] border-[3px] border-[var(--bg)] sm:h-[148px] sm:w-[148px]">
                {avatar !== null && (
                  <AvatarImage src={avatar} alt={profile.userName} />
                )}
                <AvatarFallback className="text-4xl sm:text-5xl">
                  {initials(profile.fullName || profile.userName)}
                </AvatarFallback>
              </Avatar>

              {/* Tugmai "+" -> STORY-i nav */}
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={busy}
                aria-label="Стори нав гузоред"
                title="Стори нав"
                className={`${styles.gradBg} absolute right-0 bottom-1 z-10 flex h-9 w-9 items-center justify-center rounded-full shadow-[var(--shadowSoft)] transition-transform duration-200 hover:scale-110 active:scale-95 disabled:opacity-50 sm:right-1 sm:h-10 sm:w-10`}
                style={{ border: "3px solid var(--bg)" }}
              >
                <Plus className="h-5 w-5" strokeWidth={2.6} />
              </button>

              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                hidden
                onChange={handleStoryPick}
              />
            </div>

            {/* ---------- NOM ---------- */}
            <div className="min-w-0 flex-1 pb-1 text-center sm:pb-2 sm:text-left">
              <h1 className="truncate text-[26px] leading-tight font-bold tracking-[-0.02em] sm:text-[32px]">
                {profile.fullName || profile.userName}
              </h1>
              <p
                className="mt-0.5 truncate text-[14px] font-medium"
                style={{ color: "var(--muted)" }}
              >
                @{profile.userName}
              </p>
            </div>
          </div>

          {busy && (
            <p
              className="mt-3 text-center text-[12px] font-medium sm:text-left"
              style={{ color: "var(--muted)" }}
            >
              Стори бор шуда истодааст...
            </p>
          )}

          {/* ---------- "Dar borai man" ---------- */}
          {profile.about !== null && profile.about.trim() !== "" ? (
            <p className="mx-auto mt-5 max-w-[58ch] text-center text-[14px] leading-relaxed whitespace-pre-line sm:mx-0 sm:text-left">
              {profile.about}
            </p>
          ) : (
            <p className="mx-auto mt-3 max-w-[58ch] text-center text-[13px] italic sm:mx-0 sm:text-left" style={{ color: "var(--muted)" }}>
              Ҳанӯз матни &quot;дар бораи ман&quot; нест
            </p>
          )}

          {/* ---------- HISOBHO ---------- */}
          <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
            <Stat label="Постҳо" value={profile.postCount} delay={200} />

            <Stat
              label="Обуначиён"
              value={profile.subscribersCount}
              delay={290}
              onClick={() => setFollowTab("followers")}
            />

            <Stat
              label="Обунаҳо"
              value={profile.subscriptionsCount}
              delay={380}
              onClick={() => setFollowTab("following")}
            />
          </div>

          {error !== "" && (
            <Alert variant="destructive" className={`${styles.snap} mt-5`}>
              {error}
            </Alert>
          )}
        </div>
      </div>

      {/* ================= MODALHO ================= */}
      <CreatePostModal open={postOpen} onOpenChange={setPostOpen} />
      <CreateReelModal open={reelOpen} onOpenChange={setReelOpen} />

      <FollowListModal
        tab={followTab}
        onClose={() => setFollowTab(null)}
        userId={profile.userId}
      />
    </section>
  );
}

function Stat({
  label,
  value,
  delay,
  onClick,
}: {
  label: string;
  value: number;
  delay: number;
  onClick?: () => void;
}) {
  const inside = (
    <>
      <span
        className={`${styles.gradText} text-[22px] font-extrabold tracking-[-0.02em] tabular-nums sm:text-[26px]`}
      >
        <CountUp value={value} delay={delay} format={shortNumber} />
      </span>
      <span
        className="text-[11px] font-medium tracking-wide uppercase sm:text-[12px]"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </span>
    </>
  );

  if (!onClick) {
    return <div className={styles.statCard}>{inside}</div>;
  }

  return (
    <button type="button" onClick={onClick} className={styles.statCard}>
      {inside}
    </button>
  );
}
