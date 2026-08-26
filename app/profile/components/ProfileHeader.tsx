"use client";

// ============================================================
//  ProfileHeader - sari profili KHUDI korbar (/profile).
//
//  DIZAYN: AYNAN monandi instagram (components/profile/ProfileTop).
//
//  ============================================================
//  IN JO SE KHATO BUD:
//
//  1) Modalhoi "Posti nav" va "Reeli nav" dar sahifa MEISTODAND,
//     vale HECH KAS onhoro namekushod: setPostOpen/setReelOpen
//     hech joi kod sado karda nameshudand. Tugmai onho nabud.
//
//  2) EditProfileModal soakhta shuda bud, vale dar HECH JOI
//     sayt istifoda nameshud - ya'ne korbar "dar borai man"
//     va jinsro UMUMAN ivaz karda nametavonist.
//
//  3) Tugmai "+"-i roi avatar hamesha SURATI NAV mepursid.
//     Dar instagram zadan ba avatar story-ro MEKUSHOYAD (agar
//     bosad), va "+" faqat baroi guzoshtani nav ast.
//
//  Hozir hama kor mekunad va tugmaho dar joi instagrami khud
//  hastand: [Tahriri profil] [Posti nav] [Reeli nav] [⚙]
// ============================================================
import { useRef, useState } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";

import { addStory, errorText } from "../api";
import { toJpegFile } from "../toJpeg";
import { useProfile } from "../providers";

import { ProfileButton, ProfileTop } from "@/components/profile/ProfileTop";
import { useT } from "@/components/LocaleProvider";

import CreatePostModal from "./CreatePostModal";
import CreateReelModal from "./CreateReelModal";
import EditProfileModal from "./EditProfileModal";
import FollowListModal from "./FollowListModal";
import StoryViewer from "./StoryViewer";

export default function ProfileHeader() {
  const { profile, stories, token, reload } = useProfile();
  const { t } = useT();

  const [postOpen, setPostOpen] = useState(false);
  const [reelOpen, setReelOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [followTab, setFollowTab] = useState<"followers" | "following" | null>(
    null,
  );

  // Namoishi story: raqami story-i kushoda, yo null
  const [storyIndex, setStoryIndex] = useState<number | null>(null);

  // Baroi STORY-i nav
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (profile === null) return null;

  const hasStory = stories.length > 0;

  async function handleStoryPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    // Maidonro toza mekunem - ki ayni hamon faylro dubora giriftan shavad
    event.target.value = "";
    if (!file) return;

    setError("");
    setBusy(true);

    try {
      const image = await toJpegFile(file);
      await addStory(token, image);
      await reload(); // storyi nav darhol dar qatori story paydo meshavad
    } catch (err) {
      setError(errorText(err, t.storyFailed));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ProfileTop
        userName={profile.userName}
        fullName={profile.fullName}
        about={profile.about}
        image={profile.image}
        posts={profile.postCount}
        followers={profile.subscribersCount}
        following={profile.subscriptionsCount}
        hasStory={hasStory}
        // Monandi instagram: agar story bosad - onro mekushoyad,
        // vagarna darhol surati navro mepursad.
        onAvatar={() =>
          hasStory ? setStoryIndex(0) : fileInput.current?.click()
        }
        // Tugmai "+" AYNAN dar kunji avatar - monandi instagram.
        // (Peshtar u dar qatori "Tahriri profil / Posti nav" bud
        //  va ba story hech monandi nadosht.)
        onAddStory={() => fileInput.current?.click()}
        addStoryBusy={busy}
        onFollowers={() => setFollowTab("followers")}
        onFollowing={() => setFollowTab("following")}
        actions={
          <>
            <ProfileButton onClick={() => setEditOpen(true)}>
              {t.editProfile}
            </ProfileButton>

            <ProfileButton onClick={() => setPostOpen(true)}>
              {t.newPost}
            </ProfileButton>

            <ProfileButton onClick={() => setReelOpen(true)}>
              {t.newReelBtn}
            </ProfileButton>

            <Link
              href="/settings"
              title={t.gearTitle}
              aria-label={t.gearTitle}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--fg)] transition-colors duration-200 hover:bg-[var(--panel)]"
            >
              <Settings className="h-[22px] w-[22px]" strokeWidth={1.8} />
            </Link>
          </>
        }
      />

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={handleStoryPick}
      />

      {busy && (
        <p className="mt-3 text-[12px]" style={{ color: "var(--muted)" }}>
          {t.storyUploading}
        </p>
      )}

      {error !== "" && (
        <p
          className="mt-3 text-[13px]"
          style={{ color: "var(--danger)" }}
          role="alert"
        >
          {error}
        </p>
      )}

      {/* ================= MODALHO ================= */}
      <CreatePostModal open={postOpen} onOpenChange={setPostOpen} />
      <CreateReelModal open={reelOpen} onOpenChange={setReelOpen} />
      <EditProfileModal open={editOpen} onOpenChange={setEditOpen} />

      <FollowListModal
        tab={followTab}
        onClose={() => setFollowTab(null)}
        userId={profile.userId}
        myUserId={profile.userId}
      />

      <StoryViewer
        stories={stories}
        index={storyIndex}
        onChangeIndex={setStoryIndex}
        onClose={() => setStoryIndex(null)}
      />
    </>
  );
}
