"use client";

// ============================================================
//  UserModal - modalkai tamomsahifagi bо ma'lumoti PURRAи korbar.
//  Tabho: Умумӣ / Постҳо / Reels / Сторис / Чатҳо / Шикоятҳо.
//  Amalho: Бан / Унбан, Нест кардан (delete).
// ============================================================
import { useCallback, useEffect, useState } from "react";
import {
  X,
  Mail,
  User as UserIcon,
  Hash,
  Users2,
  ShieldBan,
  Trash2,
  MessageSquareWarning,
  MessagesSquare,
  Grid3x3,
  Clapperboard,
  CircleDot,
  Heart,
  Eye,
  MessageCircle,
  Loader2,
  Send,
} from "lucide-react";

import { api, mediaUrl, isVideo } from "@/lib/api";
import type {
  Actual,
  Post,
  ProfileUser,
  Reel,
  UserProfile,
} from "@/lib/types";
import {
  fetchComplaints,
  addComplaint as apiAddComplaint,
  deleteComplaint as apiDeleteComplaint,
  banRemaining,
  type Ban,
  type Complaint,
} from "../adminApi";
import { BanDialog } from "./BanDialog";
import { AdminChats } from "./AdminChats";

type Tab = "overview" | "posts" | "reels" | "stories" | "chats" | "complaints";

const TABS: { key: Tab; label: string; icon: typeof Grid3x3 }[] = [
  { key: "overview", label: "Умумӣ", icon: UserIcon },
  { key: "posts", label: "Постҳо", icon: Grid3x3 },
  { key: "reels", label: "Reels", icon: Clapperboard },
  { key: "stories", label: "Сторис", icon: CircleDot },
  { key: "chats", label: "Чатҳо", icon: MessagesSquare },
  { key: "complaints", label: "Шикоятҳо", icon: MessageSquareWarning },
];

