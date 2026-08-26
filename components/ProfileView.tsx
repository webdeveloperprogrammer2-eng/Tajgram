"use client";

// ============================================================
//  ProfileView - profili korbari DIGAR (/profile/[userId]).
//
//  Peshtar in sahifa dizayni TAMOMAN digar dosht: kartai
//  shishagin, muqovai mavhum bo doghhoi rangin, halqahoi
//  gardishkunanda, khonahoi omor bo raqamhoi gradienti va
//  tabhoi khudash ("Postho / Video / Mashhur" - ki dar
//  instagram nestand).
//
//  Hozir HAMON sokhtore ki dar /profile ast:
//  components/profile/ProfileTop + ProfileTabs.
//  Yak "profil" - yak namud.
//
//  TUGMAHO monandi instagram: [Obuna]/[Obuna shuda] va [Payom].
// ============================================================

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useChats } from "@/app/chats/providers";
import { api, isVideo, mediaUrl } from "@/lib/api";
import { formatCount } from "@/lib/format";
import type { Post, UserProfile } from "@/lib/types";

import { ProfileButton, ProfileTop } from "./profile/ProfileTop";
import { ProfileChatPanel } from "./profile/ProfileChatPanel";
import {
  ProfileEmpty,
  ProfileGrid,
  ProfileTabs,
  type ProfileTab,
} from "./profile/ProfileTabs";
import { CommentIcon, GridIcon, HeartIcon, ImageIcon, PlayIcon } from "./icons";
import { FollowersModal } from "./profile/FollowersModal";
import { HighlightsRow } from "./profile/HighlightsRow";
import { PostLightbox } from "./profile/PostLightbox";
import { useT } from "./LocaleProvider";

