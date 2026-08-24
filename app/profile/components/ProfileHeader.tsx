"use client";

// ============================================================
//  ProfileHeader - qismi bolo-i sahifa (monandi instagram):
//    - avatar gird bo khalqai gradient
//    - tugmai "+" dar kunji avatar -> STORY-i nav (POST /Story/AddStories)
//    - nomi korbar + tugmahoi Post / Reel
//    - hisobho: POSTHO / FOLOWERS / FOLOWING
//    - nomi purra va matni "dar borai man"
//
//  DIQQAT (talabi korbar):
//    ivaz/tozakunii SURATI profil va TAHRIR in jo NESTAND -
//    onho ba SETTING meravand (ba'dtar dar UI dobavit meshavand).
//    Email va JINS ham az in jo girifta shudand.
//
//  HAMAI raqamho va matnho az server meoyand
//  (GET /UserProfile/get-my-profile).
// ============================================================
import { useRef, useState } from "react";
import { Film, Plus } from "lucide-react";

import { addStory, errorText, mediaUrl } from "../api";
import { toJpegFile } from "../toJpeg";
import { initials, shortNumber } from "../format";
import { useProfile } from "../providers";
import styles from "../profile.module.css";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Alert } from "../ui/alert";

import CreatePostModal from "./CreatePostModal";
import CreateReelModal from "./CreateReelModal";
import FollowListModal from "./FollowListModal";

export default function ProfileHeader() {
  const { profile, token, reload } = useProfile();

  // Kadom modal kushoda ast?
  const [postOpen, setPostOpen] = useState(false);
  const [reelOpen, setReelOpen] = useState(false);
  const [followTab, setFollowTab] = useState<"followers" | "following" | null>(
    null
  );

  // Baroi STORY-i nav
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (profile === null) return null;

  const avatar = mediaUrl(profile.image);

  // ---------- STORY-i nav (POST /Story/AddStories) ----------
  async function handleStoryPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    // Maidonro toza mekunem - ki ayni hamon faylro dubora intikhob kardan shavad
    event.target.value = "";
    if (!file) return;

    setError("");
    setBusy(true);

    try {
      // Server ba'ze namudi surat (webp/avif/heic)-ro qabul namekunad.
      // Baroi hamin dar browser onro ba JPEG meguzaronem.
      const image = await toJpegFile(file);

      await addStory(token, image);
      await reload(); // storyi nav darhol dar qatori story peydo meshavad
    } catch (err) {
      setError(
        errorText(err, "Story guzoshta nashud. Surati digarro sanjed.")
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`${styles.rise} pt-10 sm:pt-14`}>
      <div className="flex flex-col items-center gap-9 sm:flex-row sm:items-start sm:gap-16">
        {/* ================= AVATAR + STORY ================= */}
        <div className="shrink-0">
          <div className="relative">
            {/* Khalqai gradient dar gird-i avatar */}
            <span className={`${styles.ring} h-[128px] w-[128px] sm:h-[164px] sm:w-[164px]`}>
              <span className={styles.ringInner}>
                <Avatar className="h-full w-full">
                  {avatar !== null && (
                    <AvatarImage src={avatar} alt={profile.userName} />
                  )}
                  <AvatarFallback className="text-4xl sm:text-5xl">
                    {initials(profile.fullName || profile.userName)}
                  </AvatarFallback>
                </Avatar>
              </span>
            </span>

            {/* Tugmai "+" -> STORY-i nav (monandi instagram) */}
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={busy}
              aria-label="Storyi nav guzored"
              title="Storyi nav"
              className={`${styles.gradBg} absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full shadow-[var(--shadowSoft)] transition-transform duration-200 hover:scale-110 active:scale-95 disabled:opacity-50 sm:bottom-2 sm:right-2`}
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

          {busy && (
            <p
              className="mt-3 text-center text-[12px] font-medium"
              style={{ color: "var(--muted)" }}
            >
              Story bor karda istodaast...
            </p>
          )}
        </div>

        {/* ================= MA'LUMOT ================= */}
        <div className="min-w-0 flex-1 text-center sm:text-left">
          {/* --- Nomi korbar + tugmaho --- */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <h1 className="text-[26px] font-semibold leading-none tracking-tight sm:text-[28px]">
              {profile.userName}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <Button size="sm" onClick={() => setPostOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" strokeWidth={2.4} />
                Post
              </Button>

              <Button
                size="sm"
                variant="soft"
                onClick={() => setReelOpen(true)}
                className="gap-2"
              >
                <Film className="h-3.5 w-3.5" strokeWidth={2} />
                Reel
              </Button>
            </div>
          </div>

          {/* --- HISOBHO: postho / folowers / folowing --- */}
          <div className={`${styles.card} mt-7 grid max-w-lg grid-cols-3 px-2 py-1 sm:mt-8`}>
            <Stat label="Postho" value={profile.postCount} />

            <Stat
              label="Folowers"
              value={profile.subscribersCount}
              onClick={() => setFollowTab("followers")}
            />

            <Stat
              label="Folowing"
              value={profile.subscriptionsCount}
              onClick={() => setFollowTab("following")}
            />
          </div>

          {/* --- Nom va matni "dar borai man" --- */}
          <div className="mt-7 space-y-1.5">
            <p className="text-[15px] font-semibold">{profile.fullName}</p>

            {profile.about !== null && profile.about.trim() !== "" ? (
              <p className="mx-auto max-w-prose whitespace-pre-line text-[14px] leading-relaxed sm:mx-0">
                {profile.about}
              </p>
            ) : (
              <p className="text-[13px] italic" style={{ color: "var(--muted)" }}>
                Hanuz matni &quot;dar borai man&quot; nest
              </p>
            )}
          </div>

          {error !== "" && (
            <Alert variant="destructive" className={`${styles.snap} mt-5 max-w-lg`}>
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

// ------------------------------------------------------------
//  Yak "khonai hisob": raqami kalon + nomi khurd.
//  Agar onClick bosad -> tugma meshavad (folowers/folowing).
// ------------------------------------------------------------
function Stat({
  label,
  value,
  onClick,
}: {
  label: string;
  value: number;
  onClick?: () => void;
}) {
  const inside = (
    <>
      <span className="text-lg font-bold tabular-nums sm:text-xl">
        {shortNumber(value)}
      </span>
      <span className="mt-0.5 text-[12px]" style={{ color: "var(--muted)" }}>
        {label}
      </span>
    </>
  );

  const shared =
    "flex flex-col items-center justify-center rounded-2xl px-2 py-4 transition-colors duration-200";

  if (!onClick) {
    return <div className={shared}>{inside}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${shared} hover:bg-[var(--panel)]`}
    >
      {inside}
    </button>
  );
}
