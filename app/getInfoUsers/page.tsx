"use client";

// ============================================================
//  app/getInfoUsers/page.tsx  ->  adres: /getInfoUsers?id=<userId>
//
//  Profili KORBARI DIGAR - monandi profili khudamon, vale:
//    - dar bayni MA'LUMOT va REELS yak tugmai KALON hast:
//        * agar podpiska nakarda bosem -> "PODPISKA" (yak tugmai daroz)
//        * agar podpiska karda bosem   -> ba DU tugma taqsim meshavad:
//              chap  = OTPISKA
//              rost  = CHAT (ba suhbat bo hamin korbar mebarad)
//
//  HAMAI ma'lumot az server meoyad (swagger).
// ============================================================
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bookmark,
  Eye,
  Grid3x3,
  Heart,
  MessageCircle,
  MessageSquare,
  Play,
  UserMinus,
  UserPlus,
} from "lucide-react";

import {
  createChat,
  follow,
  getFollowers,
  getFollowing,
  getUserPosts,
  getUserProfile,
  getUserReels,
  initials,
  mediaUrl,
  shortNumber,
  unfollow,
  type Post,
  type Reel,
  type ShortUser,
  type UserProfile,
} from "./api";
import { getToken } from "./token";
import styles from "./user.module.css";
import { useT } from "@/components/LocaleProvider";

export default function Page() {
  // useSearchParams -> Suspense talab mekunad
  return (
    <Suspense fallback={<Loading />}>
      <UserProfilePage />
    </Suspense>
  );
}