export function UserModal({
  userId,
  userName,
  ban,
  complaintCount,
  onClose,
  onBan,
  onUnban,
  onDelete,
}: {
  userId: string;
  userName: string;
  ban: Ban | null;
  complaintCount: number;
  onClose: () => void;
  onBan: (until: number | null, reason: string) => Promise<void>;
  onUnban: () => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [tab, setTab] = useState<Tab>("overview");

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [reels, setReels] = useState<Reel[] | null>(null);
  const [actuals, setActuals] = useState<Actual[] | null>(null);
  const [followers, setFollowers] = useState<ProfileUser[] | null>(null);
  const [followings, setFollowings] = useState<ProfileUser[] | null>(null);
  const [complaints, setComplaints] = useState<Complaint[] | null>(null);

  const [banOpen, setBanOpen] = useState(false);
  const [banBusy, setBanBusy] = useState(false);
  const [delBusy, setDelBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [newComplaint, setNewComplaint] = useState("");
  const [compBusy, setCompBusy] = useState(false);

  // Bastan bo Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Ma'lumoti asosi
  useEffect(() => {
    let alive = true;
    api
      .userProfile(userId)
      .then((e) => alive && setProfile(e.data))
      .catch(() => alive && setProfile(null));
    api
      .followers(userId)
      .then((e) => alive && setFollowers(e.data ?? []))
      .catch(() => alive && setFollowers([]));
    api
      .followings(userId)
      .then((e) => alive && setFollowings(e.data ?? []))
      .catch(() => alive && setFollowings([]));
    return () => {
      alive = false;
    };
  }, [userId]);

  // Bор кардани tab-ho ба талаб
  const loadPosts = useCallback(() => {
    if (posts !== null) return;
    api
      .posts({ userId, pageSize: 50 })
      .then((e) => setPosts(e.data ?? []))
      .catch(() => setPosts([]));
  }, [posts, userId]);

  const loadReels = useCallback(() => {
    if (reels !== null) return;
    api
      .userReels(userId)
      .then((e) => setReels(e.data ?? []))
      .catch(() => setReels([]));
  }, [reels, userId]);

  const loadStories = useCallback(() => {
    if (actuals !== null) return;
    api
      .userActuals(userId)
      .then((e) => setActuals(e.data ?? []))
      .catch(() => setActuals([]));
  }, [actuals, userId]);

  const loadComplaints = useCallback(() => {
    if (complaints !== null) return;
    fetchComplaints(userId)
      .then(setComplaints)
      .catch(() => setComplaints([]));
  }, [complaints, userId]);

  useEffect(() => {
    if (tab === "posts") loadPosts();
    if (tab === "reels") loadReels();
    if (tab === "stories") loadStories();
    if (tab === "complaints") loadComplaints();
  }, [tab, loadPosts, loadReels, loadStories, loadComplaints]);

  async function submitComplaint() {
    const text = newComplaint.trim();
    if (!text) return;
    setCompBusy(true);
    try {
      const list = await apiAddComplaint(userId, text);
      setComplaints(list);
      setNewComplaint("");
    } finally {
      setCompBusy(false);
    }
  }

  async function removeComplaint(id: string) {
    const list = await apiDeleteComplaint(userId, id);
    setComplaints(list);
  }

  const avatar = mediaUrl(profile?.image);

  return (
    <div
      className="fixed inset-0 z-[70] overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div className="min-h-full px-3 py-6 sm:px-6">
        <div
          className="mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border shadow-2xl"
          style={{ background: "var(--bg)", borderColor: "var(--line)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* --- Sarлавҳа (hero) --- */}
          <div className="relative">
            <div
              className="h-28 w-full"
              style={{
                background:
                  "linear-gradient(115deg, var(--accentA), var(--accentB))",
              }}
            />
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-black/20"
              style={{ background: "rgba(0,0,0,0.25)" }}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="px-5 pb-4 sm:px-7">
              <div className="-mt-12 flex items-end gap-4">
                <div
                  className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-4"
                  style={{ borderColor: "var(--bg)", background: "var(--panel)" }}
                >
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatar}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-[var(--muted)]">
                      {(profile?.userName ?? userName).slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-xl font-bold text-[var(--fg)]">
                      {profile?.fullName || userName}
                    </h2>
                    {ban && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold"
                        style={{
                          background: "var(--dangerSoft)",
                          color: "var(--danger)",
                        }}
                      >
                        <ShieldBan className="h-3 w-3" />
                        БАН · {banRemaining(ban.until)}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm text-[var(--muted)]">
                    @{profile?.userName ?? userName}
                  </p>
                </div>
              </div>

              {/* --- Amalho --- */}
              <div className="mt-4 flex flex-wrap gap-2">
                {ban ? (
                  <button
                    onClick={() => onUnban()}
                    className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-[var(--fg)] transition hover:bg-[var(--panel)]"
                    style={{ borderColor: "var(--lineStrong)" }}
                  >
                    <ShieldBan className="h-4 w-4" /> Унбан кардан
                  </button>
                ) : (
                  <button
                    onClick={() => setBanOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
                    style={{ background: "var(--danger)" }}
                  >
                    <ShieldBan className="h-4 w-4" /> Бан
                  </button>
                )}

                {confirmDel ? (
                  <span className="inline-flex items-center gap-2">
                    <button
                      onClick={async () => {
                        setDelBusy(true);
                        try {
                          await onDelete();
                        } finally {
                          setDelBusy(false);
                        }
                      }}
                      disabled={delBusy}
                      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                      style={{ background: "var(--danger)" }}
                    >
                      {delBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Дар ҳақиқат нест кунам?
                    </button>
                    <button
                      onClick={() => setConfirmDel(false)}
                      className="rounded-full border px-3 py-2 text-sm font-semibold text-[var(--fg)]"
                      style={{ borderColor: "var(--lineStrong)" }}
                    >
                      Не
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirmDel(true)}
                    className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition hover:bg-[var(--dangerSoft)]"
                    style={{
                      borderColor: "var(--lineStrong)",
                      color: "var(--danger)",
                    }}
                  >
                    <Trash2 className="h-4 w-4" /> Нест кардан
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* --- Tabho --- */}
          <div
            className="sticky top-0 z-10 flex gap-1 overflow-x-auto border-y px-3 py-2 backdrop-blur"
            style={{ borderColor: "var(--line)", background: "var(--glass)" }}
          >
            {TABS.map((t) => {
              const active = tab === t.key;
              const Icon = t.icon;
              const badge =
                t.key === "complaints" && complaintCount > 0
                  ? complaintCount
                  : null;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition"
                  style={{
                    background: active ? "var(--fg)" : "transparent",
                    color: active ? "var(--bg)" : "var(--muted)",
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                  {badge !== null && (
                    <span
                      className="ml-0.5 rounded-full px-1.5 text-xs font-bold"
                      style={{
                        background: active ? "var(--bg)" : "var(--danger)",
                        color: active ? "var(--danger)" : "#fff",
                      }}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* --- Мазмуни tab --- */}
          <div className="min-h-[280px] p-5 sm:p-7">
            {tab === "overview" && (
              <Overview
                profile={profile}
                followers={followers}
                followings={followings}
                ban={ban}
              />
            )}
            {tab === "posts" && <PostsGrid posts={posts} />}
            {tab === "reels" && <ReelsGrid reels={reels} />}
            {tab === "stories" && <StoriesGrid actuals={actuals} />}
            {tab === "chats" && (
              <AdminChats
                userId={userId}
                userName={profile?.userName ?? userName}
              />
            )}
            {tab === "complaints" && (
              <ComplaintsPanel
                complaints={complaints}
                value={newComplaint}
                onChange={setNewComplaint}
                busy={compBusy}
                onSubmit={submitComplaint}
                onRemove={removeComplaint}
              />
            )}
          </div>
        </div>
      </div>

      {banOpen && (
        <BanDialog
          userName={profile?.userName ?? userName}
          busy={banBusy}
          onCancel={() => setBanOpen(false)}
          onConfirm={async (until, reason) => {
            setBanBusy(true);
            try {
              await onBan(until, reason);
              setBanOpen(false);
            } finally {
              setBanBusy(false);
            }
          }}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------
//  Tab: Умумӣ
// ------------------------------------------------------------
function Overview({
  profile,
  followers,
  followings,
  ban,
}: {
  profile: UserProfile | null;
  followers: ProfileUser[] | null;
  followings: ProfileUser[] | null;
  ban: Ban | null;
}) {
  if (profile === null) return <Loading />;

  const stats = [
    { label: "Постҳо", value: profile.postCount },
    { label: "Обуначиён", value: profile.subscribersCount },
    { label: "Обунаҳо", value: profile.subscriptionsCount },
  ];

  const rows = [
    { icon: UserIcon, label: "Номи пурра", value: profile.fullName || "—" },
    { icon: Hash, label: "Username", value: "@" + profile.userName },
    { icon: Mail, label: "Email", value: profile.email || "—" },
    {
      icon: Users2,
      label: "Ҷинс",
      value:
        profile.gender === 0 ? "Мард" : profile.gender === 1 ? "Зан" : "—",
    },
    { icon: Hash, label: "ID", value: profile.userId },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border p-4 text-center"
            style={{ borderColor: "var(--line)", background: "var(--panel)" }}
          >
            <div className="text-2xl font-extrabold text-[var(--fg)]">
              {s.value}
            </div>
            <div className="mt-0.5 text-xs font-medium text-[var(--muted)]">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {ban && (
        <div
          className="rounded-2xl border p-4"
          style={{ borderColor: "var(--danger)", background: "var(--dangerSoft)" }}
        >
          <p className="flex items-center gap-2 text-sm font-bold text-[var(--danger)]">
            <ShieldBan className="h-4 w-4" /> Корбар бан аст ·{" "}
            {banRemaining(ban.until)}
          </p>
          {ban.reason && (
            <p className="mt-1 text-sm text-[var(--fg)]">Сабаб: {ban.reason}</p>
          )}
        </div>
      )}

      {profile.about && (
        <div
          className="rounded-2xl border p-4"
          style={{ borderColor: "var(--line)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Био
          </p>
          <p className="mt-1 text-sm text-[var(--fg)]">{profile.about}</p>
        </div>
      )}

      <div className="grid gap-2">
        {rows.map((r) => {
          const Icon = r.icon;
          return (
            <div
              key={r.label}
              className="flex items-center gap-3 rounded-xl border px-4 py-3"
              style={{ borderColor: "var(--line)" }}
            >
              <Icon className="h-4 w-4 shrink-0 text-[var(--muted)]" />
              <span className="w-28 shrink-0 text-sm font-medium text-[var(--muted)]">
                {r.label}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--fg)]">
                {r.value}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <PeopleList title="Обуначиён" people={followers} />
        <PeopleList title="Обунаҳо" people={followings} />
      </div>
    </div>
  );
}

function PeopleList({
  title,
  people,
}: {
  title: string;
  people: ProfileUser[] | null;
}) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--line)" }}>
      <p className="mb-3 text-sm font-bold text-[var(--fg)]">
        {title}{" "}
        <span className="text-[var(--muted)]">
          {people === null ? "" : `· ${people.length}`}
        </span>
      </p>
      {people === null ? (
        <Loading small />
      ) : people.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Холӣ</p>
      ) : (
        <ul className="max-h-52 space-y-2 overflow-y-auto">
          {people.map((p) => {
            const img = mediaUrl(p.image);
            return (
              <li key={p.userId} className="flex items-center gap-2.5">
                <div
                  className="h-8 w-8 overflow-hidden rounded-full"
                  style={{ background: "var(--panel)" }}
                >
                  {img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--fg)]">
                    {p.fullName || p.userName}
                  </p>
                  <p className="truncate text-xs text-[var(--muted)]">
                    @{p.userName}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ------------------------------------------------------------
//  Tab: Постҳо
// ------------------------------------------------------------
function PostsGrid({ posts }: { posts: Post[] | null }) {
  if (posts === null) return <Loading />;
  if (posts.length === 0) return <Empty text="Ягон пост нест" />;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {posts.map((p) => {
        const first = p.images?.[0]?.imageName;
        const url = mediaUrl(first);
        return (
          <div
            key={p.postId}
            className="group relative aspect-square overflow-hidden rounded-xl"
            style={{ background: "var(--panel)" }}
          >
            {url ? (
              isVideo(first) ? (
                <video src={url} className="h-full w-full object-cover" muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" className="h-full w-full object-cover" />
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center p-3 text-center text-xs text-[var(--muted)]">
                {p.content || p.title || "—"}
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 flex gap-3 bg-gradient-to-t from-black/70 to-transparent p-2 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" /> {p.postLikeCount}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" /> {p.commentCount}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" /> {p.postViewCount}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------
//  Tab: Reels
// ------------------------------------------------------------
function ReelsGrid({ reels }: { reels: Reel[] | null }) {
  if (reels === null) return <Loading />;
  if (reels.length === 0) return <Empty text="Ягон reel нест" />;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {reels.map((r) => {
        const cover = mediaUrl(r.coverName) ?? mediaUrl(r.videoName);
        return (
          <div
            key={r.reelsId}
            className="group relative aspect-[9/14] overflow-hidden rounded-xl"
            style={{ background: "var(--panel)" }}
          >
            {cover ? (
              isVideo(r.coverName ?? r.videoName) && !r.coverName ? (
                <video src={cover} className="h-full w-full object-cover" muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt="" className="h-full w-full object-cover" />
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[var(--muted)]">
                <Clapperboard className="h-6 w-6" />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 flex gap-3 bg-gradient-to-t from-black/70 to-transparent p-2 text-xs font-semibold text-white">
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" /> {r.reelsLikeCount}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" /> {r.reelsViewCount}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------
//  Tab: Сторис (Highlights - сторисҳои доимӣ)
// ------------------------------------------------------------
function StoriesGrid({ actuals }: { actuals: Actual[] | null }) {
  if (actuals === null) return <Loading />;
  if (actuals.length === 0)
    return (
      <Empty text="Ягон сторис нест. (Backend танҳо сторисҳои дар «actual» захирашударо нигоҳ медорад — сторисҳои муқаррарӣ пас аз 24 соат нест мешаванд.)" />
    );

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {actuals.map((a) => {
        const cover = mediaUrl(a.coverImage);
        return (
          <div key={a.actualId} className="text-center">
            <div
              className="mx-auto aspect-square w-full overflow-hidden rounded-2xl border-2"
              style={{ borderColor: "var(--accentA)", background: "var(--panel)" }}
            >
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[var(--muted)]">
                  <CircleDot className="h-6 w-6" />
                </div>
              )}
            </div>
            <p className="mt-1.5 truncate text-xs font-semibold text-[var(--fg)]">
              {a.title}
            </p>
            <p className="text-xs text-[var(--muted)]">{a.storyCount} сторис</p>
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------
//  Tab: Шикоятҳо
// ------------------------------------------------------------
function ComplaintsPanel({
  complaints,
  value,
  onChange,
  busy,
  onSubmit,
  onRemove,
}: {
  complaints: Complaint[] | null;
  value: string;
  onChange: (v: string) => void;
  busy: boolean;
  onSubmit: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div
        className="flex items-end gap-2 rounded-2xl border p-3"
        style={{ borderColor: "var(--line)" }}
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          placeholder="Шикоят/қайд дар бораи ин корбар…"
          className="min-w-0 flex-1 resize-none bg-transparent text-sm text-[var(--fg)] outline-none"
        />
        <button
          onClick={onSubmit}
          disabled={busy || !value.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-40"
          style={{ background: "var(--accentA)" }}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>

      {complaints === null ? (
        <Loading />
      ) : complaints.length === 0 ? (
        <Empty text="Ягон шикоят нест" />
      ) : (
        <ul className="space-y-2">
          {complaints.map((c) => (
            <li
              key={c.id}
              className="rounded-2xl border p-4"
              style={{ borderColor: "var(--line)", background: "var(--panel)" }}
            >
              <div className="flex items-start gap-2">
                <MessageSquareWarning className="mt-0.5 h-4 w-4 shrink-0 text-[var(--danger)]" />
                <p className="min-w-0 flex-1 text-sm text-[var(--fg)]">
                  {c.text}
                </p>
                <button
                  onClick={() => onRemove(c.id)}
                  className="shrink-0 text-[var(--muted)] hover:text-[var(--danger)]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1.5 pl-6 text-xs text-[var(--muted)]">
                {c.by} · {new Date(c.createdAt).toLocaleString("ru-RU")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ------------------------------------------------------------
//  Kумакҳо
// ------------------------------------------------------------
function Loading({ small }: { small?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center ${small ? "py-6" : "py-16"}`}
    >
      <Loader2 className="h-6 w-6 animate-spin text-[var(--muted)]" />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-2xl border border-dashed px-6 py-14 text-center text-sm text-[var(--muted)]"
      style={{ borderColor: "var(--lineStrong)" }}
    >
      {text}
    </div>
  );
}