export function ProfileView({
  profile,
  isMe = false,
  myUserId = "",
}: {
  profile: UserProfile;
  isMe?: boolean;
  /** KI man hastam - baroi ro-ykhati obunachiho. */
  myUserId?: string;
}) {
  const { t } = useT();
  const router = useRouter();
  // Ba'di obuna shudan ro-ykhati "bo ki navishtan mumkin"-ro
  // az nav megirem - vagarna ChatWindow maidoni navishtanro
  // basta menamud.
  const { reloadAllowed } = useChats();

  // Matni tabho az lughat meoyad - baroi hamin DARUNI component.
  const tabs: ProfileTab[] = [
    { id: "posts", label: t.tabPosts, icon: <GridIcon size={12} /> },
    { id: "video", label: t.tabVideo, icon: <PlayIcon size={13} /> },
  ];

  const posts = useMemo(() => profile.posts ?? [], [profile.posts]);
  const [tab, setTab] = useState("posts");
  const [openPost, setOpenPost] = useState<Post | null>(null);
  const [followTab, setFollowTab] = useState<"followers" | "following" | null>(
    null,
  );

  // Suhbat DAR HAMIN sahifa kushoda meshavad - na dar /chats.
  const [chatOpen, setChatOpen] = useState(false);

  // Tugmai obuna: darhol ivaz meshavad (optimistic), agar server
  // khato dihad - ba holati peshina bar megardad.
  const [following, setFollowing] = useState(profile.isFollowing);
  const [followers, setFollowers] = useState(profile.subscribersCount);
  const [busy, setBusy] = useState(false);

  // Videoho az hamon ro-ykhat judo meshavand - ma'lumoti soakhta nest
  const videos = useMemo(
    () => posts.filter((post) => isVideo(post.images?.[0]?.imageName)),
    [posts],
  );

  const shown = tab === "video" ? videos : posts;

  async function toggleFollow() {
    if (busy) return;

    const next = !following;
    setBusy(true);

    // Darhol namoyon mekunem - monandi instagram
    setFollowing(next);
    setFollowers((count) => Math.max(0, count + (next ? 1 : -1)));

    try {
      if (next) await api.follow(profile.userId);
      else await api.unfollow(profile.userId);

      void reloadAllowed();
    } catch {
      // Nashud -> ba aqib. Peshtar khato KHOMUSH furu burda meshud
      // va raqam "durugh" memond to navsozii sahifa.
      setFollowing(!next);
      setFollowers((count) => Math.max(0, count + (next ? -1 : 1)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[935px] px-4 pb-10 md:px-5">
      <ProfileTop
        userName={profile.userName}
        fullName={profile.fullName}
        about={profile.about}
        image={profile.image}
        posts={profile.postCount}
        followers={followers}
        following={profile.subscriptionsCount}
        onFollowers={() => setFollowTab("followers")}
        onFollowing={() => setFollowTab("following")}
        actions={
          isMe ? (
            <ProfileButton onClick={() => router.push("/profile")}>
              {t.editProfile}
            </ProfileButton>
          ) : following ? (
            // Obuna shudaem -> hamon YAK tugma ba DU qism taqsim
            // meshavad: "Obuna shuda" (baromadan) va "Payom".
            <>
              <ProfileButton
                onClick={toggleFollow}
                disabled={busy}
                className="min-w-[112px] flex-1 md:flex-none"
              >
                {t.unfollowShort}
              </ProfileButton>

              <ProfileButton
                onClick={() => setChatOpen(true)}
                className="min-w-[112px] flex-1 md:flex-none"
              >
                {t.message}
              </ProfileButton>
            </>
          ) : (
            // Hanuz obuna nashudaem -> FAQAT yak tugmai DAROZ.
            // "Payom" in jo NEST: ba kase ki obuna nashudaem
            // navishtan ham mumkin nest.
            <ProfileButton
              onClick={toggleFollow}
              disabled={busy}
              primary
              className="w-full md:w-[240px]"
            >
              {t.followShort}
            </ProfileButton>
          )
        }
      />

      {/* "ACTUALNIY" - to-plamhoi hameshagii story (/Actual).
          Faqat DIDAN: dar profili kasi digar tark kardan
          va guzoshtan mumkin nest. */}
      <HighlightsRow userId={profile.userId} />

      <ProfileTabs tabs={tabs} active={tab} onChange={setTab} />

      {shown.length > 0 ? (
        <ProfileGrid>
          {shown.map((post) => (
            <GridCell
              key={post.postId}
              post={post}
              onOpen={() => setOpenPost(post)}
            />
          ))}
        </ProfileGrid>
      ) : (
        <ProfileEmpty
          icon={<ImageIcon size={26} />}
          title={tab === "video" ? t.noVideosYet : t.noPostsTitle}
          text={isMe ? t.firstPostHint : undefined}
        />
      )}

      <PostLightbox post={openPost} onClose={() => setOpenPost(null)} />

      {/* Suhbat dar boloi HAMIN profil - be raftan ba /chats */}
      <ProfileChatPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        userId={profile.userId}
        userName={profile.userName}
        fullName={profile.fullName}
        image={profile.image}
      />

      <FollowersModal
        tab={followTab}
        userId={profile.userId}
        myUserId={myUserId}
        onClose={() => setFollowTab(null)}
      />
    </div>
  );
}

// ------------------------------------------------------------
//  Yak khonai tur - monandi instagram: kvadrat, be kunji gird.
// ------------------------------------------------------------
function GridCell({ post, onOpen }: { post: Post; onOpen: () => void }) {
  const { t } = useT();
  const first = post.images?.[0]?.imageName ?? null;
  const url = mediaUrl(first);
  const video = isVideo(first);
  const album = (post.images?.length ?? 0) > 1;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative block aspect-square w-full overflow-hidden bg-[var(--panel)]"
    >
      {url !== null &&
        (video ? (
          <video
            src={url}
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={post.title ?? t.photoAlt}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ))}

      {(video || album) && (
        <span className="pointer-events-none absolute top-2 right-2 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
          {video ? <PlayIcon size={15} /> : <ImageIcon size={15} />}
        </span>
      )}

      <span className="pointer-events-none absolute inset-0 hidden items-center justify-center gap-7 bg-black/35 text-[15px] font-bold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:flex">
        <span className="flex items-center gap-1.5 tabular-nums">
          <HeartIcon size={19} filled />
          {formatCount(post.postLikeCount)}
        </span>
        <span className="flex items-center gap-1.5 tabular-nums">
          <CommentIcon size={19} />
          {formatCount(post.commentCount)}
        </span>
      </span>
    </button>
  );
}