function UserProfilePage() {
  const { t } = useT();
  const router = useRouter();
  const params = useSearchParams();
  const userId = params.get("id") ?? "";

  const [token, setToken] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [tab, setTab] = useState<"posts" | "reels">("posts");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Ro-ykhati podpischikho / podpiskaho (vaqte ba raqam zaded)
  const [listTitle, setListTitle] = useState("");
  const [list, setList] = useState<ShortUser[]>([]);

  useEffect(() => {
    queueMicrotask(() => setToken(getToken() ?? ""));
  }, []);

  // ---------- Hamai ma'lumotro megirem ----------
  useEffect(() => {
    if (token === "" || userId === "") return;

    let alive = true;
    queueMicrotask(() => {
      if (!alive) return;
      setLoading(true);
      setError("");
    });

    getUserProfile(token, userId)
      .then(async (data) => {
        if (!alive) return;
        setProfile(data);

        // Postho va reels - agar yakash khato dihad, digarash bosad
        const [userPosts, userReels] = await Promise.all([
          getUserPosts(token, userId).catch(() => []),
          getUserReels(token, userId).catch(() => []),
        ]);

        if (!alive) return;
        setPosts(userPosts);
        setReels(userReels);
      })
      .catch((err: Error) => {
        if (alive) setError(err.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [token, userId]);

  // ---------- PODPISKA / OTPISKA ----------
  async function handleFollow() {
    if (profile === null) return;
    setBusy(true);

    try {
      if (profile.isFollowing) {
        await unfollow(token, profile.userId);
        setProfile({
          ...profile,
          isFollowing: false,
          subscribersCount: Math.max(0, profile.subscribersCount - 1),
        });
      } else {
        await follow(token, profile.userId);
        setProfile({
          ...profile,
          isFollowing: true,
          subscribersCount: profile.subscribersCount + 1,
        });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // ---------- CHAT ----------
  //  Chat mesozem (yo hamon chati kuhnaro megirem) va ba
  //  /chats?chatId=... meravem - on jo hamin suhbat kushoda meshavad.
  async function handleChat() {
    if (profile === null) return;
    setBusy(true);

    try {
      const chatId = await createChat(token, profile.userId);
      router.push(`/chats?chatId=${chatId}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  // ---------- Ro-ykhati podpischikho ----------
  async function openList(kind: "followers" | "following") {
    if (profile === null) return;

    setListTitle(kind === "followers" ? t.titleFollowers : t.titleFollowing);
    setList([]);

    try {
      const data =
        kind === "followers"
          ? await getFollowers(token, profile.userId)
          : await getFollowing(token, profile.userId);
      setList(data);
    } catch {
      setList([]);
    }
  }

  if (userId === "") return <Message>{t.userNotPicked}</Message>;
  if (token === "") return <Message>{t.loginFirst}</Message>;
  if (loading) return <Loading />;
  if (error !== "" && profile === null) return <Message>{error}</Message>;
  if (profile === null) return <Message>{t.userNotFound}</Message>;

  const avatar = mediaUrl(profile.image);

  return (
    <div className={`${styles.rise} pb-16 pt-10`}>
      {/* ================= MA'LUMOTI KORBAR ================= */}
      <div className="flex flex-col items-center gap-9 sm:flex-row sm:items-start sm:gap-16">
        <span
          className={styles.ring}
          style={{ height: 148, width: 148, flexShrink: 0 }}
        >
          <span className={styles.ringInner} style={{ fontSize: 44 }}>
            {avatar !== null ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt={profile.userName}
                className="h-full w-full object-cover"
              />
            ) : (
              initials(profile.fullName || profile.userName)
            )}
          </span>
        </span>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h1 className="text-[26px] font-semibold leading-none tracking-tight">
            {profile.userName}
          </h1>

          {/* --- Hisobho --- */}
          <div className={`${styles.card} mt-7 grid max-w-lg grid-cols-3 px-2 py-1`}>
            <Stat label={t.tabPosts} value={profile.postCount} />
            <Stat
              label={t.titleFollowers}
              value={profile.subscribersCount}
              onClick={() => openList("followers")}
            />
            <Stat
              label={t.titleFollowing}
              value={profile.subscriptionsCount}
              onClick={() => openList("following")}
            />
          </div>

          {/* --- Nom va "dar borai man" --- */}
          <div className="mt-7 space-y-1.5">
            <p className="text-[15px] font-semibold">{profile.fullName}</p>

            {profile.about !== null && profile.about.trim() !== "" ? (
              <p className="mx-auto max-w-prose whitespace-pre-line text-[14px] leading-relaxed sm:mx-0">
                {profile.about}
              </p>
            ) : (
              <p className="text-[13px] italic" style={{ color: "var(--muted)" }}>
                {t.noBio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ================= TUGMAI PODPISKA / (OTPISKA + CHAT) ============ */}
      <div className="mt-9">
        {!profile.isFollowing ? (
          // Yak tugmai DAROZ
          <button
            type="button"
            onClick={handleFollow}
            disabled={busy}
            className={`${styles.gradBg} flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition-all duration-200 hover:brightness-110 active:scale-[0.99] disabled:opacity-50`}
          >
            <UserPlus className="h-4 w-4" strokeWidth={2.2} />
            {t.follow}
          </button>
        ) : (
          // Ba DU tugma taqsim meshavad
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleFollow}
              disabled={busy}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition-all duration-200 hover:brightness-95 active:scale-[0.99] disabled:opacity-50"
              style={{ background: "var(--panel)", color: "var(--fg)" }}
            >
              <UserMinus className="h-4 w-4" strokeWidth={2.2} />
              {t.unfollow}
            </button>

            <button
              type="button"
              onClick={handleChat}
              disabled={busy}
              className={`${styles.gradBg} flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition-all duration-200 hover:brightness-110 active:scale-[0.99] disabled:opacity-50`}
            >
              <MessageSquare className="h-4 w-4" strokeWidth={2.2} />
              {t.chat}
            </button>
          </div>
        )}

        {error !== "" && (
          <p className="mt-3 text-center text-[13px]" style={{ color: "var(--signal)" }}>
            {error}
          </p>
        )}
      </div>

      {/* ================= POSTHO / REELS ================= */}
      <div
        className="mt-10 flex justify-center gap-10 border-t"
        style={{ borderColor: "var(--line)" }}
      >
        <TabButton
          active={tab === "posts"}
          onClick={() => setTab("posts")}
          icon={<Grid3x3 className="h-4 w-4" strokeWidth={1.8} />}
          label={t.tabPosts}
        />
        <TabButton
          active={tab === "reels"}
          onClick={() => setTab("reels")}
          icon={<Bookmark className="h-4 w-4" strokeWidth={1.8} />}
          label={t.tabReels}
        />
      </div>

      {tab === "posts" ? (
        posts.length === 0 ? (
          <Message>{t.noPostsTitle}</Message>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
            {posts.map((post) => {
              const cover = mediaUrl(post.images[0]?.imageName);

              return (
                <div key={post.postId} className={styles.cellBox}>
                  {cover !== null && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt={post.title ?? "Post"}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  )}

                  <span className={styles.cellInfo}>
                    <span className="flex items-center gap-1.5 text-xs">
                      <Heart className="h-4 w-4" strokeWidth={1.8} />
                      {shortNumber(post.postLikeCount)}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs">
                      <MessageCircle className="h-4 w-4" strokeWidth={1.8} />
                      {shortNumber(post.commentCount)}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        )
      ) : reels.length === 0 ? (
        <Message>{t.noVideosYet}</Message>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
          {reels.map((reel) => {
            const cover = mediaUrl(reel.coverName);
            const video = mediaUrl(reel.videoName);

            return (
              <div key={reel.reelsId} className={styles.cellTallBox}>
                {cover !== null ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cover}
                    alt={reel.title ?? "Reel"}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  video !== null && (
                    <video
                      src={video}
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  )
                )}

                <span className="absolute right-2 top-2 text-white drop-shadow">
                  <Play className="h-4 w-4 fill-current" strokeWidth={0} />
                </span>

                <span className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1.5 text-xs text-white drop-shadow">
                  <Eye className="h-3.5 w-3.5" strokeWidth={1.8} />
                  {shortNumber(reel.reelsViewCount)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= RO-YKHATI PODPISCHIKHO ================= */}
      {listTitle !== "" && (
        <>
          <div
            className={styles.overlay}
            onClick={() => setListTitle("")}
            aria-hidden
          />

          <div className={styles.modal}>
            <div
              className="flex items-center justify-between border-b px-5 py-4"
              style={{ borderColor: "var(--line)" }}
            >
              <h2 className="text-[15px] font-bold">{listTitle}</h2>
              <button
                type="button"
                onClick={() => setListTitle("")}
                className={styles.iconBtn}
              >
                ✕
              </button>
            </div>

            <div className={`${styles.scroll} max-h-[50vh] px-2 py-3`}>
              {list.length === 0 ? (
                <p
                  className="py-10 text-center text-[13px]"
                  style={{ color: "var(--muted)" }}
                >
                  {t.emptyList}
                </p>
              ) : (
                list.map((person) => {
                  const image = mediaUrl(person.image);

                  return (
                    <button
                      key={person.userId}
                      type="button"
                      onClick={() => {
                        setListTitle("");
                        router.push(`/getInfoUsers?id=${person.userId}`);
                      }}
                      className={styles.chatRow}
                    >
                      <span
                        className={styles.ring}
                        style={{ height: 44, width: 44, flexShrink: 0 }}
                      >
                        <span className={styles.ringInner} style={{ fontSize: 13 }}>
                          {image !== null ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={image}
                              alt={person.userName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            initials(person.fullName || person.userName)
                          )}
                        </span>
                      </span>

                      <span className="min-w-0 flex-1 text-left">
                        <span className="block truncate text-[14px] font-semibold">
                          {person.userName}
                        </span>
                        <span
                          className="block truncate text-[12px]"
                          style={{ color: "var(--muted)" }}
                        >
                          {person.fullName}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

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

  if (!onClick) return <div className={shared}>{inside}</div>;

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

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="-mt-px flex items-center gap-2 border-t-2 px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors duration-200"
      style={{
        borderColor: active ? "var(--fg)" : "transparent",
        color: active ? "var(--fg)" : "var(--muted)",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function Message({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="py-20 text-center text-[13px]"
      style={{ color: "var(--muted)" }}
    >
      {children}
    </p>
  );
}

function Loading() {
  return (
    <div className="pt-12">
      <div className="flex flex-col items-center gap-9 sm:flex-row sm:items-start sm:gap-16">
        <div
          className={styles.skeleton}
          style={{ height: 148, width: 148, borderRadius: 999, flexShrink: 0 }}
        />

        <div className="w-full flex-1 space-y-4">
          <div className={styles.skeleton} style={{ height: 28, width: 180 }} />
          <div className={styles.skeleton} style={{ height: 88, width: "100%" }} />
          <div className={styles.skeleton} style={{ height: 14, width: 220 }} />
        </div>
      </div>

      <div className={`${styles.skeleton} mt-9`} style={{ height: 48, borderRadius: 999 }} />
    </div>
  );
}
